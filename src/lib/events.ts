import fs from "fs/promises"
import path from "path"
import type { GameEvent } from "./types"
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config"

function getEventsDir(locale: Locale): string {
  return path.join(process.cwd(), `content/${locale}/events`)
}

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

function toEvent(slug: string, data: Record<string, string>, content: string): GameEvent {
  return {
    slug,
    title: data.title ?? slug,
    description: data.description ?? "",
    category: data.category ?? "",
    date: data.date ?? "",
    author: data.author ?? "",
    startDate: data.startDate ?? "",
    endDate: data.endDate ?? "",
    content,
  }
}

export async function getAllEvents(
  locale: Locale = DEFAULT_LOCALE
): Promise<GameEvent[]> {
  const dir = getEventsDir(locale)

  try {
    const files = await fs.readdir(dir)
    const mdxFiles = files.filter((f) => f.endsWith(".mdx"))

    const events = await Promise.all(
      mdxFiles.map(async (file) => {
        const raw = await fs.readFile(path.join(dir, file), "utf-8")
        const { data, content } = parseFrontmatter(raw)
        const slug = file.replace(/\.mdx$/, "")
        return toEvent(slug, data, content)
      })
    )

    return events.sort(
      (a, b) => new Date(b.startDate || b.date).getTime() - new Date(a.startDate || a.date).getTime()
    )
  } catch {
    return []
  }
}

export async function getEventBySlug(
  slug: string,
  locale: Locale = DEFAULT_LOCALE
): Promise<GameEvent | undefined> {
  const filePath = path.join(getEventsDir(locale), `${slug}.mdx`)
  try {
    const raw = await fs.readFile(filePath, "utf-8")
    const { data, content } = parseFrontmatter(raw)
    return toEvent(slug, data, content)
  } catch {
    return undefined
  }
}
