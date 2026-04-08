import { useState } from 'react'
import type { Character } from '@/types'
import { skillBonus, fmtBonus } from '@/lib/calculations'
import { SKILL_LIST, SKILL_GROUPS, AB_LABEL } from '@/data'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'
import { useLongPress } from '@/lib/useLongPress'

interface Props { character: Character }

function SkillCell({ skill, c, editMode, onToggle }: { skill: { name: string; ab: string }; c: Character; editMode: boolean; onToggle: (name: string) => void }) {
  const isProf = c.skill_proficiencies.includes(skill.name)
  const isExpert = c.skill_expertise.includes(skill.name)
  const bonus = skillBonus(c, skill.name, skill.ab)
  const lp = useLongPress(() => onToggle(skill.name))

  return (
    <div
      {...lp}
      style={{ display: 'flex', alignItems: 'center', padding: '7px 10px', borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', gap: 7, cursor: editMode ? 'pointer' : 'default', userSelect: 'none' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
    >
      <div style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, border: `2px solid ${isExpert ? 'var(--gold)' : isProf ? 'var(--purple)' : 'var(--border2)'}`, background: isExpert ? 'var(--gold)' : isProf ? 'var(--purple)' : 'var(--white)' }} />
      <span style={{ flex: 1, fontSize: 12, color: isExpert ? 'var(--gold)' : isProf ? 'var(--purple)' : 'var(--text)', fontWeight: isExpert ? 600 : isProf ? 500 : 400, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {skill.name}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700, color: isExpert ? 'var(--gold)' : isProf ? 'var(--purple)' : bonus < 0 ? 'var(--text3)' : 'var(--text)', flexShrink: 0 }}>
        {fmtBonus(bonus)}
      </span>
    </div>
  )
}

export default function SkillsSection({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { editMode } = useUIStore()
  const [sortAlpha, setSortAlpha] = useState(false)

  const toggleProf = async (name: string) => {
    if (!editMode) return
    const hasProf = c.skill_proficiencies.includes(name)
    const hasExpert = c.skill_expertise.includes(name)
    if (!hasProf) {
      await patchActiveCharacter({ skill_proficiencies: [...c.skill_proficiencies, name] })
    } else if (!hasExpert) {
      await patchActiveCharacter({ skill_expertise: [...c.skill_expertise, name] })
    } else {
      await patchActiveCharacter({
        skill_proficiencies: c.skill_proficiencies.filter(s => s !== name),
        skill_expertise: c.skill_expertise.filter(s => s !== name),
      })
    }
  }

  // Build a flat list of items: headers and skills interleaved
  type Item =
    | { type: 'header'; label: string; ab: string }
    | { type: 'skill'; skill: { name: string; ab: string } }

  const items: Item[] = sortAlpha
    ? [...SKILL_LIST].sort((a, b) => a.name.localeCompare(b.name)).map(skill => ({ type: 'skill', skill }))
    : SKILL_GROUPS.flatMap(g => [
        { type: 'header' as const, label: g.label, ab: g.ab },
        ...g.skills.map(name => ({ type: 'skill' as const, skill: SKILL_LIST.find(s => s.name === name)! })),
      ])

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none' }}>
      {/* Header */}
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Skills</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--purple)', display: 'inline-block' }} /> Prof
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--text3)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} /> Expert
          </span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button onClick={() => setSortAlpha(false)} style={{ padding: '2px 8px', border: '1px solid var(--border2)', background: !sortAlpha ? 'var(--teal)' : 'var(--white)', color: !sortAlpha ? '#fff' : 'var(--text2)', fontSize: 11, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>Group</button>
          <button onClick={() => setSortAlpha(true)} style={{ padding: '2px 8px', border: '1px solid var(--border2)', background: sortAlpha ? 'var(--teal)' : 'var(--white)', color: sortAlpha ? '#fff' : 'var(--text2)', fontSize: 11, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>A–Z</button>
        </div>
      </div>

      {/* 2-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {items.map((item, idx) => {
          if (item.type === 'header') {
            return (
              <div key={`h-${item.label}`} style={{ gridColumn: '1 / -1', padding: '5px 10px', background: '#fafafa', borderBottom: '1px solid var(--border)', borderRight: 'none', fontSize: 10, fontWeight: 700, color: 'var(--teal2)', letterSpacing: '.6px', textTransform: 'uppercase' }}>
                {item.label} ({AB_LABEL[item.ab as keyof typeof AB_LABEL]})
              </div>
            )
          }
          return (
            <SkillCell key={item.skill.name + idx} skill={item.skill} c={c} editMode={editMode} onToggle={toggleProf} />
          )
        })}
      </div>

      {/* Passive perception */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderTop: '1px solid var(--border)', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Passive Perception</span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>{10 + skillBonus(c, 'Perception', 'wis')}</span>
      </div>
    </div>
  )
}
