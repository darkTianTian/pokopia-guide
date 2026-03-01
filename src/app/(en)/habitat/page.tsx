import type { Metadata } from "next"
import { ComingSoonPage } from "@/components/pages/coming-soon-page"

export const metadata: Metadata = {
  title: "Habitat Building",
  description:
    "Pokopia habitat building guide: habitat creation, move-based environment modification, and furniture crafting recipes.",
}

export default function Page() {
  return <ComingSoonPage locale="en" section="habitat" />
}
