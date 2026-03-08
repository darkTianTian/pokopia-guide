export const POKEMON_TYPES = [
  "normal",
  "fire",
  "water",
  "electric",
  "grass",
  "ice",
  "fighting",
  "poison",
  "ground",
  "flying",
  "psychic",
  "bug",
  "rock",
  "ghost",
  "dragon",
  "dark",
  "steel",
  "fairy",
] as const

export type PokemonType = (typeof POKEMON_TYPES)[number]

export interface HabitatEntry {
  id: number
  name: string
  rarity: "common" | "rare" | "very-rare"
  area?: string
  materials?: string
}

export interface PokopiaData {
  specialties: string[]
  favorites: string[]
  habitats: HabitatEntry[]
  timeOfDay: string[] | null
  weather: string[] | null
  obtainMethod: "habitat" | "story" | "dream-island" | "craft" | "quest" | "trade" | "event" | "unknown"
  evolvesFrom: string | null
  evolvesTo: string[] | null
}

export interface Pokemon {
  id: number
  slug: string
  name: string
  types: PokemonType[]
  image: string
  pokopia?: PokopiaData | null
}

export interface Guide {
  slug: string
  title: string
  description: string
  category: string
  date: string
  author: string
  content: string
}

export interface GameEvent {
  slug: string
  title: string
  description: string
  category: string
  date: string
  author: string
  startDate: string
  endDate: string
  content: string
}
