import type { Metadata } from "next"
import { PokedexSpecialtyPage } from "@/components/pages/pokedex-specialty-page"
import { getAllPokemon, getAllSpecialties } from "@/lib/pokemon"
import { getPageAlternates } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"

interface PageProps {
  params: Promise<{ spec: string }>
}

export async function generateStaticParams() {
  const allPokemon = await getAllPokemon("en")
  const specialties = getAllSpecialties(allPokemon)
  return specialties.map((spec) => ({ spec }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { spec } = await params
  const specName = (enTranslations.specialties as Record<string, string>)[spec] ?? spec
  const title = enTranslations.pokedex.specPageTitle.replace("{{spec}}", specName)
  const description = enTranslations.pokedex.specPageDesc.replace("{{spec}}", specName)

  return {
    title,
    description,
    alternates: getPageAlternates("en", `/pokedex/specialty/${spec}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { spec } = await params
  return <PokedexSpecialtyPage specialty={spec} locale="en" />
}
