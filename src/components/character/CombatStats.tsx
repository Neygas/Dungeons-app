import type { Character } from '@/types'
import { mod, profBonus, calcArmorAC, passivePerception } from '@/lib/calculations'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'

interface Props { character: Character }

export default function CombatStats({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { showToast } = useUIStore()
  const pb = profBonus(c.level)
  const ac = calcArmorAC(c)
  const initiative = mod(c.dex)
  const speed = ({ 'Wood Elf': 35, Dwarf: 25, Halfling: 25, Gnome: 25 } as Record<string, number>)[c.race] ?? 30
  const hdRem = c.hit_dice_total - c.hit_dice_used
  const hd = { Barbarian: 12, Bard: 8, Cleric: 8, Druid: 8, Fighter: 10, Monk: 8, Paladin: 10, Ranger: 10, Rogue: 8, Sorcerer: 6, Warlock: 8, Wizard: 6 }[c.class] ?? 8
  const passive = passivePerception(c)

  const useHitDie = async () => {
    if (hdRem <= 0) { showToast('No hit dice remaining'); return }
    const roll = Math.floor(Math.random() * hd) + 1
    const gain = Math.max(0, roll + mod(c.con))
    const newHp = Math.min(c.max_hp, c.hp + gain)
    await patchActiveCharacter({ hp: newHp, hit_dice_used: c.hit_dice_used + 1 })
    showToast(`Hit Die: rolled ${roll} + CON = +${gain} HP`)
  }

  const cells = [
    { label: 'Armor Class', value: String(ac) },
    { label: 'Initiative', value: (initiative >= 0 ? '+' : '') + initiative },
    { label: 'Speed', value: speed + 'ft' },
    { label: 'Passive Perc.', value: String(passive) },
    { label: 'Prof. Bonus', value: '+' + pb },
    { label: 'Hit Dice', value: `${hdRem}d${hd}`, onClick: useHitDie, clickable: hdRem > 0 },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid var(--border)', borderTop: 'none', background: 'var(--white)' }}>
      {cells.map((cell, i) => (
        <div
          key={cell.label}
          onClick={cell.onClick}
          style={{
            borderRight: (i + 1) % 3 !== 0 ? '1px solid var(--border)' : 'none',
            borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
            padding: '10px 6px',
            textAlign: 'center',
            cursor: cell.onClick ? 'pointer' : 'default',
          }}
          onMouseEnter={e => { if (cell.onClick) (e.currentTarget as HTMLElement).style.background = 'var(--teal-light)' }}
          onMouseLeave={e => { if (cell.onClick) (e.currentTarget as HTMLElement).style.background = '' }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: cell.label === 'Hit Dice' && hdRem === 0 ? 'var(--text3)' : 'var(--text)' }}>{cell.value}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{cell.label}</div>
        </div>
      ))}
    </div>
  )
}
