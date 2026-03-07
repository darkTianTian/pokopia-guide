import type { Metadata } from "next"
import { MaterialsListPage } from "@/components/pages/materials-list-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "All Pokopia Habitat Materials & Where to Use Them",
  description:
    "Browse every crafting material in Pokémon Pokopia. See which habitats require each material, quantities needed, and plan your building strategy.",
  alternates: getPageAlternates("en", "/habitat/materials"),
}

export default function Page() {
  return <MaterialsListPage locale="en" />
}
