import type { Character } from '@/types'

export type FeatureType = 'toggle' | 'uses' | 'pool' | 'info'
export type ResetOn = 'short' | 'long' | 'round' | 'none'

const mod = (score: number) => Math.floor((score - 10) / 2)

export interface ActiveClassFeature {
  key: string
  name: string
  cls: string
  sub: string | null
  minLevel: number
  type: FeatureType
  resetOn: ResetOn
  maxUses: ((c: Character) => number) | number | null
  desc: string
  reaction: boolean
  trigger: string | null
  effects?: (c: Character) => string[]
}

export const ACTIVE_CLASS_FEATURES: ActiveClassFeature[] = [
  // ── Barbarian ─────────────────────────────────────────────────────────────
  {
    key: 'rage', name: 'Rage', cls: 'Barbarian', sub: null, minLevel: 1,
    type: 'toggle', resetOn: 'long',
    maxUses: (c) => {
      const l = c.level
      if (l >= 17) return 99
      if (l >= 12) return 6
      if (l >= 8) return 5
      if (l >= 6) return 4
      if (l >= 3) return 3
      return 2
    },
    desc: 'Adv on STR checks/saves. Resist bludgeoning, piercing, slashing damage. Bonus melee damage scales with level.',
    reaction: false, trigger: null,
    effects: (c) => {
      const b = c.level >= 16 ? 4 : c.level >= 9 ? 3 : 2
      return [`+${b} melee dmg`, 'Resist physical', 'Adv STR checks']
    },
  },
  {
    key: 'recklessAttack', name: 'Reckless Attack', cls: 'Barbarian', sub: null, minLevel: 2,
    type: 'toggle', resetOn: 'round', maxUses: null,
    desc: 'Adv on STR-based attack rolls this turn. Attackers have advantage against you until your next turn.',
    reaction: false, trigger: null,
    effects: () => ['Adv on STR attacks', 'Enemies have adv on you'],
  },
  {
    key: 'retaliation', name: 'Retaliation', cls: 'Barbarian', sub: 'Path of the Berserker', minLevel: 14,
    type: 'uses', resetOn: 'round', maxUses: 1,
    desc: 'Reaction: when damaged by a creature within 5 ft, make one melee weapon attack against it.',
    reaction: true, trigger: 'takeDamage',
  },
  {
    key: 'spiritShield', name: 'Spirit Shield', cls: 'Barbarian', sub: 'Path of the Ancestral Guardian', minLevel: 6,
    type: 'uses', resetOn: 'round', maxUses: 1,
    desc: 'Reaction: reduce damage dealt to an ally within 30 ft by 2d6 (3d6 at 10, 4d6 at 14).',
    reaction: true, trigger: 'takeDamage',
  },

  // ── Bard ──────────────────────────────────────────────────────────────────
  {
    key: 'bardicInspiration', name: 'Bardic Inspiration', cls: 'Bard', sub: null, minLevel: 1,
    type: 'uses', resetOn: 'short',
    maxUses: (c) => Math.max(1, mod(c.cha)),
    desc: 'Bonus action: give a creature a die to add to one ability check, attack, or saving throw. d6 (lv1) d8 (lv5) d10 (lv10) d12 (lv15). Resets on short rest at lv5+, long rest before.',
    reaction: false, trigger: null,
  },

  // ── Cleric ────────────────────────────────────────────────────────────────
  {
    key: 'channelDivinityCleric', name: 'Channel Divinity', cls: 'Cleric', sub: null, minLevel: 2,
    type: 'uses', resetOn: 'short',
    maxUses: (c) => c.level >= 18 ? 3 : c.level >= 6 ? 2 : 1,
    desc: 'Use a channel divinity option from your domain. Sacred Flame, Turn Undead, or domain-specific options.',
    reaction: false, trigger: null,
  },
  {
    key: 'wrathOfStorm', name: 'Wrath of the Storm', cls: 'Cleric', sub: 'Tempest Domain', minLevel: 1,
    type: 'uses', resetOn: 'long',
    maxUses: (c) => Math.max(1, mod(c.wis)),
    desc: 'Reaction: when a creature within 5 ft hits you, deal 2d8 lightning or thunder damage. DEX save halves.',
    reaction: true, trigger: 'takeDamage',
  },

  // ── Druid ─────────────────────────────────────────────────────────────────
  {
    key: 'wildShape', name: 'Wild Shape', cls: 'Druid', sub: null, minLevel: 2,
    type: 'uses', resetOn: 'short', maxUses: 2,
    desc: 'Magically assume the shape of a beast. CR limit scales with level. Lasts hours equal to half Druid level.',
    reaction: false, trigger: null,
  },

  // ── Fighter ───────────────────────────────────────────────────────────────
  {
    key: 'secondWind', name: 'Second Wind', cls: 'Fighter', sub: null, minLevel: 1,
    type: 'uses', resetOn: 'short', maxUses: 1,
    desc: 'Bonus action: regain 1d10 + Fighter level HP.',
    reaction: false, trigger: null,
  },
  {
    key: 'actionSurge', name: 'Action Surge', cls: 'Fighter', sub: null, minLevel: 2,
    type: 'uses', resetOn: 'short',
    maxUses: (c) => c.level >= 17 ? 2 : 1,
    desc: 'Take one additional action on your turn. Not usable for Extra Attack on the same turn.',
    reaction: false, trigger: null,
  },
  {
    key: 'indomitable', name: 'Indomitable', cls: 'Fighter', sub: null, minLevel: 9,
    type: 'uses', resetOn: 'long',
    maxUses: (c) => c.level >= 17 ? 3 : c.level >= 13 ? 2 : 1,
    desc: 'Reroll a saving throw you fail, using the new result.',
    reaction: false, trigger: null,
  },
  {
    key: 'superiorityDice', name: 'Superiority Dice', cls: 'Fighter', sub: 'Battle Master', minLevel: 3,
    type: 'uses', resetOn: 'short',
    maxUses: (c) => c.level >= 15 ? 6 : c.level >= 7 ? 5 : 4,
    desc: 'Spend on combat maneuvers. Die size: d8 at 3, d10 at 10, d12 at 18.',
    reaction: false, trigger: null,
  },

  // ── Monk ──────────────────────────────────────────────────────────────────
  {
    key: 'kiPoints', name: 'Ki Points', cls: 'Monk', sub: null, minLevel: 2,
    type: 'uses', resetOn: 'short',
    maxUses: (c) => c.level,
    desc: 'Spend on Flurry of Blows (1), Patient Defense (1), Step of the Wind (1), Stunning Strike (1 after hit), and more.',
    reaction: false, trigger: null,
  },
  {
    key: 'deflectMissiles', name: 'Deflect Missiles', cls: 'Monk', sub: null, minLevel: 3,
    type: 'uses', resetOn: 'round', maxUses: 1,
    desc: 'Reaction: reduce ranged weapon hit damage by 1d10 + DEX + Monk level. If reduced to 0, spend 1 ki to return the projectile.',
    reaction: true, trigger: 'takeDamage',
  },
  {
    key: 'evasionMonk', name: 'Evasion', cls: 'Monk', sub: null, minLevel: 7,
    type: 'info', resetOn: 'none', maxUses: null,
    desc: 'DEX saves: no damage on success, half damage on failure instead of full.',
    reaction: false, trigger: null,
  },

  // ── Paladin ───────────────────────────────────────────────────────────────
  {
    key: 'layOnHands', name: 'Lay on Hands', cls: 'Paladin', sub: null, minLevel: 1,
    type: 'pool', resetOn: 'long',
    maxUses: (c) => 5 * c.level,
    desc: 'Touch to restore HP from a pool (5 × Paladin level). Spend 5 HP to cure one disease or neutralize one poison.',
    reaction: false, trigger: null,
  },
  {
    key: 'divineSmite', name: 'Divine Smite', cls: 'Paladin', sub: null, minLevel: 1,
    type: 'info', resetOn: 'none', maxUses: null,
    desc: 'On melee hit: expend a spell slot to deal +2d8 radiant per slot level (max +5d8). +1d8 extra vs undead or fiends.',
    reaction: false, trigger: null,
  },
  {
    key: 'channelDivinityPaladin', name: 'Channel Divinity', cls: 'Paladin', sub: null, minLevel: 3,
    type: 'uses', resetOn: 'short', maxUses: 1,
    desc: 'Use an oath channel divinity option (Sacred Weapon, Turn the Unholy, etc.).',
    reaction: false, trigger: null,
  },

  // ── Rogue ─────────────────────────────────────────────────────────────────
  {
    key: 'cunningAction', name: 'Cunning Action', cls: 'Rogue', sub: null, minLevel: 2,
    type: 'info', resetOn: 'none', maxUses: null,
    desc: 'Bonus action each turn: Dash, Disengage, or Hide.',
    reaction: false, trigger: null,
  },
  {
    key: 'uncannyDodge', name: 'Uncanny Dodge', cls: 'Rogue', sub: null, minLevel: 5,
    type: 'uses', resetOn: 'round', maxUses: 1,
    desc: 'Reaction: when an attacker you can see hits you, halve the attack damage.',
    reaction: true, trigger: 'takeDamage',
  },
  {
    key: 'evasionRogue', name: 'Evasion', cls: 'Rogue', sub: null, minLevel: 7,
    type: 'info', resetOn: 'none', maxUses: null,
    desc: 'DEX saves: no damage on success, half damage on failure instead of full.',
    reaction: false, trigger: null,
  },

  // ── Sorcerer ──────────────────────────────────────────────────────────────
  {
    key: 'sorceryPoints', name: 'Sorcery Points', cls: 'Sorcerer', sub: null, minLevel: 2,
    type: 'uses', resetOn: 'long',
    maxUses: (c) => c.level,
    desc: 'Spend on Metamagic and Flexible Casting: convert to/from spell slots (1 SP = 1st-level slot, 2 SP = 2nd, etc.).',
    reaction: false, trigger: null,
  },

  // ── Warlock ───────────────────────────────────────────────────────────────
  {
    key: 'mysticArcanum6', name: 'Mystic Arcanum (6th)', cls: 'Warlock', sub: null, minLevel: 11,
    type: 'uses', resetOn: 'long', maxUses: 1,
    desc: 'Cast one 6th-level warlock spell once without using a spell slot.',
    reaction: false, trigger: null,
  },
  {
    key: 'mysticArcanum7', name: 'Mystic Arcanum (7th)', cls: 'Warlock', sub: null, minLevel: 13,
    type: 'uses', resetOn: 'long', maxUses: 1,
    desc: 'Cast one 7th-level warlock spell once without using a spell slot.',
    reaction: false, trigger: null,
  },
  {
    key: 'mysticArcanum8', name: 'Mystic Arcanum (8th)', cls: 'Warlock', sub: null, minLevel: 15,
    type: 'uses', resetOn: 'long', maxUses: 1,
    desc: 'Cast one 8th-level warlock spell once without using a spell slot.',
    reaction: false, trigger: null,
  },
  {
    key: 'mysticArcanum9', name: 'Mystic Arcanum (9th)', cls: 'Warlock', sub: null, minLevel: 17,
    type: 'uses', resetOn: 'long', maxUses: 1,
    desc: 'Cast one 9th-level warlock spell once without using a spell slot.',
    reaction: false, trigger: null,
  },

  // ── Wizard ────────────────────────────────────────────────────────────────
  {
    key: 'arcaneRecovery', name: 'Arcane Recovery', cls: 'Wizard', sub: null, minLevel: 1,
    type: 'uses', resetOn: 'long', maxUses: 1,
    desc: 'Once per day during a short rest, recover spell slots with combined level up to half Wizard level (round up).',
    reaction: false, trigger: null,
  },

  // ── Artificer ─────────────────────────────────────────────────────────────
  {
    key: 'infuseItem', name: 'Infuse Item', cls: 'Artificer', sub: null, minLevel: 2,
    type: 'uses', resetOn: 'long',
    maxUses: (c) => {
      if (c.level >= 18) return 6
      if (c.level >= 14) return 5
      if (c.level >= 10) return 4
      if (c.level >= 6) return 3
      return 2
    },
    desc: 'Imbue mundane items with magical infusions. Max active infusions = max uses / 2.',
    reaction: false, trigger: null,
  },
  {
    key: 'flashOfGenius', name: 'Flash of Genius', cls: 'Artificer', sub: null, minLevel: 7,
    type: 'uses', resetOn: 'long',
    maxUses: (c) => Math.max(1, mod(c.int)),
    desc: 'Reaction: when you or a creature within 30 ft fails an ability check or saving throw, add your INT modifier to the roll.',
    reaction: true, trigger: 'takeDamage',
  },
]

export function getFeaturesForCharacter(c: Character): ActiveClassFeature[] {
  // Build a map of class name → { level, subclass } from multiclass array or primary class
  const classMap: Record<string, { level: number; subclass?: string }> = {}
  if (c.classes && c.classes.length > 0) {
    for (const cl of c.classes) classMap[cl.name] = { level: cl.level, subclass: cl.subclass }
  } else {
    classMap[c.class] = { level: c.level, subclass: c.subclass }
  }

  return ACTIVE_CLASS_FEATURES.filter(f => {
    const entry = classMap[f.cls]
    if (!entry) return false
    if (f.minLevel > entry.level) return false
    if (f.sub && f.sub !== entry.subclass) return false
    return true
  })
}

export function featMaxUses(f: ActiveClassFeature, c: Character): number {
  if (f.maxUses === null) return 0
  if (typeof f.maxUses === 'function') {
    // For multiclass characters, pass a proxy with the correct class level
    const classLevel = c.classes?.find(cl => cl.name === f.cls)?.level ?? c.level
    const proxy = classLevel !== c.level ? { ...c, level: classLevel } : c
    return f.maxUses(proxy)
  }
  return f.maxUses
}
