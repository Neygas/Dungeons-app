import type { AbilityKey } from '@/types'

export interface Skill {
  name: string
  ab: AbilityKey
}

export interface SkillGroup {
  label: string
  ab: AbilityKey
  skills: string[]
}

export const SKILL_LIST: Skill[] = [
  { name: 'Athletics', ab: 'str' },
  { name: 'Acrobatics', ab: 'dex' },
  { name: 'Sleight of Hand', ab: 'dex' },
  { name: 'Stealth', ab: 'dex' },
  { name: 'Arcana', ab: 'int' },
  { name: 'History', ab: 'int' },
  { name: 'Investigation', ab: 'int' },
  { name: 'Nature', ab: 'int' },
  { name: 'Religion', ab: 'int' },
  { name: 'Animal Handling', ab: 'wis' },
  { name: 'Insight', ab: 'wis' },
  { name: 'Medicine', ab: 'wis' },
  { name: 'Perception', ab: 'wis' },
  { name: 'Survival', ab: 'wis' },
  { name: 'Deception', ab: 'cha' },
  { name: 'Intimidation', ab: 'cha' },
  { name: 'Performance', ab: 'cha' },
  { name: 'Persuasion', ab: 'cha' },
]

export const SKILL_GROUPS: SkillGroup[] = [
  { label: 'Strength', ab: 'str', skills: ['Athletics'] },
  { label: 'Dexterity', ab: 'dex', skills: ['Acrobatics', 'Sleight of Hand', 'Stealth'] },
  { label: 'Intelligence', ab: 'int', skills: ['Arcana', 'History', 'Investigation', 'Nature', 'Religion'] },
  { label: 'Wisdom', ab: 'wis', skills: ['Animal Handling', 'Insight', 'Medicine', 'Perception', 'Survival'] },
  { label: 'Charisma', ab: 'cha', skills: ['Deception', 'Intimidation', 'Performance', 'Persuasion'] },
]

export const SKILL_TO_AB: Record<string, AbilityKey> = Object.fromEntries(
  SKILL_LIST.map(s => [s.name, s.ab])
)

export const AB_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
export const AB_LABEL: Record<AbilityKey, string> = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' }
export const AB_FULL: Record<AbilityKey, string> = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' }

export const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }
export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]
