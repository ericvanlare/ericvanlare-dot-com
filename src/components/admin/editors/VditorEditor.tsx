import { useEffect, useRef, useState } from 'react';
import Vditor from 'vditor';
import 'vditor/dist/index.css';
import { sampleMarkdown } from '../../../lib/admin/sampleMarkdown';

export function VditorEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Vditor | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const isDark = document.documentElement.classList.contains('dark');

    editorRef.current = new Vditor(containerRef.current, {
      mode: 'ir',
      value: sampleMarkdown,
      theme: isDark ? 'dark' : 'classic',
      height: '100%',
      cache: { enable: false },
      toolbar: [
        'headings',
        'bold',
        'italic',
        'strike',
        'link',
        '|',
        'list',
        'ordered-list',
        'check',
        '|',
        'quote',
        'code',
        'inline-code',
        '|',
        'undo',
        'redo',
      ],
      toolbarConfig: {
        pin: true,
      },
      outline: {
        enable: false,
        position: 'right',
      },
      counter: {
        enable: true,
        type: 'text',
      },
      after: () => {
        setReady(true);
      },
    });

    return () => {
      editorRef.current?.destroy();
      editorRef.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Vditor (IR Mode)
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Instant Rendering — markdown renders as you type, shows source on active line
        </p>
      </div>
      <div className="flex-1 min-h-0 relative">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <span className="text-gray-500">Loading editor...</span>
          </div>
        )}
        <div
          ref={containerRef}
          className="h-full [&_.vditor]:h-full [&_.vditor]:border-0"
        />
      </div>
    </div>
  );
}
