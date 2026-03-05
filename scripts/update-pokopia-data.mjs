import fs from "fs/promises"
import path from "path"
import * as cheerio from "cheerio"
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import dotenv from "dotenv"

dotenv.config()

// --- R2 Config ---

const R2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})
const BUCKET = process.env.R2_BUCKET
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://assets.pokopiaguide.com"

// --- Config ---

const SEREBII_BASE = "https://serebii.net"
const SEREBII_LIST_URL = `${SEREBII_BASE}/pokemonpokopia/availablepokemon.shtml`
const GAME8_URL = "https://game8.co/games/Pokemon-Pokopia/archives/578286"
const CONTENT_DIR = path.join(process.cwd(), "content")
const SYNC_STATE_PATH = path.join(CONTENT_DIR, "pokopia-sync-state.json")

const LOCALES = ["en", "zh", "ja"]

// Map Serebii time/weather labels to our internal keys
const TIME_MAP = {
  morning: "dawn",
  day: "day",
  evening: "dusk",
  night: "night",
}

const WEATHER_MAP = {
  sun: "sunny",
  cloud: "cloudy",
  rain: "rainy",
  snow: "snowy",
}

// Map Serebii rarity to our internal values
const RARITY_MAP = {
  common: "common",
  uncommon: "rare",
  rare: "rare",
  "very rare": "very-rare",
}

// Known valid specialties in the game
const VALID_SPECIALTIES = new Set([
  "grow", "burn", "water", "fly", "search", "chop", "build", "crush",
  "bulldoze", "trade", "generate", "explode", "hype", "gather", "paint",
  "eat", "teleport", "illuminate", "transform", "recycle", "appraise",
  "litter", "sing", "cool", "spark", "psychic", "dig", "cut", "swim",
])

// --- CLI args ---

const args = process.argv.slice(2)
const FORCE = args.includes("--force")
const WATCH = args.includes("--watch")
const DRY_RUN = args.includes("--dry-run")
const UPLOAD_IMAGES_ONLY = args.includes("--upload-images")
const intervalArg = args.find((a) => a.startsWith("--interval"))
const INTERVAL_MIN = intervalArg ? parseInt(intervalArg.split("=")[1] || args[args.indexOf("--interval") + 1] || "30", 10) : 30

// --- R2 Helpers ---

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

async function uploadPokemonImage(slug, pokemonId) {
  const imageKey = `pokemon/${slug}.png`
  const exists = await r2ObjectExists(imageKey)
  if (exists) return true

  // Try HOME sprite first, then official artwork
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`
  const fallbackUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`

  for (const url of [spriteUrl, fallbackUrl]) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const buffer = Buffer.from(await res.arrayBuffer())
      await uploadToR2(imageKey, buffer, "image/png")
      console.log(`  Uploaded image: ${slug}.png`)
      return true
    } catch {
      continue
    }
  }

  console.log(`  No image found for ${slug}`)
  return false
}

// --- Helpers ---

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PokopiaGuideBot/1.0)",
    },
  })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.text()
}

async function loadJson(filePath) {
  try {
    const text = await fs.readFile(filePath, "utf-8")
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + "\n")
}

async function loadSyncState() {
  return (await loadJson(SYNC_STATE_PATH)) || {
    lastSync: null,
    newHabitats: [],
    errors: [],
    stats: {},
  }
}

async function saveSyncState(state) {
  await writeJson(SYNC_STATE_PATH, state)
}

function normalizeSlug(name) {
  return name
    .toLowerCase()
    .replace(/[''\u2019]/g, "")
    .replace(/\. /g, "-")
    .replace(/ /g, "-")
    .replace(/[^a-z0-9-]/g, "")
}

function serebiiNameToSlug(name) {
  // Serebii uses display names like "Farfetch'd", "Mr. Mime", "Mime Jr."
  const specialMappings = {
    "farfetch'd": "farfetchd",
    "mr. mime": "mr-mime",
    "mime jr.": "mime-jr",
  }
  const lower = name.toLowerCase()
  if (specialMappings[lower]) return specialMappings[lower]
  return normalizeSlug(name)
}

function isPokopiaDataComplete(pokemon) {
  if (!pokemon.pokopia) return false
  const p = pokemon.pokopia
  return (
    Array.isArray(p.specialties) &&
    p.specialties.length > 0 &&
    Array.isArray(p.habitats) &&
    p.habitats.length > 0
  )
}

// --- Serebii List Page Scraper ---

async function scrapeSerebiiList() {
  console.log("Fetching Serebii list page...")
  const html = await fetchHtml(SEREBII_LIST_URL)
  const $ = cheerio.load(html)

  const results = []

  // The main table uses class="tab" and has rows with: #, Pic, Name, Specialty
  $("table.tab tr").each((_i, row) => {
    const cells = $(row).find("td.cen")
    if (cells.length < 3) return

    // First cell is #, second is image, third is name, fourth is specialty
    const numberText = $(cells[0]).text().trim()
    if (!numberText.startsWith("#")) return

    const dexNumber = parseInt(numberText.replace("#", ""), 10)
    if (isNaN(dexNumber)) return

    // Name cell - get the link text
    const nameLink = $(cells[2]).find("a")
    const name = nameLink.text().trim()
    if (!name) return

    // Detail page URL
    const detailHref = nameLink.attr("href") || ""

    // Specialty cell - may contain multiple specialties
    const specialties = []
    $(cells[3])
      .find("a u")
      .each((_j, el) => {
        const specialty = $(el).text().trim().toLowerCase()
        if (specialty) specialties.push(specialty)
      })

    results.push({
      dexNumber,
      name,
      slug: serebiiNameToSlug(name),
      detailUrl: detailHref ? `${SEREBII_BASE}${detailHref}` : null,
      specialties,
    })
  })

  console.log(`  Found ${results.length} Pokémon on Serebii list`)
  return results
}

// --- Serebii Detail Page Scraper ---

async function scrapeSerebiiDetail(url) {
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  const result = {
    specialties: [],
    habitats: [],
    timeOfDay: null,
    weather: null,
  }

  // Parse specialty from the Speciality/Ideal Habitat/Favorites table
  $("td.foo").each((_i, el) => {
    if ($(el).text().trim() === "Speciality") {
      const row = $(el).closest("tr").next("tr")
      const specialtyCell = row.find("td.cen").first()
      specialtyCell.find("a u").each((_j, link) => {
        const specialty = $(link).text().trim().toLowerCase()
        if (specialty) result.specialties.push(specialty)
      })
    }
  })

  // Parse Habitats & Locations section
  // Structure: habitats are laid out in COLUMNS (side by side)
  // Row 1: habitat names in fooevo cells (excluding the h2 header)
  // Row 2: habitat images in cen cells (src contains habitat ID)
  // Row 3: locations in fooinfo cells
  // Row 4: rarity in fooinfo cells
  // Row 5: time/weather in fooinfo cells (nested table)
  const habitatHeader = $("h2:contains('Habitats & Locations')")
  if (habitatHeader.length > 0) {
    const habitatTable = habitatHeader.closest("table")
    const rows = habitatTable.find("> tbody > tr, > tr")

    // Collect data by row type
    const nameRow = []
    const imageRow = []
    const rarityRow = []
    const timeWeatherRow = []

    rows.each((_i, row) => {
      const fooevoCells = $(row).find("td.fooevo")
      const cenCells = $(row).find("td.cen")
      const fooinfoCells = $(row).find("td.fooinfo")

      // Skip the header row
      if (fooevoCells.find("h2").length > 0) return

      // Name row: fooevo cells with <a> links (not h2)
      if (fooevoCells.length > 0 && fooevoCells.find("a").length > 0 && nameRow.length === 0) {
        fooevoCells.each((_j, cell) => {
          const name = $(cell).find("a").text().trim()
          if (name) nameRow.push(name)
        })
        return
      }

      // Image row: cen cells with habitatdex images
      if (cenCells.length > 0 && cenCells.find("img[src*='habitatdex']").length > 0) {
        cenCells.each((_j, cell) => {
          const img = $(cell).find("img[src*='habitatdex']")
          const src = img.attr("src") || ""
          const match = src.match(/\/(\d+)\.png/)
          imageRow.push(match ? parseInt(match[1], 10) : null)
        })
        return
      }

      // Rarity row: fooinfo cells starting with "Rarity"
      if (fooinfoCells.length > 0 && $(fooinfoCells[0]).text().trim().startsWith("Rarity")) {
        fooinfoCells.each((_j, cell) => {
          const text = $(cell).text().replace("Rarity:", "").trim().toLowerCase()
          rarityRow.push(RARITY_MAP[text] || "common")
        })
        return
      }

      // Time/Weather row: fooinfo cells containing nested tables with Time/Weather headers
      if (fooinfoCells.length > 0 && $(fooinfoCells[0]).find("b:contains('Time')").length > 0) {
        fooinfoCells.each((_j, cell) => {
          const nestedTable = $(cell).find("table")
          const timeWeatherData = { times: [], weathers: [] }

          // The nested table has: header row (Time | Weather), then data row
          const dataRow = nestedTable.find("tr").last()
          const dataCells = dataRow.find("td")

          if (dataCells.length >= 1) {
            // Split by <br> tags since .text() strips them
            const timeHtml = $(dataCells[0]).html() || ""
            timeHtml.split(/<br\s*\/?>/).forEach((t) => {
              const trimmed = t.replace(/<[^>]*>/g, "").trim().toLowerCase()
              if (TIME_MAP[trimmed]) timeWeatherData.times.push(TIME_MAP[trimmed])
            })
          }
          if (dataCells.length >= 2) {
            const weatherHtml = $(dataCells[1]).html() || ""
            weatherHtml.split(/<br\s*\/?>/).forEach((w) => {
              const trimmed = w.replace(/<[^>]*>/g, "").trim().toLowerCase()
              if (WEATHER_MAP[trimmed]) timeWeatherData.weathers.push(WEATHER_MAP[trimmed])
            })
          }

          timeWeatherRow.push(timeWeatherData)
        })
        return
      }
    })

    // Combine into habitat objects
    const habitatCount = Math.max(nameRow.length, imageRow.length)
    for (let i = 0; i < habitatCount; i++) {
      const name = nameRow[i] || null
      const id = imageRow[i] ?? null
      const rarity = rarityRow[i] || "common"

      if (name && id !== null) {
        result.habitats.push({ id, name, rarity })
      }
    }

    // Use time/weather from the first habitat (they're typically the same)
    if (timeWeatherRow.length > 0) {
      const first = timeWeatherRow[0]
      if (first.times.length > 0) result.timeOfDay = first.times
      if (first.weathers.length > 0) result.weather = first.weathers
    }
  }

  return result
}

// --- Game8 Scraper ---

// Known Game8 time/weather alt text values
const GAME8_TIME_MAP = {
  dawn: "dawn",
  day: "day",
  dusk: "dusk",
  night: "night",
}

const GAME8_WEATHER_MAP = {
  sunny: "sunny",
  cloudy: "cloudy",
  rainy: "rainy",
  snowy: "snowy",
}

// Known Pokemon types to filter out from text parsing
const POKEMON_TYPES = new Set([
  "normal", "fire", "water", "grass", "electric", "ice", "fighting",
  "poison", "ground", "flying", "psychic", "bug", "rock", "ghost",
  "dragon", "dark", "steel", "fairy",
])

async function scrapeGame8() {
  console.log("Fetching Game8 page...")
  const html = await fetchHtml(GAME8_URL)
  const $ = cheerio.load(html)

  const results = new Map()

  // Game8 table: each row has 4 cells (td.center):
  // [0] Pokemon name + type icons, [1] Habitat image + name, [2] Time/Weather icons, [3] Specialty
  // But some rows are just grid rows of pokemon images (width="25%")
  // The actual data table rows have exactly 4 td.center children

  $("table.a-table tr").each((_i, row) => {
    const cells = $(row).find("> td.center")
    if (cells.length !== 4) return

    // Cell 0: Pokemon name - get the 150x150 image alt (the pokemon image)
    const pokemonCell = $(cells[0])
    const pokemonImg = pokemonCell.find("img[width='150']")
    if (pokemonImg.length === 0) return

    // Extract Pokemon name from text, filtering out type names
    const cellText = pokemonCell.text().trim()
    const textParts = cellText.split(/\s+/)
    // Pokemon name is the text that isn't a type name
    const pokemonName = textParts
      .filter((p) => !POKEMON_TYPES.has(p.toLowerCase()) && p.length > 0)
      .join(" ")
      .trim()

    if (!pokemonName) return
    const slug = serebiiNameToSlug(pokemonName)

    // Cell 1: Habitat - get habitat image names (90x90 images)
    const habitatCell = $(cells[1])
    const habitatNames = []
    habitatCell.find("img[width='90']").each((_j, img) => {
      const alt = $(img).attr("alt") || ""
      if (alt && alt.toLowerCase() !== "tbd") {
        // Capitalize first letter of each word
        habitatNames.push(
          alt.replace(/\b\w/g, (c) => c.toUpperCase())
        )
      }
    })

    // Cell 2: Time and Weather icons (30x30 images)
    const twCell = $(cells[2])
    const times = []
    const weathers = []
    twCell.find("img[width='30']").each((_j, img) => {
      const alt = ($(img).attr("alt") || "").toLowerCase().trim()
      if (GAME8_TIME_MAP[alt]) {
        times.push(GAME8_TIME_MAP[alt])
      } else if (GAME8_WEATHER_MAP[alt]) {
        weathers.push(GAME8_WEATHER_MAP[alt])
      }
    })

    // Cell 3: Specialty - get specialty icon (30x30) alt text or text content
    const specCell = $(cells[3])
    const specialties = []
    specCell.find("img[width='30']").each((_j, img) => {
      const alt = ($(img).attr("alt") || "").trim().toLowerCase()
      if (alt && alt !== "tbd" && VALID_SPECIALTIES.has(alt)) specialties.push(alt)
    })
    // Fallback: parse text if no icons
    if (specialties.length === 0) {
      const specText = specCell.text().trim().toLowerCase()
      if (specText && specText !== "tbd") {
        specText.split(/[,\n]/).forEach((s) => {
          const trimmed = s.trim()
          if (trimmed && VALID_SPECIALTIES.has(trimmed)) specialties.push(trimmed)
        })
      }
    }

    if (slug) {
      results.set(slug, {
        name: pokemonName,
        slug,
        habitats: habitatNames,
        timeOfDay: times.length > 0 ? times : null,
        weather: weathers.length > 0 ? weathers : null,
        specialties,
      })
    }
  })

  console.log(`  Found ${results.size} Pokémon on Game8`)
  return results
}

// --- Habitat Name Localization ---

async function loadHabitatMappings() {
  const ja = (await loadJson(path.join(CONTENT_DIR, "habitat-mapping.json"))) || {}
  const zh = (await loadJson(path.join(CONTENT_DIR, "habitat-mapping-zh.json"))) || {}
  return { ja, zh }
}

function getLocalizedHabitatName(habitat, locale, mappings) {
  const idStr = String(habitat.id)
  if (locale === "en") return habitat.name
  if (locale === "ja" && mappings.ja[idStr]) return mappings.ja[idStr]
  if (locale === "zh" && mappings.zh[idStr]) return mappings.zh[idStr]
  // Fallback to English name
  return habitat.name
}

// --- Evolution Data ---

// We'll read evolution info from PokeAPI species data (cached)
const EVOLUTION_CACHE = new Map()

async function getEvolutionData(slug) {
  if (EVOLUTION_CACHE.has(slug)) return EVOLUTION_CACHE.get(slug)

  try {
    const apiName = POKEAPI_NAME_MAP[slug] || slug
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${apiName}`)
    if (!res.ok) return { evolvesFrom: null, evolvesTo: null }
    const species = await res.json()

    const evolvesFrom = species.evolves_from_species
      ? species.evolves_from_species.name
      : null

    // Get evolution chain for evolvesTo
    let evolvesTo = null
    if (species.evolution_chain?.url) {
      const chainRes = await fetch(species.evolution_chain.url)
      if (chainRes.ok) {
        const chain = await chainRes.json()
        const evolvesToNames = findEvolvesTo(chain.chain, slug)
        if (evolvesToNames.length > 0) evolvesTo = evolvesToNames
      }
    }

    const result = { evolvesFrom, evolvesTo }
    EVOLUTION_CACHE.set(slug, result)
    return result
  } catch {
    return { evolvesFrom: null, evolvesTo: null }
  }
}

function findEvolvesTo(chain, targetSlug) {
  if (chain.species.name === targetSlug) {
    return chain.evolves_to.map((e) => e.species.name)
  }
  for (const next of chain.evolves_to) {
    const found = findEvolvesTo(next, targetSlug)
    if (found.length > 0) return found
  }
  return []
}

// --- Main Merge Logic ---

function mergeHabitats(existing, scraped) {
  // Start with existing habitats
  const merged = new Map()
  if (existing) {
    for (const h of existing) {
      merged.set(h.id, { ...h })
    }
  }
  // Add/update from scraped data
  for (const h of scraped) {
    if (h.id !== null && !merged.has(h.id)) {
      merged.set(h.id, { ...h })
    }
  }
  return Array.from(merged.values())
}

function mergePokopiaData(existingPokopia, serebiiDetail, game8Data, serebiiListEntry) {
  const existing = existingPokopia || {}

  // Specialties: prefer existing > serebii list > serebii detail > game8
  let specialties = existing.specialties
  if (!specialties || specialties.length === 0) {
    if (serebiiListEntry?.specialties?.length > 0) {
      specialties = serebiiListEntry.specialties
    } else if (serebiiDetail?.specialties?.length > 0) {
      specialties = serebiiDetail.specialties
    } else if (game8Data?.specialties?.length > 0) {
      specialties = game8Data.specialties
    } else {
      specialties = []
    }
  }

  // Habitats: merge from serebii detail and existing
  let habitats = existing.habitats || []
  if (serebiiDetail?.habitats?.length > 0) {
    habitats = mergeHabitats(habitats, serebiiDetail.habitats)
  }

  // Time of day: prefer existing > serebii detail > game8
  let timeOfDay = existing.timeOfDay !== undefined ? existing.timeOfDay : null
  if (timeOfDay === null || timeOfDay === undefined) {
    if (serebiiDetail?.timeOfDay) {
      timeOfDay = serebiiDetail.timeOfDay
    } else if (game8Data?.timeOfDay) {
      timeOfDay = game8Data.timeOfDay
    }
  }

  // Weather: prefer existing > serebii detail > game8
  let weather = existing.weather !== undefined ? existing.weather : null
  if (weather === null || weather === undefined) {
    if (serebiiDetail?.weather) {
      weather = serebiiDetail.weather
    } else if (game8Data?.weather) {
      weather = game8Data.weather
    }
  }

  // obtainMethod and evolution: keep existing if present
  const obtainMethod = existing.obtainMethod || "habitat"
  const evolvesFrom = existing.evolvesFrom !== undefined ? existing.evolvesFrom : null
  const evolvesTo = existing.evolvesTo !== undefined ? existing.evolvesTo : null

  return {
    specialties,
    timeOfDay: timeOfDay || null,
    weather: weather || null,
    obtainMethod,
    evolvesFrom,
    evolvesTo,
    habitats,
  }
}

// --- New Pokemon: fetch from PokeAPI ---

// Map Pokopia-specific names to PokeAPI species names
const POKEAPI_NAME_MAP = {
  "stereo-rotom": "rotom",
  "paldean-wooper": "wooper",
}

async function fetchNewPokemonBase(slug) {
  const POKEAPI_BASE = "https://pokeapi.co/api/v2"
  const apiName = POKEAPI_NAME_MAP[slug] || slug

  const speciesRes = await fetch(`${POKEAPI_BASE}/pokemon-species/${apiName}`)
  if (!speciesRes.ok) {
    throw new Error(`PokeAPI species not found for ${apiName} (${speciesRes.status})`)
  }
  const speciesData = await speciesRes.json()

  const pokemonRes = await fetch(`${POKEAPI_BASE}/pokemon/${speciesData.id}`)
  if (!pokemonRes.ok) {
    throw new Error(`PokeAPI pokemon not found for ${speciesData.id}`)
  }
  const pokemonData = await pokemonRes.json()

  function getName(lang) {
    const entry = speciesData.names.find((n) => n.language.name === lang)
    return entry?.name ?? speciesData.name
  }

  function getFlavorText(lang) {
    const entries = speciesData.flavor_text_entries.filter(
      (e) => e.language.name === lang
    )
    if (entries.length === 0) return ""
    return entries[entries.length - 1].flavor_text.replace(/\n|\f/g, " ")
  }

  const types = pokemonData.types
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name)

  const statKeyMap = {
    hp: "hp",
    attack: "attack",
    defense: "defense",
    "special-attack": "spAtk",
    "special-defense": "spDef",
    speed: "speed",
  }
  const stats = { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 }
  for (const s of pokemonData.stats) {
    const key = statKeyMap[s.stat.name]
    if (key) stats[key] = s.base_stat
  }

  const abilities = pokemonData.abilities
    .sort((a, b) => a.slot - b.slot)
    .map((a) => a.ability.name)

  const PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://assets.pokopiaguide.com"

  const langMap = { en: "en", zh: "zh-hant", ja: "ja" }
  const result = {}

  for (const locale of LOCALES) {
    const name =
      locale === "en"
        ? getName("en")
        : locale === "zh"
          ? getName("zh-hant") || getName("zh-hans")
          : getName("ja")

    const description =
      locale === "zh"
        ? getFlavorText("zh-hant") || getFlavorText("zh-hans") || getFlavorText("en")
        : getFlavorText(langMap[locale]) || getFlavorText("en")

    result[locale] = {
      id: pokemonData.id,
      slug,
      name,
      types,
      stats,
      abilities,
      description,
      image: `${PUBLIC_URL}/pokemon/${slug}.png`,
    }
  }

  return result
}

// --- Main ---

async function uploadAllMissingImages() {
  console.log("Uploading missing images...")
  let uploaded = 0
  let skipped = 0
  const dir = path.join(CONTENT_DIR, "en", "pokemon")
  const files = await fs.readdir(dir)
  for (const file of files) {
    if (!file.endsWith(".json")) continue
    const slug = file.replace(".json", "")
    const data = await loadJson(path.join(dir, file))
    if (!data) continue
    const imageKey = `pokemon/${slug}.png`
    const exists = await r2ObjectExists(imageKey)
    if (exists) {
      skipped++
      continue
    }
    const success = await uploadPokemonImage(slug, data.id)
    if (success) uploaded++
    await sleep(100)
  }
  console.log(`\nImage upload complete: ${uploaded} uploaded, ${skipped} already existed`)
}

async function run() {
  if (UPLOAD_IMAGES_ONLY) {
    await uploadAllMissingImages()
    return
  }

  const syncState = await loadSyncState()
  const habitatMappings = await loadHabitatMappings()

  // Step 1: Scrape Serebii list
  let serebiiList
  try {
    serebiiList = await scrapeSerebiiList()
  } catch (err) {
    console.error(`Failed to scrape Serebii list: ${err.message}`)
    serebiiList = []
  }

  // Step 2: Scrape Game8 (in parallel with later steps)
  let game8Data = new Map()
  try {
    game8Data = await scrapeGame8()
  } catch (err) {
    console.error(`Failed to scrape Game8: ${err.message}`)
  }

  // Step 3: Load all existing Pokemon JSON files
  const existingPokemon = new Map()
  for (const locale of LOCALES) {
    const dir = path.join(CONTENT_DIR, locale, "pokemon")
    try {
      const files = await fs.readdir(dir)
      for (const file of files) {
        if (!file.endsWith(".json")) continue
        const slug = file.replace(".json", "")
        const data = await loadJson(path.join(dir, file))
        if (data) {
          if (!existingPokemon.has(slug)) {
            existingPokemon.set(slug, {})
          }
          existingPokemon.get(slug)[locale] = data
        }
      }
    } catch {
      // Directory might not exist yet
    }
  }

  console.log(`Loaded ${existingPokemon.size} existing Pokémon`)

  // Build lookup from serebii list
  const serebiiBySlug = new Map()
  for (const entry of serebiiList) {
    serebiiBySlug.set(entry.slug, entry)
  }

  // Stats tracking
  let updated = 0
  let skipped = 0
  let newPokemon = 0
  let errors = 0
  const newHabitats = []

  // Step 4: Process each Pokemon from the Serebii list
  for (const entry of serebiiList) {
    const { slug, dexNumber, name } = entry

    // Check if we have existing data
    const existingLocales = existingPokemon.get(slug)
    const existingEn = existingLocales?.en

    // Skip if data is complete (unless --force)
    if (!FORCE && existingEn && isPokopiaDataComplete(existingEn)) {
      skipped++
      continue
    }

    console.log(`\nProcessing: ${name} (#${dexNumber}) [${slug}]`)

    // Scrape Serebii detail page
    let serebiiDetail = null
    if (entry.detailUrl) {
      try {
        serebiiDetail = await scrapeSerebiiDetail(entry.detailUrl)
        await sleep(300) // Rate limit
      } catch (err) {
        console.error(`  Failed to scrape detail for ${name}: ${err.message}`)
        errors++
      }
    }

    // Get Game8 data for this Pokemon
    const g8 = game8Data.get(slug) || null

    // If this is a new Pokemon we don't have at all, fetch base data
    if (!existingEn) {
      console.log(`  New Pokémon! Fetching base data from PokeAPI...`)
      try {
        const baseData = await fetchNewPokemonBase(slug)
        for (const locale of LOCALES) {
          const dir = path.join(CONTENT_DIR, locale, "pokemon")
          await fs.mkdir(dir, { recursive: true })
          existingPokemon.set(slug, {
            ...existingPokemon.get(slug),
            [locale]: baseData[locale],
          })
        }
        // Upload image to R2
        if (!DRY_RUN) {
          const pokemonId = baseData.en.id
          await uploadPokemonImage(slug, pokemonId)
        }
        newPokemon++
        await sleep(200) // Rate limit PokeAPI
      } catch (err) {
        console.error(`  Failed to fetch base data for ${name}: ${err.message}`)
        errors++
        continue
      }
    } else {
      // Ensure image exists for existing Pokemon too
      if (!DRY_RUN) {
        const pokemonId = existingEn.id
        await uploadPokemonImage(slug, pokemonId)
      }
    }

    // Get evolution data from PokeAPI
    let evolutionData = {
      evolvesFrom: existingEn?.pokopia?.evolvesFrom ?? null,
      evolvesTo: existingEn?.pokopia?.evolvesTo ?? null,
    }
    if (
      evolutionData.evolvesFrom === null &&
      evolutionData.evolvesTo === null
    ) {
      try {
        evolutionData = await getEvolutionData(slug)
        await sleep(100)
      } catch {
        // Ignore evolution errors
      }
    }

    // Merge pokopia data
    const existingPokopia = existingEn?.pokopia || null
    const merged = mergePokopiaData(existingPokopia, serebiiDetail, g8, entry)

    // Override evolution data if we got it
    if (evolutionData.evolvesFrom !== null || merged.evolvesFrom === null) {
      merged.evolvesFrom = evolutionData.evolvesFrom
    }
    if (evolutionData.evolvesTo !== null || merged.evolvesTo === null) {
      merged.evolvesTo = evolutionData.evolvesTo
    }

    // Check for new habitats not in our mapping
    for (const habitat of merged.habitats) {
      const idStr = String(habitat.id)
      if (!habitatMappings.ja[idStr]) {
        newHabitats.push({
          id: habitat.id,
          name: habitat.name,
          missingIn: ["ja", "zh"],
        })
      } else if (!habitatMappings.zh[idStr]) {
        newHabitats.push({
          id: habitat.id,
          name: habitat.name,
          missingIn: ["zh"],
        })
      }
    }

    // Write to all 3 locales
    if (!DRY_RUN) {
      for (const locale of LOCALES) {
        const pokemonData = existingPokemon.get(slug)?.[locale]
        if (!pokemonData) continue

        // Localize habitat names
        const localizedHabitats = merged.habitats.map((h) => ({
          ...h,
          name: getLocalizedHabitatName(h, locale, habitatMappings),
        }))

        const updatedData = {
          ...pokemonData,
          pokopia: {
            ...merged,
            habitats: localizedHabitats,
          },
        }

        const filePath = path.join(CONTENT_DIR, locale, "pokemon", `${slug}.json`)
        await writeJson(filePath, updatedData)
      }
    }

    updated++
    console.log(
      `  Updated: ${merged.specialties.join(", ") || "no specialty"} | ` +
        `${merged.habitats.length} habitat(s) | ` +
        `time: ${merged.timeOfDay?.join(", ") || "null"} | ` +
        `weather: ${merged.weather?.join(", ") || "null"}`
    )
  }

  // Save sync state
  const newState = {
    lastSync: new Date().toISOString(),
    newHabitats: [
      ...new Map(
        [...(syncState.newHabitats || []), ...newHabitats].map((h) => [h.id, h])
      ).values(),
    ],
    errors: [],
    stats: {
      total: serebiiList.length,
      updated,
      skipped,
      newPokemon,
      errors,
    },
  }
  if (!DRY_RUN) {
    await saveSyncState(newState)
  }

  console.log("\n--- Summary ---")
  console.log(`Total in Serebii: ${serebiiList.length}`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped (already complete): ${skipped}`)
  console.log(`New Pokémon added: ${newPokemon}`)
  console.log(`Errors: ${errors}`)
  if (newHabitats.length > 0) {
    console.log(`\nNew habitats needing translation:`)
    for (const h of newHabitats) {
      console.log(`  ID ${h.id}: "${h.name}" (missing: ${h.missingIn.join(", ")})`)
    }
  }
}

async function main() {
  console.log("=== Pokopia Data Updater ===")
  console.log(`Mode: ${FORCE ? "FORCE" : "incremental"} | ${DRY_RUN ? "DRY RUN" : "live"}`)

  await run()

  if (WATCH) {
    console.log(`\nWatch mode: checking every ${INTERVAL_MIN} minutes...`)
    const intervalMs = INTERVAL_MIN * 60 * 1000
    setInterval(async () => {
      console.log(`\n=== Re-sync at ${new Date().toISOString()} ===`)
      try {
        await run()
      } catch (err) {
        console.error(`Sync failed: ${err.message}`)
      }
    }, intervalMs)
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
