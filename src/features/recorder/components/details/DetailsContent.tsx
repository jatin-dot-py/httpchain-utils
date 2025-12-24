import * as TabsPrimitive from '@radix-ui/react-tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useRecorderStore } from '@/features/recorder/store/recorderStore';
import { KeyValueTable } from './KeyValueTable';
import { CodeBlock, detectLanguage } from './CodeBlock';
import {
    FileInput,      // Request tab
    Code,           // Payload tab  
    ArrowDownToLine, // Response tab
    Database,       // Data tab
    Braces,         // Headers & Parameters
    Cookie,         // Cookies
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface TabConfig {
    value: string;
    label: string;
    icon: LucideIcon;
}

const tabs: TabConfig[] = [
    { value: 'request', label: 'Request', icon: FileInput },
    { value: 'payload', label: 'Payload', icon: Code },
    { value: 'response', label: 'Response', icon: ArrowDownToLine },
    { value: 'data', label: 'Data', icon: Database },
];

export function DetailsContent() {
    const selectedRequestId = useRecorderStore((s) => s.selectedRequestId);
    const requests = useRecorderStore((s) => s.requests);
    const savedRequests = useRecorderStore((s) => s.savedRequests);
    const request = selectedRequestId ? (requests[selectedRequestId] ?? savedRequests[selectedRequestId] ?? null) : null;

    if (!request) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <p className="text-sm font-medium">Select a request</p>
            </div>
        );
    }

    const requestBodyContent = request.requestJson
        ? JSON.stringify(request.requestJson, null, 2)
        : request.requestFormData || request.requestBody || '';
    const requestBodyLang = request.requestJson ? 'json' : 'text';
    const responseLang = detectLanguage(request.responseMimeType);

    return (
        <TabsPrimitive.Root defaultValue="request" className="h-full flex flex-col overflow-hidden">
            <TabsPrimitive.List className="shrink-0 flex border-b px-4 gap-1">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <TabsPrimitive.Trigger
                            key={tab.value}
                            value={tab.value}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground",
                                "border-b-2 border-transparent -mb-px",
                                "hover:text-foreground transition-colors",
                                "data-[state=active]:text-foreground data-[state=active]:border-primary"
                            )}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {tab.label}
                        </TabsPrimitive.Trigger>
                    );
                })}
            </TabsPrimitive.List>

            <div className="flex-1 min-h-0 overflow-hidden pt-2">
                <TabsPrimitive.Content
                    value="request"
                    className="h-full focus:outline-none data-[state=inactive]:hidden"
                >
                    <ScrollArea className="h-full">
                        <div className="p-4">
                            <KeyValueTable data={request.requestHeaders} title="Request Headers" icon={Braces} />
                            <KeyValueTable data={request.requestCookies} title="Request Cookies" icon={Cookie} />
                            <KeyValueTable data={request.requestQueryParams} title="Query Parameters" icon={Braces} />
                        </div>
                    </ScrollArea>
                </TabsPrimitive.Content>

                <TabsPrimitive.Content
                    value="payload"
                    className="h-full focus:outline-none data-[state=inactive]:hidden"
                >
                    <ScrollArea className="h-full">
                        <div className="p-4">
                            <CodeBlock content={requestBodyContent || null} language={requestBodyLang} />
                        </div>
                    </ScrollArea>
                </TabsPrimitive.Content>

                <TabsPrimitive.Content
                    value="response"
                    className="h-full focus:outline-none data-[state=inactive]:hidden"
                >
                    <ScrollArea className="h-full">
                        <div className="p-4">
                            <KeyValueTable data={request.responseHeaders} title="Response Headers" icon={Braces} />
                        </div>
                    </ScrollArea>
                </TabsPrimitive.Content>

                <TabsPrimitive.Content
                    value="data"
                    className="h-full focus:outline-none data-[state=inactive]:hidden"
                >
                    <ScrollArea className="h-full">
                        <div className="p-4">
                            <CodeBlock content={request.responseContent} language={responseLang} />
                        </div>
                    </ScrollArea>
                </TabsPrimitive.Content>
            </div>
        </TabsPrimitive.Root>
    );
}
