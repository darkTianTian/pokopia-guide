import fs from "fs/promises"
import path from "path"
import * as cheerio from "cheerio"

const GAME8_JP_URL = "https://game8.jp/pocoapokemon/767405"
const CONTENT_DIR = path.join(process.cwd(), "content")
const RECIPES_PATH = path.join(CONTENT_DIR, "crafting-recipes.json")
const MAPPING_EN_PATH = path.join(CONTENT_DIR, "crafting-name-mapping-en.json")
const MAPPING_ZH_PATH = path.join(CONTENT_DIR, "crafting-name-mapping-zh.json")

// Category mapping from Game8 JP subcategories to our categories
const CATEGORY_MAP = {
  "家具": "furniture",
  "きゅうけい": "furniture",
  "ざっか": "decor",
  "かざりつけ": "decor",
  "おもちゃ": "decor",
  "おくがい": "outdoor",
  "べんり": "furniture",
  "たてもの": "building",
  "ブロック": "blocks",
  "どうろ": "building",
  "そのた": "special",
}

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function categorize(categoryText) {
  // Check subcategories first, then main category
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (categoryText.includes(key)) return value
  }
  return "furniture"
}

async function fetchPage(url) {
  console.log(`Fetching: ${url}`)
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PokopiaGuideBot/1.0)",
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

function parseMaterials(text) {
  // Parse material strings like "ざいもく×1" or "いし×2, はっぱ×1"
  return text
    .split(/[,、]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(.+?)[×x](\d+)$/)
      if (match) {
        return { nameJa: match[1].trim(), quantity: Number(match[2]) }
      }
      return { nameJa: part.trim(), quantity: 1 }
    })
}

async function scrapeGame8Recipes() {
  const html = await fetchPage(GAME8_JP_URL)
  const $ = cheerio.load(html)
  const recipes = []

  // Look for recipe tables
  $("table").each((_, table) => {
    const $table = $(table)
    const $rows = $table.find("tr")

    $rows.each((i, row) => {
      if (i === 0) return // skip header
      const $cells = $(row).find("td")
      if ($cells.length < 2) return

      const nameJa = $cells.eq(0).text().trim()
      const materialsText = $cells.eq(1).text().trim()

      if (!nameJa || !materialsText) return

      const materials = parseMaterials(materialsText)
      if (materials.length === 0) return

      // Try to determine category from section heading
      let category = "furniture"
      const $section = $table.prevAll("h2, h3").first()
      if ($section.length) {
        category = categorize($section.text())
      }

      recipes.push({
        nameJa,
        category,
        materials,
      })
    })
  })

  return recipes
}

async function loadExistingData() {
  try {
    const data = JSON.parse(await fs.readFile(RECIPES_PATH, "utf-8"))
    return data
  } catch {
    return []
  }
}

async function loadMappings() {
  let en = { recipes: {}, materials: {} }
  let zh = { recipes: {}, materials: {} }
  try {
    en = JSON.parse(await fs.readFile(MAPPING_EN_PATH, "utf-8"))
  } catch { /* no existing mapping */ }
  try {
    zh = JSON.parse(await fs.readFile(MAPPING_ZH_PATH, "utf-8"))
  } catch { /* no existing mapping */ }
  return { en, zh }
}

async function main() {
  console.log("=== Pokopia Crafting Data Updater ===\n")

  // Load existing data
  const existingRecipes = await loadExistingData()
  const existingByJaName = new Map(existingRecipes.map((r) => [r.nameJa, r]))
  const mappings = await loadMappings()

  // Scrape new data
  let scrapedRecipes = []
  try {
    scrapedRecipes = await scrapeGame8Recipes()
    console.log(`Scraped ${scrapedRecipes.length} recipes from Game8 JP`)
  } catch (err) {
    console.error("Failed to scrape Game8:", err.message)
    console.log("Using existing data only")
  }

  // Merge: keep existing, add new
  let newCount = 0
  for (const scraped of scrapedRecipes) {
    if (existingByJaName.has(scraped.nameJa)) continue

    // Generate ID from English name if available, otherwise from Japanese
    const enName = mappings.en.recipes[scraped.nameJa]
    const id = enName ? toSlug(enName) : toSlug(scraped.nameJa)

    existingByJaName.set(scraped.nameJa, {
      id,
      nameJa: scraped.nameJa,
      category: scraped.category,
      materials: scraped.materials,
      obtainMethod: "story",
    })
    newCount++

    // Check for unmapped names
    if (!mappings.en.recipes[scraped.nameJa]) {
      console.log(`  [EN MISSING] Recipe: ${scraped.nameJa}`)
    }
    if (!mappings.zh.recipes[scraped.nameJa]) {
      console.log(`  [ZH MISSING] Recipe: ${scraped.nameJa}`)
    }

    // Check materials
    for (const mat of scraped.materials) {
      if (!mappings.en.materials[mat.nameJa]) {
        console.log(`  [EN MISSING] Material: ${mat.nameJa}`)
      }
      if (!mappings.zh.materials[mat.nameJa]) {
        console.log(`  [ZH MISSING] Material: ${mat.nameJa}`)
      }
    }
  }

  // Save updated recipes
  const allRecipes = Array.from(existingByJaName.values())
  await fs.writeFile(RECIPES_PATH, JSON.stringify(allRecipes, null, 2) + "\n")

  console.log(`\n--- Summary ---`)
  console.log(`New recipes: ${newCount}`)
  console.log(`Total recipes: ${allRecipes.length}`)
  console.log(`Saved to: ${RECIPES_PATH}`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
