import type { Metadata } from "next"
import { PokedexSpecialtyPage } from "@/components/pages/pokedex-specialty-page"
import { getAllPokemon, getAllSpecialties } from "@/lib/pokemon"
import { isValidLocale, getTranslations, t, getPageAlternates } from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string; spec: string }>
}

export async function generateStaticParams() {
  const locales = ["zh", "ja"] as const
  const allPokemon = await getAllPokemon("en")
  const specialties = getAllSpecialties(allPokemon)
  const results: { locale: string; spec: string }[] = []

  for (const locale of locales) {
    for (const spec of specialties) {
      results.push({ locale, spec })
    }
  }

  return results
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, spec } = await params
  if (!isValidLocale(locale)) return {}

  const translations = await getTranslations(locale)
  const specName = t(translations, `specialties.${spec}`)
  const title = t(translations, "pokedex.specPageTitle").replace("{{spec}}", specName)
  const description = t(translations, "pokedex.specPageDesc").replace("{{spec}}", specName)

  return {
    title,
    description,
    alternates: getPageAlternates(locale, `/pokedex/specialty/${spec}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale, spec } = await params
  if (!isValidLocale(locale)) notFound()
  return <PokedexSpecialtyPage specialty={spec} locale={locale} />
}
