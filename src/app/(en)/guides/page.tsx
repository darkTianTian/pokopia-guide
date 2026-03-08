import type { Metadata } from "next"
import { GuidesPage } from "@/components/pages/guides-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "Pokopia Tips & Guides — Cooking, Housing & More",
  description:
    "Guides for Pokémon Pokopia: cooking recipes & buffs, how to move your house, get lumber, raise humidity, and more beginner tips.",
  alternates: getPageAlternates("en", "/guides"),
}

export default function Page() {
  return <GuidesPage locale="en" />
}
