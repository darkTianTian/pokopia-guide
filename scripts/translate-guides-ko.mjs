#!/usr/bin/env node
// Translate English guides to Korean using Gemini 2.5 Flash API

import "dotenv/config"
import fs from "fs"
import path from "path"

const API_KEY = process.env.GEMINI_API_KEY
if (!API_KEY) {
  console.error("Error: GEMINI_API_KEY environment variable is not set")
  process.exit(1)
}
const MODEL = "gemini-2.5-flash"
const EN_DIR = "content/en/guides"
const KO_DIR = "content/ko/guides"

const SYSTEM_PROMPT = `You are a professional Korean game translator. Translate the following Pokopia game guide MDX file from English to Korean.

CRITICAL RULES:
- Keep ALL markdown formatting exactly as-is (headers ##, links [], images ![], tables |, bold **, etc.)
- Keep ALL file paths, URLs, image references, and frontmatter keys unchanged
- Translate frontmatter "title" and "description" values only
- Change category to Korean equivalent (e.g. "Gameplay Guide" → "게임플레이 가이드", "Getting Started" → "초보자 가이드")
- Keep "date" and "author" values unchanged
- Return ONLY the translated MDX content, no explanation

Korean Pokemon terminology:
- Pokémon = 포켓몬, Pokédex = 포켓몬 도감
- Snorlax=잠만보, Ho-Oh=호오우, Lugia=루기아, Mew=뮤, Onix=롱스톤, Bulbasaur=이상해씨
- Eevee=이브이, Pikachu=피카츄, Chansey=럭키, Ditto=메타몽
- habitat=서식지, Dream Island=꿈의 섬, environment level=환경 레벨
- Bleak Beach=칙칙한 해변, Withered Wasteland=시들어버린 황야
- Rocky Ridges=울퉁불퉁 산, Sparkling Skylands=반짝반짝 하늘섬
- Palette Town=팔레트 타운, Dusty Desert=바싹바싹 황야
- Mosslax=이끼잠만보, Cultivate=경작, Bulldoze=땅고르기
- stamp rally=스탬프 랠리, Life Coins=라이프 코인
- Switch 2=스위치 2, Nintendo=닌텐도
- Metacritic=메타크리틱

Food/Cooking:
- Mushroom Soup=버섯 수프, Herbal Soup=건강 수프
- Crouton Salad=크루통 샐러드, Potato Hamburger Steak=감자 함박스테이크
- Cooking Recipes=요리 레시피

Flavors: Spicy=매운맛, Dry=떫은맛, Sweet=달콤한맛, Bitter=쓴맛, Sour=신맛

Keep tone casual and helpful. Use 해요체 (polite informal) style.`

async function translateWithGemini(content) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: `Translate this MDX guide to Korean:\n\n${content}` }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      }),
    }
  )

  const data = await resp.json()
  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`)
  }

  let text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error("No text in Gemini response")

  // Strip markdown code fences if present
  text = text.replace(/^```mdx?\n/, "").replace(/\n```$/, "").trim()

  return text
}

async function main() {
  const files = fs.readdirSync(EN_DIR).filter((f) => f.endsWith(".mdx"))

  for (const file of files) {
    const koPath = path.join(KO_DIR, file)
    const enPath = path.join(EN_DIR, file)

    // Skip already translated (check if title contains Korean chars)
    const existing = fs.readFileSync(koPath, "utf-8")
    const titleMatch = existing.match(/^title:\s*"(.+)"/m)
    if (titleMatch && /[\uAC00-\uD7AF]/.test(titleMatch[1])) {
      console.log(`✓ ${file} — already translated, skipping`)
      continue
    }

    const enContent = fs.readFileSync(enPath, "utf-8")
    console.log(`→ Translating ${file}...`)

    try {
      const translated = await translateWithGemini(enContent)
      fs.writeFileSync(koPath, translated + "\n")
      console.log(`✓ ${file} — done`)
    } catch (err) {
      console.error(`✗ ${file} — ${err.message}`)
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1000))
  }

  console.log("\nAll done!")
}

main()
