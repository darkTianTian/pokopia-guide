import fs from "fs/promises"
import path from "path"
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import dotenv from "dotenv"

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

// 96 confirmed Pokopia Pokémon (by national dex ID)
const POKOPIA_DEX_IDS = [
  1, 4, 6, 7, 8, 16, 18, 25, 35, 37,
  39, 43, 46, 48, 50, 52, 54, 58, 59, 60,
  63, 65, 66, 69, 74, 79, 83, 103, 104, 106,
  107, 113, 123, 127, 129, 131, 133, 134, 136, 147,
  148, 149, 163, 167, 172, 179, 180, 182, 183, 185,
  194, 196, 197, 214, 236, 246, 248, 255, 270, 272,
  278, 282, 296, 298, 303, 316, 351, 393, 415, 416,
  422, 425, 439, 440, 447, 448, 470, 471, 529, 530,
  532, 569, 570, 572, 573, 607, 612, 658, 700, 704,
  706, 821, 884, 921, 952, 978,
]

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
  // Pick the last entry (usually most recent game)
  return entries[entries.length - 1].flavor_text.replace(/\n|\f/g, " ")
}

function buildPokemonJson(pokemonData, speciesData, locale) {
  const langMap = { en: "en", zh: "zh-hant", ja: "ja" }
  const nameGetters = {
    en: getEnglishName,
    zh: getChineseName,
    ja: getJapaneseName,
  }

  const name = nameGetters[locale](speciesData)
  const slug = speciesData.name // e.g. "pikachu"

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

  // Get ability names in the target language (fetched separately)
  const abilities = pokemonData.abilities
    .sort((a, b) => a.slot - b.slot)
    .map((a) => a.ability.name)

  const description = getFlavorText(speciesData, langMap[locale]) ||
    getFlavorText(speciesData, "en")

  const imageUrl = `${PUBLIC_URL}/pokemon/${slug}.png`

  return {
    id: pokemonData.id,
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

  const total = POKOPIA_DEX_IDS.length
  let processed = 0

  // Cache ability translations to avoid redundant API calls
  const abilityCache = new Map()

  for (const dexId of POKOPIA_DEX_IDS) {
    processed++
    console.log(`[${processed}/${total}] Fetching #${dexId}...`)

    try {
      const [pokemonData, speciesData] = await Promise.all([
        fetchJson(`${POKEAPI_BASE}/pokemon/${dexId}`),
        fetchJson(`${POKEAPI_BASE}/pokemon-species/${dexId}`),
      ])

      const slug = speciesData.name

      // Upload image to R2 (HOME style)
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

      // Fetch translated ability names
      const langMap = { en: "en", zh: "zh-hant", ja: "ja" }

      for (const locale of ["en", "zh", "ja"]) {
        const json = buildPokemonJson(pokemonData, speciesData, locale)

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

        const filePath = path.join(
          contentDir,
          locale,
          "pokemon",
          `${slug}.json`
        )
        await fs.writeFile(filePath, JSON.stringify(json, null, 2) + "\n")
      }

      console.log(`  Done: ${slug}`)
    } catch (err) {
      console.error(`  Error fetching #${dexId}: ${err.message}`)
    }

    // Rate limit: ~1 request per 200ms to be polite to PokeAPI
    await sleep(200)
  }

  console.log(`\nFinished! Processed ${processed} Pokémon.`)
}

main()
