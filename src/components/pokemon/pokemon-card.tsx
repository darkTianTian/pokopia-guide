import Link from "next/link"
import Image from "next/image"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TypeBadge } from "./type-badge"
import type { Pokemon } from "@/lib/types"
import { getLocalePath, type Locale } from "@/i18n/config"

interface PokemonCardProps {
  pokemon: Pokemon
  locale: Locale
}

export function PokemonCard({ pokemon, locale }: PokemonCardProps) {
  return (
    <Link href={getLocalePath(locale, `/pokedex/${pokemon.slug}`)}>
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{pokemon.name}</CardTitle>
            <span className="text-sm text-muted-foreground">
              #{String(pokemon.id).padStart(3, "0")}
            </span>
          </div>
          <div className="flex justify-center py-3">
            <Image
              src={pokemon.image}
              alt={pokemon.name}
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
          <div className="flex gap-1.5">
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} locale={locale} />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-2">
            {pokemon.description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}
