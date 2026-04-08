import type { Character } from '@/types'
import { ARMOR_DB } from '@/data/armor'

export const mod = (score: number): number => Math.floor((score - 10) / 2)

export const modStr = (score: number): string => {
  const m = mod(score)
  return (m >= 0 ? '+' : '') + m
}

export const profBonus = (level: number): number => Math.ceil(level / 4) + 1

export const fmtBonus = (n: number): string => (n >= 0 ? '+' : '') + n

export const hpColor = (percent: number): string => {
  if (percent > 0.5) return 'var(--green)'
  if (percent > 0.2) return 'var(--orange)'
  return 'var(--red)'
}

export const calcArmorAC = (c: Partial<Character>): number => {
  const armor = ARMOR_DB.find(a => a.name === c.equipped_armor)
  const shield = c.equipped_shield ?? false
  const dexMod = mod(c.dex ?? 10)

  if (!armor) {
    if (c.class === 'Barbarian') return 10 + dexMod + mod(c.con ?? 10) + (shield ? 2 : 0)
    if (c.class === 'Monk') return 10 + dexMod + mod(c.wis ?? 10) + (shield ? 2 : 0)
    return 10 + dexMod + (shield ? 2 : 0)
  }

  let ac = armor.ac
  if (armor.dexBonus) {
    ac += armor.maxDex !== null ? Math.min(dexMod, armor.maxDex) : dexMod
  }
  if (shield) ac += 2
  return ac
}

export const skillBonus = (
  c: Partial<Character>,
  skillName: string,
  abilityKey: string
): number => {
  const base = mod((c as Record<string, number>)[abilityKey] ?? 10)
  const prof = profBonus(c.level ?? 1)
  const overrides = c.skill_overrides ?? {}

  if (skillName in overrides) return overrides[skillName]!

  const isProf = c.skill_proficiencies?.includes(skillName) ?? false
  const isExpert = c.skill_expertise?.includes(skillName) ?? false

  if (isExpert) return base + prof * 2
  if (isProf) return base + prof
  return base
}

export const saveBonus = (
  c: Partial<Character>,
  abilityKey: string
): number => {
  const base = mod((c as Record<string, number>)[abilityKey] ?? 10)
  const prof = profBonus(c.level ?? 1)
  const abilityUpper = abilityKey.toUpperCase()
  const overrides = c.save_overrides ?? {}

  if (abilityUpper in overrides) return overrides[abilityUpper]!

  const isProf = c.save_proficiencies?.includes(abilityUpper) ?? false
  return isProf ? base + prof : base
}

export const spellSaveDC = (c: Partial<Character>, spellcastingAbility: string): number => {
  const abilityScore = (c as Record<string, number>)[spellcastingAbility.toLowerCase()] ?? 10
  return 8 + profBonus(c.level ?? 1) + mod(abilityScore)
}

export const spellAttackBonus = (c: Partial<Character>, spellcastingAbility: string): number => {
  const abilityScore = (c as Record<string, number>)[spellcastingAbility.toLowerCase()] ?? 10
  return profBonus(c.level ?? 1) + mod(abilityScore)
}

export const weaponAttackBonus = (
  c: Partial<Character>,
  _weaponName: string,
  override?: number
): number => {
  if (override !== undefined) return override
  const prof = profBonus(c.level ?? 1)
  // Default to STR for melee, DEX for ranged — simplified
  return prof + mod(c.str ?? 10)
}

export const passivePerception = (c: Partial<Character>): number => {
  return 10 + skillBonus(c, 'Perception', 'wis')
}

export const rollDie = (sides: number): number =>
  Math.floor(Math.random() * sides) + 1

export const averageHpGain = (hitDie: number): number =>
  Math.floor(hitDie / 2) + 1
