import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Terminal } from 'lucide-react';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  if (!content) {
    return <div className="text-slate-400 italic text-xs">No description provided.</div>;
  }

  // Pre-process any literal "\n" escape sequences if parsed directly from raw JSON strings
  const formattedContent = content.replace(/\\n/g, '\n');

  return (
    <div className={`prose prose-sm max-w-none text-slate-800 leading-relaxed font-sans select-none ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h2 className="text-base font-bold text-slate-900 mt-5 mb-2.5 pb-1 border-b border-slate-100 flex items-center gap-2">
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h3 className="text-sm font-bold text-slate-900 mt-4 mb-2 flex items-center gap-1.5">
              {children}
            </h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-xs font-bold text-slate-900 mt-3 mb-1.5 uppercase tracking-wider text-slate-700">
              {children}
            </h4>
          ),
          h4: ({ children }) => (
            <h5 className="text-xs font-semibold text-slate-800 mt-2.5 mb-1">{children}</h5>
          ),
          p: ({ children }) => <p className="mb-3 text-slate-700 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-800">{children}</em>,
          blockquote: ({ children }) => (
            <blockquote className="my-3 pl-3.5 py-1.5 border-l-3 border-blue-500 bg-blue-50/50 rounded-r-lg text-xs text-slate-700">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-3 text-slate-700">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-3 text-slate-700">{children}</ol>,
          li: ({ children }) => <li className="text-slate-700 leading-relaxed">{children}</li>,
          hr: () => <hr className="my-4 border-slate-200" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-slate-200 shadow-2xs">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-slate-800">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50 font-semibold text-slate-900">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-slate-50/70 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2">{children}</td>,
          code: ({ className: codeClassName, children, ...props }) => {
            const match = /language-(\w+)/.exec(codeClassName || '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code
                  className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-mono text-[11.5px] border border-slate-200/80 font-medium"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            const langLabel = match ? match[1].toUpperCase() : 'CODE';

            return (
              <div className="my-3 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 text-slate-100 shadow-xs font-mono text-xs select-none">
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 select-none">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-semibold text-slate-300">{langLabel}</span>
                  </div>
                </div>
                <pre className="p-3.5 overflow-x-auto leading-relaxed text-[12px] bg-slate-900 text-emerald-300 select-none">
                  <code>{children}</code>
                </pre>
              </div>
            );
          },
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
};
