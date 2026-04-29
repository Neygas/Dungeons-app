import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useCharacterStore } from '@/store/characterStore'
import { useSessionStore } from '@/store/sessionStore'
import { supabase } from '@/lib/supabase'
import type { Character, Session, LootItem, ShopItem, LootRarity } from '@/types'
import { RARITY_COLORS, RARITY_LABELS } from '@/data/lootTemplates'
import SwipeToDelete from '@/components/shared/SwipeToDelete'

function RarityBadge({ rarity }: { rarity?: LootRarity }) {
  if (!rarity) return null
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, color: '#fff',
      background: RARITY_COLORS[rarity],
      padding: '2px 5px', borderRadius: 2,
      letterSpacing: .3, textTransform: 'uppercase',
    }}>
      {RARITY_LABELS[rarity]}
    </span>
  )
}

function classIcon(cls: string) {
  const icons: Record<string, string> = {
    Barbarian: '⚔️', Bard: '🎵', Cleric: '✝️', Druid: '🌿', Fighter: '🛡️',
    Monk: '👊', Paladin: '⚜️', Ranger: '🏹', Rogue: '🗡️', Sorcerer: '✨',
    Warlock: '🔮', Wizard: '📚',
  }
  return icons[cls] ?? '🎲'
}

function CharacterCard({ character, sessionCode, onClick, onLeave, onDelete }: {
  character: Character
  sessionCode: string | null
  onClick: () => void
  onLeave: () => void
  onDelete: () => void
}) {
  const hpPercent = character.max_hp > 0 ? character.hp / character.max_hp : 1
  const hpColor = hpPercent > 0.5 ? 'var(--green)' : hpPercent > 0.2 ? 'var(--orange)' : 'var(--red)'

  return (
    <SwipeToDelete onDelete={onDelete}>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none' }}>
        <div
          onClick={onClick}
          style={{ padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--teal-light)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--white)')}
        >
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--teal-light)', border: '2px solid var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, overflow: 'hidden' }}>
            {character.photo_url
              ? <img src={character.photo_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : classIcon(character.class)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 2, color: character.inspiration ? 'var(--gold)' : 'var(--text)' }}>{character.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Level {character.level} {character.race} {character.class}</div>
            <div style={{ marginTop: 6, background: '#eee', height: 4, borderRadius: 2 }}>
              <div style={{ height: 4, borderRadius: 2, background: hpColor, width: `${Math.max(0, Math.min(100, hpPercent * 100))}%`, transition: 'width 300ms var(--ease-out)' }} />
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: hpColor }}>{character.hp}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>/ {character.max_hp} HP</div>
          </div>
        </div>

        {sessionCode && (
          <div style={{ padding: '6px 14px 10px', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, background: 'var(--teal-light)', color: 'var(--teal2)', padding: '3px 8px', borderRadius: 4, fontWeight: 600, flex: 1 }}>
              Session: <span style={{ letterSpacing: 1, fontWeight: 700 }}>{sessionCode}</span>
            </span>
            <button
              onClick={e => { e.stopPropagation(); onLeave() }}
              style={{ fontSize: 11, color: 'var(--red)', background: 'none', border: '1px solid var(--red)', padding: '3px 8px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Leave
            </button>
          </div>
        )}
      </div>
    </SwipeToDelete>
  )
}

export default function PlayerMenuScreen() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const { characters, loading, fetchCharacters, deleteCharacter } = useCharacterStore()
  const { joinSession, leaveSession, getJoinedSession, confirmLootClaims, purchaseItem } = useSessionStore()

  const [sessionCode, setSessionCode] = useState('')
  const [selectedCharId, setSelectedCharId] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  // Joined sessions data (for loot/shop)
  const [sessionDataMap, setSessionDataMap] = useState<Record<string, Session>>({})

  // Loot/shop modals
  const [lootModal, setLootModal] = useState<{ sessionId: string; charId: string } | null>(null)
  const [lootSelections, setLootSelections] = useState<string[]>([])
  const [shopModal, setShopModal] = useState<{ sessionId: string; charId: string } | null>(null)
  const [shopError, setShopError] = useState('')
  const [shopDetailItem, setShopDetailItem] = useState<ShopItem | null>(null)
  const [toast, setToast] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => {
    if (user) fetchCharacters(user.id)
  }, [user, fetchCharacters])

  // Auto-select first character that doesn't have an active session
  useEffect(() => {
    if (characters.length > 0 && !selectedCharId) {
      const free = characters.find(c => !getJoinedSession(c.id))
      setSelectedCharId(free?.id ?? characters[0].id)
    }
  }, [characters]) // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to each character's joined session to track loot/shop open state
  useEffect(() => {
    if (characters.length === 0) return
    const sessionIds = [...new Set(
      characters.map(c => getJoinedSession(c.id)).filter(Boolean) as string[]
    )]
    if (sessionIds.length === 0) return

    const channels = sessionIds.map(sid => {
      // Initial fetch
      supabase.from('sessions').select('*').eq('id', sid).single().then(({ data }) => {
        if (data) setSessionDataMap(prev => ({ ...prev, [sid]: data as Session }))
      })
      // Subscribe
      const ch = supabase
        .channel(`player-menu:${sid}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sid}` },
          (payload) => setSessionDataMap(prev => ({ ...prev, [sid]: payload.new as Session })))
        .subscribe()
      return ch
    })

    return () => { channels.forEach(ch => supabase.removeChannel(ch)) }
  }, [characters.map(c => getJoinedSession(c.id)).join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleJoin = async () => {
    if (!sessionCode.trim() || !selectedCharId) return
    setJoining(true)
    setJoinError('')
    const result = await joinSession(sessionCode.trim(), selectedCharId)
    setJoining(false)
    if (!result) {
      setJoinError('Session not found. Check the code and try again.')
    } else {
      setSessionCode('')
    }
  }

  const handleDelete = async (characterId: string) => {
    await deleteCharacter(characterId)
    setConfirmDeleteId(null)
    showToast('Character deleted')
  }

  const handleLeave = async (characterId: string) => {
    const sid = getJoinedSession(characterId)
    if (sid) setSessionDataMap(prev => { const next = { ...prev }; delete next[sid]; return next })
    await leaveSession(characterId)
  }

  // Loot helpers
  const getLootSession = () => lootModal ? sessionDataMap[lootModal.sessionId] : null
  const getShopSession = () => shopModal ? sessionDataMap[shopModal.sessionId] : null
  const getLootChar = () => lootModal ? characters.find(c => c.id === lootModal.charId) ?? null : null
  const getShopChar = () => shopModal ? characters.find(c => c.id === shopModal.charId) ?? null : null

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 0 80px' }}>
      {/* Header */}
      <div style={{ background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 48, position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '8px 4px' }}>← Home</button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>My Characters</span>
        <button onClick={signOut} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '8px 4px' }}>Sign out</button>
      </div>

      <div>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Characters</span>
          <button
            onClick={() => navigate('/characters/new')}
            style={{ fontSize: 13, color: 'var(--purple)', cursor: 'pointer', fontWeight: 500, background: 'none', border: 'none', fontFamily: 'inherit', padding: 0 }}
          >
            + New Character
          </button>
        </div>

        {loading && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: 20, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            Loading...
          </div>
        )}

        {!loading && characters.length === 0 && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎲</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No characters yet</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Create your first character to get started</div>
            <button
              onClick={() => navigate('/characters/new')}
              style={{ display: 'inline-block', padding: '11px 24px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}
            >
              Create Character
            </button>
          </div>
        )}

        {characters.map(c => {
          const sid = getJoinedSession(c.id)
          const sData = sid ? sessionDataMap[sid] : null
          return (
            <div key={c.id}>
              <CharacterCard
                character={c}
                sessionCode={sid}
                onClick={() => navigate(`/characters/${c.id}`)}
                onLeave={() => handleLeave(c.id)}
                onDelete={() => setConfirmDeleteId(c.id)}
              />
              {/* Loot / Shop buttons when DM opens them */}
              {sid && (
                <div style={{ display: 'flex', gap: 0, border: '1px solid var(--border)', borderTop: 'none' }}>
                  <button
                    onClick={() => sData?.loot_open ? setLootModal({ sessionId: sid, charId: c.id }) : undefined}
                    disabled={!sData?.loot_open}
                    style={{
                      flex: 1, padding: '9px 8px',
                      background: sData?.loot_open ? 'var(--teal-light)' : 'var(--bg)',
                      border: 'none', borderRight: '1px solid var(--border)',
                      color: sData?.loot_open ? 'var(--teal2)' : 'var(--text3)',
                      fontSize: 13, fontWeight: sData?.loot_open ? 700 : 400,
                      cursor: sData?.loot_open ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit', transition: 'all .2s',
                    }}
                  >
                    {sData?.loot_open ? 'Loot Available' : 'Loot Locked'}
                  </button>
                  <button
                    onClick={() => sData?.shop_open ? setShopModal({ sessionId: sid, charId: c.id }) : undefined}
                    disabled={!sData?.shop_open}
                    style={{
                      flex: 1, padding: '9px 8px',
                      background: sData?.shop_open ? 'var(--teal-light)' : 'var(--bg)',
                      border: 'none',
                      color: sData?.shop_open ? 'var(--teal2)' : 'var(--text3)',
                      fontSize: 13, fontWeight: sData?.shop_open ? 700 : 400,
                      cursor: sData?.shop_open ? 'pointer' : 'not-allowed',
                      fontFamily: 'inherit', transition: 'all .2s',
                    }}
                  >
                    {sData?.shop_open ? 'Shop Open' : 'Shop Closed'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Join session */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 12 }}>Join a Session</div>

          {joinError && (
            <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 8, padding: '6px 8px', background: '#fde8e8', borderRadius: 2 }}>{joinError}</div>
          )}

          {characters.length > 1 && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 5 }}>Join as</label>
              <select
                value={selectedCharId}
                onChange={e => setSelectedCharId(e.target.value)}
                style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', padding: '6px 2px', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: 'var(--text)', cursor: 'pointer' }}
              >
                {characters.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Lvl {c.level} {c.class}){getJoinedSession(c.id) ? ` — in ${getJoinedSession(c.id)}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {characters.length === 1 && (
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 10 }}>
              Joining as: <strong>{characters[0].name}</strong>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={sessionCode}
              onChange={e => { setSessionCode(e.target.value.toUpperCase()); setJoinError('') }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Session code (e.g. SWORD42)"
              style={{ flex: 1, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', padding: '7px 4px', fontSize: 15, color: 'var(--text)', outline: 'none', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: 1 }}
            />
            <button
              onClick={handleJoin}
              disabled={joining || !sessionCode.trim() || !selectedCharId}
              style={{ padding: '7px 16px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: (joining || !sessionCode.trim()) ? 0.6 : 1 }}
            >
              {joining ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Loot Modal ─────────────────────────────────────────────────────────── */}
      {lootModal && (() => {
        const sess = getLootSession()
        const char = getLootChar()
        if (!sess || !char) return null
        const items: LootItem[] = sess.loot_pool ?? []
        const maxPer = sess.loot_max_per_player ?? 1
        const selected = lootSelections
        const atMax = selected.length >= maxPer

        const toggle = (name: string) => {
          if (selected.includes(name)) {
            setLootSelections(selected.filter(n => n !== name))
          } else {
            if (atMax) return
            setLootSelections([...selected, name])
          }
        }

        const handleClaim = async () => {
          if (selected.length === 0) return
          const itemsToClaim = items.filter(i => selected.includes(i.name))
          // Optimistically update local session pool
          setSessionDataMap(prev => {
            const sid = lootModal!.sessionId
            const existing = prev[sid]
            if (!existing) return prev
            return { ...prev, [sid]: { ...existing, loot_pool: (existing.loot_pool ?? []).filter(i => !selected.includes(i.name)) } }
          })
          setLootSelections([])
          setLootModal(null)
          await confirmLootClaims(char, itemsToClaim)
          showToast(`${selected.length} item${selected.length > 1 ? 's' : ''} added to inventory!`)
        }

        return (
          <div onClick={e => { if (e.target === e.currentTarget) { setLootModal(null); setLootSelections([]) } }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ background: 'var(--white)', width: '100%', maxWidth: 600, borderRadius: '14px 14px 0 0', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>{sess.loot_title || 'Loot Pool'}</div>
                  <div style={{ fontSize: 12, color: atMax ? 'var(--teal2)' : 'var(--text3)' }}>
                    {selected.length}/{maxPer} selected — {char.name}
                  </div>
                </div>
                <button onClick={() => { setLootModal(null); setLootSelections([]) }} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, color: 'var(--text2)' }}>✕</button>
              </div>

              {/* Item list */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '0 16px' }}>
                {items.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 14, padding: 20 }}>No items available.</div>
                )}
                {items.map(item => {
                  const isSelected = selected.includes(item.name)
                  const disabled = !isSelected && atMax
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggle(item.name)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                        borderBottom: '1px solid var(--border)', cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.4 : 1,
                      }}
                    >
                      {/* Checkbox */}
                      <div style={{
                        width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${isSelected ? 'var(--teal)' : 'var(--border2)'}`,
                        background: isSelected ? 'var(--teal)' : 'var(--white)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                          <span style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</span>
                          <RarityBadge rarity={item.rarity} />
                        </div>
                        {item.desc && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{item.desc}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Claim button */}
              <div style={{ padding: 16, flexShrink: 0, borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={handleClaim}
                  disabled={selected.length === 0}
                  style={{
                    display: 'block', width: '100%', padding: 14,
                    background: selected.length > 0 ? 'var(--teal)' : 'var(--border)',
                    color: selected.length > 0 ? '#fff' : 'var(--text3)',
                    border: 'none', fontSize: 15, fontWeight: 700,
                    cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
                    borderRadius: 4, fontFamily: 'inherit', transition: 'all .15s',
                  }}
                >
                  {selected.length === 0 ? 'Select items to claim' : `Claim ${selected.length} item${selected.length > 1 ? 's' : ''} → Add to Inventory`}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Shop Item Detail ─────────────────────────────────────────────────── */}
      {shopDetailItem && shopModal && (() => {
        const char = getShopChar()
        if (!char) return null
        const totalGp = (char.gp ?? 0) + (char.pp ?? 0) * 10 + (char.ep ?? 0) * 0.5 + (char.sp ?? 0) * 0.1 + (char.cp ?? 0) * 0.01
        const canAfford = totalGp >= shopDetailItem.price
        return (
          <div
            onClick={e => { if (e.target === e.currentTarget) setShopDetailItem(null) }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <div style={{ background: 'var(--white)', borderRadius: 12, width: '100%', maxWidth: 360, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{shopDetailItem.name}</div>
                <button onClick={() => setShopDetailItem(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--bg)', cursor: 'pointer', fontSize: 15, color: 'var(--text2)', flexShrink: 0 }}>✕</button>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.5px' }}>{shopDetailItem.category}</div>
              {shopDetailItem.desc && (
                <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, marginBottom: 18, padding: '10px 12px', background: 'var(--bg)', borderRadius: 6 }}>
                  {shopDetailItem.desc}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: canAfford ? 'var(--gold)' : 'var(--red)' }}>{shopDetailItem.price} gp</div>
                  <div style={{ fontSize: 12, color: canAfford ? 'var(--text3)' : 'var(--red)' }}>
                    {char.name} has {char.gp} gp{!canAfford ? ' — not enough' : ''}
                  </div>
                </div>
              </div>
              <button
                onClick={async () => {
                  setShopError('')
                  const freshChar = useCharacterStore.getState().characters.find(c => c.id === char.id) ?? char
                  const result = await purchaseItem(freshChar, shopDetailItem)
                  if (result === 'insufficient_gold') {
                    setShopError(`Not enough gold for ${shopDetailItem.name}.`)
                  } else {
                    showToast(`Purchased ${shopDetailItem.name}!`)
                    setShopDetailItem(null)
                  }
                }}
                disabled={!canAfford}
                style={{
                  display: 'block', width: '100%', padding: 13,
                  background: canAfford ? 'var(--teal)' : 'var(--border)',
                  color: canAfford ? '#fff' : 'var(--text3)',
                  border: 'none', fontSize: 15, fontWeight: 700,
                  cursor: canAfford ? 'pointer' : 'not-allowed',
                  borderRadius: 4, fontFamily: 'inherit',
                }}
              >
                {canAfford ? `Buy for ${shopDetailItem.price} gp` : 'Not enough gold'}
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── Delete confirmation ──────────────────────────────────────────────── */}
      {confirmDeleteId && (() => {
        const char = characters.find(c => c.id === confirmDeleteId)
        if (!char) return null
        return (
          <div onClick={() => setConfirmDeleteId(null)} className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div onClick={e => e.stopPropagation()} className="modal-panel" style={{ background: 'var(--white)', borderRadius: 10, width: '100%', maxWidth: 340, padding: 22 }}>
              <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Delete character?</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 20 }}>
                <strong>{char.name}</strong> will be permanently deleted. This cannot be undone.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleDelete(confirmDeleteId)}
                  style={{ flex: 1, padding: 12, background: 'var(--red)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit' }}
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  style={{ flex: 1, padding: 12, background: 'var(--white)', color: 'var(--text2)', border: '1px solid var(--border2)', fontSize: 14, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: 'var(--teal)', color: '#fff', padding: '10px 22px', borderRadius: 20, fontSize: 14, fontWeight: 600, zIndex: 500, boxShadow: '0 4px 16px rgba(0,0,0,.2)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          {toast}
        </div>
      )}

      {/* ── Shop Modal ─────────────────────────────────────────────────────────── */}
      {shopModal && (() => {
        const sess = getShopSession()
        const char = getShopChar()
        if (!sess || !char) return null
        const items: ShopItem[] = sess.shop_items ?? []
        const totalGp = (char.gp ?? 0) + (char.pp ?? 0) * 10 + (char.ep ?? 0) * 0.5 + (char.sp ?? 0) * 0.1 + (char.cp ?? 0) * 0.01
        return (
          <div onClick={e => { if (e.target === e.currentTarget) { setShopModal(null); setShopError(''); setShopDetailItem(null) } }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div style={{ background: 'var(--white)', width: '100%', maxWidth: 600, borderRadius: '14px 14px 0 0', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>Shop</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {char.name} — {char.gp} gp ({totalGp.toFixed(1)} total)
                  </div>
                </div>
                <button onClick={() => { setShopModal(null); setShopError('') }} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, color: 'var(--text2)' }}>✕</button>
              </div>
              {shopError && (
                <div style={{ margin: '8px 16px 0', padding: '8px 12px', background: '#fde8e8', color: 'var(--red)', fontSize: 13, borderRadius: 4 }}>{shopError}</div>
              )}
              <div style={{ padding: 16 }}>
                {items.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 14, padding: 20 }}>No items in shop.</div>
                )}
                {items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setShopDetailItem(item)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--teal-light)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</div>
                      {item.desc && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{item.desc}</div>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)', flexShrink: 0 }}>{item.price} gp</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>›</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
