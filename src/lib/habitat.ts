import { getAllPokemon } from "./pokemon"
import type { Pokemon } from "./types"
import type { Locale } from "@/i18n/config"
import habitatMappingJa from "@/../content/habitat-mapping.json"
import habitatMappingEn from "@/../content/habitat-mapping-en.json"
import habitatMappingZh from "@/../content/habitat-mapping-zh.json"

export interface HabitatWithPokemon {
  id: number
  name: string
  image: string
  pokemon: {
    pokemon: Pokemon
    rarity: "common" | "rare" | "very-rare"
  }[]
}

const HABITAT_NAMES_BY_LOCALE: Record<Locale, Record<string, string>> = {
  ja: habitatMappingJa,
  en: habitatMappingEn,
  zh: habitatMappingZh,
}

export async function getAllHabitatsWithPokemon(
  locale: Locale
): Promise<HabitatWithPokemon[]> {
  const allPokemon = await getAllPokemon(locale)
  const habitatMap = new Map<number, HabitatWithPokemon>()

  for (const pokemon of allPokemon) {
    if (!pokemon.pokopia?.habitats) continue

    for (const habitat of pokemon.pokopia.habitats) {
      const existing = habitatMap.get(habitat.id)
      if (existing) {
        existing.pokemon.push({ pokemon, rarity: habitat.rarity })
      } else {
        const habitatNames = HABITAT_NAMES_BY_LOCALE[locale]
        habitatMap.set(habitat.id, {
          id: habitat.id,
          name: habitatNames[String(habitat.id)] ?? habitat.name,
          image: `/images/habitats/habitat_${habitat.id}.png`,
          pokemon: [{ pokemon, rarity: habitat.rarity }],
        })
      }
    }
  }

  return Array.from(habitatMap.values()).sort((a, b) => a.id - b.id)
}

export async function getHabitatWithPokemon(
  id: number,
  locale: Locale
): Promise<HabitatWithPokemon | undefined> {
  const habitats = await getAllHabitatsWithPokemon(locale)
  return habitats.find((h) => h.id === id)
}

export function getAllHabitatIds(): number[] {
  const allIds = new Set<string>()
  for (const mapping of Object.values(HABITAT_NAMES_BY_LOCALE)) {
    for (const id of Object.keys(mapping)) {
      allIds.add(id)
    }
  }
  return Array.from(allIds).map(Number).sort((a, b) => a - b)
}
