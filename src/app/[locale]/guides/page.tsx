import type { Metadata } from "next"
import { GuidesPage } from "@/components/pages/guides-page"
import { isValidLocale, getTranslations, t, getPageAlternates } from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}
  const translations = await getTranslations(locale)
  return {
    title: t(translations, "guides.title"),
    description: t(translations, "guides.description"),
    alternates: getPageAlternates(locale, "/guides"),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  return <GuidesPage locale={locale} />
}
