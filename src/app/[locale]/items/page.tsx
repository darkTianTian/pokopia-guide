import type { Metadata } from "next"
import { ItemsListPage } from "@/components/pages/items-list-page"
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
    title: t(translations, "items.metaTitle"),
    description: t(translations, "items.metaDescription"),
    alternates: getPageAlternates(locale, "/items"),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  return <ItemsListPage locale={locale} />
}
