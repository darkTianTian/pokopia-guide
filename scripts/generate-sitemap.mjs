import fs from "fs/promises"
import path from "path"

const BASE_URL = "https://pokopiaguide.com"

const LOCALES = [
  { code: "en", prefix: "" },
  { code: "cn", prefix: "/cn" },
  { code: "jp", prefix: "/jp" },
]

async function main() {
  const today = new Date().toISOString().split("T")[0]
  const allPages = []

  for (const locale of LOCALES) {
    const pokemonDir = path.join(process.cwd(), `content/${locale.code}/pokemon`)
    const guidesDir = path.join(process.cwd(), `content/${locale.code}/guides`)

    const pokemonFiles = (await fs.readdir(pokemonDir)).filter((f) =>
      f.endsWith(".json")
    )
    const guideFiles = (await fs.readdir(guidesDir)).filter((f) =>
      f.endsWith(".mdx")
    )

    const staticPages = [
      { url: `${locale.prefix}/`, priority: "1.0", changefreq: "daily" },
      { url: `${locale.prefix}/pokedex`, priority: "0.9", changefreq: "weekly" },
      { url: `${locale.prefix}/guides`, priority: "0.9", changefreq: "weekly" },
    ]

    const pokemonPages = pokemonFiles.map((f) => ({
      url: `${locale.prefix}/pokedex/${f.replace(".json", "")}`,
      priority: "0.7",
      changefreq: "weekly",
    }))

    const guidePages = guideFiles.map((f) => ({
      url: `${locale.prefix}/guides/${f.replace(".mdx", "")}`,
      priority: "0.8",
      changefreq: "monthly",
    }))

    allPages.push(...staticPages, ...pokemonPages, ...guidePages)
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
