import { useUIStore } from '@/store/uiStore'

export default function Toast() {
  const { toasts } = useUIStore()
  if (toasts.length === 0) return null

  return (
    <div style={{ position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
      {toasts.map(t => (
        <div key={t.id} style={{ background: 'rgba(26,26,26,.92)', color: '#fff', padding: '10px 20px', borderRadius: 20, fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,.25)', animation: 'fadeIn .15s ease' }}>
          {t.message}
        </div>
      ))}
    </div>
  )
}
