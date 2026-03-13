import type { Metadata } from "next"
import { PrivacyPage } from "@/components/pages/privacy-page"
import { isValidLocale, getPageAlternates } from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}
  return {
    title: "Privacy Policy",
    description:
      "Privacy Policy for Pokopia Guide. Learn how we collect, use, and protect your information.",
    alternates: getPageAlternates(locale, "/privacy"),
    robots: { index: true, follow: true },
  }
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  return <PrivacyPage locale={locale} />
}
