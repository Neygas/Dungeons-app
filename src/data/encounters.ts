import { CREATURE_DB } from '@/data/creatures'
import type { CreatureAttack } from '@/types'

export interface EncounterCreature {
  name: string
  hp: number
  ac: number
  isNpc: boolean
  attacks: CreatureAttack[]
}

export interface PresetEncounterGroup {
  id: string
  name: string
  difficulty: 'easy' | 'medium' | 'hard' | 'deadly'
  creatures: EncounterCreature[]
}

function expand(name: string, count: number): EncounterCreature[] {
  const c = CREATURE_DB.find(c => c.name === name)
  if (!c) return []
  return Array.from({ length: count }, (_, i) => ({
    name: count > 1 ? `${name} ${i + 1}` : name,
    hp: c.hp,
    ac: c.ac,
    isNpc: !!c.isNpc,
    attacks: c.attacks,
  }))
}

export const PRESET_ENCOUNTERS: PresetEncounterGroup[] = [
  { id: 'p1', name: 'Goblin Ambush', difficulty: 'easy', creatures: expand('Goblin', 4) },
  { id: 'p2', name: 'Kobold Nest', difficulty: 'easy', creatures: expand('Kobold', 5) },
  { id: 'p3', name: 'Wolf Pack', difficulty: 'easy', creatures: expand('Wolf', 3) },
  { id: 'p4', name: 'Undead Patrol', difficulty: 'easy', creatures: [...expand('Skeleton', 2), ...expand('Zombie', 2)] },
  { id: 'p5', name: 'Bandit Camp', difficulty: 'easy', creatures: expand('Bandit', 4) },
]
