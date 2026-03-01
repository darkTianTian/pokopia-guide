import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getGuideBySlug } from "@/lib/guides"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"

function renderMarkdown(content: string): string {
  return content
    .replace(/^### (.*$)/gm, '<h3 class="mt-6 mb-3 text-lg font-semibold">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="mt-8 mb-4 text-xl font-bold">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="mt-8 mb-4 text-2xl font-bold">$1</h1>')
    .replace(/^\> (.*$)/gm, '<blockquote class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-4">$1</blockquote>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-6 list-decimal">$1</li>')
    .replace(/^- (.*$)/gm, '<li class="ml-6 list-disc">$1</li>')
    .replace(
      /\|(.+)\|/g,
      (match) => {
        const cells = match
          .split("|")
          .filter(Boolean)
          .map((c) => c.trim())
        if (cells.every((c) => /^[-:]+$/.test(c))) return ""
        const tag = "td"
        return `<tr>${cells.map((c) => `<${tag} class="border px-3 py-1.5 text-sm">${c}</${tag}>`).join("")}</tr>`
      }
    )
    .replace(
      /(<tr>[\s\S]*?<\/tr>)/g,
      '<table class="my-4 w-full border-collapse">$1</table>'
    )
    .replace(/^(?!<[hblut])(.*\S.*)$/gm, '<p class="my-3 leading-7">$1</p>')
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
