import { useState } from 'react'
import type { Character } from '@/types'
import { modStr } from '@/lib/calculations'
import { AB_KEYS, AB_LABEL, AB_FULL } from '@/data'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'

interface Props { character: Character }

export default function AbilityScores({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { editMode, showToast } = useUIStore()
  const [editing, setEditing] = useState<string | null>(null)
  const [editVal, setEditVal] = useState('')

  const startEdit = (key: string) => {
    if (!editMode) return
    setEditing(key)
    setEditVal(String((c as Record<string, number>)[key]))
  }

  const commitEdit = async (key: string) => {
    const val = Math.min(30, Math.max(1, parseInt(editVal) || 10))
    await patchActiveCharacter({ [key]: val } as Partial<Character>)
    showToast(`${AB_FULL[key as keyof typeof AB_FULL]} set to ${val}`)
    setEditing(null)
  }

  return (
    <div>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Ability Scores</span>
        {editMode && <span style={{ fontSize: 11, color: 'var(--teal2)' }}>Tap to edit</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', border: '1px solid var(--border)', borderTop: 'none', background: 'var(--white)' }}>
        {AB_KEYS.map((key, i) => {
          const score = (c as Record<string, number>)[key]
          const isEditing = editing === key
          return (
            <div
              key={key}
              onClick={() => startEdit(key)}
              style={{
                borderRight: i < 5 ? '1px solid var(--border)' : 'none',
                padding: '8px 2px',
                textAlign: 'center',
                cursor: editMode ? 'pointer' : 'default',
                background: isEditing ? 'var(--teal-light)' : undefined,
                outline: isEditing ? '2px solid var(--teal)' : undefined,
                outlineOffset: -1,
              }}
            >
              {isEditing ? (
                <input
                  autoFocus
                  type="number"
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onBlur={() => commitEdit(key)}
                  onKeyDown={e => { if (e.key === 'Enter') commitEdit(key); if (e.key === 'Escape') setEditing(null) }}
                  style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 18, fontWeight: 700, textAlign: 'center', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', padding: 0 }}
                />
              ) : (
                <div style={{ fontSize: 18, fontWeight: 700 }}>{score}</div>
              )}
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal2)' }}>{modStr(score as number)}</div>
              <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, letterSpacing: '.3px', marginTop: 1 }}>{AB_LABEL[key]}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
