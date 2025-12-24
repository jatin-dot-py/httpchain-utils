import { useEffect } from 'react';
import { useRecorderStore } from '@/features/recorder/store/recorderStore';
import { useExtensionConnection } from '@/features/recorder/hooks/useExtensionConnection';
import { SidebarHeader } from '@/features/recorder/components/sidebar/SidebarHeader';
import { SidebarList } from '@/features/recorder/components/sidebar/SidebarList';
import { DetailsHeader } from '@/features/recorder/components/details/DetailsHeader';
import { DetailsContent } from '@/features/recorder/components/details/DetailsContent';
import { ConnectionIndicator } from '@/features/recorder/components/shared/ConnectionIndicator';
import { EmptyState } from '@/features/recorder/components/shared/EmptyState';
import { MaxTabsWarningDialog } from '@/features/recorder/components/dialogs/MaxTabsWarningDialog';
import { MaxRequestsWarningDialog } from '@/features/recorder/components/dialogs/MaxRequestsWarningDialog';
import type { HttpChainWebRecorderProps, HttpChainRequestInfo } from '@/features/recorder/types';

// Fixed header height in pixels - same for both panels to ensure aligned borders
const HEADER_HEIGHT = 100;

export function RecorderLayout({
    extensionId,
    maxRequestsWarningThreshold = 1000,
    maxTabsWarningThreshold = 10,
    strictRequestsLimit = false,
    className,
}: HttpChainWebRecorderProps) {
    // Connect to extension and configure warnings
    useExtensionConnection(extensionId);
    const setWarningConfig = useRecorderStore((s) => s.setWarningConfig);

    // Apply warning configuration from props
    useEffect(() => {
        setWarningConfig({
            maxTabs: maxTabsWarningThreshold,
            maxRequests: maxRequestsWarningThreshold,
            strict: strictRequestsLimit,
        });
    }, [maxTabsWarningThreshold, maxRequestsWarningThreshold, strictRequestsLimit, setWarningConfig]);

    return (
        <div className={`relative h-full w-full flex bg-background text-foreground overflow-hidden ${className ?? ''}`}>
            {/* Sidebar - 25% width */}
            <div className="w-[25%] h-full flex flex-col border-r">
                {/* Header - fixed height */}
                <div style={{ height: HEADER_HEIGHT, flexShrink: 0 }} className="border-b">
                    <SidebarHeader />
                </div>
                {/* List - fills remaining space */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    <SidebarList />
                </div>
            </div>

            {/* Details Panel - 75% width */}
            <div className="w-[75%] h-full flex flex-col">
                {/* Header - fixed height (same as sidebar) */}
                <div style={{ height: HEADER_HEIGHT, flexShrink: 0 }} className="border-b">
                    <DetailsHeader />
                </div>
                {/* Content - fills remaining space */}
                <div className="flex-1 min-h-0 overflow-hidden">
                    <DetailsContent />
                </div>
            </div>

            {/* Floating connection indicator */}
            <ConnectionIndicator />

            {/* Empty state - shows when no requests captured */}
            <EmptyState extensionId={extensionId} />

            {/* Warning dialogs - self-contained with central state */}
            <MaxTabsWarningDialog />
            <MaxRequestsWarningDialog />
        </div>
    );
}

export type { HttpChainRequestInfo, HttpChainWebRecorderProps };
