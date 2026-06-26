import type { CompileError, ExecuteResult, IRProgram } from '../../types';
import type { OutputLine } from '../../services/compileOutput';
import type { DebugState } from '../../compiler/tacInterpreter';
import type { IRInstr } from '@compiler/ir/ir';

type PanelTab = 'terminal' | 'problems' | 'output' | 'debug';

interface PanelProps {
  errors: CompileError[];
  outputLog: OutputLine[];
  optimizationLogs: string[];
  execution: ExecuteResult | null;
  phase: string;
  activeTab: PanelTab;
  onTabChange: (t: PanelTab) => void;
  onExecute: () => void;
  canExecute: boolean;
  // debugger
  ir: IRProgram | null;
  debugState: DebugState | null;
  onStep: () => void;
  onReset: () => void;
  onRunAll: () => void;
}

function instrText(instr: IRInstr): string {
  switch (instr.kind) {
    case 'assign':  return `${instr.dest} = ${instr.src}`;
    case 'binop':   return `${instr.dest} = ${instr.left} ${instr.op} ${instr.right}`;
    case 'unop':    return `${instr.dest} = ${instr.op}${instr.operand}`;
    case 'label':   return `${instr.name}:`;
    case 'jump':    return `goto ${instr.target}`;
    case 'iffalse': return `iffalse ${instr.cond} goto ${instr.target}`;
    case 'print':   return `print ${instr.value}`;
    default: return '';
  }
}

function instrColor(instr: IRInstr): string {
  switch (instr.kind) {
    case 'label':   return '#dcdcaa';
    case 'jump':
    case 'iffalse': return '#c586c0';
    case 'binop':
    case 'unop':    return '#9cdcfe';
    case 'print':   return '#4ec9b0';
    default:        return '#d4d4d4';
  }
}

function isUserVar(name: string): boolean {
  return !/^t\d+$/.test(name);
}

function outputLineColor(style: OutputLine['style']): string {
  switch (style) {
    case 'header':  return '#cccccc';
    case 'dim':     return '#858585';
    case 'success': return '#4ec9b0';
    case 'error':   return '#f44747';
    case 'phase':   return '#569cd6';
    case 'code':    return '#ce9178';
    default:        return '#d4d4d4';
  }
}

export function Panel({
  errors, outputLog, optimizationLogs, execution, phase,
  activeTab, onTabChange, onExecute, canExecute,
  ir, debugState, onStep, onReset, onRunAll,
}: PanelProps) {
  const problemCount = errors.length;

  const tabStyle = (t: PanelTab): React.CSSProperties => ({
    padding: '0 16px', height: 35, border: 'none', cursor: 'pointer',
    background: 'transparent', fontSize: 12,
    color: activeTab === t ? 'var(--vsc-text-bright)' : 'var(--vsc-text-dim)',
    borderBottom: activeTab === t ? '1px solid #e7e7e7' : '1px solid transparent',
    display: 'flex', alignItems: 'center', gap: 6,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        height: 35, background: 'var(--vsc-panel-tab-bar)',
        borderTop: '1px solid #3c3c3c', borderBottom: '1px solid #3c3c3c',
        flexShrink: 0,
      }}>
        <button style={tabStyle('terminal')} onClick={() => onTabChange('terminal')}>TERMINAL</button>
        <button style={tabStyle('problems')} onClick={() => onTabChange('problems')}>
          PROBLEMS
          {problemCount > 0 && (
            <span style={{
              background: '#f44747', color: '#fff', borderRadius: 10,
              padding: '0 5px', fontSize: 11, fontWeight: 700,
            }}>{problemCount}</span>
          )}
        </button>
        <button style={tabStyle('output')} onClick={() => onTabChange('output')}>OUTPUT</button>
        <button style={tabStyle('debug')} onClick={() => onTabChange('debug')}>
          DEBUG
          {debugState && !debugState.done && !debugState.halted && (
            <span style={{
              background: '#4ec9b060', color: '#4ec9b0', borderRadius: 10,
              padding: '0 5px', fontSize: 11, fontWeight: 700,
            }}>{debugState.pc}</span>
          )}
        </button>

        <div style={{ flex: 1 }} />
        {canExecute && (
          <button onClick={onExecute} style={{
            marginRight: 8, padding: '3px 10px',
            background: '#4ec9b080', color: '#4ec9b0',
            border: '1px solid #4ec9b060', borderRadius: 2,
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>
            Run JS
          </button>
        )}
        <button style={{
          marginRight: 4, padding: '0 6px', height: 22,
          background: 'transparent', border: 'none',
          color: 'var(--vsc-text-dim)', cursor: 'pointer', fontSize: 16,
        }} title="Clear panel">Limpar</button>
      </div>

      {/* ── Content ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflow: 'auto', fontFamily: 'monospace', fontSize: 12 }}>

        {/* TERMINAL */}
        {activeTab === 'terminal' && (
          <div style={{ padding: '6px 12px' }}>
            <div style={{ color: '#4ec9b0', marginBottom: 4 }}>
              iugo-compiler&nbsp;<span style={{ color: 'var(--vsc-text-dim)' }}>%</span>&nbsp;
              <span style={{ color: '#d4d4d4' }}>iugo compile source.iugo</span>
            </div>
            {phase === 'idle' && (
              <div style={{ color: 'var(--vsc-text-dim)' }}>Ready — press Cmd+Enter or click Compilar</div>
            )}
            {phase === 'success' && errors.length === 0 && (
              <div style={{ color: '#4ec9b0' }}>Compilation successful — pipeline complete</div>
            )}
            {errors.map((e, i) => (
              <div key={i} style={{ color: '#f44747' }}>
                error [{e.phase}]{e.line ? ` ${e.line}:${e.column}` : ''} {e.message}
              </div>
            ))}
            {optimizationLogs.length > 0 && (
              <>
                <div style={{ color: 'var(--vsc-text-dim)', marginTop: 6 }}>— Optimizations —</div>
                {optimizationLogs.map((l, i) => (
                  <div key={i} style={{ color: '#569cd6' }}>{l}</div>
                ))}
              </>
            )}
            {execution && (
              <>
                <div style={{ color: 'var(--vsc-text-dim)', marginTop: 6 }}>— Program output —</div>
                {execution.output.map((line, i) => (
                  <div key={i} style={{ color: '#d4d4d4' }}>
                    <span style={{ color: '#4ec9b0' }}>&gt;</span>&nbsp;{line}
                  </div>
                ))}
                {execution.error && <div style={{ color: '#f44747' }}>error: {execution.error}</div>}
                {!execution.error && execution.output.length > 0 && (
                  <div style={{ color: '#4ec9b0' }}>Process exited with code 0</div>
                )}
              </>
            )}
            <div style={{ display: 'flex', marginTop: 4 }}>
              <span style={{ color: '#4ec9b0' }}>iugo-compiler&nbsp;</span>
              <span style={{ color: 'var(--vsc-text-dim)' }}>%&nbsp;</span>
              <span style={{ display: 'inline-block', width: 8, height: 14, background: '#aeafad', animation: 'blink 1s step-end infinite' }} />
            </div>
          </div>
        )}

        {/* PROBLEMS */}
        {activeTab === 'problems' && (
          <div>
            {errors.length === 0 ? (
              <div style={{ padding: '8px 12px', color: 'var(--vsc-text-dim)' }}>No problems detected</div>
            ) : (
              errors.map((e, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '5px 12px', borderBottom: '1px solid #2d2d2d',
                }}>
                  <span style={{ color: '#f44747', fontSize: 11, marginTop: 2 }}>!</span>
                  <div>
                    <div style={{ color: '#f1f1f1' }}>{e.message}</div>
                    <div style={{ color: 'var(--vsc-text-dim)', fontSize: 11 }}>
                      source.iugo {e.line ? `${e.line}:${e.column}` : ''} [{e.phase}]
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* OUTPUT — canal de compilação (estilo VS Code) */}
        {activeTab === 'output' && (
          <div style={{ padding: '6px 12px' }}>
            {outputLog.length === 0 ? (
              <div style={{ color: 'var(--vsc-text-dim)' }}>
                Nenhuma saída ainda — pressione Compilar para ver o resultado do pipeline.
              </div>
            ) : (
              outputLog.map((line, i) => (
                <div
                  key={i}
                  style={{
                    color: outputLineColor(line.style),
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                    fontStyle: line.style === 'dim' ? 'italic' : 'normal',
                  }}
                >
                  {line.text || '\u00A0'}
                </div>
              ))
            )}
          </div>
        )}

        {/* DEBUG */}
        {activeTab === 'debug' && (
          <DebugPanel
            ir={ir}
            debugState={debugState}
            onStep={onStep}
            onReset={onReset}
            onRunAll={onRunAll}
          />
        )}
      </div>
    </div>
  );
}

// ── Debugger panel ─────────────────────────────────────────────────────────

function DebugPanel({ ir, debugState, onStep, onReset, onRunAll }: {
  ir: IRProgram | null;
  debugState: DebugState | null;
  onStep: () => void;
  onReset: () => void;
  onRunAll: () => void;
}) {
  if (!ir || !debugState) {
    return (
      <div style={{ padding: '12px', color: 'var(--vsc-text-dim)', fontSize: 12 }}>
        Compile the program to start the debugger.
      </div>
    );
  }

  const { pc, env, output, done, halted } = debugState;

  // Variáveis do usuário (excluindo temporários t0, t1, …)
  const userVars = Object.entries(env).filter(([k]) => isUserVar(k));
  const temps    = Object.entries(env).filter(([k]) => !isUserVar(k));

  const btnStyle = (disabled: boolean, color = '#0078d4'): React.CSSProperties => ({
    padding: '3px 10px', fontSize: 11, fontWeight: 600,
    background: disabled ? '#333' : color + '33',
    color: disabled ? '#555' : color,
    border: `1px solid ${disabled ? '#444' : color + '66'}`,
    borderRadius: 2, cursor: disabled ? 'not-allowed' : 'pointer',
  });

  const isFinished = done || halted;

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Left: instrução list */}
      <div style={{ width: '55%', borderRight: '1px solid #3c3c3c', overflow: 'auto' }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', gap: 6, padding: '5px 8px',
          borderBottom: '1px solid #3c3c3c', background: '#252526', flexShrink: 0,
        }}>
          <button style={btnStyle(isFinished)} onClick={onStep} disabled={isFinished}>
            Step
          </button>
          <button style={btnStyle(isFinished, '#4ec9b0')} onClick={onRunAll} disabled={isFinished}>
            Run All
          </button>
          <button style={btnStyle(false, '#ce9178')} onClick={onReset}>
            Reset
          </button>
          <span style={{ marginLeft: 'auto', color: '#555', fontSize: 11, alignSelf: 'center' }}>
            {isFinished
              ? (halted ? 'halted (loop limit)' : 'done')
              : `pc = ${pc}`}
          </span>
        </div>

        {/* Instructions */}
        {ir.instructions.map((instr, i) => {
          const isLabel   = instr.kind === 'label';
          const isCurrent = i === pc && !isFinished;
          return (
            <div
              key={i}
              style={{
                padding: `1px ${isLabel ? '6px' : '20px'}`,
                background: isCurrent ? '#094771' : i < pc ? '#ffffff08' : 'transparent',
                borderLeft: isCurrent ? '2px solid #4ec9b0' : '2px solid transparent',
                fontFamily: 'monospace', fontSize: 11,
                display: 'flex', alignItems: 'center', gap: 8,
                minHeight: 20,
              }}
            >
              <span style={{ color: '#555', width: 22, textAlign: 'right', flexShrink: 0 }}>
                {i < pc ? 'ok' : isCurrent ? '>>' : String(i).padStart(2)}
              </span>
              <span style={{ color: instrColor(instr) }}>
                {instrText(instr)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Right: state */}
      <div style={{ flex: 1, overflow: 'auto', fontSize: 11 }}>
        {/* Variables */}
        <div style={{ padding: '5px 8px', color: '#dcdcaa', borderBottom: '1px solid #3c3c3c', fontWeight: 700 }}>
          Variables
        </div>
        {userVars.length === 0 ? (
          <div style={{ padding: '6px 10px', color: '#555' }}>—</div>
        ) : (
          userVars.map(([k, v]) => (
            <div key={k} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '2px 10px', borderBottom: '1px solid #2a2a2a',
            }}>
              <span style={{ color: '#9cdcfe' }}>{k}</span>
              <span style={{ color: typeof v === 'string' ? '#ce9178' : typeof v === 'boolean' ? '#569cd6' : '#b5cea8' }}>
                {typeof v === 'string' ? `"${v}"` : String(v)}
              </span>
            </div>
          ))
        )}

        {/* Temporaries */}
        {temps.length > 0 && (
          <>
            <div style={{ padding: '5px 8px', color: '#555', borderBottom: '1px solid #3c3c3c', fontWeight: 700 }}>
              Temporaries
            </div>
            {temps.map(([k, v]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '2px 10px', borderBottom: '1px solid #2a2a2a',
              }}>
                <span style={{ color: '#555' }}>{k}</span>
                <span style={{ color: '#666' }}>{typeof v === 'string' ? `"${v}"` : String(v)}</span>
              </div>
            ))}
          </>
        )}

        {/* Output */}
        {output.length > 0 && (
          <>
            <div style={{ padding: '5px 8px', color: '#4ec9b0', borderBottom: '1px solid #3c3c3c', fontWeight: 700 }}>
              Output
            </div>
            {output.map((line, i) => (
              <div key={i} style={{ padding: '2px 10px', color: '#d4d4d4', borderBottom: '1px solid #2a2a2a' }}>
                <span style={{ color: '#4ec9b0' }}>&gt;</span> {line}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
