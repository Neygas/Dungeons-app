import { useState } from 'react'
import type { Character } from '@/types'
import { ARMOR_DB, ARMOR_CATEGORIES } from '@/data'
import { calcArmorAC } from '@/lib/calculations'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'

interface Props { character: Character }

export default function ArmorSection({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { showToast, editMode } = useUIStore()
  const [showDB, setShowDB] = useState(false)
  const [dbFilter, setDbFilter] = useState('All')

  const equipArmor = async (name: string) => {
    const updates: Partial<Character> = { equipped_armor: name }
    await patchActiveCharacter(updates)
    showToast(`${name} equipped`)
  }

  const unequipArmor = async () => {
    await patchActiveCharacter({ equipped_armor: null })
    showToast('Armor unequipped')
  }

  const toggleShield = async () => {
    await patchActiveCharacter({ equipped_shield: !c.equipped_shield })
    showToast(c.equipped_shield ? 'Shield unequipped' : 'Shield equipped')
  }

  const addArmor = async (name: string) => {
    if ((c.armor ?? []).includes(name)) { showToast('Already have this'); return }
    await patchActiveCharacter({ armor: [...(c.armor ?? []), name] })
    showToast(`${name} added`)
  }

  const removeArmor = async (name: string) => {
    const next = (c.armor ?? []).filter(a => a !== name)
    const updates: Partial<Character> = { armor: next }
    if (c.equipped_armor === name) updates.equipped_armor = null
    await patchActiveCharacter(updates)
    showToast('Removed')
  }

  const ac = calcArmorAC(c)
  const equippedArmorData = ARMOR_DB.find(a => a.name === c.equipped_armor)
  const filteredDB = ARMOR_DB.filter(a => dbFilter === 'All' || a.category === dbFilter)

  return (
    <div>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Armor</span>
        <button onClick={() => setShowDB(!showDB)} style={{ fontSize: 13, color: 'var(--purple)', cursor: 'pointer', fontWeight: 500, background: 'none', border: 'none', fontFamily: 'inherit', padding: 0 }}>+ Add Armor</button>
      </div>

      {/* AC summary */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ textAlign: 'center', minWidth: 48 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--teal2)' }}>{ac}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>AC</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            {equippedArmorData ? equippedArmorData.name : 'Unarmored'}
            {c.equipped_shield ? ' + Shield' : ''}
          </div>
          {equippedArmorData?.stealthDis && (
            <div style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600, marginTop: 2 }}>⚠ Stealth disadvantage</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {c.equipped_armor && (
            <button onClick={unequipArmor} style={{ padding: '5px 10px', border: '1px solid var(--border2)', background: 'var(--white)', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--text2)' }}>Unequip</button>
          )}
          <button onClick={toggleShield} style={{ padding: '5px 10px', border: `1px solid ${c.equipped_shield ? 'var(--teal)' : 'var(--border2)'}`, background: c.equipped_shield ? 'var(--teal-light)' : 'var(--white)', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: c.equipped_shield ? 'var(--teal2)' : 'var(--text2)', fontWeight: c.equipped_shield ? 600 : 400 }}>Shield</button>
        </div>
      </div>

      {/* Armor list */}
      {(c.armor ?? []).map(name => {
        const a = ARMOR_DB.find(x => x.name === name)
        const isEquipped = c.equipped_armor === name
        return (
          <div key={name} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--border)', borderTop: 'none', background: isEquipped ? '#f8fffe' : 'var(--white)', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: isEquipped ? 600 : 500 }}>{name}</div>
              {a && <div style={{ fontSize: 12, color: 'var(--text3)' }}>AC {a.ac}{a.dexBonus ? ` + DEX${a.maxDex ? ` (max ${a.maxDex})` : ''}` : ''} · {a.category}</div>}
            </div>
            {!isEquipped && name !== 'Shield' && (
              <button onClick={() => equipArmor(name)} style={{ padding: '4px 10px', border: '1px solid var(--border2)', background: 'var(--white)', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--text2)' }}>Equip</button>
            )}
            {editMode && (
              <button onClick={() => removeArmor(name)} style={{ padding: '4px 8px', border: '1px solid var(--red)', background: '#fde8e8', fontSize: 12, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', color: 'var(--red)' }}>✕</button>
            )}
          </div>
        )
      })}

      {/* Armor DB */}
      {showDB && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', maxHeight: 350, overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 6, padding: '8px 14px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap' }}>
            {['All', ...ARMOR_CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setDbFilter(cat)} style={{ padding: '3px 8px', border: '1px solid var(--border2)', background: dbFilter === cat ? 'var(--purple)' : 'var(--white)', color: dbFilter === cat ? '#fff' : 'var(--text2)', fontSize: 11, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>
                {cat === 'Light Armor' ? 'Light' : cat === 'Medium Armor' ? 'Medium' : cat === 'Heavy Armor' ? 'Heavy' : cat}
              </button>
            ))}
          </div>
          {filteredDB.map(a => {
            const added = (c.armor ?? []).includes(a.name)
            return (
              <div key={a.name} onClick={() => !added && addArmor(a.name)} style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: '1px solid var(--border)', cursor: added ? 'default' : 'pointer', opacity: added ? 0.5 : 1 }}
                onMouseEnter={e => { if (!added) (e.currentTarget as HTMLElement).style.background = 'var(--purple-light)' }}
                onMouseLeave={e => { if (!added) (e.currentTarget as HTMLElement).style.background = '' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{a.category} · {a.cost}</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--purple)', minWidth: 32, textAlign: 'right' }}>
                  {a.category === 'Shield' ? '+' : ''}{a.ac}
                </span>
                <span style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 600, marginLeft: 12 }}>{added ? '✓' : '+ Add'}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
