import type { Metadata } from "next"
import { MaterialDetailPage } from "@/components/pages/material-detail-page"
import { getAllMaterialSlugs, getMaterialBySlug } from "@/lib/materials"
import {
  isValidLocale,
  getTranslations,
  t,
  getPageAlternates,
} from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const locales = ["zh", "zh-Hans", "ja", "ko", "es"] as const
  const slugs = getAllMaterialSlugs("en")
  const results: { locale: string; slug: string }[] = []

  for (const locale of locales) {
    for (const slug of slugs) {
      results.push({ locale, slug })
    }
  }

  return results
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) return {}

  const [material, translations] = await Promise.all([
    Promise.resolve(getMaterialBySlug(slug, locale)),
    getTranslations(locale),
  ])
  if (!material) return { title: t(translations, "pokedex.notFound") }

  return {
    title: `${material.name} — ${t(translations, "habitat.materialsTitle")}`,
    description: t(translations, "habitat.materialDetailMetaDesc")
      .replace("{{name}}", material.name)
      .replace("{{count}}", String(material.totalUsage)),
    alternates: getPageAlternates(locale, `/habitat/materials/${slug}`),
    robots: { index: false, follow: true },
  }
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) notFound()
  return <MaterialDetailPage slug={slug} locale={locale} />
}
