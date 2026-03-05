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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb
        items={[{ label: t(translations, "events.breadcrumb") }]}
        locale={locale}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {t(translations, "events.title")}
        </h1>
        <h2 className="mt-2 text-lg font-normal text-muted-foreground">
          {t(translations, "events.subtitle")}
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <EventCard key={event.slug} event={event} locale={locale} translations={translations} />
        ))}
      </div>
    </div>
  )
}
