import { useMemo } from 'react';
import type { HttpChainRequestInfo, SearchResult } from '@/features/recorder/types';

const CONTEXT_SIZE = 25;

function getMatchContext(text: string, query: string): { matchedText: string; highlightText: string } | null {
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return null;

    // Center the match within the context window
    const start = Math.max(0, index - CONTEXT_SIZE);
    // Include the query length in the end calculation
    const end = Math.min(text.length, index + query.length + CONTEXT_SIZE);

    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';

    return {
        matchedText: `${prefix}${text.slice(start, end)}${suffix}`,
        highlightText: text.slice(index, index + query.length),
    };
}

// Simple full-text search without FlexSearch for now (type issues)
export function useSearch(requests: HttpChainRequestInfo[], query: string): SearchResult[] {
    return useMemo(() => {
        if (!query.trim()) {
            return requests.map(r => ({
                request: r,
                matchedField: '',
                matchedText: '',
                highlightText: '',
            }));
        }

        const lowerQuery = query.toLowerCase();

        return requests
            .filter(r => r.searchableText?.includes(lowerQuery))
            .map(r => {
                let context = getMatchContext(r.requestUrl, query);
                let field = 'URL';

                if (!context && r.responseContent) {
                    context = getMatchContext(r.responseContent, query);
                    field = 'Response';
                }
                if (!context && r.requestBody) {
                    context = getMatchContext(r.requestBody, query);
                    field = 'Request Body';
                }
                if (!context) {
                    const headersStr = JSON.stringify(r.requestHeaders);
                    context = getMatchContext(headersStr, query);
                    field = 'Headers';
                }

                return {
                    request: r,
                    matchedField: field,
                    matchedText: context?.matchedText || '',
                    highlightText: context?.highlightText || query,
                };
            });
    }, [requests, query]);
}
