import type { Metadata } from "next"
import { ComingSoonPage } from "@/components/pages/coming-soon-page"

export const metadata: Metadata = {
  title: "Exploration Map",
  description:
    "Pokopia exploration map: area guides, Pokémon encounters, and transformation travel methods.",
}

export default function Page() {
  return <ComingSoonPage locale="en" section="explore" />
}
