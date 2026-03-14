#!/usr/bin/env node

/**
 * Translate item descriptions from Japanese to Traditional Chinese (zh-TW)
 * Usage: ANTHROPIC_API_KEY=sk-xxx node scripts/translate-item-desc-zh.mjs
 *
 * Features:
 * - Batch translation (10 descriptions per API call)
 * - Auto-saves progress after each batch
 * - Skips already translated descriptions
 * - Resumes from where it left off
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = resolve(__dirname, '../content')

const ITEMS_PATH = resolve(CONTENT_DIR, 'items.json')
const OUTPUT_PATH = resolve(CONTENT_DIR, 'item-desc-mapping-zh.json')

const API_KEY = process.env.ANTHROPIC_API_KEY
if (!API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required')
  console.error('Usage: ANTHROPIC_API_KEY=sk-xxx node scripts/translate-item-desc-zh.mjs')
  process.exit(1)
}

const BATCH_SIZE = 10
const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-haiku-4-5-20251001'

function loadExistingMapping() {
  try {
    const raw = readFileSync(OUTPUT_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveMapping(mapping) {
  const sorted = Object.keys(mapping)
    .sort()
    .reduce((acc, key) => {
      acc[key] = mapping[key]
      return acc
    }, {})
  writeFileSync(OUTPUT_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf-8')
}

function getUniqueDescriptions() {
  const items = JSON.parse(readFileSync(ITEMS_PATH, 'utf-8'))
  const descs = new Set()
  for (const item of items) {
    if (item.description) {
      descs.add(item.description)
    }
  }
  return [...descs]
}

async function translateBatch(descriptions) {
  const numbered = descriptions.map((d, i) => `${i + 1}. ${d}`).join('\n')

  const body = {
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are translating item descriptions for the game Pokopia (ポコピア) from Japanese to Traditional Chinese (繁體中文/zh-TW).

Rules:
- Translate naturally for a Taiwanese audience
- Keep Pokémon-related terms in their official Traditional Chinese translations
- Keep the tone casual and fun, matching the game's style
- Output ONLY a JSON object mapping each Japanese description to its Traditional Chinese translation
- No extra text, no markdown code blocks, just the JSON object

Translate these descriptions:
${numbered}`
      }
    ]
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`API error ${res.status}: ${errorText}`)
  }

  const data = await res.json()
  const text = data.content[0].text.trim()

  // Parse JSON, handle potential markdown code blocks
  const jsonStr = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(jsonStr)
}

async function main() {
  const allDescs = getUniqueDescriptions()
  const existing = loadExistingMapping()

  const todo = allDescs.filter((d) => !existing[d])

  console.log(`Total unique descriptions: ${allDescs.length}`)
  console.log(`Already translated: ${Object.keys(existing).length}`)
  console.log(`Remaining: ${todo.length}`)
  console.log('')

  if (todo.length === 0) {
    console.log('All descriptions are already translated!')
    return
  }

  const totalBatches = Math.ceil(todo.length / BATCH_SIZE)
  let translated = 0
  let errors = 0

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    const batch = todo.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1

    process.stdout.write(
      `[${batchNum}/${totalBatches}] Translating ${batch.length} descriptions... `
    )

    try {
      const result = await translateBatch(batch)

      for (const [ja, zh] of Object.entries(result)) {
        existing[ja] = zh
        translated++
      }

      // Check for any descriptions in the batch that weren't returned
      for (const desc of batch) {
        if (!existing[desc]) {
          console.warn(`  Warning: missing translation for "${desc.slice(0, 30)}..."`)
        }
      }

      saveMapping(existing)
      const pct = ((translated / todo.length) * 100).toFixed(1)
      console.log(`OK (${translated}/${todo.length} = ${pct}%)`)
    } catch (err) {
      errors++
      console.error(`FAILED: ${err.message}`)

      if (errors >= 3) {
        console.error('\nToo many consecutive errors, stopping.')
        console.error(`Progress saved: ${translated} new translations.`)
        process.exit(1)
      }

      // Wait a bit before retrying on error
      await new Promise((r) => setTimeout(r, 3000))
      // Retry this batch
      i -= BATCH_SIZE
      continue
    }

    // Reset error counter on success
    errors = 0

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log('')
  console.log(`Done! Translated ${translated} descriptions.`)
  console.log(`Total in mapping: ${Object.keys(existing).length}`)
  console.log(`Saved to: ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
