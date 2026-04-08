import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase, supabaseConfigured } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import LandingScreen from '@/screens/LandingScreen'
import AuthScreen from '@/screens/AuthScreen'
import PlayerMenuScreen from '@/screens/PlayerMenuScreen'
import CharacterSheetScreen from '@/screens/CharacterSheetScreen'
import CharacterCreateScreen from '@/screens/CharacterCreateScreen'
import DMStartScreen from '@/screens/DMStartScreen'
import DMDashboardScreen from '@/screens/DMDashboardScreen'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore()
  if (loading) return <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}><div style={{ color: 'var(--text3)' }}>Loading...</div></div>
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function SetupBanner() {
  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '32px 24px', background: '#fff', border: '1px solid #e0e0e0', borderRadius: 4 }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#2d8070', marginBottom: 8 }}>Almost there!</div>
      <div style={{ fontSize: 14, color: '#555', marginBottom: 20, lineHeight: 1.6 }}>
        Supabase is not configured yet. Create a <code style={{ background: '#f3f0ff', padding: '1px 6px', borderRadius: 3, color: '#7c3aed' }}>.env</code> file in the project root:
      </div>
      <pre style={{ background: '#f7f7f7', border: '1px solid #e0e0e0', padding: '12px 14px', fontSize: 13, borderRadius: 3, overflowX: 'auto' }}>
{`VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key`}
      </pre>
      <div style={{ fontSize: 13, color: '#999', marginTop: 16 }}>
        Find these in your Supabase project → Settings → API. Then restart the dev server.
      </div>
    </div>
  )
}

export default function App() {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [setUser, setLoading])

  if (!supabaseConfigured) return <SetupBanner />

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingScreen />} />
        <Route path="/auth" element={<AuthScreen />} />
        <Route path="/characters" element={<RequireAuth><PlayerMenuScreen /></RequireAuth>} />
        <Route path="/characters/new" element={<RequireAuth><CharacterCreateScreen /></RequireAuth>} />
        <Route path="/characters/:id" element={<RequireAuth><CharacterSheetScreen /></RequireAuth>} />
        <Route path="/dm" element={<RequireAuth><DMStartScreen /></RequireAuth>} />
        <Route path="/dm/:sessionId" element={<RequireAuth><DMDashboardScreen /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
