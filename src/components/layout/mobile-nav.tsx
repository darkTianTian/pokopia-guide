"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { getLocalePath, type Locale } from "@/i18n/config"
import { LanguageSwitcher } from "./language-switcher"
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
  const getPath = (path: string) => getLocalePath(locale, path)
  const [open, setOpen] = useState(false)

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
          </ul>

          <div className="mt-2 border-t border-border/40 pt-4 px-2 pb-2">
            <LanguageSwitcher locale={locale} />
          </div>
        </nav>
      </div>
    </div>
  )
}
