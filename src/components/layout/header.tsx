import Link from "next/link"
import { ChevronDown } from "lucide-react"
import {
  getTranslations,
  getLocalePath,
  t,
  type Locale,
} from "@/i18n/config"
import { LanguageSwitcher } from "./language-switcher"
import { MobileNav } from "./mobile-nav"
import { ThemeToggle } from "./theme-toggle"
import { SiteLogo } from "./logo"

interface HeaderProps {
  locale: Locale
}

export async function Header({ locale }: HeaderProps) {
  const translations = await getTranslations(locale)

  const navItems = [
    { path: "/pokedex", label: t(translations, "nav.pokedex") },
    { path: "/guides", label: t(translations, "nav.guides") },
    { path: "/events", label: t(translations, "nav.events") },
  ]

  const habitatSubItems = [
    {
      path: "/habitat",
      label: t(translations, "nav.habitatList"),
    },
    {
      path: "/habitat/materials",
      label: t(translations, "nav.habitatMaterials"),
    },
    {
      path: "/crafting",
      label: t(translations, "nav.habitatCrafting"),
    },
  ]

  return (
    <header className="sticky top-4 z-50 mx-auto w-full max-w-6xl px-4 transition-all duration-300">
      <div className="flex h-16 items-center justify-between rounded-full border border-border/40 bg-background/40 px-6 shadow-md ring-1 ring-border/50 backdrop-blur-xl">
        <Link
          href={getLocalePath(locale, "/")}
          className="mr-8 flex items-center outline-none"
        >
          <SiteLogo text={t(translations, "site.name")} />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-2 text-sm font-semibold md:flex">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={getLocalePath(locale, item.path)}
              className="rounded-full px-4 py-2 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
          {/* Habitat dropdown */}
          <div className="group relative">
            <button className="flex items-center gap-1 rounded-full px-4 py-2 text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary outline-none">
              {t(translations, "nav.habitat")}
              <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
            </button>
            <div className="invisible absolute left-0 top-full pt-4 opacity-0 transition-all duration-300 group-hover:visible group-hover:opacity-100">
              <div className="min-w-[220px] overflow-hidden rounded-3xl border border-border/40 bg-background/95 p-2 shadow-xl backdrop-blur-3xl">
                {habitatSubItems.map((item) => (
                  <Link
                    key={item.path}
                    href={getLocalePath(locale, item.path)}
                    className="block rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition-all duration-300 hover:bg-primary/10 hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="flex-1 md:hidden" />

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:ml-4 md:flex">
          <ThemeToggle />
          <LanguageSwitcher locale={locale} />
        </div>

        {/* Mobile menu */}
        <MobileNav
          locale={locale}
          navItems={navItems}
          habitatLabel={t(translations, "nav.habitat")}
          habitatSubItems={habitatSubItems}
          comingSoonLabel={t(translations, "nav.comingSoon")}
        />
      </div>
    </header>
  )
}
