/**
 * EditorGroup.tsx — Editores com abas, fechar (×) e divisão lado a lado (split).
 */

import MonacoEditor, { loader } from '@monaco-editor/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type * as Monaco from 'monaco-editor';
import type { CompileError } from '../../types';

const _shared = {
  symbolInfo: {} as Record<string, string>,
};

let configured = false;

function configureMocano(monaco: typeof Monaco) {
  if (configured) return;
  configured = true;

  monaco.languages.register({ id: 'iugo' });

  monaco.languages.setMonarchTokensProvider('iugo', {
    keywords: ['let', 'print', 'if', 'else', 'while', 'true', 'false'],
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/"[^"]*"/, 'string'],
        [/\d+\.?\d*/, 'number'],
        [/[a-zA-Z_]\w*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
        [/[><!]=|&&|\|\|/, 'operator'],
        [/[=<>+\-*/!]/, 'operator'],
        [/[{}()\[\]]/, 'delimiter'],
        [/[;,]/, 'punctuation'],
        [/\s+/, 'white'],
      ],
    },
  });

  monaco.editor.defineTheme('vscode-dark-iugo', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword',    foreground: 'c586c0', fontStyle: 'bold' },
      { token: 'string',     foreground: 'ce9178' },
      { token: 'number',     foreground: 'b5cea8' },
      { token: 'comment',    foreground: '6a9955', fontStyle: 'italic' },
      { token: 'identifier', foreground: '9cdcfe' },
      { token: 'operator',   foreground: 'd4d4d4' },
      { token: 'delimiter',  foreground: 'ffd700' },
    ],
    colors: {
      'editor.background':                 '#1e1e1e',
      'editor.foreground':                 '#d4d4d4',
      'editor.lineHighlightBackground':    '#ffffff0a',
      'editor.selectionBackground':        '#264f78',
      'editorLineNumber.foreground':       '#858585',
      'editorLineNumber.activeForeground': '#c6c6c6',
      'editorCursor.foreground':           '#aeafad',
      'editorIndentGuide.background1':     '#404040',
      'editorWidget.background':          '#252526',
      'scrollbarSlider.background':       '#42424266',
    },
  });

  monaco.languages.registerHoverProvider('iugo', {
    provideHover(model, position) {
      const word = model.getWordAtPosition(position);
      if (!word) return null;
      const type = _shared.symbolInfo[word.word];
      if (!type) return null;
      return {
        contents: [
          { value: `**${word.word}** — \`${type}\`` },
          { value: `_iuGo variable — inferred type_` },
        ],
      };
    },
  });

  monaco.languages.registerCompletionItemProvider('iugo', {
    provideCompletionItems: () => ({
      suggestions: [
        { label: 'let',   kind: monaco.languages.CompletionItemKind.Keyword,   insertText: 'let ${1:name} = ${2:value};',        insertTextRules: 4, range: {} as never },
        { label: 'print', kind: monaco.languages.CompletionItemKind.Function,  insertText: 'print(${1:expr});',                   insertTextRules: 4, range: {} as never },
        { label: 'if',    kind: monaco.languages.CompletionItemKind.Keyword,   insertText: 'if (${1:cond}) {\n\t${2}\n}',         insertTextRules: 4, range: {} as never },
        { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword,   insertText: 'while (${1:cond}) {\n\t${2}\n}',      insertTextRules: 4, range: {} as never },
        { label: 'true',  kind: monaco.languages.CompletionItemKind.Constant,  insertText: 'true',  range: {} as never },
        { label: 'false', kind: monaco.languages.CompletionItemKind.Constant,  insertText: 'false', range: {} as never },
      ],
    }),
  });
}

type Tab = 'source' | 'output';

interface TabProps {
  id: Tab;
  label: string;
  lang: string;
  active: Tab;
  canClose: boolean;
  onClick: (t: Tab) => void;
  onClose: (t: Tab) => void;
}

function EditorTab({ id, label, lang, active, canClose, onClick, onClose }: TabProps) {
  const isActive = id === active;
  const langColor = lang === 'iugo' ? '#519aba' : '#cbcb41';

  return (
    <div
      onClick={() => onClick(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 12px 0 20px', height: 35, cursor: 'pointer',
        minWidth: 120, userSelect: 'none',
        background: isActive ? 'var(--vsc-tab-active-bg)' : 'var(--vsc-tab-inactive)',
        color: isActive ? 'var(--vsc-tab-active-fg)' : 'var(--vsc-tab-inactive-fg)',
        borderRight: '1px solid #252526',
        position: 'relative',
      }}
    >
      {isActive && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: '#007acc',
        }} />
      )}
      <svg width="12" height="12" viewBox="0 0 16 16">
        <path d="M13.71 4.29l-3-3L10 1H4L3 2v12l1 1h9l1-1V5l-.29-.71zM13 14H4V2h5v4h4v8z" fill={langColor} />
      </svg>
      <span style={{ fontSize: 13, flex: 1 }}>{label}</span>
      {canClose && (
        <button
          type="button"
          title={`Fechar ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onClose(id);
          }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 20, height: 20, margin: 0, padding: 0,
            background: 'transparent', border: 'none', borderRadius: 3,
            color: 'var(--vsc-text-dim)', fontSize: 14, lineHeight: 1,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ffffff18';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--vsc-text-dim)';
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

interface EditorGroupProps {
  source: string;
  onSourceChange: (v: string) => void;
  generatedCode: string;
  openTabs: Tab[];
  activeTab: Tab;
  onTabClick: (t: Tab) => void;
  onTabClose: (t: Tab) => void;
  onEnsureTab: (t: Tab) => void;
  onCompile: () => void;
  errors: CompileError[];
  symbolInfo: Record<string, string>;
}

const TAB_META: Record<Tab, { label: string; lang: string }> = {
  source: { label: 'source.iugo', lang: 'iugo' },
  output: { label: 'output.js',   lang: 'js'   },
};

const EDITOR_OPTIONS: Monaco.editor.IStandaloneEditorConstructionOptions = {
  fontSize: 14,
  fontFamily: "'JetBrains Mono', 'Cascadia Code', Menlo, monospace",
  fontLigatures: true,
  lineHeight: 22,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'all',
  cursorBlinking: 'blink',
  cursorSmoothCaretAnimation: 'on',
  smoothScrolling: true,
  padding: { top: 8 },
  lineNumbers: 'on',
  glyphMargin: false,
  folding: true,
  wordWrap: 'off',
  overviewRulerLanes: 2,
  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
  bracketPairColorization: { enabled: true },
  renderWhitespace: 'none',
  stickyScroll: { enabled: true },
};

const SPLIT_MIN = 20;
const SPLIT_MAX = 80;

export function EditorGroup({
  source, onSourceChange, generatedCode,
  openTabs, activeTab, onTabClick, onTabClose, onEnsureTab, onCompile,
  errors, symbolInfo,
}: EditorGroupProps) {
  const canCloseTab = openTabs.length > 1;
  const canSplit = openTabs.includes('source') && openTabs.includes('output');

  const [isSplit, setIsSplit] = useState(true);
  const [splitPercent, setSplitPercent] = useState(50);
  const [focusedPane, setFocusedPane] = useState<Tab>('source');

  const configRef     = useRef(false);
  const sourceEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const outputEditorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef       = useRef<typeof Monaco | null>(null);
  const splitAreaRef    = useRef<HTMLDivElement | null>(null);
  const draggingRef     = useRef(false);

  const layoutEditors = useCallback(() => {
    sourceEditorRef.current?.layout();
    outputEditorRef.current?.layout();
  }, []);

  useEffect(() => {
    if (configRef.current) return;
    configRef.current = true;
    loader.init().then(configureMocano);
  }, []);

  useEffect(() => {
    _shared.symbolInfo = symbolInfo;
  }, [symbolInfo]);

  useEffect(() => {
    if (!canSplit && isSplit) setIsSplit(false);
  }, [canSplit, isSplit]);

  useEffect(() => {
    const editor = sourceEditorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;
    const model = editor.getModel();
    if (!model) return;
    const markers: Monaco.editor.IMarkerData[] = errors.map(e => ({
      startLineNumber: e.line ?? 1,
      startColumn:    e.column ?? 1,
      endLineNumber:  e.line ?? 1,
      endColumn:      (e.column ?? 1) + 20,
      message:        `[${e.phase}] ${e.message}`,
      severity:       monaco.MarkerSeverity.Error,
    }));
    monaco.editor.setModelMarkers(model, 'iugo', markers);
  }, [errors]);

  useEffect(() => {
    layoutEditors();
  }, [isSplit, splitPercent, layoutEditors]);

  useEffect(() => {
    const el = splitAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => layoutEditors());
    ro.observe(el);
    return () => ro.disconnect();
  }, [layoutEditors]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current || !splitAreaRef.current) return;
      const rect = splitAreaRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, pct)));
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const startDragSash = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const toggleSplit = () => {
    if (isSplit) {
      setIsSplit(false);
      return;
    }
    onEnsureTab('source');
    onEnsureTab('output');
    setIsSplit(true);
    setSplitPercent(50);
  };

  const handleTabClick = (tab: Tab) => {
    onTabClick(tab);
    setFocusedPane(tab);
  };

  const showSplit = isSplit && canSplit;
  const showSource = showSplit || activeTab === 'source';
  const showOutput = showSplit || activeTab === 'output';

  const toolbarBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 24, marginRight: 4, padding: 0,
    background: 'transparent', border: 'none', borderRadius: 3,
    color: 'var(--vsc-text-dim)', cursor: 'pointer',
  };

  const paneOutline = (pane: Tab): React.CSSProperties | undefined =>
    showSplit && focusedPane === pane
      ? { boxShadow: 'inset 0 0 0 1px #007acc44' }
      : undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

      <div style={{
        display: 'flex', alignItems: 'center',
        height: 35, background: 'var(--vsc-tab-bar)',
        borderBottom: '1px solid #252526', flexShrink: 0,
      }}>
        {openTabs.map((id) => {
          const meta = TAB_META[id];
          return (
            <EditorTab
              key={id}
              id={id}
              label={meta.label}
              lang={meta.lang}
              active={activeTab}
              canClose={canCloseTab}
              onClick={handleTabClick}
              onClose={onTabClose}
            />
          );
        })}

        <div style={{ flex: 1 }} />

        <button
          type="button"
          title={showSplit ? 'Editor único' : 'Dividir editor (lado a lado)'}
          onClick={toggleSplit}
          disabled={!canSplit && !isSplit}
          style={{
            ...toolbarBtn,
            background: showSplit ? '#ffffff14' : 'transparent',
            color: showSplit ? '#fff' : canSplit ? 'var(--vsc-text-dim)' : '#555',
            cursor: canSplit || isSplit ? 'pointer' : 'not-allowed',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 2h6v12H1V2zm8 0h6v12H9V2zM2 3v10h4V3H2zm9 0v10h4V3h-4z" />
          </svg>
        </button>

        <button
          onClick={onCompile}
          title="Compilar (⌘↵)"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginRight: 8, padding: '3px 10px',
            background: '#0078d4', color: '#fff',
            border: 'none', borderRadius: 2, fontSize: 12,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          Compilar
        </button>
      </div>

      <div
        ref={splitAreaRef}
        style={{
          flex: 1, display: 'flex', overflow: 'hidden',
          flexDirection: showSplit ? 'row' : 'column',
        }}
      >
        {showSource && openTabs.includes('source') && (
          <div
            onMouseDown={() => { setFocusedPane('source'); onTabClick('source'); }}
            style={{
              ...(showSplit
                ? { width: `${splitPercent}%`, flexShrink: 0 }
                : { flex: 1 }),
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              ...paneOutline('source'),
            }}
          >
            <MonacoEditor
              height="100%"
              language="iugo"
              theme="vscode-dark-iugo"
              value={source}
              onChange={v => onSourceChange(v ?? '')}
              options={EDITOR_OPTIONS}
              onMount={(editor, monaco) => {
                configureMocano(monaco);
                sourceEditorRef.current = editor;
                monacoRef.current = monaco;
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onCompile);
                layoutEditors();
              }}
            />
          </div>
        )}

        {showSplit && (
          <div
            role="separator"
            aria-orientation="vertical"
            title="Arraste para redimensionar"
            onMouseDown={startDragSash}
            style={{
              width: 5, flexShrink: 0, cursor: 'col-resize',
              background: '#252526',
              borderLeft: '1px solid #3c3c3c',
              borderRight: '1px solid #3c3c3c',
              position: 'relative',
              zIndex: 2,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#007acc'; }}
            onMouseLeave={(e) => {
              if (!draggingRef.current) e.currentTarget.style.background = '#252526';
            }}
          />
        )}

        {showOutput && openTabs.includes('output') && (
          <div
            onMouseDown={() => { setFocusedPane('output'); onTabClick('output'); }}
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: showSplit ? undefined : undefined,
              ...paneOutline('output'),
            }}
          >
            <MonacoEditor
              height="100%"
              language="javascript"
              theme="vs-dark"
              value={generatedCode || '// Compile source.iugo to see output'}
              options={{ ...EDITOR_OPTIONS, readOnly: true, renderLineHighlight: 'none' }}
              onMount={(editor) => {
                outputEditorRef.current = editor;
                layoutEditors();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
