"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LOCALES,
  LOCALE_LABELS,
  DEFAULT_LOCALE,
  type Locale,
} from "@/i18n/config"

interface LanguageSwitcherProps {
  locale: Locale
}

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const pathname = usePathname()

  function getTargetPath(targetLocale: Locale): string {
    // Strip current locale prefix to get the base path
    let basePath = pathname
    for (const loc of LOCALES) {
      if (loc !== DEFAULT_LOCALE && pathname.startsWith(`/${loc}/`)) {
        basePath = pathname.slice(`/${loc}`.length)
        break
      }
      if (loc !== DEFAULT_LOCALE && pathname === `/${loc}`) {
        basePath = "/"
        break
      }
    }

    // Add target locale prefix
    if (targetLocale === DEFAULT_LOCALE) {
      return basePath
    }
    return `/${targetLocale}${basePath}`
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      {LOCALES.map((loc) => (
        <Link
          key={loc}
          href={getTargetPath(loc)}
          className={`rounded px-2 py-1 transition-colors ${
            loc === locale
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {LOCALE_LABELS[loc]}
        </Link>
      ))}
    </div>
  )
}
