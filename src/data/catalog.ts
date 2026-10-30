export type ElementId = 'ember' | 'tide' | 'terra' | 'gale' | 'lumen' | 'umbra'
export type HeadKind = 'dragon' | 'serpent' | 'beetle' | 'bird' | 'knight' | 'wolf'
export type WingKind = 'bat' | 'fin' | 'insect' | 'feather' | 'crystal' | 'spikes'
export type TailKind = 'spiked' | 'long' | 'none' | 'fan' | 'bushy'
export type Finish = 'gloss' | 'satin' | 'chrome' | 'prism'
export type EditionId = 'core' | 'armor' | 'chrome' | 'prism'
export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary'

export interface Palette {
  shell: string
  inner: string
  trim: string
  glow: string
  membrane: string
}

export interface Creature {
  id: string
  index: string
  name: string
  element: ElementId
  rarity: Rarity
  tagline: string
  description: string
  power: number
  stats: { attack: number; defense: number; speed: number }
  basePrice: number
  palette: Palette
  head: HeadKind
  wings: WingKind
  tail: TailKind
  spread: number
  sweep: number
}

export interface ElementInfo {
  id: ElementId
  name: string
  color: string
  traits: string[]
}

export interface Edition {
  id: EditionId
  name: string
  finish: Finish
  delta: number
  note: string
}

export interface Pack {
  id: string
  index: string
  name: string
  price: number
  compareAt?: number
  highlight?: boolean
  items: string[]
  blurb: string
}

export const ELEMENTS: ElementInfo[] = [
  { id: 'ember', name: 'Ember', color: '#fd321c', traits: ['Heat-core gem', 'Aggressive opener', '+60G vs Gale', 'Gloss red shell', 'Burn ability set'] },
  { id: 'tide', name: 'Tide', color: '#1e9bff', traits: ['Pressure-core gem', 'Counter specialist', '+60G vs Ember', 'Deep blue shell', 'Surge ability set'] },
  { id: 'terra', name: 'Terra', color: '#d08a2c', traits: ['Bedrock gem', 'Heavy defender', '+60G vs Tide', 'Amber armor plates', 'Quake ability set'] },
  { id: 'gale', name: 'Gale', color: '#22e39a', traits: ['Cyclone gem', 'Fastest opener', '+60G vs Terra', 'Jade glass shell', 'Draft ability set'] },
  { id: 'lumen', name: 'Lumen', color: '#ffd84a', traits: ['Solar gem', 'Support & shields', '+60G vs Umbra', 'Pearl gold shell', 'Flare ability set'] },
  { id: 'umbra', name: 'Umbra', color: '#9b5cff', traits: ['Void gem', 'Ambush tactics', '+60G vs Lumen', 'Obsidian shell', 'Eclipse ability set'] },
]

export const elementById = (id: ElementId) => ELEMENTS.find((e) => e.id === id)!

export const CREATURES: Creature[] = [
  {
    id: 'vyrakh',
    index: '01',
    name: 'Vyrakh',
    element: 'ember',
    rarity: 'Legendary',
    tagline: 'Molten-wing dragon',
    description: 'A heat-forged dragon whose crest plates unfold into bat wings. Spring-loaded hinge pops it open the moment it lands on a gate card.',
    power: 650,
    stats: { attack: 92, defense: 64, speed: 78 },
    basePrice: 21.99,
    palette: { shell: '#e8321a', inner: '#2a0d08', trim: '#ffb23d', glow: '#ff6a1a', membrane: '#ff4a1c' },
    head: 'dragon',
    wings: 'bat',
    tail: 'spiked',
    spread: 1.05,
    sweep: 0.45,
  },
  {
    id: 'marethos',
    index: '02',
    name: 'Marethos',
    element: 'tide',
    rarity: 'Epic',
    tagline: 'Abyssal sea serpent',
    description: 'A coiled serpent that hides a long tail and razor fins inside a pressure-sealed shell. Counters every Ember opener.',
    power: 580,
    stats: { attack: 74, defense: 70, speed: 84 },
    basePrice: 18.99,
    palette: { shell: '#1572e8', inner: '#06162b', trim: '#9fe3ff', glow: '#2fd0ff', membrane: '#3aa6ff' },
    head: 'serpent',
    wings: 'fin',
    tail: 'long',
    spread: 0.85,
    sweep: 0.6,
  },
  {
    id: 'korragh',
    index: '03',
    name: 'Korragh',
    element: 'terra',
    rarity: 'Rare',
    tagline: 'Bedrock horn-beetle',
    description: 'Armor-plated beetle with a forged horn and glass flight wings under its elytra. The heaviest sphere in the roster.',
    power: 610,
    stats: { attack: 80, defense: 95, speed: 42 },
    basePrice: 17.49,
    palette: { shell: '#b8741f', inner: '#1f1406', trim: '#f0c27a', glow: '#ffb340', membrane: '#ffe2a8' },
    head: 'beetle',
    wings: 'insect',
    tail: 'none',
    spread: 1.25,
    sweep: 0.25,
  },
  {
    id: 'zephryn',
    index: '04',
    name: 'Zephryn',
    element: 'gale',
    rarity: 'Rare',
    tagline: 'Storm-feather raptor',
    description: 'A raptor built for speed. Six blade feathers fan out of each crest and the tail splits into a rudder for sharp turns.',
    power: 540,
    stats: { attack: 70, defense: 52, speed: 98 },
    basePrice: 16.99,
    palette: { shell: '#17b97a', inner: '#04150e', trim: '#d9fff0', glow: '#3dffb0', membrane: '#7dffcb' },
    head: 'bird',
    wings: 'feather',
    tail: 'fan',
    spread: 0.95,
    sweep: 0.35,
  },
  {
    id: 'solvane',
    index: '05',
    name: 'Solvane',
    element: 'lumen',
    rarity: 'Epic',
    tagline: 'Halo-crowned sentinel',
    description: 'A knight of light with a glowing visor, a rotating halo and crystal shard wings that refract every studio light.',
    power: 600,
    stats: { attack: 68, defense: 88, speed: 66 },
    basePrice: 19.49,
    palette: { shell: '#f3e7c4', inner: '#2a2210', trim: '#ffcc33', glow: '#ffe066', membrane: '#fff1b0' },
    head: 'knight',
    wings: 'crystal',
    tail: 'none',
    spread: 1.1,
    sweep: 0.3,
  },
  {
    id: 'noctyr',
    index: '06',
    name: 'Noctyr',
    element: 'umbra',
    rarity: 'Legendary',
    tagline: 'Eclipse shadow-wolf',
    description: 'A shadow wolf with a spiked mane and obsidian shoulder plates. Its violet core pulses faster the closer it gets to a fight.',
    power: 640,
    stats: { attack: 90, defense: 60, speed: 88 },
    basePrice: 20.99,
    palette: { shell: '#2a1f3d', inner: '#0b0614', trim: '#c9a6ff', glow: '#a066ff', membrane: '#7c4dff' },
    head: 'wolf',
    wings: 'spikes',
    tail: 'bushy',
    spread: 0.55,
    sweep: 0.2,
  },
]

export const creatureById = (id: string) => CREATURES.find((c) => c.id === id) ?? CREATURES[0]

export const EDITIONS: Edition[] = [
  { id: 'core', name: 'Core', finish: 'gloss', delta: 0, note: 'High-gloss clearcoat shell' },
  { id: 'armor', name: 'Armor', finish: 'satin', delta: 9, note: 'Satin metal plating, steel trims' },
  { id: 'chrome', name: 'Chrome', finish: 'chrome', delta: 22, note: 'Iridescent mirror chrome' },
  { id: 'prism', name: 'Prism', finish: 'prism', delta: 44, note: 'Clear crystal shell, visible core — limited run' },
]

export const editionById = (id: EditionId) => EDITIONS.find((e) => e.id === id)!

export const priceOf = (creature: Creature, edition: EditionId) =>
  Math.round((creature.basePrice + editionById(edition).delta) * 100) / 100

export const PACKS: Pack[] = [
  {
    id: 'starter',
    index: '01',
    name: 'Starter Spark',
    price: 24,
    items: ['1 battle sphere · Core', '3 ability cards', '1 gate card', 'Rulebook'],
    blurb: 'Everything a first-time brawler needs to roll into a match tonight.',
  },
  {
    id: 'arsenal',
    index: '02',
    name: 'Brawler Arsenal',
    price: 64,
    compareAt: 79,
    highlight: true,
    items: ['3 battle spheres · Armor', '9 ability cards', '3 gate cards', 'Fold-out arena mat'],
    blurb: 'Our most picked bundle. A full tournament team with satin metal plating.',
  },
  {
    id: 'vault',
    index: '03',
    name: 'Collector Vault',
    price: 189,
    compareAt: 236,
    items: ['All 6 spheres · Chrome', 'LED display case', 'Numbered certificate', 'Free express shipping'],
    blurb: 'The complete roster in iridescent chrome, presented in a lit display case.',
  },
  {
    id: 'legends',
    index: '04',
    name: 'Prism Legends',
    price: 349,
    items: ['6 spheres · Prism crystal', 'Signed artist print', 'Early drop access', 'Lifetime hinge warranty'],
    blurb: 'Limited to 500 sets. Clear crystal shells with the glowing core on show.',
  },
]

export const packById = (id: string) => PACKS.find((p) => p.id === id)!

export const TESTIMONIALS = [
  { quote: 'Being able to crack the sphere open in 3D before ordering sold me. The Chrome Vyrakh looks exactly like it does on screen — maybe better.', name: 'Mila Kovalenko', role: 'Collector, Lviv' },
  { quote: 'We run weekly tournaments and the Arsenal pack is our go-to for new players. Hinges are tight, the springs pop every single time.', name: 'Jonas Weber', role: 'Tournament host, Berlin' },
  { quote: 'My kids spend more time spinning the models on the site than playing other games. Then they argue about which edition to save for.', name: 'Aiko Tanaka', role: 'Parent of two brawlers' },
  { quote: 'The Prism edition is unreal. You can actually see the gyro core glowing through the crystal shell. Best display piece on my shelf.', name: 'Marcus Hill', role: 'Toy reviewer' },
  { quote: 'Compared editions side by side with the lighting presets and picked Armor for the matte finish. Arrived in two days.', name: 'Sofia Bondarenko', role: 'Collector, Kyiv' },
  { quote: 'Fast site, zero lag even on my phone, and the exploded view shows every hinge. This is how toy shops should work.', name: 'Daniel Okafor', role: 'Product designer' },
]

export const DROPS = [
  { season: 'S01 · Ember Rising', status: 'Live now', lines: ['Vyrakh, Korragh, Zephryn', 'Core + Armor editions', 'Free gate card with every order'] },
  { season: 'S02 · Tide War', status: 'Dec 12, 2026', lines: ['Marethos Chrome variant', 'Two-player arena mat', 'Pre-order opens Nov 28'] },
  { season: 'S03 · Prism Protocol', status: 'Feb 20, 2027', lines: ['Prism crystal shells for all six', 'Numbered to 500', 'Drop-list members get 24h early access'] },
  { season: 'S04 · Umbra Eclipse', status: 'Apr 2027', lines: ['Noctyr Alpha + 2 new spheres', 'Glow-in-the-dark seams', 'Story campaign cards'] },
]
