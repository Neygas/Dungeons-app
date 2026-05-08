import { useState } from 'react'
import type { Character } from '@/types'
import { hpColor } from '@/lib/calculations'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'
import { useLongPress } from '@/lib/useLongPress'
import { haptic } from '@/utils/haptics'
import { CONDITIONS } from '@/data'

interface Props { character: Character }

export default function HPSection({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { showToast, openSheet, setEditMode } = useUIStore()
  const [adjVal, setAdjVal] = useState('')
  const [showMenu, setShowMenu] = useState(false)
  const [editingMaxHp, setEditingMaxHp] = useState(false)
  const [maxHpVal, setMaxHpVal] = useState('')

  const startEditMaxHp = () => {
    setEditMode(true)
    setEditingMaxHp(true)
    setMaxHpVal(String(c.max_hp))
  }

  const commitMaxHp = async () => {
    const n = Math.max(1, parseInt(maxHpVal) || 1)
    await patchActiveCharacter({ max_hp: n, hp: Math.min(c.hp, n) })
    showToast(`Max HP set to ${n}`)
    setEditingMaxHp(false)
  }

  const maxHpLp = useLongPress(startEditMaxHp)

  const pct = c.max_hp > 0 ? Math.max(0, c.hp) / c.max_hp : 0
  const color = hpColor(pct)
  const isDown = c.hp <= 0 && !c.is_stable && !c.is_dead

  const applyDamage = async () => {
    const n = parseInt(adjVal)
    if (!n || n <= 0) return
    haptic.damage()
    showToast(`-${n} HP`)
    setAdjVal('')
    const newHp = Math.max(0, c.hp - n)
    const updates: Partial<Character> = { hp: newHp }
    // Always reset death saves when dropping to 0 so the interface always appears
    if (newHp === 0) {
      updates.death_successes = 0
      updates.death_failures = 0
      updates.is_stable = false
      updates.is_dead = false
    }
    await patchActiveCharacter(updates)
  }

  const applyHeal = async () => {
    const n = parseInt(adjVal)
    if (!n || n <= 0) return
    haptic.heal()
    showToast(`+${n} HP`)
    setAdjVal('')
    await patchActiveCharacter({ hp: Math.min(c.max_hp + (c.temp_hp ?? 0), c.hp + n) })
  }

  const toggleDeathSave = async (type: 'success' | 'failure', idx: number) => {
    const field = type === 'success' ? 'death_successes' : 'death_failures'
    const current = type === 'success' ? c.death_successes : c.death_failures
    const newVal = current > idx ? idx : idx + 1
    const updates: Partial<Character> = { [field]: newVal }
    if (type === 'success' && newVal >= 3) { updates.is_stable = true; showToast('Stable!') }
    if (type === 'failure' && newVal >= 3) { updates.is_dead = true; showToast('Character has died...') }
    await patchActiveCharacter(updates)
  }

  const menuItems = [
    { label: 'Conditions' + (c.conditions.length > 0 ? ` (${c.conditions.length})` : ''), action: () => { openSheet('conditions'); setShowMenu(false) } },
    { label: 'Temp HP', action: () => { openSheet('tempHp'); setShowMenu(false) } },
    { label: 'Short Rest', action: () => { openSheet('shortRest'); setShowMenu(false) } },
    { label: 'Long Rest', action: () => { openSheet('longRest'); setShowMenu(false) } },
  ]

  return (
    <div>
      {/* HP bar */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: 14, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Hit Points</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color }}>
              {c.hp}
              {editingMaxHp ? (
                <input
                  autoFocus type="number" value={maxHpVal}
                  onChange={e => setMaxHpVal(e.target.value)}
                  onBlur={commitMaxHp}
                  onKeyDown={e => { if (e.key === 'Enter') commitMaxHp(); if (e.key === 'Escape') setEditingMaxHp(false) }}
                  style={{ width: 48, border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 14, fontWeight: 400, textAlign: 'center', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', display: 'inline-block', padding: 0 }}
                />
              ) : (
                <span {...maxHpLp} style={{ fontSize: 14, fontWeight: 400, color: 'var(--text3)', cursor: 'pointer', userSelect: 'none' }}> / {c.max_hp}</span>
              )}
              {(c.temp_hp ?? 0) > 0 && <span style={{ fontSize: 13, color: 'var(--teal)', marginLeft: 6 }}>+{c.temp_hp} temp</span>}
            </span>
            {/* ... menu button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{ width: 30, height: 30, border: '1px solid var(--border2)', background: showMenu ? 'var(--bg)' : 'var(--white)', borderRadius: 4, cursor: 'pointer', fontSize: 16, fontWeight: 700, color: 'var(--text3)', fontFamily: 'inherit', letterSpacing: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                •••
              </button>
              {showMenu && (
                <>
                  <div onClick={() => setShowMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
                  <div style={{ position: 'absolute', top: 34, right: 0, background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 6, minWidth: 150, zIndex: 50, boxShadow: '0 4px 16px rgba(0,0,0,.12)', overflow: 'hidden' }}>
                    {menuItems.map(item => (
                      <button key={item.label} onClick={item.action} style={{ display: 'block', width: '100%', padding: '11px 14px', border: 'none', borderBottom: '1px solid var(--border)', background: 'var(--white)', cursor: 'pointer', fontSize: 14, textAlign: 'left', fontFamily: 'inherit', color: 'var(--text)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'var(--white)')}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* HP bar */}
        <div style={{ background: '#eee', height: 8, borderRadius: 4 }}>
          <div style={{ height: 8, borderRadius: 4, background: color, width: `${pct * 100}%`, transition: 'width 300ms var(--ease-out), background 300ms var(--ease-out)' }} />
        </div>

        {/* Damage / Heal */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10 }}>
          <input
            type="number" min="0" value={adjVal}
            onChange={e => setAdjVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyHeal() }}
            placeholder="0"
            style={{ width: 60, textAlign: 'center', border: '1px solid var(--border2)', padding: 6, fontSize: 15, fontFamily: 'inherit', borderRadius: 2, background: 'var(--white)', color: 'var(--text)', outline: 'none' }}
          />
          <button onClick={applyDamage} style={{ flex: 1, padding: '8px 4px', border: '1px solid var(--red)', background: '#fde8e8', color: 'var(--red)', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>Damage</button>
          <button onClick={applyHeal} style={{ flex: 1, padding: '8px 4px', border: '1px solid var(--green)', background: '#e8f5e9', color: 'var(--green)', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>Heal</button>
        </div>
      </div>

      {/* Active conditions bar */}
      {c.conditions.length > 0 && (
        <div style={{ background: '#fde8e8', border: '1px solid var(--red)', borderTop: 'none', padding: '8px 14px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {c.conditions.map(cond => (
            <span key={cond} onClick={() => openSheet('conditions')} style={{ padding: '2px 8px', background: 'var(--white)', border: '1px solid var(--red)', borderRadius: 2, fontSize: 11, fontWeight: 600, color: 'var(--red)', cursor: 'pointer' }}>{cond}</span>
          ))}
        </div>
      )}

      {/* Death saves */}
      {isDown && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '12px 14px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Death Saving Throws</div>
          {(['success', 'failure'] as const).map(type => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, minWidth: 72 }}>{type === 'success' ? 'Successes' : 'Failures'}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {[0, 1, 2].map(i => {
                  const filled = (type === 'success' ? c.death_successes : c.death_failures) > i
                  return (
                    <div key={i} onClick={() => toggleDeathSave(type, i)}
                      style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${type === 'success' ? (filled ? 'var(--green)' : 'var(--border2)') : (filled ? 'var(--red)' : 'var(--border2)')}`, background: filled ? (type === 'success' ? 'var(--green)' : 'var(--red)') : 'var(--white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#fff', transition: 'all .15s' }}
                    >
                      {filled ? (type === 'success' ? '✓' : '✗') : ''}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ===== Conditions Sheet =====
export function ConditionsSheet({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { showToast } = useUIStore()

  const toggle = async (cond: string) => {
    const has = c.conditions.includes(cond)
    const next = has ? c.conditions.filter(x => x !== cond) : [...c.conditions, cond]
    await patchActiveCharacter({ conditions: next })
    showToast(has ? `${cond} removed` : `${cond} applied`)
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {CONDITIONS.map(cond => {
          const active = c.conditions.includes(cond)
          return (
            <button key={cond} onClick={() => toggle(cond)} style={{ padding: '6px 12px', border: `1px solid ${active ? 'var(--red)' : 'var(--border2)'}`, background: active ? '#fde8e8' : 'var(--white)', color: active ? 'var(--red)' : 'var(--text2)', fontSize: 13, fontWeight: active ? 600 : 400, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>
              {cond}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ===== Temp HP Sheet =====
export function TempHPSheet({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { showToast, closeSheet } = useUIStore()
  const [val, setVal] = useState(String(c.temp_hp ?? 0))

  const save = async () => {
    const n = Math.max(0, parseInt(val) || 0)
    await patchActiveCharacter({ temp_hp: n })
    showToast(`Temp HP set to ${n}`)
    closeSheet()
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.6 }}>
        Temporary HP are a buffer against damage. They don't stack — take the higher value.
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="number" min="0" value={val} onChange={e => setVal(e.target.value)} style={{ width: 80, border: '1px solid var(--border2)', padding: '8px', fontSize: 20, fontWeight: 700, textAlign: 'center', fontFamily: 'inherit', borderRadius: 2, outline: 'none', color: 'var(--text)', background: 'var(--white)' }} />
        <button onClick={save} style={{ flex: 1, padding: 13, background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>Set Temp HP</button>
      </div>
    </div>
  )
}

// ===== Short Rest Sheet =====
export function ShortRestSheet({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { showToast, closeSheet, showCutscene } = useUIStore()
  const [hdMode, setHdMode] = useState<'avg' | 'roll' | 'manual'>('avg')
  const [hdManual, setHdManual] = useState('')

  const hd = { Barbarian: 12, Bard: 8, Cleric: 8, Druid: 8, Fighter: 10, Monk: 8, Paladin: 10, Ranger: 10, Rogue: 8, Sorcerer: 6, Warlock: 8, Wizard: 6 }[c.class] ?? 8
  const hdRem = c.hit_dice_total - c.hit_dice_used
  const conMod = Math.floor((c.con - 10) / 2)
  const conModStr = conMod >= 0 ? `+${conMod}` : String(conMod)
  const avgHeal = Math.max(0, Math.floor(hd / 2) + 1 + conMod)

  const doShortRest = async () => {
    if (hdRem <= 0) { showToast('No hit dice remaining'); return }
    let gain = 0
    if (hdMode === 'avg') gain = Math.floor(hd / 2) + 1 + conMod
    else if (hdMode === 'roll') gain = Math.floor(Math.random() * hd) + 1 + conMod
    else gain = parseInt(hdManual) || 0
    gain = Math.max(0, gain)
    await patchActiveCharacter({ hp: Math.min(c.max_hp, c.hp + gain), hit_dice_used: c.hit_dice_used + 1 })
    showToast(`Short rest: +${gain} HP`)
    closeSheet()
    haptic.shortRest()
    showCutscene('short-rest')
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Header info */}
      <div style={{ background: 'var(--bg)', borderRadius: 6, padding: '12px 14px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>Hit Dice remaining</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: hdRem > 0 ? 'var(--teal2)' : 'var(--red)' }}>{hdRem} / {c.hit_dice_total} (d{hd})</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>Current HP</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{c.hp} / {c.max_hp}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>CON modifier</span>
          <span style={{ fontSize: 13, fontWeight: 700 }}>{conModStr}</span>
        </div>
      </div>

      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, lineHeight: 1.6 }}>
        Spend one Hit Die to recover HP. Roll 1d{hd} + CON modifier ({conModStr}). You can spend multiple dice by resting again.
      </div>

      {/* Mode picker */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>How to roll your Hit Die</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['avg', 'roll', 'manual'] as const).map(m => (
          <button key={m} onClick={() => setHdMode(m)} style={{ flex: 1, padding: '10px 4px', border: `${hdMode === m ? 2 : 1}px solid ${hdMode === m ? 'var(--teal)' : 'var(--border2)'}`, background: hdMode === m ? 'var(--teal-light)' : 'var(--white)', cursor: 'pointer', borderRadius: 4, fontFamily: 'inherit' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: hdMode === m ? 'var(--teal2)' : 'var(--text)' }}>{m === 'avg' ? 'Average' : m === 'roll' ? 'Roll' : 'Manual'}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{m === 'avg' ? `~${avgHeal} HP` : m === 'roll' ? `1d${hd} ${conModStr}` : 'type a value'}</div>
          </button>
        ))}
      </div>

      {hdMode === 'manual' && (
        <input
          type="number" value={hdManual} onChange={e => setHdManual(e.target.value)}
          placeholder="HP to recover"
          style={{ display: 'block', width: '100%', border: '1px solid var(--border2)', padding: '10px 12px', fontSize: 16, textAlign: 'center', fontFamily: 'inherit', borderRadius: 4, outline: 'none', marginBottom: 12, background: 'var(--white)', color: 'var(--text)', boxSizing: 'border-box' }}
        />
      )}

      <button
        onClick={doShortRest}
        disabled={hdRem <= 0}
        style={{ display: 'block', width: '100%', padding: 13, background: hdRem > 0 ? 'var(--teal)' : 'var(--border)', color: hdRem > 0 ? '#fff' : 'var(--text3)', border: 'none', fontSize: 15, fontWeight: 600, cursor: hdRem > 0 ? 'pointer' : 'not-allowed', borderRadius: 4, fontFamily: 'inherit' }}
      >
        {hdRem > 0 ? `Take Short Rest — spend 1 Hit Die` : 'No Hit Dice remaining'}
      </button>
    </div>
  )
}

// ===== Long Rest Sheet =====
export function LongRestSheet({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { showToast, closeSheet, showCutscene } = useUIStore()

  const hd = { Barbarian: 12, Bard: 8, Cleric: 8, Druid: 8, Fighter: 10, Monk: 8, Paladin: 10, Ranger: 10, Rogue: 8, Sorcerer: 6, Warlock: 8, Wizard: 6 }[c.class] ?? 8
  const hdRem = c.hit_dice_total - c.hit_dice_used
  const hdRecovered = Math.max(1, Math.floor(c.hit_dice_total / 2))
  const hpMissing = c.max_hp - c.hp
  const slotLevels = c.spell_slots_used.filter(n => n > 0).length

  const doLongRest = async () => {
    await patchActiveCharacter({
      hp: c.max_hp,
      hit_dice_used: Math.max(0, c.hit_dice_used - hdRecovered),
      spell_slots_used: c.spell_slots_used.map(() => 0),
      death_successes: 0, death_failures: 0, is_stable: false, conditions: [],
    })
    showToast('Long rest complete — fully restored')
    closeSheet()
    haptic.longRest()
    showCutscene('long-rest')
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>
        A long rest is at least 8 hours of sleep or light activity. You can only benefit from one long rest per 24 hours.
      </div>

      {/* What gets restored */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 8 }}>What gets restored</div>
      <div style={{ background: 'var(--bg)', borderRadius: 6, overflow: 'hidden', marginBottom: 20 }}>
        {[
          { label: 'Hit Points', before: `${c.hp} / ${c.max_hp}`, after: `${c.max_hp} / ${c.max_hp}`, gained: hpMissing > 0 ? `+${hpMissing}` : 'Full', ok: hpMissing > 0 },
          { label: 'Hit Dice', before: `${hdRem} / ${c.hit_dice_total} (d${hd})`, after: `${Math.min(c.hit_dice_total, hdRem + hdRecovered)} / ${c.hit_dice_total}`, gained: `+${Math.min(hdRecovered, c.hit_dice_used)}`, ok: c.hit_dice_used > 0 },
          { label: 'Spell Slots', before: slotLevels > 0 ? `${slotLevels} level(s) used` : 'All available', after: 'All available', gained: 'Restored', ok: slotLevels > 0 },
          { label: 'Death Saves', before: 'Cleared', after: 'Cleared', gained: '—', ok: false },
          { label: 'Conditions', before: c.conditions.length > 0 ? c.conditions.join(', ') : 'None', after: 'None', gained: c.conditions.length > 0 ? 'Cleared' : '—', ok: c.conditions.length > 0 },
        ].map((row, i, arr) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{row.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{row.before} → {row.after}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: row.ok ? 'var(--green)' : 'var(--text3)' }}>{row.gained}</span>
          </div>
        ))}
      </div>

      <button
        onClick={doLongRest}
        style={{ display: 'block', width: '100%', padding: 13, background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', borderRadius: 4, fontFamily: 'inherit' }}
      >
        Take Long Rest — 8 hours
      </button>
    </div>
  )
}
