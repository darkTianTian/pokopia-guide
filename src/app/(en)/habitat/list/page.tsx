import type { Metadata } from "next"
import { HabitatListPage } from "@/components/pages/habitat-list-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "Habitat List",
  description:
    "Complete list of all Pokémon Pokopia habitats with available Pokémon encounters.",
  alternates: getPageAlternates("en", "/habitat/list"),
}

export default function Page() {
  return <HabitatListPage locale="en" />
}
