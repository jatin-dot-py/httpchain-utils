export type HttpMethod =
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'DELETE'
    | 'PATCH'
    | 'HEAD'
    | 'OPTIONS'
    | 'CONNECT'
    | 'TRACE';

export interface HttpChainRequestInfo {
    // Identity & Meta
    id: string;                     // UUID (crypto.randomUUID())
    timestamp: number;
    tabId: number;                  // Chrome tab ID (kept for reference)
    tabName: string;                // Tab title for display
    requestName: string;            // User-defined name for bookmarked requests

    // Request Data
    requestUrl: string;
    requestMethod: HttpMethod;
    requestHeaders: Record<string, string>;
    requestCookies: Record<string, string>;
    requestQueryParams: Record<string, string>;
    requestFormData: string | null; // Only if x-www-form-urlencoded
    requestJson: unknown | null;    // Only if application/json (parsed)
    requestBody: string | null;     // Always the raw body string

    // Response Data
    responseStatus: number;
    responseStatusText: string;
    responseHeaders: Record<string, string>;
    responseMimeType: string;
    responseContent: string | null;

    // Derived (for search)
    searchableText: string;
}

export interface HttpChainWebRecorderProps {
    extensionId: string;
    maxRequestsWarningThreshold?: number;  // Default: 1000
    maxTabsWarningThreshold?: number;      // Default: 10
    strictRequestsLimit?: boolean;         // If true, user MUST clear to proceed. Default: false
    className?: string;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface RecorderState {
    // Data (Record for O(1) lookup)
    requests: Record<string, HttpChainRequestInfo>;
    savedRequests: Record<string, HttpChainRequestInfo>;

    // UI State
    selectedRequestId: string | null;
    searchQuery: string;

    // Connection State
    connectionStatus: ConnectionStatus;
    isCapturing: boolean;
    attachedTabCount: number;      // Tabs with debugger attached (during capture)
    availableTabCount: number;     // Recordable tabs (from extension)

    // Warning Configuration
    maxTabsWarningThreshold: number;
    maxRequestsWarningThreshold: number;
    strictRequestsLimit: boolean;

    // Warning Tracking (show only once per session)
    hasSeenTabsWarning: boolean;
    hasSeenRequestsWarning: boolean;
}

export interface SearchResult {
    request: HttpChainRequestInfo;
    matchedField: string;
    matchedText: string;
    highlightText: string;
}
