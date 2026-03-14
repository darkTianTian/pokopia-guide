import fs from "fs/promises"
import path from "path"

const BASE_URL = "https://pokopiaguide.com"

const LOCALES = [
  { code: "en", prefix: "" },
  { code: "zh", prefix: "/zh" },
  { code: "zh-Hans", prefix: "/zh-Hans" },
  { code: "ja", prefix: "/ja" },
  { code: "ko", prefix: "/ko" },
  { code: "es", prefix: "/es" },
]

async function main() {
  const today = new Date().toISOString().split("T")[0]
  const allPages = []

  for (const locale of LOCALES) {
    const guidesDir = path.join(process.cwd(), `content/${locale.code}/guides`)
    const eventsDir = path.join(process.cwd(), `content/${locale.code}/events`)

    const guideFiles = (await fs.readdir(guidesDir)).filter((f) => f.endsWith(".mdx"))

    let eventFiles = []
    try {
      eventFiles = (await fs.readdir(eventsDir)).filter((f) => f.endsWith(".mdx"))
    } catch {
      // events dir may not exist for all locales
    }

    // Static pages
    const staticPages = [
      { url: locale.prefix || "/", priority: "1.0", changefreq: "daily" },
      { url: `${locale.prefix}/pokedex`, priority: "0.9", changefreq: "weekly" },
      { url: `${locale.prefix}/guides`, priority: "0.9", changefreq: "weekly" },
      { url: `${locale.prefix}/events`, priority: "0.8", changefreq: "weekly" },
      { url: `${locale.prefix}/habitat`, priority: "0.8", changefreq: "weekly" },
      { url: `${locale.prefix}/habitat/materials`, priority: "0.8", changefreq: "weekly" },
      { url: `${locale.prefix}/crafting`, priority: "0.8", changefreq: "weekly" },
      { url: `${locale.prefix}/cooking`, priority: "0.8", changefreq: "weekly" },
      { url: `${locale.prefix}/items`, priority: "0.8", changefreq: "weekly" },
      { url: `${locale.prefix}/privacy`, priority: "0.3", changefreq: "yearly" },
      { url: `${locale.prefix}/terms`, priority: "0.3", changefreq: "yearly" },
      // explore, multiplayer, quests are coming-soon pages with noindex — excluded from sitemap
    ]

    // Pokemon detail pages are noindex, excluded from sitemap

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

    allPages.push(
      ...staticPages,
      ...guidePages,
      ...eventPages
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
