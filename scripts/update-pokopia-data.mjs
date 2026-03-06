import fs from "fs/promises"
import path from "path"
import * as cheerio from "cheerio"
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import dotenv from "dotenv"
import { POKEAPI_NAME_MAP } from "./pokopia-dex.mjs"

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
const GAME8_HABITAT_LIST_URL = "https://game8.co/games/Pokemon-Pokopia/archives/582463"
const GAMEWITH_URL = "https://gamewith.jp/pocoapokemon/530830"
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

// --- GameWith Mapping Tables ---

const GAMEWITH_SKILL_MAP = {
  "うるおす": "water",
  "さいばい": "grow",
  "もやす": "burn",
  "けんちく": "build",
  "とりひき": "trade",
  "きをきる": "chop",
  "そらをとぶ": "fly",
  "ゆめしま": "dream island",
  "ちらかす": "litter",
  "はつでん": "generate",
  "しわける": "gather",
  "さがしもの": "search",
  "もりあげる": "hype",
  "つぶす": "crush",
  "あくび": "yawn",
  "じならし": "bulldoze",
  "ミツあつめ": "gather honey",
  "テレポート": "teleport",
  "リサイクル": "recycle",
  "コレクター": "appraise",
  "しゅうのう": "storage",
  "ばくはつ": "explode",
}

const GAMEWITH_TYPE_MAP = {
  "ノーマル": "normal", "ほのお": "fire", "みず": "water",
  "でんき": "electric", "くさ": "grass", "こおり": "ice",
  "かくとう": "fighting", "どく": "poison", "じめん": "ground",
  "ひこう": "flying", "エスパー": "psychic", "むし": "bug",
  "いわ": "rock", "ゴースト": "ghost", "ドラゴン": "dragon",
  "あく": "dark", "はがね": "steel", "フェアリー": "fairy",
}

const GAMEWITH_TIME_MAP = { "朝": "dawn", "昼": "day", "夕": "dusk", "夜": "night" }

const GAMEWITH_WEATHER_MAP = { "晴": "sunny", "曇": "cloudy", "雨": "rainy", "雪": "snowy" }

const ALL_TIMES = ["dawn", "day", "dusk", "night"]
const ALL_WEATHERS = ["sunny", "cloudy", "rainy", "snowy"]

const GAMEWITH_RARITY_MAP = { 0: "common", 1: "common", 2: "rare", 3: "very-rare" }

// Known valid specialties in the game
// Multi-word specialties use spaces (matching Serebii), icons use hyphenated filenames
const VALID_SPECIALTIES = new Set([
  "grow", "burn", "water", "fly", "search", "chop", "build", "crush",
  "bulldoze", "trade", "generate", "explode", "hype", "gather", "paint",
  "eat", "teleport", "illuminate", "transform", "recycle", "appraise",
  "litter", "sing", "cool", "spark", "psychic", "dig", "cut", "swim",
  "yawn", "gather honey", "dream island", "storage",
])

// Normalize typos/aliases from Serebii/Game8 to valid keys
const SPECIALTY_NORMALIZE_MAP = {
  "collect": "appraise",
  "party": "hype",
  "generage": "generate",
  "dj": "hype",
  "engineer": "build",
  "buil": "build",
}

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

async function uploadPokemonImage(slug) {
  const imageKey = `pokemon/${slug}.png`
  const exists = await r2ObjectExists(imageKey)
  if (exists) return true

  // Use PokeAPI slug-based endpoint for sprite URL
  const apiName = POKEAPI_NAME_MAP[slug] || slug
  let spriteId
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${apiName}`)
    if (!res.ok) return false
    const data = await res.json()
    spriteId = data.id
  } catch {
    return false
  }

  // Try HOME sprite first, then official artwork
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${spriteId}.png`
  const fallbackUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${spriteId}.png`

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

async function pMap(items, fn, concurrency = 5) {
  const results = []
  let index = 0
  async function worker() {
    while (index < items.length) {
      const i = index++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
  return results
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

function normalizeSpecialty(raw) {
  const lower = raw.toLowerCase().trim()
  if (!lower || lower === "???" || lower === "tbd") return null
  const mapped = SPECIALTY_NORMALIZE_MAP[lower]
  if (mapped) return mapped
  if (VALID_SPECIALTIES.has(lower)) return lower
  return lower // return as-is, will be caught by validation
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
        const raw = $(el).text().trim().toLowerCase()
        if (raw) {
          const normalized = normalizeSpecialty(raw)
          if (normalized) specialties.push(normalized)
        }
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
        const raw = $(link).text().trim().toLowerCase()
        if (raw) {
          const normalized = normalizeSpecialty(raw)
          if (normalized) result.specialties.push(normalized)
        }
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

  // Step 1: Fetch the HTML to get the toolStructuralMappingId
  const html = await fetchHtml(GAME8_URL)
  const propsMatch = html.match(/data-react-props='([^']*)'/)
  if (!propsMatch) {
    console.error("  Could not find React props on Game8 page")
    return { pokemonData: new Map(), habitatImageMap: new Map() }
  }

  let tsmId
  try {
    const props = JSON.parse(propsMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
    tsmId = props.toolStructuralMappingId
  } catch {
    console.error("  Could not parse React props")
    return { pokemonData: new Map(), habitatImageMap: new Map() }
  }

  if (!tsmId) {
    console.error("  No toolStructuralMappingId found")
    return { pokemonData: new Map(), habitatImageMap: new Map() }
  }

  // Step 2: Fetch the API data using the mapping ID
  console.log(`  Fetching Game8 API (toolStructuralMapping ${tsmId})...`)
  const apiUrl = `https://game8.co/api/tool_structural_mappings/${tsmId}`
  const apiResp = await fetch(apiUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "application/json",
      Referer: GAME8_URL,
      "X-Requested-With": "XMLHttpRequest",
    },
  })
  if (!apiResp.ok) {
    console.error(`  Game8 API returned ${apiResp.status}`)
    return { pokemonData: new Map(), habitatImageMap: new Map() }
  }

  const apiData = await apiResp.json()
  const items = apiData?.collectionArraySchema?.collectionItems || []

  const results = new Map()
  const habitatImageMap = new Map()

  for (const item of items) {
    const pokemonName = (item.name || "").trim()
    if (!pokemonName) continue
    const slug = serebiiNameToSlug(pokemonName)
    if (!slug) continue

    // Parse specialties (colon-separated)
    const specialties = []
    if (item.specialties) {
      for (const s of item.specialties.split(":")) {
        const normalized = normalizeSpecialty(s.trim().toLowerCase())
        if (normalized && VALID_SPECIALTIES.has(normalized)) specialties.push(normalized)
      }
    }

    // Parse habitat details
    const habitatNames = []
    const details = item.detailsArraySchema?.details || []
    // Use first habitat's time/weather as the pokemon's default
    let times = null
    let weathers = null

    for (const det of details) {
      const hName = (det.name || "").trim()
      if (hName) habitatNames.push(hName)

      // Collect habitat image
      if (det.image && hName) {
        const key = hName.toLowerCase().trim()
        if (!habitatImageMap.has(key)) {
          habitatImageMap.set(key, det.image)
        }
      }

      // Parse time/weather from first habitat with data
      if (!times && det.time) {
        times = det.time.split(":").map((t) => t.trim().toLowerCase()).filter(Boolean)
      }
      if (!weathers && det.weather) {
        weathers = det.weather.split(":").map((w) => w.trim().toLowerCase()).filter(Boolean)
      }
    }

    results.set(slug, {
      name: pokemonName,
      slug,
      habitats: habitatNames,
      timeOfDay: times && times.length > 0 ? times : null,
      weather: weathers && weathers.length > 0 ? weathers : null,
      specialties,
    })
  }

  console.log(`  Found ${results.size} Pokémon on Game8, ${habitatImageMap.size} habitat images`)
  return { pokemonData: results, habitatImageMap }
}

// --- Game8 Habitat Conditions Scraper ---

async function scrapeGame8HabitatConditions() {
  console.log("Fetching Game8 habitat list page for conditions...")
  try {
    const html = await fetchHtml(GAME8_HABITAT_LIST_URL)
    const $ = cheerio.load(html)

    const conditions = new Map() // lowercase EN habitat name → conditions text

    // Game8 habitat list page has tables with habitat info
    // Each row: habitat image+name, conditions text
    $("table.a-table tr").each((_i, row) => {
      const cells = $(row).find("> td")
      if (cells.length < 2) return

      // Look for habitat name in first cell (from link text or image alt)
      const firstCell = $(cells[0])
      let habitatName = firstCell.find("a").first().text().trim()
      if (!habitatName) {
        habitatName = firstCell.text().trim()
      }
      if (!habitatName) return

      // Look for conditions text in second cell
      const secondCell = $(cells[1])
      const condText = secondCell.text().trim()
      if (!condText) return

      conditions.set(habitatName.toLowerCase().trim(), condText)
    })

    // Also try parsing from h3 + ul/table patterns
    $("h3, h4").each((_i, heading) => {
      const headingText = $(heading).text().trim()
      if (!headingText) return

      // Check if next sibling contains conditions info
      const next = $(heading).next()
      if (!next.length) return

      const text = next.text().trim()
      if (text && (text.includes("x") || text.includes("×") || text.includes("Conditions"))) {
        conditions.set(headingText.toLowerCase().trim(), text)
      }
    })

    console.log(`  Found ${conditions.size} habitat conditions on Game8`)
    return conditions
  } catch (err) {
    console.error(`  Failed to scrape Game8 habitat conditions: ${err.message}`)
    return new Map()
  }
}

// --- Japanese Name → Slug Mapping ---

async function buildJaNameToSlugMap() {
  const jaNameToSlug = new Map()
  const dir = path.join(CONTENT_DIR, "ja", "pokemon")
  try {
    const files = await fs.readdir(dir)
    for (const file of files) {
      if (!file.endsWith(".json")) continue
      const data = await loadJson(path.join(dir, file))
      if (data?.name) {
        jaNameToSlug.set(data.name, data.slug)
      }
    }
  } catch {
    // Directory might not exist yet
  }

  // Special mappings for names that differ from content files
  const SPECIAL_JA_SLUG = {
    "パルデアウパー": "paldean-wooper",
    "ステレオロトム": "stereo-rotom",
  }
  for (const [jaName, slug] of Object.entries(SPECIAL_JA_SLUG)) {
    jaNameToSlug.set(jaName, slug)
  }

  return jaNameToSlug
}

// --- GameWith Scraper ---

function parseGameWithJsObject(html, varName) {
  // Extract window.wmt.{varName}=[...]; from HTML
  const pattern = new RegExp(`window\\.wmt\\.${varName}\\s*=\\s*\\[`, "s")
  const match = html.match(pattern)
  if (!match) return null

  // Find matching closing bracket, respecting strings
  const startIdx = html.indexOf("[", match.index + match[0].length - 1)
  let depth = 0
  let endIdx = startIdx
  let inString = false
  let stringChar = null
  for (let i = startIdx; i < html.length; i++) {
    const ch = html[i]
    if (inString) {
      if (ch === "\\" ) { i++; continue } // skip escaped char
      if (ch === stringChar) inString = false
      continue
    }
    if (ch === "'" || ch === '"') { inString = true; stringChar = ch; continue }
    if (ch === "[") depth++
    else if (ch === "]") {
      depth--
      if (depth === 0) { endIdx = i + 1; break }
    }
  }

  const rawJs = html.slice(startIdx, endIdx)

  // Convert JS object literal to valid JSON using a character-level parser
  // that correctly handles strings containing quotes and special chars
  const result = []
  inString = false
  stringChar = null
  for (let i = 0; i < rawJs.length; i++) {
    const ch = rawJs[i]

    if (inString) {
      if (ch === "\\" ) {
        // Keep escaped characters
        result.push(ch, rawJs[i + 1] || "")
        i++
        continue
      }
      if (ch === stringChar) {
        // End of JS string — emit closing double quote
        result.push('"')
        inString = false
        continue
      }
      // Inside string: escape any double quotes in content
      if (ch === '"') {
        result.push('\\"')
      } else {
        result.push(ch)
      }
      continue
    }

    // Outside string
    if (ch === "'") {
      // Start of JS string — emit opening double quote
      inString = true
      stringChar = "'"
      result.push('"')
      continue
    }
    if (ch === '"') {
      inString = true
      stringChar = '"'
      result.push('"')
      continue
    }
    result.push(ch)
  }

  let jsonStr = result.join("")
  // Quote unquoted keys: {key: or ,key:
  jsonStr = jsonStr.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
  // Remove trailing commas
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, "$1")

  try {
    return JSON.parse(jsonStr)
  } catch (err) {
    console.error(`  Failed to parse GameWith ${varName}: ${err.message}`)
    // Log context around the error position for debugging
    const posMatch = err.message.match(/position (\d+)/)
    if (posMatch) {
      const pos = parseInt(posMatch[1])
      console.error(`  Context: ...${jsonStr.slice(Math.max(0, pos - 50), pos + 50)}...`)
    }
    return null
  }
}

async function scrapeGameWith(jaNameToSlug) {
  console.log("Fetching GameWith page...")
  const html = await fetchHtml(GAMEWITH_URL)

  const pokemonDatas = parseGameWithJsObject(html, "pokemonDatas")
  const skillDatas = parseGameWithJsObject(html, "skillDatas")
  const habitatDatas = parseGameWithJsObject(html, "habitatDatas")
  const setItemDatas = parseGameWithJsObject(html, "setItemDatas")
  const itemAnyDatas = parseGameWithJsObject(html, "itemAnyDatas")

  if (!pokemonDatas) {
    console.error("  Failed to extract pokemonDatas from GameWith")
    return { pokemonData: new Map(), habitatItemsMap: new Map() }
  }

  // Build item ID → Japanese name map
  const itemMap = new Map()
  if (setItemDatas) {
    for (const item of setItemDatas) {
      itemMap.set(String(item.id), item.n || `Item ${item.id}`)
    }
  }
  if (itemAnyDatas) {
    for (const item of itemAnyDatas) {
      itemMap.set(`a${item.id}`, item.n || `Any Item ${item.id}`)
    }
  }
  console.log(`  Parsed ${itemMap.size} items (${setItemDatas?.length || 0} set + ${itemAnyDatas?.length || 0} any)`)

  // Build habitat ID → materials list from habitatDatas.items
  const habitatItemsMap = new Map() // habitat ID string → [{id, name, count}]
  if (habitatDatas) {
    for (const h of habitatDatas) {
      if (h.items && Array.isArray(h.items)) {
        const items = h.items.map((item) => {
          const itemId = String(item.id)
          // Check if it's an "any" item (id might reference itemAnyDatas)
          const name = itemMap.get(itemId) || itemMap.get(`a${item.id}`) || `Item ${item.id}`
          return { id: itemId, name, count: item.c || 1 }
        })
        habitatItemsMap.set(String(h.id), items)
      }
    }
  }
  console.log(`  Built materials for ${habitatItemsMap.size} habitats`)

  // Build skill ID → english name map
  const skillIdToEn = new Map()
  if (skillDatas) {
    for (const skill of skillDatas) {
      const enName = GAMEWITH_SKILL_MAP[skill.n]
      if (enName) {
        skillIdToEn.set(String(skill.id), enName)
      }
    }
  }

  // Build habitat ID → english name map (from our habitat mapping)
  const habitatIdToName = new Map()
  if (habitatDatas) {
    for (const h of habitatDatas) {
      habitatIdToName.set(String(h.id), h.n)
    }
  }

  const results = new Map()

  for (const poke of pokemonDatas) {
    const jaName = poke.n
    const slug = jaNameToSlug.get(jaName)
    if (!slug) {
      console.log(`  GameWith: unmapped name "${jaName}", skipping`)
      continue
    }

    // Map types
    const types = (poke.t || [])
      .map((t) => GAMEWITH_TYPE_MAP[t])
      .filter(Boolean)

    // Map specialties from skill IDs
    const specialties = (poke.skills || [])
      .map((sid) => skillIdToEn.get(String(sid)))
      .filter(Boolean)

    // Map habitats from conditions
    const habitats = []
    const timeOfDaySet = new Set()
    const weatherSet = new Set()

    for (const cond of poke.conditions || []) {
      const hId = parseInt(cond.hId, 10)
      const rarity = GAMEWITH_RARITY_MAP[cond.lv] || "common"
      const hName = habitatIdToName.get(String(cond.hId)) || `Habitat ${cond.hId}`

      habitats.push({ id: hId, name: hName, rarity })

      // Extract time of day from condition (no time field = all times)
      if (cond.time) {
        const times = String(cond.time).split(",")
        for (const t of times) {
          const mapped = GAMEWITH_TIME_MAP[t.trim()]
          if (mapped) timeOfDaySet.add(mapped)
        }
      } else {
        for (const t of ALL_TIMES) timeOfDaySet.add(t)
      }

      // Extract weather from condition (no wx field = all weathers)
      if (cond.wx) {
        const weathers = String(cond.wx).split(",")
        for (const w of weathers) {
          const mapped = GAMEWITH_WEATHER_MAP[w.trim()]
          if (mapped) weatherSet.add(mapped)
        }
      } else {
        for (const w of ALL_WEATHERS) weatherSet.add(w)
      }
    }

    // Parse dex number from 'no' field (e.g., "001" → 1)
    const dexNumber = poke.no ? parseInt(poke.no, 10) : null

    // Only set time/weather if pokemon has habitats (non-habitat pokemon have no conditions)
    const hasConditions = (poke.conditions || []).length > 0

    results.set(slug, {
      name: jaName,
      slug,
      dexNumber,
      types,
      specialties,
      habitats,
      timeOfDay: hasConditions ? [...timeOfDaySet] : null,
      weather: hasConditions ? [...weatherSet] : null,
    })
  }

  console.log(`  Found ${results.size} Pokémon on GameWith (${pokemonDatas.length} total, ${pokemonDatas.length - results.size} unmapped)`)
  return { pokemonData: results, habitatItemsMap }
}

// --- Habitat Name Localization ---

async function loadHabitatMappings() {
  const en = (await loadJson(path.join(CONTENT_DIR, "habitat-mapping-en.json"))) || {}
  const ja = (await loadJson(path.join(CONTENT_DIR, "habitat-mapping.json"))) || {}
  const zh = (await loadJson(path.join(CONTENT_DIR, "habitat-mapping-zh.json"))) || {}
  return { en, ja, zh }
}

async function saveHabitatMappings(mappings) {
  await writeJson(path.join(CONTENT_DIR, "habitat-mapping-en.json"), mappings.en)
}

function getLocalizedHabitatName(habitat, locale, mappings) {
  const idStr = String(habitat.id)
  if (locale === "en" && mappings.en[idStr]) return mappings.en[idStr]
  if (locale === "ja" && mappings.ja[idStr]) return mappings.ja[idStr]
  if (locale === "zh" && mappings.zh[idStr]) return mappings.zh[idStr]
  // Fallback: use whatever name we have
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

function mergePokopiaData(existingPokopia, serebiiDetail, game8Data, serebiiListEntry, gameWithData) {
  const existing = existingPokopia || {}

  // Specialties: prefer existing > GameWith > serebii list > serebii detail > game8
  // Always normalize to fix legacy invalid values
  let specialties = existing.specialties?.map(normalizeSpecialty).filter(Boolean)
  if (!specialties || specialties.length === 0) {
    if (gameWithData?.specialties?.length > 0) {
      specialties = gameWithData.specialties
    } else if (serebiiListEntry?.specialties?.length > 0) {
      specialties = serebiiListEntry.specialties
    } else if (serebiiDetail?.specialties?.length > 0) {
      specialties = serebiiDetail.specialties
    } else if (game8Data?.specialties?.length > 0) {
      specialties = game8Data.specialties
    } else {
      specialties = []
    }
  }

  // Habitats: GameWith is authoritative; only fall back to Serebii if GameWith has none
  let habitats = existing.habitats || []
  if (gameWithData?.habitats?.length > 0) {
    habitats = gameWithData.habitats
  } else if (serebiiDetail?.habitats?.length > 0) {
    habitats = mergeHabitats(habitats, serebiiDetail.habitats)
  }

  // Time of day: GameWith is authoritative; fall back to Serebii > Game8
  let timeOfDay = null
  if (gameWithData?.timeOfDay) {
    timeOfDay = gameWithData.timeOfDay
  } else if (serebiiDetail?.timeOfDay) {
    timeOfDay = serebiiDetail.timeOfDay
  } else if (game8Data?.timeOfDay) {
    timeOfDay = game8Data.timeOfDay
  } else if (existing.timeOfDay) {
    timeOfDay = existing.timeOfDay
  }

  // Weather: GameWith is authoritative; fall back to Serebii > Game8
  let weather = null
  if (gameWithData?.weather) {
    weather = gameWithData.weather
  } else if (serebiiDetail?.weather) {
    weather = serebiiDetail.weather
  } else if (game8Data?.weather) {
    weather = game8Data.weather
  } else if (existing.weather) {
    weather = existing.weather
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

async function fetchNewPokemonBase(slug, dexNumber) {
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

  const types = pokemonData.types
    .sort((a, b) => a.slot - b.slot)
    .map((t) => t.type.name)

  const imageUrl = `${process.env.R2_PUBLIC_URL || "https://assets.pokopiaguide.com"}/pokemon/${slug}.png`

  const result = {}

  for (const locale of LOCALES) {
    const name =
      locale === "en"
        ? getName("en")
        : locale === "zh"
          ? getName("zh-hant") || getName("zh-hans")
          : getName("ja")

    result[locale] = {
      id: dexNumber,
      slug,
      name,
      types,
      image: imageUrl,
    }
  }

  return result
}

// --- Habitat Image Downloader ---

const HABITATS_DIR = path.join(process.cwd(), "public", "images", "habitats")
const GAMEWITH_HABITAT_IMG_BASE = "https://img.gamewith.jp/article_tools/pocoapokemon/gacha"

async function downloadMissingHabitatImages(allHabitatIds, habitatIdToImageUrl) {
  console.log("\n--- Downloading Missing Habitat Images ---")

  // Check which images are missing locally
  const missing = []
  for (const id of allHabitatIds) {
    const filePath = path.join(HABITATS_DIR, `habitat_${id}.png`)
    try {
      await fs.access(filePath)
    } catch {
      missing.push(id)
    }
  }

  if (missing.length === 0) {
    console.log(`  All ${allHabitatIds.size} habitat images exist locally.`)
    return
  }

  console.log(`  Missing: ${missing.length} / ${allHabitatIds.size}`)

  if (DRY_RUN) {
    for (const id of missing) {
      console.log(`  [DRY RUN] habitat_${id}.png`)
    }
    return
  }

  await fs.mkdir(HABITATS_DIR, { recursive: true })

  let downloaded = 0
  let failed = 0
  let tooSmall = 0

  await pMap(
    missing,
    async (id) => {
      // Try GameWith first (predictable URL), then Game8 fallback
      const urls = [
        `${GAMEWITH_HABITAT_IMG_BASE}/habitat_${id}.png`,
        habitatIdToImageUrl.get(id),
      ].filter(Boolean)

      for (const url of urls) {
        try {
          const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (compatible; PokopiaGuideBot/1.0)" },
          })
          if (!res.ok) continue

          const buffer = Buffer.from(await res.arrayBuffer())
          if (buffer.length < 1024) {
            tooSmall++
            continue
          }

          const filePath = path.join(HABITATS_DIR, `habitat_${id}.png`)
          await fs.writeFile(filePath, buffer)
          console.log(`  Downloaded habitat_${id}.png (${buffer.length} bytes)`)
          downloaded++
          return
        } catch {
          continue
        }
      }
      console.log(`  Failed habitat_${id}.png`)
      failed++
    },
    5
  )

  console.log(`\n  Habitat images: ${downloaded} downloaded, ${failed} failed, ${tooSmall} too small`)
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
    const success = await uploadPokemonImage(slug)
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

  // Step 1: Build ja name → slug mapping for GameWith
  const jaNameToSlug = await buildJaNameToSlugMap()
  console.log(`Loaded ${jaNameToSlug.size} Japanese name mappings`)

  // Step 2: Scrape all three sources in parallel
  const [serebiiList, game8Result, gameWithResult, g8HabitatConditions] = await Promise.all([
    scrapeSerebiiList().catch((err) => {
      console.error(`Failed to scrape Serebii list: ${err.message}`)
      return []
    }),
    scrapeGame8().catch((err) => {
      console.error(`Failed to scrape Game8: ${err.message}`)
      return { pokemonData: new Map(), habitatImageMap: new Map() }
    }),
    scrapeGameWith(jaNameToSlug).catch((err) => {
      console.error(`Failed to scrape GameWith: ${err.message}`)
      return { pokemonData: new Map(), habitatItemsMap: new Map() }
    }),
    scrapeGame8HabitatConditions().catch((err) => {
      console.error(`Failed to scrape Game8 habitat conditions: ${err.message}`)
      return new Map()
    }),
  ])

  const game8Data = game8Result.pokemonData
  const gameWithData = gameWithResult.pokemonData
  const gameWithHabitatItems = gameWithResult.habitatItemsMap
  const habitatImageMap = game8Result.habitatImageMap

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

  // Step 4: Build unified slug list from all three sources (union)
  const allSlugs = new Map() // slug → { dexNumber, detailUrl, source }

  // Serebii first (has dexNumber + detailUrl)
  for (const entry of serebiiList) {
    allSlugs.set(entry.slug, {
      dexNumber: entry.dexNumber,
      detailUrl: entry.detailUrl,
      name: entry.name,
      source: "serebii",
    })
  }

  // GameWith: add entries Serebii doesn't have
  for (const [slug, gw] of gameWithData) {
    if (!allSlugs.has(slug)) {
      allSlugs.set(slug, {
        dexNumber: gw.dexNumber,
        detailUrl: null,
        name: gw.name,
        source: "gamewith",
      })
    }
  }

  // Game8: add entries neither has
  for (const [slug, g8] of game8Data) {
    if (!allSlugs.has(slug)) {
      allSlugs.set(slug, {
        dexNumber: null,
        detailUrl: null,
        name: g8.name,
        source: "game8",
      })
    }
  }

  console.log(`\nUnified list: ${allSlugs.size} Pokémon (Serebii: ${serebiiList.length}, GameWith: ${gameWithData.size}, Game8: ${game8Data.size})`)

  // Build lookup from serebii list
  const serebiiBySlug = new Map()
  for (const entry of serebiiList) {
    serebiiBySlug.set(entry.slug, entry)
  }

  // Step 4b: Build global habitat ID → EN name mapping
  // Cross-reference GameWith (has IDs) with Game8 (has English names) across all Pokemon
  // Most reliable: Pokemon with exactly 1 habitat in both sources → 1:1 mapping
  // Then: Pokemon with same count → positional mapping
  const habitatIdToEnVotes = new Map() // id → Map<enName, count>
  for (const [slug, gw] of gameWithData) {
    const g8 = game8Data.get(slug)
    if (!g8 || !gw.habitats?.length || !g8.habitats?.length) continue

    if (gw.habitats.length === 1 && g8.habitats.length === 1) {
      // 1:1 — most reliable
      const id = gw.habitats[0].id
      const enName = g8.habitats[0]
      if (!habitatIdToEnVotes.has(id)) habitatIdToEnVotes.set(id, new Map())
      const votes = habitatIdToEnVotes.get(id)
      votes.set(enName, (votes.get(enName) || 0) + 10) // high weight for 1:1
    } else if (gw.habitats.length === g8.habitats.length) {
      // Same count — positional mapping
      for (let i = 0; i < gw.habitats.length; i++) {
        const id = gw.habitats[i].id
        const enName = g8.habitats[i]
        if (!habitatIdToEnVotes.has(id)) habitatIdToEnVotes.set(id, new Map())
        const votes = habitatIdToEnVotes.get(id)
        votes.set(enName, (votes.get(enName) || 0) + 1)
      }
    }
  }
  // Pick the highest-voted EN name for each habitat ID
  for (const [id, votes] of habitatIdToEnVotes) {
    const idStr = String(id)
    if (habitatMappings.en[idStr]) continue // Serebii EN name takes priority
    let bestName = null
    let bestCount = 0
    for (const [name, count] of votes) {
      if (count > bestCount) {
        bestName = name
        bestCount = count
      }
    }
    if (bestName) habitatMappings.en[idStr] = bestName
  }
  console.log(`Built EN habitat mapping: ${Object.keys(habitatMappings.en).length} entries (from voting across ${habitatIdToEnVotes.size} habitats)`)

  // Stats tracking
  let updated = 0
  let skipped = 0
  let newPokemon = 0
  let errors = 0
  const newHabitats = []
  const habitatIdToImageUrl = new Map() // habitat ID → Game8 image URL

  // Step 5: Filter to Pokemon that need processing
  const toProcess = []
  for (const [slug, meta] of allSlugs) {
    const existingLocales = existingPokemon.get(slug)
    const existingEn = existingLocales?.en
    if (!FORCE && existingEn && isPokopiaDataComplete(existingEn)) {
      skipped++
      continue
    }
    toProcess.push({ slug, meta, serebiiEntry: serebiiBySlug.get(slug) || null })
  }

  console.log(`\nProcessing ${toProcess.length} Pokémon (skipped ${skipped} already complete)`)

  // Phase 1: Concurrent fetching — Serebii details, new Pokemon base data, evolution data, image uploads
  const SEREBII_CONCURRENCY = 5
  const POKEAPI_CONCURRENCY = 10

  // 1a. Fetch all Serebii detail pages concurrently
  const serebiiDetailMap = new Map()
  const serebiiToFetch = toProcess.filter((p) => p.serebiiEntry?.detailUrl)
  console.log(`Fetching ${serebiiToFetch.length} Serebii detail pages (concurrency: ${SEREBII_CONCURRENCY})...`)
  await pMap(
    serebiiToFetch,
    async ({ slug, meta, serebiiEntry }) => {
      try {
        const detail = await scrapeSerebiiDetail(serebiiEntry.detailUrl)
        serebiiDetailMap.set(slug, detail)
      } catch (err) {
        console.error(`  Failed Serebii detail for ${meta.name}: ${err.message}`)
        errors++
      }
    },
    SEREBII_CONCURRENCY
  )

  // 1b. Fetch new Pokemon base data + evolution data concurrently
  const newPokemonToFetch = toProcess.filter((p) => !existingPokemon.get(p.slug)?.en)
  if (newPokemonToFetch.length > 0) {
    console.log(`Fetching ${newPokemonToFetch.length} new Pokémon from PokeAPI...`)
    await pMap(
      newPokemonToFetch,
      async ({ slug, meta }) => {
        const { dexNumber, name } = meta
        if (!dexNumber) {
          console.log(`  Skipping new Pokémon without dex number: ${name}`)
          errors++
          return
        }
        try {
          const baseData = await fetchNewPokemonBase(slug, dexNumber)
          for (const locale of LOCALES) {
            const dir = path.join(CONTENT_DIR, locale, "pokemon")
            await fs.mkdir(dir, { recursive: true })
          }
          existingPokemon.set(slug, {
            ...existingPokemon.get(slug),
            ...Object.fromEntries(LOCALES.map((l) => [l, baseData[l]])),
          })
          newPokemon++
        } catch (err) {
          console.error(`  Failed base data for ${name}: ${err.message}`)
          errors++
        }
      },
      POKEAPI_CONCURRENCY
    )
  }

  // 1c. Fetch evolution data concurrently (all in --force mode, otherwise only missing)
  const needEvolution = toProcess.filter((p) => {
    if (FORCE) return true
    const en = existingPokemon.get(p.slug)?.en
    return !en?.pokopia?.evolvesFrom && !en?.pokopia?.evolvesTo
  })
  const evolutionMap = new Map()
  if (needEvolution.length > 0) {
    console.log(`Fetching evolution data for ${needEvolution.length} Pokémon...`)
    await pMap(
      needEvolution,
      async ({ slug }) => {
        try {
          const evo = await getEvolutionData(slug)
          evolutionMap.set(slug, evo)
        } catch {
          // Ignore evolution errors
        }
      },
      POKEAPI_CONCURRENCY
    )
  }

  // 1d. Upload images concurrently
  if (!DRY_RUN) {
    console.log(`Uploading missing images for ${toProcess.length} Pokémon...`)
    await pMap(
      toProcess,
      async ({ slug }) => {
        await uploadPokemonImage(slug)
      },
      POKEAPI_CONCURRENCY
    )
  }

  // Phase 2: Merge data and collect EN habitat names
  console.log(`\nMerging data...`)
  const mergedResults = []
  for (const { slug, meta, serebiiEntry } of toProcess) {
    const { dexNumber, name } = meta
    const existingEn = existingPokemon.get(slug)?.en
    if (!existingEn) {
      // New Pokemon that failed to fetch — skip
      if (!existingPokemon.get(slug)?.en) continue
    }

    const serebiiDetail = serebiiDetailMap.get(slug) || null
    const g8 = game8Data.get(slug) || null
    const gw = gameWithData.get(slug) || null

    // Merge pokopia data from all sources
    const existingPokopia = existingEn?.pokopia || null
    const merged = mergePokopiaData(existingPokopia, serebiiDetail, g8, serebiiEntry || null, gw)

    // Collect EN habitat names from Serebii (authoritative: has ID + English name)
    if (serebiiDetail?.habitats) {
      for (const h of serebiiDetail.habitats) {
        if (h.id != null && h.name) {
          habitatMappings.en[String(h.id)] = h.name
        }
      }
    }

    // Correlate Game8 habitat names with merged habitat IDs
    if (g8 && g8.habitats.length > 0 && merged.habitats.length > 0) {
      // Direct name matching
      for (const mergedH of merged.habitats) {
        const mergedNameLower = mergedH.name.toLowerCase().trim()
        for (const g8Name of g8.habitats) {
          const g8NameLower = g8Name.toLowerCase().trim()
          if (g8NameLower === mergedNameLower) {
            if (!habitatIdToImageUrl.has(mergedH.id)) {
              const url = habitatImageMap.get(g8NameLower)
              if (url) habitatIdToImageUrl.set(mergedH.id, url)
            }
            // Game8 name is English — use as EN mapping if not already set by Serebii
            if (!habitatMappings.en[String(mergedH.id)]) {
              habitatMappings.en[String(mergedH.id)] = g8Name
            }
            break
          }
        }
      }
      // Positional matching when counts are equal
      if (g8.habitats.length === merged.habitats.length) {
        for (let i = 0; i < merged.habitats.length; i++) {
          const hId = merged.habitats[i].id
          const g8Name = g8.habitats[i]
          const g8NameLower = g8Name.toLowerCase().trim()
          if (!habitatIdToImageUrl.has(hId)) {
            const url = habitatImageMap.get(g8NameLower)
            if (url) habitatIdToImageUrl.set(hId, url)
          }
          if (!habitatMappings.en[String(hId)]) {
            habitatMappings.en[String(hId)] = g8Name
          }
        }
      }
    }

    // Override evolution data (PokeAPI is authoritative when available)
    const evoFromApi = evolutionMap.get(slug)
    const evolutionData = evoFromApi || {
      evolvesFrom: existingEn?.pokopia?.evolvesFrom ?? null,
      evolvesTo: existingEn?.pokopia?.evolvesTo ?? null,
    }
    if (evoFromApi || merged.evolvesFrom === null) {
      merged.evolvesFrom = evolutionData.evolvesFrom
    }
    if (evoFromApi || merged.evolvesTo === null) {
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

    // Store merged data for deferred writing (after all EN names are collected)
    mergedResults.push({ slug, merged })

    updated++
    console.log(
      `  ${name}: ${merged.specialties.join(", ") || "no specialty"} | ` +
        `${merged.habitats.length} habitat(s) | ` +
        `time: ${merged.timeOfDay?.join(", ") || "null"} | ` +
        `weather: ${merged.weather?.join(", ") || "null"}`
    )
  }

  // Phase 3: Write all files (deferred so EN habitat names are fully built)
  if (!DRY_RUN) {
    console.log(`\nWriting ${mergedResults.length} Pokémon files...`)
    for (const { slug, merged } of mergedResults) {
      for (const locale of LOCALES) {
        const pokemonData = existingPokemon.get(slug)?.[locale]
        if (!pokemonData) continue

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
  }

  // Collect all unique habitat IDs and download missing images
  const allHabitatIds = new Set()
  for (const { merged } of mergedResults) {
    for (const h of merged.habitats) {
      if (h.id != null) allHabitatIds.add(h.id)
    }
  }
  await downloadMissingHabitatImages(allHabitatIds, habitatIdToImageUrl)

  // Generate habitat materials files
  if (!DRY_RUN) {
    console.log("\n--- Generating Habitat Materials ---")

    // Build JA materials: habitat ID → "item1 x count1, item2 x count2"
    const materialsJa = {}
    for (const [hId, items] of gameWithHabitatItems) {
      const parts = items.map((item) => `${item.name} x${item.count}`)
      materialsJa[hId] = parts.join(", ")
    }

    // Build EN materials: match via habitat-mapping-en.json → Game8 conditions
    const materialsEn = {}
    // Build reverse map: lowercase EN name → habitat ID
    const enNameToId = new Map()
    for (const [id, name] of Object.entries(habitatMappings.en)) {
      enNameToId.set(name.toLowerCase().trim(), id)
    }

    // Match Game8 conditions to habitat IDs
    for (const [g8Name, condText] of g8HabitatConditions) {
      const hId = enNameToId.get(g8Name)
      if (hId) {
        // Extract only the conditions part (between "Conditions:" and "Pokemon Available:")
        const condMatch = condText.match(/Conditions:\s*([\s\S]*?)(?:\s*Pokemon Available:|$)/i)
        const cleaned = condMatch ? condMatch[1].replace(/\s+/g, " ").trim() : condText.replace(/\s+/g, " ").trim()
        if (cleaned) {
          materialsEn[hId] = cleaned
        }
      }
    }

    // Fallback: for habitats with JA materials but no EN match, leave empty (JA fallback in frontend)
    console.log(`  JA materials: ${Object.keys(materialsJa).length} habitats`)
    console.log(`  EN materials: ${Object.keys(materialsEn).length} habitats (from Game8 conditions)`)

    await writeJson(path.join(CONTENT_DIR, "habitat-materials.json"), materialsJa)
    await writeJson(path.join(CONTENT_DIR, "habitat-materials-en.json"), materialsEn)
    await writeJson(path.join(CONTENT_DIR, "habitat-materials-zh.json"), {})
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
      total: allSlugs.size,
      serebiiCount: serebiiList.length,
      gameWithCount: gameWithData.size,
      game8Count: game8Data.size,
      updated,
      skipped,
      newPokemon,
      errors,
    },
  }
  if (!DRY_RUN) {
    await saveSyncState(newState)
    await saveHabitatMappings(habitatMappings)
    console.log(`Saved EN habitat mapping: ${Object.keys(habitatMappings.en).length} entries`)
  }

  console.log("\n--- Summary ---")
  console.log(`Unified total: ${allSlugs.size} (Serebii: ${serebiiList.length}, GameWith: ${gameWithData.size}, Game8: ${game8Data.size})`)
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
