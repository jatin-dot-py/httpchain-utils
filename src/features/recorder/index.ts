// =============================================================================
// HTTPChain Web Recorder - Package Exports
// =============================================================================

// Main Component
export { RecorderLayout as HttpChainWebRecorder } from './components/layout/RecorderLayout';

// Hooks
import { useRecorderStore } from './store/recorderStore';

/**
 * Hook for external consumers to subscribe to bookmarked/saved requests.
 * Returns an array of saved HttpChainRequestInfo objects.
 */
export function useBookmarkedRequests() {
    const savedRequests = useRecorderStore((s) => s.savedRequests);
    return Object.values(savedRequests);
}

// Types
export type {
    HttpChainRequestInfo,
    HttpChainWebRecorderProps,
    HttpMethod,
} from './types';
