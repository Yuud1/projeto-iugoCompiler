import type { Token } from '../../../types';
import { TokenType } from '@compiler/lexer/tokenTypes';

function tokenClass(type: TokenType): string {
  const kws = [TokenType.LET, TokenType.PRINT, TokenType.IF, TokenType.ELSE,
               TokenType.WHILE, TokenType.TRUE, TokenType.FALSE];
  const ops = [TokenType.PLUS, TokenType.MINUS, TokenType.STAR, TokenType.SLASH,
               TokenType.EQUAL, TokenType.EQUAL_EQUAL, TokenType.BANG_EQUAL,
               TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS,
               TokenType.LESS_EQUAL, TokenType.AND, TokenType.OR, TokenType.BANG];
  if (kws.includes(type)) return 'tok-keyword';
  if (type === TokenType.NUMBER) return 'tok-number';
  if (type === TokenType.STRING) return 'tok-string';
  if (type === TokenType.IDENTIFIER) return 'tok-ident';
  if (ops.includes(type))  return 'tok-operator';
  if (type === TokenType.UNKNOWN) return 'tok-unknown';
  return 'tok-symbol';
}

interface TokensViewProps {
  tokens: Token[];
}

export function TokensView({ tokens }: TokensViewProps) {
  const visible = tokens.filter(t => t.type !== TokenType.EOF);

  if (visible.length === 0) {
    return (
      <div style={{ padding: '12px 16px', color: 'var(--vsc-text-dim)', fontSize: 12 }}>
        Compile to see tokens
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 11 }}>
      {visible.map((t, i) => (
        <div
          key={i}
          className="tree-item"
          style={{ paddingLeft: 12, gap: 0, height: 19 }}
        >
          <span className={tokenClass(t.type)} style={{ width: 120, overflow: 'hidden', flexShrink: 0 }}>
            {t.type}
          </span>
          <span style={{ color: 'var(--vsc-text-dim)', width: 70, overflow: 'hidden' }}>
            {t.value ? `"${t.value}"` : ''}
          </span>
          <span style={{ color: '#555', marginLeft: 4 }}>
            {t.line}:{t.column}
          </span>
        </div>
      ))}
      <div style={{ padding: '4px 12px', color: '#555', fontSize: 11, borderTop: '1px solid #3c3c3c', marginTop: 4 }}>
        {visible.length} tokens
      </div>
    </div>
  );
}
