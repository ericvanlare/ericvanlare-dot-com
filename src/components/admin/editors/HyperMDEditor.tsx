import { useEffect, useRef, useState } from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/markdown/markdown';
import 'codemirror/mode/gfm/gfm';
import 'hypermd/core';
import 'hypermd/mode/hypermd';
import 'hypermd/addon/hide-token';
import 'hypermd/addon/cursor-debounce';
import 'hypermd/addon/fold';
import 'hypermd/addon/fold-link';
import 'hypermd/addon/fold-image';
import 'hypermd/addon/fold-math';
import 'hypermd/addon/fold-html';
import 'hypermd/addon/fold-emoji';
import 'hypermd/addon/read-link';
import 'hypermd/addon/click';
import 'hypermd/addon/hover';
import 'hypermd/addon/paste';
import 'hypermd/addon/table-align';
import { sampleMarkdown } from '../../../lib/admin/sampleMarkdown';

export function HyperMDEditor() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<CodeMirror.Editor | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!textareaRef.current || editorRef.current) return;

    const isDark = document.documentElement.classList.contains('dark');

    // HyperMD extends CodeMirror with additional options that aren't in the types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config: any = {
      mode: 'hypermd',
      theme: 'default',
      lineNumbers: false,
      lineWrapping: true,
      foldGutter: false,
      hmdFold: {
        image: true,
        link: true,
        math: true,
        html: true,
        emoji: true,
      },
      hmdHideToken: true,
      hmdCursorDebounce: true,
      hmdClick: true,
      hmdHover: true,
      hmdPaste: true,
      hmdTableAlign: true,
    };

    const cm = CodeMirror.fromTextArea(textareaRef.current, config);

    cm.setValue(sampleMarkdown);
    editorRef.current = cm;

    if (isDark) {
      cm.getWrapperElement().classList.add('cm-dark');
    }

    setTimeout(() => {
      cm.refresh();
      setReady(true);
    }, 100);

    return () => {
      cm.toTextArea();
      editorRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          HyperMD (CodeMirror 5)
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Inline rendering — hides markdown syntax when cursor leaves the line
        </p>
      </div>
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
            <span className="text-gray-500">Loading editor...</span>
          </div>
        )}
        <textarea
          ref={textareaRef}
          defaultValue=""
          className="hidden"
        />
      </div>
      <style>{`
        .CodeMirror {
          height: 100% !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 14px;
          background: #fff;
          color: #1f2937;
        }
        .cm-dark.CodeMirror {
          background: #111827;
          color: #e5e7eb;
        }
        .CodeMirror-lines {
          padding: 16px;
        }
        .cm-header {
          font-weight: 600;
        }
        .cm-header-1 { font-size: 1.5em; }
        .cm-header-2 { font-size: 1.25em; }
        .cm-header-3 { font-size: 1.1em; }
        .cm-strong { font-weight: 600; }
        .cm-em { font-style: italic; }
        .cm-link { color: #3b82f6; }
        .cm-url { color: #6b7280; }
        .cm-comment { color: #6b7280; }
        .cm-dark .cm-link { color: #60a5fa; }
        .cm-dark .cm-url { color: #9ca3af; }
        .CodeMirror-activeline-background {
          background: rgba(59, 130, 246, 0.05);
        }
        .cm-dark .CodeMirror-activeline-background {
          background: rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
}
