// ===== ABILITY SCORES =====
export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

// ===== SPELL =====
export interface Spell {
  name: string
  level: number
  school: string
  castTime: string
  range: string
  duration: string
  components: string
  concentration: boolean
  ritual: boolean
  classes: string[]
  higherLevel: string | null
  desc: string
  damage?: string
}

export interface CharacterSpell extends Spell {
  prepared?: boolean
}

// ===== WEAPON =====
export interface Weapon {
  name: string
  category: string
  damage: string
  damageType: string
  properties: string[]
  range?: string
  weight: string
  cost: string
  desc?: string
  versatile?: string
}

export interface CharacterWeapon {
  name: string
  isCustom?: boolean
  atkBonus?: number
  damage?: string
  damageType?: string
  range?: string
  versatile?: string
  finesse?: boolean
}

// ===== ARMOR =====
export interface Armor {
  name: string
  category: string
  ac: number
  dexBonus: boolean
  maxDex: number | null
  stealthDis: boolean
  strengthReq: number
  cost: string
  weight: string
  desc: string
}

// ===== GEAR =====
export interface GearItem {
  name: string
  category: string
  cost: string
  weight: string
  desc: string
}

export interface InventoryItem {
  name: string
  quantity: number
  cost?: string
  desc?: string
}

// ===== CHARACTER =====
export interface Character {
  id: string
  user_id: string

  // Identity
  name: string
  race: string
  class: string
  level: number
  background: string
  alignment: string
  photo_url?: string

  // Ability scores
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number

  // HP
  hp: number
  max_hp: number
  temp_hp: number

  // Death saves
  death_successes: number
  death_failures: number
  is_stable: boolean
  is_dead: boolean

  // Hit dice
  hit_dice_total: number
  hit_dice_used: number

  // Proficiencies & skills
  skill_proficiencies: string[]
  skill_expertise: string[]
  skill_overrides: Record<string, number>
  save_proficiencies: string[]
  save_overrides: Record<string, number>

  // Spells
  spells: CharacterSpell[]
  spell_slots_used: number[]
  concentration_spell: string | null

  // Combat
  weapons: CharacterWeapon[]
  active_weapon: string | null
  weapon_finesse_choices: Record<string, 'str' | 'dex'>

  // Armor
  armor: string[]
  equipped_armor: string | null
  equipped_shield: boolean

  // Inventory
  inventory: InventoryItem[]

  // Currency
  pp: number
  gp: number
  ep: number
  sp: number
  cp: number

  // Progression
  exp: number
  inspiration: boolean
  conditions: string[]

  // Bio
  personality: string
  ideals: string
  bonds: string
  flaws: string
  about: string

  // Timestamps
  created_at: string
  updated_at: string
}

export type CharacterDraft = Omit<Character, 'id' | 'user_id' | 'created_at' | 'updated_at'>

// ===== SESSION =====
export interface Enemy {
  id: string
  name: string
  hp: number
  maxHp: number
  initiative?: number
}

export interface InitiativeEntry {
  id: string
  name: string
  initiative: number
  isPlayer: boolean
  hp?: number
  maxHp?: number
}

export interface ShopItem {
  id: string
  name: string
  price: number
  category: string
  desc?: string
}

export interface Session {
  id: string
  dm_user_id: string
  campaign_name: string
  player_character_ids: string[]
  enemies: Enemy[]
  initiative: InitiativeEntry[]
  current_turn: number
  combat_active: boolean
  shop_items: ShopItem[]
  shop_open: boolean
  dm_notes: string
  active: boolean
  created_at: string
}

// ===== WIZARD STATE =====
export interface WizardState {
  name: string
  race: string
  class: string
  level: number
  hpMode: 'max' | 'avg' | 'roll'
  system: 'custom' | 'pointbuy' | 'standard'
  str: number
  dex: number
  con: number
  int: number
  wis: number
  cha: number
  background: string
  alignment: string
  personality: string
  ideals: string
  bonds: string
  flaws: string
  about: string
  skills: string[]
  [key: string]: unknown
}

// ===== AUTH =====
export interface AuthUser {
  id: string
  email?: string
}
