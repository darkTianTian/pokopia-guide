import type { Metadata } from "next"
import { HomePage } from "@/components/pages/home-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  alternates: getPageAlternates("en", "/"),
}

export default function Page() {
  return <HomePage locale="en" />
}
