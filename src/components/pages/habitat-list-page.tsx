import Link from "next/link"
import { SafeImage } from "@/components/ui/safe-image"
import { Breadcrumb } from "@/components/layout/breadcrumb"
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

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      {/* Subtle Page Top Glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-full -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />

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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {habitats.map((habitat) => {
          // Find the most common rarity among pokemon in this habitat (or just pick first)
          const sampleRarity = habitat.pokemon[0]?.rarity || "common"
          const ringColor =
            sampleRarity === "very-rare"
              ? "ring-purple-500/50 group-hover:ring-purple-500"
              : sampleRarity === "rare"
                ? "ring-blue-500/50 group-hover:ring-blue-500"
                : "ring-emerald-500/50 group-hover:ring-emerald-500"

          return (
            <Link
              key={habitat.id}
              href={getLocalePath(locale, `/habitat/list/${habitat.id}`)}
              className="group flex h-full flex-col outline-none"
            >
              <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-border/80 hover:bg-background/60 hover:shadow-2xl dark:hover:shadow-primary/5">

                {/* Glowing Background Blob within card */}
                <div className="absolute left-1/2 top-28 -z-10 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-[40px] transition-all duration-500 group-hover:scale-150 group-hover:opacity-30 dark:group-hover:opacity-20">
                  <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />
                </div>

                <div className="flex flex-1 flex-col">
                  {/* Habitat Image */}
                  <div className="mb-6 flex justify-center">
                    <div className={`relative flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-2xl bg-muted/20 ring-4 ${ringColor} transition-all duration-500`}>
                      <SafeImage
                        src={habitat.image}
                        alt={habitat.name}
                        width={140}
                        height={140}
                        className="object-contain transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110"
                      />
                    </div>
                  </div>

                  {/* Habitat Info */}
                  <div className="mb-4 text-center">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                      {habitat.name}
                    </h2>
                    {habitat.materials && (
                      <p className="mt-1 text-sm font-medium text-muted-foreground/80">
                        {habitat.materials}
                      </p>
                    )}
                  </div>

                  {/* Pokemon Avatars */}
                  <div className="mt-auto flex flex-col items-center gap-3 rounded-2xl bg-muted/30 p-4 ring-1 ring-inset ring-border/50 transition-colors group-hover:bg-muted/50">
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex -space-x-3">
                        {habitat.pokemon.slice(0, 5).map(({ pokemon }) => (
                          <div key={pokemon.id} className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-background drop-shadow-sm transition-transform hover:scale-110 hover:z-10">
                            <SafeImage
                              src={pokemon.image}
                              alt={pokemon.name}
                              fill
                              className="bg-muted object-contain p-1"
                            />
                          </div>
                        ))}
                      </div>
                      {habitat.pokemon.length > 5 && (
                        <span className="flex h-10 items-center justify-center rounded-full bg-background px-3 text-xs font-semibold text-muted-foreground ring-2 ring-border/50">
                          +{habitat.pokemon.length - 5}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {habitat.pokemon.length} {t(translations, "habitat.pokemonCount")}
                    </p>
                  </div>
                </div>
              </article>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
