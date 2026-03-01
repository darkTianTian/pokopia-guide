import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TypeBadge } from "./type-badge"
import type { Pokemon } from "@/lib/types"

interface PokemonCardProps {
  pokemon: Pokemon
}

export function PokemonCard({ pokemon }: PokemonCardProps) {
  return (
    <Link href={`/pokedex/${pokemon.slug}`}>
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{pokemon.name}</CardTitle>
            <span className="text-sm text-muted-foreground">
              #{String(pokemon.id).padStart(3, "0")}
            </span>
          </div>
          <div className="flex gap-1.5">
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} />
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
