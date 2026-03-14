#!/usr/bin/env node
// Translate English guides to Spanish using Gemini 2.5 Flash API

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
const ES_DIR = "content/es/guides"

const SYSTEM_PROMPT = `You are a professional Spanish game translator. Translate the following Pokopia game guide MDX file from English to Spanish.

CRITICAL RULES:
- Keep ALL markdown formatting exactly as-is (headers ##, links [], images ![], tables |, bold **, etc.)
- Keep ALL file paths, URLs, image references, and frontmatter keys unchanged
- Translate frontmatter "title" and "description" values only
- Change category to Spanish equivalent (e.g. "Gameplay Guide" → "Guía de Juego", "Getting Started" → "Guía para Principiantes", "Building Guide" → "Guía de Construcción")
- Keep "date" and "author" values unchanged
- Return ONLY the translated MDX content, no explanation

Spanish Pokemon terminology:
- Pokémon = Pokémon, Pokédex = Pokédex (keep as-is)
- Snorlax=Snorlax, Ho-Oh=Ho-Oh, Lugia=Lugia, Mew=Mew, Onix=Onix, Bulbasaur=Bulbasaur
- Eevee=Eevee, Pikachu=Pikachu, Chansey=Chansey, Ditto=Ditto
- Scyther=Scyther, Pinsir=Pinsir, Heracross=Heracross
- Charmander=Charmander, Vulpix=Vulpix
- habitat=hábitat, Dream Island=Islas Ensueño, environment level=nivel de entorno
- Bleak Beach=Bahía Borrasca, Withered Wasteland=Estepa Estéril
- Rocky Ridges=Riscos Rocosos, Sparkling Skylands=Islas Aisladas
- Palette Town=Pradera Paleta, Dusty Desert=Estepa Estéril
- Mosslax=Mosslax, Cultivate=Cultivar, Bulldoze=Aplanar
- stamp rally=colección de sellos, Life Coins=Monedas de Vida
- comfort level=nivel de comodidad (すみごこち)

Types (official Spanish): Normal, Fuego, Agua, Eléctrico, Planta, Hielo, Lucha, Veneno, Tierra, Volador, Psíquico, Bicho, Roca, Fantasma, Dragón, Siniestro, Acero, Hada

Food/Cooking:
- Salad=Ensalada, Soup=Sopa, Bread=Pan, Hamburger Steak=Filete de Hamburguesa
- Leafage=Hojas Afiladas, Water Gun=Pistola Agua, Rock Smash=Golpe Roca, Cut=Corte
- Cooking Recipes=Recetas de Cocina

Specialties: Grow=Cultivar, Burn=Quemar, Water=Regar, Build=Construir, Chop=Talar, Crush=Triturar, Search=Buscar, Fly=Volar, Bulldoze=Aplanar, Recycle=Reciclar, Litter=Esparcir

Flavors: Spicy=Picante, Dry=Seco, Sweet=Dulce, Bitter=Amargo, Sour=Ácido

Keep tone informative and friendly. Use "tú" form (informal second person).`

async function translateWithGemini(content) {
  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: `Translate this MDX guide to Spanish:\n\n${content}` }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 16384,
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
  fs.mkdirSync(ES_DIR, { recursive: true })
  const files = fs.readdirSync(EN_DIR).filter((f) => f.endsWith(".mdx"))

  for (const file of files) {
    const esPath = path.join(ES_DIR, file)
    const enPath = path.join(EN_DIR, file)

    // Skip already translated (check if title contains Spanish chars like á, é, í, ó, ú, ñ or common Spanish words)
    if (fs.existsSync(esPath)) {
      const existing = fs.readFileSync(esPath, "utf-8")
      const titleMatch = existing.match(/^title:\s*"(.+)"/m)
      if (titleMatch && /[áéíóúñ¿¡]|Guía|Cómo/i.test(titleMatch[1])) {
        console.log(`✓ ${file} — already translated, skipping`)
        continue
      }
    }

    const enContent = fs.readFileSync(enPath, "utf-8")
    console.log(`→ Translating ${file}...`)

    try {
      const translated = await translateWithGemini(enContent)
      fs.writeFileSync(esPath, translated + "\n")
      console.log(`✓ ${file} — done`)
    } catch (err) {
      console.error(`✗ ${file} — ${err.message}`)
    }

    // Delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 2000))
  }

  console.log("\nAll done!")
}

main()
