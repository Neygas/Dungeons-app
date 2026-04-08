export interface RaceTrait {
  name: string
  desc: string
}

export interface Race {
  bonus: string
  traits: string[]
  speed: number
  languages: string[]
  traitDetails?: RaceTrait[]
}

export const RACES: Record<string, Race> = {
  Human: { bonus: 'All +1', traits: ['Extra Language', 'Extra Skill'], speed: 30, languages: ['Common', 'One extra'], traitDetails: [{ name: 'Versatile', desc: 'Gain +1 to all ability scores, one extra skill proficiency, and one extra language.' }] },
  'Wood Elf': { bonus: 'DEX +2, WIS +1', traits: ['Darkvision 60ft', 'Keen Senses', 'Fey Ancestry', 'Trance', 'Mask of the Wild', 'Fleet of Foot'], speed: 35, languages: ['Common', 'Elvish'], traitDetails: [{ name: 'Darkvision', desc: 'See in dim light within 60 ft as if bright, darkness as if dim.' }, { name: 'Keen Senses', desc: 'Proficiency in Perception.' }, { name: 'Fey Ancestry', desc: 'Advantage on saves vs charm. Cannot be magically put to sleep.' }, { name: 'Mask of the Wild', desc: 'Can hide when only lightly obscured by natural phenomena.' }, { name: 'Fleet of Foot', desc: 'Base walking speed is 35 feet.' }] },
  'High Elf': { bonus: 'DEX +2, INT +1', traits: ['Darkvision 60ft', 'Keen Senses', 'Fey Ancestry', 'Trance', 'Cantrip'], speed: 30, languages: ['Common', 'Elvish', 'One extra'], traitDetails: [{ name: 'Darkvision', desc: 'See in dim light within 60 ft as if bright.' }, { name: 'Keen Senses', desc: 'Proficiency in Perception.' }, { name: 'Fey Ancestry', desc: 'Advantage on saves vs charm. Cannot be magically put to sleep.' }, { name: 'Cantrip', desc: 'Know one wizard cantrip. Intelligence is your spellcasting ability for it.' }] },
  Dwarf: { bonus: 'CON +2', traits: ['Darkvision 60ft', 'Dwarven Resilience', 'Stonecunning'], speed: 25, languages: ['Common', 'Dwarvish'], traitDetails: [{ name: 'Darkvision', desc: 'See in dim light within 60 ft as if bright.' }, { name: 'Dwarven Resilience', desc: 'Advantage on saves vs poison, resistance to poison damage.' }, { name: 'Stonecunning', desc: 'Double proficiency bonus on History checks related to stonework.' }] },
  Halfling: { bonus: 'DEX +2', traits: ['Lucky', 'Brave', 'Halfling Nimbleness'], speed: 25, languages: ['Common', 'Halfling'], traitDetails: [{ name: 'Lucky', desc: 'When you roll a 1 on an attack, ability check, or save, reroll and use the new result.' }, { name: 'Brave', desc: 'Advantage on saving throws against being frightened.' }, { name: 'Halfling Nimbleness', desc: 'Move through the space of any creature larger than you.' }] },
  'Half-Orc': { bonus: 'STR +2, CON +1', traits: ['Darkvision 60ft', 'Menacing', 'Relentless Endurance', 'Savage Attacks'], speed: 30, languages: ['Common', 'Orc'], traitDetails: [{ name: 'Darkvision', desc: 'See in dim light within 60 ft as if bright.' }, { name: 'Menacing', desc: 'Proficiency in Intimidation.' }, { name: 'Relentless Endurance', desc: 'When reduced to 0 HP but not killed outright, drop to 1 HP instead. Once per long rest.' }, { name: 'Savage Attacks', desc: 'On a critical hit with a melee weapon, roll one extra weapon damage die.' }] },
  Tiefling: { bonus: 'INT +1, CHA +2', traits: ['Darkvision 60ft', 'Hellish Resistance', 'Infernal Legacy'], speed: 30, languages: ['Common', 'Infernal'], traitDetails: [{ name: 'Darkvision', desc: 'See in dim light within 60 ft as if bright.' }, { name: 'Hellish Resistance', desc: 'Resistance to fire damage.' }, { name: 'Infernal Legacy', desc: 'Know Thaumaturgy. At 3rd: Hellish Rebuke 1/day. At 5th: Darkness 1/day.' }] },
  Dragonborn: { bonus: 'STR +2, CHA +1', traits: ['Draconic Ancestry', 'Breath Weapon', 'Damage Resistance'], speed: 30, languages: ['Common', 'Draconic'], traitDetails: [{ name: 'Draconic Ancestry', desc: 'Choose a dragon type. Determines your breath weapon type and damage resistance.' }, { name: 'Breath Weapon', desc: 'Use action to exhale destructive energy in an area. DEX or CON save or take 2d6 damage.' }, { name: 'Damage Resistance', desc: 'Resistance to the damage type of your draconic ancestry.' }] },
  Gnome: { bonus: 'INT +2', traits: ['Darkvision 60ft', 'Gnome Cunning'], speed: 25, languages: ['Common', 'Gnomish'], traitDetails: [{ name: 'Darkvision', desc: 'See in dim light within 60 ft as if bright.' }, { name: 'Gnome Cunning', desc: 'Advantage on INT, WIS, and CHA saving throws against magic.' }] },
  'Half-Elf': { bonus: 'CHA +2, Two others +1', traits: ['Darkvision 60ft', 'Fey Ancestry', 'Skill Versatility'], speed: 30, languages: ['Common', 'Elvish', 'One extra'], traitDetails: [{ name: 'Darkvision', desc: 'See in dim light within 60 ft as if bright.' }, { name: 'Fey Ancestry', desc: 'Advantage on saves vs charm. Cannot be magically put to sleep.' }, { name: 'Skill Versatility', desc: 'Gain proficiency in two skills of your choice.' }] },
  Aasimar: { bonus: 'CHA +2', traits: ['Darkvision 60ft', 'Celestial Resistance', 'Healing Hands'], speed: 30, languages: ['Common', 'Celestial'], traitDetails: [{ name: 'Darkvision', desc: 'See in dim light within 60 ft as if bright.' }, { name: 'Celestial Resistance', desc: 'Resistance to necrotic and radiant damage.' }, { name: 'Healing Hands', desc: 'As an action, restore HP equal to your level. Once per long rest.' }] },
}

export const RACE_NAMES = Object.keys(RACES)
