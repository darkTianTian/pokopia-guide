#!/usr/bin/env node
// Setup Spanish (es) locale: translate UI strings, mapping files, and pokemon data using Gemini API

import "dotenv/config"
import fs from "fs"
import path from "path"

const API_KEY = process.env.GEMINI_API_KEY
if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is not set")
  process.exit(1)
}
const MODEL = "gemini-2.5-flash"

async function callGemini(systemPrompt, userPrompt, maxTokens = 8192, retries = 3) {
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
            generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens },
          }),
        }
      )
      const data = await resp.json()
      if (data.error) throw new Error(`Gemini API error: ${data.error.message}`)
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error("No text in Gemini response")
      text = text.replace(/^```(?:json|mdx?)?\n/, "").replace(/\n```$/, "").trim()
      return text
    } catch (err) {
      console.log(`  ⚠ Attempt ${attempt}/${retries} failed: ${err.message}`)
      if (attempt === retries) throw err
      await new Promise((r) => setTimeout(r, 3000 * attempt))
    }
  }
}

// Split large JSON into chunks and translate each
async function translateLargeJson(sourceJson, systemPrompt, context, chunkSize = 100) {
  const obj = JSON.parse(sourceJson)
  const keys = Object.keys(obj)
  if (keys.length <= chunkSize) {
    const text = await callGemini(systemPrompt + (context ? `\n\n${context}` : ""),
      `Translate the values in this JSON to Spanish. Keep keys unchanged:\n\n${sourceJson}`, 32768)
    return text
  }
  // Split into chunks
  const result = {}
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunkKeys = keys.slice(i, i + chunkSize)
    const chunk = Object.fromEntries(chunkKeys.map((k) => [k, obj[k]]))
    console.log(`  → Chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(keys.length / chunkSize)} (${chunkKeys.length} entries)...`)
    const text = await callGemini(systemPrompt + (context ? `\n\n${context}` : ""),
      `Translate the values in this JSON to Spanish. Keep keys unchanged:\n\n${JSON.stringify(chunk, null, 2)}`, 32768)
    Object.assign(result, JSON.parse(text))
    await new Promise((r) => setTimeout(r, 2000))
  }
  return JSON.stringify(result, null, 2)
}

const TRANSLATE_JSON_PROMPT = `You are a professional Spanish game translator for Pokémon Pokopia.
Translate the JSON values from English to Spanish. Keep all JSON keys unchanged.
Use European Spanish (Castilian) as base, but keep it universally understandable for Latin American players too.

Pokémon terminology in Spanish:
- Pokémon = Pokémon, Pokédex = Pokédex (keep as-is)
- habitat = hábitat, Dream Island = Islas Ensueño
- environment level = nivel de entorno
- crafting = fabricación, cooking = cocina
- specialty = especialidad, favorites = favoritos

Type names (official Spanish): Normal, Fuego, Agua, Eléctrico, Planta, Hielo, Lucha, Veneno, Tierra, Volador, Psíquico, Bicho, Roca, Fantasma, Dragón, Siniestro, Acero, Hada

Return ONLY valid JSON, no explanation.`

// Step 1: Translate UI strings (en.json → es.json)
async function translateUIStrings() {
  const outPath = "src/i18n/es.json"
  if (fs.existsSync(outPath)) {
    console.log("✓ es.json already exists, skipping")
    return
  }
  const enJson = fs.readFileSync("src/i18n/en.json", "utf-8")
  console.log("→ Translating UI strings (en.json → es.json)...")

  // Split into chunks to avoid token limits
  const enObj = JSON.parse(enJson)
  const keys = Object.keys(enObj)
  const half = Math.ceil(keys.length / 2)
  const chunk1 = Object.fromEntries(keys.slice(0, half).map((k) => [k, enObj[k]]))
  const chunk2 = Object.fromEntries(keys.slice(half).map((k) => [k, enObj[k]]))

  const result1 = await callGemini(
    TRANSLATE_JSON_PROMPT + "\n\nIMPORTANT: For titleTemplate, use '%s | Pokopia Guía'. For site name use 'Pokopia Guía'.",
    `Translate this JSON to Spanish:\n\n${JSON.stringify(chunk1, null, 2)}`,
    16384
  )
  await new Promise((r) => setTimeout(r, 2000))
  const result2 = await callGemini(
    TRANSLATE_JSON_PROMPT,
    `Translate this JSON to Spanish:\n\n${JSON.stringify(chunk2, null, 2)}`,
    16384
  )

  const merged = { ...JSON.parse(result1), ...JSON.parse(result2) }
  fs.writeFileSync(outPath, JSON.stringify(merged, null, 2) + "\n")
  console.log("✓ es.json created")
}

// Step 2: Translate mapping files (ko pattern → es)
async function translateMappingFile(sourcePath, targetPath, context = "") {
  if (fs.existsSync(targetPath)) {
    console.log(`✓ ${targetPath} already exists, skipping`)
    return
  }
  // Use English source if available, otherwise Korean
  const enPath = sourcePath.replace("-ko.json", "-en.json").replace("-zh.json", "-en.json")
  const readPath = fs.existsSync(enPath) ? enPath : sourcePath
  const sourceJson = fs.readFileSync(readPath, "utf-8")
  console.log(`→ Translating ${path.basename(readPath)} → ${path.basename(targetPath)}...`)

  const text = await translateLargeJson(sourceJson, TRANSLATE_JSON_PROMPT, context)
  // Ensure valid JSON
  const parsed = typeof text === "string" ? text : JSON.stringify(JSON.parse(text), null, 2)
  fs.writeFileSync(targetPath, parsed + "\n")
  console.log(`✓ ${path.basename(targetPath)} created`)
  await new Promise((r) => setTimeout(r, 2000))
}

// Step 3: Generate Spanish Pokemon files
async function generatePokemonFiles() {
  const esDir = "content/es/pokemon"
  if (fs.existsSync(esDir) && fs.readdirSync(esDir).length > 10) {
    console.log("✓ Spanish pokemon files already exist, skipping")
    return
  }
  fs.mkdirSync(esDir, { recursive: true })

  // Get Spanish Pokemon names from PokeAPI
  console.log("→ Fetching Spanish Pokémon names from PokeAPI...")
  const enFiles = fs.readdirSync("content/en/pokemon").filter((f) => f.endsWith(".json"))

  // Read all English files to get national dex IDs
  const pokemonList = []
  for (const file of enFiles) {
    const data = JSON.parse(fs.readFileSync(`content/en/pokemon/${file}`, "utf-8"))
    pokemonList.push({ file, data })
  }

  // Batch fetch Spanish names from PokeAPI
  for (const { file, data } of pokemonList) {
    const esPath = path.join(esDir, file)
    if (fs.existsSync(esPath)) continue

    let esName = data.name // fallback to English
    try {
      // Handle regional forms
      const slug = data.slug
      let apiId = data.id
      if (slug === "paldean-wooper") apiId = "10253"

      const resp = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${apiId}`)
      if (resp.ok) {
        const species = await resp.json()
        const esEntry = species.names?.find((n) => n.language.name === "es")
        if (esEntry) esName = esEntry.name
      }
    } catch {
      // Keep English name as fallback
    }

    const esData = { ...data, name: esName }
    fs.writeFileSync(esPath, JSON.stringify(esData, null, 2) + "\n")
  }
  console.log(`✓ ${pokemonList.length} Spanish pokemon files created`)
}

// Step 4: Copy guide/event directories from English
async function copyContentDirs() {
  for (const dir of ["guides", "events"]) {
    const esDir = `content/es/${dir}`
    fs.mkdirSync(esDir, { recursive: true })
    const enDir = `content/en/${dir}`
    if (!fs.existsSync(enDir)) continue
    const files = fs.readdirSync(enDir)
    for (const file of files) {
      const esPath = path.join(esDir, file)
      if (!fs.existsSync(esPath)) {
        fs.copyFileSync(path.join(enDir, file), esPath)
      }
    }
    console.log(`✓ Copied ${files.length} files to content/es/${dir}/`)
  }
}

async function main() {
  console.log("=== Setting up Spanish (es) locale ===\n")

  // Phase 1: UI translations
  await translateUIStrings()

  // Phase 2: Content directories
  await copyContentDirs()

  // Phase 3: Pokemon files with official Spanish names
  await generatePokemonFiles()

  // Phase 4: Mapping files
  const mappings = [
    ["content/habitat-mapping-ko.json", "content/habitat-mapping-es.json", "These are habitat/biome names in a Pokemon game."],
    ["content/habitat-materials-ko.json", "content/habitat-materials-es.json", "These are crafting material lists for habitats. Item names should be translated to Spanish."],
    ["content/item-name-mapping-ko.json", "content/item-name-mapping-es.json", "These map Japanese item names to localized names. Translate to Spanish game item names."],
    ["content/item-obtain-mapping-ko.json", "content/item-obtain-mapping-es.json", "These describe how items are obtained in-game."],
    ["content/item-recipe-mapping-ko.json", "content/item-recipe-mapping-es.json", "These describe crafting recipe unlock conditions."],
    ["content/item-desc-mapping-ko.json", "content/item-desc-mapping-es.json", "These are item descriptions in a Pokemon game."],
    ["content/crafting-name-mapping-ko.json", "content/crafting-name-mapping-es.json", "These are crafting recipe names and materials."],
    ["content/cooking-name-mapping-ko.json", "content/cooking-name-mapping-es.json", "These are cooking recipe names, ingredients, and tools."],
  ]

  for (const [src, target, ctx] of mappings) {
    if (fs.existsSync(src)) {
      await translateMappingFile(src, target, ctx)
    } else {
      console.log(`⚠ ${src} not found, skipping`)
    }
  }

  console.log("\n=== Spanish locale setup complete! ===")
  console.log("Next steps:")
  console.log("1. Run: node scripts/translate-guides-es.mjs")
  console.log("2. Update lib files to import es mappings")
  console.log("3. Update route files to include es locale")
}

main().catch(console.error)
