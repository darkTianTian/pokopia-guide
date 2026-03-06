import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Guide } from "@/lib/types"
import { getLocalePath, type Locale } from "@/i18n/config"

interface GuideCardProps {
  guide: Guide
  locale: Locale
}

export function GuideCard({ guide, locale }: GuideCardProps) {
  return (
    <Link href={getLocalePath(locale, `/guides/${guide.slug}`)} className="group flex h-full flex-col outline-none">
      <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-border/80 hover:bg-background/60 hover:shadow-2xl dark:hover:shadow-primary/5">

        {/* Subtle hover glow blob */}
        <div className="absolute right-0 top-0 -z-10 h-32 w-32 translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/20 blur-[40px] transition-all duration-500 group-hover:bg-primary/40 group-hover:scale-150" />

        <div className="mb-6 flex items-center justify-between gap-4">
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 pointer-events-none rounded-full px-3 py-1">
            {guide.category}
          </Badge>
          <time className="text-xs font-medium text-muted-foreground/80 tabular-nums tracking-wide">
            {guide.date}
          </time>
        </div>

        <div className="flex flex-1 flex-col">
          <h3 className="mb-3 text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-2">
            {guide.title}
          </h3>

          <p className="mb-6 text-sm leading-relaxed text-muted-foreground line-clamp-3 flex-1">
            {guide.description}
          </p>

          <div className="mt-auto flex items-center gap-3 border-t border-border/50 pt-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
              <span className="text-xs font-bold uppercase">{guide.author.charAt(0)}</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {guide.author}
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
