import type { Metadata } from "next"
import { TermsPage } from "@/components/pages/terms-page"
import { isValidLocale, getPageAlternates } from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}
  return {
    title: "Terms of Service",
    description:
      "Terms of Service for Pokopia Guide. Read about your rights and responsibilities when using our website.",
    alternates: getPageAlternates(locale, "/terms"),
    robots: { index: true, follow: true },
  }
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  return <TermsPage locale={locale} />
}
