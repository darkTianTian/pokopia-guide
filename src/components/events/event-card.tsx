import Link from "next/link"
import type { GameEvent } from "@/lib/types"
import { getLocalePath, getTranslations, t, type Locale } from "@/i18n/config"

function getEventStatus(
  startDate: string,
  endDate: string,
  translations: Awaited<ReturnType<typeof getTranslations>>
): { label: string; badgeClasses: string; glowColor: string } {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (now < start) {
    // Upcoming
    return {
      label: t(translations, "events.upcoming"),
      badgeClasses: "bg-amber-500/10 text-amber-500 ring-amber-500/30",
      glowColor: "bg-amber-500/20 group-hover:bg-amber-500/40"
    }
  }
  if (now > end) {
    // Ended
    return {
      label: t(translations, "events.ended"),
      badgeClasses: "bg-slate-500/10 text-slate-500 ring-slate-500/30",
      glowColor: "bg-slate-500/10 group-hover:bg-slate-500/20"
    }
  }
  // Active
  return {
    label: t(translations, "events.active"),
    badgeClasses: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    glowColor: "bg-emerald-500/20 group-hover:bg-emerald-500/40"
  }
}

interface EventCardProps {
  event: GameEvent
  locale: Locale
  translations: Awaited<ReturnType<typeof getTranslations>>
}

export function EventCard({ event, locale, translations }: EventCardProps) {
  const status = getEventStatus(event.startDate, event.endDate, translations)

  return (
    <Link href={getLocalePath(locale, `/events/${event.slug}`)} className="group flex h-full flex-col outline-none">
      <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-border/80 hover:bg-background/60 hover:shadow-2xl dark:hover:shadow-primary/5">

        {/* Subtle hover glow blob tied to event status */}
        <div className={`absolute right-0 top-0 -z-10 h-32 w-32 translate-x-1/3 -translate-y-1/3 rounded-full blur-[40px] transition-all duration-500 group-hover:scale-150 ${status.glowColor}`} />

        <div className="mb-6 flex items-center justify-between gap-4">
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ${status.badgeClasses}`}>
            {status.label}
          </span>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {event.category}
          </span>
        </div>

        <div className="flex flex-1 flex-col">
          <h3 className="mb-3 text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-2">
            {event.title}
          </h3>

          <p className="mb-6 text-sm leading-relaxed text-muted-foreground line-clamp-3 flex-1">
            {event.description}
          </p>

          <div className="mt-auto flex items-center justify-between border-t border-border/50 pt-4">
            {/* Minimal Timeline Display */}
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/50">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              <time className="text-[11px] font-semibold tracking-wide text-muted-foreground tabular-nums opacity-80">
                {event.startDate} — {event.endDate}
              </time>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
