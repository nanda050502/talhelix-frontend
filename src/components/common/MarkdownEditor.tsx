import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bold, Italic, Code, Paperclip, List, Table as TableIcon, Eye, Edit3 } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
  helperText?: string;
  compact?: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = 'Use **bold**, _italic_, `inline code`, code blocks, lists, tables...',
  minHeight = 'min-h-[100px]',
  helperText = 'Supports Markdown **bold**, _italic_, `code`, ```code blocks```, tables, lists',
  compact = false,
}) => {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertText = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousText = textarea.value;
    const selected = previousText.substring(start, end);

    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newValue = previousText.substring(0, start) + replacement + previousText.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selected.length || 4)
      );
    }, 10);
  };

  const handleBold = () => insertText('**', '**');
  const handleItalic = () => insertText('_', '_');
  const handleCode = () => insertText('`', '`');
  const handleBullet = () => insertText('\n- ');
  const handleTable = () =>
    insertText('\n| Column 1 | Column 2 |\n|---|---|\n| Item 1 | Item 2 |\n');
  const handleAttach = () => insertText('[attachment.png](', ')');

  return (
    <div className="w-full border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      {/* Editor Header: Tabs + Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50/90 border-b border-slate-200 text-xs">
        {/* Write / Preview Tab Switch */}
        <div className="flex items-center space-x-1 bg-slate-200/80 p-0.5 rounded-md">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
              tab === 'write'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
              tab === 'preview'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
        </div>

        {/* Toolbar Icons (only in write mode) */}
        {tab === 'write' && (
          <div className="flex items-center gap-0.5 text-slate-600">
            <button
              type="button"
              title="Bold (**text**)"
              onClick={handleBold}
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Italic (_text_)"
              onClick={handleItalic}
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Inline Code (`code`)"
              onClick={handleCode}
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Attach File/Image"
              onClick={handleAttach}
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Bullet List"
              onClick={handleBullet}
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Insert Table"
              onClick={handleTable}
              className="p-1.5 hover:bg-slate-200 rounded text-slate-700 transition-colors"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Editor Body */}
      {tab === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${minHeight} p-3 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none resize-y font-mono`}
        />
      ) : (
        <div
          className={`w-full ${minHeight} p-3 text-sm text-slate-800 bg-slate-50/50 overflow-y-auto prose prose-sm max-w-none`}
        >
          {value ? (
            <div className="markdown-content space-y-2">
              <ReactMarkdown>{value}</ReactMarkdown>
            </div>
          ) : (
            <span className="text-slate-400 italic text-xs">Nothing to preview. Enter markdown in Write tab.</span>
          )}
        </div>
      )}

      {/* Helper footer */}
      {!compact && helperText && (
        <div className="px-3 py-1.5 bg-slate-50/60 border-t border-slate-100 text-xs text-slate-500">
          {helperText}
        </div>
      )}
    </div>
  );
};
