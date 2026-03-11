import { Breadcrumb } from "@/components/layout/breadcrumb"
import { ItemsGrid } from "@/components/items/items-grid"
import { getAllItems, getItemCategories } from "@/lib/items"
import { getTranslations, t, type Locale } from "@/i18n/config"

interface ItemsListPageProps {
  locale: Locale
}

export async function ItemsListPage({ locale }: ItemsListPageProps) {
  const [items, categories, translations] = await Promise.all([
    Promise.resolve(getAllItems(locale)),
    Promise.resolve(getItemCategories(locale)),
    getTranslations(locale),
  ])

  const itemCards = items.map((item) => ({
    id: item.id,
    name: item.name,
    categoryKey: item.categoryKey,
    imageUrl: item.imageUrl,
    description: item.description,
    obtain: item.obtain,
    recipe: item.recipe,
    materials: item.materials,
  }))

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-full -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />

      <Breadcrumb
        items={[{ label: t(translations, "items.breadcrumb") }]}
        locale={locale}
      />

      <div className="mb-8 mt-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t(translations, "items.title")}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="max-w-2xl text-balance text-lg font-normal text-muted-foreground">
            {t(translations, "items.description")}
          </h2>
          <div className="inline-flex items-center rounded-full bg-primary/10 px-5 py-2 ring-1 ring-inset ring-primary/20 dark:bg-primary/5 dark:ring-primary/10">
            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-primary">
              {t(translations, "items.totalCount").replace(
                "{{count}}",
                String(items.length)
              )}
            </span>
          </div>
        </div>
      </div>

      <ItemsGrid items={itemCards} categories={categories} locale={locale} />
    </div>
  )
}
