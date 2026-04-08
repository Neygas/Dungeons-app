import { useState } from 'react'
import type { Character } from '@/types'
import { modStr } from '@/lib/calculations'
import { AB_KEYS, AB_LABEL, AB_FULL } from '@/data'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'
import { useLongPress } from '@/lib/useLongPress'

interface Props { character: Character }

function AbilityCell({ abKey, c }: { abKey: string; c: Character }) {
  const { patchActiveCharacter } = useCharacterStore()
  const { setEditMode, showToast } = useUIStore()
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState('')
  const score = (c as Record<string, number>)[abKey]

  const startEdit = () => {
    setEditMode(true)
    setEditing(true)
    setEditVal(String(score))
  }

  const commitEdit = async () => {
    const val = Math.min(30, Math.max(1, parseInt(editVal) || 10))
    await patchActiveCharacter({ [abKey]: val } as Partial<Character>)
    showToast(`${AB_FULL[abKey as keyof typeof AB_FULL]} set to ${val}`)
    setEditing(false)
  }

  const lp = useLongPress(startEdit)

  return (
    <div
      {...lp}
      style={{
        padding: '8px 2px',
        textAlign: 'center',
        cursor: 'pointer',
        background: editing ? 'var(--teal-light)' : undefined,
        outline: editing ? '2px solid var(--teal)' : undefined,
        outlineOffset: -1,
        userSelect: 'none',
      }}
    >
      {editing ? (
        <input
          autoFocus
          type="number"
          value={editVal}
          onChange={e => setEditVal(e.target.value)}
          onBlur={() => commitEdit()}
          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(false) }}
          style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 18, fontWeight: 700, textAlign: 'center', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', padding: 0 }}
        />
      ) : (
        <div style={{ fontSize: 18, fontWeight: 700 }}>{score}</div>
      )}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--teal2)' }}>{modStr(score)}</div>
      <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600, letterSpacing: '.3px', marginTop: 1 }}>{(AB_LABEL as Record<string, string>)[abKey]}</div>
    </div>
  )
}

export default function AbilityScores({ character: c }: Props) {
  const { editMode } = useUIStore()

  return (
    <div>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Ability Scores</span>
        {!editMode && <span style={{ fontSize: 11, color: 'var(--text3)' }}>Hold to edit</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', border: '1px solid var(--border)', borderTop: 'none', background: 'var(--white)' }}>
        {AB_KEYS.map((key, i) => (
          <div key={key} style={{ borderRight: i < 5 ? '1px solid var(--border)' : 'none' }}>
            <AbilityCell abKey={key} c={c} />
          </div>
        ))}
      </div>
    </div>
  )
}
