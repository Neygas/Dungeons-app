import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSessionStore } from '@/store/sessionStore'
import { CONDITIONS } from '@/data/conditions'
import { GEAR_DB } from '@/data/gear'
import { hpColor, calcArmorAC, passivePerception, mod } from '@/lib/calculations'
import type { Character, InitiativeEntry, LootItem, ShopItem } from '@/types'

type Tab = 'players' | 'initiative' | 'log' | 'loot' | 'shop' | 'notes'

// ── Helpers ────────────────────────────────────────────────────────────────────

const LOG_COLORS: Record<string, string> = {
  hp_change: 'var(--red)', spell_cast: 'var(--purple)', attack: 'var(--orange)',
  item_use: 'var(--teal)', condition: '#6b7280', death_save: '#b91c1c',
  rest: 'var(--green)', concentration: 'var(--purple)', note: 'var(--text3)',
  loot: '#d97706', shop: 'var(--gold)',
}

const LOG_LABELS: Record<string, string> = {
  hp_change: 'HP', spell_cast: 'Spell', attack: 'Atk', item_use: 'Item',
  condition: 'Cond', death_save: 'Death', rest: 'Rest', concentration: 'Conc',
  note: 'Note', loot: 'Loot', shop: 'Shop',
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

// ── Player Card ────────────────────────────────────────────────────────────────

function PlayerCard({ char, sessionId, isTurn }: { char: Character; sessionId: string; isTurn: boolean }) {
  const { dmPatchCharacter, logEntry } = useSessionStore()
  const [showCond, setShowCond] = useState(false)
  const [hpDelta, setHpDelta] = useState('')
  const [applying, setApplying] = useState(false)

  const hpPct = char.max_hp > 0 ? char.hp / char.max_hp : 1
  const isDying = char.hp <= 0 && !char.is_dead
  const ac = calcArmorAC(char)
  const pp = passivePerception(char)
  const initials = char.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const applyHpDelta = async () => {
    const trimmed = hpDelta.trim()
    if (!trimmed) return
    const num = parseInt(trimmed.replace('+', ''))
    if (isNaN(num)) return
    setApplying(true)
    const newHp = Math.min(char.max_hp, Math.max(0, char.hp + num))
    await dmPatchCharacter(char.id, { hp: newHp })
    const desc = num < 0
      ? `${char.name} took ${Math.abs(num)} damage (${char.hp} → ${newHp} HP)`
      : `${char.name} healed ${num} HP (${char.hp} → ${newHp} HP)`
    await logEntry(sessionId, char.name, 'hp_change', desc, { delta: num, before: char.hp, after: newHp }, char.id)
    setHpDelta('')
    setApplying(false)
  }

  const toggleCondition = async (cond: string) => {
    const current = char.conditions ?? []
    const next = current.includes(cond)
      ? current.filter(c => c !== cond)
      : [...current, cond]
    await dmPatchCharacter(char.id, { conditions: next })
    const action = next.includes(cond) ? 'gained' : 'lost'
    await logEntry(sessionId, char.name, 'condition', `${char.name} ${action} ${cond}`, {}, char.id)
  }

  return (
    <div
      style={{
        background: 'var(--white)',
        border: `1px solid ${isTurn ? 'var(--teal)' : 'var(--border)'}`,
        borderTop: 'none',
        transition: 'border-color .3s',
      }}
      className={isTurn ? 'your-turn-pulse' : ''}
    >
      {/* Top row */}
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--teal-light)', border: `2px solid ${isTurn ? 'var(--teal)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          {char.photo_url
            ? <img src={char.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal2)' }}>{initials}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: isTurn ? 'var(--teal2)' : 'var(--text)' }}>{char.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>Lvl {char.level} {char.race} {char.class}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>AC {ac}</div>
            <div style={{ fontSize: 9, color: 'var(--text3)' }}>armor</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 700 }}>PP {pp}</div>
            <div style={{ fontSize: 9, color: 'var(--text3)' }}>percep</div>
          </div>
        </div>
      </div>

      {/* HP bar + meta */}
      <div style={{ padding: '0 12px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: hpColor(hpPct) }}>{char.hp}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>/ {char.max_hp} HP</span>
          {char.temp_hp > 0 && <span style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600 }}>+{char.temp_hp} tmp</span>}
          {char.concentration_spell && (
            <span style={{ fontSize: 10, background: 'var(--purple-light)', color: 'var(--purple)', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>
              C: {char.concentration_spell}
            </span>
          )}
        </div>
        <div style={{ background: 'var(--border)', height: 5, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: 5, background: hpColor(hpPct), width: `${Math.max(0, Math.min(100, hpPct * 100))}%`, transition: 'width .3s, background .3s', borderRadius: 3 }} />
        </div>
      </div>

      {/* HP adjust */}
      <div style={{ padding: '0 12px 8px', display: 'flex', gap: 6 }}>
        <button
          onClick={() => setHpDelta(d => String((parseInt(d) || 0) - 1))}
          style={{ width: 28, height: 28, background: 'var(--border)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16, borderRadius: 2, fontFamily: 'inherit', color: 'var(--red)' }}
        >−</button>
        <input
          value={hpDelta}
          onChange={e => setHpDelta(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && applyHpDelta()}
          placeholder="+/−"
          style={{ flex: 1, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', textAlign: 'center', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: 'var(--text)' }}
        />
        <button
          onClick={() => setHpDelta(d => String((parseInt(d) || 0) + 1))}
          style={{ width: 28, height: 28, background: 'var(--border)', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16, borderRadius: 2, fontFamily: 'inherit', color: 'var(--green)' }}
        >+</button>
        <button
          onClick={applyHpDelta}
          disabled={!hpDelta.trim() || applying}
          style={{ padding: '4px 10px', background: hpDelta.trim() ? 'var(--teal)' : 'var(--border)', color: hpDelta.trim() ? '#fff' : 'var(--text3)', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', transition: 'all .15s' }}
        >
          Apply
        </button>
      </div>

      {/* Death saves */}
      {isDying && (
        <div style={{ padding: '2px 12px 8px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 700 }}>Dying:</span>
          <span style={{ fontSize: 12 }}>S: {'●'.repeat(char.death_successes ?? 0)}{'○'.repeat(3 - (char.death_successes ?? 0))}</span>
          <span style={{ fontSize: 12 }}>F: {'●'.repeat(char.death_failures ?? 0)}{'○'.repeat(3 - (char.death_failures ?? 0))}</span>
        </div>
      )}

      {/* Conditions */}
      <div style={{ padding: '0 12px 10px' }}>
        {(char.conditions?.length ?? 0) > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
            {char.conditions.map(cond => (
              <span key={cond} style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 3, fontWeight: 600 }}>{cond}</span>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowCond(!showCond)}
          style={{ fontSize: 11, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
        >
          {showCond ? 'Hide conditions ▲' : 'Edit conditions ▼'}
        </button>
        {showCond && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {CONDITIONS.map(cond => {
              const active = char.conditions?.includes(cond)
              return (
                <button
                  key={cond}
                  onClick={() => toggleCondition(cond)}
                  style={{ fontSize: 10, padding: '3px 7px', borderRadius: 3, border: `1px solid ${active ? '#92400e' : 'var(--border2)'}`, background: active ? '#fef3c7' : 'var(--white)', color: active ? '#92400e' : 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: active ? 700 : 400 }}
                >
                  {cond}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Initiative Row ─────────────────────────────────────────────────────────────

function InitEntryRow({ entry, idx, isCurrent, chars, onHpChange, onRemove }: {
  entry: InitiativeEntry
  idx: number
  isCurrent: boolean
  chars: Character[]
  onHpChange: (idx: number, newHp: number) => void
  onRemove: (idx: number) => void
}) {
  const char = entry.characterId ? chars.find(c => c.id === entry.characterId) : null
  const hp = char ? char.hp : (entry.hp ?? 0)
  const maxHp = char ? char.max_hp : (entry.maxHp ?? 1)
  const pct = maxHp > 0 ? hp / maxHp : 0

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
      background: isCurrent ? 'var(--teal-light)' : 'var(--white)',
      border: `1px solid ${isCurrent ? 'var(--teal)' : 'var(--border)'}`,
      borderTop: 'none', transition: 'all .2s',
    }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal2)', width: 28, textAlign: 'center', flexShrink: 0 }}>{entry.initiative}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{entry.name}</div>
        <div style={{ background: 'var(--border)', height: 3, borderRadius: 2, marginTop: 3 }}>
          <div style={{ height: 3, borderRadius: 2, background: hpColor(pct), width: `${Math.max(0, Math.min(100, pct * 100))}%` }} />
        </div>
      </div>
      {!entry.isPlayer ? (
        <>
          <input
            type="number"
            defaultValue={hp}
            onBlur={e => onHpChange(idx, parseInt(e.target.value) || 0)}
            style={{ width: 44, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', textAlign: 'center', fontSize: 13, fontFamily: 'inherit', outline: 'none', padding: '1px 2px', color: hpColor(pct) }}
          />
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>/{maxHp}</span>
          <button onClick={() => onRemove(idx)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 14, padding: '0 2px', fontFamily: 'inherit' }}>✕</button>
        </>
      ) : (
        <span style={{ fontSize: 13, fontWeight: 700, color: hpColor(pct) }}>{hp}/{maxHp}</span>
      )}
      {isCurrent && (
        <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: 'var(--teal)', padding: '2px 5px', borderRadius: 2, letterSpacing: .5, textTransform: 'uppercase' }}>TURN</span>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function DMDashboardScreen() {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const {
    activeSession, playerCharacters, combatLog, loading,
    loadSession, subscribeAll, unsubscribeAll,
    patchSession, setInitiative, nextTurn, clearLog,
  } = useSessionStore()

  const [tab, setTab] = useState<Tab>('players')

  // Initiative setup
  const [playerInits, setPlayerInits] = useState<Record<string, string>>({})
  const [enemyName, setEnemyName] = useState('')
  const [enemyHp, setEnemyHp] = useState('')
  const [enemyInit, setEnemyInit] = useState('')

  // Loot
  const [lootSearch, setLootSearch] = useState('')
  const [customLootName, setCustomLootName] = useState('')
  const [customLootDesc, setCustomLootDesc] = useState('')
  const [maxPerPlayer, setMaxPerPlayer] = useState('1')

  // Shop
  const [shopSearch, setShopSearch] = useState('')
  const [customShopName, setCustomShopName] = useState('')
  const [customShopPrice, setCustomShopPrice] = useState('')
  const [customShopDesc, setCustomShopDesc] = useState('')

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
      subscribeAll(sessionId)
    }
    return () => { unsubscribeAll() }
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback: re-fetch characters whenever player_character_ids changes
  useEffect(() => {
    if (!activeSession) return
    const ids: string[] = activeSession.player_character_ids ?? []
    if (ids.length === 0) return
    const currentIds = playerCharacters.map(c => c.id)
    const missing = ids.filter(id => !currentIds.includes(id))
    if (missing.length === 0) return
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('characters').select('*').in('id', missing).then(({ data }) => {
        if (data && data.length > 0) {
          useSessionStore.setState(s => ({ playerCharacters: [...s.playerCharacters, ...data] }))
        }
      })
    })
  }, [activeSession?.player_character_ids?.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync maxPerPlayer input when session loads
  useEffect(() => {
    if (activeSession?.loot_max_per_player) {
      setMaxPerPlayer(String(activeSession.loot_max_per_player))
    }
  }, [activeSession?.loot_max_per_player])

  if (loading && !activeSession) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text3)' }}>Loading session...</div>
  }
  if (!activeSession) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 12, color: 'var(--text3)' }}>
        <div>Session not found.</div>
        <button onClick={() => navigate('/dm')} style={{ color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>← Back to sessions</button>
      </div>
    )
  }

  const s = activeSession
  const currentEntry = s.initiative[s.current_turn] ?? null

  // ── Initiative handlers ──────────────────────────────────────────────────────

  const buildAndSetInitiative = () => {
    const playerEntries: InitiativeEntry[] = playerCharacters.map(c => ({
      id: c.id,
      name: c.name,
      initiative: parseInt(playerInits[c.id] ?? '0') || 0,
      isPlayer: true,
      characterId: c.id,
      hp: c.hp,
      maxHp: c.max_hp,
    }))
    const enemyEntries = s.initiative.filter(e => !e.isPlayer)
    const all = [...playerEntries, ...enemyEntries].sort((a, b) => b.initiative - a.initiative)
    setInitiative(all)
    patchSession({ combat_active: true })
  }

  const addEnemy = () => {
    if (!enemyName.trim()) return
    const hp = parseInt(enemyHp) || 10
    const newEntry: InitiativeEntry = {
      id: `enemy-${Date.now()}`,
      name: enemyName.trim(),
      initiative: parseInt(enemyInit) || 0,
      isPlayer: false,
      hp,
      maxHp: hp,
    }
    const updated = [...s.initiative, newEntry].sort((a, b) => b.initiative - a.initiative)
    setInitiative(updated)
    setEnemyName(''); setEnemyHp(''); setEnemyInit('')
  }

  const updateEnemyHp = (idx: number, newHp: number) => {
    const updated = s.initiative.map((e, i) => i === idx ? { ...e, hp: newHp } : e)
    patchSession({ initiative: updated })
  }

  const removeEntry = (idx: number) => {
    const updated = s.initiative.filter((_, i) => i !== idx)
    patchSession({ initiative: updated, current_turn: Math.min(s.current_turn, Math.max(0, updated.length - 1)) })
  }

  // ── Loot handlers ────────────────────────────────────────────────────────────

  const addLootFromDB = (item: { name: string; desc: string }) => {
    const existing = s.loot_pool ?? []
    if (existing.some(e => e.name === item.name)) return
    const newItem: LootItem = { id: `loot-${Date.now()}`, name: item.name, desc: item.desc, quantity: 1 }
    patchSession({ loot_pool: [...existing, newItem] })
  }

  const addCustomLoot = () => {
    if (!customLootName.trim()) return
    const existing = s.loot_pool ?? []
    const newItem: LootItem = { id: `loot-${Date.now()}`, name: customLootName.trim(), desc: customLootDesc.trim(), quantity: 1 }
    patchSession({ loot_pool: [...existing, newItem] })
    setCustomLootName(''); setCustomLootDesc('')
  }

  const removeLootItem = (itemId: string) => {
    patchSession({ loot_pool: (s.loot_pool ?? []).filter(i => i.id !== itemId) })
  }

  // ── Shop handlers ────────────────────────────────────────────────────────────

  const addShopFromDB = (item: { name: string; desc: string; cost: string }) => {
    const existing = s.shop_items ?? []
    if (existing.some(e => e.name === item.name)) return
    const price = parseFloat(item.cost.replace(/[^0-9.]/g, '')) || 0
    const newItem: ShopItem = { id: `shop-${Date.now()}`, name: item.name, desc: item.desc, price, category: 'Gear' }
    patchSession({ shop_items: [...existing, newItem] })
  }

  const addCustomShop = () => {
    if (!customShopName.trim()) return
    const existing = s.shop_items ?? []
    const newItem: ShopItem = { id: `shop-${Date.now()}`, name: customShopName.trim(), desc: customShopDesc, price: parseFloat(customShopPrice) || 0, category: 'Custom' }
    patchSession({ shop_items: [...existing, newItem] })
    setCustomShopName(''); setCustomShopPrice(''); setCustomShopDesc('')
  }

  const removeShopItem = (itemId: string) => {
    patchSession({ shop_items: (s.shop_items ?? []).filter(i => i.id !== itemId) })
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string }[] = [
    { id: 'players', label: 'Players' },
    { id: 'initiative', label: 'Initiative' },
    { id: 'log', label: 'Log' },
    { id: 'loot', label: 'Loot' },
    { id: 'shop', label: 'Shop' },
    { id: 'notes', label: 'Notes' },
  ]

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', paddingBottom: 80 }}>

      {/* ── Header ── */}
      <div style={{ background: 'var(--teal)', color: '#fff', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', height: 48 }}>
          <button onClick={() => navigate('/dm')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '8px 4px' }}>← Sessions</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{s.campaign_name}</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              Code: <span style={{ fontWeight: 700, letterSpacing: 1 }}>{s.id}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
            <span style={{ fontSize: 9, fontWeight: 700, background: s.combat_active ? 'rgba(220,53,69,.8)' : 'rgba(0,0,0,.25)', padding: '2px 6px', borderRadius: 3, letterSpacing: .5, textTransform: 'uppercase' }}>
              {s.combat_active ? 'In Combat' : 'Peace'}
            </span>
            <span style={{ fontSize: 10, opacity: 0.7 }}>{playerCharacters.length} players</span>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,.15)' }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ flex: 1, padding: '7px 2px', textAlign: 'center', fontSize: 10, fontWeight: 600, letterSpacing: '.3px', color: tab === t.id ? '#fff' : 'rgba(255,255,255,.55)', border: 'none', background: tab === t.id ? 'rgba(0,0,0,.18)' : 'none', cursor: 'pointer', fontFamily: 'inherit', borderBottom: tab === t.id ? '2px solid #fff' : '2px solid transparent', transition: 'color .15s' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Players Tab ─────────────────────────────────────────────────────────── */}
      {tab === 'players' && (
        <div>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Player Characters</span>
            {s.combat_active && currentEntry && (
              <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 600 }}>Turn: {currentEntry.name}</span>
            )}
          </div>

          {playerCharacters.length === 0 ? (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '28px 14px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No players have joined yet.<br />
              <strong style={{ color: 'var(--teal)' }}>Share code: {s.id}</strong>
            </div>
          ) : (
            playerCharacters.map(char => {
              const isTurn = s.combat_active && currentEntry?.characterId === char.id
              return <PlayerCard key={char.id} char={char} sessionId={s.id} isTurn={isTurn} />
            })
          )}
        </div>
      )}

      {/* ── Initiative Tab ───────────────────────────────────────────────────────── */}
      {tab === 'initiative' && (
        <div>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Initiative Order</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {s.combat_active && (
                <button
                  onClick={nextTurn}
                  style={{ padding: '5px 12px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}
                >
                  Next Turn
                </button>
              )}
              <button
                onClick={() => patchSession({ combat_active: !s.combat_active })}
                style={{ padding: '5px 12px', background: s.combat_active ? 'var(--red)' : 'var(--green)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}
              >
                {s.combat_active ? 'End Combat' : 'Start Combat'}
              </button>
            </div>
          </div>

          {s.initiative.length === 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '16px 14px', color: 'var(--text3)', fontSize: 13, textAlign: 'center' }}>
              Set player initiatives and add enemies below.
            </div>
          )}

          {s.initiative.map((entry, idx) => (
            <InitEntryRow
              key={entry.id}
              entry={entry}
              idx={idx}
              isCurrent={s.combat_active && idx === s.current_turn}
              chars={playerCharacters}
              onHpChange={updateEnemyHp}
              onRemove={removeEntry}
            />
          ))}

          {/* Set player initiatives */}
          {playerCharacters.length > 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Player Initiatives</div>
              {playerCharacters.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ flex: 1, fontSize: 13 }}>{c.name}</span>
                  <input
                    type="number"
                    value={playerInits[c.id] ?? ''}
                    onChange={e => setPlayerInits(p => ({ ...p, [c.id]: e.target.value }))}
                    placeholder="—"
                    style={{ width: 56, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', textAlign: 'center', fontSize: 15, fontFamily: 'inherit', outline: 'none', padding: '2px 4px' }}
                  />
                  <button
                    onClick={() => {
                      const dexMod = mod(c.dex)
                      const roll = Math.floor(Math.random() * 20) + 1 + dexMod
                      setPlayerInits(p => ({ ...p, [c.id]: String(roll) }))
                    }}
                    style={{ padding: '4px 8px', background: 'var(--border)', border: 'none', fontSize: 11, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--text2)' }}
                  >
                    Roll
                  </button>
                </div>
              ))}
              <button
                onClick={buildAndSetInitiative}
                style={{ display: 'block', width: '100%', marginTop: 10, padding: 10, background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}
              >
                Set Order & Start Combat
              </button>
            </div>
          )}

          {/* Add enemy */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Add Enemy</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <input
                value={enemyName}
                onChange={e => setEnemyName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEnemy()}
                placeholder="Name"
                style={{ flex: 2, minWidth: 80, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px' }}
              />
              <input
                value={enemyHp}
                onChange={e => setEnemyHp(e.target.value)}
                placeholder="HP"
                type="number"
                style={{ width: 60, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px', textAlign: 'center' }}
              />
              <input
                value={enemyInit}
                onChange={e => setEnemyInit(e.target.value)}
                placeholder="Init"
                type="number"
                style={{ width: 55, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px', textAlign: 'center' }}
              />
              <button
                onClick={addEnemy}
                style={{ padding: '5px 14px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}
              >
                + Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Log Tab ──────────────────────────────────────────────────────────────── */}
      {tab === 'log' && (
        <div>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Combat Log</span>
            <button onClick={clearLog} style={{ fontSize: 12, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Clear log</button>
          </div>

          {combatLog.length === 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '24px 14px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No entries yet. Actions in combat will appear here.
            </div>
          )}

          {combatLog.map(entry => (
            <div key={entry.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '9px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: LOG_COLORS[entry.type] ?? 'var(--text3)', padding: '2px 5px', borderRadius: 2, letterSpacing: .5, flexShrink: 0, marginTop: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {LOG_LABELS[entry.type] ?? entry.type}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13 }}>{entry.description}</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0, marginTop: 2, whiteSpace: 'nowrap' }}>{timeAgo(entry.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Loot Tab ─────────────────────────────────────────────────────────────── */}
      {tab === 'loot' && (
        <div>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Loot Pool</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Open for players</span>
              <div
                onClick={() => patchSession({ loot_open: !s.loot_open })}
                style={{ width: 36, height: 20, borderRadius: 10, border: `2px solid ${s.loot_open ? 'var(--teal)' : 'var(--border2)'}`, background: s.loot_open ? 'var(--teal)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'all .2s', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: 2, left: s.loot_open ? 16 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
              </div>
            </div>
          </div>

          {/* Max per player */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>Max items per player:</span>
            <input
              type="number"
              value={maxPerPlayer}
              onChange={e => setMaxPerPlayer(e.target.value)}
              onBlur={() => patchSession({ loot_max_per_player: Math.max(1, parseInt(maxPerPlayer) || 1) })}
              style={{ width: 50, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', textAlign: 'center', fontSize: 15, fontFamily: 'inherit', outline: 'none', padding: '2px 4px' }}
            />
          </div>

          {/* Loot items */}
          {(s.loot_pool ?? []).length === 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '16px 14px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No loot yet. Add items below.
            </div>
          )}
          {(s.loot_pool ?? []).map(item => {
            const claims = Object.values(s.loot_claims ?? {}).filter(arr => arr.includes(item.name)).length
            return (
              <div key={item.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                  {item.desc && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.desc}</div>}
                </div>
                {claims > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600 }}>{claims} claimed</span>
                )}
                <button onClick={() => removeLootItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 14, padding: '0 2px', fontFamily: 'inherit' }}>✕</button>
              </div>
            )
          })}

          {/* Custom loot */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Add Custom Item</div>
            <input value={customLootName} onChange={e => setCustomLootName(e.target.value)} placeholder="Item name" style={{ display: 'block', width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px', marginBottom: 6 }} />
            <input value={customLootDesc} onChange={e => setCustomLootDesc(e.target.value)} placeholder="Description (optional)" style={{ display: 'block', width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px', marginBottom: 8 }} />
            <button onClick={addCustomLoot} style={{ padding: '7px 16px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>+ Add</button>
          </div>

          {/* Loot from DB */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Add from Item Database</div>
            <input value={lootSearch} onChange={e => setLootSearch(e.target.value)} placeholder="Search gear, potions, magic items..." style={{ display: 'block', width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px', marginBottom: 6 }} />
            {lootSearch.trim().length > 0 && GEAR_DB
              .filter(g => g.name.toLowerCase().includes(lootSearch.toLowerCase()))
              .slice(0, 8)
              .map(g => (
                <div key={g.name} onClick={() => addLootFromDB(g)} style={{ padding: '7px 4px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--teal)' }}>
                  <span>{g.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{g.category}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── Shop Tab ─────────────────────────────────────────────────────────────── */}
      {tab === 'shop' && (
        <div>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Shop</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>Open for players</span>
              <div
                onClick={() => patchSession({ shop_open: !s.shop_open })}
                style={{ width: 36, height: 20, borderRadius: 10, border: `2px solid ${s.shop_open ? 'var(--teal)' : 'var(--border2)'}`, background: s.shop_open ? 'var(--teal)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'all .2s', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: 2, left: s.shop_open ? 16 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
              </div>
            </div>
          </div>

          {(s.shop_items ?? []).length === 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '16px 14px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No items in shop.</div>
          )}
          {(s.shop_items ?? []).map(item => (
            <div key={item.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                {item.desc && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.desc}</div>}
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>{item.price} gp</span>
              <button onClick={() => removeShopItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 14, padding: '0 2px', fontFamily: 'inherit' }}>✕</button>
            </div>
          ))}

          {/* Custom shop item */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Add Custom Item</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={customShopName} onChange={e => setCustomShopName(e.target.value)} placeholder="Item name" style={{ flex: 2, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px' }} />
              <input value={customShopPrice} onChange={e => setCustomShopPrice(e.target.value)} placeholder="gp" type="number" style={{ width: 70, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px', textAlign: 'center' }} />
            </div>
            <input value={customShopDesc} onChange={e => setCustomShopDesc(e.target.value)} placeholder="Description (optional)" style={{ display: 'block', width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px', marginBottom: 8 }} />
            <button onClick={addCustomShop} style={{ padding: '7px 16px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>+ Add</button>
          </div>

          {/* Shop from DB */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Add from Item Database</div>
            <input value={shopSearch} onChange={e => setShopSearch(e.target.value)} placeholder="Search gear, potions, magic items..." style={{ display: 'block', width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px', marginBottom: 6 }} />
            {shopSearch.trim().length > 0 && GEAR_DB
              .filter(g => g.name.toLowerCase().includes(shopSearch.toLowerCase()))
              .slice(0, 8)
              .map(g => (
                <div key={g.name} onClick={() => addShopFromDB(g)} style={{ padding: '7px 4px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--teal)' }}>{g.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{g.cost}</span>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* ── Notes Tab ────────────────────────────────────────────────────────────── */}
      {tab === 'notes' && (
        <div>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '8px 14px' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>DM Notes</span>
          </div>
          <textarea
            key={s.id}
            defaultValue={s.dm_notes ?? ''}
            onBlur={e => patchSession({ dm_notes: e.target.value })}
            placeholder="Private notes — players cannot see these..."
            style={{ display: 'block', width: '100%', minHeight: 420, border: '1px solid var(--border)', borderTop: 'none', background: 'var(--white)', resize: 'vertical', padding: 14, fontSize: 14, fontFamily: 'inherit', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6 }}
          />
        </div>
      )}
    </div>
  )
}
