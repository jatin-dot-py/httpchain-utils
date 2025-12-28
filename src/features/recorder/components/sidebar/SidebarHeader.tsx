import { useMemo } from 'react';
import { Trash2, Play, Square } from 'lucide-react';
import { TextInput } from 'spectra/input-primitives';
import { Button } from '@/components/ui/button';
import { useRecorderStore } from '@/features/recorder/store/recorderStore';
import { useSearch } from '@/features/recorder/hooks/useSearch';

export function SidebarHeader() {
    const searchQuery = useRecorderStore((s) => s.searchQuery);
    const setSearchQuery = useRecorderStore((s) => s.setSearchQuery);
    const clearRequests = useRecorderStore((s) => s.clearRequests);
    const startCapture = useRecorderStore((s) => s.startCapture);
    const stopCapture = useRecorderStore((s) => s.stopCapture);
    const isCapturing = useRecorderStore((s) => s.isCapturing);
    const connectionStatus = useRecorderStore((s) => s.connectionStatus);
    const requestsRecord = useRecorderStore((s) => s.requests);
    const requests = useMemo(() => Object.values(requestsRecord), [requestsRecord]);
    const searchResults = useSearch(requests, searchQuery);

    const isConnected = connectionStatus === 'connected';

    return (
        <div className="p-2 bg-background">
            <div className="flex items-center gap-1">
                <div className="flex-1">
                    <TextInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder={searchQuery
                            ? `${searchResults.length} of ${requests.length} requests...`
                            : `Search ${requests.length} requests...`}
                    />
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearRequests}
                    disabled={requests.length === 0}
                    className="h-8 w-8 p-0 shrink-0"
                    title="Clear all requests"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
                {!isCapturing ? (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={startCapture}
                        disabled={!isConnected}
                        className="h-8 w-8 p-0 shrink-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                        title="Start capture"
                    >
                        <Play className="h-4 w-4 fill-current" />
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={stopCapture}
                        className="h-8 w-8 p-0 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Stop capture"
                    >
                        <Square className="h-4 w-4 fill-current" />
                    </Button>
                )}
            </div>
        </div>
    );
}
