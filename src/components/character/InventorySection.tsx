import { useState } from 'react'
import type { Character, InventoryItem } from '@/types'
import { GEAR_DB, GEAR_CATEGORIES } from '@/data'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'

interface Props { character: Character }

export default function InventorySection({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { showToast, editMode } = useUIStore()
  const [showDB, setShowDB] = useState(false)
  const [dbFilter, setDbFilter] = useState('All')
  const [dbQuery, setDbQuery] = useState('')
  const [customName, setCustomName] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const adjustQty = async (name: string, delta: number) => {
    const next = (c.inventory ?? []).map(item =>
      item.name === name ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ).filter(item => item.quantity > 0)
    await patchActiveCharacter({ inventory: next })
  }

  const addFromDB = async (name: string) => {
    const gear = GEAR_DB.find(g => g.name === name)
    if (!gear) return
    const existing = (c.inventory ?? []).find(i => i.name === name)
    if (existing) {
      await adjustQty(name, 1)
    } else {
      await patchActiveCharacter({ inventory: [...(c.inventory ?? []), { name, quantity: 1, desc: gear.desc, cost: gear.cost }] })
    }
    showToast(`${name} added`)
  }

  const addCustom = async () => {
    if (!customName.trim()) return
    const existing = (c.inventory ?? []).find(i => i.name === customName.trim())
    if (existing) { await adjustQty(customName.trim(), 1) }
    else { await patchActiveCharacter({ inventory: [...(c.inventory ?? []), { name: customName.trim(), quantity: 1 }] }) }
    showToast(`${customName.trim()} added`)
    setCustomName('')
  }

  const setCurrency = async (field: 'pp' | 'gp' | 'ep' | 'sp' | 'cp', val: string) => {
    const n = Math.max(0, parseInt(val) || 0)
    await patchActiveCharacter({ [field]: n })
  }

  const filteredDB = GEAR_DB.filter(g => {
    const matchCat = dbFilter === 'All' || g.category === dbFilter
    const matchQ = !dbQuery || g.name.toLowerCase().includes(dbQuery.toLowerCase())
    return matchCat && matchQ
  })

  return (
    <div>
      {/* Inventory header */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Inventory</span>
        <button onClick={() => { setShowDB(!showDB); setShowCustom(false) }} style={{ fontSize: 13, color: 'var(--purple)', cursor: 'pointer', fontWeight: 500, background: 'none', border: 'none', fontFamily: 'inherit', padding: 0 }}>+ Add Item</button>
      </div>

      {/* Item list */}
      {(c.inventory ?? []).length === 0 && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '16px 14px', fontSize: 13, color: 'var(--text3)' }}>No items</div>
      )}
      {(c.inventory ?? []).map((item: InventoryItem) => (
        <div key={item.name} style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', border: '1px solid var(--border)', borderTop: 'none', background: 'var(--white)', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14 }}>{item.name}</div>
            {item.cost && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{item.cost}</div>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => adjustQty(item.name, -1)} style={{ width: 28, height: 28, border: '1px solid var(--border2)', background: 'var(--white)', cursor: 'pointer', fontSize: 16, borderRadius: 2, color: 'var(--text3)', fontFamily: 'inherit', padding: 0 }}>−</button>
            <span style={{ fontSize: 15, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
            <button onClick={() => adjustQty(item.name, 1)} style={{ width: 28, height: 28, border: '1px solid var(--border2)', background: 'var(--white)', cursor: 'pointer', fontSize: 16, borderRadius: 2, color: 'var(--text3)', fontFamily: 'inherit', padding: 0 }}>+</button>
          </div>
        </div>
      ))}

      {/* Gear DB */}
      {showDB && (
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', maxHeight: 380, overflowY: 'auto' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--white)', zIndex: 2 }}>
            <input value={dbQuery} onChange={e => setDbQuery(e.target.value)} placeholder="Search items..." style={{ width: '100%', border: '1px solid var(--border2)', padding: '7px 10px', fontSize: 14, fontFamily: 'inherit', color: 'var(--text)', borderRadius: 2, outline: 'none', background: 'var(--white)' }} />
          </div>
          <div style={{ display: 'flex', gap: 6, padding: '7px 14px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', position: 'sticky', top: 53, background: 'var(--white)', zIndex: 2 }}>
            {['All', ...GEAR_CATEGORIES].map(cat => (
              <button key={cat} onClick={() => setDbFilter(cat)} style={{ padding: '3px 8px', border: '1px solid var(--border2)', background: dbFilter === cat ? 'var(--purple)' : 'var(--white)', color: dbFilter === cat ? '#fff' : 'var(--text2)', fontSize: 11, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>
                {cat}
              </button>
            ))}
          </div>
          {filteredDB.map(g => (
            <div key={g.name} onClick={() => addFromDB(g.name)} style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--purple-light)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{g.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{g.cost} · {g.category}</div>
              </div>
              <span style={{ fontSize: 12, color: 'var(--purple)', fontWeight: 600 }}>+ Add</span>
            </div>
          ))}

          {/* Custom item */}
          <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
            <button onClick={() => setShowCustom(!showCustom)} style={{ fontSize: 13, color: 'var(--purple)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>+ Custom item</button>
            {showCustom && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input value={customName} onChange={e => setCustomName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustom()} placeholder="Item name" style={{ flex: 1, border: '1px solid var(--border2)', padding: '6px 8px', fontSize: 14, fontFamily: 'inherit', borderRadius: 2, outline: 'none', color: 'var(--text)', background: 'var(--white)' }} />
                <button onClick={addCustom} disabled={!customName.trim()} style={{ padding: '6px 14px', background: 'var(--teal)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit', opacity: customName.trim() ? 1 : 0.5 }}>Add</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Currency */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none' }}>
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Currency</span>
        </div>
        <div style={{ display: 'flex' }}>
          {(['pp', 'gp', 'ep', 'sp', 'cp'] as const).map((field, i) => (
            <div key={field} style={{ flex: 1, borderRight: i < 4 ? '1px solid var(--border)' : 'none', padding: '10px 6px', textAlign: 'center' }}>
              {editMode ? (
                <input
                  type="number"
                  min="0"
                  defaultValue={c[field]}
                  onBlur={e => setCurrency(field, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') setCurrency(field, (e.target as HTMLInputElement).value) }}
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 18, fontWeight: 700, textAlign: 'center', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', padding: 0 }}
                />
              ) : (
                <div style={{ fontSize: 18, fontWeight: 700 }}>{c[field]}</div>
              )}
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px', marginTop: 2 }}>{field}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
