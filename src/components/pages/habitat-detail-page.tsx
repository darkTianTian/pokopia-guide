import Link from "next/link"
import { SafeImage } from "@/components/ui/safe-image"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { PokemonCard } from "@/components/pokemon/pokemon-card"
import { WishlistButton } from "@/components/ui/wishlist-button"
import { getHabitatBySlug } from "@/lib/habitat"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"
import { QuantityDots } from "@/components/ui/quantity-dots"
import { MapPin } from "lucide-react"
import { notFound } from "next/navigation"
import _pokemonAreaRestrictions from "@/../content/pokemon-area-restrictions.json"

type AreaRestriction = { habitatId: number; area: string; areaJa: string; areaZh: string }
const pokemonAreaRestrictions = _pokemonAreaRestrictions as Record<string, AreaRestriction[]>

function getAreaLabel(restriction: AreaRestriction, locale: string): string {
  if (locale === "ja") return restriction.areaJa
  if (locale === "zh") return restriction.areaZh
  return restriction.area
}

function parseMaterials(materials: string): { name: string; quantity: number }[] {
  return materials.split(/,\s*/).filter(Boolean).map((part) => {
    const match = part.match(/^(.+?)\s*x(\d+)$/)
    if (match) {
      return { name: match[1].trimEnd(), quantity: parseInt(match[2], 10) }
    }
    return { name: part, quantity: 1 }
  })
}

function toItemSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function getMaterialSlugs(materialsEn: string | null): string[] {
  if (!materialsEn) return []
  return parseMaterials(materialsEn).map((m) => toItemSlug(m.name))
}

interface HabitatDetailPageProps {
  slug: string
  locale: Locale
}

export async function HabitatDetailPage({
  slug,
  locale,
}: HabitatDetailPageProps) {
  const [habitat, translations] = await Promise.all([
    getHabitatBySlug(slug, locale),
    getTranslations(locale),
  ])

  if (!habitat) notFound()

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-full -translate-x-1/2 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl" />

      <Breadcrumb
        items={[
          {
            label: t(translations, "habitat.breadcrumbList"),
            href: getLocalePath(locale, "/habitat"),
          },
          { label: habitat.name },
        ]}
        locale={locale}
      />

      {/* Hero Section */}
      <div className="mb-10 mt-6 relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-background/40 p-6 sm:px-10 sm:py-8 shadow-sm backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-[60px]" />

        <span className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex px-4 py-1.5 items-center justify-center rounded-full bg-muted/60 font-mono text-sm font-bold tracking-widest text-muted-foreground backdrop-blur-md ring-1 ring-border/50">
          #{String(habitat.id).padStart(3, "0")}
        </span>
        <WishlistButton
          itemId={`habitat:${habitat.id}`}
          className="absolute top-6 right-6 z-20"
        />

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <div className="relative flex h-[200px] w-[200px] sm:h-[220px] sm:w-[220px] shrink-0 items-center justify-center">
            <div className="relative z-10 flex h-full w-full items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105">
              <SafeImage
                src={habitat.image}
                alt={habitat.name}
                width={200}
                height={200}
                className="rounded-[2rem] object-contain drop-shadow-[0_15px_15px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_15px_15px_rgba(0,0,0,0.4)]"
              />
            </div>
          </div>
          <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-2 sm:gap-3">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-5xl text-foreground">
              {habitat.name}
            </h1>

            {habitat.materials && (() => {
              const mats = parseMaterials(habitat.materials)
              const slugs = getMaterialSlugs(habitat.materialsEn)
              return (
                <div className="mt-2 flex flex-col sm:flex-row sm:items-start gap-3 rounded-2xl bg-amber-500/10 px-5 py-3 ring-1 ring-inset ring-amber-500/20 dark:bg-amber-500/5 dark:ring-amber-500/10">
                  <span className="shrink-0 rounded-full bg-amber-500/20 px-3 py-1 font-bold text-amber-700 dark:text-amber-400 text-sm tracking-wide">
                    {t(translations, "habitat.materials")}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {mats.map((mat, i) => (
                      <Link
                        key={i}
                        href={getLocalePath(locale, `/habitat/materials/${slugs[i] ?? ""}`)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary ring-1 ring-inset ring-primary/20 dark:bg-primary/5 dark:ring-primary/10 transition-colors hover:bg-primary/20"
                      >
                        {slugs[i] && (
                          <SafeImage
                            src={`/images/items/${slugs[i]}.png`}
                            alt={mat.name}
                            width={20}
                            height={20}
                            className="inline-block shrink-0"
                          />
                        )}
                        {mat.name}
                        <QuantityDots count={mat.quantity} className="ml-1" />
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })()}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <p className="max-w-2xl text-base text-muted-foreground leading-relaxed">
                {t(translations, "habitat.detailDescription")}
              </p>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/5 px-3 py-1.5 ring-1 ring-inset ring-primary/20">
                <span className="text-sm font-bold text-primary">{habitat.pokemon.length}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t(translations, "habitat.pokemonCount")}
                </span>
              </div>
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

          const rarityLabel = t(translations, `rarity.${rarity}`)

          const areaRestriction = (pokemonAreaRestrictions[pokemon.slug] ?? []).find(
            (r) => r.habitatId === habitat.id
          )

          return (
            <div key={pokemon.id} className="relative group/habitat-poke mt-2">
              <div className="absolute left-1/2 -top-3.5 z-20 -translate-x-1/2 flex gap-1.5 transition-transform duration-300 group-hover/habitat-poke:-translate-y-1">
                <span className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ring-1 ring-inset border backdrop-blur-xl shadow-sm ${badgeStyles}`}>
                  {rarityLabel}
                </span>
                {areaRestriction && (
                  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 ring-1 ring-inset ring-amber-500/40 border border-amber-500/20 backdrop-blur-xl shadow-sm">
                    <MapPin className="h-3 w-3" />
                    {t(translations, "habitat.areaOnly").replace("{{area}}", getAreaLabel(areaRestriction, locale))}
                  </span>
                )}
              </div>

              <PokemonCard pokemon={pokemon} locale={locale} className={cardStyles} />
            </div>
          )
        })}
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground/70">
        {t(translations, "feedback.dataIssue")}{" "}
        <a
          href={`mailto:feedback@pokopiaguide.com?subject=${encodeURIComponent(`[Feedback] ${habitat.name} - Pokopia Guide`)}&body=${encodeURIComponent(`Page: https://pokopiaguide.com${getLocalePath(locale, `/habitat/list/${slug}`)}\n\nIssue:\n`)}`}
          className="text-primary hover:underline"
        >
          {t(translations, "feedback.letUsKnow")}
        </a>
      </p>
    </div>
  )
}
