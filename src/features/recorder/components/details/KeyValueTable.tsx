import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KeyValueTableProps {
    data: Record<string, string>;
    title: string;
    icon?: LucideIcon;
}

export function KeyValueTable({ data, title, icon: Icon }: KeyValueTableProps) {
    const entries = Object.entries(data ?? {});
    const [expandedKey, setExpandedKey] = useState<string | null>(null);

    if (entries.length === 0) {
        return (
            <div className="mb-6">
                <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    {title}
                </h4>
                <p className="text-xs text-muted-foreground/60 italic">No {title.toLowerCase()}</p>
            </div>
        );
    }

    const handleRowClick = (key: string) => {
        setExpandedKey(expandedKey === key ? null : key);
    };

    return (
        <div className="mb-6 max-w-full overflow-hidden">
            <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {title}
            </h4>
            <div className="rounded border overflow-hidden">
                <Table className="table-fixed w-full">
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="w-[180px] text-xs font-medium">Name</TableHead>
                            <TableHead className="text-xs font-medium">Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {entries.map(([key, value]) => {
                            const isExpanded = expandedKey === key;
                            return (
                                <TableRow
                                    key={key}
                                    onClick={() => handleRowClick(key)}
                                    className={cn(
                                        "cursor-pointer transition-colors hover:bg-muted/50",
                                        isExpanded && "bg-muted/30"
                                    )}
                                >
                                    <TableCell
                                        className={cn(
                                            "font-mono text-xs py-2 text-muted-foreground align-top",
                                            isExpanded
                                                ? "whitespace-pre-wrap break-all"
                                                : "truncate"
                                        )}
                                    >
                                        {key}
                                    </TableCell>
                                    <TableCell
                                        className={cn(
                                            "font-mono text-xs py-2",
                                            isExpanded
                                                ? "whitespace-pre-wrap break-all"
                                                : "truncate"
                                        )}
                                    >
                                        {value}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
