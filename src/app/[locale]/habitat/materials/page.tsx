import type { Metadata } from "next"
import { MaterialsListPage } from "@/components/pages/materials-list-page"
import {
  isValidLocale,
  getTranslations,
  t,
  getPageAlternates,
} from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}
  const translations = await getTranslations(locale)
  return {
    title: t(translations, "habitat.materialsMetaTitle"),
    description: t(translations, "habitat.materialsMetaDescription"),
    alternates: getPageAlternates(locale, "/habitat/materials"),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  return <MaterialsListPage locale={locale} />
}
