#!/usr/bin/env node
// Translate Traditional Chinese (zh) content to Simplified Chinese (zh-Hans) using Gemini 2.5 Flash API
// Usage: node scripts/translate-zh-hans.mjs [--json] [--guides] [--pokemon] [--all]

import "dotenv/config"
import fs from "fs"
import path from "path"

const API_KEY = process.env.GEMINI_API_KEY
if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is not set")
  process.exit(1)
}

const MODEL = "gemini-2.5-flash"

// ─── Gemini API helper ───────────────────────────────────────────────

async function callGemini(systemPrompt, userPrompt, temperature = 0.1, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature,
              maxOutputTokens: 65536,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
        }
      )

      const data = await resp.json()
      if (data.error) throw new Error(`Gemini API error: ${data.error.message}`)
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error("No text in Gemini response")
      return text
    } catch (err) {
      if (attempt < retries) {
        console.log(`  ⚠ Attempt ${attempt} failed: ${err.message}. Retrying in ${attempt * 3}s...`)
        await delay(attempt * 3000)
      } else {
        throw err
      }
    }
  }
}

// ─── JSON conversion (Traditional → Simplified) ─────────────────────

const JSON_SYSTEM_PROMPT = `You are a Traditional Chinese to Simplified Chinese converter.
Convert ALL Traditional Chinese text to Simplified Chinese (简体中文).
This is a character-by-character conversion, NOT a translation. Keep the same meaning.

Rules:
- Convert Traditional Chinese characters to their Simplified equivalents
- 寶可夢 → 宝可梦, 圖鑑 → 图鉴, 棲息地 → 栖息地, 製作 → 制作
- 屬性 → 属性, 攻略 → 攻略 (already simplified), 訓練家 → 训练家
- Keep English text, numbers, URLs, file paths, and JSON keys unchanged
- Return ONLY valid JSON, no explanation or markdown fences
- Pokemon names: use official Simplified Chinese names (same as Traditional for most)
- Preserve the exact JSON structure`

async function convertJsonFile(inputPath, outputPath) {
  const content = fs.readFileSync(inputPath, "utf-8")
  const parsed = JSON.parse(content)
  const entries = Object.entries(parsed)

  console.log(`→ Converting ${path.basename(inputPath)} → ${path.basename(outputPath)} (${entries.length} entries)...`)

  // For large files (>20KB), split into chunks
  const MAX_CHUNK_SIZE = 15000 // chars of JSON per chunk
  if (content.length > 20000) {
    const result = {}
    const chunks = []
    let currentChunk = {}
    let currentSize = 0

    for (const [key, value] of entries) {
      const entryStr = JSON.stringify({ [key]: value })
      if (currentSize + entryStr.length > MAX_CHUNK_SIZE && Object.keys(currentChunk).length > 0) {
        chunks.push(currentChunk)
        currentChunk = {}
        currentSize = 0
      }
      currentChunk[key] = value
      currentSize += entryStr.length
    }
    if (Object.keys(currentChunk).length > 0) chunks.push(currentChunk)

    console.log(`  Splitting into ${chunks.length} chunks...`)

    for (let i = 0; i < chunks.length; i++) {
      const chunkJson = JSON.stringify(chunks[i], null, 2)
      console.log(`  → Chunk ${i + 1}/${chunks.length}...`)

      const chunkResult = await callGemini(
        JSON_SYSTEM_PROMPT,
        `Convert this JSON from Traditional Chinese to Simplified Chinese. Return ONLY the JSON:\n\n${chunkJson}`
      )

      let cleaned = chunkResult.replace(/^```json?\n/, "").replace(/\n```$/, "").trim()
      try {
        const chunkParsed = JSON.parse(cleaned)
        Object.assign(result, chunkParsed)
      } catch (e) {
        console.error(`  ✗ Chunk ${i + 1} — invalid JSON: ${e.message}`)
        // Fallback: use original values
        Object.assign(result, chunks[i])
      }

      await delay(1500)
    }

    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n")
    console.log(`✓ ${path.basename(outputPath)} — done`)
  } else {
    // Small file: convert in one go
    const apiResult = await callGemini(
      JSON_SYSTEM_PROMPT,
      `Convert this JSON file from Traditional Chinese to Simplified Chinese. Return ONLY the JSON:\n\n${content}`
    )

    let cleaned = apiResult.replace(/^```json?\n/, "").replace(/\n```$/, "").trim()
    try {
      const parsedResult = JSON.parse(cleaned)
      fs.writeFileSync(outputPath, JSON.stringify(parsedResult, null, 2) + "\n")
      console.log(`✓ ${path.basename(outputPath)} — done`)
    } catch (e) {
      console.error(`✗ ${path.basename(outputPath)} — invalid JSON: ${e.message}`)
      fs.writeFileSync(outputPath + ".raw", cleaned)
    }

    await delay(1500)
  }
}

// ─── UI translations (zh.json → zh-Hans.json) ───────────────────────

const UI_SYSTEM_PROMPT = `You are a Traditional Chinese to Simplified Chinese converter for a game guide website (Pokémon Pokopia / 宝可梦 Pokopia).

Convert ALL Traditional Chinese text values to Simplified Chinese.
This is a character conversion, NOT a creative translation.

Key conversions:
- 寶可夢 → 宝可梦, 圖鑑 → 图鉴, 棲息地 → 栖息地
- 製作 → 制作, 攻略站 → 攻略站, 訓練家 → 训练家
- 繁中 should become 简中 for the label
- SEO titles should be 50-60 chars (including " | Pokopia 攻略站" suffix ~12 chars)
- SEO descriptions should be 140-160 chars
- Keep ALL JSON keys unchanged
- Return ONLY valid JSON, no explanation

The output must be valid JSON with the exact same structure.`

async function convertUiTranslations() {
  const inputPath = "src/i18n/zh.json"
  const outputPath = "src/i18n/zh-Hans.json"

  if (fs.existsSync(outputPath)) {
    console.log(`✓ ${outputPath} — already exists, skipping`)
    return
  }

  const content = fs.readFileSync(inputPath, "utf-8")
  console.log(`→ Converting ${inputPath} → ${outputPath}...`)

  const result = await callGemini(
    UI_SYSTEM_PROMPT,
    `Convert this UI translation JSON from Traditional Chinese (zh-TW) to Simplified Chinese (zh-Hans). Adjust the locale label from "繁中" to "简中". Return ONLY the JSON:\n\n${content}`
  )

  let cleaned = result.replace(/^```json?\n/, "").replace(/\n```$/, "").trim()

  try {
    const parsed = JSON.parse(cleaned)
    fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2) + "\n")
    console.log(`✓ ${outputPath} — done`)
  } catch (e) {
    console.error(`✗ ${outputPath} — invalid JSON: ${e.message}`)
    fs.writeFileSync(outputPath + ".raw", cleaned)
  }

  await delay(2000)
}

// ─── MDX guides/events ──────────────────────────────────────────────

const MDX_SYSTEM_PROMPT = `You are a Traditional Chinese to Simplified Chinese converter for game guide MDX files.

Convert ALL Traditional Chinese text to Simplified Chinese (简体中文).
This is mostly character-by-character conversion.

Rules:
- Convert all Traditional Chinese characters to Simplified equivalents
- 寶可夢 → 宝可梦, 圖鑑 → 图鉴, 棲息地 → 栖息地, 製作 → 制作
- Keep ALL markdown formatting exactly as-is (headers ##, links [], images ![], tables |, bold **, etc.)
- Keep ALL file paths, URLs, image references unchanged
- Keep frontmatter keys unchanged, only convert values
- Return ONLY the converted MDX content, no explanation or code fences`

async function convertMdxFiles() {
  const zhGuidesDir = "content/zh/guides"
  const zhHansGuidesDir = "content/zh-Hans/guides"
  const zhEventsDir = "content/zh/events"
  const zhHansEventsDir = "content/zh-Hans/events"

  fs.mkdirSync(zhHansGuidesDir, { recursive: true })
  fs.mkdirSync(zhHansEventsDir, { recursive: true })

  // Convert guides
  const guideFiles = fs.readdirSync(zhGuidesDir).filter((f) => f.endsWith(".mdx"))
  for (const file of guideFiles) {
    const outputPath = path.join(zhHansGuidesDir, file)
    if (fs.existsSync(outputPath)) {
      console.log(`✓ guides/${file} — already exists, skipping`)
      continue
    }

    const content = fs.readFileSync(path.join(zhGuidesDir, file), "utf-8")
    console.log(`→ Converting guides/${file}...`)

    try {
      let result = await callGemini(
        MDX_SYSTEM_PROMPT,
        `Convert this MDX file from Traditional Chinese to Simplified Chinese:\n\n${content}`
      )
      result = result.replace(/^```mdx?\n/, "").replace(/\n```$/, "").trim()
      fs.writeFileSync(outputPath, result + "\n")
      console.log(`✓ guides/${file} — done`)
    } catch (err) {
      console.error(`✗ guides/${file} — ${err.message}`)
    }

    await delay(1500)
  }

  // Convert events
  let eventFiles = []
  try {
    eventFiles = fs.readdirSync(zhEventsDir).filter((f) => f.endsWith(".mdx"))
  } catch {
    // events dir may not exist
  }

  for (const file of eventFiles) {
    const outputPath = path.join(zhHansEventsDir, file)
    if (fs.existsSync(outputPath)) {
      console.log(`✓ events/${file} — already exists, skipping`)
      continue
    }

    const content = fs.readFileSync(path.join(zhEventsDir, file), "utf-8")
    console.log(`→ Converting events/${file}...`)

    try {
      let result = await callGemini(
        MDX_SYSTEM_PROMPT,
        `Convert this MDX file from Traditional Chinese to Simplified Chinese:\n\n${content}`
      )
      result = result.replace(/^```mdx?\n/, "").replace(/\n```$/, "").trim()
      fs.writeFileSync(outputPath, result + "\n")
      console.log(`✓ events/${file} — done`)
    } catch (err) {
      console.error(`✗ events/${file} — ${err.message}`)
    }

    await delay(1500)
  }
}

// ─── Pokemon JSON files ─────────────────────────────────────────────

const POKEMON_SYSTEM_PROMPT = `You are a Traditional Chinese to Simplified Chinese converter for Pokemon JSON data files.

Convert ALL Traditional Chinese text values to Simplified Chinese.
This is character-by-character conversion for most text.

Rules:
- Convert Pokemon names: 皮卡丘→皮卡丘(same), 傑尼龜→杰尼龟, 妙蛙種子→妙蛙种子, etc.
- Convert habitat names, obtainDetails, and favorites text
- Keep ALL JSON keys, numbers, English text, URLs unchanged
- Keep slug, id, types, image, rarity values unchanged
- Return ONLY valid JSON, no explanation or markdown`

async function convertPokemonFiles() {
  const zhDir = "content/zh/pokemon"
  const zhHansDir = "content/zh-Hans/pokemon"
  fs.mkdirSync(zhHansDir, { recursive: true })

  const files = fs.readdirSync(zhDir).filter((f) => f.endsWith(".json"))
  console.log(`\n→ Converting ${files.length} pokemon files...`)

  // Process in batches of 10 for efficiency
  const BATCH_SIZE = 10

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE)
    const batchContent = {}

    let allExist = true
    for (const file of batch) {
      const outputPath = path.join(zhHansDir, file)
      if (!fs.existsSync(outputPath)) {
        allExist = false
      }
    }

    if (allExist) {
      console.log(`✓ pokemon batch ${i / BATCH_SIZE + 1} — all exist, skipping`)
      continue
    }

    for (const file of batch) {
      const outputPath = path.join(zhHansDir, file)
      if (fs.existsSync(outputPath)) continue
      batchContent[file] = fs.readFileSync(path.join(zhDir, file), "utf-8")
    }

    if (Object.keys(batchContent).length === 0) continue

    const batchJson = JSON.stringify(batchContent, null, 2)
    console.log(`→ Converting pokemon batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(files.length / BATCH_SIZE)} (${Object.keys(batchContent).length} files)...`)

    try {
      const result = await callGemini(
        POKEMON_SYSTEM_PROMPT,
        `Convert these Pokemon JSON files from Traditional Chinese to Simplified Chinese. The input is a JSON object where keys are filenames and values are the file contents. Return the same structure with converted values:\n\n${batchJson}`
      )

      let cleaned = result.replace(/^```json?\n/, "").replace(/\n```$/, "").trim()
      const parsed = JSON.parse(cleaned)

      for (const [file, content] of Object.entries(parsed)) {
        const outputPath = path.join(zhHansDir, file)
        if (typeof content === "string") {
          // If the content is still a string, try to parse it
          try {
            const innerParsed = JSON.parse(content)
            fs.writeFileSync(outputPath, JSON.stringify(innerParsed, null, 2) + "\n")
          } catch {
            fs.writeFileSync(outputPath, content + "\n")
          }
        } else {
          fs.writeFileSync(outputPath, JSON.stringify(content, null, 2) + "\n")
        }
      }

      console.log(`✓ pokemon batch ${Math.floor(i / BATCH_SIZE) + 1} — done`)
    } catch (err) {
      console.error(`✗ pokemon batch ${Math.floor(i / BATCH_SIZE) + 1} — ${err.message}`)
      // Fallback: copy files directly (Traditional and Simplified share most Pokemon names)
      for (const [file, content] of Object.entries(batchContent)) {
        const outputPath = path.join(zhHansDir, file)
        if (!fs.existsSync(outputPath)) {
          fs.writeFileSync(outputPath, content)
          console.log(`  ⚠ ${file} — copied from zh (fallback)`)
        }
      }
    }

    await delay(2000)
  }
}

// ─── Multi-entry JSON files (add zh-Hans keys) ─────────────────────

async function updateMultiEntryJsonFiles() {
  // material-source-translations.json: add "zh-Hans" key to each entry
  const srcTransPath = "content/material-source-translations.json"
  const srcTrans = JSON.parse(fs.readFileSync(srcTransPath, "utf-8"))

  let needsUpdate = false
  const zhValues = []
  for (const [key, val] of Object.entries(srcTrans)) {
    if (!val["zh-Hans"] && val.zh) {
      needsUpdate = true
      zhValues.push({ key, zh: val.zh })
    }
  }

  if (needsUpdate && zhValues.length > 0) {
    console.log(`→ Converting material-source-translations.json (${zhValues.length} entries)...`)

    // Batch convert zh values
    const zhTexts = zhValues.map((v) => v.zh)
    const result = await callGemini(
      JSON_SYSTEM_PROMPT,
      `Convert these Traditional Chinese texts to Simplified Chinese. Return a JSON array with the converted texts in the same order:\n\n${JSON.stringify(zhTexts)}`
    )

    let cleaned = result.replace(/^```json?\n/, "").replace(/\n```$/, "").trim()
    try {
      const converted = JSON.parse(cleaned)
      for (let i = 0; i < zhValues.length; i++) {
        srcTrans[zhValues[i].key]["zh-Hans"] = converted[i]
      }
      fs.writeFileSync(srcTransPath, JSON.stringify(srcTrans, null, 2) + "\n")
      console.log(`✓ material-source-translations.json — done`)
    } catch (e) {
      console.error(`✗ material-source-translations.json — ${e.message}`)
    }

    await delay(1500)
  } else {
    console.log(`✓ material-source-translations.json — already has zh-Hans or no zh values`)
  }

  // material-name-mapping.json: add "zh-Hans" key to each entry
  const nameMapPath = "content/material-name-mapping.json"
  const nameMap = JSON.parse(fs.readFileSync(nameMapPath, "utf-8"))

  const zhNameValues = []
  for (const [key, val] of Object.entries(nameMap)) {
    if (!val["zh-Hans"] && val.zh) {
      zhNameValues.push({ key, zh: val.zh })
    }
  }

  if (zhNameValues.length > 0) {
    console.log(`→ Converting material-name-mapping.json (${zhNameValues.length} entries)...`)

    const zhTexts = zhNameValues.map((v) => v.zh)
    const result = await callGemini(
      JSON_SYSTEM_PROMPT,
      `Convert these Traditional Chinese material names to Simplified Chinese. Return a JSON array with the converted texts in the same order:\n\n${JSON.stringify(zhTexts)}`
    )

    let cleaned = result.replace(/^```json?\n/, "").replace(/\n```$/, "").trim()
    try {
      const converted = JSON.parse(cleaned)
      for (let i = 0; i < zhNameValues.length; i++) {
        nameMap[zhNameValues[i].key]["zh-Hans"] = converted[i]
      }
      fs.writeFileSync(nameMapPath, JSON.stringify(nameMap, null, 2) + "\n")
      console.log(`✓ material-name-mapping.json — done`)
    } catch (e) {
      console.error(`✗ material-name-mapping.json — ${e.message}`)
    }

    await delay(1500)
  } else {
    console.log(`✓ material-name-mapping.json — already has zh-Hans`)
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// ─── Main ────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const runAll = args.includes("--all") || args.length === 0
  const runJson = runAll || args.includes("--json")
  const runGuides = runAll || args.includes("--guides")
  const runPokemon = runAll || args.includes("--pokemon")

  console.log("🔄 Translating zh (Traditional) → zh-Hans (Simplified)\n")

  if (runJson) {
    console.log("═══ JSON mapping files ═══")
    // Content mapping files to convert
    const jsonPairs = [
      ["content/habitat-mapping-zh.json", "content/habitat-mapping-zh-Hans.json"],
      ["content/habitat-materials-zh.json", "content/habitat-materials-zh-Hans.json"],
      ["content/item-name-mapping-zh.json", "content/item-name-mapping-zh-Hans.json"],
      ["content/item-obtain-mapping-zh.json", "content/item-obtain-mapping-zh-Hans.json"],
      ["content/item-recipe-mapping-zh.json", "content/item-recipe-mapping-zh-Hans.json"],
      ["content/item-desc-mapping-zh.json", "content/item-desc-mapping-zh-Hans.json"],
      ["content/crafting-name-mapping-zh.json", "content/crafting-name-mapping-zh-Hans.json"],
      ["content/cooking-name-mapping-zh.json", "content/cooking-name-mapping-zh-Hans.json"],
    ]

    for (const [input, output] of jsonPairs) {
      if (fs.existsSync(output)) {
        console.log(`✓ ${path.basename(output)} — already exists, skipping`)
        continue
      }
      await convertJsonFile(input, output)
    }

    console.log("\n═══ UI translations ═══")
    await convertUiTranslations()

    console.log("\n═══ Multi-entry JSON files ═══")
    await updateMultiEntryJsonFiles()
  }

  if (runGuides) {
    console.log("\n═══ MDX guides & events ═══")
    await convertMdxFiles()
  }

  if (runPokemon) {
    console.log("\n═══ Pokemon files ═══")
    await convertPokemonFiles()
  }

  console.log("\n✅ All done!")
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
