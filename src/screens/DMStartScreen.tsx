import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'

function generateCode() {
  const words = ['SWORD', 'FLAME', 'ROGUE', 'DRUID', 'OAKEN', 'STEEL', 'MAGIC', 'QUEST', 'BLADE', 'STORM']
  return words[Math.floor(Math.random() * words.length)]
}

export default function DMStartScreen() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const [campaignName, setCampaignName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

  const handleResume = async () => {
    if (!joinCode.trim()) return
    const code = joinCode.trim().toUpperCase()
    const { data } = await supabase.from('sessions').select('id').eq('id', code).eq('dm_user_id', user!.id).single()
    if (data) navigate(`/dm/${code}`)
    else setError('Session not found or you are not the DM.')
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

        {/* New campaign */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>New Campaign</div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Campaign Name</label>
            <input
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              placeholder="The Lost Mines of Phandelver"
              style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', padding: '7px 4px', fontSize: 15, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={loading || !campaignName.trim()}
            style={{ display: 'block', width: '100%', padding: 13, background: 'var(--teal)', color: '#fff', border: '1px solid var(--teal2)', fontSize: 15, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', opacity: (loading || !campaignName.trim()) ? 0.6 : 1 }}
          >
            {loading ? 'Creating...' : 'Start Session'}
          </button>
        </div>

        {/* Resume session */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>Resume Session</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Session code"
              style={{ flex: 1, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', padding: '7px 4px', fontSize: 15, color: 'var(--text)', outline: 'none', fontFamily: 'inherit' }}
            />
            <button
              onClick={handleResume}
              style={{ padding: '7px 16px', background: 'var(--white)', color: 'var(--teal)', border: '1px solid var(--teal)', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', whiteSpace: 'nowrap' }}
            >
              Resume
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
