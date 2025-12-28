import { WarningDialog } from 'spectra/dialogs';
import { useRecorderStore } from '@/features/recorder/store/recorderStore';

/**
 * Warning dialog shown when too many tabs are being captured.
 * Shows only once per session.
 */
export function MaxTabsWarningDialog() {
    const attachedTabCount = useRecorderStore((s) => s.attachedTabCount);
    const maxTabsWarningThreshold = useRecorderStore((s) => s.maxTabsWarningThreshold);
    const hasSeenTabsWarning = useRecorderStore((s) => s.hasSeenTabsWarning);
    const dismissTabsWarning = useRecorderStore((s) => s.dismissTabsWarning);

    // Show if: over threshold AND not dismissed yet
    const shouldShow = attachedTabCount > maxTabsWarningThreshold && !hasSeenTabsWarning;

    return (
        <WarningDialog
            open={shouldShow}
            onOpenChange={(open) => !open && dismissTabsWarning()}
            onProceed={dismissTabsWarning}
            title="Many Tabs Attached"
            description={`You are capturing from ${attachedTabCount} tabs. This may significantly impact browser performance and memory usage.`}
            proceedText="Okay"
        />
    );
}
