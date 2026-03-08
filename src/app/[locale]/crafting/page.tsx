import type { Metadata } from "next"
import { CraftingListPage } from "@/components/pages/crafting-list-page"
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
    title: t(translations, "crafting.metaTitle"),
    description: t(translations, "crafting.metaDescription"),
    alternates: getPageAlternates(locale, "/crafting"),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  return <CraftingListPage locale={locale} />
}
