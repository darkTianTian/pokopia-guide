import Link from "next/link"
import { Breadcrumb } from "@/components/layout/breadcrumb"
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {materials.map((material) => (
          <Link
            key={material.slug}
            href={getLocalePath(locale, `/habitat/materials/${material.slug}`)}
            className="group flex h-full flex-col outline-none"
          >
            <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-border/80 hover:bg-background/60 hover:shadow-2xl dark:hover:shadow-primary/5">
              {/* Glowing Background Blob */}
              <div className="absolute left-1/2 top-1/2 -z-10 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-[40px] transition-all duration-500 group-hover:scale-150 group-hover:opacity-30 dark:group-hover:opacity-20">
                <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />
              </div>

              <div className="flex flex-1 flex-col">
                {/* Material Name */}
                <h2 className="text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                  {material.name}
                </h2>

                {/* Usage Count Section */}
                <div className="mt-auto flex flex-col items-center gap-3 rounded-2xl bg-muted/30 p-4 ring-1 ring-inset ring-border/50 transition-colors group-hover:bg-muted/50 mt-6">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {material.totalUsage}
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t(translations, "habitat.materialUsedInLabel")}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  )
}
