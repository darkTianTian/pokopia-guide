import type { Metadata } from "next"
import { CookingPage } from "@/components/pages/cooking-page"
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
    title: t(translations, "cooking.metaTitle"),
    description: t(translations, "cooking.metaDescription"),
    alternates: getPageAlternates(locale, "/cooking"),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  return <CookingPage locale={locale} />
}
