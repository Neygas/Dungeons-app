import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSessionStore } from '@/store/sessionStore'
import { CONDITIONS } from '@/data/conditions'
import { GEAR_DB, GEAR_CATEGORIES } from '@/data/gear'
import { PREMADE_LOOT_POOLS, RARITY_COLORS, RARITY_LABELS, type LootTemplate } from '@/data/lootTemplates'
import { CREATURE_DB } from '@/data/creatures'
import { hpColor, calcArmorAC, passivePerception, mod } from '@/lib/calculations'
import type { Character, InitiativeEntry, LootItem, ShopItem, LootRarity, CreatureAttack } from '@/types'

const TEMPLATES_KEY = 'dnd_loot_templates'
function loadTemplates(): LootTemplate[] {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) ?? '[]') } catch { return [] }
}
function saveTemplatesLocal(templates: LootTemplate[]) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
}

function RarityBadge({ rarity }: { rarity?: LootRarity }) {
  if (!rarity) return null
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, color: '#fff',
      background: RARITY_COLORS[rarity],
      padding: '2px 5px', borderRadius: 2,
      letterSpacing: .3, textTransform: 'uppercase', flexShrink: 0,
    }}>
      {RARITY_LABELS[rarity]}
    </span>
  )
}

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

    let newHp = char.hp
    let newTempHp = char.temp_hp ?? 0

    if (num < 0) {
      // Damage: temp HP absorbs first
      const damage = Math.abs(num)
      const absorbed = Math.min(newTempHp, damage)
      newTempHp = newTempHp - absorbed
      newHp = Math.max(0, newHp - (damage - absorbed))
    } else {
      // Healing never restores temp HP
      newHp = Math.min(char.max_hp, newHp + num)
    }

    const hpUpdates: Partial<Character> = { hp: newHp, temp_hp: newTempHp }
    if (newHp === 0) {
      hpUpdates.death_successes = 0
      hpUpdates.death_failures = 0
      hpUpdates.is_stable = false
      hpUpdates.is_dead = false
    }
    await dmPatchCharacter(char.id, hpUpdates)
    const desc = num < 0
      ? `${char.name} took ${Math.abs(num)} damage (${char.hp} → ${newHp} HP${newTempHp !== (char.temp_hp ?? 0) ? `, ${char.temp_hp ?? 0} → ${newTempHp} temp` : ''})`
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
    >
      {/* Top row */}
      <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--teal-light)', border: `2px solid ${isTurn ? 'var(--teal)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          {char.photo_url
            ? <img src={char.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--teal2)' }}>{initials}</span>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: isTurn ? 'var(--teal2)' : 'var(--text)' }}>{char.name}</span>
            {char.inspiration && (
              <span title="Has Inspiration" style={{ fontSize: 12, lineHeight: 1 }}>⭐</span>
            )}
          </div>
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
  const [showAttacks, setShowAttacks] = useState(false)
  const char = entry.characterId ? chars.find(c => c.id === entry.characterId) : null
  const hp = char ? char.hp : (entry.hp ?? 0)
  const maxHp = char ? char.max_hp : (entry.maxHp ?? 1)
  const pct = maxHp > 0 ? hp / maxHp : 0
  const attacks = entry.attacks ?? []

  return (
    <div style={{
      background: isCurrent ? 'var(--teal-light)' : 'var(--white)',
      border: `1px solid ${isCurrent ? 'var(--teal)' : 'var(--border)'}`,
      borderTop: 'none', transition: 'all .2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--teal2)', width: 28, textAlign: 'center', flexShrink: 0 }}>{entry.initiative}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{entry.name}</span>
            {entry.ac != null && <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>AC {entry.ac}</span>}
          </div>
          <div style={{ background: 'var(--border)', height: 3, borderRadius: 2, marginTop: 3 }}>
            <div style={{ height: 3, borderRadius: 2, background: hpColor(pct), width: `${Math.max(0, Math.min(100, pct * 100))}%` }} />
          </div>
        </div>
        {attacks.length > 0 && (
          <button
            onClick={() => setShowAttacks(v => !v)}
            style={{ fontSize: 10, padding: '2px 6px', border: '1px solid var(--border2)', background: showAttacks ? 'var(--orange)' : 'var(--white)', color: showAttacks ? '#fff' : 'var(--text2)', borderRadius: 2, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, flexShrink: 0 }}
          >
            ⚔ {showAttacks ? 'Hide' : 'Atk'}
          </button>
        )}
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
      {showAttacks && attacks.length > 0 && (
        <div style={{ padding: '0 12px 10px 48px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {attacks.map((atk, i) => (
            <div key={i} style={{ fontSize: 11, color: 'var(--text2)', background: 'var(--bg)', padding: '4px 8px', borderRadius: 3, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, color: 'var(--orange)' }}>{atk.name}</span>
              {' '}
              <span style={{ color: 'var(--teal2)' }}>+{atk.attackBonus} to hit</span>
              {atk.damageDice !== '0' && <span> · <span style={{ fontWeight: 600 }}>{atk.damageDice}</span> {atk.damageType}</span>}
              {atk.savingThrow && (
                <span style={{ color: 'var(--purple)' }}> · DC {atk.savingThrow.dc} {atk.savingThrow.ability} save: {atk.savingThrow.effect}</span>
              )}
            </div>
          ))}
        </div>
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
  const [detailChar, setDetailChar] = useState<Character | null>(null)

  // Initiative setup
  const [playerInits, setPlayerInits] = useState<Record<string, string>>({})
  const [enemyName, setEnemyName] = useState('')
  const [enemyHp, setEnemyHp] = useState('')
  const [enemyAc, setEnemyAc] = useState('')
  const [enemyInit, setEnemyInit] = useState('')

  // Enemy add mode
  const [enemyMode, setEnemyMode] = useState<'custom' | 'db'>('custom')
  const [enemyDbSearch, setEnemyDbSearch] = useState('')
  const [pendingAttacks, setPendingAttacks] = useState<CreatureAttack[]>([])

  // Custom attack builder
  const [atkName, setAtkName] = useState('')
  const [atkBonus, setAtkBonus] = useState('')
  const [atkDamage, setAtkDamage] = useState('')
  const [atkType, setAtkType] = useState('')
  const [atkHasSave, setAtkHasSave] = useState(false)
  const [atkSaveAbility, setAtkSaveAbility] = useState('CON')
  const [atkSaveDc, setAtkSaveDc] = useState('')
  const [atkSaveEffect, setAtkSaveEffect] = useState('')

  // Loot
  const [customLootName, setCustomLootName] = useState('')
  const [customLootDesc, setCustomLootDesc] = useState('')
  const [maxPerPlayer, setMaxPerPlayer] = useState('1')
  const [lootTitle, setLootTitle] = useState('')
  const [lootPickerOpen, setLootPickerOpen] = useState(false)
  const [lootPickerSearch, setLootPickerSearch] = useState('')
  const [lootPickerCat, setLootPickerCat] = useState('All')
  const [savedTemplates, setSavedTemplates] = useState<LootTemplate[]>(loadTemplates)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [saveTemplateName, setSaveTemplateName] = useState('')

  // Shop
  const [customShopName, setCustomShopName] = useState('')
  const [customShopPrice, setCustomShopPrice] = useState('')
  const [customShopDesc, setCustomShopDesc] = useState('')
  const [shopPickerOpen, setShopPickerOpen] = useState(false)
  const [shopPickerSearch, setShopPickerSearch] = useState('')
  const [shopPickerCat, setShopPickerCat] = useState('All')

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
      subscribeAll(sessionId)
    }
    return () => { unsubscribeAll() }
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync maxPerPlayer + lootTitle when session loads
  useEffect(() => {
    if (activeSession?.loot_max_per_player) {
      setMaxPerPlayer(String(activeSession.loot_max_per_player))
    }
    if (activeSession?.loot_title !== undefined) {
      setLootTitle(activeSession.loot_title ?? '')
    }
  }, [activeSession?.loot_max_per_player, activeSession?.loot_title])

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
    const ac = parseInt(enemyAc) || undefined
    const newEntry: InitiativeEntry = {
      id: `enemy-${Date.now()}`,
      name: enemyName.trim(),
      initiative: parseInt(enemyInit) || 0,
      isPlayer: false,
      hp,
      maxHp: hp,
      ac,
      attacks: pendingAttacks.length > 0 ? [...pendingAttacks] : undefined,
    }
    const updated = [...s.initiative, newEntry].sort((a, b) => b.initiative - a.initiative)
    setInitiative(updated)
    setEnemyName(''); setEnemyHp(''); setEnemyAc(''); setEnemyInit('')
    setPendingAttacks([])
  }

  const addCustomAttack = () => {
    if (!atkName.trim() || !atkDamage.trim()) return
    const attack: CreatureAttack = {
      name: atkName.trim(),
      attackBonus: parseInt(atkBonus) || 0,
      damageDice: atkDamage.trim(),
      damageType: atkType.trim() || 'unspecified',
      savingThrow: atkHasSave ? { ability: atkSaveAbility, dc: parseInt(atkSaveDc) || 10, effect: atkSaveEffect.trim() } : null,
    }
    setPendingAttacks(p => [...p, attack])
    setAtkName(''); setAtkBonus(''); setAtkDamage(''); setAtkType('')
    setAtkHasSave(false); setAtkSaveDc(''); setAtkSaveEffect('')
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

  const addLootFromDB = (item: { name: string; desc: string }, rarity?: LootRarity) => {
    const existing = s.loot_pool ?? []
    if (existing.some(e => e.name === item.name)) return
    const newItem: LootItem = { id: `loot-${Date.now()}`, name: item.name, desc: item.desc, quantity: 1, rarity }
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

  const loadPremadePool = (template: LootTemplate) => {
    const withUniqueIds = template.items.map(item => ({ ...item, id: `loot-${Date.now()}-${Math.random()}` }))
    patchSession({ loot_pool: withUniqueIds, loot_title: template.name })
    setLootTitle(template.name)
  }

  const loadSavedTemplate = (template: LootTemplate) => {
    const withUniqueIds = template.items.map(item => ({ ...item, id: `loot-${Date.now()}-${Math.random()}` }))
    patchSession({ loot_pool: withUniqueIds, loot_title: template.name })
    setLootTitle(template.name)
  }

  const saveCurrentAsTemplate = () => {
    if (!saveTemplateName.trim()) return
    const template: LootTemplate = {
      id: `tmpl-${Date.now()}`,
      name: saveTemplateName.trim(),
      rarity: 'common',
      items: s.loot_pool ?? [],
    }
    const next = [...savedTemplates, template]
    setSavedTemplates(next)
    saveTemplatesLocal(next)
    setSaveTemplateName('')
    setShowSaveTemplate(false)
  }

  const deleteSavedTemplate = (id: string) => {
    const next = savedTemplates.filter(t => t.id !== id)
    setSavedTemplates(next)
    saveTemplatesLocal(next)
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
              return (
                <div key={char.id}>
                  <PlayerCard char={char} sessionId={s.id} isTurn={isTurn} />
                  <button
                    onClick={() => setDetailChar(char)}
                    style={{ display: 'block', width: '100%', padding: '6px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderTop: 'none', fontSize: 11, color: 'var(--teal2)', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', fontWeight: 500 }}
                  >
                    View details →
                  </button>
                </div>
              )
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
            {/* Mode toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Add Enemy</div>
              <div style={{ display: 'flex', border: '1px solid var(--border2)', borderRadius: 3, overflow: 'hidden' }}>
                <button onClick={() => setEnemyMode('custom')} style={{ padding: '4px 10px', background: enemyMode === 'custom' ? 'var(--teal)' : 'var(--white)', color: enemyMode === 'custom' ? '#fff' : 'var(--text2)', fontSize: 11, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Custom</button>
                <button onClick={() => setEnemyMode('db')} style={{ padding: '4px 10px', background: enemyMode === 'db' ? 'var(--teal)' : 'var(--white)', color: enemyMode === 'db' ? '#fff' : 'var(--text2)', fontSize: 11, border: 'none', borderLeft: '1px solid var(--border2)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>From Database</button>
              </div>
            </div>

            {/* Database picker */}
            {enemyMode === 'db' && (
              <div style={{ marginBottom: 10 }}>
                <input
                  value={enemyDbSearch}
                  onChange={e => setEnemyDbSearch(e.target.value)}
                  placeholder="Search creatures..."
                  style={{ display: 'block', width: '100%', border: '1px solid var(--border2)', borderRadius: 3, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', outline: 'none', marginBottom: 6, boxSizing: 'border-box' }}
                />
                <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 3 }}>
                  {CREATURE_DB
                    .filter(c => !enemyDbSearch.trim() || c.name.toLowerCase().includes(enemyDbSearch.toLowerCase()))
                    .map(c => (
                      <div
                        key={c.name}
                        onClick={() => {
                          setEnemyName(c.name)
                          setEnemyHp(String(c.hp))
                          setEnemyAc(String(c.ac))
                          setPendingAttacks(c.attacks)
                          setEnemyDbSearch('')
                        }}
                        style={{ padding: '8px 10px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--teal-light)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                      >
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>CR {c.cr} · AC {c.ac} · {c.hp} HP</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Name / HP / AC / Init fields */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              <input value={enemyName} onChange={e => setEnemyName(e.target.value)} placeholder="Name" style={{ flex: 2, minWidth: 80, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px' }} />
              <input value={enemyHp} onChange={e => setEnemyHp(e.target.value)} placeholder="HP" type="number" style={{ width: 52, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px', textAlign: 'center' }} />
              <input value={enemyAc} onChange={e => setEnemyAc(e.target.value)} placeholder="AC" type="number" style={{ width: 48, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px', textAlign: 'center' }} />
              <input value={enemyInit} onChange={e => setEnemyInit(e.target.value)} placeholder="Init" type="number" style={{ width: 42, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px', textAlign: 'center' }} />
              <button onClick={() => setEnemyInit(String(Math.floor(Math.random() * 20) + 1))} style={{ padding: '4px 6px', background: 'var(--border)', border: 'none', fontSize: 13, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--text2)', flexShrink: 0 }} title="Roll d20">🎲</button>
            </div>

            {/* Pending attacks list */}
            {pendingAttacks.length > 0 && (
              <div style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {pendingAttacks.map((atk, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 8px', background: 'var(--bg)', borderRadius: 3, fontSize: 11 }}>
                    <span style={{ flex: 1, color: 'var(--text2)' }}>
                      <span style={{ fontWeight: 700 }}>{atk.name}</span> +{atk.attackBonus} · {atk.damageDice} {atk.damageType}
                      {atk.savingThrow && <span style={{ color: 'var(--purple)' }}> · DC {atk.savingThrow.dc} {atk.savingThrow.ability}</span>}
                    </span>
                    <button onClick={() => setPendingAttacks(p => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'inherit' }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {/* Custom attack builder */}
            {enemyMode === 'custom' && (
              <div style={{ marginBottom: 8, padding: '8px 10px', background: 'var(--bg)', borderRadius: 3 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Add Attack</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 5 }}>
                  <input value={atkName} onChange={e => setAtkName(e.target.value)} placeholder="Name" style={{ flex: 2, minWidth: 70, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 12, fontFamily: 'inherit', outline: 'none', padding: '3px 2px' }} />
                  <input value={atkBonus} onChange={e => setAtkBonus(e.target.value)} placeholder="+hit" type="number" style={{ width: 44, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 12, fontFamily: 'inherit', outline: 'none', padding: '3px 2px', textAlign: 'center' }} />
                  <input value={atkDamage} onChange={e => setAtkDamage(e.target.value)} placeholder="1d6+2" style={{ width: 56, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 12, fontFamily: 'inherit', outline: 'none', padding: '3px 2px', textAlign: 'center' }} />
                  <input value={atkType} onChange={e => setAtkType(e.target.value)} placeholder="type" style={{ width: 60, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 12, fontFamily: 'inherit', outline: 'none', padding: '3px 2px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: atkHasSave ? 6 : 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={atkHasSave} onChange={e => setAtkHasSave(e.target.checked)} />
                    Saving throw
                  </label>
                  <button onClick={addCustomAttack} disabled={!atkName.trim() || !atkDamage.trim()} style={{ marginLeft: 'auto', padding: '3px 10px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', opacity: (!atkName.trim() || !atkDamage.trim()) ? 0.5 : 1 }}>+ Add Attack</button>
                </div>
                {atkHasSave && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    <select value={atkSaveAbility} onChange={e => setAtkSaveAbility(e.target.value)} style={{ border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 12, fontFamily: 'inherit', outline: 'none', padding: '3px 2px' }}>
                      {['STR','DEX','CON','INT','WIS','CHA'].map(a => <option key={a}>{a}</option>)}
                    </select>
                    <input value={atkSaveDc} onChange={e => setAtkSaveDc(e.target.value)} placeholder="DC" type="number" style={{ width: 44, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 12, fontFamily: 'inherit', outline: 'none', padding: '3px 2px', textAlign: 'center' }} />
                    <input value={atkSaveEffect} onChange={e => setAtkSaveEffect(e.target.value)} placeholder="Effect on fail" style={{ flex: 1, minWidth: 100, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 12, fontFamily: 'inherit', outline: 'none', padding: '3px 2px' }} />
                  </div>
                )}
              </div>
            )}

            <button onClick={addEnemy} disabled={!enemyName.trim()} style={{ padding: '7px 16px', background: enemyName.trim() ? 'var(--teal)' : 'var(--border)', color: enemyName.trim() ? '#fff' : 'var(--text3)', border: 'none', fontSize: 13, fontWeight: 600, cursor: enemyName.trim() ? 'pointer' : 'not-allowed', borderRadius: 2, fontFamily: 'inherit' }}>
              + Add to Combat
            </button>
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
          {/* Header + toggle */}
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

          {/* Title */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '8px 14px' }}>
            <input
              value={lootTitle}
              onChange={e => setLootTitle(e.target.value)}
              onBlur={() => patchSession({ loot_title: lootTitle })}
              placeholder="Pool title (e.g. Goblin Cave Treasure)"
              style={{ display: 'block', width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '4px 2px', color: 'var(--text)' }}
            />
          </div>

          {/* Max per player */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text2)', flex: 1 }}>Max items per player:</span>
            <input
              type="number"
              value={maxPerPlayer}
              onChange={e => setMaxPerPlayer(e.target.value)}
              onBlur={() => patchSession({ loot_max_per_player: Math.max(1, parseInt(maxPerPlayer) || 1) })}
              style={{ width: 50, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', textAlign: 'center', fontSize: 15, fontFamily: 'inherit', outline: 'none', padding: '2px 4px' }}
            />
          </div>

          {/* Pre-made pools */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '10px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Pre-made Pools</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PREMADE_LOOT_POOLS.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => loadPremadePool(tmpl)}
                  style={{ padding: '5px 10px', border: `1px solid ${RARITY_COLORS[tmpl.rarity]}`, background: '#fff', color: RARITY_COLORS[tmpl.rarity], fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit' }}
                >
                  {RARITY_LABELS[tmpl.rarity]}
                </button>
              ))}
            </div>
          </div>

          {/* Saved templates */}
          {savedTemplates.length > 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '10px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Saved Templates</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {savedTemplates.map(tmpl => (
                  <div key={tmpl.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', border: '1px solid var(--border2)', borderRadius: 3, background: 'var(--bg)' }}>
                    <span
                      onClick={() => loadSavedTemplate(tmpl)}
                      style={{ fontSize: 12, cursor: 'pointer', color: 'var(--teal2)', fontWeight: 600 }}
                    >{tmpl.name}</span>
                    <button onClick={() => deleteSavedTemplate(tmpl.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1, fontFamily: 'inherit' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current loot pool items */}
          {(s.loot_pool ?? []).length === 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '16px 14px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
              No loot yet. Load a pool or add items below.
            </div>
          )}
          {(s.loot_pool ?? []).map(item => {
            const claims = Object.values(s.loot_claims ?? {}).filter(arr => arr.includes(item.name)).length
            return (
              <div key={item.id} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</span>
                    <RarityBadge rarity={item.rarity} />
                  </div>
                  {item.desc && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{item.desc}</div>}
                </div>
                {claims > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 600, flexShrink: 0 }}>{claims} claimed</span>
                )}
                <button onClick={() => removeLootItem(item.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 14, padding: '0 2px', fontFamily: 'inherit' }}>✕</button>
              </div>
            )
          })}

          {/* Save current as template */}
          {(s.loot_pool ?? []).length > 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '8px 14px' }}>
              {!showSaveTemplate ? (
                <button onClick={() => setShowSaveTemplate(true)} style={{ fontSize: 12, color: 'var(--teal2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                  Save current pool as template →
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    autoFocus
                    value={saveTemplateName}
                    onChange={e => setSaveTemplateName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveCurrentAsTemplate()}
                    placeholder="Template name"
                    style={{ flex: 1, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 13, fontFamily: 'inherit', outline: 'none', padding: '4px 2px' }}
                  />
                  <button onClick={saveCurrentAsTemplate} disabled={!saveTemplateName.trim()} style={{ padding: '4px 12px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', opacity: saveTemplateName.trim() ? 1 : 0.5 }}>Save</button>
                  <button onClick={() => { setShowSaveTemplate(false); setSaveTemplateName('') }} style={{ padding: '4px 8px', background: 'none', border: '1px solid var(--border2)', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--text2)' }}>✕</button>
                </div>
              )}
            </div>
          )}

          {/* Custom item form */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Add Custom Item</div>
            <input value={customLootName} onChange={e => setCustomLootName(e.target.value)} placeholder="Item name" style={{ display: 'block', width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px', marginBottom: 6 }} />
            <input value={customLootDesc} onChange={e => setCustomLootDesc(e.target.value)} placeholder="Description (optional)" style={{ display: 'block', width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontFamily: 'inherit', outline: 'none', padding: '5px 2px', marginBottom: 8 }} />
            <button onClick={addCustomLoot} style={{ padding: '7px 16px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>+ Add</button>
          </div>

          {/* Add from DB button */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '10px 14px' }}>
            <button
              onClick={() => { setLootPickerOpen(true); setLootPickerSearch(''); setLootPickerCat('All') }}
              style={{ display: 'block', width: '100%', padding: '9px', background: 'var(--bg)', border: '1px solid var(--border2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--teal2)', textAlign: 'center' }}
            >
              + Add from Item Database
            </button>
          </div>
        </div>
      )}

      {/* ── Loot DB Picker Modal ──────────────────────────────────────────────────── */}
      {lootPickerOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setLootPickerOpen(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--white)', width: '100%', maxWidth: 600, borderRadius: '14px 14px 0 0', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Add from Database</span>
              <button onClick={() => setLootPickerOpen(false)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, color: 'var(--text2)' }}>✕</button>
            </div>
            <div style={{ padding: '10px 14px', flexShrink: 0 }}>
              <input value={lootPickerSearch} onChange={e => setLootPickerSearch(e.target.value)} placeholder="Search items..." style={{ width: '100%', border: '1px solid var(--border2)', padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', borderRadius: 4, outline: 'none', color: 'var(--text)', background: 'var(--white)', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px', flexWrap: 'wrap', flexShrink: 0 }}>
              {['All', ...GEAR_CATEGORIES].map(cat => (
                <button key={cat} onClick={() => setLootPickerCat(cat)} style={{ padding: '4px 8px', border: '1px solid var(--border2)', background: lootPickerCat === cat ? 'var(--teal)' : 'var(--white)', color: lootPickerCat === cat ? '#fff' : 'var(--text2)', fontSize: 11, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit' }}>{cat}</button>
              ))}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {GEAR_DB
                .filter(g => (lootPickerCat === 'All' || g.category === lootPickerCat) && (!lootPickerSearch.trim() || g.name.toLowerCase().includes(lootPickerSearch.toLowerCase())))
                .map(g => {
                  const already = (s.loot_pool ?? []).some(i => i.name === g.name)
                  return (
                    <div
                      key={g.name}
                      onClick={() => !already && addLootFromDB(g)}
                      style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', borderBottom: '1px solid var(--border)', cursor: already ? 'default' : 'pointer', opacity: already ? 0.45 : 1 }}
                      onMouseEnter={e => { if (!already) (e.currentTarget as HTMLElement).style.background = 'var(--teal-light)' }}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{g.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{g.cost} · {g.category}</div>
                      </div>
                      <span style={{ fontSize: 12, color: already ? 'var(--text3)' : 'var(--teal2)', fontWeight: 600, marginLeft: 8 }}>{already ? 'Added' : '+ Add'}</span>
                    </div>
                  )
                })}
            </div>
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
              <div style={{ flex: 1, minWidth: 0 }}>
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

          {/* Add from DB button */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '10px 14px' }}>
            <button
              onClick={() => { setShopPickerOpen(true); setShopPickerSearch(''); setShopPickerCat('All') }}
              style={{ display: 'block', width: '100%', padding: '9px', background: 'var(--bg)', border: '1px solid var(--border2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--teal2)', textAlign: 'center' }}
            >
              + Add from Item Database
            </button>
          </div>
        </div>
      )}

      {/* ── Shop DB Picker Modal ──────────────────────────────────────────────────── */}
      {shopPickerOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setShopPickerOpen(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--white)', width: '100%', maxWidth: 600, borderRadius: '14px 14px 0 0', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '14px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Add from Database</span>
              <button onClick={() => setShopPickerOpen(false)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, color: 'var(--text2)' }}>✕</button>
            </div>
            <div style={{ padding: '10px 14px', flexShrink: 0 }}>
              <input value={shopPickerSearch} onChange={e => setShopPickerSearch(e.target.value)} placeholder="Search items..." style={{ width: '100%', border: '1px solid var(--border2)', padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', borderRadius: 4, outline: 'none', color: 'var(--text)', background: 'var(--white)', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px', flexWrap: 'wrap', flexShrink: 0 }}>
              {['All', ...GEAR_CATEGORIES].map(cat => (
                <button key={cat} onClick={() => setShopPickerCat(cat)} style={{ padding: '4px 8px', border: '1px solid var(--border2)', background: shopPickerCat === cat ? 'var(--teal)' : 'var(--white)', color: shopPickerCat === cat ? '#fff' : 'var(--text2)', fontSize: 11, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit' }}>{cat}</button>
              ))}
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {GEAR_DB
                .filter(g => (shopPickerCat === 'All' || g.category === shopPickerCat) && (!shopPickerSearch.trim() || g.name.toLowerCase().includes(shopPickerSearch.toLowerCase())))
                .map(g => {
                  const already = (s.shop_items ?? []).some(i => i.name === g.name)
                  const price = parseFloat(g.cost.replace(/[^0-9.]/g, '')) || 0
                  return (
                    <div
                      key={g.name}
                      onClick={() => !already && addShopFromDB(g)}
                      style={{ display: 'flex', alignItems: 'center', padding: '11px 14px', borderBottom: '1px solid var(--border)', cursor: already ? 'default' : 'pointer', opacity: already ? 0.45 : 1 }}
                      onMouseEnter={e => { if (!already) (e.currentTarget as HTMLElement).style.background = 'var(--teal-light)' }}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{g.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{g.category}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: already ? 'var(--text3)' : 'var(--gold)', marginRight: 10 }}>{price > 0 ? `${price} gp` : g.cost}</span>
                      <span style={{ fontSize: 12, color: already ? 'var(--text3)' : 'var(--teal2)', fontWeight: 600 }}>{already ? 'Added' : '+ Add'}</span>
                    </div>
                  )
                })}
            </div>
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

      {/* ── Player Detail Modal ──────────────────────────────────────────────────── */}
      {detailChar && (() => {
        // Keep in sync with latest data from store
        const char = playerCharacters.find(c => c.id === detailChar.id) ?? detailChar
        const { dmPatchCharacter: dmp } = useSessionStore.getState()
        const ac = calcArmorAC(char)
        const pp = passivePerception(char)
        const hpPct = char.max_hp > 0 ? char.hp / char.max_hp : 1

        return (
          <div
            onClick={e => { if (e.target === e.currentTarget) setDetailChar(null) }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          >
            <div style={{ background: 'var(--white)', width: '100%', maxWidth: 600, borderRadius: '14px 14px 0 0', maxHeight: '88vh', overflowY: 'auto' }}>
              {/* Handle */}
              <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: char.inspiration ? 'var(--gold)' : 'var(--text)' }}>{char.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>Level {char.level} {char.race} {char.class}</div>
                </div>
                <button onClick={() => setDetailChar(null)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, color: 'var(--text2)' }}>✕</button>
              </div>

              {/* Inspiration button */}
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => dmp(char.id, { inspiration: !char.inspiration })}
                  style={{
                    flex: 1, padding: '10px 16px',
                    background: char.inspiration ? 'var(--gold)' : 'var(--white)',
                    border: `2px solid ${char.inspiration ? 'var(--gold)' : 'var(--border2)'}`,
                    color: char.inspiration ? '#fff' : 'var(--text2)',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer', borderRadius: 4, fontFamily: 'inherit',
                    transition: 'all .2s',
                  }}
                >
                  {char.inspiration ? 'Inspired! — Tap to remove' : 'Grant Inspiration'}
                </button>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid var(--border)' }}>
                {[
                  { label: 'HP', value: `${char.hp}/${char.max_hp}`, color: hpColor(hpPct) },
                  { label: 'AC', value: String(ac) },
                  { label: 'PP', value: String(pp) },
                  { label: 'Speed', value: '30ft' },
                ].map((stat, i) => (
                  <div key={stat.label} style={{ padding: '10px 8px', textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: stat.color ?? 'var(--text)' }}>{stat.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Ability scores */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', borderBottom: '1px solid var(--border)' }}>
                {(['str', 'dex', 'con', 'int', 'wis', 'cha'] as const).map((ab, i) => {
                  const score = char[ab] as number
                  const m = Math.floor((score - 10) / 2)
                  return (
                    <div key={ab} style={{ padding: '8px 4px', textAlign: 'center', borderRight: i < 5 ? '1px solid var(--border)' : 'none' }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{score}</div>
                      <div style={{ fontSize: 12, color: 'var(--teal2)', fontWeight: 600 }}>{m >= 0 ? '+' : ''}{m}</div>
                      <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.3px' }}>{ab}</div>
                    </div>
                  )
                })}
              </div>

              {/* Conditions */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Conditions</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {CONDITIONS.map(cond => {
                    const active = char.conditions?.includes(cond)
                    return (
                      <button
                        key={cond}
                        onClick={() => {
                          const next = active
                            ? (char.conditions ?? []).filter(c => c !== cond)
                            : [...(char.conditions ?? []), cond]
                          dmp(char.id, { conditions: next })
                        }}
                        style={{ padding: '4px 10px', border: `1px solid ${active ? '#92400e' : 'var(--border2)'}`, background: active ? '#fef3c7' : 'var(--white)', color: active ? '#92400e' : 'var(--text2)', fontSize: 12, fontWeight: active ? 700 : 400, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit' }}
                      >
                        {cond}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Concentration */}
              {char.concentration_spell && (
                <div style={{ padding: '10px 16px', background: 'var(--purple-light)', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)' }}>Concentrating: {char.concentration_spell}</span>
                  <button onClick={() => dmp(char.id, { concentration_spell: null })} style={{ marginLeft: 10, fontSize: 11, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Drop</button>
                </div>
              )}

              {/* Inventory */}
              {(char.inventory ?? []).length > 0 && (
                <div style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>Inventory</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {char.inventory.map(item => (
                      <span key={item.name} style={{ fontSize: 12, background: 'var(--bg)', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: 3 }}>
                        {item.name} ×{item.quantity}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ height: 20 }} />
            </div>
          </div>
        )
      })()}
    </div>
  )
}
