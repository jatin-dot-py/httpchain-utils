import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Grid } from 'react-window';
import { useRecorderStore } from '@/features/recorder/store/recorderStore';
import { useSearch } from '@/features/recorder/hooks/useSearch';
import { SidebarItem } from './SidebarItem';
import type { SearchResult } from '@/features/recorder/types';

const ITEM_HEIGHT_DEFAULT = 72;
const ITEM_HEIGHT_SEARCHING = 104;

export function SidebarList() {
    const searchQuery = useRecorderStore((s) => s.searchQuery);
    const selectedRequestId = useRecorderStore((s) => s.selectedRequestId);
    const setSelectedRequestId = useRecorderStore((s) => s.setSelectedRequestId);
    const savedRequests = useRecorderStore((s) => s.savedRequests);
    const isCapturing = useRecorderStore((s) => s.isCapturing);
    const requestsRecord = useRecorderStore((s) => s.requests);
    const requests = useMemo(() => Object.values(requestsRecord), [requestsRecord]);

    const isSearching = searchQuery.trim().length > 0;
    const itemHeight = isSearching ? ITEM_HEIGHT_SEARCHING : ITEM_HEIGHT_DEFAULT;
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 360, height: 400 });

    const searchResults = useSearch(requests, searchQuery);

    // Sort: saved requests first
    const sortedResults = useMemo(() => {
        const saved: SearchResult[] = [];
        const unsaved: SearchResult[] = [];
        searchResults.forEach(r => {
            if (r.request.id in savedRequests) saved.push(r);
            else unsaved.push(r);
        });
        return [...saved, ...unsaved];
    }, [searchResults, savedRequests]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const updateSize = () => {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setContainerSize({ width: rect.width, height: rect.height });
            }
        };

        updateSize();
        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(el);
        return () => resizeObserver.disconnect();
    }, []);

    const Cell = useCallback(({ columnIndex: _col, rowIndex, style }: {
        columnIndex: number;
        rowIndex: number;
        style: React.CSSProperties;
    }) => {
        const result = sortedResults[rowIndex];
        if (!result) return <div style={style} />;

        const isSaved = result.request.id in savedRequests;

        return (
            <SidebarItem
                result={result}
                isSelected={selectedRequestId === result.request.id}
                isSaved={isSaved}
                onSelect={() => setSelectedRequestId(result.request.id)}
                style={style}
            />
        );
    }, [sortedResults, selectedRequestId, savedRequests, setSelectedRequestId]);

    if (sortedResults.length === 0) {
        return (
            <div ref={containerRef} className="h-full w-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                <p className="text-sm font-medium">No requests</p>
                <p className="mt-1 text-xs">
                    {isCapturing ? 'Waiting for network activity...' : ''}
                </p>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="h-full w-full overflow-hidden sidebar-list-container">
            <style>{`
                .sidebar-list-container > div {
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }
                .sidebar-list-container > div::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
            <Grid
                columnCount={1}
                columnWidth={containerSize.width}
                defaultHeight={containerSize.height}
                defaultWidth={containerSize.width}
                rowCount={sortedResults.length}
                rowHeight={itemHeight}
                cellComponent={Cell}
                cellProps={{} as any}
                style={{
                    height: containerSize.height,
                    width: '100%',
                }}
            />
        </div>
    );
}
