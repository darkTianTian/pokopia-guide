import fs from "fs/promises"
import path from "path"

const BASE_URL = "https://pokopia.guide"

async function main() {
  const pokemonDir = path.join(process.cwd(), "content/pokemon")
  const guidesDir = path.join(process.cwd(), "content/guides")

  const pokemonFiles = (await fs.readdir(pokemonDir)).filter((f) =>
    f.endsWith(".json")
  )
  const guideFiles = (await fs.readdir(guidesDir)).filter((f) =>
    f.endsWith(".mdx")
  )

  const today = new Date().toISOString().split("T")[0]

  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/pokedex", priority: "0.9", changefreq: "weekly" },
    { url: "/guides", priority: "0.9", changefreq: "weekly" },
  ]

  const pokemonPages = pokemonFiles.map((f) => ({
    url: `/pokedex/${f.replace(".json", "")}`,
    priority: "0.7",
    changefreq: "weekly",
  }))

  const guidePages = guideFiles.map((f) => ({
    url: `/guides/${f.replace(".mdx", "")}`,
    priority: "0.8",
    changefreq: "monthly",
  }))

  const allPages = [...staticPages, ...pokemonPages, ...guidePages]

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
