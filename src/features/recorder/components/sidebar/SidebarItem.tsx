import { Bookmark } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SearchResult } from '@/features/recorder/types';

interface SidebarItemProps {
    result: SearchResult;
    isSelected: boolean;
    isSaved: boolean;
    onSelect: () => void;
    style?: React.CSSProperties;
}

function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
    if (!highlight || !text) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase() ? (
                    <mark key={i} className="bg-primary/30 text-primary rounded-sm px-0.5">{part}</mark>
                ) : part
            )}
        </span>
    );
}

function truncateUrl(url: string | undefined | null, maxLen = 60): string {
    if (!url) return '';
    try {
        const parsed = new URL(url);
        const path = parsed.pathname + parsed.search;
        if (path.length <= maxLen) return path;
        return path.slice(0, maxLen) + '...';
    } catch {
        if (url.length <= maxLen) return url;
        return url.slice(0, maxLen) + '...';
    }
}

function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export function SidebarItem({ result, isSelected, isSaved, onSelect, style }: SidebarItemProps) {
    const { request, matchedText, highlightText } = result;
    const isSuccess = request.responseStatus >= 200 && request.responseStatus < 300;
    const isError = request.responseStatus >= 400;

    return (
        <div
            style={style}
            onClick={onSelect}
            className={`group cursor-pointer border-b px-4 py-3 transition-colors hover:bg-muted/50 overflow-hidden ${isSelected ? 'bg-muted border-l-2 border-l-primary' : ''
                }`}
        >
            {/* Row 1: Method, Status, Time */}
            <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="secondary" className="shrink-0 font-mono text-[11px] font-bold px-2 py-0.5">
                    {request.requestMethod}
                </Badge>
                <Badge
                    variant="outline"
                    className={`shrink-0 text-[11px] font-medium px-2 py-0.5 ${isError ? 'border-destructive text-destructive' :
                        isSuccess ? 'border-primary text-primary' :
                            'border-muted-foreground/50'
                        }`}
                >
                    {request.responseStatus || '...'}
                </Badge>

                {isSaved && (
                    <Bookmark className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />
                )}

                <span className="ml-auto font-mono text-[11px] text-muted-foreground shrink-0">
                    {formatTime(request.timestamp)}
                </span>
            </div>

            {/* Row 2: URL (truncated) */}
            <p className="font-mono text-[13px] text-foreground/90 truncate font-medium mb-1" title={request.requestUrl}>
                {truncateUrl(request.requestUrl)}
            </p>

            {/* Row 3: Match context if searching */}
            {matchedText && (
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 break-all leading-tight">
                    <HighlightedText text={matchedText} highlight={highlightText} />
                </p>
            )}
        </div>
    );
}
