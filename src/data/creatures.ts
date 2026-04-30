export interface CreatureAttack {
  name: string
  attackBonus: number
  damageDice: string
  damageType: string
  savingThrow?: { ability: string; dc: number; effect: string } | null
}

export interface Creature {
  name: string
  ac: number
  hp: number
  cr: string
  speed: string
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
  attacks: CreatureAttack[]
  isNpc?: boolean
}

export const CREATURE_DB: Creature[] = [
  {
    name: 'Goblin', ac: 15, hp: 7, cr: '1/4', speed: '30 ft',
    str: 8, dex: 14, con: 10, int: 10, wis: 8, cha: 8,
    attacks: [
      { name: 'Scimitar', attackBonus: 4, damageDice: '1d6+2', damageType: 'slashing' },
      { name: 'Shortbow', attackBonus: 4, damageDice: '1d6+2', damageType: 'piercing' },
    ],
  },
  {
    name: 'Kobold', ac: 12, hp: 5, cr: '1/8', speed: '30 ft',
    str: 7, dex: 15, con: 9, int: 8, wis: 7, cha: 8,
    attacks: [
      { name: 'Dagger', attackBonus: 4, damageDice: '1d4+2', damageType: 'piercing' },
      { name: 'Sling', attackBonus: 4, damageDice: '1d4+2', damageType: 'bludgeoning' },
    ],
  },
  {
    name: 'Skeleton', ac: 13, hp: 13, cr: '1/4', speed: '30 ft',
    str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5,
    attacks: [
      { name: 'Shortsword', attackBonus: 4, damageDice: '1d6+2', damageType: 'piercing' },
      { name: 'Shortbow', attackBonus: 4, damageDice: '1d6+2', damageType: 'piercing' },
    ],
  },
  {
    name: 'Zombie', ac: 8, hp: 22, cr: '1/4', speed: '20 ft',
    str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5,
    attacks: [
      { name: 'Slam', attackBonus: 3, damageDice: '1d6+1', damageType: 'bludgeoning' },
    ],
  },
  {
    name: 'Wolf', ac: 13, hp: 11, cr: '1/4', speed: '40 ft',
    str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6,
    attacks: [
      { name: 'Bite', attackBonus: 4, damageDice: '2d4+2', damageType: 'piercing', savingThrow: { ability: 'STR', dc: 11, effect: 'knocked prone' } },
    ],
  },
  {
    name: 'Giant Spider', ac: 14, hp: 26, cr: '1', speed: '30 ft, climb 30 ft',
    str: 14, dex: 16, con: 12, int: 2, wis: 11, cha: 4,
    attacks: [
      { name: 'Bite', attackBonus: 5, damageDice: '1d8+3', damageType: 'piercing', savingThrow: { ability: 'CON', dc: 11, effect: 'take 2d8 poison damage, or half on success' } },
      { name: 'Web', attackBonus: 5, damageDice: '0', damageType: '—', savingThrow: { ability: 'STR', dc: 12, effect: 'restrained (escape DC 12)' } },
    ],
  },
  {
    name: 'Orc', ac: 13, hp: 15, cr: '1/2', speed: '30 ft',
    str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10,
    attacks: [
      { name: 'Greataxe', attackBonus: 5, damageDice: '1d12+3', damageType: 'slashing' },
      { name: 'Javelin', attackBonus: 5, damageDice: '1d6+3', damageType: 'piercing' },
    ],
  },
  {
    name: 'Bandit', ac: 12, hp: 11, cr: '1/8', speed: '30 ft',
    str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10,
    attacks: [
      { name: 'Scimitar', attackBonus: 3, damageDice: '1d6+1', damageType: 'slashing' },
      { name: 'Light Crossbow', attackBonus: 3, damageDice: '1d8+1', damageType: 'piercing' },
    ],
  },
  {
    name: 'Guard', ac: 16, hp: 11, cr: '1/8', speed: '30 ft',
    str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10,
    attacks: [
      { name: 'Spear', attackBonus: 3, damageDice: '1d8+1', damageType: 'piercing' },
    ],
  },
  {
    name: 'Hobgoblin', ac: 18, hp: 11, cr: '1/2', speed: '30 ft',
    str: 13, dex: 12, con: 12, int: 10, wis: 10, cha: 9,
    attacks: [
      { name: 'Longsword', attackBonus: 3, damageDice: '1d8+1', damageType: 'slashing' },
      { name: 'Longbow', attackBonus: 3, damageDice: '1d8+1', damageType: 'piercing' },
    ],
  },
  {
    name: 'Gnoll', ac: 15, hp: 22, cr: '1/2', speed: '30 ft',
    str: 14, dex: 12, con: 11, int: 6, wis: 10, cha: 7,
    attacks: [
      { name: 'Bite', attackBonus: 4, damageDice: '1d4+2', damageType: 'piercing' },
      { name: 'Spear', attackBonus: 4, damageDice: '1d8+2', damageType: 'piercing' },
      { name: 'Longbow', attackBonus: 3, damageDice: '1d8+1', damageType: 'piercing' },
    ],
  },
  {
    name: 'Cultist', ac: 12, hp: 9, cr: '1/8', speed: '30 ft',
    str: 11, dex: 12, con: 10, int: 10, wis: 11, cha: 10,
    attacks: [
      { name: 'Scimitar', attackBonus: 3, damageDice: '1d6+1', damageType: 'slashing' },
    ],
  },
  {
    name: 'Troll', ac: 15, hp: 84, cr: '5', speed: '30 ft',
    str: 18, dex: 13, con: 20, int: 7, wis: 9, cha: 7,
    attacks: [
      { name: 'Bite', attackBonus: 7, damageDice: '1d6+4', damageType: 'piercing' },
      { name: 'Claw', attackBonus: 7, damageDice: '2d6+4', damageType: 'slashing' },
    ],
  },
  {
    name: 'Ogre', ac: 11, hp: 59, cr: '2', speed: '40 ft',
    str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7,
    attacks: [
      { name: 'Greatclub', attackBonus: 6, damageDice: '2d8+4', damageType: 'bludgeoning' },
      { name: 'Javelin', attackBonus: 6, damageDice: '2d6+4', damageType: 'piercing' },
    ],
  },
  {
    name: 'Vampire Spawn', ac: 15, hp: 82, cr: '5', speed: '30 ft, climb 30 ft',
    str: 16, dex: 16, con: 16, int: 11, wis: 10, cha: 12,
    attacks: [
      { name: 'Claws', attackBonus: 6, damageDice: '2d4+3', damageType: 'slashing' },
      { name: 'Bite', attackBonus: 6, damageDice: '1d6+3', damageType: 'piercing', savingThrow: { ability: 'CON', dc: 13, effect: 'max HP reduced by damage dealt until long rest' } },
    ],
  },
  // ── NPCs ──────────────────────────────────────────────────────────────────────
  {
    name: 'Town Guard', ac: 16, hp: 11, cr: '—', speed: '30 ft',
    str: 13, dex: 12, con: 12, int: 10, wis: 11, cha: 10,
    isNpc: true,
    attacks: [
      { name: 'Spear', attackBonus: 3, damageDice: '1d8+1', damageType: 'piercing' },
    ],
  },
  {
    name: 'Bandit Captain', ac: 15, hp: 65, cr: '—', speed: '30 ft',
    str: 15, dex: 16, con: 14, int: 14, wis: 11, cha: 14,
    isNpc: true,
    attacks: [
      { name: 'Scimitar', attackBonus: 5, damageDice: '1d6+3', damageType: 'slashing' },
      { name: 'Dagger', attackBonus: 5, damageDice: '1d4+3', damageType: 'piercing' },
    ],
  },
  {
    name: 'Tavern Brawler', ac: 11, hp: 32, cr: '—', speed: '30 ft',
    str: 14, dex: 12, con: 12, int: 10, wis: 10, cha: 10,
    isNpc: true,
    attacks: [
      { name: 'Fist', attackBonus: 4, damageDice: '1d4+2', damageType: 'bludgeoning' },
      { name: 'Chair', attackBonus: 4, damageDice: '1d6+2', damageType: 'bludgeoning' },
    ],
  },
  {
    name: 'Merchant', ac: 10, hp: 4, cr: '—', speed: '30 ft',
    str: 10, dex: 10, con: 10, int: 11, wis: 10, cha: 11,
    isNpc: true,
    attacks: [
      { name: 'Unarmed Strike', attackBonus: 0, damageDice: '1', damageType: 'bludgeoning' },
    ],
  },
  {
    name: 'Village Elder', ac: 10, hp: 9, cr: '—', speed: '30 ft',
    str: 8, dex: 10, con: 10, int: 12, wis: 14, cha: 13,
    isNpc: true,
    attacks: [
      { name: 'Walking Stick', attackBonus: 1, damageDice: '1d4-1', damageType: 'bludgeoning' },
    ],
  },
  {
    name: 'Spy', ac: 12, hp: 27, cr: '—', speed: '30 ft',
    str: 10, dex: 15, con: 10, int: 12, wis: 14, cha: 16,
    isNpc: true,
    attacks: [
      { name: 'Shortsword', attackBonus: 4, damageDice: '1d6+2', damageType: 'piercing' },
      { name: 'Hand Crossbow', attackBonus: 4, damageDice: '1d6+2', damageType: 'piercing' },
    ],
  },
]
