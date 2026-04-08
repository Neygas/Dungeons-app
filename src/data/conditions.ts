export const CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Exhaustion', 'Frightened',
  'Grappled', 'Incapacitated', 'Invisible', 'Paralyzed', 'Petrified',
  'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
]

export interface ConditionDetail {
  name: string
  sub: string
  desc: string
}

export const CONDITION_DETAILS: ConditionDetail[] = [
  { name: 'Blinded', sub: 'Cannot see, attacks against you have advantage', desc: 'Cannot see and auto-fails checks requiring sight. Attacks against it have advantage; its attacks have disadvantage.' },
  { name: 'Charmed', sub: 'Cannot attack the charmer', desc: 'Cannot attack the charmer or target it with harmful abilities. The charmer has advantage on social checks against it.' },
  { name: 'Frightened', sub: 'Disadvantage while source is visible', desc: 'Disadvantage on checks and attacks while source of fear is in line of sight. Cannot willingly move closer to the source.' },
  { name: 'Grappled', sub: 'Speed becomes 0', desc: 'Speed becomes 0. Ends if the grappler is incapacitated or if moved out of reach.' },
  { name: 'Incapacitated', sub: 'Cannot take actions or reactions', desc: 'Cannot take actions or reactions.' },
  { name: 'Paralyzed', sub: 'Incapacitated, auto-fail STR/DEX saves', desc: 'Incapacitated and cannot move or speak. Auto-fails STR and DEX saves. Attacks have advantage. Hits within 5 ft are critical hits.' },
  { name: 'Prone', sub: 'Disadvantage on attacks, melee against you has advantage', desc: 'Can only crawl unless it stands up (costs half movement). Melee attacks against it have advantage. Its attack rolls have disadvantage.' },
  { name: 'Stunned', sub: 'Incapacitated, auto-fail STR/DEX saves', desc: 'Incapacitated, cannot move, can only speak falteringly. Auto-fails STR and DEX saves. Attacks have advantage.' },
  { name: 'Unconscious', sub: 'Incapacitated, prone, auto-fail STR/DEX', desc: 'Incapacitated, cannot move or speak, drops held items, falls prone. Attacks have advantage. Hits within 5 ft are critical hits.' },
]

export const XP_TABLE = [0, 0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000]

export const SPELL_LEVEL_NAMES_ALL = ['Cantrip', '1st Level', '2nd Level', '3rd Level', '4th Level', '5th Level', '6th Level', '7th Level', '8th Level', '9th Level']
