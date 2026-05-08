import { useEffect, useState } from 'react'
import type { Character } from '@/types'
import type { Spell } from '@/types'
import { CLASSES, SPELL_DB, SPELL_SLOTS_TABLE } from '@/data'
import { spellSaveDC, spellAttackBonus, fmtBonus } from '@/lib/calculations'
import { useCharacterStore } from '@/store/characterStore'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { useCustomPlayerCatalogStore } from '@/store/customPlayerCatalogStore'
import AddModal from '@/components/shared/AddModal'
import SwipeToDelete from '@/components/shared/SwipeToDelete'

interface Props { character: Character }

const LEVEL_NAMES = ['Cantrip', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th']
const SCHOOL_COLORS: Record<string, string> = { Evocation: 'var(--red)', Abjuration: 'var(--teal)', Conjuration: 'var(--purple)', Enchantment: 'var(--gold)', Divination: '#0077aa', Illusion: '#6b21a8', Transmutation: '#15803d', Necromancy: '#374151' }
const PREPARED_CASTERS = ['Cleric', 'Druid', 'Paladin', 'Artificer', 'Wizard']

export default function SpellsSection({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { logEntry, getJoinedSession } = useSessionStore()
  const { showToast } = useUIStore()
  const { entries: catalogEntries, load: loadCatalog, save: saveToCatalog, remove: removeFromCatalog } = useCustomPlayerCatalogStore()
  const [openSpell, setOpenSpell] = useState<Spell | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [dbQuery, setDbQuery] = useState('')
  const [dbFilter, setDbFilter] = useState<number | 'all' | 'mine'>('all')
  // Custom spell form
  const [customSpellName, setCustomSpellName] = useState('')
  const [customSpellLevel, setCustomSpellLevel] = useState(0)
  const [customSpellSchool, setCustomSpellSchool] = useState('Evocation')
  const [customSpellDesc, setCustomSpellDesc] = useState('')
  const [customSpellDamage, setCustomSpellDamage] = useState('')

  const mySpells = catalogEntries.filter(e => e.type === 'spell')

  useEffect(() => { loadCatalog() }, [loadCatalog])
  const [preparedOnly, setPreparedOnly] = useState(false)

  const isPreparedCaster = PREPARED_CASTERS.includes(c.class)

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
    const castLevel = slotLevel ?? spell.level
    // Check if this is a custom spell so we can include its description in the log
    const catalogEntry = mySpells.find(e => e.name === spell.name)
    const customInfo = catalogEntry?.data.desc ? ` [Custom: ${catalogEntry.data.desc as string}]` : ''

    if (spell.level === 0) {
      showToast(`Cast ${spell.name}`)
      const sid = getJoinedSession(c.id)
      if (sid) await logEntry(sid, c.name, 'spell_cast', `${c.name} cast ${spell.name} (cantrip)${customInfo}`, { spell: spell.name, level: 0 }, c.id)
      setOpenSpell(null)
      return
    }
    const lvlIdx = castLevel - 1
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
    const sid = getJoinedSession(c.id)
    if (sid) await logEntry(sid, c.name, 'spell_cast', `${c.name} cast ${spell.name} at level ${castLevel}${customInfo}`, { spell: spell.name, level: castLevel }, c.id)
    setOpenSpell(null)
  }

  const addCustomSpell = async () => {
    if (!customSpellName.trim()) return
    const customSpell: Spell = {
      name: customSpellName.trim(),
      level: customSpellLevel,
      school: customSpellSchool,
      desc: customSpellDesc.trim(),
      damage: customSpellDamage.trim() || undefined,
      castTime: '1 action',
      range: 'Self',
      duration: 'Instantaneous',
      components: 'V, S',
      concentration: false,
      ritual: false,
      classes: [c.class],
    }
    const already = (c.spells ?? []).some(s => s.name === customSpell.name)
    if (!already) await patchActiveCharacter({ spells: [...(c.spells ?? []), customSpell] })
    await saveToCatalog({ type: 'spell', name: customSpell.name, data: { level: customSpellLevel, school: customSpellSchool, desc: customSpellDesc.trim(), damage: customSpellDamage.trim() } })
    showToast(`${customSpell.name} saved to My Spells`)
    setCustomSpellName(''); setCustomSpellLevel(0); setCustomSpellSchool('Evocation'); setCustomSpellDesc(''); setCustomSpellDamage('')
    setShowAddModal(false)
  }

  const addFromSpellCatalog = async (entryId: string) => {
    const entry = mySpells.find(e => e.id === entryId)
    if (!entry) return
    const already = (c.spells ?? []).some(s => s.name === entry.name)
    if (already) { showToast('Already known'); return }
    const spell: Spell = {
      name: entry.name,
      level: (entry.data.level as number) ?? 0,
      school: (entry.data.school as string) ?? 'Evocation',
      desc: (entry.data.desc as string) ?? '',
      damage: entry.data.damage as string | undefined,
      castTime: '1 action',
      range: 'Self',
      duration: 'Instantaneous',
      components: 'V, S',
      concentration: false,
      ritual: false,
      classes: [c.class],
    }
    await patchActiveCharacter({ spells: [...(c.spells ?? []), spell] })
    showToast(`${entry.name} added`)
    setShowAddModal(false)
  }

  const stopConcentration = async () => {
    await patchActiveCharacter({ concentration_spell: null })
    showToast('Concentration ended')
  }

  const togglePrepared = async (spellName: string) => {
    const updated = (c.spells ?? []).map(s =>
      s.name === spellName ? { ...s, prepared: !s.prepared } : s
    )
    await patchActiveCharacter({ spells: updated })
  }

  // Group spells by level (filter by prepared for prepared casters)
  const visibleSpells = (c.spells ?? []).filter(s =>
    !isPreparedCaster || s.level === 0 || !preparedOnly || s.prepared
  )
  const preparedCount = isPreparedCaster ? (c.spells ?? []).filter(s => s.level > 0 && s.prepared).length : 0
  const byLevel: Record<number, Spell[]> = {}
  visibleSpells.forEach(spell => {
    if (!byLevel[spell.level]) byLevel[spell.level] = []
    byLevel[spell.level].push(spell)
  })

  const dbSpells = SPELL_DB.filter(s => {
    if (dbFilter === 'mine') return false
    const matchClass = !spellAb || s.classes.includes(c.class)
    const matchLevel = dbFilter === 'all' || s.level === dbFilter
    const matchQuery = !dbQuery || s.name.toLowerCase().includes(dbQuery.toLowerCase())
    return matchClass && matchLevel && matchQuery
  })

  return (
    <div>
      {/* Section header */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Spells</span>
          {isPreparedCaster && (
            <button
              onClick={() => setPreparedOnly(v => !v)}
              style={{ fontSize: 11, padding: '2px 8px', border: `1px solid ${preparedOnly ? 'var(--purple)' : 'var(--border2)'}`, background: preparedOnly ? 'var(--purple-light)' : 'var(--white)', color: preparedOnly ? 'var(--purple)' : 'var(--text3)', borderRadius: 3, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
            >
              Prepared {preparedCount > 0 ? `(${preparedCount})` : ''}
            </button>
          )}
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ fontSize: 13, color: 'var(--purple)', cursor: 'pointer', fontWeight: 500, background: 'none', border: 'none', fontFamily: 'inherit', padding: 0 }}>+ Add Spell</button>
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
          {spells.map(spell => {
            const cs = c.spells?.find(s => s.name === spell.name)
            const isPrepared = cs?.prepared ?? false
            return (
              <SwipeToDelete key={spell.name} onDelete={() => removeSpell(spell.name)}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: '1px solid var(--border)', border: '1px solid var(--border)', borderTop: 'none', gap: 10, background: 'var(--white)', opacity: isPreparedCaster && spell.level > 0 && !isPrepared ? 0.5 : 1 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--white)')}
                >
                  {isPreparedCaster && spell.level > 0 && (
                    <button
                      onClick={e => { e.stopPropagation(); togglePrepared(spell.name) }}
                      title={isPrepared ? 'Unprepare' : 'Prepare'}
                      style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${isPrepared ? 'var(--purple)' : 'var(--border2)'}`, background: isPrepared ? 'var(--purple)' : 'var(--white)', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                    />
                  )}
                  <div style={{ flex: 1 }} onClick={() => setOpenSpell(spell)}>
                    <span style={{ fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>{spell.name}</span>
                    {spell.concentration && <span style={{ fontSize: 10, background: 'var(--teal-light)', color: 'var(--teal2)', padding: '1px 6px', borderRadius: 2, fontWeight: 600, marginLeft: 5 }}>C</span>}
                    {spell.ritual && <span style={{ fontSize: 10, background: '#f3f0ff', color: 'var(--purple)', padding: '1px 6px', borderRadius: 2, fontWeight: 600, marginLeft: 4 }}>R</span>}
                  </div>
                  <span style={{ fontSize: 11, color: SCHOOL_COLORS[spell.school] ?? 'var(--text3)', fontWeight: 600 }} onClick={() => setOpenSpell(spell)}>{spell.school.slice(0, 3).toUpperCase()}</span>
                  {spell.damage && <span style={{ fontSize: 12, color: 'var(--text3)' }} onClick={() => setOpenSpell(spell)}>{spell.damage}</span>}
                </div>
              </SwipeToDelete>
            )
          })}
        </div>
      ))}

      {/* Add spell modal */}
      <AddModal open={showAddModal} onClose={() => { setShowAddModal(false); setDbFilter('all') }} title="Add Spell">
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--white)', zIndex: 2 }}>
          {dbFilter !== 'mine'
            ? <input value={dbQuery} onChange={e => setDbQuery(e.target.value)} placeholder="Search spells..." style={{ width: '100%', border: '1px solid var(--border2)', padding: '9px 12px', fontSize: 15, fontFamily: 'inherit', color: 'var(--text)', borderRadius: 4, outline: 'none', background: 'var(--white)', boxSizing: 'border-box' }} />
            : <div style={{ fontSize: 14, fontWeight: 600, padding: '4px 0' }}>My Custom Spells</div>
          }
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '8px 14px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', position: 'sticky', top: 57, background: 'var(--white)', zIndex: 2 }}>
          <button onClick={() => setDbFilter('mine')} style={{ padding: '4px 10px', border: '1px solid var(--border2)', background: dbFilter === 'mine' ? 'var(--teal)' : 'var(--white)', color: dbFilter === 'mine' ? '#fff' : 'var(--text2)', fontSize: 12, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit', fontWeight: 700 }}>Mine</button>
          {(['all', 0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const).map(f => (
            <button key={String(f)} onClick={() => setDbFilter(f as typeof dbFilter)} style={{ padding: '4px 10px', border: '1px solid var(--border2)', background: dbFilter === f ? 'var(--purple)' : 'var(--white)', color: dbFilter === f ? '#fff' : 'var(--text2)', fontSize: 12, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit' }}>
              {f === 'all' ? 'All' : LEVEL_NAMES[Number(f)]}
            </button>
          ))}
        </div>

        {/* Mine tab */}
        {dbFilter === 'mine' && (
          <div>
            <div style={{ padding: '14px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Create new</div>
              <input value={customSpellName} onChange={e => setCustomSpellName(e.target.value)} placeholder="Spell name" style={{ display: 'block', width: '100%', border: '1px solid var(--border2)', padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', borderRadius: 3, outline: 'none', color: 'var(--text)', background: 'var(--white)', marginBottom: 8, boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>Level</div>
                  <select value={customSpellLevel} onChange={e => setCustomSpellLevel(Number(e.target.value))} style={{ width: '100%', border: '1px solid var(--border2)', padding: '8px 6px', fontSize: 14, fontFamily: 'inherit', borderRadius: 3, outline: 'none', color: 'var(--text)', background: 'var(--white)' }}>
                    {[0,1,2,3,4,5,6,7,8,9].map(l => <option key={l} value={l}>{l === 0 ? 'Cantrip' : `Level ${l}`}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 4 }}>School</div>
                  <select value={customSpellSchool} onChange={e => setCustomSpellSchool(e.target.value)} style={{ width: '100%', border: '1px solid var(--border2)', padding: '8px 6px', fontSize: 14, fontFamily: 'inherit', borderRadius: 3, outline: 'none', color: 'var(--text)', background: 'var(--white)' }}>
                    {['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation'].map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <input value={customSpellDamage} onChange={e => setCustomSpellDamage(e.target.value)} placeholder="Damage (e.g. 2d6 fire) — optional" style={{ display: 'block', width: '100%', border: '1px solid var(--border2)', padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', borderRadius: 3, outline: 'none', color: 'var(--text)', background: 'var(--white)', marginBottom: 8, boxSizing: 'border-box' }} />
              <textarea value={customSpellDesc} onChange={e => setCustomSpellDesc(e.target.value)} placeholder="Description / effect (shown in DM log when cast)" rows={3} style={{ display: 'block', width: '100%', border: '1px solid var(--border2)', padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', borderRadius: 3, outline: 'none', color: 'var(--text)', background: 'var(--white)', marginBottom: 10, boxSizing: 'border-box', resize: 'vertical' }} />
              <button onClick={addCustomSpell} disabled={!customSpellName.trim()} style={{ display: 'block', width: '100%', padding: 11, background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit', opacity: customSpellName.trim() ? 1 : 0.5 }}>Save & Add Spell</button>
            </div>
            {mySpells.length === 0 && <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>No custom spells saved yet.</div>}
            {mySpells.map(entry => {
              const added = (c.spells ?? []).some(s => s.name === entry.name)
              return (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--border)', gap: 10, background: 'var(--white)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{entry.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                      {LEVEL_NAMES[(entry.data.level as number) ?? 0]} · {entry.data.school as string}
                      {entry.data.damage ? ` · ${entry.data.damage as string}` : ''}
                    </div>
                    {(entry.data.desc as string) && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontStyle: 'italic' }}>{entry.data.desc as string}</div>}
                  </div>
                  <button onClick={() => addFromSpellCatalog(entry.id)} disabled={added} style={{ padding: '5px 12px', border: '1px solid var(--teal)', background: added ? 'var(--bg)' : 'var(--teal-light)', color: added ? 'var(--text3)' : 'var(--teal2)', fontSize: 12, fontWeight: 600, cursor: added ? 'default' : 'pointer', borderRadius: 3, fontFamily: 'inherit', flexShrink: 0 }}>
                    {added ? '✓ Added' : '+ Add'}
                  </button>
                  <button onClick={() => removeFromCatalog(entry.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14, padding: '0 2px', fontFamily: 'inherit', flexShrink: 0 }}>✕</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Standard DB */}
        {dbFilter !== 'mine' && (
          <>
            {dbSpells.length === 0 && <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>No spells found</div>}
            {dbSpells.map(spell => {
              const added = (c.spells ?? []).some(s => s.name === spell.name)
              return (
                <div key={spell.name} onClick={() => { if (!added) { addSpell(spell); setShowAddModal(false) } }} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--border)', cursor: added ? 'default' : 'pointer', background: 'var(--white)', opacity: added ? 0.45 : 1 }}
                  onMouseEnter={e => { if (!added) (e.currentTarget as HTMLElement).style.background = 'var(--purple-light)' }}
                  onMouseLeave={e => { if (!added) (e.currentTarget as HTMLElement).style.background = 'var(--white)' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{spell.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{spell.school} · {spell.castTime}{spell.concentration ? ' · Conc.' : ''}{spell.ritual ? ' · Ritual' : ''}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)', marginRight: 12, minWidth: 44, textAlign: 'right' }}>{LEVEL_NAMES[spell.level]}</span>
                  <span style={{ fontSize: 13, color: added ? 'var(--text3)' : 'var(--purple)', fontWeight: 600, minWidth: 40, textAlign: 'right' }}>{added ? '✓' : '+ Add'}</span>
                </div>
              )
            })}
          </>
        )}
      </AddModal>

      {/* Spell detail modal */}
      {openSpell && <SpellDetail spell={openSpell} character={c} onClose={() => setOpenSpell(null)} onCast={castSpell} onRemove={removeSpell} slots={slots} slotsUsed={c.spell_slots_used ?? []} />}
    </div>
  )
}

function SpellDetail({ spell, character: _c, onClose, onCast, onRemove, slots, slotsUsed }: { spell: Spell; character: Character; onClose: () => void; onCast: (s: Spell, lvl?: number) => void; onRemove: (name: string) => void; slots: number[]; slotsUsed: number[] }) {
  const availableSlots = slots.map((total, i) => ({ level: i + 1, remaining: total - (slotsUsed[i] ?? 0) })).filter(s => s.level >= spell.level && s.remaining > 0)

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }} className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div className="sheet-panel" style={{ background: 'var(--white)', width: '100%', maxWidth: 600, maxHeight: '85vh', borderRadius: '14px 14px 0 0', overflowY: 'auto', padding: '20px 16px 32px' }}>
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
