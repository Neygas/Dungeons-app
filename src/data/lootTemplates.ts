import type { LootItem, LootRarity } from '@/types'

export const RARITY_COLORS: Record<LootRarity, string> = {
  common: '#6b7280',
  uncommon: '#16a34a',
  rare: '#2563eb',
  very_rare: '#7c3aed',
  legendary: '#d97706',
}

export const RARITY_LABELS: Record<LootRarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  very_rare: 'Very Rare',
  legendary: 'Legendary',
}

export interface LootTemplate {
  id: string
  name: string
  rarity: LootRarity
  items: LootItem[]
}

function item(name: string, desc: string, rarity: LootRarity, id: string): LootItem {
  return { id, name, desc, quantity: 1, rarity }
}

export const PREMADE_LOOT_POOLS: LootTemplate[] = [
  {
    id: 'common',
    name: 'Common Spoils',
    rarity: 'common',
    items: [
      item('Potion of Healing', 'Regain 2d4+2 HP.', 'common', 'pre-c-1'),
      item('Tinderbox', 'Light a fire in 1 action (torch) or 1 minute (campfire).', 'common', 'pre-c-2'),
      item('Rope, Hempen (50 ft)', '2 HP. Burst with DC 17 STR check.', 'common', 'pre-c-3'),
      item('Healer\'s Kit', '10 uses. Stabilize a creature at 0 HP.', 'common', 'pre-c-4'),
      item('Torch (5)', 'Bright light 20 ft, dim light 20 ft more. Burns 1 hour.', 'common', 'pre-c-5'),
      item('Rations (7 days)', 'Trail mix and jerky to keep you going.', 'common', 'pre-c-6'),
    ],
  },
  {
    id: 'uncommon',
    name: 'Uncommon Treasures',
    rarity: 'uncommon',
    items: [
      item('Potion of Greater Healing', 'Regain 4d4+4 HP.', 'uncommon', 'pre-u-1'),
      item('Bag of Holding', 'A bag with an interior space considerably larger than its outside dimensions.', 'uncommon', 'pre-u-2'),
      item('Cloak of Elvenkind', 'While hooded, advantage on Stealth checks. Observers have disadvantage on Perception checks.', 'uncommon', 'pre-u-3'),
      item('Boots of Elvenkind', 'Your movement makes no sound, regardless of surface. Advantage on Stealth checks.', 'uncommon', 'pre-u-4'),
      item('Gloves of Thievery', '+5 to Sleight of Hand checks and Thieves\' Tools checks.', 'uncommon', 'pre-u-5'),
      item('+1 Weapon', 'A magic weapon granting +1 bonus to attack and damage rolls.', 'uncommon', 'pre-u-6'),
    ],
  },
  {
    id: 'rare',
    name: 'Rare Relics',
    rarity: 'rare',
    items: [
      item('Potion of Superior Healing', 'Regain 8d4+8 HP.', 'rare', 'pre-r-1'),
      item('Belt of Hill Giant Strength', 'Your STR score becomes 21 while attuned.', 'rare', 'pre-r-2'),
      item('Headband of Intellect', 'Your INT score becomes 19 while attuned.', 'rare', 'pre-r-3'),
      item('Ring of Protection', '+1 bonus to AC and saving throws while attuned.', 'rare', 'pre-r-4'),
      item('Necklace of Adaptation', 'You can breathe in any environment and have advantage on saves against harmful gases.', 'rare', 'pre-r-5'),
      item('+2 Weapon', 'A magic weapon granting +2 bonus to attack and damage rolls.', 'rare', 'pre-r-6'),
    ],
  },
  {
    id: 'very_rare',
    name: 'Very Rare Wonders',
    rarity: 'very_rare',
    items: [
      item('Potion of Supreme Healing', 'Regain 10d4+20 HP.', 'very_rare', 'pre-vr-1'),
      item('Cloak of Invisibility', 'While wearing this cloak with its hood up, you are invisible.', 'very_rare', 'pre-vr-2'),
      item('Manual of Bodily Health', 'Read over 6 days. Your CON score and max increase by 2. The book loses magic for 100 years.', 'very_rare', 'pre-vr-3'),
      item('Ring of Regeneration', 'You regain 1d6 HP every 10 minutes while attuned, provided you have at least 1 HP.', 'very_rare', 'pre-vr-4'),
      item('+3 Weapon', 'A legendary magic weapon granting +3 bonus to attack and damage rolls.', 'very_rare', 'pre-vr-5'),
    ],
  },
  {
    id: 'legendary',
    name: 'Legendary Artifacts',
    rarity: 'legendary',
    items: [
      item('Vorpal Sword', 'Ignores resistance to slashing damage. On a natural 20, decapitates the target if it has a head.', 'legendary', 'pre-l-1'),
      item('Holy Avenger', '+3 sword. While attuned, deal 2d10 extra radiant vs undead/fiends. Aura grants 5-ft magic resistance to allies.', 'legendary', 'pre-l-2'),
      item('Staff of the Magi', '50 charges. Casts powerful spells including Fireball (×5), Lightning Bolt (×5), and more.', 'legendary', 'pre-l-3'),
      item('Luck Blade', '+1 sword with up to 3 luck charges. Use a charge to reroll any attack, ability check, or save.', 'legendary', 'pre-l-4'),
    ],
  },
]
