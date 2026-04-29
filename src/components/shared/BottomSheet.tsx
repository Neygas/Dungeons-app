import { AnimatePresence, motion } from 'framer-motion'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number]

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={e => { if (e.target === e.currentTarget) onClose() }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.32, ease }}
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--white)', width: '100%', maxWidth: 600, height: '88vh', borderRadius: '14px 14px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div style={{ padding: '10px 0 4px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 36, height: 4, background: 'var(--border2)', borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
              <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, color: 'var(--text2)' }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 32 }}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
