import { useEffect } from 'react';
import { HttpChainWebRecorder, useBookmarkedRequests } from '@/features/recorder';

// Hardcoded extension ID - treat this file as the consumer of the package
const EXTENSION_ID = 'gonddkkfaldfhpkeacnccofcnlddjpag';

export function App() {
    // Use the exported hook to subscribe to bookmarked requests
    const bookmarkedRequests = useBookmarkedRequests();

    // React to changes in bookmarked requests
    useEffect(() => {
        console.log('Bookmarked requests changed:', bookmarkedRequests.length);
    }, [bookmarkedRequests]);

    return (
        <div className="h-screen w-screen bg-background overflow-hidden">
            <HttpChainWebRecorder
                extensionId={EXTENSION_ID}
                maxRequestsWarningThreshold={500}
                maxTabsWarningThreshold={3}
            />
        </div>
    );
}

export default App;