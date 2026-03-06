import type { Metadata } from "next"
import { HabitatListPage } from "@/components/pages/habitat-list-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "All Pokopia Habitats with Pokémon & Materials",
  description:
    "Browse every habitat in Pokémon Pokopia. See which Pokémon appear in each habitat, their rarity, spawn times, weather conditions, and the materials needed to build each one.",
  alternates: getPageAlternates("en", "/habitat/list"),
}

export default function Page() {
  return <HabitatListPage locale="en" />
}
