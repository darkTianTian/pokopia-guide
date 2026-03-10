import { Breadcrumb } from "@/components/layout/breadcrumb"
import { CookingGrid, type CookingRecipeItem } from "@/components/cooking/cooking-grid"
import { getAllCookingRecipes } from "@/lib/cooking"
import { getTranslations, t, type Locale } from "@/i18n/config"

interface CookingPageProps {
  locale: Locale
}

export async function CookingPage({ locale }: CookingPageProps) {
  const [recipes, translations] = await Promise.all([
    Promise.resolve(getAllCookingRecipes(locale)),
    getTranslations(locale),
  ])

  const recipeItems: CookingRecipeItem[] = recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    category: recipe.category,
    flavor: recipe.flavor,
    flavorLabel: recipe.flavorLabel,
    baseIngredient: recipe.baseIngredient,
    baseIngredientId: recipe.baseIngredientId,
    tool: recipe.tool,
    toolId: recipe.toolId,
    powersUp: recipe.powersUp,
    powersUpId: recipe.powersUpId,
    specialIngredients: recipe.specialIngredients.map((si) => ({
      name: si.name,
      slug: si.slug,
      isWildcard: si.isWildcard,
    })),
    requiredSpecialty: recipe.requiredSpecialty,
    requiredSpecialtyLabel: recipe.requiredSpecialtyLabel,
    price: recipe.price,
    enhanced: recipe.enhanced,
  }))

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-full -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />

      <Breadcrumb
        items={[{ label: t(translations, "cooking.breadcrumb") }]}
        locale={locale}
      />

      <div className="mb-8 mt-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t(translations, "cooking.title")}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="max-w-2xl text-balance text-lg font-normal text-muted-foreground">
            {t(translations, "cooking.description")}
          </h2>
          <div className="inline-flex items-center rounded-full bg-primary/10 px-5 py-2 ring-1 ring-inset ring-primary/20 dark:bg-primary/5 dark:ring-primary/10">
            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-primary">
              {t(translations, "cooking.totalCount").replace(
                "{{count}}",
                String(recipes.length)
              )}
            </span>
          </div>
        </div>
      </div>

      <CookingGrid recipes={recipeItems} locale={locale} />
    </div>
  )
}
