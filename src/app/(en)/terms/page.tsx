import type { Metadata } from "next"
import { TermsPage } from "@/components/pages/terms-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Pokopia Guide. Read about your rights and responsibilities when using our website.",
  alternates: getPageAlternates("en", "/terms"),
  robots: { index: true, follow: true },
}

export default function Page() {
  return <TermsPage locale="en" />
}
