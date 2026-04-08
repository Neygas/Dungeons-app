import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

type Mode = 'login' | 'signup' | 'magic'

export default function AuthScreen() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = searchParams.get('role')

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const redirect = role === 'dm' ? '/dm' : '/characters'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (mode === 'magic') {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + redirect } })
      if (error) setMessage({ type: 'error', text: error.message })
      else setMessage({ type: 'success', text: 'Check your email for a magic link!' })
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setMessage({ type: 'error', text: error.message })
      else setMessage({ type: 'success', text: 'Account created! Check your email to confirm.' })
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    } else {
      navigate(redirect)
    }
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + redirect },
    })
  }

  const handleAnonymous = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInAnonymously()
    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    } else {
      navigate(redirect)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '40px 16px' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', marginBottom: 24, cursor: 'pointer', color: 'var(--text3)', fontSize: 14 }}
        onClick={() => navigate('/')}
      >
        ← Back
      </div>

      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--teal2)', marginBottom: 4 }}>
        {mode === 'signup' ? 'Create account' : mode === 'magic' ? 'Magic link' : 'Sign in'}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 28 }}>
        {mode === 'magic' ? "We'll send you a link to sign in" : 'To save your characters across devices'}
      </div>

      {message && (
        <div style={{
          padding: '10px 14px',
          marginBottom: 16,
          borderRadius: 2,
          fontSize: 13,
          background: message.type === 'error' ? '#fde8e8' : 'var(--teal-light)',
          color: message.type === 'error' ? 'var(--red)' : 'var(--teal2)',
          border: `1px solid ${message.type === 'error' ? 'var(--red)' : 'var(--teal)'}`,
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', padding: '7px 4px', fontSize: 15, color: 'var(--text)', outline: 'none' }}
          />
        </div>

        {mode !== 'magic' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', padding: '7px 4px', fontSize: 15, color: 'var(--text)', outline: 'none' }}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ display: 'block', width: '100%', padding: 13, background: 'var(--teal)', color: '#fff', border: '1px solid var(--teal2)', fontSize: 15, fontWeight: 600, cursor: 'pointer', borderRadius: 2, marginBottom: 10, fontFamily: 'inherit', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Loading...' : mode === 'signup' ? 'Create account' : mode === 'magic' ? 'Send magic link' : 'Sign in'}
        </button>
      </form>

      <button
        onClick={handleGoogle}
        style={{ display: 'block', width: '100%', padding: 13, background: 'var(--white)', color: 'var(--text)', border: '1px solid var(--border2)', fontSize: 15, fontWeight: 500, cursor: 'pointer', borderRadius: 2, marginBottom: 10, fontFamily: 'inherit' }}
      >
        Continue with Google
      </button>

      <div style={{ display: 'flex', gap: 8, flexDirection: 'column', marginTop: 16 }}>
        {mode !== 'magic' && (
          <span style={{ fontSize: 13, color: 'var(--teal)', cursor: 'pointer', textAlign: 'center' }} onClick={() => setMode('magic')}>
            Use magic link instead
          </span>
        )}
        {mode === 'magic' && (
          <span style={{ fontSize: 13, color: 'var(--teal)', cursor: 'pointer', textAlign: 'center' }} onClick={() => setMode('login')}>
            Use password instead
          </span>
        )}
        {mode === 'login' && (
          <span style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
            No account?{' '}
            <span style={{ color: 'var(--teal)', cursor: 'pointer' }} onClick={() => setMode('signup')}>Sign up</span>
          </span>
        )}
        {mode === 'signup' && (
          <span style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
            Already have an account?{' '}
            <span style={{ color: 'var(--teal)', cursor: 'pointer' }} onClick={() => setMode('login')}>Sign in</span>
          </span>
        )}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 12, textAlign: 'center' }}>
          <span
            style={{ fontSize: 13, color: 'var(--text3)', cursor: 'pointer' }}
            onClick={handleAnonymous}
          >
            Continue as guest (no account)
          </span>
        </div>
      </div>
    </div>
  )
}
