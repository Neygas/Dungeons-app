export const SUBCLASS_LEVEL: Record<string, number> = {
  Barbarian: 3,
  Bard: 3,
  Cleric: 1,
  Druid: 2,
  Fighter: 3,
  Monk: 3,
  Paladin: 3,
  Ranger: 3,
  Rogue: 3,
  Sorcerer: 1,
  Warlock: 1,
  Wizard: 2,
  Artificer: 3,
}

export const SUBCLASS_LABEL: Record<string, string> = {
  Barbarian: 'Primal Path',
  Bard: 'Bard College',
  Cleric: 'Divine Domain',
  Druid: 'Druid Circle',
  Fighter: 'Martial Archetype',
  Monk: 'Monastic Tradition',
  Paladin: 'Sacred Oath',
  Ranger: 'Ranger Archetype',
  Rogue: 'Roguish Archetype',
  Sorcerer: 'Sorcerous Origin',
  Warlock: 'Otherworldly Patron',
  Wizard: 'Arcane Tradition',
  Artificer: 'Artificer Specialization',
}

export interface SubclassOption {
  name: string
  desc: string
}

export const SUBCLASSES: Record<string, SubclassOption[]> = {
  Barbarian: [
    { name: 'Path of the Berserker', desc: 'Channel rage into frenzied fury. Frenzied attack, Mindless Rage, Intimidating Presence, Retaliation.' },
    { name: 'Path of the Totem Warrior', desc: 'Bond with a totem animal (bear, eagle, wolf, elk, tiger) for spiritual power and protection.' },
    { name: 'Path of the Ancestral Guardian', desc: 'Call on ancestor spirits to protect allies and hinder enemies who target your friends.' },
    { name: 'Path of the Storm Herald', desc: 'Harness stormy environments (desert, sea, tundra) as an aura of elemental power.' },
    { name: 'Path of the Zealot', desc: 'Fueled by divine power. Resist death, deal bonus radiant or necrotic damage, fight beyond 0 HP.' },
    { name: 'Path of Wild Magic', desc: 'Rage triggers wild magic surges. Gain magical awareness and bolstering power.' },
    { name: 'Path of the Beast', desc: 'Manifest bestial traits (bite, claws, tail) during rage for natural weapon attacks.' },
  ],
  Bard: [
    { name: 'College of Lore', desc: 'Cutting Words, bonus proficiencies, extra Magical Secrets. The scholar bard.' },
    { name: 'College of Valor', desc: 'Combat inspiration, extra attack, and martial weapon and medium armor proficiency.' },
    { name: 'College of Glamour', desc: 'Fey-touched. Mantle of Inspiration and Mantle of Majesty from Feywild magic.' },
    { name: 'College of Swords', desc: 'Blade flourishes and extra attack. Fight with style using Flourish abilities.' },
    { name: 'College of Whispers', desc: 'Shadow abilities, psychic blades, and the power to steal identities.' },
    { name: 'College of Creation', desc: 'Bring art to life. Note of Potential and Performance of Creation abilities.' },
    { name: 'College of Eloquence', desc: 'Silver tongue. Unsettling Words, Unfailing Inspiration, Universal Speech.' },
  ],
  Cleric: [
    { name: 'Life Domain', desc: 'Heavy armor, boosted healing spells, Preserve Life, Blessed Healer, Supreme Healing.' },
    { name: 'Light Domain', desc: 'Warding Flare, Radiance of the Dawn, Improved Flare, Corona of Light.' },
    { name: 'Trickery Domain', desc: 'Blessing of the Trickster, Invoke Duplicity, Cloak of Shadows, Divine Strike.' },
    { name: 'Knowledge Domain', desc: 'Blessings of Knowledge, Channel Divinity, Read Thoughts, Visions of the Past.' },
    { name: 'Nature Domain', desc: 'Heavy armor, Acolyte of Nature, Dampen Elements, Master of Nature.' },
    { name: 'Tempest Domain', desc: 'Heavy armor, Wrath of the Storm, Thunderbolt Strike, Stormborn.' },
    { name: 'War Domain', desc: 'Heavy armor, martial weapons, War Priest bonus attacks, Avatar of Battle.' },
    { name: 'Death Domain', desc: 'Reaper cantrip, undead thralls, necrotic damage. For dark or villainous themes.' },
    { name: 'Forge Domain', desc: 'Artisan bonus, Blessing of the Forge on weapons and armor, Soul of the Forge.' },
    { name: 'Grave Domain', desc: 'Circle of Mortality, Eyes of the Grave, Keeper of Souls, Sentinel at Death\'s Door.' },
    { name: 'Order Domain', desc: 'Voice of Authority, Embodiment of the Law, Order\'s Demand, Divine Strike.' },
    { name: 'Peace Domain', desc: 'Emboldening Bond, Balm of Peace, Protective Bond, Expansive Bond.' },
    { name: 'Twilight Domain', desc: 'Eyes of Night, Vigilant Blessing, Steps of Night, Twilight Shroud.' },
  ],
  Druid: [
    { name: 'Circle of the Land', desc: 'Natural Recovery, bonus cantrips and spells tied to a terrain type (arctic, coast, forest, etc.).' },
    { name: 'Circle of the Moon', desc: 'Combat Wild Shape into CR 1 beasts at level 2, higher CR at higher levels.' },
    { name: 'Circle of Dreams', desc: 'Balm of the Summer Court, Hearth of Moonlight and Shadow, Walker in Dreams.' },
    { name: 'Circle of the Shepherd', desc: 'Spirit Totem, Mighty Summoner, Guardian Spirit, Faithful Summons.' },
    { name: 'Circle of Spores', desc: 'Halo of Spores, Symbiotic Entity, Fungal Infestation, Spreading Spores.' },
    { name: 'Circle of Stars', desc: 'Star Map, Starry Form (Archer, Chalice, Dragon), Twinkling Constellations.' },
    { name: 'Circle of Wildfire', desc: 'Summon a wildfire spirit, Enhanced Bond, Cauterizing Flames, Blazing Revival.' },
  ],
  Fighter: [
    { name: 'Champion', desc: 'Improved Critical (19-20), Remarkable Athlete, extra fighting style, Superior Critical (18-20).' },
    { name: 'Battle Master', desc: 'Superiority Dice and combat maneuvers, Know Your Enemy, Relentless.' },
    { name: 'Eldritch Knight', desc: 'Spellcasting (INT, abjuration and evocation). War Magic at level 7.' },
    { name: 'Arcane Archer', desc: 'Arcane Shot magical arrow options, Magic Arrow, Curving Shot, Ever-Ready Shot.' },
    { name: 'Cavalier', desc: 'Bonus proficiencies, Unwavering Mark, Warlord, Hold the Line, Vigilant Defender.' },
    { name: 'Echo Knight', desc: 'Manifest Echo double, Unleash Incarnation, Echo Avatar, Shadow Martyr.' },
    { name: 'Psi Warrior', desc: 'Psionic Power dice, Protective Field, Psionic Strike, Telekinetic Movement.' },
    { name: 'Rune Knight', desc: 'Giant rune magic, Giant\'s Might size increase, Runic Shield, Master of Runes.' },
    { name: 'Samurai', desc: 'Bonus proficiency, Fighting Spirit advantage, Elegant Courtier, Rapid Strike.' },
  ],
  Monk: [
    { name: 'Way of the Open Hand', desc: 'Open Hand Technique, Wholeness of Body, Tranquility, Quivering Palm.' },
    { name: 'Way of Shadow', desc: 'Shadow Arts spellcasting, Shadow Step, Cloak of Shadows, Opportunist.' },
    { name: 'Way of the Four Elements', desc: 'Disciple of the Elements, elemental disciplines fueled by ki points.' },
    { name: 'Way of the Drunken Master', desc: 'Drunken Technique, Tipsy Sway, Drunkard\'s Luck, Intoxicated Frenzy.' },
    { name: 'Way of the Kensei', desc: 'Kensei Weapons, Agile Parry, Kensei\'s Shot, Deft Strike, Sharpen the Blade.' },
    { name: 'Way of the Sun Soul', desc: 'Radiant Sun Bolt ranged attack, Searing Arc Strike, Searing Sunburst.' },
    { name: 'Way of Mercy', desc: 'Implements of Mercy, Hand of Healing, Hand of Harm, Physician\'s Touch.' },
    { name: 'Way of the Astral Self', desc: 'Arms of the Astral Self, Visage of the Astral Self, Body of the Astral Self.' },
    { name: 'Way of the Long Death', desc: 'Touch of Death, Hour of Reaping, Mastery of Death, Touch of the Long Death.' },
  ],
  Paladin: [
    { name: 'Oath of Devotion', desc: 'Sacred Weapon, Turn the Unholy, Aura of Devotion, Holy Nimbus.' },
    { name: 'Oath of the Ancients', desc: 'Nature\'s Wrath, Turn the Faithless, Aura of Warding, Elder Champion.' },
    { name: 'Oath of Vengeance', desc: 'Abjure Enemy, Vow of Enmity, Relentless Avenger, Soul of Vengeance.' },
    { name: 'Oath of Conquest', desc: 'Conquering Presence, Guided Strike, Aura of Conquest, Invincible Conqueror.' },
    { name: 'Oath of Redemption', desc: 'Emissary of Peace, Rebuke the Violent, Aura of the Guardian, Emissary of Redemption.' },
    { name: 'Oath of Glory', desc: 'Inspiring Smite, Peerless Athlete, Aura of Alacrity, Glorious Defense.' },
    { name: 'Oath of the Watchers', desc: 'Abjure the Extraplanar, Watcher\'s Will, Aura of the Sentinel, Mortal Bulwark.' },
    { name: 'Oathbreaker', desc: 'Dark powers. Control Undead, Dreadful Aspect, Aura of Hate, Supernatural Resistance.' },
  ],
  Ranger: [
    { name: 'Hunter', desc: 'Hunter\'s Prey, Defensive Tactics, Multiattack, Superior Hunter\'s Defense.' },
    { name: 'Beast Master', desc: 'Ranger\'s Companion beast, Exceptional Training, Bestial Fury, Share Spells.' },
    { name: 'Gloom Stalker', desc: 'Darkvision bonus, Umbral Sight, extra attack round 1, Stalker\'s Flurry.' },
    { name: 'Horizon Walker', desc: 'Detect portal, Planar Warrior, Ethereal Step, Distant Strike.' },
    { name: 'Monster Slayer', desc: 'Hunter\'s Sense, Slayer\'s Prey, Supernatural Defense, Magic-User\'s Nemesis.' },
    { name: 'Fey Wanderer', desc: 'Dreadful Strikes, Otherworldly Glamour, Beguiling Twist, Fey Reinforcements.' },
    { name: 'Swarmkeeper', desc: 'Gathered Swarm bonus action, Writhing Tide movement, Swarming Dispersal.' },
  ],
  Rogue: [
    { name: 'Thief', desc: 'Fast Hands, Second-Story Work, Supreme Sneak, Use Magic Device, Thief\'s Reflexes.' },
    { name: 'Assassin', desc: 'Assassinate (advantage on surprised foes), Infiltration Expertise, Impostor, Death Strike.' },
    { name: 'Arcane Trickster', desc: 'Spellcasting (INT, illusion and enchantment). Mage Hand Legerdemain, Spell Thief.' },
    { name: 'Inquisitive', desc: 'Ear for Deceit, Eye for Detail, Insightful Fighting, Steady Eye, Unerring Eye.' },
    { name: 'Mastermind', desc: 'Master of Intrigue, Master of Tactics, Insightful Manipulator, Misdirection.' },
    { name: 'Scout', desc: 'Skirmisher reaction move, Survivalist double proficiency, Superior Mobility, Ambush Master.' },
    { name: 'Swashbuckler', desc: 'Fancy Footwork, Rakish Audacity sneak attack alone, Panache, Elegant Maneuver.' },
    { name: 'Phantom', desc: 'Whispers of the Dead, Wails from the Grave, Tokens of the Departed, Ghost Walk.' },
    { name: 'Soulknife', desc: 'Psychic Blades, Psi-Bolstered Knack, Psychic Whispers, Psychic Veil.' },
  ],
  Sorcerer: [
    { name: 'Draconic Bloodline', desc: 'Dragon ancestor (choose type). Draconic Resilience, Dragon Wings, Dragon Presence.' },
    { name: 'Wild Magic', desc: 'Wild Magic Surge table, Tides of Chaos, Bend Luck, Controlled Chaos, Spell Bombardment.' },
    { name: 'Divine Soul', desc: 'Divine Magic spell list access, Favored by the Gods, Empowered Healing, Angelic Form.' },
    { name: 'Shadow Magic', desc: 'Eyes of the Dark, Strength of the Grave, Hound of Ill Omen, Shadow Walk.' },
    { name: 'Storm Sorcery', desc: 'Wind Speaker, Tempestuous Magic flight, Heart of the Storm, Storm\'s Fury.' },
    { name: 'Aberrant Mind', desc: 'Telepathic Speech, Psionic Spells, Warped Being, Revelation in Flesh.' },
    { name: 'Clockwork Soul', desc: 'Clockwork Magic, Restore Balance, Bastion of Law, Trance of Order.' },
  ],
  Warlock: [
    { name: 'The Archfey', desc: 'Fey Presence, Misty Escape, Beguiling Defenses, Dark Delirium.' },
    { name: 'The Fiend', desc: "Dark One's Blessing temp HP, Dark One's Own Luck, Fiendish Resilience, Hurl Through Hell." },
    { name: 'The Great Old One', desc: 'Awakened Mind telepathy, Entropic Ward, Thought Shield, Create Thrall.' },
    { name: 'The Hexblade', desc: "Hexblade's Curse, Hex Warrior melee CHA, Accursed Specter, Armor of Hexes." },
    { name: 'The Celestial', desc: 'Expanded spell list, Healing Light dice pool, Radiant Soul, Celestial Resilience.' },
    { name: 'The Fathomless', desc: 'Tentacle of the Deeps, Gift of the Sea swim speed, Oceanic Soul, Guardian Coil.' },
    { name: 'The Genie', desc: "Genie's Vessel extradimensional space, Elemental Gift, Sanctuary Vessel, Limited Wish." },
    { name: 'The Undead', desc: 'Form of Dread, Grave Touched necrotic bonus, Necrotic Husk, Spirit Projection.' },
  ],
  Wizard: [
    { name: 'School of Abjuration', desc: 'Abjuration Savant, Arcane Ward, Projected Ward, Improved Abjuration, Spell Resistance.' },
    { name: 'School of Conjuration', desc: 'Conjuration Savant, Minor Conjuration, Benign Transposition, Focused Conjuration.' },
    { name: 'School of Divination', desc: 'Divination Savant, Portent (2 d20s per long rest), Expert Divination, Third Eye.' },
    { name: 'School of Enchantment', desc: 'Enchantment Savant, Hypnotic Gaze, Instinctive Charm, Split Enchantment.' },
    { name: 'School of Evocation', desc: 'Evocation Savant, Sculpt Spells, Potent Cantrip, Empowered Evocation.' },
    { name: 'School of Illusion', desc: 'Illusion Savant, Improved Minor Illusion, Malleable Illusions, Illusory Self.' },
    { name: 'School of Necromancy', desc: 'Necromancy Savant, Grim Harvest, Undead Thralls, Command Undead.' },
    { name: 'School of Transmutation', desc: 'Transmutation Savant, Minor Alchemy, Transmuter\'s Stone, Shapechanger.' },
    { name: 'Bladesinging', desc: 'Training in War and Song, Bladesong, Extra Attack, Song of Defense, Song of Victory.' },
    { name: 'Order of Scribes', desc: 'Wizardly Quill, Awakened Spellbook, Manifest Mind, Master Scrivener.' },
  ],
  Artificer: [
    { name: 'Alchemist', desc: 'Experimental Elixir potions, Alchemical Savant, Restorative Reagents, Chemical Mastery.' },
    { name: 'Artillerist', desc: 'Eldritch Cannon (flamethrower, force ballista, or protector mode), Explosive Cannon.' },
    { name: 'Battle Smith', desc: 'Steel Defender construct companion, Arcane Jolt extra damage or healing, Improved Defender.' },
    { name: 'Armorer', desc: 'Arcane Armor (Guardian or Infiltrator mode), armor modifications, Perfected Armor.' },
  ],
}

export interface MulticlassPrereq {
  ability: string
  score: number
}

// Standard D&D 5e multiclassing prerequisites
export const MULTICLASS_PREREQS: Record<string, MulticlassPrereq[]> = {
  Barbarian: [{ ability: 'str', score: 13 }],
  Bard: [{ ability: 'cha', score: 13 }],
  Cleric: [{ ability: 'wis', score: 13 }],
  Druid: [{ ability: 'wis', score: 13 }],
  Fighter: [{ ability: 'str', score: 13 }],
  Monk: [{ ability: 'dex', score: 13 }, { ability: 'wis', score: 13 }],
  Paladin: [{ ability: 'str', score: 13 }, { ability: 'cha', score: 13 }],
  Ranger: [{ ability: 'dex', score: 13 }, { ability: 'wis', score: 13 }],
  Rogue: [{ ability: 'dex', score: 13 }],
  Sorcerer: [{ ability: 'cha', score: 13 }],
  Warlock: [{ ability: 'cha', score: 13 }],
  Wizard: [{ ability: 'int', score: 13 }],
  Artificer: [{ ability: 'int', score: 13 }],
}

// Multiclass combined spell slot table (full-caster equivalent levels 1-20)
// Sum effective spellcaster levels: full = class level, half = floor(level/2), Artificer = ceil(level/2)
export const MULTICLASS_SPELL_SLOTS: number[][] = [
  [2],[3,2],[4,2],[4,3],[4,3,2],[4,3,3],[4,3,3,1],[4,3,3,2],[4,3,3,3,1],[4,3,3,3,2],
  [4,3,3,3,2,1],[4,3,3,3,2,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1],[4,3,3,3,2,1,1,1],
  [4,3,3,3,2,1,1,1],[4,3,3,3,2,1,1,1,1],[4,3,3,3,3,1,1,1,1],[4,3,3,3,3,2,1,1,1],[4,3,3,3,3,2,2,1,1],
]

// Returns contribution to multiclass spell slot total for a given class at a given level
export function spellcasterLevel(className: string, classLevel: number): number {
  const full = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard']
  const half = ['Paladin', 'Ranger']
  if (full.includes(className)) return classLevel
  if (half.includes(className)) return Math.floor(classLevel / 2)
  if (className === 'Artificer') return Math.ceil(classLevel / 2)
  return 0
}
