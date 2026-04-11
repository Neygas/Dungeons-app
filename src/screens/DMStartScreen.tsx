import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import type { Session } from '@/types'

function generateCode() {
  const words = ['SWORD', 'FLAME', 'ROGUE', 'DRUID', 'OAKEN', 'STEEL', 'MAGIC', 'QUEST', 'BLADE', 'STORM']
  return words[Math.floor(Math.random() * words.length)]
}

export default function DMStartScreen() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [campaignName, setCampaignName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeSessions, setActiveSessions] = useState<Session[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)

  // Load active sessions for this DM
  useEffect(() => {
    if (!user) return
    setSessionsLoading(true)
    supabase
      .from('sessions')
      .select('*')
      .eq('dm_user_id', user.id)
      .eq('active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setActiveSessions((data ?? []) as Session[])
        setSessionsLoading(false)
      })
  }, [user])

  const handleCreate = async () => {
    if (!user || !campaignName.trim()) return
    setLoading(true)
    setError('')

    const code = generateCode() + Math.floor(Math.random() * 100)

    const { data, error: err } = await supabase
      .from('sessions')
      .insert({
        id: code,
        dm_user_id: user.id,
        campaign_name: campaignName.trim(),
        player_character_ids: [],
        enemies: [],
        initiative: [],
        current_turn: 0,
        combat_active: false,
        shop_items: [],
        shop_open: false,
        loot_pool: [],
        loot_open: false,
        loot_max_per_player: 1,
        loot_claims: {},
        dm_notes: '',
        active: true,
      })
      .select()
      .single()

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      navigate(`/dm/${data.id}`)
    }
  }

  const handleEndSession = async (sessionId: string) => {
    await supabase.from('sessions').update({ active: false }).eq('id', sessionId)
    setActiveSessions(prev => prev.filter(s => s.id !== sessionId))
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 80px' }}>
      <div style={{ background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 48, position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '8px 4px' }}>← Home</button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>Dungeon Master</span>
        <button onClick={signOut} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '8px 4px' }}>Sign out</button>
      </div>

      <div style={{ padding: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', marginBottom: 16, borderRadius: 2, fontSize: 13, background: '#fde8e8', color: 'var(--red)', border: '1px solid var(--red)' }}>{error}</div>
        )}

        {/* Active sessions */}
        {!sessionsLoading && activeSessions.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '10px 16px' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Active Sessions</span>
            </div>
            {activeSessions.map(s => (
              <div key={s.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{s.campaign_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    Code: <span style={{ fontWeight: 700, letterSpacing: 1, color: 'var(--teal2)' }}>{s.id}</span>
                    {' · '}{(s.player_character_ids ?? []).length} player{(s.player_character_ids ?? []).length !== 1 ? 's' : ''}
                    {s.combat_active && <span style={{ marginLeft: 6, color: 'var(--red)', fontWeight: 600 }}>· In combat</span>}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/dm/${s.id}`)}
                  style={{ padding: '7px 16px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                >
                  Rejoin
                </button>
                <button
                  onClick={() => handleEndSession(s.id)}
                  style={{ padding: '7px 10px', background: 'var(--white)', color: 'var(--red)', border: '1px solid var(--red)', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', whiteSpace: 'nowrap' }}
                >
                  End
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New campaign */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>New Campaign</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Campaign Name</label>
            <input
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="The Lost Mines of Phandelver"
              style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', padding: '7px 4px', fontSize: 15, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={loading || !campaignName.trim()}
            style={{ display: 'block', width: '100%', padding: 13, background: 'var(--teal)', color: '#fff', border: '1px solid var(--teal2)', fontSize: 15, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', opacity: (loading || !campaignName.trim()) ? 0.6 : 1 }}
          >
            {loading ? 'Creating...' : 'Start New Session'}
          </button>
        </div>
      </div>
    </div>
  )
}
