import { Breadcrumb } from "@/components/layout/breadcrumb"
import { HabitatGrid } from "@/components/habitat/habitat-grid"
import { getAllHabitatsWithPokemon } from "@/lib/habitat"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"

interface HabitatListPageProps {
  locale: Locale
}

export async function HabitatListPage({ locale }: HabitatListPageProps) {
  const [habitats, translations] = await Promise.all([
    getAllHabitatsWithPokemon(locale),
    getTranslations(locale),
  ])

  const habitatItems = habitats.map((habitat) => ({
    id: habitat.id,
    slug: habitat.slug,
    name: habitat.name,
    image: habitat.image,
    materials: habitat.materials,
    pokemon: habitat.pokemon.map((p) => ({
      rarity: p.rarity,
      pokemon: { id: p.pokemon.id, name: p.pokemon.name, image: p.pokemon.image },
    })),
    localePath: getLocalePath(locale, `/habitat/${habitat.slug}`),
  }))

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8" suppressHydrationWarning>
      {/* Subtle Page Top Glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-full -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent blur-3xl" aria-hidden="true"></div>

      <Breadcrumb
        items={[
          { label: t(translations, "habitat.breadcrumbList") },
        ]}
        locale={locale}
      />
      <div className="mb-12 mt-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t(translations, "habitat.listTitle")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t(translations, "habitat.listDescription")}
        </p>
        <p className="mt-2 text-sm font-medium uppercase tracking-wider text-muted-foreground/60">
          {t(translations, "habitat.totalCount").replace("{{count}}", String(habitats.length))}
        </p>
      </div>

      <HabitatGrid habitats={habitatItems} locale={locale} />
    </div>
  )
}
