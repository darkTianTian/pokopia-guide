import type { Metadata } from "next"
import { ComingSoonPage } from "@/components/pages/coming-soon-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "Quest Guides",
  description:
    "Pokopia quest guide: main story walkthrough, Pokémon wishes, and crafting recipe unlock conditions.",
  alternates: getPageAlternates("en", "/quests"),
  robots: { index: false, follow: true },
}

export default function Page() {
  return <ComingSoonPage locale="en" section="quests" />
}
