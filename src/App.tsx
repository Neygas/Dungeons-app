import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
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
