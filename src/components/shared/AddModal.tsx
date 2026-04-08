import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export default function AddModal({ open, onClose, title, children }: Props) {
  if (!open) return null
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 250, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <div style={{ background: 'var(--bg)', width: '100%', maxWidth: 600, height: '92vh', borderRadius: '14px 14px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Drag handle */}
        <div style={{ padding: '10px 0 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, background: 'var(--border2)', borderRadius: 2 }} />
        </div>
        {/* Title bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--border)', cursor: 'pointer', fontSize: 16, color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
