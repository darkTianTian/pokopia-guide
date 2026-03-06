import Link from "next/link"
import Image from "next/image"
import { SafeImage } from "@/components/ui/safe-image"
import { POKEMON_TYPES, type PokemonType } from "@/lib/types"
import { getLocalePath, getTranslations, t, type Locale } from "@/i18n/config"
import { getAllPokemon, getAllSpecialties } from "@/lib/pokemon"

const TYPE_BG: Record<PokemonType, string> = {
  normal: "bg-gray-400",
  fire: "bg-orange-500",
  water: "bg-blue-500",
  electric: "bg-yellow-400",
  grass: "bg-green-500",
  ice: "bg-cyan-300",
  fighting: "bg-red-700",
  poison: "bg-purple-500",
  ground: "bg-amber-600",
  flying: "bg-indigo-300",
  psychic: "bg-pink-500",
  bug: "bg-lime-500",
  rock: "bg-yellow-700",
  ghost: "bg-purple-700",
  dragon: "bg-violet-600",
  dark: "bg-gray-700",
  steel: "bg-gray-400",
  fairy: "bg-pink-300",
}

interface BrowseBySectionProps {
  locale: Locale
  activeType?: string
  activeSpecialty?: string
}

export async function BrowseBySection({
  locale,
  activeType,
  activeSpecialty,
}: BrowseBySectionProps) {
  const [translations, allPokemon] = await Promise.all([
    getTranslations(locale),
    getAllPokemon(locale),
  ])
  const specialties = getAllSpecialties(allPokemon)

  return (
    <div className="mb-8 flex flex-col gap-5">
      {/* Browse by Type */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t(translations, "pokedex.browseByType")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {POKEMON_TYPES.map((type) => {
            const isActive = activeType === type
            const typeName = t(translations, `types.${type}`)
            return (
              <Link
                key={type}
                href={getLocalePath(locale, `/pokedex/type/${type}`)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all hover:scale-105 hover:shadow-md ${
                  isActive
                    ? `${TYPE_BG[type]} text-white shadow-lg ring-2 ring-white/50`
                    : "border border-border/50 bg-background/50 text-foreground hover:bg-background/80"
                }`}
              >
                <Image
                  src={`/images/types/${type}.svg`}
                  alt={typeName}
                  width={18}
                  height={18}
                  className="shrink-0"
                />
                {typeName}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Browse by Specialty */}
      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t(translations, "pokedex.browseBySpecialty")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {specialties.map((spec) => {
            const isActive = activeSpecialty === spec
            const specName = t(translations, `specialties.${spec}`)
            return (
              <Link
                key={spec}
                href={getLocalePath(locale, `/pokedex/specialty/${spec}`)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all hover:scale-105 hover:shadow-md ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/50"
                    : "border border-border/50 bg-background/50 text-foreground hover:bg-background/80"
                }`}
              >
                <SafeImage
                  src={`/images/specialties/${spec.replace(/ /g, "-")}.png`}
                  alt={specName}
                  width={18}
                  height={18}
                  className="shrink-0"
                />
                {specName}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
