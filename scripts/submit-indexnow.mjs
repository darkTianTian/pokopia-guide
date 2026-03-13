import fs from "fs/promises"
import path from "path"

const BASE_URL = "https://pokopiaguide.com"
const INDEXNOW_KEY = "88c0a5000e9e4ec4849722d50180f9eb"
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"
const SITEMAP_FILE = path.join(process.cwd(), "public/sitemap.xml")

function extractUrlsFromSitemap(xml) {
  const urls = []
  const regex = /<loc>([^<]+)<\/loc>/g
  let match
  while ((match = regex.exec(xml)) !== null) {
    urls.push(match[1])
  }
  return urls
}

async function submitToIndexNow(urls) {
  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host: "pokopiaguide.com",
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  })
  return res.status
}

async function main() {
  const sitemapXml = await fs.readFile(SITEMAP_FILE, "utf-8")
  const urls = extractUrlsFromSitemap(sitemapXml)

  if (urls.length === 0) {
    console.log("[IndexNow] No URLs found in sitemap.")
    return
  }

  console.log(`[IndexNow] Submitting ${urls.length} URL(s)...`)

  const status = await submitToIndexNow(urls)

  if (status === 200 || status === 202) {
    console.log(`[IndexNow] Accepted (HTTP ${status})`)
  } else {
    console.warn(`[IndexNow] Unexpected response (HTTP ${status}), skipping.`)
  }
}

main()
