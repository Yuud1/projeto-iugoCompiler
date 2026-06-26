import { TokenType } from '@compiler/lexer/tokenTypes';
import type { CompilePhase, CompileResult } from '../../../types';

const PHASES: { id: CompilePhase; label: string; desc: string }[] = [
  { id: 'lexer',     label: 'Lexer',           desc: 'Source → Token[]' },
  { id: 'parser',    label: 'Parser',          desc: 'Token[] → AST' },
  { id: 'semantic',  label: 'Semantic',        desc: 'Type + scope check' },
  { id: 'optimizer', label: 'Optimizer',       desc: 'Fold · DCE · Propagate' },
  { id: 'ir',        label: 'IR Generator',    desc: 'AST → Three-Address Code' },
  { id: 'codegen',   label: 'Code Generator',  desc: 'AST → JavaScript' },
];

const ORDER: CompilePhase[] = ['idle', 'lexer', 'parser', 'semantic', 'optimizer', 'ir', 'codegen', 'success'];

const ERROR_PHASE_MAP: Record<string, CompilePhase> = {
  Lexer: 'lexer',
  Parser: 'parser',
  Semântico: 'semantic',
  Optimizer: 'optimizer',
  IR: 'ir',
  CodeGen: 'codegen',
};

function idx(p: CompilePhase) {
  const i = ORDER.indexOf(p);
  return i < 0 ? 0 : i;
}

type Status = 'done' | 'active' | 'error' | 'idle';

function status(
  phase: CompilePhase,
  current: CompilePhase,
  hasErr: boolean,
  failedPhase: CompilePhase | null,
): Status {
  if (current === 'idle') return 'idle';
  if (current === 'success') return 'done';

  const pi = idx(phase);
  const ci = idx(current);
  const fi = failedPhase ? idx(failedPhase) : -1;

  if (hasErr && failedPhase && pi === fi) return 'error';
  if (hasErr && failedPhase && pi > fi) return 'idle';
  if (pi < ci) return 'done';
  if (pi === ci) return hasErr && failedPhase && pi === fi ? 'error' : 'active';
  return 'idle';
}

function failedPhaseFromResult(result: CompileResult | null, hasError: boolean): CompilePhase | null {
  if (!result || !hasError) return null;
  const err = result.errors[0];
  if (err?.phase && ERROR_PHASE_MAP[err.phase]) return ERROR_PHASE_MAP[err.phase];
  if (result.phase !== 'success' && result.phase !== 'idle' && result.phase !== 'error') {
    return result.phase;
  }
  return null;
}

function phaseSummary(phase: CompilePhase, result: CompileResult | null): string | null {
  if (!result) return null;

  const tokenCount = result.tokens.filter(t => t.type !== TokenType.EOF).length;

  switch (phase) {
    case 'lexer':
      return tokenCount > 0 ? `${tokenCount} tokens` : null;
    case 'parser':
      return result.ast
        ? `AST · ${result.ast.statements.length} stmt(s) raiz`
        : null;
    case 'semantic': {
      const n = Object.keys(result.symbolInfo).length;
      if (n > 0) return `${n} símbolo(s) tipado(s)`;
      return result.ast ? 'sem erros semânticos' : null;
    }
    case 'optimizer':
      if (result.optimizationLogs.length === 0) return null;
      return result.optimizationLogs[0]!.replace(/^[^\s]+\s+/, '').slice(0, 42)
        + (result.optimizationLogs.length > 1 ? ` (+${result.optimizationLogs.length - 1})` : '');
    case 'ir':
      return result.ir ? `${result.ir.instructions.length} instr. TAC` : null;
    case 'codegen': {
      if (!result.generatedCode) return null;
      const lines = result.generatedCode.split('\n').filter(l => l.trim()).length;
      return `${lines} linhas → output.js`;
    }
    default:
      return null;
  }
}

const STATUS_LABEL: Record<Status, { text: string; color: string }> = {
  done:   { text: 'ok', color: '#4ec9b0' },
  active: { text: '..', color: '#569cd6' },
  error:  { text: '!', color: '#f44747' },
  idle:   { text: '-', color: '#555' },
};

interface PipelineViewProps {
  result: CompileResult | null;
  currentPhase: CompilePhase;
  hasError: boolean;
  isCompiling: boolean;
  onCompile: () => void;
}

export function PipelineView({
  result, currentPhase, hasError, isCompiling, onCompile,
}: PipelineViewProps) {
  const failed = failedPhaseFromResult(result, hasError);
  const showData = result !== null && (currentPhase !== 'idle' || !isCompiling);

  return (
    <div>
      <div style={{ padding: '8px 12px' }}>
        <button
          onClick={onCompile}
          disabled={isCompiling}
          style={{
            width: '100%', height: 28,
            background: isCompiling ? '#0e639c' : '#0078d4',
            color: '#fff', border: 'none', borderRadius: 2,
            fontSize: 12, fontWeight: 600, cursor: isCompiling ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}
        >
          {isCompiling ? 'Compilando…' : 'Compilar'}
        </button>
      </div>

      {showData && (
        <div style={{
          margin: '0 12px 8px', padding: '8px 10px',
          background: '#2d2d30', borderRadius: 3, fontSize: 11,
          borderLeft: `3px solid ${hasError ? '#f44747' : '#4ec9b0'}`,
          lineHeight: 1.45, wordBreak: 'break-word',
        }}>
          <div style={{ color: hasError ? '#f48771' : '#4ec9b0', fontWeight: 600, marginBottom: 4 }}>
            {isCompiling ? 'Executando pipeline…' : hasError ? 'Compilação falhou' : 'Compilação OK'}
          </div>
          {!isCompiling && hasError && result?.errors[0] && (
            <div style={{ color: 'var(--vsc-text-dim)', lineHeight: 1.4 }}>
              {result.errors[0].message}
            </div>
          )}
          {!isCompiling && !hasError && (
            <div style={{ color: 'var(--vsc-text-dim)' }}>
              Todas as fases concluídas
            </div>
          )}
        </div>
      )}

      {!showData && (
        <div style={{ padding: '4px 16px 8px', fontSize: 11, color: 'var(--vsc-text-dim)', lineHeight: 1.45 }}>
          Pressione Compilar para ver o resultado de cada fase.
        </div>
      )}

      <div className="sidebar-section-hdr" style={{ marginTop: 4 }}>
        PIPELINE
      </div>

      {PHASES.map((phase, i) => {
        const s = status(phase.id, currentPhase, hasError, failed);
        const summary = showData && (s === 'done' || s === 'error' || (s === 'active' && isCompiling))
          ? phaseSummary(phase.id, result)
          : null;
        const errMsg = s === 'error' && result?.errors[0]
          ? result.errors[0].message
          : null;

        return (
          <div key={phase.id}>
            <div className="pipeline-phase-row">
              <span style={{
                width: 20, fontSize: 10, display: 'flex',
                justifyContent: 'center', marginTop: 4, flexShrink: 0,
                color: STATUS_LABEL[s].color, fontWeight: 700,
                fontFamily: 'monospace',
              }}>
                {STATUS_LABEL[s].text}
              </span>
              <div style={{ marginLeft: 8, flex: 1, minWidth: 0 }}>
                <div style={{
                  color: s === 'idle' ? 'var(--vsc-text-dim)' : 'var(--vsc-text)',
                  fontSize: 12, fontWeight: s === 'active' ? 600 : 400,
                }}>
                  {phase.label}
                </div>
                <div style={{
                  fontSize: 10, color: 'var(--vsc-text-dim)', marginTop: 2,
                }}>
                  {phase.desc}
                </div>
                {summary && (
                  <div style={{
                    fontSize: 10, color: s === 'error' ? '#f48771' : '#9cdcfe',
                    marginTop: 4,
                  }}>
                    {errMsg ?? summary}
                  </div>
                )}
                {s === 'active' && isCompiling && !summary && (
                  <div style={{ fontSize: 10, color: '#569cd6', marginTop: 4 }}>
                    processando…
                  </div>
                )}
              </div>
            </div>
            {i < PHASES.length - 1 && (
              <div style={{ marginLeft: 24, borderLeft: '1px dashed #3c3c3c', height: 4, width: 0 }} />
            )}
          </div>
        );
      })}

      {showData && result && result.optimizationLogs.length > 0 && !hasError && (
        <>
          <div className="sidebar-section-hdr" style={{ marginTop: 8 }}>
            OTIMIZAÇÕES
          </div>
          {result.optimizationLogs.map((log, i) => (
            <div key={i} className="pipeline-opt-line">
              {log}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
