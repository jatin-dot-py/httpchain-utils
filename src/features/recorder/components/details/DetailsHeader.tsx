import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, Globe, Bookmark, BookmarkCheck } from 'lucide-react';
import { useRecorderStore } from '@/features/recorder/store/recorderStore';

function parseUrl(url: string): { protocol: string; host: string; path: string; isDataUrl: boolean } {
    // Handle data: URLs specially
    if (url.startsWith('data:')) {
        const mimeEnd = url.indexOf(',');
        const mimeType = mimeEnd > 0 ? url.slice(5, Math.min(mimeEnd, 50)) : 'unknown';
        return {
            protocol: 'data:',
            host: mimeType + (mimeEnd > 50 ? '...' : ''),
            path: `[${((url.length - mimeEnd) / 1024).toFixed(1)} KB payload]`,
            isDataUrl: true,
        };
    }

    try {
        const parsed = new URL(url);
        return {
            protocol: parsed.protocol,
            host: parsed.host,
            path: parsed.pathname + parsed.search + parsed.hash,
            isDataUrl: false,
        };
    } catch {
        return { protocol: '', host: '', path: url, isDataUrl: false };
    }
}

export function DetailsHeader() {
    const selectedRequestId = useRecorderStore((s) => s.selectedRequestId);
    const requests = useRecorderStore((s) => s.requests);
    const savedRequests = useRecorderStore((s) => s.savedRequests);
    const saveRequest = useRecorderStore((s) => s.saveRequest);
    const unsaveRequest = useRecorderStore((s) => s.unsaveRequest);
    const request = selectedRequestId ? (requests[selectedRequestId] ?? savedRequests[selectedRequestId] ?? null) : null;
    const [copied, setCopied] = useState(false);

    const isSaved = selectedRequestId ? selectedRequestId in savedRequests : false;

    if (!request) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground">
            </div>
        );
    }

    const isSuccess = request.responseStatus >= 200 && request.responseStatus < 300;
    const isError = request.responseStatus >= 400;
    const urlParts = parseUrl(request.requestUrl);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(request.requestUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleToggleSave = () => {
        if (!selectedRequestId) return;
        if (isSaved) {
            unsaveRequest(selectedRequestId);
        } else {
            // Use the URL path as a default name
            const defaultName = urlParts.path.split('/').pop() || 'Request';
            saveRequest(selectedRequestId, defaultName);
        }
    };

    return (
        <div className="h-full flex flex-col p-4 overflow-hidden">
            {/* Top row: Method, Status, MIME, and Save button */}
            <div className="flex items-center gap-2 mb-3">
                <Badge
                    variant="secondary"
                    className="font-mono font-bold text-sm px-2.5 py-0.5"
                >
                    {request.requestMethod}
                </Badge>
                <Badge
                    variant={isError ? 'destructive' : isSuccess ? 'default' : 'secondary'}
                    className="font-mono text-sm px-2.5 py-0.5"
                >
                    {request.responseStatus} {request.responseStatusText}
                </Badge>
                {request.responseMimeType && (
                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                        {request.responseMimeType}
                    </Badge>
                )}

                {/* Spacer to push save button to the right */}
                <div className="flex-1" />

                {/* Save/Bookmark button */}
                <Button
                    size="sm"
                    variant={isSaved ? 'default' : 'outline'}
                    onClick={handleToggleSave}
                    className="shrink-0 gap-1.5"
                    title={isSaved ? 'Remove from saved' : 'Save request'}
                >
                    {isSaved ? (
                        <>
                            <BookmarkCheck className="h-4 w-4" />
                            <span className="hidden sm:inline">Saved</span>
                        </>
                    ) : (
                        <>
                            <Bookmark className="h-4 w-4" />
                            <span className="hidden sm:inline">Save</span>
                        </>
                    )}
                </Button>
            </div>

            {/* URL display with icon and copy button inline */}
            <div className="flex items-center gap-2 min-w-0">
                <Globe className="h-4 w-4 shrink-0 text-primary" />
                <p className="font-mono text-sm text-foreground/80 truncate flex-1" title={request.requestUrl}>
                    {urlParts.isDataUrl ? (
                        <>
                            <span className="text-muted-foreground">{urlParts.protocol}</span>
                            <span>{urlParts.host}</span>
                            <span className="text-muted-foreground ml-1">{urlParts.path}</span>
                        </>
                    ) : (
                        <>
                            <span className="text-muted-foreground">{urlParts.protocol}//</span>
                            <span className="font-medium">{urlParts.host}</span>
                            <span className="text-foreground/60">{urlParts.path}</span>
                        </>
                    )}
                </p>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopy}
                    className="shrink-0 h-7 w-7 p-0"
                    title="Copy URL"
                >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
            </div>
        </div>
    );
}
