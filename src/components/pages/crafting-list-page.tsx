import { Breadcrumb } from "@/components/layout/breadcrumb"
import { CraftingTabs } from "@/components/crafting/crafting-tabs"
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

      <div className="mb-8 mt-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t(translations, "crafting.title")}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="max-w-2xl text-balance text-lg font-normal text-muted-foreground">
            {t(translations, "crafting.description")}
          </h2>
          <div className="inline-flex items-center rounded-full bg-primary/10 px-5 py-2 ring-1 ring-inset ring-primary/20 dark:bg-primary/5 dark:ring-primary/10">
            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-primary">
              {t(translations, "crafting.totalCount").replace(
                "{{count}}",
                String(recipes.length)
              )}
            </span>
          </div>
        </div>
      </div>

      <CraftingTabs recipes={recipeItems} locale={locale} />
    </div>
  )
}
