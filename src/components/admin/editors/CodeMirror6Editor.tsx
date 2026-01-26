import { useEffect, useRef, useState, useCallback } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { marked } from 'marked';
import { sampleMarkdown } from '../../../lib/admin/sampleMarkdown';

type ViewMode = 'editor' | 'preview' | 'split';

export function CodeMirror6Editor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<ViewMode>('split');
  const [previewHtml, setPreviewHtml] = useState('');

  const updatePreview = useCallback((content: string) => {
    const html = marked.parse(content, { async: false }) as string;
    setPreviewHtml(html);
  }, []);

  useEffect(() => {
    if (!containerRef.current || viewRef.current) return;

    const isDark = document.documentElement.classList.contains('dark');

    const theme = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
      },
      '.cm-scroller': {
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        overflow: 'auto',
      },
      '.cm-content': {
        padding: '16px 0',
      },
      '.cm-line': {
        padding: '0 16px',
      },
      '.cm-gutters': {
        backgroundColor: isDark ? '#111827' : '#f9fafb',
        borderRight: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
        color: isDark ? '#6b7280' : '#9ca3af',
      },
      '.cm-activeLineGutter': {
        backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: isDark ? '#60a5fa' : '#3b82f6',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
      },
      '.cm-activeLine': {
        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
      },
    }, { dark: isDark });

    const state = EditorState.create({
      doc: sampleMarkdown,
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        drawSelection(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown({ base: markdownLanguage, codeLanguages: languages }),
        syntaxHighlighting(defaultHighlightStyle),
        theme,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            updatePreview(update.state.doc.toString());
          }
        }),
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: containerRef.current,
    });

    updatePreview(sampleMarkdown);
    setReady(true);

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [updatePreview]);

  const showEditor = mode === 'editor' || mode === 'split';
  const showPreview = mode === 'preview' || mode === 'split';

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              CodeMirror 6 (Split View)
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Side-by-side editor and live preview
            </p>
          </div>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setMode('editor')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'editor'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Editor
            </button>
            <button
              onClick={() => setMode('split')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'split'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Split
            </button>
            <button
              onClick={() => setMode('preview')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                mode === 'preview'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              Preview
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-10">
            <span className="text-gray-500">Loading editor...</span>
          </div>
        )}
        {showEditor && (
          <div
            ref={containerRef}
            className={`${showPreview ? 'w-1/2 border-r border-gray-200 dark:border-gray-700' : 'w-full'} h-full bg-white dark:bg-gray-900 overflow-hidden [&_.cm-editor]:h-full`}
          />
        )}
        {showPreview && (
          <div
            className={`${showEditor ? 'w-1/2' : 'w-full'} h-full overflow-auto bg-white dark:bg-gray-900 p-6`}
          >
            <div
              className="prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
