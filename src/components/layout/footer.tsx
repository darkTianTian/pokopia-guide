import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"

interface FooterProps {
  locale: Locale
}

export async function Footer({ locale }: FooterProps) {
  const translations = await getTranslations(locale)

  const footerLinks = [
    { path: "/pokedex", label: t(translations, "footer.pokedex") },
    { path: "/guides", label: t(translations, "footer.guides") },
    { path: "/events", label: t(translations, "footer.events") },
    { path: "/habitat", label: t(translations, "footer.habitatList") },
    { path: "/habitat/materials", label: t(translations, "footer.habitatMaterials") },
    { path: "/explore", label: t(translations, "footer.explore") },
    { path: "/multiplayer", label: t(translations, "footer.multiplayer") },
  ]

  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-3 font-semibold">
              {t(translations, "site.name")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t(translations, "site.description")}
            </p>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">
              {t(translations, "footer.navigation")}
            </h3>
            <ul className="space-y-2 text-sm">
              {footerLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    href={getLocalePath(locale, link.path)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold">
              {t(translations, "footer.about")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t(translations, "footer.aboutText")}
            </p>
            <p className="mt-3 text-sm">
              <span className="text-muted-foreground">{t(translations, "footer.feedback")}</span>{" "}
              <a
                href="mailto:feedback@pokopiaguide.com"
                className="text-primary hover:underline"
              >
                feedback@pokopiaguide.com
              </a>
            </p>
          </div>
        </div>
        <Separator className="my-6" />
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {t(translations, "footer.copyright")}
        </p>
      </div>
    </footer>
  )
}
