import { useState } from 'react'
import type { Character } from '@/types'
import { WEAPON_DB, WEAPON_CATEGORIES, FINESSE_WEAPONS } from '@/data'
import { mod, profBonus, fmtBonus } from '@/lib/calculations'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'
import AddModal from '@/components/shared/AddModal'
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
  const { showToast, editMode } = useUIStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [dbFilter, setDbFilter] = useState('All')
  const [dbQuery, setDbQuery] = useState('')
  const [openWeapon, setOpenWeapon] = useState<Weapon | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customDamage, setCustomDamage] = useState('1d6')
  const [customType, setCustomType] = useState('slashing')

  const finesseChoices = c.weapon_finesse_choices ?? {}
  const activeWeapon = c.active_weapon ?? c.weapons?.[0]?.name ?? null

  const addFromDB = async (name: string) => {
    if ((c.weapons ?? []).some(w => w.name === name)) { showToast('Already have this weapon'); return }
    const w = WEAPON_DB.find(x => x.name === name)!
    await patchActiveCharacter({ weapons: [...(c.weapons ?? []), { name: w.name }] })
    showToast(`${name} added`)
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

  const addCustom = async () => {
    if (!customName.trim()) return
    const w = { name: customName.trim(), damage: customDamage, damageType: customType, isCustom: true }
    await patchActiveCharacter({ weapons: [...(c.weapons ?? []), w] })
    showToast(`${w.name} added`)
    setCustomName(''); setCustomDamage('1d6'); setCustomType('slashing')
    setShowCustom(false); setShowAddModal(false)
  }

  const filteredDB = WEAPON_DB.filter(w => {
    const matchCat = dbFilter === 'All' || w.category === dbFilter
    const matchQ = !dbQuery || w.name.toLowerCase().includes(dbQuery.toLowerCase())
    return matchCat && matchQ
  })

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
        const dmgStr = dbW ? `${dbW.damage}${dmg !== 0 ? (dmg > 0 ? '+' : '') + dmg : ''} ${dbW.damageType}` : customW ? customW.damage ?? '—' : '—'

        return (
          <div style={{ background: 'var(--teal-light)', border: '1px solid var(--teal)', borderTop: 'none', padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal2)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Active Weapon</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{activeWeapon}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{dmgStr}</div>
              </div>
              {dbW && <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--teal2)' }}>{fmtBonus(atk)}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>to hit</div>
              </div>}
            </div>
            {dbW && FINESSE_WEAPONS.includes(activeWeapon) && (
              <button onClick={() => toggleFinesse(activeWeapon)} style={{ marginTop: 8, padding: '3px 10px', border: '1px solid var(--teal)', background: 'var(--white)', color: 'var(--teal2)', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', fontWeight: 600 }}>
                Using {(finesseChoices[activeWeapon] ?? 'str').toUpperCase()} (tap to switch)
              </button>
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
          <div key={w.name} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border)', border: '1px solid var(--border)', borderTop: 'none', background: isActive ? '#f8fffe' : 'var(--white)', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: isActive ? 600 : 500 }}>{w.name}</div>
              {dbW && <div style={{ fontSize: 12, color: 'var(--text3)' }}>{dbW.damage} {dbW.damageType} · {dbW.category}</div>}
            </div>
            {atk !== null && <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal2)', minWidth: 32, textAlign: 'right' }}>{fmtBonus(atk)}</span>}
            {!isActive && <button onClick={() => setActive(w.name)} style={{ padding: '4px 10px', border: '1px solid var(--border2)', background: 'var(--white)', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--text2)' }}>Equip</button>}
            {dbW && <button onClick={() => setOpenWeapon(dbW)} style={{ padding: '4px 10px', border: '1px solid var(--border2)', background: 'var(--white)', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--text2)' }}>Info</button>}
            {editMode && <button onClick={() => removeWeapon(w.name)} style={{ padding: '4px 8px', border: '1px solid var(--red)', background: '#fde8e8', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--red)' }}>✕</button>}
          </div>
        )
      })}

      {/* Add weapon modal */}
      <AddModal open={showAddModal} onClose={() => { setShowAddModal(false); setShowCustom(false) }} title="Add Weapon">
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--white)', zIndex: 2 }}>
          <input autoFocus value={dbQuery} onChange={e => setDbQuery(e.target.value)} placeholder="Search weapons..." style={{ width: '100%', border: '1px solid var(--border2)', padding: '9px 12px', fontSize: 15, fontFamily: 'inherit', color: 'var(--text)', borderRadius: 4, outline: 'none', background: 'var(--white)', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '8px 14px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', position: 'sticky', top: 57, background: 'var(--white)', zIndex: 2 }}>
          {['All', ...WEAPON_CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setDbFilter(cat)} style={{ padding: '4px 8px', border: '1px solid var(--border2)', background: dbFilter === cat ? 'var(--purple)' : 'var(--white)', color: dbFilter === cat ? '#fff' : 'var(--text2)', fontSize: 11, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit' }}>
              {cat === 'Simple Melee' ? 'Simple' : cat === 'Martial Melee' ? 'Martial' : cat === 'Simple Ranged' ? 'S.Ranged' : cat === 'Martial Ranged' ? 'M.Ranged' : cat}
            </button>
          ))}
        </div>

        {filteredDB.map(w => {
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

        {/* Custom weapon */}
        <div style={{ padding: '14px', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => setShowCustom(!showCustom)} style={{ fontSize: 14, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>+ Custom weapon</button>
          {showCustom && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Name" style={{ flex: 2, border: '1px solid var(--border2)', padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', borderRadius: 3, outline: 'none', color: 'var(--text)', background: 'var(--white)' }} />
                <input value={customDamage} onChange={e => setCustomDamage(e.target.value)} placeholder="1d6" style={{ flex: 1, border: '1px solid var(--border2)', padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', borderRadius: 3, outline: 'none', color: 'var(--text)', background: 'var(--white)' }} />
              </div>
              <button onClick={addCustom} disabled={!customName.trim()} style={{ display: 'block', width: '100%', padding: 11, background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit', opacity: customName.trim() ? 1 : 0.5 }}>Add Custom Weapon</button>
            </div>
          )}
        </div>
      </AddModal>

      {/* Weapon detail */}
      {openWeapon && (
        <div onClick={e => { if (e.target === e.currentTarget) setOpenWeapon(null) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: 'var(--white)', width: '100%', maxWidth: 600, borderRadius: '14px 14px 0 0', padding: '20px 16px 32px', maxHeight: '80vh', overflowY: 'auto' }}>
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
