import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

    if (!shouldShow) {
        return null;
    }

    return (
        <AlertDialog open={true}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>⚠️ Many Tabs Attached</AlertDialogTitle>
                    <AlertDialogDescription>
                        You are capturing from <strong>{attachedTabCount} tabs</strong>.
                        This may significantly impact browser performance and memory usage.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={dismissTabsWarning}>
                        Okay
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
