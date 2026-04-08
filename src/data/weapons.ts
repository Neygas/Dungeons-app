import type { Weapon } from '@/types'

export const WEAPON_DB: Weapon[] = [
  // Simple Melee
  { name: 'Club', category: 'Simple Melee', damage: '1d4', damageType: 'bludgeoning', properties: ['Light'], weight: '2 lb', cost: '1 sp' },
  { name: 'Dagger', category: 'Simple Melee', damage: '1d4', damageType: 'piercing', properties: ['Finesse', 'Light', 'Thrown (20/60)'], range: '20/60', weight: '1 lb', cost: '2 gp' },
  { name: 'Greatclub', category: 'Simple Melee', damage: '1d8', damageType: 'bludgeoning', properties: ['Two-handed'], weight: '10 lb', cost: '2 sp' },
  { name: 'Handaxe', category: 'Simple Melee', damage: '1d6', damageType: 'slashing', properties: ['Light', 'Thrown (20/60)'], range: '20/60', weight: '2 lb', cost: '5 gp' },
  { name: 'Javelin', category: 'Simple Melee', damage: '1d6', damageType: 'piercing', properties: ['Thrown (30/120)'], range: '30/120', weight: '2 lb', cost: '5 sp' },
  { name: 'Light Hammer', category: 'Simple Melee', damage: '1d4', damageType: 'bludgeoning', properties: ['Light', 'Thrown (20/60)'], range: '20/60', weight: '2 lb', cost: '2 gp' },
  { name: 'Mace', category: 'Simple Melee', damage: '1d6', damageType: 'bludgeoning', properties: [], weight: '4 lb', cost: '5 gp' },
  { name: 'Quarterstaff', category: 'Simple Melee', damage: '1d6', damageType: 'bludgeoning', properties: ['Versatile (1d8)'], versatile: '1d8', weight: '4 lb', cost: '2 sp' },
  { name: 'Spear', category: 'Simple Melee', damage: '1d6', damageType: 'piercing', properties: ['Thrown (20/60)', 'Versatile (1d8)'], range: '20/60', versatile: '1d8', weight: '3 lb', cost: '1 gp' },
  // Simple Ranged
  { name: 'Crossbow, Light', category: 'Simple Ranged', damage: '1d8', damageType: 'piercing', properties: ['Ammunition (80/320)', 'Loading', 'Two-handed'], range: '80/320', weight: '5 lb', cost: '25 gp' },
  { name: 'Shortbow', category: 'Simple Ranged', damage: '1d6', damageType: 'piercing', properties: ['Ammunition (80/320)', 'Two-handed'], range: '80/320', weight: '2 lb', cost: '25 gp' },
  { name: 'Sling', category: 'Simple Ranged', damage: '1d4', damageType: 'bludgeoning', properties: ['Ammunition (30/120)'], range: '30/120', weight: '0 lb', cost: '1 sp' },
  // Martial Melee
  { name: 'Battleaxe', category: 'Martial Melee', damage: '1d8', damageType: 'slashing', properties: ['Versatile (1d10)'], versatile: '1d10', weight: '4 lb', cost: '10 gp' },
  { name: 'Flail', category: 'Martial Melee', damage: '1d8', damageType: 'bludgeoning', properties: [], weight: '2 lb', cost: '10 gp' },
  { name: 'Glaive', category: 'Martial Melee', damage: '1d10', damageType: 'slashing', properties: ['Heavy', 'Reach', 'Two-handed'], weight: '6 lb', cost: '20 gp' },
  { name: 'Greataxe', category: 'Martial Melee', damage: '1d12', damageType: 'slashing', properties: ['Heavy', 'Two-handed'], weight: '7 lb', cost: '30 gp' },
  { name: 'Greatsword', category: 'Martial Melee', damage: '2d6', damageType: 'slashing', properties: ['Heavy', 'Two-handed'], weight: '6 lb', cost: '50 gp' },
  { name: 'Longsword', category: 'Martial Melee', damage: '1d8', damageType: 'slashing', properties: ['Versatile (1d10)'], versatile: '1d10', weight: '3 lb', cost: '15 gp' },
  { name: 'Maul', category: 'Martial Melee', damage: '2d6', damageType: 'bludgeoning', properties: ['Heavy', 'Two-handed'], weight: '10 lb', cost: '10 gp' },
  { name: 'Morningstar', category: 'Martial Melee', damage: '1d8', damageType: 'piercing', properties: [], weight: '4 lb', cost: '15 gp' },
  { name: 'Rapier', category: 'Martial Melee', damage: '1d8', damageType: 'piercing', properties: ['Finesse'], weight: '2 lb', cost: '25 gp' },
  { name: 'Scimitar', category: 'Martial Melee', damage: '1d6', damageType: 'slashing', properties: ['Finesse', 'Light'], weight: '3 lb', cost: '25 gp' },
  { name: 'Shortsword', category: 'Martial Melee', damage: '1d6', damageType: 'piercing', properties: ['Finesse', 'Light'], weight: '2 lb', cost: '10 gp' },
  { name: 'War Pick', category: 'Martial Melee', damage: '1d8', damageType: 'piercing', properties: [], weight: '2 lb', cost: '5 gp' },
  { name: 'Warhammer', category: 'Martial Melee', damage: '1d8', damageType: 'bludgeoning', properties: ['Versatile (1d10)'], versatile: '1d10', weight: '2 lb', cost: '15 gp' },
  // Martial Ranged
  { name: 'Crossbow, Hand', category: 'Martial Ranged', damage: '1d6', damageType: 'piercing', properties: ['Ammunition (30/120)', 'Light', 'Loading'], range: '30/120', weight: '3 lb', cost: '75 gp' },
  { name: 'Crossbow, Heavy', category: 'Martial Ranged', damage: '1d10', damageType: 'piercing', properties: ['Ammunition (100/400)', 'Heavy', 'Loading', 'Two-handed'], range: '100/400', weight: '18 lb', cost: '50 gp' },
  { name: 'Longbow', category: 'Martial Ranged', damage: '1d8', damageType: 'piercing', properties: ['Ammunition (150/600)', 'Heavy', 'Two-handed'], range: '150/600', weight: '2 lb', cost: '50 gp' },
]

export const WEAPON_CATEGORIES = ['Simple Melee', 'Simple Ranged', 'Martial Melee', 'Martial Ranged']

export const FINESSE_WEAPONS = WEAPON_DB
  .filter(w => w.properties.some(p => p.startsWith('Finesse')))
  .map(w => w.name)
