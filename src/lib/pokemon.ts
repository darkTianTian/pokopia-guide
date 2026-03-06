import fs from "fs/promises"
import path from "path"
import type { Pokemon, PokemonType } from "./types"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"
import _habitatMaterialsJa from "@/../content/habitat-materials.json"
import _habitatMaterialsEn from "@/../content/habitat-materials-en.json"
import _habitatMaterialsZh from "@/../content/habitat-materials-zh.json"

const habitatMaterialsJa = _habitatMaterialsJa as Record<string, string>
const habitatMaterialsEn = _habitatMaterialsEn as Record<string, string>
const habitatMaterialsZh = _habitatMaterialsZh as Record<string, string>

const MATERIALS_BY_LOCALE: Record<Locale, Record<string, string>> = {
  ja: habitatMaterialsJa,
  en: habitatMaterialsEn,
  zh: habitatMaterialsZh,
}

function getPokemonDir(locale: Locale): string {
  return path.join(process.cwd(), `content/${locale}/pokemon`)
}

function enrichMaterials(pokemon: Pokemon, locale: Locale): Pokemon {
  if (!pokemon.pokopia?.habitats?.length) return pokemon
  const materialsMap = MATERIALS_BY_LOCALE[locale]
  const enrichedHabitats = pokemon.pokopia.habitats.map((h) => {
    const idStr = String(h.id)
    const materials = materialsMap[idStr] || habitatMaterialsJa[idStr] || ""
    return materials ? { ...h, materials } : h
  })
  return {
    ...pokemon,
    pokopia: { ...pokemon.pokopia, habitats: enrichedHabitats },
  }
}

export async function getAllPokemon(
  locale: Locale = DEFAULT_LOCALE
): Promise<Pokemon[]> {
  const dir = getPokemonDir(locale)
  const files = await fs.readdir(dir)
  const jsonFiles = files.filter((f) => f.endsWith(".json"))

  const pokemon = await Promise.all(
    jsonFiles.map(async (file) => {
      const raw = await fs.readFile(path.join(dir, file), "utf-8")
      return enrichMaterials(JSON.parse(raw) as Pokemon, locale)
    })
  )

  return pokemon.sort((a, b) => a.id - b.id)
}

export async function getPokemonByType(
  type: PokemonType,
  locale: Locale = DEFAULT_LOCALE
): Promise<Pokemon[]> {
  const all = await getAllPokemon(locale)
  return all.filter((p) => p.types.includes(type))
}

export async function getPokemonBySpecialty(
  specialty: string,
  locale: Locale = DEFAULT_LOCALE
): Promise<Pokemon[]> {
  const all = await getAllPokemon(locale)
  return all.filter((p) => p.pokopia?.specialties?.includes(specialty))
}

export function getAllSpecialties(pokemon: Pokemon[]): string[] {
  const set = new Set<string>()
  for (const p of pokemon) {
    if (p.pokopia?.specialties) {
      for (const s of p.pokopia.specialties) {
        set.add(s)
      }
    }
  }
  return Array.from(set).sort()
}

export async function getPokemonBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE
): Promise<Pokemon | undefined> {
  const filePath = path.join(getPokemonDir(locale), `${slug}.json`)
  try {
    const raw = await fs.readFile(filePath, "utf-8")
    return enrichMaterials(JSON.parse(raw) as Pokemon, locale)
  } catch {
    return undefined
  }
}
