import type { Metadata } from "next"
import { ComingSoonPage } from "@/components/pages/coming-soon-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "Exploration Map",
  description:
    "Pokopia exploration map: area guides, Pokémon encounters, and transformation travel methods.",
  alternates: getPageAlternates("en", "/explore"),
}

export default function Page() {
  return <ComingSoonPage locale="en" section="explore" />
}
