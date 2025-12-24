import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRecorderStore } from '@/features/recorder/store/recorderStore';

/**
 * Warning dialog shown when too many requests are captured.
 * Shows only once per session (resets when requests are cleared).
 * 
 * Behavior depends on strictRequestsLimit:
 * - true: User MUST clear requests (no ignore option)
 * - false: User can dismiss but sees harsh warning
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

    if (!shouldShow) {
        return null;
    }

    return (
        <AlertDialog open={true}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>⚠️ High Request Count — Risk of Data Loss</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2">
                        {strictRequestsLimit ? (
                            <p>
                                You have captured <strong>{requestCount}</strong> requests.
                                <strong> You must clear requests to continue.</strong>
                            </p>
                        ) : (
                            <>
                                <p>
                                    You have captured <strong>{requestCount}</strong> requests.
                                    The application may become <strong>unresponsive</strong> or <strong>crash</strong>.
                                </p>
                                <p className="text-destructive font-medium">
                                    ⚠️ If the page crashes, you will lose all captured data.
                                </p>
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {!strictRequestsLimit && (
                        <AlertDialogCancel onClick={dismissRequestsWarning}>
                            I Understand the Risk
                        </AlertDialogCancel>
                    )}
                    <AlertDialogAction onClick={clearRequests}>
                        Clear Requests
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
