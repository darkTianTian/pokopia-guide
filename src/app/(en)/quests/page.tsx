import type { Metadata } from "next"
import { ComingSoonPage } from "@/components/pages/coming-soon-page"

export const metadata: Metadata = {
  title: "Quest Guides",
  description:
    "Pokopia quest guide: main story walkthrough, Pokémon wishes, and crafting recipe unlock conditions.",
}

export default function Page() {
  return <ComingSoonPage locale="en" section="quests" />
}
