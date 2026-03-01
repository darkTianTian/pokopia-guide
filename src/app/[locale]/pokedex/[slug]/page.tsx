import type { Metadata } from "next"
import { PokedexDetailPage } from "@/components/pages/pokedex-detail-page"
import { getAllPokemon, getPokemonBySlug } from "@/lib/pokemon"
import { isValidLocale, getTranslations, t } from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const locales = ["cn", "jp"] as const
  const results: { locale: string; slug: string }[] = []

  for (const locale of locales) {
    const pokemon = await getAllPokemon(locale)
    for (const p of pokemon) {
      results.push({ locale, slug: p.slug })
    }
  }

  return results
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) return {}

  const [pokemon, translations] = await Promise.all([
    getPokemonBySlug(slug, locale),
    getTranslations(locale),
  ])
  if (!pokemon) return { title: t(translations, "pokedex.notFound") }

  return {
    title: `${pokemon.name} — ${t(translations, "pokedex.title")}`,
    description: pokemon.description,
  }
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) notFound()
  return <PokedexDetailPage slug={slug} locale={locale} />
}
