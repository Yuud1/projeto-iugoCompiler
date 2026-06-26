import type { CompilePhase, CompileError } from '../../types';

interface StatusBarProps {
  phase: CompilePhase;
  errors: CompileError[];
  isCompiling: boolean;
}

export function StatusBar({ phase, errors, isCompiling }: StatusBarProps) {
  const hasErrors = errors.length > 0;

  const phaseLabel: Record<CompilePhase, string> = {
    idle:      'Ready',
    lexer:     'Lexing…',
    parser:    'Parsing…',
    semantic:  'Analyzing…',
    optimizer: 'Optimizing…',
    ir:        'Generating IR…',
    codegen:   'Generating JS…',
    success:   'Compiled',
    error:     'Error',
  };

  return (
    <div
      style={{
        height: 22, flexShrink: 0,
        background: '#007acc',
        display: 'flex', alignItems: 'center',
        paddingLeft: 8, paddingRight: 12,
        gap: 12, color: '#fff', fontSize: 12,
        userSelect: 'none',
      }}
    >
      {/* Left items */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>
          {errors.length} error{errors.length !== 1 ? 's' : ''}
        </span>
        <span style={{ opacity: 0.6 }}>|</span>
        <span>{phaseLabel[phase]}</span>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right items */}
      <span>iuGo</span>
      <span style={{ opacity: 0.6 }}>|</span>
      <span>UTF-8</span>
      <span style={{ opacity: 0.6 }}>|</span>
      <span>LF</span>
    </div>
  );
}
