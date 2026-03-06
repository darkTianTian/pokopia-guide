import { Breadcrumb } from "@/components/layout/breadcrumb"
import { BrowseBySection } from "@/components/pokemon/browse-by-section"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
import { getPokemonBySpecialty } from "@/lib/pokemon"
import { getLocalePath, getTranslations, t, type Locale } from "@/i18n/config"

interface PokedexSpecialtyPageProps {
  specialty: string
  locale: Locale
}

export async function PokedexSpecialtyPage({ specialty, locale }: PokedexSpecialtyPageProps) {
  const [pokemon, translations] = await Promise.all([
    getPokemonBySpecialty(specialty, locale),
    getTranslations(locale),
  ])

  const specName = t(translations, `specialties.${specialty}`)
  const title = t(translations, "pokedex.specPageTitle").replace("{{spec}}", specName)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb
        items={[
          {
            label: t(translations, "pokedex.breadcrumb"),
            href: getLocalePath(locale, "/pokedex"),
          },
          { label: specName },
        ]}
        locale={locale}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(translations, "pokedex.showingCount").replace("{{count}}", String(pokemon.length))}
        </p>
      </div>
      <BrowseBySection locale={locale} activeSpecialty={specialty} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pokemon.map((p) => (
          <PokemonCard key={p.id} pokemon={p} locale={locale} compact />
        ))}
      </div>
    </div>
  )
}
