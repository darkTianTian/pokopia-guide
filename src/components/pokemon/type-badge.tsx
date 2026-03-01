import { Badge } from "@/components/ui/badge"
import type { PokemonType } from "@/lib/types"
import type { Locale } from "@/i18n/config"
import enTranslations from "@/i18n/en.json"
import zhTranslations from "@/i18n/zh.json"
import jaTranslations from "@/i18n/ja.json"

const TYPE_COLORS: Record<PokemonType, string> = {
  normal: "bg-gray-400 hover:bg-gray-400",
  fire: "bg-orange-500 hover:bg-orange-500",
  water: "bg-blue-500 hover:bg-blue-500",
  electric: "bg-yellow-400 hover:bg-yellow-400 text-black",
  grass: "bg-green-500 hover:bg-green-500",
  ice: "bg-cyan-300 hover:bg-cyan-300 text-black",
  fighting: "bg-red-700 hover:bg-red-700",
  poison: "bg-purple-500 hover:bg-purple-500",
  ground: "bg-amber-600 hover:bg-amber-600",
  flying: "bg-indigo-300 hover:bg-indigo-300 text-black",
  psychic: "bg-pink-500 hover:bg-pink-500",
  bug: "bg-lime-500 hover:bg-lime-500",
  rock: "bg-yellow-700 hover:bg-yellow-700",
  ghost: "bg-purple-700 hover:bg-purple-700",
  dragon: "bg-violet-600 hover:bg-violet-600",
  dark: "bg-gray-700 hover:bg-gray-700",
  steel: "bg-gray-400 hover:bg-gray-400",
  fairy: "bg-pink-300 hover:bg-pink-300 text-black",
}

const TYPE_NAMES_BY_LOCALE: Record<Locale, Record<string, string>> = {
  en: enTranslations.types,
  zh: zhTranslations.types,
  ja: jaTranslations.types,
}

interface TypeBadgeProps {
  type: PokemonType
  locale: Locale
}

export function TypeBadge({ type, locale }: TypeBadgeProps) {
  const typeName = TYPE_NAMES_BY_LOCALE[locale][type] ?? type
  return (
    <Badge className={`${TYPE_COLORS[type]} text-white border-0`}>
      {typeName}
    </Badge>
  )
}
