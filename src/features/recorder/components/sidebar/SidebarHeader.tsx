import { useMemo } from 'react';
import { Search, Trash2, Play, Square } from 'lucide-react';
import { Input } from '@/components/ui/input';
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
        <div className="h-full p-3 space-y-3 bg-background overflow-hidden">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-8"
                />
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>
                        {searchQuery ? `${searchResults.length} of ${requests.length}` : requests.length} requests
                    </span>
                    {isCapturing && (
                        <span className="flex items-center gap-1 text-destructive">
                            <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                            Live
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearRequests}
                        disabled={requests.length === 0}
                        className="h-8 w-8 p-0"
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
                            className="h-8 w-8 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                            title="Start capture"
                        >
                            <Play className="h-4 w-4 fill-current" />
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={stopCapture}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Stop capture"
                        >
                            <Square className="h-4 w-4 fill-current" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
