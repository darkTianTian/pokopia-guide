"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { getLocalePath, type Locale } from "@/i18n/config"
import { LanguageSwitcher } from "./language-switcher"

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
  const getPath = (path: string) => getLocalePath(locale, path)
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-md p-2 text-muted-foreground hover:text-foreground"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="absolute left-0 top-14 z-50 w-full border-b bg-background shadow-lg">
          <nav className="mx-auto max-w-6xl px-4 py-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={getPath(item.path)}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <p className="px-3 pt-2 text-xs font-semibold uppercase text-muted-foreground/60">
                  {habitatLabel}
                </p>
                <ul>
                  {habitatSubItems.map((item) => (
                    <li key={item.path}>
                      {item.comingSoon ? (
                        <span className="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground/50">
                          {item.label}
                          <span className="rounded bg-muted px-1 py-0.5 text-[10px]">
                            {comingSoonLabel}
                          </span>
                        </span>
                      ) : (
                        <Link
                          href={getPath(item.path)}
                          onClick={() => setOpen(false)}
                          className="block rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                        >
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
            <div className="mt-4 border-t pt-4">
              <LanguageSwitcher locale={locale} />
            </div>
          </nav>
        </div>
      )}
    </div>
  )
}
