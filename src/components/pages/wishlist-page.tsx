import { Breadcrumb } from "@/components/layout/breadcrumb"
import { WishlistContent } from "@/components/wishlist/wishlist-content"
import { getAllPokemon } from "@/lib/pokemon"
import { getAllRecipes } from "@/lib/crafting"
import { getAllCookingRecipes } from "@/lib/cooking"
import { getAllHabitatsWithPokemon } from "@/lib/habitat"
import { getAllMaterials } from "@/lib/materials"
import { getTranslations, t, type Locale } from "@/i18n/config"

interface WishlistPageProps {
  locale: Locale
}

export async function WishlistPage({ locale }: WishlistPageProps) {
  const [pokemon, recipes, cookingRecipes, habitats, materials, translations] =
    await Promise.all([
      getAllPokemon(locale),
      Promise.resolve(getAllRecipes(locale)),
      Promise.resolve(getAllCookingRecipes(locale)),
      getAllHabitatsWithPokemon(locale),
      Promise.resolve(getAllMaterials(locale)),
      getTranslations(locale),
    ])

  const pokemonItems = pokemon.map((p) => ({
    slug: p.slug,
    name: p.name,
    id: p.id,
    types: p.types,
    image: p.image,
    pokopia: p.pokopia,
  }))

  const recipeItems = recipes.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    materials: r.materials.map((m) => ({ name: m.name, quantity: m.quantity })),
    obtainMethod: r.obtainMethod,
  }))

  const habitatItems = habitats.map((h) => ({
    id: h.id,
    slug: h.slug,
    name: h.name,
    image: h.image,
    materials: h.materials,
    materialsEn: h.materialsEn,
    pokemon: h.pokemon.map((p) => ({
      rarity: p.rarity,
      pokemon: {
        id: p.pokemon.id,
        slug: p.pokemon.slug,
        name: p.pokemon.name,
        image: p.pokemon.image,
      },
    })),
  }))

  const cookingItems = cookingRecipes.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    flavor: r.flavor,
    flavorLabel: r.flavorLabel,
    baseIngredient: r.baseIngredient,
    baseIngredientId: r.baseIngredientId,
    tool: r.tool,
    toolId: r.toolId,
    powersUp: r.powersUp,
    powersUpId: r.powersUpId,
    specialIngredients: r.specialIngredients.map((si) => ({
      name: si.name,
      slug: si.slug,
      isWildcard: si.isWildcard,
    })),
    requiredSpecialty: r.requiredSpecialty,
    requiredSpecialtyLabel: r.requiredSpecialtyLabel,
    price: r.price,
    enhanced: r.enhanced,
  }))

  const materialItems = materials.map((m) => ({
    slug: m.slug,
    name: m.name,
    totalUsage: m.totalUsage,
    habitats: m.habitats.map((h) => ({
      habitatId: h.habitatId,
      habitatName: h.habitatName,
      habitatImage: h.habitatImage,
    })),
  }))

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-full -translate-x-1/2 bg-gradient-to-b from-pink-500/10 to-transparent blur-3xl" />

      <Breadcrumb
        items={[{ label: t(translations, "wishlist.breadcrumb") }]}
        locale={locale}
      />

      <div className="mb-8 mt-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t(translations, "wishlist.title")}
        </h1>
        <p className="mt-4 max-w-2xl text-balance text-lg font-normal text-muted-foreground">
          {t(translations, "wishlist.description")}
        </p>
      </div>

      <WishlistContent
        pokemon={pokemonItems}
        recipes={recipeItems}
        cookingRecipes={cookingItems}
        habitats={habitatItems}
        materials={materialItems}
        locale={locale}
      />
    </div>
  )
}
