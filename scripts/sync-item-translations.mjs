#!/usr/bin/env node
// Sync item translation mappings: find keys in English mappings that are missing
// from other locales and translate them using Gemini API.
// Runs after scrape-items.mjs to fill in ko, zh-Hans, es translations.

import "dotenv/config"
import fs from "fs"
import path from "path"

const API_KEY = process.env.GEMINI_API_KEY
if (!API_KEY) {
  console.log("GEMINI_API_KEY not set, skipping translation sync")
  process.exit(0)
}

const MODEL = "gemini-2.5-flash"
const CONTENT_DIR = path.join(process.cwd(), "content")

const LOCALES = [
  { code: "ko", label: "Korean" },
  { code: "zh-Hans", label: "Simplified Chinese" },
  { code: "es", label: "Spanish" },
]

// Mapping file types with their English source and context prompts
const MAPPING_TYPES = [
  {
    key: "name",
    enFile: "item-name-mapping-en.json",
    pattern: "item-name-mapping-{locale}.json",
    context: "These are item names in the Pokémon Pokopia game.",
  },
  {
    key: "desc",
    enFile: "item-desc-mapping-en.json",
    pattern: "item-desc-mapping-{locale}.json",
    context: "These are item descriptions in the Pokémon Pokopia game.",
  },
  {
    key: "obtain",
    enFile: "item-obtain-mapping-en.json",
    pattern: "item-obtain-mapping-{locale}.json",
    context: "These describe how items are obtained in the Pokémon Pokopia game.",
  },
  {
    key: "recipe",
    enFile: "item-recipe-mapping-en.json",
    pattern: "item-recipe-mapping-{locale}.json",
    context: "These describe crafting recipe unlock conditions in the Pokémon Pokopia game.",
  },
]

const AREA_NAMES = {
  ko: {
    "Palette Town": "백지 마을",
    "Withered Wasteland": "바싹바싹 황야",
    "Bleak Beach": "음산음산 해변",
    "Rocky Ridges": "울퉁불퉁 산지",
    "Sparkling Skylands": "반짝반짝 부유섬",
    "Dusty Desert": "바싹바싹 황야",
    "Dream Island": "꿈의 섬",
  },
  "zh-Hans": {
    "Palette Town": "空空镇",
    "Withered Wasteland": "干巴巴荒野",
    "Bleak Beach": "阴沉海边",
    "Rocky Ridges": "凸隆隆山地",
    "Sparkling Skylands": "亮晶晶空岛",
    "Dusty Desert": "干巴巴荒野",
    "Dream Island": "梦之岛",
  },
  es: {
    "Palette Town": "Pradera Paleta",
    "Withered Wasteland": "Estepa Estéril",
    "Bleak Beach": "Bahía Borrasca",
    "Rocky Ridges": "Riscos Rocosos",
    "Sparkling Skylands": "Islas Aisladas",
    "Dusty Desert": "Estepa Estéril",
    "Dream Island": "Islas Ensueño",
  },
}

function getTranslatePrompt(locale) {
  const langName = LOCALES.find((l) => l.code === locale)?.label ?? locale
  const areas = AREA_NAMES[locale]
  const areaLines = areas
    ? Object.entries(areas)
        .map(([en, loc]) => `${en} = ${loc}`)
        .join(", ")
    : ""

  return `You are a professional ${langName} game translator for Pokémon Pokopia.
Translate the JSON values from English to ${langName}. Keep all JSON keys unchanged.
${areaLines ? `\nUse these official area names: ${areaLines}` : ""}
Return ONLY valid JSON, no explanation.`
}

async function callGemini(systemPrompt, userPrompt, retries = 3) {
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
            generationConfig: { temperature: 0.2, maxOutputTokens: 32768 },
          }),
        }
      )
      const data = await resp.json()
      if (data.error) throw new Error(data.error.message)
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error("No text in response")
      text = text.replace(/^```(?:json)?\n/, "").replace(/\n```$/, "").trim()
      return JSON.parse(text)
    } catch (err) {
      console.log(`    ⚠ Attempt ${attempt}/${retries}: ${err.message}`)
      if (attempt === retries) throw err
      await new Promise((r) => setTimeout(r, 3000 * attempt))
    }
  }
}

async function translateChunked(missing, systemPrompt, context, chunkSize = 80) {
  const keys = Object.keys(missing)
  if (keys.length === 0) return {}

  const result = {}
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunkKeys = keys.slice(i, i + chunkSize)
    const chunk = Object.fromEntries(chunkKeys.map((k) => [k, missing[k]]))

    if (keys.length > chunkSize) {
      console.log(
        `    chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(keys.length / chunkSize)} (${chunkKeys.length} entries)...`
      )
    }

    const translated = await callGemini(
      systemPrompt + "\n\n" + context,
      `Translate the values in this JSON. Keep keys unchanged:\n\n${JSON.stringify(chunk, null, 2)}`
    )
    Object.assign(result, translated)

    if (i + chunkSize < keys.length) {
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
  return result
}

function replaceAreaNames(obj, locale) {
  const areas = AREA_NAMES[locale]
  if (!areas) return obj

  const result = {}
  for (const [k, v] of Object.entries(obj)) {
    let val = v
    if (typeof val === "string") {
      for (const [en, loc] of Object.entries(areas)) {
        val = val.replaceAll(en, loc)
      }
    }
    result[k] = val
  }
  return result
}

async function main() {
  console.log("=== Sync Item Translations ===\n")

  let totalTranslated = 0

  for (const mapping of MAPPING_TYPES) {
    const enPath = path.join(CONTENT_DIR, mapping.enFile)
    if (!fs.existsSync(enPath)) {
      console.log(`⚠ ${mapping.enFile} not found, skipping`)
      continue
    }

    const enData = JSON.parse(fs.readFileSync(enPath, "utf-8"))
    const enKeys = Object.keys(enData)

    for (const locale of LOCALES) {
      const localeFile = mapping.pattern.replace("{locale}", locale.code)
      const localePath = path.join(CONTENT_DIR, localeFile)

      let localeData = {}
      if (fs.existsSync(localePath)) {
        localeData = JSON.parse(fs.readFileSync(localePath, "utf-8"))
      }

      // Find missing keys
      const missingKeys = enKeys.filter((k) => !(k in localeData))
      if (missingKeys.length === 0) {
        continue
      }

      console.log(`→ ${localeFile}: ${missingKeys.length} missing entries`)

      // Build missing entries with English values for translation
      const missingEntries = Object.fromEntries(missingKeys.map((k) => [k, enData[k]]))

      try {
        const prompt = getTranslatePrompt(locale.code)
        let translated = await translateChunked(missingEntries, prompt, mapping.context)

        // Post-process: replace English area names with official locale names
        translated = replaceAreaNames(translated, locale.code)

        // Merge with existing
        const merged = { ...localeData, ...translated }
        fs.writeFileSync(localePath, JSON.stringify(merged, null, 2) + "\n")
        console.log(`  ✓ ${localeFile}: added ${Object.keys(translated).length} translations`)
        totalTranslated += Object.keys(translated).length
      } catch (err) {
        console.error(`  ✗ ${localeFile}: ${err.message}`)
      }

      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  if (totalTranslated === 0) {
    console.log("\n✓ All translations are up to date")
  } else {
    console.log(`\n✓ Added ${totalTranslated} translations`)
  }
}

main().catch(console.error)
