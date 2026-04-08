import { useState } from 'react'
import type { Character } from '@/types'
import type { Spell } from '@/types'
import { CLASSES, SPELL_DB, SPELL_SLOTS_TABLE } from '@/data'
import { spellSaveDC, spellAttackBonus, fmtBonus } from '@/lib/calculations'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'

interface Props { character: Character }

const LEVEL_NAMES = ['Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th']
const SCHOOL_COLORS: Record<string, string> = { Evocation: 'var(--red)', Abjuration: 'var(--teal)', Conjuration: 'var(--purple)', Enchantment: 'var(--gold)', Divination: '#0077aa', Illusion: '#6b21a8', Transmutation: '#15803d', Necromancy: '#374151' }

export default function SpellsSection({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { showToast } = useUIStore()
  const [openSpell, setOpenSpell] = useState<Spell | null>(null)
  const [showDB, setShowDB] = useState(false)
  const [dbQuery, setDbQuery] = useState('')
  const [dbFilter, setDbFilter] = useState<number | 'all'>('all')

  const spellAb = CLASSES[c.class]?.spellcasting
  if (!spellAb && !c.spells?.length) return null

  const slots = SPELL_SLOTS_TABLE[c.class]?.[c.level - 1] ?? []
  const dc = spellAb ? spellSaveDC(c, spellAb) : null
  const atkBonus = spellAb ? spellAttackBonus(c, spellAb) : null

  const adjustSlot = async (lvlIdx: number, delta: number) => {
    const used = [...(c.spell_slots_used ?? [])]
    while (used.length <= lvlIdx) used.push(0)
    const total = slots[lvlIdx] ?? 0
    used[lvlIdx] = Math.max(0, Math.min(total, (used[lvlIdx] ?? 0) + delta))
    await patchActiveCharacter({ spell_slots_used: used })
  }

  const addSpell = async (spell: Spell) => {
    const already = (c.spells ?? []).some(s => s.name === spell.name)
    if (already) { showToast('Already known'); return }
    await patchActiveCharacter({ spells: [...(c.spells ?? []), spell] })
    showToast(`${spell.name} added`)
  }

  const removeSpell = async (name: string) => {
    await patchActiveCharacter({ spells: (c.spells ?? []).filter(s => s.name !== name) })
    showToast('Spell removed')
  }

  const castSpell = async (spell: Spell, slotLevel?: number) => {
    if (spell.level === 0) { showToast(`Cast ${spell.name}`); setOpenSpell(null); return }
    const lvlIdx = (slotLevel ?? spell.level) - 1
    const used = [...(c.spell_slots_used ?? [])]
    while (used.length <= lvlIdx) used.push(0)
    const total = slots[lvlIdx] ?? 0
    if ((used[lvlIdx] ?? 0) >= total) { showToast('No slots remaining at that level'); return }
    used[lvlIdx] = (used[lvlIdx] ?? 0) + 1
    const updates: Partial<Character> = { spell_slots_used: used }
    if (spell.concentration) {
      const old = c.concentration_spell
      updates.concentration_spell = spell.name
      if (old && old !== spell.name) {
        showToast(`Dropped ${old} — concentrating on ${spell.name}`)
      } else {
        showToast(`Concentrating on ${spell.name}`)
      }
    } else {
      showToast(`Cast ${spell.name}`)
    }
    await patchActiveCharacter(updates)
    setOpenSpell(null)
  }

  const stopConcentration = async () => {
    await patchActiveCharacter({ concentration_spell: null })
    showToast('Concentration ended')
  }

  // Group spells by level
  const byLevel: Record<number, Spell[]> = {}
  ;(c.spells ?? []).forEach(spell => {
    if (!byLevel[spell.level]) byLevel[spell.level] = []
    byLevel[spell.level].push(spell)
  })

  const dbSpells = SPELL_DB.filter(s => {
    const matchClass = !spellAb || s.classes.includes(c.class)
    const matchLevel = dbFilter === 'all' || s.level === dbFilter
    const matchQuery = !dbQuery || s.name.toLowerCase().includes(dbQuery.toLowerCase())
    return matchClass && matchLevel && matchQuery
  })

  return (
    <div>
      {/* Section header */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Spells</span>
        <button onClick={() => setShowDB(!showDB)} style={{ fontSize: 13, color: 'var(--purple)', cursor: 'pointer', fontWeight: 500, background: 'none', border: 'none', fontFamily: 'inherit', padding: 0 }}>+ Add Spell</button>
      </div>

      {/* Spell stats */}
      {(dc !== null || atkBonus !== null) && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', display: 'flex' }}>
          {dc !== null && <div style={{ flex: 1, padding: '8px 6px', textAlign: 'center', borderRight: '1px solid var(--border)' }}><div style={{ fontSize: 18, fontWeight: 700 }}>{dc}</div><div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>SPELL SAVE DC</div></div>}
          {atkBonus !== null && <div style={{ flex: 1, padding: '8px 6px', textAlign: 'center' }}><div style={{ fontSize: 18, fontWeight: 700 }}>{fmtBonus(atkBonus)}</div><div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>SPELL ATTACK</div></div>}
        </div>
      )}

      {/* Active concentration */}
      {c.concentration_spell && (
        <div style={{ background: 'var(--teal-light)', border: '1px solid var(--teal)', borderTop: 'none', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: 'var(--teal2)', fontWeight: 600 }}>Concentrating: {c.concentration_spell}</span>
          <button onClick={stopConcentration} style={{ fontSize: 12, color: 'var(--teal2)', background: 'none', border: '1px solid var(--teal)', cursor: 'pointer', padding: '3px 8px', borderRadius: 2, fontFamily: 'inherit', fontWeight: 600 }}>Stop</button>
        </div>
      )}

      {/* Spell slot tracker */}
      {slots.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid var(--border)', borderTop: 'none', background: 'var(--white)' }}>
          {slots.map((total, i) => {
            const used = c.spell_slots_used?.[i] ?? 0
            const remaining = total - used
            return (
              <div key={i} style={{ borderRight: (i + 1) % 3 !== 0 ? '1px solid var(--border)' : 'none', borderBottom: i < slots.length - 3 ? '1px solid var(--border)' : 'none', padding: '8px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4, fontWeight: 600 }}>{LEVEL_NAMES[i + 1]}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <button onClick={() => adjustSlot(i, -1)} style={{ width: 22, height: 22, border: '1px solid var(--border2)', background: 'var(--white)', cursor: 'pointer', fontSize: 14, borderRadius: 2, color: 'var(--text3)', fontFamily: 'inherit', padding: 0 }}>−</button>
                  <span style={{ fontSize: 16, fontWeight: 700, minWidth: 28, textAlign: 'center', color: remaining === 0 ? 'var(--text3)' : 'var(--text)' }}>{remaining}</span>
                  <button onClick={() => adjustSlot(i, 1)} style={{ width: 22, height: 22, border: '1px solid var(--border2)', background: 'var(--white)', cursor: 'pointer', fontSize: 14, borderRadius: 2, color: 'var(--text3)', fontFamily: 'inherit', padding: 0 }}>+</button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>/ {total}</div>
              </div>
            )
          })}
        </div>
      )}

      {/* Spell list */}
      {Object.entries(byLevel).sort(([a], [b]) => Number(a) - Number(b)).map(([level, spells]) => (
        <div key={level}>
          <div style={{ padding: '5px 14px', background: '#fafafa', borderBottom: '1px solid var(--border)', border: '1px solid var(--border)', borderTop: '1px solid var(--border)', borderLeft: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--purple)', letterSpacing: '.5px', textTransform: 'uppercase' }}>
            {LEVEL_NAMES[Number(level)]} Spells
          </div>
          {spells.map(spell => (
            <div key={spell.name} onClick={() => setOpenSpell(spell)} style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: '1px solid var(--border)', border: '1px solid var(--border)', borderTop: 'none', gap: 10, cursor: 'pointer', background: 'var(--white)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--white)')}
            >
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, fontWeight: 500 }}>{spell.name}</span>
                {spell.concentration && <span style={{ fontSize: 10, background: 'var(--teal-light)', color: 'var(--teal2)', padding: '1px 6px', borderRadius: 2, fontWeight: 600, marginLeft: 5 }}>C</span>}
                {spell.ritual && <span style={{ fontSize: 10, background: '#f3f0ff', color: 'var(--purple)', padding: '1px 6px', borderRadius: 2, fontWeight: 600, marginLeft: 4 }}>R</span>}
              </div>
              <span style={{ fontSize: 11, color: SCHOOL_COLORS[spell.school] ?? 'var(--text3)', fontWeight: 600 }}>{spell.school.slice(0, 3).toUpperCase()}</span>
              {spell.damage && <span style={{ fontSize: 12, color: 'var(--text3)' }}>{spell.damage}</span>}
            </div>
          ))}
        </div>
      ))}

      {/* Add spell DB panel */}
      {showDB && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', maxHeight: 400, overflowY: 'auto' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--white)', zIndex: 2 }}>
            <input value={dbQuery} onChange={e => setDbQuery(e.target.value)} placeholder="Search spells..." style={{ width: '100%', border: '1px solid var(--border2)', padding: '7px 10px', fontSize: 14, fontFamily: 'inherit', color: 'var(--text)', borderRadius: 2, outline: 'none', background: 'var(--white)' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '7px 14px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {['all', 0, 1, 2, 3, 4, 5].map(f => (
              <button key={String(f)} onClick={() => setDbFilter(f as typeof dbFilter)} style={{ padding: '3px 10px', border: '1px solid var(--border2)', background: dbFilter === f ? 'var(--purple)' : 'var(--white)', color: dbFilter === f ? '#fff' : 'var(--text2)', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>
                {f === 'all' ? 'All' : LEVEL_NAMES[Number(f)]}
              </button>
            ))}
          </div>
          {dbSpells.map(spell => {
            const added = (c.spells ?? []).some(s => s.name === spell.name)
            return (
              <div key={spell.name} onClick={() => !added && addSpell(spell)} style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: '1px solid var(--border)', cursor: added ? 'default' : 'pointer', opacity: added ? 0.5 : 1 }}
                onMouseEnter={e => { if (!added) (e.currentTarget as HTMLElement).style.background = 'var(--purple-light)' }}
                onMouseLeave={e => { if (!added) (e.currentTarget as HTMLElement).style.background = '' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{spell.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{spell.school} · {spell.castTime}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--purple)', minWidth: 48 }}>{LEVEL_NAMES[spell.level]}</span>
                <span style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 600 }}>{added ? '✓' : '+ Add'}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Spell detail modal */}
      {openSpell && <SpellDetail spell={openSpell} character={c} onClose={() => setOpenSpell(null)} onCast={castSpell} onRemove={removeSpell} slots={slots} slotsUsed={c.spell_slots_used ?? []} />}
    </div>
  )
}

function SpellDetail({ spell, character: _c, onClose, onCast, onRemove, slots, slotsUsed }: { spell: Spell; character: Character; onClose: () => void; onCast: (s: Spell, lvl?: number) => void; onRemove: (name: string) => void; slots: number[]; slotsUsed: number[] }) {
  const availableSlots = slots.map((total, i) => ({ level: i + 1, remaining: total - (slotsUsed[i] ?? 0) })).filter(s => s.level >= spell.level && s.remaining > 0)

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--white)', width: '100%', maxWidth: 600, maxHeight: '85vh', borderRadius: '14px 14px 0 0', overflowY: 'auto', padding: '20px 16px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{spell.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>{spell.level === 0 ? 'Cantrip' : `${LEVEL_NAMES[spell.level]}-level`} {spell.school}</div>
          </div>
          <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, color: 'var(--text2)', flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px', margin: '14px 0' }}>
          {[['Casting Time', spell.castTime], ['Range', spell.range], ['Duration', spell.duration], ['Components', spell.components]].map(([k, v]) => (
            <div key={k}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{k}</div>
              <div style={{ fontSize: 13, marginTop: 2 }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text2)', marginBottom: 12 }}>{spell.desc}</div>
        {spell.higherLevel && <div style={{ fontSize: 13, color: 'var(--teal2)', background: 'var(--teal-light)', padding: '8px 10px', borderRadius: 2, marginBottom: 12 }}><strong>At higher levels: </strong>{spell.higherLevel}</div>}

        {/* Cast buttons */}
        {spell.level === 0 ? (
          <button onClick={() => onCast(spell)} style={{ display: 'block', width: '100%', padding: 12, background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', marginBottom: 8 }}>Cast Cantrip</button>
        ) : availableSlots.length > 0 ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            {availableSlots.map(s => (
              <button key={s.level} onClick={() => onCast(spell, s.level)} style={{ flex: 1, minWidth: 80, padding: '10px 4px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>
                Cast {LEVEL_NAMES[s.level]}<br /><span style={{ fontSize: 11, opacity: .8 }}>{s.remaining} left</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ padding: '10px', background: '#fde8e8', color: 'var(--red)', fontSize: 13, borderRadius: 2, marginBottom: 8 }}>No spell slots remaining</div>
        )}

        <button onClick={() => { onRemove(spell.name); onClose() }} style={{ display: 'block', width: '100%', padding: 10, background: 'var(--white)', color: 'var(--red)', border: '1px solid var(--red)', fontSize: 13, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>Remove spell</button>
      </div>
    </div>
  )
}
