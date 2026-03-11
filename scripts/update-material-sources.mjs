import fs from "fs/promises"
import path from "path"
import { existsSync } from "fs"

const GAMEWITH_URL = "https://gamewith.jp/pocoapokemon/545723"
const GAMEWITH_DETAIL_BASE = "https://gamewith.jp/pocoapokemon"
const CONTENT_DIR = path.join(process.cwd(), "content")
const OUTPUT_PATH = path.join(CONTENT_DIR, "material-sources.json")
const IMAGES_DIR = path.join(process.cwd(), "public/images/items")
const SCREENSHOTS_DIR = path.join(process.cwd(), "public/images/material-sources")

const DOWNLOAD_DELAY_MS = 500
const DETAIL_FETCH_DELAY_MS = 1000
const MIN_SCREENSHOT_SIZE = 50 * 1024 // 50KB — filter out small icons/thumbnails

function toSlug(name) {
  return name
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function stripHtml(html) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function parseMaterialNames(str) {
  return str
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(.+?)\s*x(\d+)$/)
      return match ? match[1].trim() : part.trim()
    })
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

/**
 * Build Japanese name -> English slug mapping using multiple sources:
 * 1. Crafting name mapping (most reliable, direct JA->EN)
 * 2. Single-item habitat entries (guaranteed correct ordering)
 * 3. Multi-item habitat entries (position-based, less reliable)
 */
async function buildNameMapping() {
  const jaPath = path.join(CONTENT_DIR, "habitat-materials.json")
  const enPath = path.join(CONTENT_DIR, "habitat-materials-en.json")
  const craftingMappingPath = path.join(CONTENT_DIR, "crafting-name-mapping-en.json")

  const jaData = JSON.parse(await fs.readFile(jaPath, "utf-8"))
  const enData = JSON.parse(await fs.readFile(enPath, "utf-8"))

  // Map: JA name -> EN slug
  const jaToSlug = new Map()

  // Source 1: Crafting name mapping (direct JA->EN, most reliable)
  try {
    const craftingMapping = JSON.parse(await fs.readFile(craftingMappingPath, "utf-8"))
    for (const [jaName, enName] of Object.entries(craftingMapping.recipes || {})) {
      jaToSlug.set(jaName, toSlug(enName))
    }
    console.log(`  Source 1 (crafting mapping): ${Object.keys(craftingMapping.recipes || {}).length} entries`)
  } catch {
    console.log("  Source 1 (crafting mapping): not found, skipping")
  }

  // Source 2: Single-item habitat entries (guaranteed correct)
  let singleCount = 0
  for (const [id, jaStr] of Object.entries(jaData)) {
    const enStr = enData[id]
    if (!jaStr || !enStr) continue
    const jaNames = parseMaterialNames(jaStr)
    const enNames = parseMaterialNames(enStr)
    if (jaNames.length === 1 && enNames.length === 1) {
      if (!jaToSlug.has(jaNames[0])) {
        jaToSlug.set(jaNames[0], toSlug(enNames[0]))
        singleCount++
      }
    }
  }
  console.log(`  Source 2 (single-item habitats): ${singleCount} new entries`)

  // Source 3: Iterative deduction from multi-item habitat entries
  // Each pass may resolve mappings that enable the next pass to resolve more
  let totalMultiCount = 0
  for (let pass = 0; pass < 10; pass++) {
    let passCount = 0
    for (const [id, jaStr] of Object.entries(jaData)) {
      const enStr = enData[id]
      if (!jaStr || !enStr) continue
      const jaNames = parseMaterialNames(jaStr)
      const enNames = parseMaterialNames(enStr)
      if (jaNames.length !== enNames.length || jaNames.length <= 1) continue

      const unmappedJa = []
      const matchedEnSlugs = new Set()

      for (const jaName of jaNames) {
        if (jaToSlug.has(jaName)) {
          matchedEnSlugs.add(jaToSlug.get(jaName))
        } else {
          unmappedJa.push(jaName)
        }
      }

      const unmatchedEn = enNames
        .map((n) => toSlug(n))
        .filter((s) => !matchedEnSlugs.has(s))

      if (unmappedJa.length === 1 && unmatchedEn.length === 1) {
        jaToSlug.set(unmappedJa[0], unmatchedEn[0])
        passCount++
      }
    }
    totalMultiCount += passCount
    if (passCount === 0) break
  }
  console.log(`  Source 3 (iterative deduction): ${totalMultiCount} new entries`)

  // Source 4: Position-based matching as last resort
  // Collect all candidate EN slugs for each JA name across habitats
  const jaCandidates = new Map() // JA name -> Map<slug, count>
  for (const [id, jaStr] of Object.entries(jaData)) {
    const enStr = enData[id]
    if (!jaStr || !enStr) continue
    const jaNames = parseMaterialNames(jaStr)
    const enNames = parseMaterialNames(enStr)
    if (jaNames.length !== enNames.length) continue

    for (let i = 0; i < jaNames.length; i++) {
      if (jaToSlug.has(jaNames[i])) continue
      const slug = toSlug(enNames[i])
      if (!jaCandidates.has(jaNames[i])) {
        jaCandidates.set(jaNames[i], new Map())
      }
      const counts = jaCandidates.get(jaNames[i])
      counts.set(slug, (counts.get(slug) || 0) + 1)
    }
  }

  // For each unmapped JA name, pick the most common candidate slug
  let posCount = 0
  for (const [jaName, candidates] of jaCandidates) {
    if (jaToSlug.has(jaName)) continue
    let bestSlug = null
    let bestCount = 0
    for (const [slug, count] of candidates) {
      if (count > bestCount) {
        bestCount = count
        bestSlug = slug
      }
    }
    if (bestSlug) {
      jaToSlug.set(jaName, bestSlug)
      posCount++
    }
  }
  console.log(`  Source 4 (position-based fallback): ${posCount} new entries`)

  // Collect all unique JA names from habitat data
  const allJaNames = new Set()
  for (const jaStr of Object.values(jaData)) {
    if (!jaStr) continue
    for (const name of parseMaterialNames(jaStr)) {
      allJaNames.add(name)
    }
  }

  return { jaToSlug, allJaNames }
}

function extractAllItems(html) {
  const items = new Map()

  // Extract items with both g (acquisition) and r (recipe) fields
  const itemRegex = /\{id:'(\d+)',n:'([^']*)',k:'[^']*',f:'[^']*',aid:'([^']*)',t:'[^']*',i:'([^']*)',e:'(?:[^'\\]|\\.)*',g:'((?:[^'\\]|\\.)*)',r:'((?:[^'\\]|\\.)*)'/g

  let match
  while ((match = itemRegex.exec(html)) !== null) {
    const [, id, name, aid, image, gRaw, rRaw] = match
    const gHtml = gRaw.replace(/\\'/g, "'")
    const rHtml = rRaw.replace(/\\'/g, "'")

    const gSources = stripHtml(gHtml)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

    const rSources = stripHtml(rHtml)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

    // Combine g (acquisition) and r (recipe/unlock) sources
    const sources = [...gSources]
    for (const rs of rSources) {
      if (!sources.includes(rs)) {
        sources.push(rs)
      }
    }

    items.set(name, { id, nameJa: name, aid, image, sources })
  }

  return items
}

async function downloadImage(imageId, slug) {
  const localPath = path.join(IMAGES_DIR, `${slug}.png`)

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
    console.log(`  [DOWNLOAD] ${slug}.png`)
    return true
  } catch (err) {
    console.log(`  [ERROR] Failed to download image for ${slug}: ${err.message}`)
    return false
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Extract game screenshot URLs from a GameWith detail page.
 * Only extracts images inside `w-article-img` containers (actual screenshots),
 * skipping thumbnails in `w-custom-list` (item icons/navigation).
 * Also filters out the 「関連リンク」 section at the bottom.
 */
function extractScreenshots(html) {
  // Extract article-body section
  const bodyStart = html.indexOf('<div id="article-body"')
  if (bodyStart === -1) return []

  // Remove the related links section at the bottom
  const relatedIdx = html.indexOf("関連リンク", bodyStart)
  const bodyHtml = relatedIdx > -1
    ? html.slice(bodyStart, relatedIdx)
    : html.slice(bodyStart)

  const screenshots = []

  // Extract images only from w-article-img containers (real screenshots)
  const articleImgRegex = /class="[^"]*w-article-img[^"]*"[^>]*>[\s\S]*?<\/div>/g
  let block
  while ((block = articleImgRegex.exec(bodyHtml)) !== null) {
    const imgUrlRegex = /(?:data-original|src)='(https?:\/\/img\.gamewith\.jp\/img\/[^']+)'/g
    let m
    while ((m = imgUrlRegex.exec(block[0])) !== null) {
      screenshots.push(m[1])
    }
    // Also check double-quoted attributes
    const imgUrlRegex2 = /(?:data-original|src)="(https?:\/\/img\.gamewith\.jp\/img\/[^"]+)"/g
    while ((m = imgUrlRegex2.exec(block[0])) !== null) {
      screenshots.push(m[1])
    }
  }

  // Fallback: if no w-article-img found, try data-original but filter gacha/ icon URLs
  if (screenshots.length === 0) {
    const imgRegex = /data-original='(https?:\/\/img\.gamewith\.jp\/img\/[^']+)'/g
    let m
    while ((m = imgRegex.exec(bodyHtml)) !== null) {
      // Skip gacha item icons (typically in /gacha/ path)
      if (!m[1].includes("/gacha/")) {
        screenshots.push(m[1])
      }
    }
  }

  return screenshots
}

async function downloadScreenshot(url, filePath) {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PokopiaGuideBot/1.0)",
        Referer: "https://gamewith.jp/",
      },
    })
    if (!res.ok) {
      console.log(`  [SKIP] Screenshot not found: ${url} (${res.status})`)
      return false
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    await fs.writeFile(filePath, buffer)
    return true
  } catch (err) {
    console.log(`  [ERROR] Failed to download screenshot: ${err.message}`)
    return false
  }
}

function getScreenshotExtension(url) {
  const match = url.match(/\.(png|jpe?g|webp|gif)(\?|$)/i)
  if (match) return match[1].toLowerCase().replace("jpeg", "jpg")
  return "jpg"
}

async function main() {
  console.log("=== Pokopia Material Sources Updater ===\n")

  // Build Japanese -> English slug mapping
  console.log("Building name mapping...")
  const { jaToSlug, allJaNames } = await buildNameMapping()
  console.log(`Total mapping: ${jaToSlug.size} JA names -> EN slugs`)
  console.log(`Total unique JA material names: ${allJaNames.size}\n`)

  // Fetch GameWith item list page
  const html = await fetchPage(GAMEWITH_URL)
  console.log(`Page size: ${(html.length / 1024).toFixed(0)} KB\n`)

  // Extract all items from the page
  const allItems = extractAllItems(html)
  console.log(`Found ${allItems.size} total items on page\n`)

  // Match habitat material JA names against GameWith items
  const output = {}
  const matched = []
  const noSlug = []
  const noGameWith = []
  const noSources = []

  for (const jaName of allJaNames) {
    const slug = jaToSlug.get(jaName)
    if (!slug) {
      noSlug.push(jaName)
      continue
    }

    const item = allItems.get(jaName)
    if (!item) {
      noGameWith.push({ jaName, slug })
      continue
    }

    if (item.sources.length === 0) {
      noSources.push({ jaName, slug })
      continue
    }

    // Don't overwrite if already matched (e.g. from a different JA name with same slug)
    if (!output[slug]) {
      output[slug] = {
        nameJa: jaName,
        sources: item.sources,
        imageId: item.image,
        aid: item.aid,
      }
      matched.push(jaName)
    }
  }

  // Download missing item images
  console.log("--- Downloading item images ---")
  let downloaded = 0
  for (const [slug, data] of Object.entries(output)) {
    const didDownload = await downloadImage(data.imageId, slug)
    if (didDownload) {
      downloaded++
      await sleep(DOWNLOAD_DELAY_MS)
    }
  }

  // Fetch detail pages and download screenshots
  console.log("\n--- Fetching detail pages for screenshots ---")
  await fs.mkdir(SCREENSHOTS_DIR, { recursive: true })
  let screenshotCount = 0
  let detailFetched = 0
  const entries = Object.entries(output)

  for (let i = 0; i < entries.length; i++) {
    const [slug, data] = entries[i]
    if (!data.aid) {
      console.log(`  [SKIP] ${slug}: no aid`)
      continue
    }

    // Check if screenshots already exist for this slug
    const existingFiles = await fs.readdir(SCREENSHOTS_DIR).catch(() => [])
    const matchingFiles = existingFiles.filter((f) => f.startsWith(slug + ".") || f.startsWith(slug + "-"))
    if (matchingFiles.length > 0) {
      // Filter out small files (icons) from existing screenshots
      const paths = []
      for (const f of matchingFiles.sort()) {
        const stat = await fs.stat(path.join(SCREENSHOTS_DIR, f))
        if (stat.size >= MIN_SCREENSHOT_SIZE) {
          paths.push(`/images/material-sources/${f}`)
        }
      }
      if (paths.length > 0) {
        data.screenshots = paths
      }
      continue
    }

    const detailUrl = `${GAMEWITH_DETAIL_BASE}/${data.aid}`
    console.log(`  [${i + 1}/${entries.length}] Fetching ${slug} (aid: ${data.aid})`)

    try {
      const detailHtml = await fetchPage(detailUrl)
      detailFetched++
      const screenshotUrls = extractScreenshots(detailHtml)

      if (screenshotUrls.length === 0) {
        console.log(`    No screenshots found`)
        continue
      }

      const paths = []
      for (let j = 0; j < screenshotUrls.length; j++) {
        const ext = getScreenshotExtension(screenshotUrls[j])
        const filename = screenshotUrls.length === 1
          ? `${slug}.${ext}`
          : `${slug}-${j + 1}.${ext}`
        const filePath = path.join(SCREENSHOTS_DIR, filename)

        const ok = await downloadScreenshot(screenshotUrls[j], filePath)
        if (ok) {
          const stat = await fs.stat(filePath)
          if (stat.size < MIN_SCREENSHOT_SIZE) {
            await fs.unlink(filePath)
            console.log(`    [SKIP] ${filename} too small (${(stat.size / 1024).toFixed(0)}KB) — likely an icon`)
            continue
          }
          paths.push(`/images/material-sources/${filename}`)
          screenshotCount++
          console.log(`    [DOWNLOAD] ${filename}`)
        }
      }

      if (paths.length > 0) {
        data.screenshots = paths
      }
    } catch (err) {
      console.log(`    [ERROR] ${err.message}`)
    }

    await sleep(DETAIL_FETCH_DELAY_MS)
  }

  // Remove internal fields from output
  for (const data of Object.values(output)) {
    delete data.imageId
    delete data.aid
  }

  // Save output
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n")

  // Summary
  console.log(`\n--- Summary ---`)
  console.log(`Total items on GameWith: ${allItems.size}`)
  console.log(`Unique habitat material names (JA): ${allJaNames.size}`)
  console.log(`Matched with sources: ${matched.length}`)
  console.log(`Item images downloaded: ${downloaded}`)
  console.log(`Detail pages fetched: ${detailFetched}`)
  console.log(`Screenshots downloaded: ${screenshotCount}`)
  console.log(`Saved to: ${OUTPUT_PATH}`)

  if (noSlug.length > 0) {
    console.log(`\n[NO SLUG] ${noSlug.length} JA names have no EN slug mapping:`)
    for (const name of noSlug.slice(0, 15)) {
      console.log(`  - ${name}`)
    }
    if (noSlug.length > 15) console.log(`  ... and ${noSlug.length - 15} more`)
  }

  if (noGameWith.length > 0) {
    console.log(`\n[NOT ON GAMEWITH] ${noGameWith.length} items not found on GameWith:`)
    for (const { jaName, slug } of noGameWith.slice(0, 10)) {
      console.log(`  - ${jaName} (${slug})`)
    }
    if (noGameWith.length > 10) console.log(`  ... and ${noGameWith.length - 10} more`)
  }

  if (noSources.length > 0) {
    console.log(`\n[NO SOURCES] ${noSources.length} items found but have no source data:`)
    for (const { jaName, slug } of noSources.slice(0, 10)) {
      console.log(`  - ${jaName} (${slug})`)
    }
    if (noSources.length > 10) console.log(`  ... and ${noSources.length - 10} more`)
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
