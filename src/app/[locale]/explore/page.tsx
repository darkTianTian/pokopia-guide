import type { Metadata } from "next"
import { ComingSoonPage } from "@/components/pages/coming-soon-page"
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
    title: t(translations, "explore.metaTitle"),
    description: t(translations, "explore.metaDescription"),
    alternates: getPageAlternates(locale, "/explore"),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  return <ComingSoonPage locale={locale} section="explore" />
}
