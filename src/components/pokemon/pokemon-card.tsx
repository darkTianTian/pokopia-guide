import Link from "next/link"
import Image from "next/image"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TypeBadge } from "./type-badge"
import type { Pokemon } from "@/lib/types"
import { getLocalePath, type Locale } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"

const TRANSLATIONS_BY_LOCALE: Record<Locale, typeof enTranslations> = {
  en: enTranslations,
  zh: zhTranslations,
  ja: jaTranslations,
}

interface PokemonCardProps {
  pokemon: Pokemon
  locale: Locale
  compact?: boolean
}

export function PokemonCard({ pokemon, locale, compact }: PokemonCardProps) {
  const tr = TRANSLATIONS_BY_LOCALE[locale]
  const pokopia = pokemon.pokopia

  const hasSpecialties = pokopia && pokopia.specialties.length > 0
  const hasTime = pokopia?.timeOfDay && pokopia.timeOfDay.length > 0
  const hasWeather = pokopia?.weather && pokopia.weather.length > 0
  const hasHabitats = pokopia?.habitats && pokopia.habitats.length > 0

  return (
    <Link href={getLocalePath(locale, `/pokedex/${pokemon.slug}`)}>
      <Card className="flex h-full flex-col transition-shadow hover:shadow-lg">
        <CardHeader className="flex-1 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{pokemon.name}</CardTitle>
            <span className="text-sm text-muted-foreground">
              #{String(pokemon.id).padStart(3, "0")}
            </span>
          </div>
          <div className="flex h-[120px] items-center justify-center">
            <Image
              src={pokemon.image}
              alt={pokemon.name}
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} locale={locale} />
            ))}
            {hasSpecialties ? (
              <>
                <span className="mx-0.5 text-muted-foreground/30">|</span>
                {pokopia.specialties.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-1 text-sm"
                  >
                    <Image
                      src={`/images/specialties/${s}.png`}
                      alt={(tr.specialties as Record<string, string>)[s] ?? s}
                      width={18}
                      height={18}
                      className="shrink-0"
                    />
                    {(tr.specialties as Record<string, string>)[s] ?? s}
                  </span>
                ))}
              </>
            ) : (
              <>
                <span className="mx-0.5 text-muted-foreground/30">|</span>
                <span className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-1 text-sm text-muted-foreground">
                  <Image
                    src="/images/unknown.svg"
                    alt="?"
                    width={18}
                    height={18}
                    className="shrink-0"
                  />
                  {tr.pokedex.specialty}
                </span>
              </>
            )}
          </div>
        </CardHeader>
        {!compact && <CardContent className="pt-0">
          {/* Time of Day */}
          <div className="mb-1.5 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5">
            <span className="w-[72px] shrink-0 text-[11px] font-semibold text-muted-foreground">
              {tr.pokedex.timeOfDay}
            </span>
            <div className="flex gap-1">
              {hasTime ? (
                pokopia.timeOfDay!.map((tod) => (
                  <Image
                    key={tod}
                    src={`/images/time/${tod}.svg`}
                    alt={(tr.timeOfDay as Record<string, string>)[tod] ?? tod}
                    title={(tr.timeOfDay as Record<string, string>)[tod] ?? tod}
                    width={20}
                    height={20}
                  />
                ))
              ) : (
                <Image src="/images/unknown.svg" alt="?" width={20} height={20} className="rounded-full" />
              )}
            </div>
          </div>

          {/* Weather */}
          <div className="mb-2 flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5">
            <span className="w-[72px] shrink-0 text-[11px] font-semibold text-muted-foreground">
              {tr.pokedex.weatherLabel}
            </span>
            <div className="flex gap-1">
              {hasWeather ? (
                pokopia.weather!.map((w) => (
                  <Image
                    key={w}
                    src={`/images/weather/${w}.svg`}
                    alt={(tr.weather as Record<string, string>)[w] ?? w}
                    title={(tr.weather as Record<string, string>)[w] ?? w}
                    width={20}
                    height={20}
                  />
                ))
              ) : (
                <Image src="/images/unknown.svg" alt="?" width={20} height={20} className="rounded-full" />
              )}
            </div>
          </div>

          {/* Habitats */}
          <div className="flex min-h-[92px] items-center gap-2.5 rounded-lg border p-2">
            <p className="w-[72px] shrink-0 text-[11px] font-semibold leading-tight text-muted-foreground">
              {tr.pokedex.habitatLabel}
            </p>
            {hasHabitats ? (
              <div className="flex gap-2 overflow-x-auto">
                {pokopia.habitats!.map((h) => {
                  const borderColor =
                    h.rarity === "very-rare"
                      ? "border-purple-500"
                      : h.rarity === "rare"
                        ? "border-blue-500"
                        : "border-green-500"
                  return (
                    <span key={h.id} className="inline-flex shrink-0 flex-col items-center gap-0.5">
                      <Image
                        src={`/images/habitats/habitat_${h.id}.png`}
                        alt={h.name}
                        width={64}
                        height={64}
                        className={`rounded-md border-2 ${borderColor}`}
                      />
                      <span className="max-w-[68px] truncate text-[10px] text-muted-foreground">
                        {h.name}
                      </span>
                    </span>
                  )
                })}
              </div>
            ) : (
              <div className="flex gap-2">
                <Image src="/images/unknown-habitat.svg" alt="?" width={64} height={64} className="rounded-md" />
              </div>
            )}
          </div>
        </CardContent>}
      </Card>
    </Link>
  )
}
