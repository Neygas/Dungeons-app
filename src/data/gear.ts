import type { GearItem } from '@/types'

export const GEAR_DB: GearItem[] = [
  // Potions
  { name: 'Potion of Healing', category: 'Potion', cost: '50 gp', weight: '0.5 lb', desc: 'Regain 2d4+2 HP when you drink this potion.' },
  { name: 'Potion of Greater Healing', category: 'Potion', cost: '100 gp', weight: '0.5 lb', desc: 'Regain 4d4+4 HP when you drink this potion.' },
  { name: 'Potion of Superior Healing', category: 'Potion', cost: '500 gp', weight: '0.5 lb', desc: 'Regain 8d4+8 HP when you drink this potion.' },
  { name: 'Antitoxin', category: 'Potion', cost: '50 gp', weight: '0 lb', desc: 'Advantage on saves against poison for 1 hour.' },
  // Ammunition
  { name: 'Arrows (20)', category: 'Ammunition', cost: '1 gp', weight: '1 lb', desc: 'Arrows for use with a bow.' },
  { name: 'Crossbow Bolts (20)', category: 'Ammunition', cost: '1 gp', weight: '1.5 lb', desc: 'Bolts for use with a crossbow.' },
  { name: 'Sling Bullets (20)', category: 'Ammunition', cost: '4 cp', weight: '1.5 lb', desc: 'Bullets for use with a sling.' },
  // Adventuring Gear
  { name: 'Backpack', category: 'Gear', cost: '2 gp', weight: '5 lb', desc: 'A backpack can hold 1 cubic foot or 30 pounds of gear.' },
  { name: 'Bedroll', category: 'Gear', cost: '1 gp', weight: '7 lb', desc: 'A simple bed roll for resting outdoors.' },
  { name: 'Crowbar', category: 'Gear', cost: '2 gp', weight: '5 lb', desc: 'Advantage on STR checks where leverage can be applied.' },
  { name: 'Healer\'s Kit', category: 'Gear', cost: '5 gp', weight: '3 lb', desc: '10 uses. Stabilize a creature at 0 HP without a Medicine check.' },
  { name: 'Holy Symbol', category: 'Gear', cost: '5 gp', weight: '1 lb', desc: 'Spellcasting focus for clerics and paladins.' },
  { name: 'Rope, Hempen (50 ft)', category: 'Gear', cost: '1 gp', weight: '10 lb', desc: 'Has 2 HP and can be burst with DC 17 STR check.' },
  { name: 'Tinderbox', category: 'Gear', cost: '5 sp', weight: '1 lb', desc: 'Light a torch or campfire. Takes 1 action (torch) or 1 minute (campfire).' },
  { name: 'Torch', category: 'Gear', cost: '1 cp', weight: '1 lb', desc: 'Bright light 20 ft, dim light 20 ft beyond. Burns 1 hour.' },
  { name: 'Waterskin', category: 'Gear', cost: '2 sp', weight: '5 lb', desc: 'Holds 4 pints of liquid.' },
  { name: 'Rations (1 day)', category: 'Gear', cost: '5 sp', weight: '2 lb', desc: 'Dry food suitable for extended travel.' },
  // Tools
  { name: 'Thieves\' Tools', category: 'Tool', cost: '25 gp', weight: '1 lb', desc: 'Required to pick locks or disarm traps. Proficiency adds to checks.' },
  { name: 'Herbalism Kit', category: 'Tool', cost: '5 gp', weight: '3 lb', desc: 'Required to create antitoxin and potions of healing.' },
  { name: 'Disguise Kit', category: 'Tool', cost: '25 gp', weight: '3 lb', desc: 'Required to create disguises. Proficiency adds to Deception when disguised.' },
  // Magic Items
  { name: 'Bag of Holding', category: 'Magic Item', cost: '—', weight: '15 lb', desc: 'Holds up to 500 lb or 64 cubic feet. Interior is larger than exterior.' },
  { name: 'Cloak of Protection', category: 'Magic Item', cost: '—', weight: '1 lb', desc: 'Requires attunement. +1 to AC and saving throws.' },
  { name: 'Ring of Protection', category: 'Magic Item', cost: '—', weight: '0 lb', desc: 'Requires attunement. +1 to AC and saving throws.' },
  { name: '+1 Weapon', category: 'Magic Item', cost: '—', weight: '—', desc: '+1 to attack and damage rolls.' },
  { name: '+2 Weapon', category: 'Magic Item', cost: '—', weight: '—', desc: '+2 to attack and damage rolls.' },
]

export const GEAR_CATEGORIES = ['Potion', 'Ammunition', 'Gear', 'Tool', 'Magic Item']
