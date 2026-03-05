import fs from "fs/promises"
import path from "path"
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import dotenv from "dotenv"
import { POKOPIA_DEX, POKEAPI_NAME_MAP, SLUG_TO_POKOPIA_ID } from "./pokopia-dex.mjs"

dotenv.config()

// --- Config ---

const R2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET = process.env.R2_BUCKET
const PUBLIC_URL = process.env.R2_PUBLIC_URL

const POKEAPI_BASE = "https://pokeapi.co/api/v2"

// --- Helpers ---

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json()
}

async function fetchImageBuffer(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image ${url}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function r2ObjectExists(key) {
  try {
    await R2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}

async function uploadToR2(key, buffer, contentType) {
  await R2.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )
}

function getEnglishName(speciesData) {
  const entry = speciesData.names.find((n) => n.language.name === "en")
  return entry?.name ?? speciesData.name
}

function getJapaneseName(speciesData) {
  const entry = speciesData.names.find((n) => n.language.name === "ja")
  return entry?.name ?? speciesData.name
}

function getChineseName(speciesData) {
  const entry =
    speciesData.names.find((n) => n.language.name === "zh-hant") ??
    speciesData.names.find((n) => n.language.name === "zh-hans")
  return entry?.name ?? speciesData.name
}

function getFlavorText(speciesData, lang) {
  const entries = speciesData.flavor_text_entries.filter(
    (e) => e.language.name === lang
  )
  if (entries.length === 0) return ""
  return entries[entries.length - 1].flavor_text.replace(/\n|\f/g, " ")
}

function buildPokemonJson(pokemonData, speciesData, locale, pokopiaId, slug) {
  const nameGetters = {
    en: getEnglishName,
    zh: getChineseName,
    ja: getJapaneseName,
  }
  const langMap = { en: "en", zh: "zh-hant", ja: "ja" }

  const name = nameGetters[locale](speciesData)

  const types = pokemonData.types
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name)

  const stats = {
    hp: 0,
    attack: 0,
    defense: 0,
    spAtk: 0,
    spDef: 0,
    speed: 0,
  }
  const statKeyMap = {
    hp: "hp",
    attack: "attack",
    defense: "defense",
    "special-attack": "spAtk",
    "special-defense": "spDef",
    speed: "speed",
  }
  for (const s of pokemonData.stats) {
    const key = statKeyMap[s.stat.name]
    if (key) stats[key] = s.base_stat
  }

  const abilities = pokemonData.abilities
    .sort((a, b) => a.slot - b.slot)
    .map((a) => a.ability.name)

  const description = getFlavorText(speciesData, langMap[locale]) ||
    getFlavorText(speciesData, "en")

  const imageUrl = `${PUBLIC_URL}/pokemon/${slug}.png`

  return {
    id: pokopiaId,
    slug,
    name,
    types,
    stats,
    abilities,
    description,
    image: imageUrl,
  }
}

async function fetchAbilityName(abilityUrl, lang) {
  const data = await fetchJson(abilityUrl)
  const entry = data.names.find((n) => n.language.name === lang)
  return entry?.name ?? data.name
}

// --- Main ---

async function main() {
  const contentDir = path.join(process.cwd(), "content")

  for (const locale of ["en", "zh", "ja"]) {
    await fs.mkdir(path.join(contentDir, locale, "pokemon"), { recursive: true })
  }

  const entries = Object.entries(POKOPIA_DEX)
  const total = entries.length
  let processed = 0

  const abilityCache = new Map()

  for (const [pokopiaIdStr, slug] of entries) {
    const pokopiaId = parseInt(pokopiaIdStr)
    processed++

    // Skip if file already exists
    const existingPath = path.join(contentDir, "en", "pokemon", `${slug}.json`)
    try {
      await fs.access(existingPath)
      console.log(`[${processed}/${total}] Skipping #${pokopiaId} ${slug} (exists)`)
      continue
    } catch {
      // File doesn't exist, proceed
    }

    console.log(`[${processed}/${total}] Fetching #${pokopiaId} ${slug}...`)

    const apiName = POKEAPI_NAME_MAP[slug] || slug

    try {
      const [pokemonData, speciesData] = await Promise.all([
        fetchJson(`${POKEAPI_BASE}/pokemon/${apiName}`),
        fetchJson(`${POKEAPI_BASE}/pokemon-species/${apiName}`),
      ])

      // Upload image to R2
      const imageKey = `pokemon/${slug}.png`
      const imageExists = await r2ObjectExists(imageKey)

      if (!imageExists) {
        const homeImageUrl =
          pokemonData.sprites?.other?.home?.front_default ??
          pokemonData.sprites?.other?.["official-artwork"]?.front_default

        if (homeImageUrl) {
          console.log(`  Uploading image for ${slug}...`)
          const imageBuffer = await fetchImageBuffer(homeImageUrl)
          await uploadToR2(imageKey, imageBuffer, "image/png")
        } else {
          console.log(`  No image found for ${slug}`)
        }
      } else {
        console.log(`  Image already exists for ${slug}`)
      }

      const langMap = { en: "en", zh: "zh-hant", ja: "ja" }

      for (const locale of ["en", "zh", "ja"]) {
        const json = buildPokemonJson(pokemonData, speciesData, locale, pokopiaId, slug)

        // Translate abilities
        const translatedAbilities = []
        for (const ability of pokemonData.abilities.sort((a, b) => a.slot - b.slot)) {
          const cacheKey = `${ability.ability.name}:${langMap[locale]}`
          if (!abilityCache.has(cacheKey)) {
            const translated = await fetchAbilityName(
              ability.ability.url,
              langMap[locale]
            )
            abilityCache.set(cacheKey, translated)
          }
          translatedAbilities.push(abilityCache.get(cacheKey))
        }
        json.abilities = translatedAbilities

        const filePath = path.join(contentDir, locale, "pokemon", `${slug}.json`)
        await fs.writeFile(filePath, JSON.stringify(json, null, 2) + "\n")
      }

      console.log(`  Done: ${slug}`)
    } catch (err) {
      console.error(`  Error fetching ${slug}: ${err.message}`)
    }

    await sleep(200)
  }

  console.log(`\nFinished! Processed ${processed} Pokémon.`)
}

main()
