import { useNavigate, useParams } from 'react-router-dom'

export default function DMDashboardScreen() {
  const navigate = useNavigate()
  const { sessionId } = useParams()

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 80px' }}>
      <div style={{ background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 48, position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/dm')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '8px 4px' }}>← Sessions</button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Session: {sessionId}</span>
        <span style={{ fontSize: 13, opacity: 0.8 }}>DM</span>
      </div>
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
        DM Dashboard coming soon — Phase 2
      </div>
    </div>
  )
}
