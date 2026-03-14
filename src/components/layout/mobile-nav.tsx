"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, Menu, X, Globe, Check } from "lucide-react"
import { getLocalePath, LOCALES, LOCALE_LABELS, DEFAULT_LOCALE, type Locale } from "@/i18n/config"
import { ThemeToggle } from "./theme-toggle"

interface NavItem {
  path: string
  label: string
  comingSoon?: boolean
}

interface MobileNavProps {
  locale: Locale
  navItems: NavItem[]
  habitatLabel: string
  habitatSubItems: NavItem[]
  comingSoonLabel: string
}

export function MobileNav({
  locale,
  navItems,
  habitatLabel,
  habitatSubItems,
  comingSoonLabel,
}: MobileNavProps) {
  const pathname = usePathname()
  const getPath = (path: string) => getLocalePath(locale, path)
  const [open, setOpen] = useState(false)

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
    if (targetLocale === DEFAULT_LOCALE) return basePath
    return `/${targetLocale}${basePath}`
  }

  return (
    <div className="relative md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full p-2 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary outline-none"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Floating Dropdown Mobile Menu */}
      <div
        className={`absolute right-0 top-full mt-6 z-50 w-[280px] origin-top-right overflow-hidden rounded-[2rem] border border-border/40 bg-background/95 p-3 shadow-2xl backdrop-blur-3xl transition-all duration-300 ${open ? "scale-100 opacity-100 visible" : "scale-95 opacity-0 invisible"
          }`}
      >
        <nav className="flex flex-col">
          <ul className="mb-2 space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={getPath(item.path)}
                  onClick={() => setOpen(false)}
                  className="block rounded-2xl px-4 py-3 text-[15px] font-semibold text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}

            <li className="px-1 pt-4 pb-2">
              <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/50 border-b border-border/30">
                {habitatLabel}
              </p>
              <ul className="pt-2">
                {habitatSubItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      href={getPath(item.path)}
                      onClick={() => setOpen(false)}
                      className="block rounded-2xl px-3 py-3 text-[15px] font-semibold text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            <li>
              <Link
                href={getPath("/wishlist")}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-2xl px-4 py-3 text-[15px] font-semibold text-pink-500 transition-all duration-300 hover:bg-pink-50 dark:hover:bg-pink-950/30"
              >
                <Heart className="h-4 w-4" />
                Wishlist
              </Link>
            </li>
          </ul>

          <div className="mt-2 border-t border-border/40 pt-4 px-2 pb-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/50">
                <Globe className="h-3.5 w-3.5" />
                Language
              </div>
              <ThemeToggle />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LOCALES.map((loc) => (
                <Link
                  key={loc}
                  href={getTargetPath(loc)}
                  onClick={() => setOpen(false)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    loc === locale
                      ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  {LOCALE_LABELS[loc]}
                  {loc === locale && <Check className="h-3 w-3" />}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
