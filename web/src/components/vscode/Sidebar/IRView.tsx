import type { IRProgram } from '../../../types';
import type { IRInstr } from '@compiler/ir/ir';

function instrClass(instr: IRInstr): string {
  switch (instr.kind) {
    case 'label':   return 'ir-label';
    case 'jump':    return 'ir-jump';
    case 'iffalse': return 'ir-branch';
    case 'binop':   return 'ir-op';
    case 'unop':    return 'ir-op';
    case 'assign':  return 'ir-assign';
    case 'print':   return 'ir-print';
    default:        return '';
  }
}

function InstrRow({ instr }: { instr: IRInstr }) {
  const isLabel = instr.kind === 'label';

  return (
    <div
      className="tree-item"
      style={{
        paddingLeft: isLabel ? 4 : 16,
        height: 20,
        fontSize: 11,
        fontFamily: 'monospace',
      }}
    >
      <span className={instrClass(instr)} style={{ whiteSpace: 'nowrap' }}>
        {formatInstr(instr)}
      </span>
    </div>
  );
}

function formatInstr(instr: IRInstr): string {
  switch (instr.kind) {
    case 'assign':  return `${instr.dest} = ${instr.src}`;
    case 'binop':   return `${instr.dest} = ${instr.left} ${instr.op} ${instr.right}`;
    case 'unop':    return `${instr.dest} = ${instr.op}${instr.operand}`;
    case 'label':   return `${instr.name}:`;
    case 'jump':    return `goto ${instr.target}`;
    case 'iffalse': return `iffalse ${instr.cond} goto ${instr.target}`;
    case 'print':   return `print ${instr.value}`;
    default: {
      const _never: never = instr;
      void _never;
      return '';
    }
  }
}

interface IRViewProps {
  ir: IRProgram | null;
}

export function IRView({ ir }: IRViewProps) {
  if (!ir) {
    return (
      <div style={{ padding: '12px 16px', color: 'var(--vsc-text-dim)', fontSize: 12 }}>
        Compile to see IR
      </div>
    );
  }

  const instrCount = ir.instructions.filter(i => i.kind !== 'label').length;
  const labelCount = ir.instructions.filter(i => i.kind === 'label').length;

  return (
    <div>
      {ir.instructions.map((instr, i) => (
        <InstrRow key={i} instr={instr} />
      ))}
      <div style={{
        padding: '4px 12px',
        color: '#555',
        fontSize: 11,
        borderTop: '1px solid #3c3c3c',
        marginTop: 4,
      }}>
        {instrCount} instruções · {labelCount} rótulos
      </div>
    </div>
  );
}
