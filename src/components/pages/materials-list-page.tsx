import { Breadcrumb } from "@/components/layout/breadcrumb"
import { MaterialsGrid } from "@/components/habitat/materials-grid"
import { getAllMaterials } from "@/lib/materials"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"

interface MaterialsListPageProps {
  locale: Locale
}

export async function MaterialsListPage({ locale }: MaterialsListPageProps) {
  const [materials, translations] = await Promise.all([
    Promise.resolve(getAllMaterials(locale)),
    getTranslations(locale),
  ])

  const materialItems = materials.map((material) => ({
    slug: material.slug,
    name: material.name,
    sources: material.sources,
    screenshots: material.screenshots,
    totalUsage: material.totalUsage,
    habitats: material.habitats.map((h) => ({
      habitatId: h.habitatId,
      habitatName: h.habitatName,
      habitatImage: h.habitatImage,
    })),
  }))

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      {/* Subtle Page Top Glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-full -translate-x-1/2 bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />

      <Breadcrumb
        items={[
          {
            label: t(translations, "nav.habitat"),
            href: getLocalePath(locale, "/habitat"),
          },
          { label: t(translations, "habitat.breadcrumbMaterials") },
        ]}
        locale={locale}
      />

      <div className="mb-12 mt-6">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          {t(translations, "habitat.materialsTitle")}
        </h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="max-w-2xl text-balance text-lg font-normal text-muted-foreground">
            {t(translations, "habitat.materialsDescription")}
          </h2>
          <div className="inline-flex items-center rounded-full bg-primary/10 px-5 py-2 ring-1 ring-inset ring-primary/20 dark:bg-primary/5 dark:ring-primary/10">
            <span className="text-sm sm:text-base font-bold uppercase tracking-wider text-primary">
              {t(translations, "habitat.materialsTotalCount").replace(
                "{{count}}",
                String(materials.length)
              )}
            </span>
          </div>
        </div>
      </div>

      <MaterialsGrid materials={materialItems} locale={locale} />
    </div>
  )
}
