import type { Metadata } from "next"
import { GuideDetailPage } from "@/components/pages/guide-detail-page"
import { getAllGuides, getGuideBySlug } from "@/lib/guides"
import { isValidLocale, getTranslations, t, getPageAlternates } from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const locales = ["cn", "jp"] as const
  const results: { locale: string; slug: string }[] = []

  for (const locale of locales) {
    const guides = await getAllGuides(locale)
    for (const g of guides) {
      results.push({ locale, slug: g.slug })
    }
  }

  return results
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) return {}

  const [guide, translations] = await Promise.all([
    getGuideBySlug(slug, locale),
    getTranslations(locale),
  ])
  if (!guide) return { title: t(translations, "guides.notFound") }

  return {
    title: guide.title,
    description: guide.description,
    alternates: getPageAlternates(locale, `/guides/${slug}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) notFound()
  return <GuideDetailPage slug={slug} locale={locale} />
}
