import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { GameEvent } from "@/lib/types"
import { getLocalePath, getTranslations, t, type Locale } from "@/i18n/config"

function getEventStatus(
  startDate: string,
  endDate: string,
  translations: Awaited<ReturnType<typeof getTranslations>>
): { label: string; variant: "default" | "secondary" | "destructive" | "outline" } {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (now < start) {
    return { label: t(translations, "events.upcoming"), variant: "outline" }
  }
  if (now > end) {
    return { label: t(translations, "events.ended"), variant: "secondary" }
  }
  return { label: t(translations, "events.active"), variant: "default" }
}

interface EventCardProps {
  event: GameEvent
  locale: Locale
  translations: Awaited<ReturnType<typeof getTranslations>>
}

export function EventCard({ event, locale, translations }: EventCardProps) {
  const status = getEventStatus(event.startDate, event.endDate, translations)

  return (
    <Link href={getLocalePath(locale, `/events/${event.slug}`)}>
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant="secondary">{event.category}</Badge>
          </div>
          <CardTitle className="text-lg">{event.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-2">
            {event.description}
          </CardDescription>
          <p className="mt-2 text-xs text-muted-foreground">
            {event.startDate} ~ {event.endDate}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
