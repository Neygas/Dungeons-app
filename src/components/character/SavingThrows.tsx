import type { Character } from '@/types'
import { saveBonus, fmtBonus } from '@/lib/calculations'
import { AB_KEYS, AB_LABEL } from '@/data'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'

interface Props { character: Character }

export default function SavingThrows({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { editMode } = useUIStore()

  const toggleProf = async (key: string) => {
    if (!editMode) return
    const upper = key.toUpperCase()
    const hasProf = c.save_proficiencies.includes(upper)
    const next = hasProf
      ? c.save_proficiencies.filter(s => s !== upper)
      : [...c.save_proficiencies, upper]
    await patchActiveCharacter({ save_proficiencies: next })
  }

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none' }}>
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Saving Throws</span>
      </div>
      {AB_KEYS.map((key, i) => {
        const upper = key.toUpperCase()
        const isProf = c.save_proficiencies.includes(upper)
        const bonus = saveBonus(c, key)
        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', borderBottom: i < 5 ? '1px solid var(--border)' : 'none', gap: 10 }}>
            <div
              onClick={() => toggleProf(key)}
              style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${isProf ? 'var(--purple)' : 'var(--border2)'}`, background: isProf ? 'var(--purple)' : 'var(--white)', cursor: editMode ? 'pointer' : 'default', flexShrink: 0 }}
            />
            <span style={{ flex: 1, fontSize: 14, color: isProf ? 'var(--purple)' : 'var(--text)', fontWeight: isProf ? 500 : 400 }}>
              {AB_LABEL[key]} Save
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, minWidth: 36, textAlign: 'right', color: isProf ? 'var(--purple)' : bonus < 0 ? 'var(--text3)' : 'var(--text)' }}>
              {fmtBonus(bonus)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
