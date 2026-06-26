import { useState } from 'react';

interface ExplorerViewProps {
  activeFile: 'source' | 'output';
  onFileClick: (f: 'source' | 'output') => void;
}

export function ExplorerView({ activeFile, onFileClick }: ExplorerViewProps) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      {/* Root project */}
      <div className="sidebar-section-hdr" onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 10, marginRight: 2, color: 'var(--vsc-text-dim)' }}>
          {open ? '▾' : '▸'}
        </span>
        IUGO-COMPILER
      </div>

      {open && (
        <div>
          {/* src folder */}
          <div
            className="tree-item"
            style={{ paddingLeft: 16 }}
          >
            <span style={{ color: 'var(--vsc-text-dim)', marginRight: 6, fontSize: 12 }}>▸</span>
            <FolderIcon />
            <span style={{ marginLeft: 6, color: 'var(--vsc-text)' }}>src</span>
          </div>

          {/* source.iugo */}
          <div
            className={`tree-item ${activeFile === 'source' ? 'active' : ''}`}
            style={{ paddingLeft: 32 }}
            onClick={() => onFileClick('source')}
          >
            <IugoFileIcon />
            <span style={{ marginLeft: 6, color: activeFile === 'source' ? '#fff' : 'var(--vsc-text)' }}>
              source.iugo
            </span>
          </div>

          {/* output.js */}
          <div
            className={`tree-item ${activeFile === 'output' ? 'active' : ''}`}
            style={{ paddingLeft: 32 }}
            onClick={() => onFileClick('output')}
          >
            <JsFileIcon />
            <span style={{ marginLeft: 6, color: activeFile === 'output' ? '#fff' : 'var(--vsc-text)' }}>
              output.js
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function FolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="#dcb67a">
      <path d="M14.5 3H7.71l-.85-.85L6.51 2h-5l-.5.5v11l.5.5h13l.5-.5v-10L14.5 3zm-.51 8.49v.01h-12V7h12v4.49zm0-5.49h-12V3.5L6.71 3.5l.85.85.35.15H14v2z"/>
    </svg>
  );
}

function IugoFileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="#519aba">
      <path d="M13.71 4.29l-3-3L10 1H4L3 2v12l1 1h9l1-1V5l-.29-.71zM13 14H4V2h5v4h4v8z"/>
    </svg>
  );
}

function JsFileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="#cbcb41">
      <path d="M13.71 4.29l-3-3L10 1H4L3 2v12l1 1h9l1-1V5l-.29-.71zM13 14H4V2h5v4h4v8z"/>
    </svg>
  );
}
