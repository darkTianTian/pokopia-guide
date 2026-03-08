import type { Metadata } from "next"
import { HabitatListPage } from "@/components/pages/habitat-list-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "All Pokopia Habitats with Pokémon & Materials",
  description:
    "Browse every Pokopia habitat. See which Pokémon appear, their rarity, spawn conditions, and the materials needed to build each one.",
  alternates: getPageAlternates("en", "/habitat"),
}

export default function Page() {
  return <HabitatListPage locale="en" />
}
