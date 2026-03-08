import type { Metadata } from "next"
import { HabitatDetailPage } from "@/components/pages/habitat-detail-page"
import { getAllHabitatSlugs, getHabitatBySlug } from "@/lib/habitat"
import { isValidLocale, getTranslations, t, getPageAlternates } from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const locales = ["zh", "ja"] as const
  const slugs = getAllHabitatSlugs()
  const results: { locale: string; slug: string }[] = []

  for (const locale of locales) {
    for (const slug of slugs) {
      results.push({ locale, slug })
    }
  }

  return results
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) return {}

  const [habitat, translations] = await Promise.all([
    getHabitatBySlug(slug, locale),
    getTranslations(locale),
  ])
  if (!habitat) return { title: t(translations, "pokedex.notFound") }

  return {
    title: `${habitat.name} — ${t(translations, "habitat.listTitle")}`,
    description: `${habitat.name} - ${t(translations, "habitat.detailDescription")}`,
    alternates: getPageAlternates(locale, `/habitat/${habitat.slug}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) notFound()
  return <HabitatDetailPage slug={slug} locale={locale} />
}
