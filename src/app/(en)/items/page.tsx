import type { Metadata } from "next"
import { ItemsListPage } from "@/components/pages/items-list-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "All Pokopia Items | Complete Item List",
  description:
    "Browse all items in Pokémon Pokopia. Filter by category, search by name, and discover furniture, goods, nature items, food, and more.",
  alternates: getPageAlternates("en", "/items"),
}

export default function Page() {
  return <ItemsListPage locale="en" />
}
