import type { Metadata } from "next"
import { HabitatDetailPage } from "@/components/pages/habitat-detail-page"
import { getAllHabitatsWithPokemon, getHabitatWithPokemon } from "@/lib/habitat"
import { isValidLocale, getTranslations, t, getPageAlternates } from "@/i18n/config"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string; id: string }>
}

export async function generateStaticParams() {
  const locales = ["zh", "ja"] as const
  const results: { locale: string; id: string }[] = []

  for (const locale of locales) {
    const habitats = await getAllHabitatsWithPokemon(locale)
    for (const habitat of habitats) {
      results.push({ locale, id: String(habitat.id) })
    }
  }

  return results
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params
  if (!isValidLocale(locale)) return {}

  const [habitat, translations] = await Promise.all([
    getHabitatWithPokemon(Number(id), locale),
    getTranslations(locale),
  ])
  if (!habitat) return { title: t(translations, "pokedex.notFound") }

  return {
    title: `${habitat.name} — ${t(translations, "habitat.listTitle")}`,
    description: `${habitat.name} - ${t(translations, "habitat.detailDescription")}`,
    alternates: getPageAlternates(locale, `/habitat/list/${id}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { locale, id } = await params
  if (!isValidLocale(locale)) notFound()
  return <HabitatDetailPage id={Number(id)} locale={locale} />
}
