import type { Metadata } from "next"
import { EventDetailPage } from "@/components/pages/event-detail-page"
import { getAllEvents, getEventBySlug } from "@/lib/events"
import { isValidLocale, getTranslations, t, getPageAlternates } from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const locales = ["zh", "zh-Hans", "ja", "ko", "es"] as const
  const results: { locale: string; slug: string }[] = []

  for (const locale of locales) {
    const events = await getAllEvents(locale)
    for (const e of events) {
      results.push({ locale, slug: e.slug })
    }
  }

  return results
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) return {}

  const [event, translations] = await Promise.all([
    getEventBySlug(slug, locale),
    getTranslations(locale),
  ])
  if (!event) return { title: t(translations, "events.notFound") }

  return {
    title: event.title,
    description: event.description,
    alternates: getPageAlternates(locale, `/events/${slug}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params
  if (!isValidLocale(locale)) notFound()
  return <EventDetailPage slug={slug} locale={locale} />
}
