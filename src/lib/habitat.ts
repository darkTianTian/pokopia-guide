import { getAllPokemon } from "./pokemon"
import type { Pokemon } from "./types"
import type { Locale } from "@/i18n/config"
import habitatMappingJa from "@/../content/habitat-mapping.json"
import habitatMappingEn from "@/../content/habitat-mapping-en.json"
import habitatMappingZh from "@/../content/habitat-mapping-zh.json"
import _habitatMaterialsJa from "@/../content/habitat-materials.json"
import _habitatMaterialsEn from "@/../content/habitat-materials-en.json"
import _habitatMaterialsZh from "@/../content/habitat-materials-zh.json"

const habitatMaterialsJa = _habitatMaterialsJa as Record<string, string>
const habitatMaterialsEn = _habitatMaterialsEn as Record<string, string>
const habitatMaterialsZh = _habitatMaterialsZh as Record<string, string>

export interface HabitatWithPokemon {
  id: number
  slug: string
  name: string
  image: string
  materials: string
  materialsEn: string | null
  pokemon: {
    pokemon: Pokemon
    rarity: "common" | "rare" | "very-rare"
  }[]
}

export { toHabitatSlug } from "./habitat-slug"
import { toHabitatSlug } from "./habitat-slug"

const HABITAT_NAMES_BY_LOCALE: Record<Locale, Record<string, string>> = {
  ja: habitatMappingJa,
  en: habitatMappingEn,
  zh: habitatMappingZh,
}

const HABITAT_MATERIALS_BY_LOCALE: Record<Locale, Record<string, string>> = {
  ja: habitatMaterialsJa,
  en: habitatMaterialsEn,
  zh: habitatMaterialsZh,
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
        const materialsMap = HABITAT_MATERIALS_BY_LOCALE[locale]
        const idStr = String(habitat.id)
        // For materials: use locale-specific, fallback to JA
        const materials = materialsMap[idStr] || habitatMaterialsEn[idStr] || habitatMaterialsJa[idStr] || ""
        habitatMap.set(habitat.id, {
          id: habitat.id,
          slug: toHabitatSlug(habitat.id),
          name: habitatNames[idStr] ?? (habitatMappingEn as Record<string, string>)[idStr] ?? habitat.name,
          image: `/images/habitats/habitat_${habitat.id}.png`,
          materials,
          materialsEn: habitatMaterialsEn[idStr] || null,
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

export async function getHabitatBySlug(
  slug: string,
  locale: Locale
): Promise<HabitatWithPokemon | undefined> {
  const habitats = await getAllHabitatsWithPokemon(locale)
  // Try slug match first, then numeric ID fallback
  const bySlug = habitats.find((h) => h.slug === slug)
  if (bySlug) return bySlug
  const asNum = Number(slug)
  if (!Number.isNaN(asNum)) return habitats.find((h) => h.id === asNum)
  return undefined
}

export function getAllHabitatSlugs(): string[] {
  const allIds = new Set<string>()
  for (const mapping of Object.values(HABITAT_NAMES_BY_LOCALE)) {
    for (const id of Object.keys(mapping)) {
      allIds.add(id)
    }
  }
  return Array.from(allIds)
    .map(Number)
    .sort((a, b) => a - b)
    .map((id) => toHabitatSlug(id))
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
