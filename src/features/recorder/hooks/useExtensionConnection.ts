import { useEffect } from 'react';
import { useRecorderStore } from '../store/recorderStore';

/**
 * Hook to establish connection to the Chrome extension on mount.
 * Should be called once at the top level of RecorderLayout.
 */
export function useExtensionConnection(extensionId: string) {
    const connect = useRecorderStore((s) => s.connect);
    const setWarningConfig = useRecorderStore((s) => s.setWarningConfig);

    useEffect(() => {
        connect(extensionId);
    }, [extensionId, connect]);

    return { setWarningConfig };
}
