import { Breadcrumb } from "@/components/layout/breadcrumb"
import { EventCard } from "@/components/events/event-card"
import { getAllEvents } from "@/lib/events"
import { getTranslations, t, type Locale } from "@/i18n/config"

interface EventsPageProps {
  locale: Locale
}

export async function EventsPage({ locale }: EventsPageProps) {
  const [events, translations] = await Promise.all([
    getAllEvents(locale),
    getTranslations(locale),
  ])

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      {/* Subtle Page Top Glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-full -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />

      <Breadcrumb
        items={[{ label: t(translations, "events.breadcrumb") }]}
        locale={locale}
      />
      <div className="mb-12 mt-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
          {t(translations, "events.title")}
        </h1>
        <h2 className="mt-4 text-lg font-normal text-muted-foreground">
          {t(translations, "events.subtitle")}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.slug} event={event} locale={locale} translations={translations} />
        ))}
      </div>
    </div>
  )
}
