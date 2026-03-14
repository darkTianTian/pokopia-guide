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
const GAME8_HABITAT_LIST_URL = "https://game8.co/games/Pokemon-Pokopia/archives/582463"
const GAMEWITH_URL = "https://gamewith.jp/pocoapokemon/530830"
const CONTENT_DIR = path.join(process.cwd(), "content")
const SYNC_STATE_PATH = path.join(CONTENT_DIR, "pokopia-sync-state.json")

const LOCALES = ["en", "zh", "ja", "ko"]

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
  "かんてい": "appraise",
  "はっこう": "illuminate",
  "くいしんぼ": "eat",
  "ペイント": "paint",
  "へんしん": "transform",
  "レアもの": "rarify",
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

const GAMEWITH_WEATHER_MAP = { "晴": "sunny", "曇": "cloudy", "雨": "rainy" }

const ALL_TIMES = ["dawn", "day", "dusk", "night"]
const ALL_WEATHERS = ["sunny", "cloudy", "rainy"]

const GAMEWITH_RARITY_MAP = { 0: "common", 1: "common", 2: "rare", 3: "very-rare" }

// Known valid specialties in the game
// Multi-word specialties use spaces (matching Serebii), icons use hyphenated filenames
const VALID_SPECIALTIES = new Set([
  "grow", "burn", "water", "fly", "search", "chop", "build", "crush",
  "bulldoze", "trade", "generate", "explode", "hype", "gather", "paint",
  "eat", "teleport", "illuminate", "transform", "recycle", "appraise",
  "litter", "sing", "cool", "spark", "psychic", "dig", "cut", "swim",
  "yawn", "gather honey", "dream island", "storage", "rarify",
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

// Normalize Game8 favorites typos/variations to canonical keys
const FAVORITES_NORMALIZE_MAP = {
  "cleanlines": "cleanliness",
  "dry  flavors": "dry flavors",
  "dryflavors": "dry flavors",
  "group activiies": "group activities",
  "group activites": "group activities",
  "group activities: sweet flavors": "group activities",
  "looks like good": "looks like food",
  "prety flowers": "pretty flowers",
  "soft stuff": "soft stuff",
  "stone stuff": "stone stuff",
  "strange sutff": "strange stuff",
  "sweeet flavors": "sweet flavors",
  "sweet falvors": "sweet flavors",
}

function normalizeFavorite(raw) {
  const lower = raw.trim().toLowerCase()
  if (lower === "none" || lower === "tbd" || !lower) return null
  return FAVORITES_NORMALIZE_MAP[lower] || lower
}

// --- CLI args ---

const args = process.argv.slice(2)
const FORCE = args.includes("--force")
const WATCH = args.includes("--watch")
const DRY_RUN = args.includes("--dry-run")
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

    // Parse favorites (comma-separated, with typo normalization)
    const favorites = []
    if (item.favorites) {
      for (const f of item.favorites.split(",")) {
        const normalized = normalizeFavorite(f)
        if (normalized) favorites.push(normalized)
      }
    }

    results.set(slug, {
      name: pokemonName,
      slug,
      habitats: habitatNames,
      timeOfDay: times && times.length > 0 ? times : null,
      weather: weathers && weathers.length > 0 ? weathers : null,
      specialties,
      favorites,
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

      conditions.set(habitatName.toLowerCase().replace(/\s+/g, " ").trim(), condText)
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
        conditions.set(headingText.toLowerCase().replace(/\s+/g, " ").trim(), text)
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
  return { pokemonData: results, habitatItemsMap, habitatNameMapJa: habitatIdToName }
}

// --- Habitat Name Localization ---

async function loadHabitatMappings() {
  const en = (await loadJson(path.join(CONTENT_DIR, "habitat-mapping-en.json"))) || {}
  const ja = (await loadJson(path.join(CONTENT_DIR, "habitat-mapping.json"))) || {}
  const zh = (await loadJson(path.join(CONTENT_DIR, "habitat-mapping-zh.json"))) || {}
  const ko = (await loadJson(path.join(CONTENT_DIR, "habitat-mapping-ko.json"))) || {}
  return { en, ja, zh, ko }
}

async function saveHabitatMappings(mappings) {
  await writeJson(path.join(CONTENT_DIR, "habitat-mapping-en.json"), mappings.en)
  await writeJson(path.join(CONTENT_DIR, "habitat-mapping.json"), mappings.ja)
  await writeJson(path.join(CONTENT_DIR, "habitat-mapping-zh.json"), mappings.zh)
  await writeJson(path.join(CONTENT_DIR, "habitat-mapping-ko.json"), mappings.ko)
}

function getLocalizedHabitatName(habitat, locale, mappings) {
  const idStr = String(habitat.id)
  if (locale === "en" && mappings.en[idStr]) return mappings.en[idStr]
  if (locale === "ja" && mappings.ja[idStr]) return mappings.ja[idStr]
  if (locale === "zh" && mappings.zh[idStr]) return mappings.zh[idStr]
  if (locale === "ko" && mappings.ko[idStr]) return mappings.ko[idStr]
  // Fallback: use whatever name we have
  return habitat.name
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

  // Habitats: GameWith as base, then merge in Serebii and existing data to avoid losing habitats
  let habitats = existing.habitats || []
  if (gameWithData?.habitats?.length > 0) {
    habitats = mergeHabitats(habitats, gameWithData.habitats)
  }
  if (serebiiDetail?.habitats?.length > 0) {
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

  // Favorites: Game8 is the only source
  let favorites = existing.favorites || []
  if (game8Data?.favorites?.length > 0) {
    favorites = game8Data.favorites
  }

  // obtainMethod, evolution, category, obtainDetails: keep existing if present
  const obtainMethod = existing.obtainMethod || "habitat"
  const evolvesFrom = existing.evolvesFrom !== undefined ? existing.evolvesFrom : null
  const evolvesTo = existing.evolvesTo !== undefined ? existing.evolvesTo : null
  const category = existing.category || null
  const obtainDetails = existing.obtainDetails || null

  return {
    specialties,
    favorites,
    timeOfDay: timeOfDay || null,
    weather: weather || null,
    obtainMethod,
    evolvesFrom,
    evolvesTo,
    habitats,
    ...(category && { category }),
    ...(obtainDetails && { obtainDetails }),
  }
}



// --- Habitat Image Downloader ---

const HABITATS_DIR = path.join(process.cwd(), "public", "images", "habitats")
const GAMEWITH_HABITAT_IMG_BASE = "https://img.gamewith.jp/article_tools/pocoapokemon/gacha"

async function downloadMissingHabitatImages(allHabitatIds, habitatIdToImageUrl) {
  console.log("\n--- Downloading Missing Habitat Images ---")

  // Check which images are missing or are placeholder images
  const PLACEHOLDER_SIZES = new Set([
    4701973, // known "COMING SOON" placeholder file size
    1769, // auto-generated "?" placeholder
  ])
  const missing = []
  for (const id of allHabitatIds) {
    const filePath = path.join(HABITATS_DIR, `habitat_${id}.png`)
    try {
      const stat = await fs.stat(filePath)
      // Treat placeholder images as missing
      if (PLACEHOLDER_SIZES.has(stat.size)) {
        missing.push(id)
      }
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
        // Retry up to 3 times with delay for transient 403s
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            if (attempt > 0) await new Promise((r) => setTimeout(r, 2000 * attempt))
            const res = await fetch(url, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "image/png,image/*,*/*",
              },
            })
            if (res.status === 403 && attempt < 2) continue // retry on 403
            if (!res.ok) break // skip to next URL on other errors

            const buffer = Buffer.from(await res.arrayBuffer())
            if (buffer.length < 1024) {
              tooSmall++
              break
            }

            const filePath = path.join(HABITATS_DIR, `habitat_${id}.png`)
            await fs.writeFile(filePath, buffer)
            console.log(`  Downloaded habitat_${id}.png (${buffer.length} bytes)`)
            downloaded++
            return
          } catch {
            if (attempt === 2) break
          }
        }
      }
      console.log(`  Failed habitat_${id}.png`)
      failed++
    },
    3
  )

  console.log(`\n  Habitat images: ${downloaded} downloaded, ${failed} failed, ${tooSmall} too small`)
}

// --- Cooking Recipe Icon Downloader ---

const COOKING_RECIPES_DIR = path.join(process.cwd(), "public", "images", "cooking", "recipes")
const SEREBII_COOKING_URL = `${SEREBII_BASE}/pokemonpokopia/cooking.shtml`

// Map our recipe IDs to known Serebii filenames (static fallback)
const COOKING_ICON_STATIC_MAP = {
  "plain-salad": "simplesalad",
  "leppa-salad": "leppasalad",
  "seaweed-salad": "seaweedsalad",
  "shredded-salad": "shreddedsalad",
  "mashed-salad": "crushed-berrysalad",
  "crouton-salad": "croutonsalad",
  "plain-soup": "simplesoup",
  "seaweed-soup": "seaweedsoup",
  "mushroom-soup": "mushroomsoup",
  "electric-soup": "electrifyingsoup",
  "herbal-soup": "healthysoup",
  "mixed-soup": "flavorfulsoup",
  "plain-bread": "simplebread",
  "leppa-bread": "leppabread",
  "carrot-bread": "carrotbread",
  "recycled-bread": "recycledbread",
  "fluffy-bread": "fluffybread",
  "stew-bread": "breadbowl",
  "plain-hamburger": "simplehamburgersteak",
  "mushroom-hamburger": "mushroomhamburgersteak",
  "tomato-hamburger": "tomatohamburgersteak",
  "potato-hamburger": "potatohamburgersteak",
  "mature-hamburger": "maturehamburgersteak",
  "colorful-hamburger": "colorfulhamburgersteak",
}

// Known Serebii 404 placeholder hash (md5) — skip files matching this
const SEREBII_404_SIZE = 36068

async function downloadMissingCookingIcons() {
  console.log("\n--- Downloading Missing Cooking Recipe Icons ---")

  const recipesPath = path.join(CONTENT_DIR, "cooking-recipes.json")
  let recipes
  try {
    recipes = JSON.parse(await fs.readFile(recipesPath, "utf-8"))
  } catch {
    console.log("  cooking-recipes.json not found, skipping.")
    return
  }

  // Find missing icons
  const missing = []
  for (const recipe of recipes) {
    const filePath = path.join(COOKING_RECIPES_DIR, `${recipe.id}.png`)
    try {
      await fs.stat(filePath)
    } catch {
      missing.push(recipe.id)
    }
  }

  if (missing.length === 0) {
    console.log(`  All ${recipes.length} cooking recipe icons exist.`)
    return
  }

  console.log(`  Missing: ${missing.length} / ${recipes.length} (${missing.join(", ")})`)

  if (DRY_RUN) {
    for (const id of missing) {
      console.log(`  [DRY RUN] ${id}.png`)
    }
    return
  }

  // Also scrape the cooking page for any new filenames we don't know about
  let scrapedMap = new Map()
  try {
    const html = await fetchHtml(SEREBII_COOKING_URL)
    const $ = cheerio.load(html)
    $("img[src*='items/']").each((_, el) => {
      const src = $(el).attr("src")
      if (src) {
        // Extract filename without extension: "items/simplesalad.png" → "simplesalad"
        const match = src.match(/items\/([^.]+)\.png/)
        if (match) {
          // Find the recipe name in the same row
          const row = $(el).closest("tr")
          const nameCell = row.find("td").eq(1).text().trim().toLowerCase()
          scrapedMap.set(match[1], nameCell)
        }
      }
    })
    console.log(`  Scraped ${scrapedMap.size} recipe images from Serebii cooking page.`)
  } catch (err) {
    console.log(`  Could not scrape Serebii cooking page: ${err.message}`)
  }

  await fs.mkdir(COOKING_RECIPES_DIR, { recursive: true })

  let downloaded = 0
  let failed = 0

  await pMap(
    missing,
    async (id) => {
      // Try static map first, then guess common patterns
      const candidates = []
      if (COOKING_ICON_STATIC_MAP[id]) {
        candidates.push(COOKING_ICON_STATIC_MAP[id])
      }
      // Also try the ID directly with no hyphens
      candidates.push(id.replace(/-/g, ""))

      for (const filename of candidates) {
        const url = `${SEREBII_BASE}/pokemonpokopia/items/${filename}.png`
        try {
          const res = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "image/png,image/*,*/*",
            },
          })
          if (!res.ok) continue

          const buffer = Buffer.from(await res.arrayBuffer())
          // Skip if it's the Serebii 404 placeholder (all same size)
          if (buffer.length === SEREBII_404_SIZE || buffer.length < 1024) continue

          const filePath = path.join(COOKING_RECIPES_DIR, `${id}.png`)
          await fs.writeFile(filePath, buffer)
          console.log(`  Downloaded ${id}.png (${buffer.length} bytes)`)
          downloaded++
          return
        } catch {
          // try next candidate
        }
      }
      console.log(`  Not available yet: ${id}.png`)
      failed++
    },
    3
  )

  console.log(`\n  Cooking icons: ${downloaded} downloaded, ${failed} not yet available`)
}

// --- Crafting Recipe Icons ---

const CRAFTING_RECIPES_DIR = path.join(process.cwd(), "public", "images", "crafting")

// Map our recipe IDs to known Serebii filenames (some differ from our IDs)
const CRAFTING_ICON_STATIC_MAP = {
  "storage-box": "storagebox",
  "big-storage-box": "bigstoragebox",
  "straw-table": "strawtable",
  "log-table": "logtable",
  "display-stand": "exhibitionstand",
  "log-chair": "logchair",
  "straw-stool": "strawstool",
  "iron-table": "irontable",
  "iron-stand": "ironstand",
  "iron-chair": "ironchair",
  "wooden-bench": "woodenbench",
  "straw-bed": "strawbed",
  "wooden-bed": "plainbed",
  "industrial-bed": "industrialbed",
  "flower-vase": "smallvase",
  "mug": "mug",
  "basket": "picnicbasket",
  "party-platter": "partyplatter",
  "wooden-plate": "woodenplate",
  "first-aid-kit": "firstaidkit",
  "party-wall-decoration": "partybunting",
  "vine-wall-decoration": "flowergarland",
  "campfire": "campfire",
  "lucky-topiary": "chanseyplant",
  "water-barrel": "barrel",
  "firework-launcher": "cannon",
  "gravestone": "gravestone",
  "wooden-birdhouse": "woodenbirdhouse",
  "perch": "perch",
  "sign": "sign",
  "information-board": "informationboard",
  "fire-hydrant": "firehydrant",
  "ditto-flag": "dittoflag",
  "workbench": "workbench",
  "cooking-pot": "cookingstove",
  "frying-pan": "fryingpan",
  "cutting-board": "cuttingboard",
  "picture-frame": "blankcanvas",
  "shared-box": "plainchest",
  "bread-oven": "breadoven",
  "furnace": "furnacekit",
  "rail-track": "railtrack",
  "crossing-gate": "crossinggate",
  "mine-cart": "cart",
  "stone-stairs": "stonestairs",
  "wooden-stairs": "woodenstairs",
  "mushroom-lamp": "seedotlamp",
  "mushroom-streetlight": "mushroomstreetlight",
  "sprinkler": "sprinkler",
  "wire": "jumbledcords",
  "pulley": "pulley",
  "wooden-cross-door": "woodencrossdoor",
  "smooth-awning": "smoothawning",
  "wooden-partition-straight": "woodenpartitionstraight",
  "wooden-partition-corner": "woodenpartitioncorner",
  "dock-board": "dockboard",
  "horizontal-log": "horizontallog",
  "vertical-log": "verticallog",
  "house-partition": "housepartition",
  "grass-flooring": "grassflooring",
  "puffy-tree-pillar": "puffytreepillar",
  "stone-pillar-middle": "stonepillarmiddle",
  "stone-pillar-top": "stonepillartop",
  "marble-floor": "marblefloor",
  "stone-line-floor": "stonelinefloor",
  "simple-square-tile": "simplesquaretile",
  "stone-tiling": "stonetiling",
  "firework-white": "fireworkwhite",
  "firework-blue": "fireworkblue",
  "firework-yellow": "fireworkyellow",
  "firework-green": "fireworkgreen",
  "firework-red": "fireworkred",
}

async function downloadMissingCraftingIcons() {
  console.log("\n--- Downloading Missing Crafting Recipe Icons ---")

  const recipesPath = path.join(CONTENT_DIR, "crafting-recipes.json")
  let recipes
  try {
    recipes = JSON.parse(await fs.readFile(recipesPath, "utf-8"))
  } catch {
    console.log("  crafting-recipes.json not found, skipping.")
    return
  }

  const missing = []
  for (const recipe of recipes) {
    const filePath = path.join(CRAFTING_RECIPES_DIR, `${recipe.id}.png`)
    try {
      await fs.stat(filePath)
    } catch {
      missing.push(recipe.id)
    }
  }

  if (missing.length === 0) {
    console.log(`  All ${recipes.length} crafting recipe icons exist.`)
    return
  }

  console.log(`  Missing: ${missing.length} / ${recipes.length} (${missing.join(", ")})`)

  if (DRY_RUN) {
    for (const id of missing) {
      console.log(`  [DRY RUN] ${id}.png`)
    }
    return
  }

  await fs.mkdir(CRAFTING_RECIPES_DIR, { recursive: true })

  let downloaded = 0
  let failed = 0

  await pMap(
    missing,
    async (id) => {
      const candidates = []
      if (CRAFTING_ICON_STATIC_MAP[id]) {
        candidates.push(CRAFTING_ICON_STATIC_MAP[id])
      }
      candidates.push(id.replace(/-/g, ""))

      for (const filename of candidates) {
        const url = `${SEREBII_BASE}/pokemonpokopia/items/${filename}.png`
        try {
          const res = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "image/png,image/*,*/*",
            },
          })
          if (!res.ok) continue

          const buffer = Buffer.from(await res.arrayBuffer())
          if (buffer.length === SEREBII_404_SIZE || buffer.length < 1024) continue

          const filePath = path.join(CRAFTING_RECIPES_DIR, `${id}.png`)
          await fs.writeFile(filePath, buffer)
          console.log(`  Downloaded ${id}.png (${buffer.length} bytes)`)
          downloaded++
          return
        } catch {
          // try next candidate
        }
      }
      console.log(`  Not available yet: ${id}.png`)
      failed++
    },
    3
  )

  console.log(`\n  Crafting icons: ${downloaded} downloaded, ${failed} not yet available`)
}

// --- Cooking Tool Icons ---

const COOKING_TOOLS_DIR = path.join(process.cwd(), "public", "images", "cooking", "tools")

const COOKING_TOOL_ICON_MAP = {
  "cooking-pot": "cookingstove",
  "frying-pan": "fryingpan",
  "cutting-board": "cuttingboard",
  "bread-oven": "breadoven",
}

async function downloadMissingCookingToolIcons() {
  console.log("\n--- Downloading Missing Cooking Tool Icons ---")

  const missing = []
  for (const toolId of Object.keys(COOKING_TOOL_ICON_MAP)) {
    const filePath = path.join(COOKING_TOOLS_DIR, `${toolId}.png`)
    try {
      await fs.stat(filePath)
    } catch {
      missing.push(toolId)
    }
  }

  if (missing.length === 0) {
    console.log(`  All 4 cooking tool icons exist.`)
    return
  }

  console.log(`  Missing: ${missing.length} / 4 (${missing.join(", ")})`)

  if (DRY_RUN) {
    for (const id of missing) {
      console.log(`  [DRY RUN] ${id}.png`)
    }
    return
  }

  await fs.mkdir(COOKING_TOOLS_DIR, { recursive: true })

  let downloaded = 0
  for (const toolId of missing) {
    const filename = COOKING_TOOL_ICON_MAP[toolId]
    const url = `${SEREBII_BASE}/pokemonpokopia/items/${filename}.png`
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "image/png,image/*,*/*",
        },
      })
      if (!res.ok) {
        console.log(`  Not available yet: ${toolId}.png`)
        continue
      }

      const buffer = Buffer.from(await res.arrayBuffer())
      if (buffer.length === SEREBII_404_SIZE || buffer.length < 1024) {
        console.log(`  Not available yet: ${toolId}.png`)
        continue
      }

      const filePath = path.join(COOKING_TOOLS_DIR, `${toolId}.png`)
      await fs.writeFile(filePath, buffer)
      console.log(`  Downloaded ${toolId}.png (${buffer.length} bytes)`)
      downloaded++
    } catch {
      console.log(`  Not available yet: ${toolId}.png`)
    }
  }

  console.log(`\n  Cooking tool icons: ${downloaded} downloaded, ${missing.length - downloaded} not yet available`)
}

// --- Habitat Material Item Icons ---

const ITEMS_DIR = path.join(process.cwd(), "public", "images", "items")

// Known slug -> serebii filename mappings (where they differ from simple hyphen removal)
const ITEM_ICON_STATIC_MAP = {
  "afternoon-tea-set": "afternoonteaset",
  "alarm-clock": "alarmclock",
  "arcanine-doll": "arcaninedoll",
  "armor-fossil": "armorfossil",
  "arrow-sign": "arrowsign",
  "beach-chair": "beachchair",
  "beach-parasol": "beachparasol",
  "berry-basket": "berrybasket",
  "big-drum": "bigdrum",
  "boo-in-the-box": "boo-in-the-box",
  "cardboard-boxes": "cardboardboxes",
  "castform-weather-charm-rain": "castformweathercharm",
  "castform-weather-charm-sun": "castformweathercharm",
  "cd-player": "cdplayer",
  "chansey-plant": "chanseyplant",
  "chic-sofa": "chicsofa",
  "chocolate-cookies": "chocolatecookies",
  "concrete-pipe": "concretepipe",
  "control-unit": "controlunit",
  "cooking-stove": "cookingstove",
  "crossing-gate": "crossinggate",
  "crystal-ball": "crystalball",
  "cutting-board": "cuttingboard",
  "dragonite-doll": "dragonitedoll",
  "eerie-candle": "eeriecandle",
  "eevee-doll": "eeveedoll",
  "excavation-tools": "excavationtools",
  "first-aid-kit": "firstaidkit",
  "fishing-rod": "fishingrod",
  "food-counter": "foodcounter",
  "fried-potatoes": "friedpotatoes",
  "garbage-bags": "garbagebags",
  "garbage-bin": "garbagebin",
  "garden-chair": "gardenchair",
  "hanging-scroll": "hangingscroll",
  "hot-spring-spout": "hot-springspout",
  "iron-pipes": "ironpipes",
  "jumbled-cords": "jumbledcords",
  "knitting-supplies": "knittingsupplies",
  "log-chair": "logchair",
  "log-table": "logtable",
  "luxury-sofa": "luxurysofa",
  "magazine-rack": "magazinerack",
  "menu-board": "menuboard",
  "metal-drum": "metaldrum",
  "modern-sink": "modernsink",
  "moonlight-dance-statue": "moonlightdancestatuekit",
  "office-chair": "officechair",
  "office-desk": "officedesk",
  "office-locker": "officelocker",
  "office-shelf": "officeshelf",
  "paper-party-cups": "paperpartycups",
  "pedestal-exhibition-stand": "exhibitionstand",
  "pencil-holder": "pencilholder",
  "picnic-basket": "picnicbasket",
  "pikachu-doll": "pikachudoll",
  "pikachu-sofa": "pikachusofa",
  "plain-bed": "plainbed",
  "plain-sofa": "plainsofa",
  "plain-table": "plaintable",
  "punching-bag": "punchingbag",
  "punching-game": "punchinggame",
  "railway-track": "railtrack",
  "ribbon-cake": "ribboncake",
  "science-experiment": "scienceexperiment",
  "seat-wide": "woodenbench",
  "shaved-ice": "shavedice",
  "ship-s-wheel": "ship'swheel",
  "slender-candle": "slendercandle",
  "small-stage": "smallstage",
  "small-vase": "smallvase",
  "smooth-rock": "smoothrock",
  "soda-float": "sodafloat",
  "standing-mic": "standingmic",
  "step-stool": "stepstool",
  "stone-fireplace": "stonefireplace",
  "straw-bed": "strawbed",
  "straw-stool": "strawstool",
  "straw-table": "strawtable",
  "stylish-cooking-pot": "cookingstove",
  "team-rocket-wall-hanging": "teamrocketwallhanging",
  "tire-toy": "tiretoy",
  "towel-rack": "towelrack",
  "vending-machine": "vendingmachine",
  "wall-mirror": "wallmirror",
  "wooden-birdhouse": "woodenbirdhouse",
  "wooden-crate": "woodencrate",
}

function toSlug(name) {
  return name.toLowerCase().replace(/[()]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function parseMaterialString(str) {
  return str.split(",").map((p) => p.trim()).filter(Boolean).map((p) => {
    const m = p.match(/^(.+?)\s+x(\d+)$/)
    return m ? m[1].trim() : p.trim()
  })
}

async function downloadMissingItemIcons() {
  console.log("\n--- Downloading Missing Item Icons ---")

  const materialsPath = path.join(CONTENT_DIR, "habitat-materials-en.json")
  let materialsData
  try {
    materialsData = JSON.parse(await fs.readFile(materialsPath, "utf-8"))
  } catch {
    console.log("  habitat-materials-en.json not found, skipping.")
    return
  }

  // Collect all unique non-wildcard item slugs
  const slugs = new Set()
  for (const str of Object.values(materialsData)) {
    for (const name of parseMaterialString(str)) {
      const slug = toSlug(name)
      if (!slug.endsWith("-any")) slugs.add(slug)
    }
  }

  const missing = []
  for (const slug of slugs) {
    const filePath = path.join(ITEMS_DIR, `${slug}.png`)
    try {
      await fs.stat(filePath)
    } catch {
      missing.push(slug)
    }
  }

  if (missing.length === 0) {
    console.log(`  All ${slugs.size} item icons exist.`)
    return
  }

  console.log(`  Missing: ${missing.length} / ${slugs.size}`)

  if (DRY_RUN) {
    for (const slug of missing) {
      console.log(`  [DRY RUN] ${slug}.png`)
    }
    return
  }

  await fs.mkdir(ITEMS_DIR, { recursive: true })

  let downloaded = 0
  let failed = 0

  await pMap(
    missing,
    async (slug) => {
      const candidates = []
      if (ITEM_ICON_STATIC_MAP[slug]) {
        candidates.push(ITEM_ICON_STATIC_MAP[slug])
      }
      candidates.push(slug.replace(/-/g, ""))

      for (const filename of candidates) {
        const url = `${SEREBII_BASE}/pokemonpokopia/items/${filename}.png`
        try {
          const res = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "image/png,image/*,*/*",
            },
          })
          if (!res.ok) continue

          const buffer = Buffer.from(await res.arrayBuffer())
          if (buffer.length === SEREBII_404_SIZE || buffer.length < 1024) continue

          const filePath = path.join(ITEMS_DIR, `${slug}.png`)
          await fs.writeFile(filePath, buffer)
          console.log(`  Downloaded ${slug}.png (${buffer.length} bytes)`)
          downloaded++
          return
        } catch {
          // try next candidate
        }
      }
      failed++
    },
    3
  )

  console.log(`\n  Item icons: ${downloaded} downloaded, ${failed} not yet available`)
}

// --- Main ---

async function run() {
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
      return { pokemonData: new Map(), habitatItemsMap: new Map(), habitatNameMapJa: new Map() }
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

  // Fill JA habitat mapping from GameWith habitatDatas
  const gameWithJaNames = gameWithResult.habitatNameMapJa
  for (const [idStr, jaName] of gameWithJaNames) {
    if (!habitatMappings.ja[idStr]) {
      habitatMappings.ja[idStr] = jaName
    }
  }
  console.log(`JA habitat mapping: ${Object.keys(habitatMappings.ja).length} entries (after GameWith fill)`)

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

  // Fill ZH and KO mappings with EN names as fallback
  for (const [idStr, enName] of Object.entries(habitatMappings.en)) {
    if (!habitatMappings.zh[idStr]) {
      habitatMappings.zh[idStr] = enName
    }
    if (!habitatMappings.ko[idStr]) {
      habitatMappings.ko[idStr] = enName
    }
  }
  console.log(`ZH habitat mapping: ${Object.keys(habitatMappings.zh).length} entries (after EN fallback fill)`)
  console.log(`KO habitat mapping: ${Object.keys(habitatMappings.ko).length} entries (after EN fallback fill)`)

  // Stats tracking
  let updated = 0
  let skipped = 0
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

  // Phase 1: Fetch Serebii detail pages concurrently
  const SEREBII_CONCURRENCY = 5

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
        `weather: ${merged.weather?.join(", ") || "null"} | ` +
        `favs: ${merged.favorites?.length || 0}`
    )
  }

  // Manually-verified habitat entries that sources sometimes omit.
  // Key = pokemon slug, value = array of habitat objects to always include.
  const POKEMON_HABITAT_PRESERVES = {
    toxtricity: [{ id: 190, name: "Low-Key Rock Stage", rarity: "common" }],
  }

  // Phase 3: Write all files (deferred so EN habitat names are fully built)
  if (!DRY_RUN) {
    console.log(`\nWriting ${mergedResults.length} Pokémon files...`)
    for (const { slug, merged } of mergedResults) {
      for (const locale of LOCALES) {
        const pokemonData = existingPokemon.get(slug)?.[locale]
        if (!pokemonData) continue

        // Merge in manually-preserved habitats that sources may omit
        const preservedHabitats = POKEMON_HABITAT_PRESERVES[slug] || []
        const existingIds = new Set(merged.habitats.map((h) => h.id))
        const mergedHabitats = [
          ...merged.habitats,
          ...preservedHabitats.filter((h) => !existingIds.has(h.id)),
        ]

        const localizedHabitats = mergedHabitats.map((h) => ({
          ...h,
          name: getLocalizedHabitatName(h, locale, habitatMappings),
        }))

        // Preserve locale-specific hand-curated fields
        const localePokopia = pokemonData.pokopia || {}
        const updatedData = {
          ...pokemonData,
          pokopia: {
            ...merged,
            habitats: localizedHabitats,
            ...(localePokopia.category && { category: localePokopia.category }),
            ...(localePokopia.obtainDetails && { obtainDetails: localePokopia.obtainDetails }),
          },
        }

        const filePath = path.join(CONTENT_DIR, locale, "pokemon", `${slug}.json`)
        await writeJson(filePath, updatedData)
      }
    }
  }

  // Phase 3b: Refresh GameWith data for previously-complete Pokemon that were skipped
  if (!DRY_RUN) {
    const mergedSlugs = new Set(mergedResults.map((r) => r.slug))
    let refreshed = 0

    for (const [slug, locales] of existingPokemon) {
      if (mergedSlugs.has(slug)) continue // already updated in Phase 3
      const gw = gameWithData.get(slug)
      if (!gw) continue

      const en = locales.en
      if (!en?.pokopia) continue

      const existing = en.pokopia

      // Compare habitats/timeOfDay/weather with GameWith authoritative data
      const newHabitats = gw.habitats?.length > 0 ? gw.habitats : null
      const newTimeOfDay = gw.timeOfDay || null
      const newWeather = gw.weather || null

      // Compare favorites with Game8 data
      const g8 = game8Data.get(slug)
      const newFavorites = g8?.favorites?.length > 0 ? g8.favorites : null

      const habitatsChanged =
        newHabitats !== null &&
        JSON.stringify(existing.habitats?.map((h) => h.id).sort()) !==
          JSON.stringify(newHabitats.map((h) => h.id).sort())
      const timeChanged =
        newTimeOfDay !== null &&
        JSON.stringify(existing.timeOfDay) !== JSON.stringify(newTimeOfDay)
      const weatherChanged =
        newWeather !== null &&
        JSON.stringify(existing.weather) !== JSON.stringify(newWeather)
      const favoritesChanged =
        newFavorites !== null &&
        JSON.stringify(existing.favorites || []) !== JSON.stringify(newFavorites)

      if (!habitatsChanged && !timeChanged && !weatherChanged && !favoritesChanged) continue

      // Build updated pokopia data
      const updatedPokopia = {
        ...existing,
        ...(habitatsChanged ? { habitats: newHabitats } : {}),
        ...(timeChanged ? { timeOfDay: newTimeOfDay } : {}),
        ...(weatherChanged ? { weather: newWeather } : {}),
        ...(favoritesChanged ? { favorites: newFavorites } : {}),
      }

      // Write to all locale files
      for (const locale of LOCALES) {
        const pokemonData = locales[locale]
        if (!pokemonData) continue

        // Merge in manually-preserved habitats that sources may omit
        const preservedHabitats = POKEMON_HABITAT_PRESERVES[slug] || []
        const existingIds3b = new Set(updatedPokopia.habitats.map((h) => h.id))
        const mergedHabitats3b = [
          ...updatedPokopia.habitats,
          ...preservedHabitats.filter((h) => !existingIds3b.has(h.id)),
        ]

        const localizedHabitats = mergedHabitats3b.map((h) => ({
          ...h,
          name: getLocalizedHabitatName(h, locale, habitatMappings),
        }))

        // Preserve locale-specific hand-curated fields
        const localePokopia = pokemonData.pokopia || {}
        const updatedData = {
          ...pokemonData,
          pokopia: {
            ...updatedPokopia,
            habitats: localizedHabitats,
            ...(localePokopia.category && { category: localePokopia.category }),
            ...(localePokopia.obtainDetails && { obtainDetails: localePokopia.obtainDetails }),
          },
        }

        const filePath = path.join(CONTENT_DIR, locale, "pokemon", `${slug}.json`)
        await writeJson(filePath, updatedData)
      }

      refreshed++
      const changes = [
        habitatsChanged ? "habitats" : "",
        timeChanged ? "timeOfDay" : "",
        weatherChanged ? "weather" : "",
        favoritesChanged ? "favorites" : "",
      ]
        .filter(Boolean)
        .join(", ")
      console.log(`  Refreshed ${slug}: ${changes}`)
    }

    if (refreshed > 0) {
      console.log(`\nGameWith refresh: updated ${refreshed} previously-complete Pokémon`)
    } else {
      console.log(`\nGameWith refresh: all previously-complete Pokémon are up to date`)
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
  await downloadMissingCookingIcons()
  await downloadMissingCraftingIcons()
  await downloadMissingCookingToolIcons()
  await downloadMissingItemIcons()

  // Generate habitat materials files
  if (!DRY_RUN) {
    console.log("\n--- Generating Habitat Materials ---")

    // Build JA materials: habitat ID → "item1 x count1, item2 x count2"
    const materialsJa = {}
    for (const [hId, items] of gameWithHabitatItems) {
      const parts = items.map((item) => `${item.name} x${item.count}`)
      materialsJa[hId] = parts.join(", ")
    }

    // Build EN materials: start from existing file to preserve manual translations,
    // then overlay Game8 scraped data on top.
    let materialsEn = {}
    try {
      materialsEn = JSON.parse(await fs.readFile(path.join(CONTENT_DIR, "habitat-materials-en.json"), "utf-8"))
      console.log(`  Loaded existing EN materials: ${Object.keys(materialsEn).length} habitats`)
    } catch {
      console.log("  No existing habitat-materials-en.json, starting fresh")
    }
    // Build reverse map: lowercase EN name → habitat ID (with alias support)
    const enNameToId = new Map()
    for (const [id, name] of Object.entries(habitatMappings.en)) {
      enNameToId.set(name.toLowerCase().replace(/\s+/g, " ").trim(), id)
    }
    // Aliases: Game8 uses different names for some habitats
    const GAME8_NAME_ALIASES = {
      "lumberjack's workplace": "29",
      "evil organiztion hq": "179",
    }
    for (const [alias, id] of Object.entries(GAME8_NAME_ALIASES)) {
      enNameToId.set(alias.toLowerCase().replace(/\s+/g, " ").trim(), id)
    }

    // Match Game8 conditions to habitat IDs
    for (const [g8Name, condText] of g8HabitatConditions) {
      const hId = enNameToId.get(g8Name.toLowerCase().replace(/\s+/g, " ").trim())
      if (hId) {
        const condMatch = condText.match(/Conditions:\s*([\s\S]*?)(?:\s*Pokemon Available:|$)/i)
        const cleaned = condMatch ? condMatch[1].replace(/\s+/g, " ").trim() : condText.replace(/\s+/g, " ").trim()
        if (cleaned) materialsEn[hId] = cleaned
      }
    }

    console.log(`  JA materials: ${Object.keys(materialsJa).length} habitats`)
    console.log(`  EN materials: ${Object.keys(materialsEn).length} habitats (from Game8 conditions)`)

    // Post-process: fix known GameWith data errors before writing.
    // GameWith uses placeholder IDs (Item a23, Item a29, etc.) for some items
    // that we've manually identified. Replace them with correct names.
    const JA_MATERIAL_FIXES = {
      "Item a23": "はち植えの木(なんでも)",   // Potted plant (any) — confirmed via Game8/AppMedia
      "Item a24": "フライパン(なんでも)",     // Frying pan (any) — confirmed via GameWith habitat 122
      "Item a25": "だい(なんでも)",           // Stand (any) — confirmed via GameWith
      "Item a27": "ドレッサー(なんでも)",     // Dresser (any) — confirmed via GameWith
      "Item a28": "つくえ(大きなもの)",       // Table (large) — confirmed via GameWith habitat 120
      "Item a29": "だいざ・てんじだい",       // Pedestal/exhibition stand — confirmed via GameWith fossil pages
      "Item a30": "ついたて(なんでも)",       // Partition (any) — confirmed via GameWith
    }
    for (const [hId, mat] of Object.entries(materialsJa)) {
      let fixed = mat
      for (const [placeholder, correctName] of Object.entries(JA_MATERIAL_FIXES)) {
        fixed = fixed.replaceAll(placeholder, correctName)
      }
      materialsJa[hId] = fixed
    }

    await writeJson(path.join(CONTENT_DIR, "habitat-materials.json"), materialsJa)

    // Post-process EN materials: fix known Game8 scraping errors
    // #107: Game8 outputs period instead of comma as separator
    if (materialsEn["107"]) {
      materialsEn["107"] = materialsEn["107"].replaceAll(". ", ", ")
    }
    // Ensure manually-verified entries are not deleted by Game8 scraping gaps.
    // These entries are confirmed correct but Game8 sometimes omits them.
    const EN_MATERIAL_PRESERVES = {
      "35": "Small vase x1, Plated food x1, Mushroom lamp x1",
      "39": "Wooden birdhouse x1, Berry basket x1",
      "43": "Lost relic (large) x1, Lost relic (large) x4, Bed (any) x1",
      "44": "Log chair x1, Log table x1, Log bed x1",
      "45": "Berry chair x1, Berry bed x1, Berry table x1, Berry table lamp x1",
      "48": "Antique closet x1, Antique bed x1, Antique dresser x1, Antique chair x1",
      "49": "Poke Ball sofa x1, Poke Ball bed x1, Poke Ball table x1, Poke Ball light x1",
      "55": "Yellow tall grass x4, Vending machine x1",
      "68": "Chic chair x2, Chic table x1, Small vase x1, Cart x1, Plated food x1",
      "70": "Seat (any) x2, Potted plant (any) x1, Counter x2, Mug x1, Menu board x1",
      "71": "Beach chair x1, Beach Parasol x1, Side table x1",
      "73": "Balloon x2, Boo-in-the-box x1",
      "74": "Balloon x2, Raichu sign x1",
      "76": "Partition (any) x2, Closet (any) x1, Dresser (any) x1",
      "85": "Seat (any) x1, Arcade machine x1, Punching game x1",
      "92": "Canvas x1, Seat (any) x1",
      "95": "Cute sofa x1, Cute table x1, Cute lamp x1, Cute bed x1, Cute dresser x1",
      "96": "Resort sofa x1, Resort table x1, Resort hammock x1, Resort light x1",
      "114": "Hot-spring spout x1, Water bucket x1, Hot-spring water x2",
      "120": "Seat (wide) x2, Table (large) x1, Party plate x4",
      "122": "Kitchen table x1, Cooking stove x1, Frying pan (any) x1, Sink x1",
      "124": "Tablet x1, Paper party cups x1",
      "126": "Speaker x2, Standing mic x1, Small stage x1",
      "128": "CD player x1, CD rack x1, Magazine rack x1",
      "134": "Gorgeous lamp x1, Gorgeous bed x1, Gorgeous sofa x1, Gorgeous table x1",
      "135": "Iron bed x1, Iron table x1, Iron chair x1, Lantern x1",
      "136": "Industrial bed x1, Industrial desk x1, Industrial chair x1",
      "146": "Stepping stones x3, Torch x2, Water x3, Waterfall x1",
      "149": "Bicycle x1, Vending machine x1",
      "152": "Seat (any) x2, Table (any) x1, Crystal ball x1",
      "154": "Iron beam or column x3, Tires x1, Waste bin (any) x1, Microwave x1",
      "155": "Arcanine doll x1, Pipe chair x2, Industrial desk x1, Desk light x1",
      "156": "Iron pipes x1, Manhole cover x1, Excavation tools x1, Traffic cone x1",
      "158": "Speaker x2, Stand (any) x1, Television x1",
      "161": "Bathub x1, Cleaning set x1",
      "162": "Dresser (any) x1, Seat (any) x1, Humidifier x1",
      "163": "Bookcase x2, Step stool x1, Table (any) x1, Lighting (any) x1",
      "168": "Science experiment x1, Microscope x1, Research paper x1",
      "174": "Face cutout board x1, Spotlight x2, High-up location x1",
      "182": "Gaming bed x1, Table (any) x1, Gaming PC x1, Gaming fridge x1, Gaming chair x1",
      "183": "Pop bed x1, Pop sofa x1, Pop table x1",
      "187": "Fishing rod x1, Seat (any) x1, Hot-spring water x1",
      "189": "Speaker x2, Small stage x1, Cool electric guitar x1, Standing mic x1",
      "190": "Speaker x2, Small stage x1, Cool electric bass x1, Standing mic x1",
      "192": "Pedestal/exhibition stand x1, Auspicious Armor x1, Stepping stones x2, Firepit x2",
      "194": "Pedestal/exhibition stand x1, Skull Fossil x1",
      "195": "Pedestal/exhibition stand x1, Headbutt Fossil (head) x1, Headbutt Fossil (body) x1, Headbutt Fossil (tail) x1",
      "200": "Pedestal/exhibition stand x2, Fin Fossil x1",
      "201": "Pedestal/exhibition stand x1, Tundra Fossil (head) x1, Tundra Fossil (body) x1, Tundra Fossil (tail) x1",
      "210": "Peaceful flowers x4",
      "211": "Flower backpack x1, Hoppip water bottle x1, Lunch box x1",
      "212": "Peaceful flowers x1, Flower cushion x1, Lunch box x1, Flower tableware set x1",
    }
    for (const [hId, mat] of Object.entries(EN_MATERIAL_PRESERVES)) {
      if (!materialsEn[hId]) materialsEn[hId] = mat
    }

    await writeJson(path.join(CONTENT_DIR, "habitat-materials-en.json"), materialsEn)
    // Note: habitat-materials-zh.json is manually maintained with Traditional Chinese translations.
    // Do NOT overwrite it with English data.
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
      errors,
    },
  }
  if (!DRY_RUN) {
    await saveSyncState(newState)
    await saveHabitatMappings(habitatMappings)
    console.log(`Saved habitat mappings: EN=${Object.keys(habitatMappings.en).length}, JA=${Object.keys(habitatMappings.ja).length}, ZH=${Object.keys(habitatMappings.zh).length}`)
  }

  console.log("\n--- Summary ---")
  console.log(`Unified total: ${allSlugs.size} (Serebii: ${serebiiList.length}, GameWith: ${gameWithData.size}, Game8: ${game8Data.size})`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped (already complete): ${skipped}`)
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
