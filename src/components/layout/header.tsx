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

interface HeaderProps {
  locale: Locale
}

export async function Header({ locale }: HeaderProps) {
  const translations = await getTranslations(locale)

  const navItems = [
    { path: "/pokedex", label: t(translations, "nav.pokedex") },
    { path: "/guides", label: t(translations, "nav.guides") },
    { path: "/events", label: t(translations, "nav.events") },
    { path: "/explore", label: t(translations, "nav.explore") },
    { path: "/multiplayer", label: t(translations, "nav.multiplayer") },
  ]

  const habitatSubItems = [
    {
      path: "/habitat/list",
      label: t(translations, "nav.habitatList"),
    },
    {
      path: "/habitat/crafting",
      label: t(translations, "nav.habitatCrafting"),
      comingSoon: true,
    },
  ]

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
        <Link
          href={getLocalePath(locale, "/")}
          className="mr-8 flex items-center gap-2 font-bold"
        >
          <span className="text-xl">🎮</span>
          <span className="hidden sm:inline">{t(translations, "site.name")}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden flex-1 items-center gap-6 text-sm md:flex">
          {navItems.slice(0, 3).map((item) => (
            <Link
              key={item.path}
              href={getLocalePath(locale, item.path)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <div className="group relative">
            <button className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground">
              {t(translations, "nav.habitat")}
              <ChevronDown className="h-3 w-3" />
            </button>
            <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100">
              <div className="min-w-[200px] rounded-md border bg-background p-1 shadow-lg">
                {habitatSubItems.map((item) =>
                  item.comingSoon ? (
                    <span
                      key={item.path}
                      className="flex items-center gap-2 whitespace-nowrap rounded-sm px-3 py-2 text-sm text-muted-foreground/50"
                    >
                      {item.label}
                      <span className="rounded bg-muted px-1 py-0.5 text-[10px]">
                        {t(translations, "nav.comingSoon")}
                      </span>
                    </span>
                  ) : (
                    <Link
                      key={item.path}
                      href={getLocalePath(locale, item.path)}
                      className="block rounded-sm px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>
          {navItems.slice(3).map((item) => (
            <Link
              key={item.path}
              href={getLocalePath(locale, item.path)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex-1 md:hidden" />

        {/* Desktop language switcher */}
        <div className="hidden md:block">
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
