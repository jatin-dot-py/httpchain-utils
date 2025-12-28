import { Error as ErrorState, NoContent as NoContentState, Loading as LoadingState } from 'spectra/state'
import { Unplug, Play, Radio } from 'lucide-react';
import { useRecorderStore } from '@/features/recorder/store/recorderStore';

interface EmptyStateProps {
    extensionId: string;
}

/**
 * Empty state shown when there are no captured requests.
 * - If capturing: Shows "Waiting for requests..." (LoadingState)
 * - If connecting: Shows "Connecting to extension..." (LoadingState)
 * - If disconnected: Shows "Install Extension" link (ErrorState)
 * - If connected: Shows "Start Capture" button (NoContentState)
 */
export function EmptyState({ extensionId }: EmptyStateProps) {
    const connectionStatus = useRecorderStore((s) => s.connectionStatus);
    const startCapture = useRecorderStore((s) => s.startCapture);
    const requestCount = useRecorderStore((s) => Object.keys(s.requests).length);
    const availableTabCount = useRecorderStore((s) => s.availableTabCount);
    const isCapturing = useRecorderStore((s) => s.isCapturing);

    // Don't show empty state if there are any requests
    if (requestCount > 0) {
        return null;
    }

    const isConnected = connectionStatus === 'connected';
    const isConnecting = connectionStatus === 'connecting';
    const hasActiveTabs = availableTabCount > 0;

    const handleInstallExtension = () => {
        window.open(`chrome://extensions/?id=${extensionId}`, '_blank');
    };

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 z-10">
            {isCapturing ? (
                // Capturing state - waiting for requests
                <LoadingState
                    title="Waiting for requests..."
                    size="lg"
                />
            ) : isConnecting ? (
                // Connecting state
                <LoadingState
                    title="Connecting to extension..."
                    size="lg"
                />
            ) : isConnected ? (
                // Connected but not capturing - prompt to start
                <NoContentState
                    icon={hasActiveTabs ? Play : Radio}
                    title={hasActiveTabs
                        ? `${availableTabCount} tab${availableTabCount !== 1 ? 's' : ''} available`
                        : 'No active tabs detected'
                    }
                    actionLabel="Start Capture"
                    onAction={startCapture}
                    size="lg"
                />
            ) : (
                // Disconnected - show error state
                <ErrorState
                    icon={Unplug}
                    title="Extension not connected"
                    actionLabel="Install Extension"
                    onAction={handleInstallExtension}
                    size="lg"
                />
            )}
        </div>
    );
}
