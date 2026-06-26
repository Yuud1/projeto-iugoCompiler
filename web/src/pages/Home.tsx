import { useState, useCallback } from 'react';
import { useCompiler } from '../hooks/useCompiler';
import { TitleBar }    from '../components/vscode/TitleBar';
import { ActivityBar, type ActivityView } from '../components/vscode/ActivityBar';
import { Sidebar }     from '../components/vscode/Sidebar/Sidebar';
import { EditorGroup } from '../components/vscode/EditorGroup';
import { Panel }       from '../components/vscode/Panel';
import { StatusBar }   from '../components/vscode/StatusBar';

type EditorTab  = 'source' | 'output';
type PanelTab   = 'terminal' | 'problems' | 'output' | 'debug';

export function Home() {
  const {
    source, setSource,
    result, liveErrors, problemsErrors, outputLog, execution,
    isCompiling, currentPhase,
    triggerCompile, triggerExecute,
    debugState, stepDebug, resetDebug, runDebug,
  } = useCompiler();

  // Layout state
  const [sidebarView, setSidebarView] = useState<ActivityView>('explorer');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openEditorTabs, setOpenEditorTabs] = useState<EditorTab[]>(['source', 'output']);
  const [editorTab, setEditorTab]           = useState<EditorTab>('source');
  const [panelTab, setPanelTab]             = useState<PanelTab>('terminal');

  const hasError = problemsErrors.length > 0;

  // Clicking the active activity bar icon toggles the sidebar
  const handleActivitySelect = useCallback((v: ActivityView) => {
    if (sidebarOpen && sidebarView === v) {
      setSidebarOpen(false);
    } else {
      setSidebarView(v);
      setSidebarOpen(true);
    }
  }, [sidebarOpen, sidebarView]);

  const handleTabClose = useCallback((tab: EditorTab) => {
    setOpenEditorTabs((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((t) => t !== tab);
      setEditorTab((active) => (active === tab ? next[next.length - 1]! : active));
      return next;
    });
  }, []);

  // Explorer: reabre a aba se estiver fechada e foca nela
  const handleFileClick = useCallback((f: EditorTab) => {
    setOpenEditorTabs((prev) => (prev.includes(f) ? prev : [...prev, f]));
    setEditorTab(f);
  }, []);

  const handleEnsureTab = useCallback((f: EditorTab) => {
    setOpenEditorTabs((prev) => (prev.includes(f) ? prev : [...prev, f]));
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', overflow: 'hidden',
      background: 'var(--vsc-editor)', color: '#d4d4d4',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>

      {/* ── Title Bar ──────────────────────────────────────────────────── */}
      <TitleBar />

      {/* ── Main body (ActivityBar + Sidebar + Editor/Panel) ──────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Activity Bar */}
        <ActivityBar active={sidebarView} onSelect={handleActivitySelect} />

        {/* Sidebar (collapsible) */}
        {sidebarOpen && (
          <Sidebar
            view={sidebarView}
            result={result}
            currentPhase={currentPhase}
            hasError={hasError}
            isCompiling={isCompiling}
            activeFile={editorTab}
            onFileClick={handleFileClick}
            onCompile={triggerCompile}
          />
        )}

        {/* ── Right column: Editor + Panel ─────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Editor Group */}
          <EditorGroup
            source={source}
            onSourceChange={setSource}
            generatedCode={result?.generatedCode ?? ''}
            openTabs={openEditorTabs}
            activeTab={editorTab}
            onTabClick={setEditorTab}
            onTabClose={handleTabClose}
            onEnsureTab={handleEnsureTab}
            onCompile={triggerCompile}
            errors={liveErrors}
            symbolInfo={result?.symbolInfo ?? {}}
          />

          {/* Bottom Panel */}
          <div style={{ height: 220, flexShrink: 0, borderTop: '1px solid #3c3c3c', overflow: 'hidden' }}>
            <Panel
              errors={problemsErrors}
              outputLog={outputLog}
              optimizationLogs={result?.optimizationLogs ?? []}
              execution={execution}
              phase={currentPhase}
              activeTab={panelTab}
              onTabChange={setPanelTab}
              onExecute={() => { triggerExecute(); setPanelTab('terminal'); }}
              canExecute={Boolean(result?.generatedCode) && !hasError}
              ir={result?.ir ?? null}
              debugState={debugState}
              onStep={stepDebug}
              onReset={resetDebug}
              onRunAll={runDebug}
            />
          </div>
        </div>
      </div>

      {/* ── Status Bar ─────────────────────────────────────────────────── */}
      <StatusBar
        phase={currentPhase}
        errors={liveErrors}
        isCompiling={isCompiling}
      />
    </div>
  );
}
