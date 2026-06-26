import type { ActivityView } from '../ActivityBar';
import type { CompilePhase, CompileResult } from '../../../types';
import { ExplorerView }  from './ExplorerView';
import { PipelineView } from './PipelineView';
import { TokensView }   from './TokensView';
import { ASTView }      from './ASTView';
import { IRView }       from './IRView';

interface SidebarProps {
  view: ActivityView;
  result: CompileResult | null;
  currentPhase: CompilePhase;
  hasError: boolean;
  isCompiling: boolean;
  activeFile: 'source' | 'output';
  onFileClick: (f: 'source' | 'output') => void;
  onCompile: () => void;
}

const TITLE: Record<ActivityView, string> = {
  explorer: 'EXPLORER',
  pipeline: 'RUN AND COMPILE',
  tokens:   'TOKENS',
  ast:      'AST VIEWER',
  ir:       'INTERMEDIATE REPR.',
};

export function Sidebar({
  view, result, currentPhase, hasError, isCompiling,
  activeFile, onFileClick, onCompile,
}: SidebarProps) {
  return (
    <div
      style={{
        width: 260, minWidth: 200, maxWidth: 400,
        background: 'var(--vsc-sidebar)',
        borderRight: '1px solid #3c3c3c',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* Section title */}
      <div
        style={{
          height: 35, display: 'flex', alignItems: 'center',
          padding: '0 12px', borderBottom: '1px solid #3c3c3c',
          fontSize: 11, fontWeight: 700, letterSpacing: '.08em',
          color: 'var(--vsc-text-dim)', userSelect: 'none',
        }}
      >
        {TITLE[view]}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {view === 'explorer' && (
          <ExplorerView activeFile={activeFile} onFileClick={onFileClick} />
        )}
        {view === 'pipeline' && (
          <PipelineView
            result={result}
            currentPhase={currentPhase}
            hasError={hasError}
            isCompiling={isCompiling}
            onCompile={onCompile}
          />
        )}
        {view === 'tokens' && (
          <TokensView tokens={result?.tokens ?? []} />
        )}
        {view === 'ast' && (
          <ASTView
            ast={result?.ast ?? null}
            optimizedAst={result?.optimizedAst ?? null}
          />
        )}
        {view === 'ir' && (
          <IRView ir={result?.ir ?? null} />
        )}
      </div>
    </div>
  );
}
