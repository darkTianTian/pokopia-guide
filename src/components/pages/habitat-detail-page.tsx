import { SafeImage } from "@/components/ui/safe-image"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
import { getHabitatWithPokemon } from "@/lib/habitat"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"
import { notFound } from "next/navigation"

interface HabitatDetailPageProps {
  id: number
  locale: Locale
}

export async function HabitatDetailPage({
  id,
  locale,
}: HabitatDetailPageProps) {
  const [habitat, translations] = await Promise.all([
    getHabitatWithPokemon(id, locale),
    getTranslations(locale),
  ])

  if (!habitat) notFound()

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      {/* Subtle Page Top Glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-full -translate-x-1/2 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl" />

      <Breadcrumb
        items={[
          {
            label: t(translations, "habitat.breadcrumbList"),
            href: getLocalePath(locale, "/habitat/list"),
          },
          { label: habitat.name },
        ]}
        locale={locale}
      />

      {/* Hero Section */}
      <div className="mb-12 mt-6 relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-background/40 p-8 sm:p-12 shadow-sm backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-[60px]" />

        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
          <div className="relative flex h-[200px] w-[200px] sm:h-[240px] sm:w-[240px] shrink-0 items-center justify-center overflow-hidden rounded-[2rem] bg-muted/20 ring-4 ring-primary/20 shadow-inner">
            <SafeImage
              src={habitat.image}
              alt={habitat.name}
              width={220}
              height={220}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
              {habitat.name}
            </h1>

            {habitat.materials && (
              <div className="mt-4 inline-flex items-center rounded-full bg-muted/50 px-4 py-1.5 text-sm font-medium text-muted-foreground ring-1 ring-inset ring-border/50">
                <span className="font-semibold text-foreground mr-2">{t(translations, "habitat.materials")}:</span>
                {habitat.materials}
              </div>
            )}

            <p className="mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              {t(translations, "habitat.detailDescription")}
            </p>

            <div className="mt-6 flex items-center gap-2 rounded-2xl bg-primary/5 px-5 py-3 ring-1 ring-inset ring-primary/20">
              <span className="text-2xl font-bold text-primary">{habitat.pokemon.length}</span>
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t(translations, "habitat.pokemonCount")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pokemon Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-6">
        {habitat.pokemon.map(({ pokemon, rarity }) => {
          const badgeStyles =
            rarity === "very-rare"
              ? "bg-purple-500/20 text-purple-600 dark:text-purple-300 ring-purple-500/40 border-purple-500/20"
              : rarity === "rare"
                ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 ring-blue-500/40 border-blue-500/20"
                : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 ring-emerald-500/40 border-emerald-500/20"

          const cardStyles =
            rarity === "very-rare"
              ? "border-2 border-purple-400/50 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-500"
              : rarity === "rare"
                ? "border-2 border-blue-400/50 dark:border-blue-500/30 hover:border-blue-400 dark:hover:border-blue-500"
                : "border-2 border-emerald-400/50 dark:border-emerald-500/30 hover:border-emerald-400 dark:hover:border-emerald-500"

          const rarityLabel =
            rarity === "very-rare"
              ? "Very Rare"
              : rarity === "rare"
                ? "Rare"
                : "Common"

          return (
            <div key={pokemon.id} className="relative group/habitat-poke mt-2">
              {/* Rarity Badge overlay - Center-Top Floating Pill */}
              <div className="absolute left-1/2 -top-3.5 z-20 -translate-x-1/2 transition-transform duration-300 group-hover/habitat-poke:-translate-y-1">
                <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ring-1 ring-inset border backdrop-blur-xl shadow-sm ${badgeStyles}`}>
                  {rarityLabel}
                </span>
              </div>

              <PokemonCard pokemon={pokemon} locale={locale} className={cardStyles} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
