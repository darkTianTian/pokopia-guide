import type { Metadata } from "next"
import { HomePage } from "@/components/pages/home-page"
import { isValidLocale, getPageAlternates } from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}
  return {
    alternates: getPageAlternates(locale, "/"),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  return <HomePage locale={locale} />
}
