import { create } from 'zustand';
import { connectionManager, type ConnectionCallbacks } from './connectionManager';
import type { HttpChainRequestInfo, RecorderState, ConnectionStatus } from '../types';

interface RecorderActions {
    // Connection
    connect: (extensionId: string) => void;
    disconnect: () => void;
    startCapture: () => void;
    stopCapture: () => void;

    // Requests
    addRequest: (request: HttpChainRequestInfo) => void;
    clearRequests: () => void;

    // Bookmarks
    saveRequest: (id: string, name: string) => void;
    unsaveRequest: (id: string) => void;

    // UI
    setSelectedRequestId: (id: string | null) => void;
    setSearchQuery: (query: string) => void;

    // Internal
    setConnectionStatus: (status: ConnectionStatus) => void;
    setCapturing: (capturing: boolean, attachedTabCount: number) => void;
    setExtensionState: (isCapturing: boolean, availableTabCount: number, attachedTabCount: number) => void;

    // Warning Configuration
    setWarningConfig: (config: {
        maxTabs?: number;
        maxRequests?: number;
        strict?: boolean;
    }) => void;
    dismissTabsWarning: () => void;
    dismissRequestsWarning: () => void;
}

type RecorderStore = RecorderState & RecorderActions;

const initialState: RecorderState = {
    requests: {},
    savedRequests: {},
    selectedRequestId: null,
    searchQuery: '',
    connectionStatus: 'disconnected',
    isCapturing: false,
    attachedTabCount: 0,
    availableTabCount: 0,
    // Warning Configuration
    maxTabsWarningThreshold: 10,
    maxRequestsWarningThreshold: 1000,
    strictRequestsLimit: false,
    // Warning Tracking
    hasSeenTabsWarning: false,
    hasSeenRequestsWarning: false,
};

export const useRecorderStore = create<RecorderStore>((set, get) => ({
    ...initialState,

    // Connection actions
    connect: (extensionId: string) => {
        const callbacks: ConnectionCallbacks = {
            onStatusChange: (status) => get().setConnectionStatus(status),
            onRequest: (request) => get().addRequest(request),
            onCaptureChange: (capturing, tabCount) => get().setCapturing(capturing, tabCount),
            onStateUpdate: (isCapturing, availableTabCount, attachedTabCount) =>
                get().setExtensionState(isCapturing, availableTabCount, attachedTabCount),
        };
        connectionManager.connect(extensionId, callbacks);
    },

    disconnect: () => {
        connectionManager.disconnect();
    },

    startCapture: () => {
        connectionManager.send({ type: 'START_CAPTURE' });
    },

    stopCapture: () => {
        connectionManager.send({ type: 'STOP_CAPTURE' });
    },

    // Request actions
    addRequest: (request: HttpChainRequestInfo) => {
        set((state) => ({
            requests: { ...state.requests, [request.id]: request },
        }));
    },

    clearRequests: () => {
        set({
            requests: {},
            selectedRequestId: null,
            hasSeenRequestsWarning: false, // Reset so warning can show again later
        });
    },

    // Bookmark actions
    saveRequest: (id: string, name: string) => {
        set((state) => {
            const req = state.requests[id];
            if (!req) return state;
            return {
                savedRequests: {
                    ...state.savedRequests,
                    [id]: { ...req, requestName: name },
                },
            };
        });
    },

    unsaveRequest: (id: string) => {
        set((state) => {
            const { [id]: _, ...rest } = state.savedRequests;
            return { savedRequests: rest };
        });
    },

    // UI actions
    setSelectedRequestId: (id: string | null) => {
        set({ selectedRequestId: id });
    },

    setSearchQuery: (query: string) => {
        set({ searchQuery: query });
    },

    // Internal actions
    setConnectionStatus: (status: ConnectionStatus) => {
        set({ connectionStatus: status });
    },

    setCapturing: (capturing: boolean, tabCount: number) => {
        set({ isCapturing: capturing, attachedTabCount: tabCount });
    },

    setExtensionState: (isCapturing: boolean, availableTabCount: number, attachedTabCount: number) => {
        set({ isCapturing, availableTabCount, attachedTabCount });
    },

    // Warning Configuration
    setWarningConfig: (config) => {
        set({
            ...(config.maxTabs !== undefined && { maxTabsWarningThreshold: config.maxTabs }),
            ...(config.maxRequests !== undefined && { maxRequestsWarningThreshold: config.maxRequests }),
            ...(config.strict !== undefined && { strictRequestsLimit: config.strict }),
        });
    },

    dismissTabsWarning: () => {
        set({ hasSeenTabsWarning: true });
    },

    dismissRequestsWarning: () => {
        set({ hasSeenRequestsWarning: true });
    },
}));
