#!/usr/bin/env node
// Fetch official Simplified Chinese Pokemon names from PokeAPI and fix zh-Hans pokemon files

import fs from "fs"
import path from "path"

const ZH_HANS_DIR = "content/zh-Hans/pokemon"

// Map slug to PokeAPI species name (most are the same, but some differ)
const SLUG_TO_POKEAPI = {
  "mr-mime": "mr-mime",
  "nidoran-f": "nidoran-f",
  "nidoran-m": "nidoran-m",
  "ho-oh": "ho-oh",
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchOfficialName(slug) {
  const apiSlug = SLUG_TO_POKEAPI[slug] || slug
  const url = `https://pokeapi.co/api/v2/pokemon-species/${apiSlug}`

  try {
    const resp = await fetch(url)
    if (!resp.ok) {
      // Try with pokedex number from file
      return null
    }
    const data = await resp.json()
    const zhHansEntry = data.names?.find(
      (n) => n.language?.name === "zh-hans"
    )
    return zhHansEntry?.name || null
  } catch {
    return null
  }
}

async function main() {
  const files = fs.readdirSync(ZH_HANS_DIR).filter((f) => f.endsWith(".json"))
  console.log(`Checking ${files.length} pokemon files against PokeAPI...`)

  let fixed = 0
  let matched = 0
  let notFound = 0
  const mismatches = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const slug = file.replace(".json", "")
    const filePath = path.join(ZH_HANS_DIR, file)
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"))

    const officialName = await fetchOfficialName(slug)

    if (!officialName) {
      notFound++
      if (i % 50 === 0) console.log(`  [${i}/${files.length}] ${slug} — not found on PokeAPI`)
      await delay(100)
      continue
    }

    if (data.name === officialName) {
      matched++
    } else {
      mismatches.push({ slug, current: data.name, official: officialName })
      const updatedData = { ...data, name: officialName }
      fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2) + "\n")
      fixed++
    }

    if (i % 50 === 0) {
      console.log(`  [${i}/${files.length}] processed... (${matched} matched, ${fixed} fixed, ${notFound} not found)`)
    }

    // Rate limit: ~10 requests/second
    await delay(100)
  }

  console.log(`\n=== Results ===`)
  console.log(`Total: ${files.length}`)
  console.log(`Matched: ${matched}`)
  console.log(`Fixed: ${fixed}`)
  console.log(`Not found on PokeAPI: ${notFound}`)

  if (mismatches.length > 0) {
    console.log(`\nMismatches fixed:`)
    for (const m of mismatches) {
      console.log(`  ${m.slug}: "${m.current}" → "${m.official}"`)
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
