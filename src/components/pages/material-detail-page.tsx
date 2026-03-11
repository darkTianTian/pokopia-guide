import Link from "next/link"
import { SafeImage } from "@/components/ui/safe-image"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { WishlistButton } from "@/components/ui/wishlist-button"
import { getMaterialBySlug } from "@/lib/materials"
import { toHabitatSlug } from "@/lib/habitat"
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
    <div className="relative mx-auto max-w-4xl px-4 py-8">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-full -translate-x-1/2 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl" />

      <Breadcrumb
        items={[
          {
            label: t(translations, "nav.habitat"),
            href: getLocalePath(locale, "/habitat"),
          },
          {
            label: t(translations, "habitat.breadcrumbMaterials"),
            href: getLocalePath(locale, "/habitat/materials"),
          },
          { label: material.name },
        ]}
        locale={locale}
      />

      {/* Hero */}
      <div className="mb-10 mt-6 relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-background/40 p-6 sm:px-10 sm:py-8 shadow-sm backdrop-blur-xl">
        <div className="absolute -right-20 -top-20 -z-10 h-64 w-64 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 blur-[60px]" />

        <WishlistButton
          itemId={`material:${material.slug}`}
          className="absolute top-6 right-6 z-20"
        />

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative flex h-[120px] w-[120px] shrink-0 items-center justify-center">
            <SafeImage
              src={`/images/items/${material.slug}.png`}
              alt={material.name}
              width={120}
              height={120}
              className="rounded-2xl object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_10px_10px_rgba(0,0,0,0.35)] transition-transform duration-500 hover:scale-105"
            />
          </div>

          <div className="flex flex-col items-center text-center sm:items-start sm:text-left gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
              {material.name}
            </h1>

            <p className="text-base text-muted-foreground">
              {t(translations, "habitat.materialDetailDesc").replace(
                "{{name}}",
                material.name
              )}
            </p>

            {material.sources.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className="shrink-0 rounded-full bg-amber-500/20 px-3 py-1 text-sm font-bold text-amber-700 dark:text-amber-400">
                  {t(translations, "habitat.materialSource")}
                </span>
                {material.sources.map((source) => (
                  <span
                    key={source}
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20"
                  >
                    {source}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Screenshots */}
      {material.screenshots.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold tracking-tight">
            {t(translations, "habitat.materialScreenshots")}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {material.screenshots.map((src) => (
              <SafeImage
                key={src}
                src={src}
                alt={material.name}
                width={600}
                height={338}
                className="w-full rounded-2xl border border-border/40 object-cover shadow-sm"
              />
            ))}
          </div>
        </section>
      )}

      {/* Habitats */}
      {material.habitats.length > 0 && (
        <section>
          <div className="mb-4 flex flex-wrap items-baseline gap-3">
            <h2 className="text-xl font-bold tracking-tight">
              {t(translations, "habitat.materialUsedIn").replace(
                "{{count}}",
                String(material.habitats.length)
              )}
            </h2>
            <span className="text-sm font-medium text-muted-foreground">
              {t(translations, "habitat.materialTotalNeeded").replace(
                "{{count}}",
                String(material.habitats.reduce((sum, h) => sum + h.quantity, 0))
              )}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {material.habitats.map((h) => (
              <Link
                key={h.habitatId}
                href={getLocalePath(
                  locale,
                  `/habitat/${toHabitatSlug(h.habitatId)}`
                )}
                className="group flex items-center gap-4 rounded-2xl border border-border/40 bg-background/40 p-4 shadow-sm backdrop-blur-xl transition-colors hover:bg-muted/60"
              >
                <SafeImage
                  src={h.habitatImage}
                  alt={h.habitatName}
                  width={56}
                  height={56}
                  className="shrink-0 rounded-xl object-cover"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {h.habitatName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {t(translations, "habitat.materialQuantity").replace(
                      "{{count}}",
                      String(h.quantity)
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 text-center text-sm text-muted-foreground/70">
        {t(translations, "feedback.dataIssue")}{" "}
        <a
          href={`mailto:feedback@pokopiaguide.com?subject=${encodeURIComponent(`[Feedback] ${material.name} - Pokopia Guide`)}&body=${encodeURIComponent(`Page: https://pokopiaguide.com${getLocalePath(locale, `/habitat/materials/${slug}`)}\n\nIssue:\n`)}`}
          className="text-primary hover:underline"
        >
          {t(translations, "feedback.letUsKnow")}
        </a>
      </p>
    </div>
  )
}
