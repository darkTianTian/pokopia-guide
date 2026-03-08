import { Breadcrumb } from "@/components/layout/breadcrumb"
import { CraftingGrid } from "@/components/crafting/crafting-grid"
import { getAllRecipes } from "@/lib/crafting"
import { getTranslations, t, type Locale } from "@/i18n/config"

interface CraftingListPageProps {
  locale: Locale
}

export async function CraftingListPage({ locale }: CraftingListPageProps) {
  const [recipes, translations] = await Promise.all([
    Promise.resolve(getAllRecipes(locale)),
    getTranslations(locale),
  ])

  const recipeItems = recipes.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    category: recipe.category,
    materials: recipe.materials.map((m) => ({
      name: m.name,
      quantity: m.quantity,
    })),
    obtainMethod: recipe.obtainMethod,
  }))

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-full -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />

      <Breadcrumb
        items={[{ label: t(translations, "crafting.breadcrumb") }]}
        locale={locale}
      />

      <div className="mb-12 mt-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t(translations, "crafting.title")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {t(translations, "crafting.description")}
        </p>
        <p className="mt-2 text-sm font-medium uppercase tracking-wider text-muted-foreground/60">
          {t(translations, "crafting.totalCount").replace(
            "{{count}}",
            String(recipes.length)
          )}
        </p>
      </div>

      <CraftingGrid recipes={recipeItems} locale={locale} />
    </div>
  )
}
