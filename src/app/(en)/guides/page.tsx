import type { Metadata } from "next"
import { GuidesPage } from "@/components/pages/guides-page"

export const metadata: Metadata = {
  title: "Guide Articles",
  description:
    "The most comprehensive guide collection for Pokopia, including beginner tips, advanced techniques, and walkthroughs.",
}

export default function Page() {
  return <GuidesPage locale="en" />
}
