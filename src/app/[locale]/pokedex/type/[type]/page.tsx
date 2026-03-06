import type { Metadata } from "next"
import { PokedexTypePage } from "@/components/pages/pokedex-type-page"
import { POKEMON_TYPES, type PokemonType } from "@/lib/types"
import { isValidLocale, getTranslations, t, getPageAlternates } from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string; type: string }>
}

export async function generateStaticParams() {
  const locales = ["zh", "ja"] as const
  const results: { locale: string; type: string }[] = []

  for (const locale of locales) {
    for (const type of POKEMON_TYPES) {
      results.push({ locale, type })
    }
  }

  return results
}

function isValidType(value: string): value is PokemonType {
  return POKEMON_TYPES.includes(value as PokemonType)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, type } = await params
  if (!isValidLocale(locale) || !isValidType(type)) return {}

  const translations = await getTranslations(locale)
  const typeName = t(translations, `types.${type}`)
  const title = t(translations, "pokedex.typePageTitle").replace("{{type}}", typeName)
  const description = t(translations, "pokedex.typePageDesc").replace("{{type}}", typeName)

  return {
    title,
    description,
    alternates: getPageAlternates(locale, `/pokedex/type/${type}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale, type } = await params
  if (!isValidLocale(locale) || !isValidType(type)) notFound()
  return <PokedexTypePage type={type} locale={locale} />
}
