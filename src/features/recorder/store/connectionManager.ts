import type { HttpChainRequestInfo, HttpMethod, ConnectionStatus } from '../types';

// Callbacks the store will register to receive updates
export interface ConnectionCallbacks {
    onStatusChange: (status: ConnectionStatus) => void;
    onRequest: (request: HttpChainRequestInfo) => void;
    onCaptureChange: (capturing: boolean, attachedTabCount: number) => void;
    onStateUpdate: (isCapturing: boolean, availableTabCount: number, attachedTabCount: number) => void;
}

// Raw data from extension
interface RawRequestData {
    requestId: string;
    url: string;
    method: string;
    requestHeaders: Record<string, string>;
    requestBody: string | null;
    responseStatus: number;
    responseHeaders: Record<string, string> | null;
    responseBody: string | null;
    mimeType: string | null;
    timestamp: number;
    tabId?: number;
    tabTitle?: string;
    statusText?: string;
}

interface ExtensionMessage {
    type: string;
    data?: RawRequestData;
    error?: string;
    isCapturing?: boolean;
    tabCount?: number;
    attachedTabCount?: number;
    reason?: string;
}

// Helper functions
function getHeader(headers: Record<string, string> | undefined, name: string): string | undefined {
    if (!headers) return undefined;
    const lowerName = name.toLowerCase();
    const key = Object.keys(headers).find(k => k.toLowerCase() === lowerName);
    return key ? headers[key] : undefined;
}

function parseRequestCookies(cookieHeader: string | undefined): Record<string, string> {
    if (!cookieHeader) return {};
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(pair => {
        const [key, ...vals] = pair.split('=');
        if (key) cookies[key.trim()] = vals.join('=').trim();
    });
    return cookies;
}

function parseQueryParams(url: string): Record<string, string> {
    try {
        const params: Record<string, string> = {};
        new URL(url).searchParams.forEach((v, k) => { params[k] = v; });
        return params;
    } catch { return {}; }
}

function parseRequestBody(body: string | null, contentType: string | undefined): { formData: string | null; json: unknown | null } {
    if (!body) return { formData: null, json: null };
    if (contentType?.includes('application/json')) {
        try { return { formData: null, json: JSON.parse(body) }; } catch { return { formData: null, json: null }; }
    }
    if (contentType?.includes('x-www-form-urlencoded')) {
        return { formData: body, json: null };
    }
    return { formData: null, json: null };
}

function generateSearchableText(req: HttpChainRequestInfo): string {
    const parts = [
        req.requestUrl,
        req.requestMethod,
        req.requestBody || '',
        req.responseContent || '',
        req.tabName,
        req.requestName,
        req.responseStatusText,
        req.responseMimeType,
        JSON.stringify(req.requestHeaders),
        JSON.stringify(req.responseHeaders),
        JSON.stringify(req.requestQueryParams),
        JSON.stringify(req.requestCookies),
    ];
    return parts.join(' ').toLowerCase();
}

function transformRequest(raw: RawRequestData): HttpChainRequestInfo {
    const requestHeaders = raw.requestHeaders || {};
    const responseHeaders = raw.responseHeaders || {};
    const contentType = getHeader(requestHeaders, 'content-type');
    const { formData, json } = parseRequestBody(raw.requestBody, contentType);

    const req: HttpChainRequestInfo = {
        id: crypto.randomUUID(),
        timestamp: raw.timestamp,
        tabId: raw.tabId || 0,
        tabName: raw.tabTitle || `Tab ${raw.tabId || 'Unknown'}`,
        requestName: '',
        requestUrl: raw.url,
        requestMethod: (raw.method || 'GET').toUpperCase() as HttpMethod,
        requestHeaders: requestHeaders,
        requestCookies: parseRequestCookies(getHeader(requestHeaders, 'cookie')),
        requestQueryParams: parseQueryParams(raw.url),
        requestFormData: formData,
        requestJson: json,
        requestBody: raw.requestBody,
        responseStatus: raw.responseStatus || 0,
        responseStatusText: raw.statusText || '',
        responseHeaders: responseHeaders,
        responseMimeType: raw.mimeType || '',
        responseContent: raw.responseBody,
        searchableText: '',
    };
    req.searchableText = generateSearchableText(req);
    return req;
}

class ConnectionManager {
    private port: chrome.runtime.Port | null = null;
    private pingInterval: ReturnType<typeof setInterval> | null = null;
    private callbacks: ConnectionCallbacks | null = null;

    connect(extensionId: string, callbacks: ConnectionCallbacks) {
        if (typeof chrome === 'undefined' || !chrome.runtime?.connect) {
            console.error('[HTTPChain] Chrome runtime not available');
            callbacks.onStatusChange('disconnected');
            return;
        }

        this.callbacks = callbacks;
        callbacks.onStatusChange('connecting');

        try {
            this.port = chrome.runtime.connect(extensionId, { name: 'httpchain-recorder' });

            this.port.onMessage.addListener((message: ExtensionMessage) => {
                switch (message.type) {
                    case 'CONNECTED':
                        this.callbacks?.onStatusChange('connected');
                        this.callbacks?.onStateUpdate(
                            message.isCapturing || false,
                            message.tabCount || 0,
                            message.attachedTabCount || 0
                        );
                        break;
                    case 'PONG':
                        break;
                    case 'STATE_UPDATE':
                        this.callbacks?.onStateUpdate(
                            message.isCapturing || false,
                            message.tabCount || 0,
                            message.attachedTabCount || 0
                        );
                        break;
                    case 'CAPTURE_STARTED':
                        this.callbacks?.onCaptureChange(true, message.attachedTabCount || 0);
                        break;
                    case 'CAPTURE_STOPPED':
                        this.callbacks?.onCaptureChange(false, 0);
                        break;
                    case 'REQUEST_CAPTURED':
                        if (message.data) {
                            const transformed = transformRequest(message.data);
                            this.callbacks?.onRequest(transformed);
                        }
                        break;
                    case 'ERROR':
                        console.error('[HTTPChain]', message.error);
                        break;
                }
            });

            this.port.onDisconnect.addListener(() => {
                this.port = null;
                this.callbacks?.onStatusChange('disconnected');
                this.callbacks?.onCaptureChange(false, 0);
                this.stopPing();
            });

            this.startPing();
        } catch (err) {
            console.error('[HTTPChain] Connection error:', err);
            callbacks.onStatusChange('disconnected');
        }
    }

    disconnect() {
        if (this.port) {
            this.port.disconnect();
            this.port = null;
        }
        this.stopPing();
        this.callbacks?.onStatusChange('disconnected');
    }

    send(message: object) {
        this.port?.postMessage(message);
    }

    private startPing() {
        this.pingInterval = setInterval(() => {
            this.send({ type: 'PING' });
        }, 5000);
    }

    private stopPing() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    isConnected(): boolean {
        return this.port !== null;
    }
}

// Singleton instance
export const connectionManager = new ConnectionManager();
