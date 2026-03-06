import fs from "fs/promises"
import path from "path"

const BASE_URL = "https://pokopiaguide.com"

const LOCALES = [
  { code: "en", prefix: "" },
  { code: "zh", prefix: "/zh" },
  { code: "ja", prefix: "/ja" },
]

const POKEMON_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
]

async function main() {
  const today = new Date().toISOString().split("T")[0]
  const allPages = []

  // Collect all specialties from pokemon data
  const allSpecialties = new Set()
  const enPokemonDir = path.join(process.cwd(), "content/en/pokemon")
  const enPokemonFiles = (await fs.readdir(enPokemonDir)).filter((f) => f.endsWith(".json"))
  for (const f of enPokemonFiles) {
    const data = JSON.parse(await fs.readFile(path.join(enPokemonDir, f), "utf-8"))
    if (data.pokopia?.specialties) {
      for (const s of data.pokopia.specialties) {
        allSpecialties.add(s)
      }
    }
  }

  // Collect all habitat IDs
  const habitatMapping = JSON.parse(
    await fs.readFile(path.join(process.cwd(), "content/habitat-mapping-en.json"), "utf-8")
  )
  const habitatIds = Object.keys(habitatMapping)

  for (const locale of LOCALES) {
    const pokemonDir = path.join(process.cwd(), `content/${locale.code}/pokemon`)
    const guidesDir = path.join(process.cwd(), `content/${locale.code}/guides`)
    const eventsDir = path.join(process.cwd(), `content/${locale.code}/events`)

    const pokemonFiles = (await fs.readdir(pokemonDir)).filter((f) => f.endsWith(".json"))
    const guideFiles = (await fs.readdir(guidesDir)).filter((f) => f.endsWith(".mdx"))

    let eventFiles = []
    try {
      eventFiles = (await fs.readdir(eventsDir)).filter((f) => f.endsWith(".mdx"))
    } catch {
      // events dir may not exist for all locales
    }

    // Static pages
    const staticPages = [
      { url: `${locale.prefix}/`, priority: "1.0", changefreq: "daily" },
      { url: `${locale.prefix}/pokedex`, priority: "0.9", changefreq: "weekly" },
      { url: `${locale.prefix}/guides`, priority: "0.9", changefreq: "weekly" },
      { url: `${locale.prefix}/events`, priority: "0.8", changefreq: "weekly" },
      { url: `${locale.prefix}/habitat`, priority: "0.8", changefreq: "weekly" },
      { url: `${locale.prefix}/habitat/list`, priority: "0.8", changefreq: "weekly" },
      { url: `${locale.prefix}/explore`, priority: "0.5", changefreq: "monthly" },
      { url: `${locale.prefix}/multiplayer`, priority: "0.5", changefreq: "monthly" },
      { url: `${locale.prefix}/quests`, priority: "0.5", changefreq: "monthly" },
    ]

    // Pokemon detail pages
    const pokemonPages = pokemonFiles.map((f) => ({
      url: `${locale.prefix}/pokedex/${f.replace(".json", "")}`,
      priority: "0.7",
      changefreq: "weekly",
    }))

    // Guide pages
    const guidePages = guideFiles.map((f) => ({
      url: `${locale.prefix}/guides/${f.replace(".mdx", "")}`,
      priority: "0.8",
      changefreq: "monthly",
    }))

    // Event pages
    const eventPages = eventFiles.map((f) => ({
      url: `${locale.prefix}/events/${f.replace(".mdx", "")}`,
      priority: "0.8",
      changefreq: "weekly",
    }))

    // Type browse pages
    const typePages = POKEMON_TYPES.map((type) => ({
      url: `${locale.prefix}/pokedex/type/${type}`,
      priority: "0.6",
      changefreq: "weekly",
    }))

    // Specialty browse pages
    const specialtyPages = [...allSpecialties].map((spec) => ({
      url: `${locale.prefix}/pokedex/specialty/${spec}`,
      priority: "0.6",
      changefreq: "weekly",
    }))

    // Habitat detail pages
    const habitatPages = habitatIds.map((id) => ({
      url: `${locale.prefix}/habitat/list/${id}`,
      priority: "0.6",
      changefreq: "weekly",
    }))

    allPages.push(
      ...staticPages,
      ...pokemonPages,
      ...guidePages,
      ...eventPages,
      ...typePages,
      ...specialtyPages,
      ...habitatPages
    )
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`

  await fs.writeFile(path.join(process.cwd(), "public/sitemap.xml"), xml)
  console.log(`Sitemap generated with ${allPages.length} URLs`)
}

main()
