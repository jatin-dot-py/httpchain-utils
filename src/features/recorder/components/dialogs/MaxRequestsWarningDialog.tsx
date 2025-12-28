import { ConfirmDialog, WarningDialog } from 'spectra/dialogs';
import { useRecorderStore } from '@/features/recorder/store/recorderStore';

/**
 * Warning dialog shown when too many requests are captured.
 * Shows only once per session (resets when requests are cleared).
 * 
 * Behavior depends on strictRequestsLimit:
 * - true: User MUST clear requests (no ignore option) -> WarningDialog
 * - false: User can dismiss but sees harsh warning -> ConfirmDialog (Destructive)
 */
export function MaxRequestsWarningDialog() {
    const maxRequestsWarningThreshold = useRecorderStore((s) => s.maxRequestsWarningThreshold);
    const hasSeenRequestsWarning = useRecorderStore((s) => s.hasSeenRequestsWarning);
    const strictRequestsLimit = useRecorderStore((s) => s.strictRequestsLimit);
    const clearRequests = useRecorderStore((s) => s.clearRequests);
    const dismissRequestsWarning = useRecorderStore((s) => s.dismissRequestsWarning);
    const requestCount = useRecorderStore((s) => Object.keys(s.requests).length);

    // Show if: over threshold AND not dismissed yet (or strict mode always blocks)
    const shouldShow = requestCount > maxRequestsWarningThreshold &&
        (strictRequestsLimit || !hasSeenRequestsWarning);

    if (strictRequestsLimit) {
        return (
            <WarningDialog
                open={shouldShow}
                onOpenChange={() => { }} // Cannot be dismissed in strict mode purely via open change if we want it blocking
                onProceed={clearRequests}
                title="High Request Count — Risk of Data Loss"
                description={`You have captured ${requestCount} requests. You must clear requests to continue.`}
                proceedText="Clear Requests"
            />
        );
    }

    return (
        <ConfirmDialog
            open={shouldShow}
            onOpenChange={(open) => !open && dismissRequestsWarning()}
            onConfirm={clearRequests}
            title="High Request Count — Risk of Data Loss"
            description={`You have captured ${requestCount} requests. The application may become unresponsive or crash. If the page crashes, you will lose all captured data.`}
            confirmText="Clear Requests"
            variant="destructive"
        />
    );
}
