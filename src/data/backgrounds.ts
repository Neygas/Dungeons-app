export interface BackgroundFeature {
  name: string
  desc: string
}

export interface Background {
  skills: string[]
  feature: string
  featureDetail?: BackgroundFeature
}

export const BACKGROUNDS: Record<string, Background> = {
  Acolyte: { skills: ['Insight', 'Religion'], feature: 'Shelter of the Faithful', featureDetail: { name: 'Shelter of the Faithful', desc: 'Free healing and care at temples of your faith. Can request assistance from priests.' } },
  Criminal: { skills: ['Deception', 'Stealth'], feature: 'Criminal Contact', featureDetail: { name: 'Criminal Contact', desc: 'A reliable contact acting as liaison to a criminal network. Can send and receive messages.' } },
  'Folk Hero': { skills: ['Animal Handling', 'Survival'], feature: 'Rustic Hospitality', featureDetail: { name: 'Rustic Hospitality', desc: 'Fit in among common folk. Find places to hide, rest, or recuperate among commoners.' } },
  Noble: { skills: ['History', 'Persuasion'], feature: 'Position of Privilege', featureDetail: { name: 'Position of Privilege', desc: 'Welcome in high society. People assume you have the right to be wherever you are.' } },
  Sage: { skills: ['Arcana', 'History'], feature: 'Researcher', featureDetail: { name: 'Researcher', desc: 'If you do not know a piece of lore, you know where and from whom you can find it.' } },
  Soldier: { skills: ['Athletics', 'Intimidation'], feature: 'Military Rank', featureDetail: { name: 'Military Rank', desc: 'Soldiers of your former organization recognize your rank and may defer to you.' } },
  Outlander: { skills: ['Athletics', 'Survival'], feature: 'Wanderer', featureDetail: { name: 'Wanderer', desc: 'Excellent memory for maps and geography. Can always recall terrain and settlements around you.' } },
  Entertainer: { skills: ['Acrobatics', 'Performance'], feature: 'By Popular Demand', featureDetail: { name: 'By Popular Demand', desc: 'Always find a place to perform. Receive free lodging and food while performing each night.' } },
  Hermit: { skills: ['Medicine', 'Religion'], feature: 'Discovery', featureDetail: { name: 'Discovery', desc: 'Your seclusion gave you access to a unique discovery. Work with your DM on what it is.' } },
  Sailor: { skills: ['Athletics', 'Perception'], feature: "Ship's Passage", featureDetail: { name: "Ship's Passage", desc: 'Secure free passage on sailing ships for yourself and companions.' } },
}

export const BACKGROUND_NAMES = Object.keys(BACKGROUNDS)

export const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
]
