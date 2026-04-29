import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import PageTransition from '@/components/shared/PageTransition'

export default function LandingScreen() {
  const navigate = useNavigate()
  const { user, loading } = useAuthStore()

  useEffect(() => {
    if (!loading && user) navigate('/characters', { replace: true })
  }, [user, loading, navigate])

  if (loading || user) return null

  return (
    <PageTransition>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎲</div>
          <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--teal2)', marginBottom: 8, letterSpacing: '-.5px' }}>D&amp;D Companion</div>
          <div style={{ fontSize: 15, color: 'var(--text3)', marginBottom: 48, lineHeight: 1.5 }}>
            5th Edition tools for players &amp; dungeon masters
          </div>

          <button
            onClick={() => navigate('/auth')}
            style={{ display: 'block', width: '100%', padding: '15px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 16, fontWeight: 600, cursor: 'pointer', borderRadius: 4, fontFamily: 'inherit', marginBottom: 12, letterSpacing: '.2px' }}
          >
            Get Started
          </button>
          <button
            onClick={() => navigate('/auth')}
            style={{ display: 'block', width: '100%', padding: '15px', background: 'var(--white)', color: 'var(--text2)', border: '1px solid var(--border2)', fontSize: 16, fontWeight: 500, cursor: 'pointer', borderRadius: 4, fontFamily: 'inherit' }}
          >
            Sign In
          </button>

          <div style={{ marginTop: 32, fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
            One account for both players and dungeon masters
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
