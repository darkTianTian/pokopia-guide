import type { Metadata } from "next"
import { PokedexDetailPage } from "@/components/pages/pokedex-detail-page"
import { getAllPokemon, getPokemonBySlug } from "@/lib/pokemon"
import { getPageAlternates } from "@/i18n/config"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const pokemon = await getAllPokemon("en")
  return pokemon.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const pokemon = await getPokemonBySlug(slug, "en")
  if (!pokemon) return { title: "Not Found" }

  return {
    title: `${pokemon.name} — Pokédex`,
    description: pokemon.description,
    alternates: getPageAlternates("en", `/pokedex/${slug}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  return <PokedexDetailPage slug={slug} locale="en" />
}
