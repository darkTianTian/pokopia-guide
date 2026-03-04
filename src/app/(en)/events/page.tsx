import type { Metadata } from "next"
import { EventsPage } from "@/components/pages/events-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "Limited-Time Events",
  description:
    "Track all Pokémon Pokopia limited-time events, exclusive Pokémon, and special rewards.",
  alternates: getPageAlternates("en", "/events"),
}

export default function Page() {
  return <EventsPage locale="en" />
}
