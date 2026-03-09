import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getGuideBySlug } from "@/lib/guides"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"

function renderMarkdown(content: string): string {
  const lines = content.split("\n")
  const result: string[] = []
  let inTable = false
  const tableRows: string[] = []

  function flushTable() {
    if (tableRows.length > 0) {
      result.push('<table class="my-4 w-full border-collapse">')
      result.push(...tableRows)
      result.push("</table>")
      tableRows.length = 0
    }
    inTable = false
  }

  function inlineFormat(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="my-4 mx-auto max-w-full rounded-lg" loading="lazy" />')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline hover:text-primary/80">$1</a>')
      .replace(/\[([^\]]+)\]\((\/[^)]+)\)/g, '<a href="$2" class="text-primary underline hover:text-primary/80">$1</a>')
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Table row
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed.split("|").filter(Boolean).map((c) => c.trim())
      // Skip separator row
      if (cells.every((c) => /^[-:]+$/.test(c))) {
        inTable = true
        continue
      }
      if (!inTable && tableRows.length === 0) {
        // Header row
        tableRows.push(`<tr>${cells.map((c) => `<th class="border px-3 py-1.5 text-sm font-semibold text-left bg-muted">${inlineFormat(c)}</th>`).join("")}</tr>`)
      } else {
        tableRows.push(`<tr>${cells.map((c) => `<td class="border px-3 py-1.5 text-sm">${inlineFormat(c)}</td>`).join("")}</tr>`)
      }
      inTable = true
      continue
    }

    // Non-table line: flush any pending table
    if (inTable) flushTable()

    // YouTube embed: {% youtube VIDEO_ID %}
    const youtubeMatch = trimmed.match(/^\{%\s*youtube\s+([\w-]+)\s*%\}$/)
    if (youtubeMatch) {
      result.push(`<div class="my-6" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden"><iframe style="position:absolute;top:0;left:0;width:100%;height:100%;border-radius:0.5rem" src="https://www.youtube.com/embed/${youtubeMatch[1]}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`)
      continue
    }

    if (trimmed === "") {
      continue
    } else if (trimmed.startsWith("### ")) {
      result.push(`<h3 class="mt-6 mb-3 text-lg font-semibold">${inlineFormat(trimmed.slice(4))}</h3>`)
    } else if (trimmed.startsWith("## ")) {
      result.push(`<h2 class="mt-8 mb-4 text-xl font-bold">${inlineFormat(trimmed.slice(3))}</h2>`)
    } else if (trimmed.startsWith("# ")) {
      result.push(`<h1 class="mt-8 mb-4 text-2xl font-bold">${inlineFormat(trimmed.slice(2))}</h1>`)
    } else if (trimmed.startsWith("> ")) {
      result.push(`<blockquote class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4">${inlineFormat(trimmed.slice(2))}</blockquote>`)
    } else if (/^\d+\. /.test(trimmed)) {
      result.push(`<li class="ml-6 list-decimal">${inlineFormat(trimmed.replace(/^\d+\. /, ""))}</li>`)
    } else if (trimmed.startsWith("- ")) {
      result.push(`<li class="ml-6 list-disc">${inlineFormat(trimmed.slice(2))}</li>`)
    } else {
      result.push(`<p class="my-3 leading-7">${inlineFormat(trimmed)}</p>`)
    }
  }

  // Flush remaining table
  if (inTable) flushTable()

  return result.join("\n")
}

interface GuideDetailPageProps {
  slug: string
  locale: Locale
}

export async function GuideDetailPage({ slug, locale }: GuideDetailPageProps) {
  const [guide, translations] = await Promise.all([
    getGuideBySlug(slug, locale),
    getTranslations(locale),
  ])

  if (!guide) {
    notFound()
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-8">
      <Breadcrumb
        items={[
          {
            label: t(translations, "guides.breadcrumb"),
            href: getLocalePath(locale, "/guides"),
          },
          { label: guide.title },
        ]}
        locale={locale}
      />
      <header className="mb-8">
        <div className="mb-3 flex items-center gap-3">
          <Badge variant="secondary">{guide.category}</Badge>
          <span className="text-sm text-muted-foreground">{guide.date}</span>
        </div>
        <h1 className="text-3xl font-bold">{guide.title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {guide.description}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(translations, "guides.author")}: {guide.author}
        </p>
      </header>

      <Separator className="mb-8" />

      <div
        className="prose prose-gray dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(guide.content) }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: guide.title,
            description: guide.description,
            author: {
              "@type": "Person",
              name: guide.author,
            },
            datePublished: guide.date,
            mainEntityOfPage: `https://pokopiaguide.com${getLocalePath(locale, `/guides/${guide.slug}`)}`,
          }),
        }}
      />
    </article>
  )
}
