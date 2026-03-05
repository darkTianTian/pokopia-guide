import type { Metadata } from "next"
import { PokedexPage } from "@/components/pages/pokedex-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "Pokédex - All Pokémon in Pokopia with Stats & Habitats",
  description:
    "Complete Pokémon Pokopia Pokédex. Browse all available Pokémon with types, specialties, habitat locations, spawn times, weather conditions, and evolution chains.",
  alternates: getPageAlternates("en", "/pokedex"),
}

export default function Page() {
  return <PokedexPage locale="en" />
}
