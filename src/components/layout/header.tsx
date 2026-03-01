import Link from "next/link"
import {
  getTranslations,
  getLocalePath,
  t,
  LOCALES,
  LOCALE_LABELS,
  type Locale,
} from "@/i18n/config"

interface HeaderProps {
  locale: Locale
}

export async function Header({ locale }: HeaderProps) {
  const translations = await getTranslations(locale)

  const navItems = [
    { path: "/pokedex", label: t(translations, "nav.pokedex") },
    { path: "/habitat", label: t(translations, "nav.habitat") },
    { path: "/quests", label: t(translations, "nav.quests") },
    { path: "/explore", label: t(translations, "nav.explore") },
    { path: "/multiplayer", label: t(translations, "nav.multiplayer") },
  ]

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
        <Link
          href={getLocalePath(locale, "/")}
          className="mr-8 flex items-center gap-2 font-bold"
        >
          <span className="text-xl">🎮</span>
          <span>{t(translations, "site.name")}</span>
        </Link>
        <nav className="flex flex-1 items-center gap-6 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={getLocalePath(locale, item.path)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1 text-sm">
          {LOCALES.map((loc) => (
            <Link
              key={loc}
              href={getLocalePath(loc, "/")}
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
      </div>
    </header>
  )
}
