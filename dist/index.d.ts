import { JSX } from 'react/jsx-runtime';

export declare interface HttpChainRequestInfo {
    id: string;
    timestamp: number;
    tabId: number;
    tabName: string;
    requestName: string;
    requestUrl: string;
    requestMethod: HttpMethod;
    requestHeaders: Record<string, string>;
    requestCookies: Record<string, string>;
    requestQueryParams: Record<string, string>;
    requestFormData: string | null;
    requestJson: unknown | null;
    requestBody: string | null;
    responseStatus: number;
    responseStatusText: string;
    responseHeaders: Record<string, string>;
    responseMimeType: string;
    responseContent: string | null;
    searchableText: string;
}

export declare function HttpChainWebRecorder({ extensionId, maxRequestsWarningThreshold, maxTabsWarningThreshold, strictRequestsLimit, className, }: HttpChainWebRecorderProps): JSX.Element;

export declare interface HttpChainWebRecorderProps {
    extensionId: string;
    maxRequestsWarningThreshold?: number;
    maxTabsWarningThreshold?: number;
    strictRequestsLimit?: boolean;
    className?: string;
}

export declare type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'CONNECT' | 'TRACE';

/**
 * Hook for external consumers to subscribe to bookmarked/saved requests.
 * Returns an array of saved HttpChainRequestInfo objects.
 */
export declare function useBookmarkedRequests(): HttpChainRequestInfo[];

export { }
