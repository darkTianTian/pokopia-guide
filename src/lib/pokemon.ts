import fs from "fs/promises"
import path from "path"
import type { Pokemon } from "./types"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"

function getPokemonDir(locale: Locale): string {
  return path.join(process.cwd(), `content/${locale}/pokemon`)
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
      return JSON.parse(raw) as Pokemon
    })
  )

  return pokemon.sort((a, b) => a.id - b.id)
}

export async function getPokemonBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE
): Promise<Pokemon | undefined> {
  const filePath = path.join(getPokemonDir(locale), `${slug}.json`)
  try {
    const raw = await fs.readFile(filePath, "utf-8")
    return JSON.parse(raw) as Pokemon
  } catch {
    return undefined
  }
}
