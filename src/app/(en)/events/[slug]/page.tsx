import type { Metadata } from "next"
import { EventDetailPage } from "@/components/pages/event-detail-page"
import { getAllEvents, getEventBySlug } from "@/lib/events"
import { getPageAlternates } from "@/i18n/config"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const events = await getAllEvents("en")
  return events.map((e) => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug, "en")
  if (!event) return { title: "Not Found" }

  return {
    title: event.title,
    description: event.description,
    alternates: getPageAlternates("en", `/events/${slug}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  return <EventDetailPage slug={slug} locale="en" />
}
