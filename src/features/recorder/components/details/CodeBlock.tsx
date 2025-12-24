import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Badge } from '@/components/ui/badge';

const MAX_HIGHLIGHT_SIZE = 20000;

interface CodeBlockProps {
    content: string | null;
    language?: string;
}

export function CodeBlock({ content, language }: CodeBlockProps) {
    if (!content) {
        return (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No content
            </div>
        );
    }

    const size = content.length;
    const sizeKb = (size / 1024).toFixed(1);
    const tooLarge = size > MAX_HIGHLIGHT_SIZE;

    return (
        <>
            <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-[10px]">{sizeKb} KB</Badge>
                {tooLarge && (
                    <span className="text-[10px] text-muted-foreground">
                        Syntax highlighting disabled (file too large)
                    </span>
                )}
            </div>
            <div className="rounded border bg-muted/30 overflow-hidden max-w-full">
                {tooLarge ? (
                    <pre className="font-mono text-xs whitespace-pre-wrap break-all p-4 overflow-x-hidden">{content}</pre>
                ) : (
                    <SyntaxHighlighter
                        language={language || 'text'}
                        style={oneDark}
                        customStyle={{
                            margin: 0,
                            padding: '1rem',
                            fontSize: '12px',
                            background: 'transparent',
                            wordBreak: 'break-all',
                            whiteSpace: 'pre-wrap',
                            overflowWrap: 'break-word',
                        }}
                        wrapLongLines
                        codeTagProps={{
                            style: {
                                wordBreak: 'break-all',
                                whiteSpace: 'pre-wrap',
                                overflowWrap: 'break-word',
                            }
                        }}
                    >
                        {content}
                    </SyntaxHighlighter>
                )}
            </div>
        </>
    );
}

export function detectLanguage(mimeType: string): string {
    if (!mimeType) return 'text';
    if (mimeType.includes('json')) return 'json';
    if (mimeType.includes('xml')) return 'xml';
    if (mimeType.includes('html')) return 'html';
    if (mimeType.includes('javascript')) return 'javascript';
    if (mimeType.includes('css')) return 'css';
    return 'text';
}
