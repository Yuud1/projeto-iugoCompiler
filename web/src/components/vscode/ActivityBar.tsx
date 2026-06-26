export type ActivityView = 'explorer' | 'pipeline' | 'tokens' | 'ast' | 'ir';

const ITEMS: { id: ActivityView; label: string; icon: JSX.Element }[] = [
  {
    id: 'explorer',
    label: 'Explorer',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.5 2H6.5C5.4 2 4.5 2.9 4.5 4v16c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 16h-9v-2h9v2zm0-4h-9v-2h9v2zm-3-4H7.5V8h6v2z"/>
      </svg>
    ),
  },
  {
    id: 'pipeline',
    label: 'Pipeline',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
    ),
  },
  {
    id: 'tokens',
    label: 'Tokens',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
      </svg>
    ),
  },
  {
    id: 'ast',
    label: 'AST',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
      </svg>
    ),
  },
  {
    id: 'ir',
    label: 'IR / TAC',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
      </svg>
    ),
  },
];

interface ActivityBarProps {
  active: ActivityView | null;
  onSelect: (v: ActivityView) => void;
}

export function ActivityBar({ active, onSelect }: ActivityBarProps) {
  return (
    <div
      className="shrink-0 flex flex-col items-center py-1"
      style={{ width: 48, background: 'var(--vsc-actbar)', borderRight: '1px solid #252526' }}
    >
      {ITEMS.map(item => (
        <button
          key={item.id}
          title={item.label}
          onClick={() => onSelect(item.id)}
          className="relative flex items-center justify-center w-12 h-12 transition-colors"
          style={{
            color: active === item.id ? 'var(--vsc-actbar-active)' : 'var(--vsc-actbar-icon)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {/* Active left border indicator */}
          {active === item.id && (
            <div
              className="absolute left-0 top-2 bottom-2"
              style={{ width: 2, background: 'var(--vsc-actbar-active)' }}
            />
          )}
          {item.icon}
        </button>
      ))}
    </div>
  );
}
