import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PokedexTypePage } from "@/components/pages/pokedex-type-page"
import { POKEMON_TYPES, type PokemonType } from "@/lib/types"
import { getPageAlternates } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"

interface PageProps {
  params: Promise<{ type: string }>
}

export function generateStaticParams() {
  return POKEMON_TYPES.map((type) => ({ type }))
}

function isValidType(value: string): value is PokemonType {
  return POKEMON_TYPES.includes(value as PokemonType)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params
  if (!isValidType(type)) return {}

  const typeName = enTranslations.types[type]
  const title = enTranslations.pokedex.typePageTitle.replace("{{type}}", typeName)
  const description = enTranslations.pokedex.typePageDesc.replace("{{type}}", typeName)

  return {
    title,
    description,
    alternates: getPageAlternates("en", `/pokedex/type/${type}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { type } = await params
  if (!isValidType(type)) notFound()
  return <PokedexTypePage type={type} locale="en" />
}
