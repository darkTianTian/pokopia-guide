import Link from "next/link"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getAllMaterials } from "@/lib/materials"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"
import { SafeImage } from "@/components/ui/safe-image"

interface MaterialsListPageProps {
  locale: Locale
}

const GRADIENTS = [
  "from-emerald-400 to-cyan-400",
  "from-pink-400 to-rose-400",
  "from-violet-400 to-fuchsia-400",
  "from-amber-400 to-orange-400",
  "from-blue-400 to-indigo-400",
  "from-lime-400 to-emerald-400",
]

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
        {materials.map((material, index) => {
          const gradientClass = GRADIENTS[index % GRADIENTS.length]
          const displayedHabitats = material.habitats.slice(0, 5)
          const extraCount = material.habitats.length - 5

          return (
            <Link
              key={material.slug}
              href={getLocalePath(locale, `/habitat/materials/${material.slug}`)}
              className="group flex h-full flex-col outline-none"
            >
              <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-border/80 hover:bg-background/60 hover:shadow-2xl dark:hover:shadow-primary/5">
                {/* Glowing Background Blob */}
                <div className="absolute left-1/2 top-0 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-[40px] transition-all duration-500 group-hover:scale-150 group-hover:opacity-60 dark:opacity-20 dark:group-hover:opacity-40">
                  <div className={`h-full w-full bg-gradient-to-br ${gradientClass}`} />
                </div>

                <div className="flex flex-1 flex-col items-center text-center">
                  {/* Material Name */}
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary z-10">
                    {material.name}
                  </h2>

                  {/* Usage Info */}
                  <div className="mt-auto flex w-full flex-col items-center gap-4 rounded-[1.5rem] bg-muted/40 p-4 ring-1 ring-inset ring-border/50 transition-colors group-hover:bg-muted/60 mt-6 z-10">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-primary drop-shadow-sm">
                          {material.totalUsage}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                          {t(translations, "habitat.materialUsedInLabel")}
                        </span>
                      </div>
                    </div>

                    {/* Facepile of Habitats */}
                    {displayedHabitats.length > 0 && (
                      <div className="flex -space-x-3 mt-1 scale-110">
                        {displayedHabitats.map((h, i) => (
                          <div
                            key={h.habitatId}
                            className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-background bg-background shadow-sm ring-1 ring-border/50 transition-transform duration-300 hover:z-20 hover:-translate-y-1 hover:scale-110"
                            style={{ zIndex: 10 - i }}
                            title={h.habitatName}
                          >
                            <SafeImage
                              src={h.habitatImage}
                              alt={h.habitatName}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ))}
                        {extraCount > 0 && (
                          <div
                            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-background bg-secondary text-[11px] font-bold text-secondary-foreground shadow-sm ring-1 ring-border/50 z-0"
                            title={`+${extraCount} more`}
                          >
                            +{extraCount}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
