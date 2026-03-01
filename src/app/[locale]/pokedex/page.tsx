import type { Metadata } from "next"
import { PokedexPage } from "@/components/pages/pokedex-page"
import { isValidLocale, getTranslations, t } from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}
  const translations = await getTranslations(locale)
  return {
    title: t(translations, "pokedex.title"),
    description: t(translations, "pokedex.description"),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  return <PokedexPage locale={locale} />
}
