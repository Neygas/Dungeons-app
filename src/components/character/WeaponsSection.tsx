import { useEffect, useState } from 'react'
import type { Character } from '@/types'
import { WEAPON_DB, WEAPON_CATEGORIES, FINESSE_WEAPONS, AMMO_MAP } from '@/data'
import { mod, profBonus, fmtBonus } from '@/lib/calculations'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { useCustomPlayerCatalogStore } from '@/store/customPlayerCatalogStore'
import AddModal from '@/components/shared/AddModal'
import SwipeToDelete from '@/components/shared/SwipeToDelete'
import type { Weapon } from '@/types'

interface Props { character: Character }

const MARTIAL_CLASSES = ['Barbarian', 'Fighter', 'Paladin', 'Ranger']

function isProficient(c: Character, w: Weapon) {
  if (MARTIAL_CLASSES.includes(c.class)) return true
  return !w.category.startsWith('Martial')
}

function atkBonus(c: Character, w: Weapon, finesseChoice?: 'str' | 'dex'): number {
  const pb = profBonus(c.level)
  const prof = isProficient(c, w) ? pb : 0
  const isFinesse = w.properties.some(p => p.startsWith('Finesse'))
  const isRanged = w.category.includes('Ranged')
  if (isFinesse) {
    const k = finesseChoice ?? 'str'
    return mod(c[k as 'str' | 'dex']) + prof
  }
  if (isRanged) return mod(c.dex) + prof
  return mod(c.str) + prof
}

function dmgBonus(c: Character, w: Weapon, finesseChoice?: 'str' | 'dex'): number {
  const isFinesse = w.properties.some(p => p.startsWith('Finesse'))
  const isRanged = w.category.includes('Ranged')
  if (isFinesse) return mod(c[(finesseChoice ?? 'str') as 'str' | 'dex'])
  if (isRanged) return mod(c.dex)
  return mod(c.str)
}

export default function WeaponsSection({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { showToast } = useUIStore()
  const { logEntry, getJoinedSession } = useSessionStore()
  const { entries: catalogEntries, load: loadCatalog, save: saveToCatalog, remove: removeFromCatalog } = useCustomPlayerCatalogStore()

  const [showAddModal, setShowAddModal] = useState(false)
  const [dbFilter, setDbFilter] = useState<string>('All')
  const [dbQuery, setDbQuery] = useState('')
  const [openWeapon, setOpenWeapon] = useState<Weapon | null>(null)

  // Custom weapon form
  const [customName, setCustomName] = useState('')
  const [customDamage, setCustomDamage] = useState('1d6')
  const [customType, setCustomType] = useState('slashing')
  const [customNotes, setCustomNotes] = useState('')

  const finesseChoices = c.weapon_finesse_choices ?? {}
  const activeWeapon = c.active_weapon ?? c.weapons?.[0]?.name ?? null
  const myWeapons = catalogEntries.filter(e => e.type === 'weapon')

  useEffect(() => { loadCatalog() }, [loadCatalog])

  const addFromDB = async (name: string) => {
    if ((c.weapons ?? []).some(w => w.name === name)) { showToast('Already have this weapon'); return }
    const w = WEAPON_DB.find(x => x.name === name)!
    const updates: Partial<Character> = { weapons: [...(c.weapons ?? []), { name: w.name }] }
    const ammoEntry = AMMO_MAP[name]
    if (ammoEntry) {
      const ammoName = ammoEntry.replace(/ \(\d+\)/, '')
      const qty = parseInt(ammoEntry.match(/\((\d+)\)/)?.[1] ?? '20')
      const existing = (c.inventory ?? []).find(i => i.name === ammoName)
      if (!existing) {
        updates.inventory = [...(c.inventory ?? []), { name: ammoName, quantity: qty }]
      }
    }
    await patchActiveCharacter(updates)
    showToast(ammoEntry ? `${name} added + ${ammoEntry.replace(/ \(\d+\)/, '')} stocked` : `${name} added`)
  }

  const getAmmoName = (weaponName: string) => {
    const entry = AMMO_MAP[weaponName]
    return entry ? entry.replace(/ \(\d+\)/, '') : null
  }
  const getAmmoCount = (ammoName: string) => (c.inventory ?? []).find(i => i.name === ammoName)?.quantity ?? 0
  const adjustAmmo = async (ammoName: string, delta: number) => {
    const inv = c.inventory ?? []
    const existing = inv.find(i => i.name === ammoName)
    if (!existing && delta > 0) {
      await patchActiveCharacter({ inventory: [...inv, { name: ammoName, quantity: delta }] })
    } else if (existing) {
      const newQty = Math.max(0, existing.quantity + delta)
      const next = newQty === 0 ? inv.filter(i => i.name !== ammoName) : inv.map(i => i.name === ammoName ? { ...i, quantity: newQty } : i)
      await patchActiveCharacter({ inventory: next })
    }
  }

  const removeWeapon = async (name: string) => {
    await patchActiveCharacter({
      weapons: (c.weapons ?? []).filter(w => w.name !== name),
      active_weapon: c.active_weapon === name ? null : c.active_weapon,
    })
    showToast('Weapon removed')
  }

  const setActive = async (name: string) => {
    await patchActiveCharacter({ active_weapon: name })
    showToast(`${name} equipped`)
  }

  const toggleFinesse = async (name: string) => {
    const current = finesseChoices[name] ?? 'str'
    const next = current === 'str' ? 'dex' : 'str'
    await patchActiveCharacter({ weapon_finesse_choices: { ...finesseChoices, [name]: next } })
  }

  const useWeapon = async () => {
    if (!activeWeapon) return
    const sid = getJoinedSession(c.id)
    const ammoName = getAmmoName(activeWeapon)
    // Check if it's a custom weapon so we can include its info in the log
    const catalogEntry = myWeapons.find(e => e.name === activeWeapon)
    const customInfo = catalogEntry ? ` [Custom · ${(catalogEntry.data.damage as string) ?? ''} ${(catalogEntry.data.damageType as string) ?? ''}${catalogEntry.data.notes ? ' · ' + catalogEntry.data.notes : ''}]` : ''
    if (ammoName) {
      const count = getAmmoCount(ammoName)
      if (count <= 0) { showToast('No ammo!'); return }
      await adjustAmmo(ammoName, -1)
      if (sid) await logEntry(sid, c.name, 'attack', `${c.name} attacked with ${activeWeapon}${customInfo} (${ammoName}: ${count - 1} remaining)`, {}, c.id)
    } else {
      if (sid) await logEntry(sid, c.name, 'attack', `${c.name} attacked with ${activeWeapon}${customInfo}`, {}, c.id)
    }
    showToast(`Attack with ${activeWeapon}`)
  }

  const addCustom = async () => {
    if (!customName.trim()) return
    const w = { name: customName.trim(), damage: customDamage, damageType: customType, isCustom: true }
    // Save to character
    await patchActiveCharacter({ weapons: [...(c.weapons ?? []), w] })
    // Save to account catalog
    await saveToCatalog({ type: 'weapon', name: customName.trim(), data: { damage: customDamage, damageType: customType, notes: customNotes.trim() } })
    showToast(`${w.name} saved to My Weapons`)
    setCustomName(''); setCustomDamage('1d6'); setCustomType('slashing'); setCustomNotes('')
    setShowAddModal(false)
  }

  const addFromCatalog = async (entryId: string) => {
    const entry = myWeapons.find(e => e.id === entryId)
    if (!entry) return
    if ((c.weapons ?? []).some(w => w.name === entry.name)) { showToast('Already have this weapon'); return }
    await patchActiveCharacter({ weapons: [...(c.weapons ?? []), { name: entry.name, damage: entry.data.damage as string, damageType: entry.data.damageType as string, isCustom: true }] })
    showToast(`${entry.name} added`)
    setShowAddModal(false)
  }

  const filteredDB = WEAPON_DB.filter(w => {
    const matchCat = dbFilter === 'All' || w.category === dbFilter
    const matchQ = !dbQuery || w.name.toLowerCase().includes(dbQuery.toLowerCase())
    return matchCat && matchQ
  })

  const showMine = dbFilter === 'Mine'

  return (
    <div>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Weapons</span>
        <button onClick={() => setShowAddModal(true)} style={{ fontSize: 13, color: 'var(--purple)', cursor: 'pointer', fontWeight: 500, background: 'none', border: 'none', fontFamily: 'inherit', padding: 0 }}>+ Add Weapon</button>
      </div>

      {/* Active weapon card */}
      {activeWeapon && (() => {
        const dbW = WEAPON_DB.find(w => w.name === activeWeapon)
        const customW = (c.weapons ?? []).find(w => w.name === activeWeapon && w.isCustom)
        const fc = finesseChoices[activeWeapon]
        const atk = dbW ? atkBonus(c, dbW, fc) : 0
        const dmg = dbW ? dmgBonus(c, dbW, fc) : 0
        const dmgStr = dbW ? `${dbW.damage}${dmg !== 0 ? (dmg > 0 ? '+' : '') + dmg : ''} ${dbW.damageType}` : customW ? `${customW.damage ?? '—'} ${customW.damageType ?? ''}`.trim() : '—'
        const ammoName = getAmmoName(activeWeapon)
        const ammoCount = ammoName ? getAmmoCount(ammoName) : 0
        const catalogEntry = myWeapons.find(e => e.name === activeWeapon)

        return (
          <div style={{ background: 'var(--teal-light)', border: '1px solid var(--teal)', borderTop: 'none', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal2)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Active Weapon</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{activeWeapon}</div>
                  {customW && <span style={{ fontSize: 10, background: 'rgba(0,0,0,.08)', color: 'var(--teal2)', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>CUSTOM</span>}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{dmgStr}</div>
                {catalogEntry?.data.notes && <div style={{ fontSize: 12, color: 'var(--teal2)', marginTop: 2, fontStyle: 'italic' }}>{catalogEntry.data.notes as string}</div>}
              </div>
              {dbW && <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--teal2)' }}>{fmtBonus(atk)}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>to hit</div>
              </div>}
            </div>
            {dbW && FINESSE_WEAPONS.includes(activeWeapon) && (
              <button onClick={() => toggleFinesse(activeWeapon)} style={{ marginTop: 8, padding: '3px 10px', border: '1px solid var(--teal)', background: 'var(--white)', color: 'var(--teal2)', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', fontWeight: 600 }}>
                Using {(finesseChoices[activeWeapon] ?? 'str').toUpperCase()} — tap to switch
              </button>
            )}
            <button
              onClick={useWeapon}
              style={{ marginTop: 10, display: 'block', width: '100%', padding: '9px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', letterSpacing: '.3px' }}
            >
              Use — Attack
            </button>
            {ammoName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(0,128,110,.25)' }}>
                <span style={{ fontSize: 12, color: 'var(--teal2)', flex: 1, fontWeight: 500 }}>{ammoName}</span>
                <button onClick={() => adjustAmmo(ammoName, -1)} style={{ width: 28, height: 28, border: '1px solid var(--teal)', background: 'var(--white)', cursor: 'pointer', fontSize: 15, borderRadius: 3, color: 'var(--teal2)', fontFamily: 'inherit', padding: 0 }}>−</button>
                <span style={{ fontSize: 16, fontWeight: 700, color: ammoCount === 0 ? 'var(--red)' : 'var(--teal2)', minWidth: 28, textAlign: 'center' }}>{ammoCount}</span>
                <button onClick={() => adjustAmmo(ammoName, 1)} style={{ width: 28, height: 28, border: '1px solid var(--teal)', background: 'var(--white)', cursor: 'pointer', fontSize: 15, borderRadius: 3, color: 'var(--teal2)', fontFamily: 'inherit', padding: 0 }}>+</button>
              </div>
            )}
          </div>
        )
      })()}

      {/* Weapon list */}
      {(c.weapons ?? []).map(w => {
        const dbW = WEAPON_DB.find(x => x.name === w.name)
        const fc = finesseChoices[w.name]
        const atk = dbW ? atkBonus(c, dbW, fc) : null
        const isActive = w.name === activeWeapon
        return (
          <SwipeToDelete key={w.name} onDelete={() => removeWeapon(w.name)}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border)', border: '1px solid var(--border)', borderTop: 'none', background: isActive ? '#f8fffe' : 'var(--white)', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontSize: 14, fontWeight: isActive ? 600 : 500 }}>{w.name}</span>
                  {w.isCustom && <span style={{ fontSize: 9, background: 'var(--teal-light)', color: 'var(--teal2)', padding: '1px 4px', borderRadius: 2, fontWeight: 700 }}>CUSTOM</span>}
                </div>
                {dbW && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{dbW.damage} {dbW.damageType} · {dbW.category}</div>}
                {w.isCustom && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{w.damage} {w.damageType}</div>}
              </div>
              {atk !== null && <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal2)', minWidth: 32, textAlign: 'right' }}>{fmtBonus(atk)}</span>}
              {!isActive && <button onClick={() => setActive(w.name)} style={{ padding: '4px 10px', border: '1px solid var(--border2)', background: 'var(--white)', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--text2)' }}>Equip</button>}
              {dbW && <button onClick={() => setOpenWeapon(dbW)} style={{ padding: '4px 10px', border: '1px solid var(--border2)', background: 'var(--white)', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--text2)' }}>Info</button>}
            </div>
          </SwipeToDelete>
        )
      })}

      {/* Add weapon modal */}
      <AddModal open={showAddModal} onClose={() => { setShowAddModal(false); setDbFilter('All') }} title="Add Weapon">
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--white)', zIndex: 2 }}>
          {!showMine && <input value={dbQuery} onChange={e => setDbQuery(e.target.value)} placeholder="Search weapons..." style={{ width: '100%', border: '1px solid var(--border2)', padding: '9px 12px', fontSize: 15, fontFamily: 'inherit', color: 'var(--text)', borderRadius: 4, outline: 'none', background: 'var(--white)', boxSizing: 'border-box' }} />}
          {showMine && <div style={{ fontSize: 14, fontWeight: 600, padding: '4px 0' }}>My Custom Weapons</div>}
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '8px 14px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', position: 'sticky', top: 57, background: 'var(--white)', zIndex: 2 }}>
          {['Mine', 'All', ...WEAPON_CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setDbFilter(cat)} style={{ padding: '4px 8px', border: '1px solid var(--border2)', background: dbFilter === cat ? (cat === 'Mine' ? 'var(--teal)' : 'var(--purple)') : 'var(--white)', color: dbFilter === cat ? '#fff' : 'var(--text2)', fontSize: 11, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit', fontWeight: cat === 'Mine' ? 700 : 400 }}>
              {cat === 'Simple Melee' ? 'Simple' : cat === 'Martial Melee' ? 'Martial' : cat === 'Simple Ranged' ? 'S.Ranged' : cat === 'Martial Ranged' ? 'M.Ranged' : cat}
            </button>
          ))}
        </div>

        {/* Mine tab */}
        {showMine && (
          <div>
            {/* Create new form */}
            <div style={{ padding: '14px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>Create new</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Weapon name" style={{ flex: 2, border: '1px solid var(--border2)', padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', borderRadius: 3, outline: 'none', color: 'var(--text)', background: 'var(--white)' }} />
                <input value={customDamage} onChange={e => setCustomDamage(e.target.value)} placeholder="1d6" style={{ flex: 1, border: '1px solid var(--border2)', padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', borderRadius: 3, outline: 'none', color: 'var(--text)', background: 'var(--white)' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <select value={customType} onChange={e => setCustomType(e.target.value)} style={{ flex: 1, border: '1px solid var(--border2)', padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', borderRadius: 3, outline: 'none', color: 'var(--text)', background: 'var(--white)' }}>
                  {['slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'lightning', 'poison', 'acid', 'necrotic', 'radiant', 'psychic', 'force', 'thunder'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <input value={customNotes} onChange={e => setCustomNotes(e.target.value)} placeholder="Notes / description (shown in DM log)" style={{ display: 'block', width: '100%', border: '1px solid var(--border2)', padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', borderRadius: 3, outline: 'none', color: 'var(--text)', background: 'var(--white)', marginBottom: 10, boxSizing: 'border-box' }} />
              <button onClick={addCustom} disabled={!customName.trim()} style={{ display: 'block', width: '100%', padding: 11, background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit', opacity: customName.trim() ? 1 : 0.5 }}>Save & Add to Character</button>
            </div>

            {/* Saved catalog */}
            {myWeapons.length === 0 && <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>No custom weapons saved yet.</div>}
            {myWeapons.map(entry => {
              const alreadyHave = (c.weapons ?? []).some(w => w.name === entry.name)
              return (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--border)', gap: 10, background: 'var(--white)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>{entry.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                      {entry.data.damage as string} {entry.data.damageType as string}
                      {entry.data.notes ? ` · ${entry.data.notes as string}` : ''}
                    </div>
                  </div>
                  <button onClick={() => addFromCatalog(entry.id)} disabled={alreadyHave} style={{ padding: '5px 12px', border: '1px solid var(--teal)', background: alreadyHave ? 'var(--bg)' : 'var(--teal-light)', color: alreadyHave ? 'var(--text3)' : 'var(--teal2)', fontSize: 12, fontWeight: 600, cursor: alreadyHave ? 'default' : 'pointer', borderRadius: 3, fontFamily: 'inherit', flexShrink: 0 }}>
                    {alreadyHave ? '✓ Added' : '+ Add'}
                  </button>
                  <button onClick={() => removeFromCatalog(entry.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14, padding: '0 2px', fontFamily: 'inherit', flexShrink: 0 }}>✕</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Standard DB */}
        {!showMine && filteredDB.map(w => {
          const added = (c.weapons ?? []).some(x => x.name === w.name)
          return (
            <div key={w.name} onClick={() => setOpenWeapon(w)} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: 'var(--white)', opacity: added ? 0.45 : 1 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--purple-light)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--white)' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{w.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{w.damage} {w.damageType} · {w.category}</div>
              </div>
              <span style={{ fontSize: 13, color: added ? 'var(--text3)' : 'var(--purple)', fontWeight: 600, minWidth: 40, textAlign: 'right' }}>{added ? '✓' : '+ Add'}</span>
            </div>
          )
        })}
      </AddModal>

      {/* Weapon detail */}
      {openWeapon && (
        <div onClick={e => { if (e.target === e.currentTarget) setOpenWeapon(null) }} className="sheet-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div className="sheet-panel" style={{ background: 'var(--white)', width: '100%', maxWidth: 600, borderRadius: '14px 14px 0 0', padding: '20px 16px 32px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{openWeapon.name}</div>
              <button onClick={() => setOpenWeapon(null)} style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, color: 'var(--text2)' }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>{openWeapon.category}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 14 }}>
              {[['Damage', `${openWeapon.damage} ${openWeapon.damageType}`], ['Attack Bonus', fmtBonus(atkBonus(c, openWeapon, finesseChoices[openWeapon.name]))], ['Range', openWeapon.range ?? '5ft'], ['Cost', openWeapon.cost], ['Weight', openWeapon.weight], ...(openWeapon.versatile ? [['Versatile', openWeapon.versatile]] : [])].map(([k, v]) => (
                <div key={k}><div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{k}</div><div style={{ fontSize: 14, fontWeight: k === 'Damage' || k === 'Attack Bonus' ? 700 : 400, marginTop: 2 }}>{v}</div></div>
              ))}
            </div>
            {openWeapon.properties.length > 0 && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 4 }}>Properties</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{openWeapon.properties.map(p => <span key={p} style={{ padding: '2px 8px', background: 'var(--purple-light)', color: 'var(--purple)', borderRadius: 2, fontSize: 12, fontWeight: 500 }}>{p}</span>)}</div></div>}
            <button onClick={() => { addFromDB(openWeapon.name); setOpenWeapon(null); setShowAddModal(false) }} style={{ display: 'block', width: '100%', padding: 12, background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>+ Add to Character</button>
          </div>
        </div>
      )}
    </div>
  )
}
