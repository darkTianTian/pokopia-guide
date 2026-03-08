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
        <p className="mt-4 text-lg text-muted-foreground">
          {t(translations, "habitat.materialsDescription")}
        </p>
        <p className="mt-2 text-sm font-medium uppercase tracking-wider text-muted-foreground/60">
          {t(translations, "habitat.materialsTotalCount").replace(
            "{{count}}",
            String(materials.length)
          )}
        </p>
      </div>

      <MaterialsGrid materials={materialItems} locale={locale} />
    </div>
  )
}
