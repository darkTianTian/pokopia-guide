import type { Metadata } from "next"
import { PokedexDetailPage } from "@/components/pages/pokedex-detail-page"
import { getAllPokemon, getPokemonBySlug } from "@/lib/pokemon"
import { isValidLocale, getTranslations, t, getPageAlternates } from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const locales = ["zh", "ja"] as const
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

  const types = pokemon.types.map((tp) => tp.charAt(0).toUpperCase() + tp.slice(1)).join("/")
  const specialty = pokemon.pokopia?.specialties?.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")
  const description = `${pokemon.name} - ${types}${specialty ? `. ${t(translations, "pokedex.specialty")}: ${specialty}` : ""}`

  return {
    title: `${pokemon.name} — ${t(translations, "pokedex.title")}`,
    description,
    alternates: getPageAlternates(locale, `/pokedex/${slug}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) notFound()
  return <PokedexDetailPage slug={slug} locale={locale} />
}
