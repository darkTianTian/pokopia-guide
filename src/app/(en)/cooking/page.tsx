import type { Metadata } from "next"
import { CookingPage } from "@/components/pages/cooking-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "All Pokopia Cooking Recipes | Buffs & Ingredients",
  description:
    "Browse all 24 cooking recipes in Pokémon Pokopia. Find ingredients, required specialties, and move buffs for salads, soups, breads, and hamburger steaks.",
  alternates: getPageAlternates("en", "/cooking"),
}

export default function Page() {
  return <CookingPage locale="en" />
}
