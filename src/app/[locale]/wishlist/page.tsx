import type { Metadata } from "next"
import { WishlistPage } from "@/components/pages/wishlist-page"
import {
  isValidLocale,
  getTranslations,
  t,
  getPageAlternates,
} from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}
  const translations = await getTranslations(locale)
  return {
    title: t(translations, "wishlist.metaTitle"),
    description: t(translations, "wishlist.description"),
    alternates: getPageAlternates(locale, "/wishlist"),
    robots: { index: false, follow: true },
  }
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  return <WishlistPage locale={locale} />
}
