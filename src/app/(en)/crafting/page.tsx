import type { Metadata } from "next"
import { CraftingListPage } from "@/components/pages/crafting-list-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "All Pokopia Crafting Recipes | Furniture & Items",
  description:
    "Browse all crafting recipes in Pokémon Pokopia. Find materials needed for furniture, cooking tools, lighting, and decorations.",
  alternates: getPageAlternates("en", "/crafting"),
}

export default function Page() {
  return <CraftingListPage locale="en" />
}
