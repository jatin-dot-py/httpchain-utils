import { useRecorderStore } from '@/features/recorder/store/recorderStore';
import { FileCodeView, KeyValuePairTable, HttpRequestMetadata } from 'spectra/fragments';
import { Group, GroupItem, GroupTab } from 'spectra/group';
import { NoContent } from 'spectra/state';
import {
    FileInput,
    Code,
    ArrowDownToLine,
    Database,
    Braces,
    Cookie,
    Search,
    Info,
    Bookmark,
    BookmarkCheck,
} from 'lucide-react';

export function DetailsContent() {
    const selectedRequestId = useRecorderStore((s) => s.selectedRequestId);
    const requests = useRecorderStore((s) => s.requests);
    const savedRequests = useRecorderStore((s) => s.savedRequests);
    const saveRequest = useRecorderStore((s) => s.saveRequest);
    const unsaveRequest = useRecorderStore((s) => s.unsaveRequest);

    const request = selectedRequestId
        ? (requests[selectedRequestId] ?? savedRequests[selectedRequestId] ?? null)
        : null;

    if (!request || !selectedRequestId) {
        return (
            <NoContent title="Select a request" />
        );
    }

    const isSaved = selectedRequestId in savedRequests;

    const handleToggleSave = () => {
        if (isSaved) {
            unsaveRequest(selectedRequestId);
        } else {
            const pathPart = request.requestUrl.split('/').pop() || 'Request';
            saveRequest(selectedRequestId, pathPart);
        }
    };

    const requestBodyContent = request.requestJson
        ? JSON.stringify(request.requestJson, null, 2)
        : request.requestFormData || request.requestBody || '';

    return (
        <GroupTab
            className="h-full"
            orientation="horizontal"
            size="sm"
            items={[
                {
                    title: 'Request',
                    icon: FileInput,
                    children: (
                        <Group>
                            <GroupItem size="sm" title="General" icon={Info} defaultExpanded>
                                <HttpRequestMetadata
                                    method={request.requestMethod}
                                    url={request.requestUrl}
                                    status={request.responseStatus}
                                    statusText={request.responseStatusText}
                                    mimeType={request.responseMimeType}
                                    showActionButton
                                    actionButtonText={isSaved ? 'Saved' : 'Save'}
                                    actionButtonIcon={isSaved ? BookmarkCheck : Bookmark}
                                    onActionButtonClick={handleToggleSave}
                                />
                            </GroupItem>

                            {Object.keys(request.requestHeaders ?? {}).length > 0 && (
                                <GroupItem size="sm" title="Headers" icon={Braces} defaultExpanded>
                                    <KeyValuePairTable data={request.requestHeaders} hideHeader />
                                </GroupItem>
                            )}
                            {Object.keys(request.requestCookies ?? {}).length > 0 && (
                                <GroupItem size="sm" title="Cookies" icon={Cookie} defaultExpanded>
                                    <KeyValuePairTable data={request.requestCookies} hideHeader />
                                </GroupItem>
                            )}
                            {Object.keys(request.requestQueryParams ?? {}).length > 0 && (
                                <GroupItem size="sm" title="Query Parameters" icon={Search} defaultExpanded>
                                    <KeyValuePairTable data={request.requestQueryParams} hideHeader />
                                </GroupItem>
                            )}
                        </Group>
                    ),
                },
                {
                    title: 'Payload',
                    icon: Code,
                    children: requestBodyContent ? (
                        <FileCodeView
                            filename={request.requestJson ? 'request.json' : 'request'}
                            content={requestBodyContent}
                            showLineNumbers
                            wrapLines
                            maxHeight="100%"
                            mimeType={request.requestHeaders?.['content-type'] || request.requestHeaders?.['Content-Type']}
                        />
                    ) : (
                        <NoContent title="No Payload" />
                    ),
                },
                {
                    title: 'Response',
                    icon: ArrowDownToLine,
                    children: (
                        <Group>
                            {Object.keys(request.responseHeaders ?? {}).length > 0 ? (
                                <GroupItem size="sm" title="Headers" icon={Braces} defaultExpanded>
                                    <KeyValuePairTable data={request.responseHeaders} hideHeader />
                                </GroupItem>
                            ) : (
                                <div className="p-4">
                                    <NoContent title="No Response Headers" />
                                </div>
                            )}
                        </Group>
                    ),
                },
                {
                    title: 'Data',
                    icon: Database,
                    children: request.responseContent ? (
                        <FileCodeView
                            filename={request.responseMimeType?.includes('json') ? 'response.json' : 'response'}
                            content={request.responseContent}
                            showLineNumbers
                            wrapLines
                            maxHeight="100%"
                            mimeType={request.responseMimeType}
                        />
                    ) : (
                        <NoContent title="No Response Data" />
                    ),
                },
            ]}
        />
    );
}
