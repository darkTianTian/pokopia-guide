import type { Metadata } from "next"
import { MaterialDetailPage } from "@/components/pages/material-detail-page"
import {
  isValidLocale,
  getTranslations,
  t,
  getPageAlternates,
  LOCALES,
} from "@/i18n/config"
import { getAllMaterialSlugs, getMaterialBySlug } from "@/lib/materials"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const params: { locale: string; slug: string }[] = []
  for (const locale of LOCALES) {
    if (locale === "en") continue
    const slugs = getAllMaterialSlugs(locale)
    for (const slug of slugs) {
      params.push({ locale, slug })
    }
  }
  return params
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) return {}
  const material = getMaterialBySlug(slug, locale)
  if (!material) return { title: "Not Found" }

  const translations = await getTranslations(locale)
  return {
    title: `${material.name} — ${t(translations, "habitat.materialsMetaTitle")}`,
    description: t(translations, "habitat.materialDetailMetaDesc")
      .replace("{{name}}", material.name)
      .replace("{{count}}", String(material.totalUsage)),
    alternates: getPageAlternates(locale, `/habitat/materials/${slug}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) notFound()
  return <MaterialDetailPage slug={slug} locale={locale} />
}
