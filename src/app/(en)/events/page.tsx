import type { Metadata } from "next"
import { EventsPage } from "@/components/pages/events-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "Pokemon Pokopia Events: Hoppip, Cotton Spores & More",
  description:
    "All Pokopia limited-time events and exclusive Pokémon in one place. Current: Hoppip cotton spores event with Skiploom and Jumpluff. Guides, rewards, and more.",
  alternates: getPageAlternates("en", "/events"),
}

export default function Page() {
  return <EventsPage locale="en" />
}
