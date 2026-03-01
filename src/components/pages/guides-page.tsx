import { Breadcrumb } from "@/components/layout/breadcrumb"
import { GuideCard } from "@/components/guides/guide-card"
import { getAllGuides } from "@/lib/guides"
import { getTranslations, t, type Locale } from "@/i18n/config"

interface GuidesPageProps {
  locale: Locale
}

export async function GuidesPage({ locale }: GuidesPageProps) {
  const [guides, translations] = await Promise.all([
    getAllGuides(locale),
    getTranslations(locale),
  ])

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb
        items={[{ label: t(translations, "guides.breadcrumb") }]}
        locale={locale}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {t(translations, "guides.title")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t(translations, "guides.subtitle")}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <GuideCard key={guide.slug} guide={guide} locale={locale} />
        ))}
      </div>
    </div>
  )
}
