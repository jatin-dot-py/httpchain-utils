import { Unplug, Play, ExternalLink, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecorderStore } from '@/features/recorder/store/recorderStore';

interface EmptyStateProps {
    extensionId: string;
}

/**
 * Empty state shown when there are no captured requests.
 * - If capturing: Shows "Waiting for requests..."
 * - If disconnected: Shows "Install Extension" link
 * - If connected: Shows "Start Capture" button (disabled if no tabs)
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
            <div className="flex flex-col items-center gap-4 text-center max-w-xs">
                <div className="p-4 rounded-full bg-muted">
                    {isCapturing ? (
                        <Radio className="h-8 w-8 text-destructive animate-pulse" />
                    ) : (
                        <Unplug className="h-8 w-8 text-muted-foreground" />
                    )}
                </div>

                {isCapturing ? (
                    <>
                        <p className="text-sm text-muted-foreground">
                            Waiting for requests...
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                            Navigate to a page in one of the captured tabs
                        </p>
                    </>
                ) : isConnecting ? (
                    <>
                        <p className="text-sm text-muted-foreground">
                            Connecting to extension...
                        </p>
                    </>
                ) : isConnected ? (
                    <>
                        <p className="text-sm text-muted-foreground">
                            {hasActiveTabs
                                ? `${availableTabCount} tab${availableTabCount !== 1 ? 's' : ''} available`
                                : 'No active tabs detected'
                            }
                        </p>
                        <Button
                            onClick={startCapture}
                            className="gap-2"
                            disabled={!hasActiveTabs}
                        >
                            <Play className="h-4 w-4" />
                            Start Capture
                        </Button>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground">
                            Extension not connected
                        </p>
                        <Button variant="outline" onClick={handleInstallExtension} className="gap-2">
                            <ExternalLink className="h-4 w-4" />
                            Install Extension
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}
