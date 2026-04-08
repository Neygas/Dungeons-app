import { useState } from 'react'
import type { Character } from '@/types'
import { skillBonus, fmtBonus } from '@/lib/calculations'
import { SKILL_LIST, SKILL_GROUPS, AB_LABEL } from '@/data'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'

interface Props { character: Character }

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

  const rows = sortAlpha
    ? [...SKILL_LIST].sort((a, b) => a.name.localeCompare(b.name))
    : null

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderTop: 'none' }}>
      <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.5px' }}>Skills</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setSortAlpha(false)} style={{ padding: '2px 8px', border: '1px solid var(--border2)', background: !sortAlpha ? 'var(--teal)' : 'var(--white)', color: !sortAlpha ? '#fff' : 'var(--text2)', fontSize: 11, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>Group</button>
          <button onClick={() => setSortAlpha(true)} style={{ padding: '2px 8px', border: '1px solid var(--border2)', background: sortAlpha ? 'var(--teal)' : 'var(--white)', color: sortAlpha ? '#fff' : 'var(--text2)', fontSize: 11, cursor: 'pointer', borderRadius: 2, fontFamily: 'inherit' }}>A–Z</button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, padding: '6px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--purple)', display: 'inline-block' }} />Proficient</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />Expertise</span>
      </div>

      {sortAlpha ? (
        rows!.map(skill => <SkillRow key={skill.name} skill={skill} c={c} editMode={editMode} onToggle={toggleProf} />)
      ) : (
        SKILL_GROUPS.map(group => (
          <div key={group.label}>
            <div style={{ padding: '5px 14px', background: '#fafafa', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 600, color: 'var(--teal2)', letterSpacing: '.5px', textTransform: 'uppercase' }}>
              {group.label} ({AB_LABEL[group.ab]})
            </div>
            {group.skills.map(name => {
              const skill = SKILL_LIST.find(s => s.name === name)!
              return <SkillRow key={name} skill={skill} c={c} editMode={editMode} onToggle={toggleProf} />
            })}
          </div>
        ))
      )}

      {/* Passive perception */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderTop: '1px solid var(--border)', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Passive Perception</span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>
          {10 + skillBonus(c, 'Perception', 'wis')}
        </span>
      </div>
    </div>
  )
}

function SkillRow({ skill, c, editMode, onToggle }: { skill: { name: string; ab: string }; c: Character; editMode: boolean; onToggle: (name: string) => void }) {
  const isProf = c.skill_proficiencies.includes(skill.name)
  const isExpert = c.skill_expertise.includes(skill.name)
  const bonus = skillBonus(c, skill.name, skill.ab)

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '7px 14px', borderBottom: '1px solid var(--border)', gap: 10 }}
      onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}
    >
      <div
        onClick={() => onToggle(skill.name)}
        style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${isExpert ? 'var(--gold)' : isProf ? 'var(--purple)' : 'var(--border2)'}`, background: isExpert ? 'var(--gold)' : isProf ? 'var(--purple)' : 'var(--white)', cursor: editMode ? 'pointer' : 'default', flexShrink: 0 }}
      />
      <span style={{ flex: 1, fontSize: 14, color: isExpert ? 'var(--gold)' : isProf ? 'var(--purple)' : 'var(--text)', fontWeight: isExpert ? 600 : isProf ? 500 : 400 }}>
        {skill.name}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 28, textAlign: 'right' }}>
        {AB_LABEL[skill.ab as keyof typeof AB_LABEL]}
      </span>
      <span style={{ fontSize: 14, fontWeight: 700, minWidth: 36, textAlign: 'right', color: isExpert ? 'var(--gold)' : isProf ? 'var(--purple)' : bonus < 0 ? 'var(--text3)' : 'var(--text)' }}>
        {fmtBonus(bonus)}
      </span>
    </div>
  )
}
