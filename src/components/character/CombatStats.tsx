import { useState } from 'react'
import type { Character } from '@/types'
import { mod, profBonus, calcArmorAC, passivePerception } from '@/lib/calculations'
import { useCharacterStore } from '@/store/characterStore'
import { useUIStore } from '@/store/uiStore'
import { useLongPress } from '@/lib/useLongPress'

interface Props { character: Character }

const RACE_SPEED: Record<string, number> = { 'Wood Elf': 35, Dwarf: 25, Halfling: 25, Gnome: 25 }
const CLASS_HD: Record<string, number> = { Barbarian: 12, Bard: 8, Cleric: 8, Druid: 8, Fighter: 10, Monk: 8, Paladin: 10, Ranger: 10, Rogue: 8, Sorcerer: 6, Warlock: 8, Wizard: 6 }

function StatCell({ label, displayVal, editLabel, editInitVal, onCommit, onTap, dimmed }: {
  label: string
  displayVal: string
  editLabel?: string
  editInitVal?: string | number
  onCommit?: (val: string) => void
  onTap?: () => void
  dimmed?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState('')
  const { setEditMode } = useUIStore()

  const startEdit = () => {
    if (!onCommit) return
    setEditMode(true)
    setEditing(true)
    setVal(String(editInitVal ?? ''))
  }

  const commit = () => {
    onCommit?.(val)
    setEditing(false)
  }

  const lp = useLongPress(startEdit)
  const interactive = !!(onCommit || onTap)

  return (
    <div
      {...lp}
      onClick={e => { lp.onClick(e); if (!e.defaultPrevented) onTap?.() }}
      style={{
        padding: '10px 6px', textAlign: 'center',
        cursor: interactive ? 'pointer' : 'default',
        background: editing ? 'var(--teal-light)' : undefined,
        outline: editing ? '2px solid var(--teal)' : undefined,
        outlineOffset: -1, userSelect: 'none',
      }}
      onMouseEnter={e => { if (interactive) (e.currentTarget as HTMLElement).style.background = 'var(--teal-light)' }}
      onMouseLeave={e => { if (!editing) (e.currentTarget as HTMLElement).style.background = '' }}
    >
      {editing ? (
        <>
          <input
            autoFocus type="number" value={val}
            onChange={e => setVal(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
            style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--border2)', background: 'transparent', fontSize: 18, fontWeight: 700, textAlign: 'center', color: 'var(--text)', outline: 'none', fontFamily: 'inherit', padding: 0 }}
          />
          {editLabel && <div style={{ fontSize: 10, color: 'var(--teal2)', marginTop: 1 }}>{editLabel}</div>}
        </>
      ) : (
        <div style={{ fontSize: 20, fontWeight: 700, color: dimmed ? 'var(--text3)' : 'var(--text)' }}>{displayVal}</div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{label}</div>
    </div>
  )
}

export default function CombatStats({ character: c }: Props) {
  const { patchActiveCharacter } = useCharacterStore()
  const { showToast } = useUIStore()

  const ov = c.stat_overrides ?? {}
  const pb = profBonus(c.level)
  const baseAC = calcArmorAC(c)
  const acBonus = ov.ac_bonus ?? 0
  const totalAC = baseAC + acBonus
  const initBonus = ov.init_bonus ?? 0
  const totalInit = mod(c.dex) + initBonus
  const speed = ov.speed ?? (RACE_SPEED[c.race] ?? 30)
  const hdRem = c.hit_dice_total - c.hit_dice_used
  const hd = CLASS_HD[c.class] ?? 8
  const passive = passivePerception(c)

  const patchOverride = (key: string, raw: string, label: string) => {
    const n = parseInt(raw)
    if (isNaN(n)) return
    patchActiveCharacter({ stat_overrides: { ...ov, [key]: n } })
    showToast(`${label} set to ${n}`)
  }

  const useHitDie = async () => {
    if (hdRem <= 0) { showToast('No hit dice remaining'); return }
    const roll = Math.floor(Math.random() * hd) + 1
    const gain = Math.max(0, roll + mod(c.con))
    await patchActiveCharacter({ hp: Math.min(c.max_hp, c.hp + gain), hit_dice_used: c.hit_dice_used + 1 })
    showToast(`Hit Die: rolled ${roll} + CON = +${gain} HP`)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: '1px solid var(--border)', borderTop: 'none', background: 'var(--white)' }}>
      <div style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <StatCell label="Armor Class" displayVal={String(totalAC) + (acBonus !== 0 ? ` (${acBonus > 0 ? '+' : ''}${acBonus})` : '')} editLabel="AC bonus" editInitVal={acBonus} onCommit={v => patchOverride('ac_bonus', v, 'AC bonus')} />
      </div>
      <div style={{ borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <StatCell label="Initiative" displayVal={(totalInit >= 0 ? '+' : '') + totalInit + (initBonus !== 0 ? ` (${initBonus > 0 ? '+' : ''}${initBonus})` : '')} editLabel="init bonus" editInitVal={initBonus} onCommit={v => patchOverride('init_bonus', v, 'Initiative bonus')} />
      </div>
      <div style={{ borderBottom: '1px solid var(--border)' }}>
        <StatCell label="Speed" displayVal={speed + 'ft'} editLabel="speed (ft)" editInitVal={speed} onCommit={v => patchOverride('speed', v, 'Speed')} />
      </div>
      <div style={{ borderRight: '1px solid var(--border)' }}>
        <StatCell label="Passive Perc." displayVal={String(passive)} />
      </div>
      <div style={{ borderRight: '1px solid var(--border)' }}>
        <StatCell label="Prof. Bonus" displayVal={'+' + pb} />
      </div>
      <div>
        <StatCell label="Hit Dice" displayVal={`${hdRem}d${hd}`} editLabel={`total (/${c.hit_dice_total})`} editInitVal={c.hit_dice_total} dimmed={hdRem === 0} onTap={hdRem > 0 ? useHitDie : undefined} onCommit={v => { const n = Math.max(1, parseInt(v) || 1); patchActiveCharacter({ hit_dice_total: n }); showToast(`Hit dice total set to ${n}`) }} />
      </div>
    </div>
  )
}
