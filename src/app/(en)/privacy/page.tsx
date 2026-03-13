import type { Metadata } from "next"
import { PrivacyPage } from "@/components/pages/privacy-page"
import { getPageAlternates } from "@/i18n/config"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Pokopia Guide. Learn how we collect, use, and protect your information.",
  alternates: getPageAlternates("en", "/privacy"),
  robots: { index: true, follow: true },
}

export default function Page() {
  return <PrivacyPage locale="en" />
}
