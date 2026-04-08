import type { Character } from '@/types'
import { saveBonus, fmtBonus } from '@/lib/calculations'
import { AB_KEYS, AB_LABEL } from '@/data'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'
import { useLongPress } from '@/lib/useLongPress'

interface Props { character: Character }

function SaveCell({ abKey, c, editMode }: { abKey: string; c: Character; editMode: boolean }) {
  const { patchActiveCharacter } = useCharacterStore()
  const upper = abKey.toUpperCase()
  const isProf = c.save_proficiencies.includes(upper)
  const bonus = saveBonus(c, abKey)

  const toggleProf = async () => {
    if (!editMode) return
    const next = isProf
      ? c.save_proficiencies.filter(s => s !== upper)
      : [...c.save_proficiencies, upper]
    await patchActiveCharacter({ save_proficiencies: next })
  }

  const lp = useLongPress(toggleProf)

  return (
    <div
      {...lp}
      style={{
        padding: '10px 4px',
        textAlign: 'center',
        cursor: editMode ? 'pointer' : 'default',
        background: isProf ? 'var(--purple-light)' : undefined,
        userSelect: 'none',
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, color: isProf ? 'var(--purple)' : bonus < 0 ? 'var(--text3)' : 'var(--text)' }}>
        {fmtBonus(bonus)}
      </div>
      <div style={{ fontSize: 9, color: isProf ? 'var(--purple)' : 'var(--text3)', fontWeight: 600, letterSpacing: '.3px', marginTop: 2, textTransform: 'uppercase' }}>
        {(AB_LABEL as Record<string, string>)[abKey]} Save
      </div>
      {/* Proficiency dot */}
      <div style={{ width: 6, height: 6, borderRadius: '50%', margin: '4px auto 0', background: isProf ? 'var(--purple)' : 'var(--border2)', transition: 'background .15s' }} />
    </div>
  )
}

export default function SavingThrows({ character: c }: Props) {
  const { editMode } = useUIStore()

  return (
    <div>
      <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Saving Throws</span>
        {editMode && <span style={{ fontSize: 11, color: 'var(--purple)' }}>Long-press to toggle</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', border: '1px solid var(--border)', borderTop: 'none', background: 'var(--white)' }}>
        {AB_KEYS.map((key, i) => (
          <div key={key} style={{ borderRight: i < 5 ? '1px solid var(--border)' : 'none' }}>
            <SaveCell abKey={key} c={c} editMode={editMode} />
          </div>
        ))}
      </div>
    </div>
  )
}
