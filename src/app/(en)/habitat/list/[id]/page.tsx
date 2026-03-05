import type { Metadata } from "next"
import { HabitatDetailPage } from "@/components/pages/habitat-detail-page"
import { getAllHabitatsWithPokemon, getHabitatWithPokemon } from "@/lib/habitat"
import { getPageAlternates } from "@/i18n/config"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const habitats = await getAllHabitatsWithPokemon("en")
  return habitats.map((h) => ({ id: String(h.id) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const habitat = await getHabitatWithPokemon(Number(id), "en")
  if (!habitat) return { title: "Not Found" }

  return {
    title: `${habitat.name} — Habitat List`,
    description: `${habitat.name} - Pokémon that can be found in this habitat.`,
    alternates: getPageAlternates("en", `/habitat/list/${id}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return <HabitatDetailPage id={Number(id)} locale="en" />
}
