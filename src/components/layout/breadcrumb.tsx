import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  locale: Locale
}

export async function Breadcrumb({ items, locale }: BreadcrumbProps) {
  const translations = await getTranslations(locale)

  return (
    <nav aria-label={t(translations, "breadcrumb.ariaLabel")} className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link
            href={getLocalePath(locale, "/")}
            className="hover:text-foreground"
          >
            {t(translations, "breadcrumb.home")}
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5" />
            {item.href ? (
              <Link href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
