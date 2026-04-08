import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function LandingScreen() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const handlePlayer = () => {
    if (user) navigate('/characters')
    else navigate('/auth?role=player')
  }

  const handleDM = () => {
    if (user) navigate('/dm')
    else navigate('/auth?role=dm')
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px' }}>
      <div style={{ textAlign: 'center', padding: '60px 0 8px', fontSize: 28, fontWeight: 700, color: 'var(--teal2)' }}>
        D&amp;D Companion
      </div>
      <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 14, marginBottom: 40 }}>
        5th Edition tools for players &amp; dungeon masters
      </div>

      <div
        onClick={handlePlayer}
        style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: 22, marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 2 }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal)'; (e.currentTarget as HTMLElement).style.background = 'var(--teal-light)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--white)' }}
      >
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Player</h3>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Manage characters, track spells, combat &amp; inventory</p>
        </div>
        <span style={{ fontSize: 20 }}>⚔️</span>
      </div>

      <div
        onClick={handleDM}
        style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: 22, marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 2 }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--teal)'; (e.currentTarget as HTMLElement).style.background = 'var(--teal-light)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--white)' }}
      >
        <div>
          <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>Dungeon Master</h3>
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>Run sessions, manage combat, shop &amp; players</p>
        </div>
        <span style={{ fontSize: 20 }}>🎲</span>
      </div>

      {!user && (
        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text3)' }}>
          <span
            style={{ color: 'var(--teal)', cursor: 'pointer', fontWeight: 500 }}
            onClick={() => navigate('/auth')}
          >
            Sign in
          </span>
          {' '}to save your characters across devices
        </div>
      )}
    </div>
  )
}
