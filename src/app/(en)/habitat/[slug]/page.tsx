import type { Metadata } from "next"
import { HabitatDetailPage } from "@/components/pages/habitat-detail-page"
import { getAllHabitatSlugs, getHabitatBySlug } from "@/lib/habitat"
import { getPageAlternates } from "@/i18n/config"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = getAllHabitatSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const habitat = await getHabitatBySlug(slug, "en")
  if (!habitat) return { title: "Not Found" }

  return {
    title: `${habitat.name} — Habitat List`,
    description: `${habitat.name} - Pokémon that can be found in this habitat.`,
    alternates: getPageAlternates("en", `/habitat/${habitat.slug}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  return <HabitatDetailPage slug={slug} locale="en" />
}
