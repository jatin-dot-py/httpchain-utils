/**
 * HTTP Chain Recorder - Background Service Worker
 * 
 * A proactive extension that captures HTTP requests via Chrome DevTools Protocol.
 * The web app only sends START/STOP - extension handles everything else.
 */

// =============================================================================
// STATE
// =============================================================================

const connectedPorts = new Map();  // clientId -> Port
const attachedTabs = new Set();    // Set of tabIds with debugger attached
const pendingRequests = new Map(); // requestId -> partial request data
let isRecording = false;

// =============================================================================
// HELPERS
// =============================================================================

function log(...args) {
  console.log(`[HTTPChain]`, ...args);
}

/**
 * Check if MIME type indicates text content that should be captured.
 */
function shouldCaptureBody(mimeType) {
  if (!mimeType) return false;
  const base = mimeType.split(';')[0].trim().toLowerCase();
  return (
    base.startsWith('text/') ||
    base.includes('json') ||
    base.includes('xml') ||
    base.includes('javascript') ||
    base === 'application/x-www-form-urlencoded'
  );
}

/**
 * Check if a tab URL is valid for capture (excludes system pages and localhost).
 */
function isRecordableUrl(url) {
  if (!url) return false;
  if (url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return false;
  if (url.startsWith('about:') || url.startsWith('edge://')) return false;
  if (url.includes('localhost:') || url.includes('127.0.0.1:')) return false;
  return true;
}

/**
 * Get count of tabs that can be recorded.
 */
async function getRecordableTabCount() {
  const tabs = await chrome.tabs.query({});
  return tabs.filter(t => isRecordableUrl(t.url)).length;
}

/**
 * Broadcast message to all connected web app clients.
 */
function broadcast(message) {
  if (connectedPorts.size === 0) return;
  log('Broadcasting:', message.type);
  for (const [id, port] of connectedPorts) {
    try {
      port.postMessage(message);
    } catch (e) {
      connectedPorts.delete(id);
    }
  }
}

/**
 * Broadcast current state to all clients.
 */
async function broadcastState() {
  const tabCount = await getRecordableTabCount();
  log(`State update: ${tabCount} available tabs, ${attachedTabs.size} attached, recording=${isRecording}`);
  broadcast({
    type: 'STATE_UPDATE',
    isCapturing: isRecording,
    tabCount,
    attachedTabCount: attachedTabs.size
  });
}

// =============================================================================
// DEBUGGER MANAGEMENT
// =============================================================================

/**
 * Attach debugger to a single tab.
 */
async function attachToTab(tabId) {
  if (attachedTabs.has(tabId)) return true;
  try {
    await chrome.debugger.attach({ tabId }, '1.3');
    await chrome.debugger.sendCommand({ tabId }, 'Network.enable', { maxPostDataSize: 65536 });
    attachedTabs.add(tabId);
    log(`✓ Attached to tab ${tabId}`);
    return true;
  } catch (e) {
    log(`✗ Failed to attach to tab ${tabId}:`, e.message);
    return false;
  }
}

/**
 * Attach debugger to all recordable tabs.
 */
async function attachToAllTabs() {
  const tabs = await chrome.tabs.query({});
  let count = 0;
  for (const tab of tabs) {
    if (tab.id && isRecordableUrl(tab.url)) {
      if (await attachToTab(tab.id)) count++;
    }
  }
  return count;
}

/**
 * Detach debugger from all tabs and cleanup.
 */
async function detachAll() {
  log(`Detaching from ${attachedTabs.size} tabs...`);
  for (const tabId of attachedTabs) {
    try {
      await chrome.debugger.detach({ tabId });
    } catch (e) { }
  }
  attachedTabs.clear();
  pendingRequests.clear();
}

// =============================================================================
// CDP EVENT HANDLING
// =============================================================================

chrome.debugger.onEvent.addListener((source, method, params) => {
  if (!isRecording || !attachedTabs.has(source.tabId)) return;

  const tabId = source.tabId;
  const requestId = params.requestId;

  switch (method) {
    case 'Network.requestWillBeSent': {
      const existing = pendingRequests.get(requestId) || {};
      pendingRequests.set(requestId, {
        ...existing,
        requestId,
        url: params.request.url,
        method: params.request.method,
        requestHeaders: { ...(existing.requestHeaders || {}), ...(params.request.headers || {}) },
        requestBody: params.request.postData || existing.requestBody || null,
        timestamp: Date.now(),
        tabId
      });
      break;
    }

    case 'Network.requestWillBeSentExtraInfo': {
      const existing = pendingRequests.get(requestId) || {};
      pendingRequests.set(requestId, {
        ...existing,
        requestHeaders: { ...(existing.requestHeaders || {}), ...(params.headers || {}) }
      });
      break;
    }

    case 'Network.responseReceived': {
      const existing = pendingRequests.get(requestId) || {};
      pendingRequests.set(requestId, {
        ...existing,
        responseStatus: params.response.status,
        statusText: params.response.statusText,
        responseHeaders: { ...(existing.responseHeaders || {}), ...(params.response.headers || {}) },
        mimeType: params.response.mimeType
      });
      break;
    }

    case 'Network.responseReceivedExtraInfo': {
      const existing = pendingRequests.get(requestId) || {};
      pendingRequests.set(requestId, {
        ...existing,
        responseHeaders: { ...(existing.responseHeaders || {}), ...(params.headers || {}) }
      });
      break;
    }

    case 'Network.loadingFinished': {
      const req = pendingRequests.get(requestId);
      if (!req) return;

      (async () => {
        try {
          if (shouldCaptureBody(req.mimeType)) {
            const res = await chrome.debugger.sendCommand(
              { tabId },
              'Network.getResponseBody',
              { requestId }
            );
            req.responseBody = res.base64Encoded ? atob(res.body) : res.body;
          }
        } catch (e) { }

        broadcast({ type: 'REQUEST_CAPTURED', data: req });
        pendingRequests.delete(requestId);
      })();
      break;
    }

    case 'Network.loadingFailed': {
      pendingRequests.delete(requestId);
      break;
    }
  }
});

// =============================================================================
// TAB LIFECYCLE - PROACTIVE BEHAVIOR
// =============================================================================

// Auto-attach to new tabs when recording
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // When a tab finishes loading and we're recording, auto-attach
  if (isRecording && changeInfo.status === 'complete' && isRecordableUrl(tab.url)) {
    if (!attachedTabs.has(tabId)) {
      log(`New tab detected: ${tab.url?.slice(0, 50)}...`);
      await attachToTab(tabId);
      broadcastState();
    }
  }

  // Always broadcast on URL changes so client knows available tabs
  if (changeInfo.url !== undefined) {
    broadcastState();
  }
});

// Broadcast state when tabs are created
chrome.tabs.onCreated.addListener((tab) => {
  log(`Tab created: ${tab.id}`);
  broadcastState();
});

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  log(`Tab closed: ${tabId}`);
  attachedTabs.delete(tabId);
  broadcastState();

  // If all attached tabs are gone while recording, stop
  if (attachedTabs.size === 0 && isRecording) {
    isRecording = false;
    log('Recording stopped - all tabs closed');
    broadcast({ type: 'CAPTURE_STOPPED', reason: 'All tabs closed' });
  }
});

// Handle debugger detach (user manually closed debugger bar)
chrome.debugger.onDetach.addListener((source, reason) => {
  log(`Debugger detached from tab ${source.tabId}: ${reason}`);
  attachedTabs.delete(source.tabId);
  broadcastState();

  if (attachedTabs.size === 0 && isRecording) {
    isRecording = false;
    broadcast({ type: 'CAPTURE_STOPPED', reason: 'All debuggers closed' });
  }
});

// =============================================================================
// EXTERNAL CONNECTION (WEB APP)
// =============================================================================

chrome.runtime.onConnectExternal.addListener((port) => {
  const portId = `${port.name}-${Date.now()}`;
  log(`Client connected: ${portId}`);
  connectedPorts.set(portId, port);

  // Immediately send current state
  (async () => {
    const tabCount = await getRecordableTabCount();
    log(`Sending initial state: ${tabCount} tabs available`);
    port.postMessage({
      type: 'CONNECTED',
      isCapturing: isRecording,
      tabCount,
      attachedTabCount: attachedTabs.size
    });
  })();

  port.onMessage.addListener(async (msg) => {
    switch (msg.type) {
      case 'PING':
        // Silent - no log spam
        port.postMessage({ type: 'PONG' });
        break;

      case 'START_CAPTURE': {
        if (isRecording) {
          port.postMessage({ type: 'ERROR', error: 'Already capturing' });
          return;
        }
        log('Starting capture...');
        const count = await attachToAllTabs();
        if (count === 0) {
          log('No tabs to capture');
          port.postMessage({ type: 'ERROR', error: 'No tabs to capture' });
          return;
        }
        isRecording = true;
        log(`✓ Capture started on ${count} tabs`);
        broadcast({
          type: 'CAPTURE_STARTED',
          isCapturing: true,
          tabCount: await getRecordableTabCount(),
          attachedTabCount: count
        });
        break;
      }

      case 'STOP_CAPTURE': {
        if (!isRecording) {
          port.postMessage({ type: 'ERROR', error: 'Not capturing' });
          return;
        }
        isRecording = false;
        await detachAll();
        log('✓ Capture stopped');
        broadcast({
          type: 'CAPTURE_STOPPED',
          isCapturing: false,
          reason: 'Stopped by user'
        });
        break;
      }
    }
  });

  port.onDisconnect.addListener(() => {
    log(`Client disconnected: ${portId}`);
    connectedPorts.delete(portId);

    // If all clients disconnect while recording, stop
    if (connectedPorts.size === 0 && isRecording) {
      isRecording = false;
      detachAll();
      log('Recording stopped - no clients connected');
    }
  });
});

log('✓ Service worker initialized');
