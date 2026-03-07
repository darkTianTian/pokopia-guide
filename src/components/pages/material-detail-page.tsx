import Link from "next/link"
import { SafeImage } from "@/components/ui/safe-image"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { getMaterialBySlug } from "@/lib/materials"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"
import { notFound } from "next/navigation"

interface MaterialDetailPageProps {
  slug: string
  locale: Locale
}

export async function MaterialDetailPage({
  slug,
  locale,
}: MaterialDetailPageProps) {
  const [material, translations] = await Promise.all([
    Promise.resolve(getMaterialBySlug(slug, locale)),
    getTranslations(locale),
  ])

  if (!material) notFound()

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8">
      {/* Subtle Page Top Glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-full -translate-x-1/2 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl" />

      <Breadcrumb
        items={[
          {
            label: t(translations, "habitat.breadcrumbMaterials"),
            href: getLocalePath(locale, "/habitat/materials"),
          },
          { label: material.name },
        ]}
        locale={locale}
      />

      {/* Hero Section */}
      <div className="mb-12 mt-6 relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-background/40 p-8 sm:p-12 shadow-sm backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-[60px]" />

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
          {material.name}
        </h1>

        <p className="mt-4 text-lg text-muted-foreground">
          {t(translations, "habitat.materialDetailDesc").replace(
            "{{name}}",
            material.name
          )}
        </p>

        <div className="mt-6 flex items-center gap-2 rounded-2xl bg-primary/5 px-5 py-3 ring-1 ring-inset ring-primary/20 w-fit">
          <span className="text-2xl font-bold text-primary">
            {material.totalUsage}
          </span>
          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t(translations, "habitat.materialUsedInLabel")}
          </span>
        </div>
      </div>

      {/* Habitat Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {material.habitats.map((usage) => (
          <Link
            key={usage.habitatId}
            href={getLocalePath(locale, `/habitat/list/${usage.habitatId}`)}
            className="group flex h-full flex-col outline-none"
          >
            <article className="relative flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/40 bg-background/40 p-6 shadow-sm backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-border/80 hover:bg-background/60 hover:shadow-2xl dark:hover:shadow-primary/5">
              {/* Glowing Background Blob */}
              <div className="absolute left-1/2 top-28 -z-10 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 blur-[40px] transition-all duration-500 group-hover:scale-150 group-hover:opacity-30 dark:group-hover:opacity-20">
                <div className="h-full w-full bg-gradient-to-br from-primary to-accent" />
              </div>

              <div className="flex flex-1 flex-col">
                {/* Habitat Image */}
                <div className="mb-6 flex justify-center">
                  <div className="relative flex h-[160px] w-[160px] items-center justify-center overflow-hidden rounded-2xl bg-muted/20 ring-4 ring-emerald-500/50 transition-all duration-500 group-hover:ring-emerald-500">
                    <SafeImage
                      src={usage.habitatImage}
                      alt={usage.habitatName}
                      width={140}
                      height={140}
                      className="object-contain transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110"
                    />
                  </div>
                </div>

                {/* Habitat Info */}
                <div className="mb-4 text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {usage.habitatName}
                  </h2>
                </div>

                {/* Quantity Badge */}
                <div className="mt-auto flex flex-col items-center gap-3 rounded-2xl bg-muted/30 p-4 ring-1 ring-inset ring-border/50 transition-colors group-hover:bg-muted/50">
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset bg-primary/10 text-primary ring-primary/30 backdrop-blur-md shadow-sm">
                    {t(translations, "habitat.materialQuantity").replace(
                      "{{count}}",
                      String(usage.quantity)
                    )}
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  )
}
