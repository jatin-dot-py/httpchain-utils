import { useRecorderStore } from '@/features/recorder/store/recorderStore';

export function ConnectionIndicator() {
    const connectionStatus = useRecorderStore((s) => s.connectionStatus);

    const isConnected = connectionStatus === 'connected';
    const isConnecting = connectionStatus === 'connecting';

    return (
        <div className="absolute bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-lg">
            <span
                className={`h-2 w-2 rounded-full ${isConnected
                    ? 'bg-primary'
                    : isConnecting
                        ? 'bg-muted-foreground animate-pulse'
                        : 'bg-destructive'
                    }`}
            />
            <span className="text-xs text-muted-foreground">
                {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
            </span>
        </div>
    );
}
