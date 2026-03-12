import { Breadcrumb } from "@/components/layout/breadcrumb"
import { CollectionProgress } from "@/components/collection/collection-progress"
import { SyncImportBanner } from "@/components/collection/sync-import-banner"
import { PokedexTabs } from "@/components/pokemon/pokedex-tabs"
import { getAllPokemon, getAllSpecialties } from "@/lib/pokemon"
import { POKEMON_TYPES } from "@/lib/types"
import { getTranslations, t, type Locale } from "@/i18n/config"

interface PokedexPageProps {
  locale: Locale
}

export async function PokedexPage({ locale }: PokedexPageProps) {
  const [pokemon, translations] = await Promise.all([
    getAllPokemon(locale),
    getTranslations(locale),
  ])

  const regularPokemon = pokemon.filter((p) => p.pokopia?.category !== "event")
  const eventPokemon = pokemon.filter((p) => p.pokopia?.category === "event")
  const regularSpecialties = getAllSpecialties(regularPokemon)
  const eventSpecialties = getAllSpecialties(eventPokemon)
  const pokemonSlugs = pokemon.map((p) => p.slug)

  // Flatten translations for client component
  const flatTranslations: Record<string, string> = {}
  function flatten(obj: Record<string, unknown>, prefix = "") {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      if (typeof value === "string") {
        flatTranslations[fullKey] = value
      } else if (typeof value === "object" && value !== null) {
        flatten(value as Record<string, unknown>, fullKey)
      }
    }
  }
  flatten(translations as unknown as Record<string, unknown>)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb
        items={[{ label: t(translations, "pokedex.breadcrumb") }]}
        locale={locale}
      />
      <SyncImportBanner
        orderedSlugs={pokemonSlugs}
        translations={flatTranslations}
      />
      <div className="mb-8 mt-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-5xl text-foreground">
          {t(translations, "pokedex.title")}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-4">
            <h2 className="text-lg sm:text-xl font-normal text-muted-foreground">
              {t(translations, "pokedex.subtitle")}
            </h2>
            <div className="inline-flex items-center self-start rounded-full bg-primary/10 px-5 py-2 ring-1 ring-inset ring-primary/20 dark:bg-primary/5 dark:ring-primary/10">
              <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-primary">
                {t(translations, "pokedex.totalCount").replace("{{count}}", String(pokemon.length))}
              </span>
            </div>
          </div>
          <CollectionProgress
            total={pokemon.length}
            pokemonSlugs={pokemonSlugs}
            translations={flatTranslations}
          />
        </div>
      </div>
      <PokedexTabs
        regularPokemon={regularPokemon}
        eventPokemon={eventPokemon}
        locale={locale}
        types={POKEMON_TYPES}
        regularSpecialties={regularSpecialties}
        eventSpecialties={eventSpecialties}
      />
    </div>
  )
}
