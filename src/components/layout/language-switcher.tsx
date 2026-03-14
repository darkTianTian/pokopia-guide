"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Globe, Check } from "lucide-react"
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
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function getTargetPath(targetLocale: Locale): string {
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

    if (targetLocale === DEFAULT_LOCALE) {
      return basePath
    }
    return `/${targetLocale}${basePath}`
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary outline-none"
        aria-label="Switch language"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
      </button>

      <div
        className={`absolute right-0 top-full mt-2 z-50 min-w-[160px] origin-top-right overflow-hidden rounded-2xl border border-border/40 bg-background/95 p-1.5 shadow-xl backdrop-blur-3xl transition-all duration-200 ${
          open
            ? "scale-100 opacity-100 visible"
            : "scale-95 opacity-0 invisible"
        }`}
      >
        {LOCALES.map((loc) => (
          <Link
            key={loc}
            href={getTargetPath(loc)}
            onClick={() => setOpen(false)}
            className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              loc === locale
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
            }`}
          >
            {LOCALE_LABELS[loc]}
            {loc === locale && <Check className="h-4 w-4" />}
          </Link>
        ))}
      </div>
    </div>
  )
}
