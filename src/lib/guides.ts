import fs from "fs/promises"
import path from "path"
import type { Guide } from "./types"

const GUIDES_DIR = path.join(process.cwd(), "content/guides")

function parseFrontmatter(raw: string): {
  data: Record<string, string>
  content: string
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { data: {}, content: raw }
  }

  const data: Record<string, string> = {}
  for (const line of match[1].split("\n")) {
    const colonIndex = line.indexOf(":")
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex).trim()
    const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, "")
    data[key] = value
  }

  return { data, content: match[2].trim() }
}

export async function getAllGuides(): Promise<Guide[]> {
  const files = await fs.readdir(GUIDES_DIR)
  const mdxFiles = files.filter((f) => f.endsWith(".mdx"))

  const guides = await Promise.all(
    mdxFiles.map(async (file) => {
      const raw = await fs.readFile(path.join(GUIDES_DIR, file), "utf-8")
      const { data, content } = parseFrontmatter(raw)
      const slug = file.replace(/\.mdx$/, "")

      return {
        slug,
        title: data.title ?? slug,
        description: data.description ?? "",
        category: data.category ?? "",
        date: data.date ?? "",
        author: data.author ?? "",
        content,
      } satisfies Guide
    })
  )

  return guides.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export async function getGuideBySlug(
  slug: string
): Promise<Guide | undefined> {
  const filePath = path.join(GUIDES_DIR, `${slug}.mdx`)
  try {
    const raw = await fs.readFile(filePath, "utf-8")
    const { data, content } = parseFrontmatter(raw)
    return {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      category: data.category ?? "",
      date: data.date ?? "",
      author: data.author ?? "",
      content,
    }
  } catch {
    return undefined
  }
}
