import fs from "fs/promises"
import path from "path"
import { existsSync } from "fs"

const GAMEWITH_URL = "https://gamewith.jp/pocoapokemon/545723"
const CONTENT_DIR = path.join(process.cwd(), "content")
const OUTPUT_PATH = path.join(CONTENT_DIR, "items.json")
const IMAGES_DIR = path.join(process.cwd(), "public/images/items")

const DOWNLOAD_DELAY_MS = 300

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function stripHtml(html) {
  return html
    .replace(/\\'/g, "'")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Extract all items from GameWith 545723 page.
 * Parses the JS itemData array embedded in the page HTML.
 *
 * Fields extracted:
 * - id, n (nameJa), t (category), i (imageId)
 * - e (description), g (how to obtain), r (recipe/unlock)
 * - m (crafting materials [{id, nameJa, count}])
 */
/**
 * Extract materials from a substring after the main match.
 * Handles both c:'1' (quoted) and c:50 (unquoted) formats.
 */
function extractMaterials(htmlSlice) {
  const materials = []
  const matsMatch = htmlSlice.match(/,m:\[([^\]]*)\]/)
  if (matsMatch) {
    const matRegex = /\{i:'(\d+)',n:'([^']*)',(?:a:'[^']*',)?c:(?:')?(\d+)/g
    let m
    while ((m = matRegex.exec(matsMatch[1])) !== null) {
      materials.push({
        id: m[1],
        nameJa: m[2],
        count: parseInt(m[3], 10),
      })
    }
  }
  return materials
}

function extractItems(html) {
  const items = []
  const seen = new Set()

  // Pattern 1: Standard items with e, g, r fields
  const itemRegex = /\{id:'(\d+)',n:'([^']*)',k:'[^']*',f:'[^']*',aid:'[^']*',t:'([^']*)',i:'([^']*)',e:'((?:[^'\\]|\\.)*)',g:'((?:[^'\\]|\\.)*)',r:'((?:[^'\\]|\\.)*)'/g

  let match
  while ((match = itemRegex.exec(html)) !== null) {
    const [fullMatch, id, nameJa, category, imageId, descRaw, gRaw, rRaw] = match
    if (seen.has(id)) continue
    seen.add(id)

    const description = descRaw.replace(/\\'/g, "'").replace(/\\n/g, " ").trim()
    const obtain = stripHtml(gRaw)
    const recipe = stripHtml(rRaw)

    const afterMatch = html.substring(match.index + fullMatch.length, match.index + fullMatch.length + 500)
    const materials = extractMaterials(afterMatch)

    const item = { id, nameJa, category, imageId }
    if (description) item.description = description
    if (obtain.length > 0) item.obtain = obtain
    if (recipe.length > 0) item.recipe = recipe
    if (materials.length > 0) item.materials = materials

    items.push(item)
  }

  // Pattern 2: Kit items with t2, r (no e/g), nr, tr, tx, sr fields
  const kitRegex = /\{id:'(\d+)',n:'([^']*)',k:'[^']*',f:'[^']*',aid:'[^']*',t:'([^']*)',t2:'([^']*)',i:'([^']*)',r:'((?:[^'\\]|\\.)*)'/g

  while ((match = kitRegex.exec(html)) !== null) {
    const [fullMatch, id, nameJa, category, category2, imageId, rRaw] = match
    if (seen.has(id)) continue
    seen.add(id)

    const recipe = stripHtml(rRaw)

    // Extract tx (description) field
    const afterMatch = html.substring(match.index + fullMatch.length, match.index + fullMatch.length + 800)
    const txMatch = afterMatch.match(/,tx:'((?:[^'\\]|\\.)*)'/)
    const description = txMatch ? txMatch[1].replace(/\\'/g, "'").replace(/<[^>]+>/g, "").trim() : ""

    const materials = extractMaterials(afterMatch)

    const item = { id, nameJa, category, imageId }
    if (description) item.description = description
    if (recipe.length > 0) item.recipe = recipe
    if (materials.length > 0) item.materials = materials

    items.push(item)
  }

  return items
}

async function downloadImage(imageId, filename) {
  const localPath = path.join(IMAGES_DIR, filename)

  if (existsSync(localPath)) {
    return false
  }

  const imageUrl = `https://img.gamewith.jp/article_tools/pocoapokemon/gacha/${imageId}.png`

  try {
    const res = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PokopiaGuideBot/1.0)",
        Referer: "https://gamewith.jp/",
      },
    })

    if (!res.ok) {
      console.log(`  [SKIP] Image not found: ${imageUrl} (${res.status})`)
      return false
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    await fs.writeFile(localPath, buffer)
    return true
  } catch (err) {
    console.log(`  [ERROR] Failed to download image: ${err.message}`)
    return false
  }
}

/**
 * Load existing EN/ZH name mappings from crafting and material data
 * to build initial translation mappings for items.
 */
async function buildTranslationMappings(items) {
  const enMap = {}
  const zhMap = {}

  // Source 1: Crafting name mappings
  try {
    const craftingEn = JSON.parse(
      await fs.readFile(path.join(CONTENT_DIR, "crafting-name-mapping-en.json"), "utf-8")
    )
    const craftingZh = JSON.parse(
      await fs.readFile(path.join(CONTENT_DIR, "crafting-name-mapping-zh.json"), "utf-8")
    )
    for (const [ja, en] of Object.entries(craftingEn.recipes || {})) {
      enMap[ja] = en
    }
    for (const [ja, en] of Object.entries(craftingEn.materials || {})) {
      enMap[ja] = en
    }
    for (const [ja, zh] of Object.entries(craftingZh.recipes || {})) {
      zhMap[ja] = zh
    }
    for (const [ja, zh] of Object.entries(craftingZh.materials || {})) {
      zhMap[ja] = zh
    }
    console.log(`  Crafting mappings: ${Object.keys(craftingEn.recipes || {}).length} recipes, ${Object.keys(craftingEn.materials || {}).length} materials`)
  } catch {
    console.log("  Crafting mappings not found")
  }

  // Source 2: Material source translations
  try {
    const sourceTranslations = JSON.parse(
      await fs.readFile(path.join(CONTENT_DIR, "material-source-translations.json"), "utf-8")
    )
    for (const [slug, data] of Object.entries(sourceTranslations)) {
      if (data.nameJa && data.nameEn) enMap[data.nameJa] = data.nameEn
      if (data.nameJa && data.nameZh) zhMap[data.nameJa] = data.nameZh
    }
  } catch {
    // optional
  }

  // Filter to only include items that exist in our scraped data
  const itemNames = new Set(items.map((i) => i.nameJa))
  const enFiltered = {}
  const zhFiltered = {}

  for (const [ja, en] of Object.entries(enMap)) {
    if (itemNames.has(ja)) enFiltered[ja] = en
  }
  for (const [ja, zh] of Object.entries(zhMap)) {
    if (itemNames.has(ja)) zhFiltered[ja] = zh
  }

  return { en: enFiltered, zh: zhFiltered }
}

async function main() {
  console.log("=== Pokopia Items Scraper ===\n")

  // Fetch the GameWith page
  const html = await fetchPage(GAMEWITH_URL)
  console.log(`Page size: ${(html.length / 1024).toFixed(0)} KB\n`)

  // Extract items
  const items = extractItems(html)
  console.log(`Extracted ${items.length} items\n`)

  if (items.length === 0) {
    console.error("No items found! The page structure may have changed.")
    process.exit(1)
  }

  // Show category breakdown
  const categories = new Map()
  for (const item of items) {
    categories.set(item.category, (categories.get(item.category) || 0) + 1)
  }
  console.log("Categories:")
  for (const [cat, count] of [...categories.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`)
  }

  // Save items.json
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(items, null, 2) + "\n")
  console.log(`\nSaved ${items.length} items to ${OUTPUT_PATH}`)

  // Build and save translation mappings
  console.log("\nBuilding translation mappings...")
  const mappings = await buildTranslationMappings(items)

  const enPath = path.join(CONTENT_DIR, "item-name-mapping-en.json")
  const zhPath = path.join(CONTENT_DIR, "item-name-mapping-zh.json")
  await fs.writeFile(enPath, JSON.stringify(mappings.en, null, 2) + "\n")
  await fs.writeFile(zhPath, JSON.stringify(mappings.zh, null, 2) + "\n")
  console.log(`  EN mappings: ${Object.keys(mappings.en).length} / ${items.length} items translated`)
  console.log(`  ZH mappings: ${Object.keys(mappings.zh).length} / ${items.length} items translated`)

  // Download item images
  console.log("\n--- Downloading item images ---")
  await fs.mkdir(IMAGES_DIR, { recursive: true })
  let downloaded = 0
  let skipped = 0

  for (const item of items) {
    if (!item.imageId) continue

    // Use item ID as filename for uniqueness
    const filename = `item-${item.id}.png`
    const didDownload = await downloadImage(item.imageId, filename)
    if (didDownload) {
      downloaded++
      if (downloaded % 10 === 0) {
        console.log(`  Downloaded ${downloaded} images...`)
      }
      await sleep(DOWNLOAD_DELAY_MS)
    } else {
      skipped++
    }
  }

  const withDesc = items.filter((i) => i.description).length
  const withObtain = items.filter((i) => i.obtain?.length > 0).length
  const withRecipe = items.filter((i) => i.recipe?.length > 0).length
  const withMaterials = items.filter((i) => i.materials?.length > 0).length

  console.log(`\n--- Summary ---`)
  console.log(`Total items: ${items.length}`)
  console.log(`Categories: ${categories.size}`)
  console.log(`With description: ${withDesc}`)
  console.log(`With obtain info: ${withObtain}`)
  console.log(`With recipe/unlock info: ${withRecipe}`)
  console.log(`With crafting materials: ${withMaterials}`)
  console.log(`Images downloaded: ${downloaded}`)
  console.log(`Images skipped (already exist): ${skipped}`)
  console.log(`EN translations: ${Object.keys(mappings.en).length}`)
  console.log(`ZH translations: ${Object.keys(mappings.zh).length}`)
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
