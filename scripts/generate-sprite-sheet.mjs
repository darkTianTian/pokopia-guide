import fs from "fs/promises"
import path from "path"
import sharp from "sharp"

const SPRITE_SIZE = 96
const COLS = 20
const POKEMON_DIR = path.join(process.cwd(), "content/en/pokemon")
const OUTPUT_PNG = path.join(process.cwd(), "public/images/pokemon-sprites.png")
const OUTPUT_JSON = path.join(process.cwd(), "public/images/pokemon-sprites.json")
const BASE_URL = "https://assets.pokopiaguide.com/pokemon"

async function fetchImage(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main() {
  const files = (await fs.readdir(POKEMON_DIR)).filter((f) => f.endsWith(".json"))

  const pokemonList = await Promise.all(
    files.map(async (file) => {
      const raw = await fs.readFile(path.join(POKEMON_DIR, file), "utf-8")
      const data = JSON.parse(raw)
      return { id: data.id, slug: data.slug }
    })
  )

  pokemonList.sort((a, b) => a.id - b.id)

  const total = pokemonList.length
  const rows = Math.ceil(total / COLS)

  console.log(`Generating sprite sheet: ${total} pokémon, ${COLS}×${rows} grid`)

  const spriteMap = {}
  const composites = []

  for (let i = 0; i < pokemonList.length; i++) {
    const { slug } = pokemonList[i]
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = col * SPRITE_SIZE
    const y = row * SPRITE_SIZE

    spriteMap[slug] = { x, y }

    try {
      const buffer = await fetchImage(`${BASE_URL}/${slug}.png`)
      const resized = await sharp(buffer)
        .resize(SPRITE_SIZE, SPRITE_SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()

      composites.push({ input: resized, left: x, top: y })

      if ((i + 1) % 50 === 0) {
        console.log(`  Downloaded ${i + 1}/${total}`)
      }
    } catch (err) {
      console.warn(`  Skipping ${slug}: ${err.message}`)
    }
  }

  const canvas = sharp({
    create: {
      width: COLS * SPRITE_SIZE,
      height: rows * SPRITE_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })

  await canvas.composite(composites).png({ compressionLevel: 9 }).toFile(OUTPUT_PNG)

  await fs.writeFile(OUTPUT_JSON, JSON.stringify(spriteMap, null, 2))

  const stats = await fs.stat(OUTPUT_PNG)
  console.log(`\nDone! ${OUTPUT_PNG} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
  console.log(`Sprite map: ${OUTPUT_JSON} (${Object.keys(spriteMap).length} entries)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
