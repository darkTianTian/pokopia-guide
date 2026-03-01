import fs from "fs/promises"
import path from "path"
import type { Pokemon } from "./types"

const POKEMON_DIR = path.join(process.cwd(), "content/pokemon")

export async function getAllPokemon(): Promise<Pokemon[]> {
  const files = await fs.readdir(POKEMON_DIR)
  const jsonFiles = files.filter((f) => f.endsWith(".json"))

  const pokemon = await Promise.all(
    jsonFiles.map(async (file) => {
      const raw = await fs.readFile(path.join(POKEMON_DIR, file), "utf-8")
      return JSON.parse(raw) as Pokemon
    })
  )

  return pokemon.sort((a, b) => a.id - b.id)
}

export async function getPokemonBySlug(
  slug: string
): Promise<Pokemon | undefined> {
  const filePath = path.join(POKEMON_DIR, `${slug}.json`)
  try {
    const raw = await fs.readFile(filePath, "utf-8")
    return JSON.parse(raw) as Pokemon
  } catch {
    return undefined
  }
}
