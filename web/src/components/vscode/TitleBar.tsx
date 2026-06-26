interface TitleBarProps {
  filename?: string;
}

export function TitleBar({ filename = 'source.iugo' }: TitleBarProps) {
  return (
    <div
      className="shrink-0 flex items-center select-none"
      style={{
        height: 28,
        background: 'var(--vsc-titlebar)',
        borderBottom: '1px solid #252526',
        padding: '0 12px',
      }}
    >
      <span style={{ color: 'var(--vsc-text-dim)', fontSize: 12 }}>
        {filename} — iuGo Compiler
      </span>
    </div>
  );
}
