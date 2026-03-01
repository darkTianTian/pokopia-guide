import type { Metadata } from "next"
import { PokedexPage } from "@/components/pages/pokedex-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "Pokédex",
  description:
    "Browse all Pokémon in the Pokopia world with detailed data, types, abilities, and base stats.",
  alternates: getPageAlternates("en", "/pokedex"),
}

export default function Page() {
  return <PokedexPage locale="en" />
}
