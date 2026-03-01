import { Breadcrumb } from "@/components/layout/breadcrumb"
import { ComingSoon } from "@/components/coming-soon"
import { getTranslations, t, type Locale } from "@/i18n/config"

interface ComingSoonPageProps {
  locale: Locale
  section: "habitat" | "quests" | "explore" | "multiplayer"
}

export async function ComingSoonPage({ locale, section }: ComingSoonPageProps) {
  const translations = await getTranslations(locale)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb
        items={[{ label: t(translations, `nav.${section}`) }]}
        locale={locale}
      />
      <ComingSoon
        title={t(translations, `${section}.title`)}
        description={t(translations, `${section}.description`)}
        locale={locale}
      />
    </div>
  )
}
