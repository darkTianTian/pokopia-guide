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

export interface PokemonStats {
  hp: number
  attack: number
  defense: number
  spAtk: number
  spDef: number
  speed: number
}

export interface Pokemon {
  id: number
  slug: string
  name: string
  types: PokemonType[]
  stats: PokemonStats
  abilities: string[]
  description: string
  image: string
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
