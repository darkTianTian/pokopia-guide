import type { Metadata } from "next"
import { ItemsListPage } from "@/components/pages/items-list-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "All Pokopia Items | Furniture, Materials & More",
  description:
    "Complete Pokémon Pokopia item catalog with 700+ items. Browse furniture, goods, building materials, food, kits, and blocks. Filter by category, search by name, and view crafting recipes.",
  alternates: getPageAlternates("en", "/items"),
}

export default function Page() {
  return <ItemsListPage locale="en" />
}
