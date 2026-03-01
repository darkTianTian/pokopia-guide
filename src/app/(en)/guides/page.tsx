import type { Metadata } from "next"
import { GuidesPage } from "@/components/pages/guides-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "Guide Articles",
  description:
    "The most comprehensive guide collection for Pokopia, including beginner tips, advanced techniques, and walkthroughs.",
  alternates: getPageAlternates("en", "/guides"),
}

export default function Page() {
  return <GuidesPage locale="en" />
}
