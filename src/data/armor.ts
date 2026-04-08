import type { Armor } from '@/types'

export const ARMOR_DB: Armor[] = [
  // Light Armor
  { name: 'Padded', category: 'Light Armor', ac: 11, dexBonus: true, maxDex: null, stealthDis: true, strengthReq: 0, cost: '5 gp', weight: '8 lb', desc: 'Quilted layers of cloth and batting. +DEX modifier to AC.' },
  { name: 'Leather', category: 'Light Armor', ac: 11, dexBonus: true, maxDex: null, stealthDis: false, strengthReq: 0, cost: '10 gp', weight: '10 lb', desc: 'Breastplate and shoulder protectors of hardened leather. +DEX modifier to AC.' },
  { name: 'Studded Leather', category: 'Light Armor', ac: 12, dexBonus: true, maxDex: null, stealthDis: false, strengthReq: 0, cost: '45 gp', weight: '13 lb', desc: 'Leather armor reinforced with metal rivets. +DEX modifier to AC.' },
  // Medium Armor
  { name: 'Hide', category: 'Medium Armor', ac: 12, dexBonus: true, maxDex: 2, stealthDis: false, strengthReq: 0, cost: '10 gp', weight: '12 lb', desc: 'Crude armor made from thick furs and pelts. +DEX modifier to AC (max +2).' },
  { name: 'Chain Shirt', category: 'Medium Armor', ac: 13, dexBonus: true, maxDex: 2, stealthDis: false, strengthReq: 0, cost: '50 gp', weight: '20 lb', desc: 'Interlocking metal rings worn between layers of clothing. +DEX (max +2).' },
  { name: 'Scale Mail', category: 'Medium Armor', ac: 14, dexBonus: true, maxDex: 2, stealthDis: true, strengthReq: 0, cost: '50 gp', weight: '45 lb', desc: 'A coat and leggings of leather covered with overlapping pieces of metal. +DEX (max +2).' },
  { name: 'Breastplate', category: 'Medium Armor', ac: 14, dexBonus: true, maxDex: 2, stealthDis: false, strengthReq: 0, cost: '400 gp', weight: '20 lb', desc: 'Metal chest piece worn over leather. +DEX modifier to AC (max +2).' },
  { name: 'Half Plate', category: 'Medium Armor', ac: 15, dexBonus: true, maxDex: 2, stealthDis: true, strengthReq: 0, cost: '750 gp', weight: '40 lb', desc: 'Shaped metal plates covering most of the body. +DEX (max +2).' },
  // Heavy Armor
  { name: 'Ring Mail', category: 'Heavy Armor', ac: 14, dexBonus: false, maxDex: 0, stealthDis: true, strengthReq: 0, cost: '30 gp', weight: '40 lb', desc: 'Leather armor with heavy rings sewn into it.' },
  { name: 'Chain Mail', category: 'Heavy Armor', ac: 16, dexBonus: false, maxDex: 0, stealthDis: true, strengthReq: 13, cost: '75 gp', weight: '55 lb', desc: 'Interlocking metal rings. Requires STR 13.' },
  { name: 'Splint', category: 'Heavy Armor', ac: 17, dexBonus: false, maxDex: 0, stealthDis: true, strengthReq: 15, cost: '200 gp', weight: '60 lb', desc: 'Narrow vertical strips of metal riveted to leather. Requires STR 15.' },
  { name: 'Plate', category: 'Heavy Armor', ac: 18, dexBonus: false, maxDex: 0, stealthDis: true, strengthReq: 15, cost: '1500 gp', weight: '65 lb', desc: 'Full coverage of shaped, interlocking metal plates. Requires STR 15.' },
  // Shield
  { name: 'Shield', category: 'Shield', ac: 2, dexBonus: false, maxDex: 0, stealthDis: false, strengthReq: 0, cost: '10 gp', weight: '6 lb', desc: '+2 to AC. Cannot use two-handed weapons while holding.' },
]

export const ARMOR_CATEGORIES = ['Light Armor', 'Medium Armor', 'Heavy Armor', 'Shield']

export const AMMO_MAP: Record<string, string> = {
  'Shortbow': 'Arrows (20)',
  'Longbow': 'Arrows (20)',
  'Crossbow, Light': 'Crossbow Bolts (20)',
  'Crossbow, Hand': 'Crossbow Bolts (20)',
  'Crossbow, Heavy': 'Crossbow Bolts (20)',
  'Sling': 'Sling Bullets (20)',
}
