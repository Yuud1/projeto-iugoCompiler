import { useState } from 'react';
import { NodeKind, type ASTNode, type ProgramNode } from '@compiler/parser/ast';

function nodeClass(kind: NodeKind): string {
  switch (kind) {
    case NodeKind.Program:             return 'ast-program';
    case NodeKind.VariableDeclaration: return 'ast-vardecl';
    case NodeKind.Assignment:          return 'ast-assign';
    case NodeKind.PrintStatement:      return 'ast-print';
    case NodeKind.IfStatement:
    case NodeKind.WhileStatement:      return 'ast-if';
    case NodeKind.BlockStatement:      return 'ast-block';
    case NodeKind.BinaryExpression:
    case NodeKind.UnaryExpression:     return 'ast-binexpr';
    case NodeKind.Identifier:          return 'ast-ident';
    case NodeKind.NumberLiteral:       return 'ast-number';
    case NodeKind.StringLiteral:       return 'ast-string';
    case NodeKind.BooleanLiteral:      return 'ast-bool';
    default:                           return '';
  }
}

function nodeLabel(node: ASTNode): string {
  const n = node as unknown as Record<string, unknown>;
  switch (node.kind) {
    case NodeKind.Identifier:          return `Identifier  ${n.name}`;
    case NodeKind.NumberLiteral:       return `NumberLiteral  ${n.value}`;
    case NodeKind.StringLiteral:       return `StringLiteral  "${n.value}"`;
    case NodeKind.BooleanLiteral:      return `BooleanLiteral  ${n.value}`;
    case NodeKind.VariableDeclaration: return `VarDecl  ${n.name}`;
    case NodeKind.Assignment:          return `Assignment  ${n.name}`;
    case NodeKind.BinaryExpression:    return `BinaryExpr  ${n.operator}`;
    case NodeKind.UnaryExpression:     return `UnaryExpr  ${n.operator}`;
    default:                           return node.kind;
  }
}

function getChildren(node: ASTNode): ASTNode[] {
  const n = node as unknown as Record<string, unknown>;
  const pick = (...keys: string[]): ASTNode[] =>
    keys.flatMap(k => Array.isArray(n[k]) ? (n[k] as ASTNode[]) : n[k] ? [n[k] as ASTNode] : []);

  switch (node.kind) {
    case NodeKind.Program:             return pick('statements');
    case NodeKind.VariableDeclaration: return pick('initializer');
    case NodeKind.Assignment:          return pick('value');
    case NodeKind.PrintStatement:      return pick('argument');
    case NodeKind.IfStatement:         return pick('condition', 'consequent', 'alternate');
    case NodeKind.WhileStatement:      return pick('condition', 'body');
    case NodeKind.BlockStatement:      return pick('statements');
    case NodeKind.BinaryExpression:    return pick('left', 'right');
    case NodeKind.UnaryExpression:     return pick('operand');
    default:                           return [];
  }
}

interface NodeRowProps {
  node: ASTNode;
  depth: number;
}

function NodeRow({ node, depth }: NodeRowProps) {
  const children = getChildren(node);
  const [open, setOpen] = useState(depth < 2);

  return (
    <>
      <div
        className="tree-item"
        style={{ paddingLeft: depth * 12 + 6, height: 20, fontSize: 11 }}
        onClick={() => children.length > 0 && setOpen(o => !o)}
      >
        <span style={{ width: 10, color: '#555', marginRight: 4, fontSize: 9 }}>
          {children.length > 0 ? (open ? '▾' : '▸') : '·'}
        </span>
        <span className={nodeClass(node.kind)} style={{ fontFamily: 'monospace' }}>
          {nodeLabel(node)}
        </span>
      </div>
      {open && children.map((c, i) => <NodeRow key={i} node={c} depth={depth + 1} />)}
    </>
  );
}

interface ASTViewProps {
  ast: ProgramNode | null;
  optimizedAst: ProgramNode | null;
}

export function ASTView({ ast, optimizedAst }: ASTViewProps) {
  const [tab, setTab] = useState<'orig' | 'opt'>('orig');
  const current = tab === 'orig' ? ast : optimizedAst;

  const tabStyle = (t: 'orig' | 'opt') => ({
    padding: '2px 10px', fontSize: 11, border: 'none', cursor: 'pointer',
    background: tab === t ? 'var(--vsc-selected)' : 'transparent',
    color: tab === t ? '#fff' : 'var(--vsc-text-dim)',
  } as React.CSSProperties);

  return (
    <div>
      {/* mini tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #3c3c3c', marginBottom: 2 }}>
        <button style={tabStyle('orig')} onClick={() => setTab('orig')}>Original</button>
        <button style={tabStyle('opt')} onClick={() => setTab('opt')}>Optimized</button>
      </div>
      {!current ? (
        <div style={{ padding: '10px 16px', color: 'var(--vsc-text-dim)', fontSize: 12 }}>
          Compile to see AST
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <NodeRow node={current} depth={0} />
        </div>
      )}
    </div>
  );
}
