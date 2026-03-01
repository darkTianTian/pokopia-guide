import type { Metadata } from "next"
import { ComingSoonPage } from "@/components/pages/coming-soon-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "Multiplayer Guide",
  description:
    "Pokopia multiplayer guide: friend habitat visits, 4-player online/local multiplayer, and game sharing features.",
  alternates: getPageAlternates("en", "/multiplayer"),
}

export default function Page() {
  return <ComingSoonPage locale="en" section="multiplayer" />
}
