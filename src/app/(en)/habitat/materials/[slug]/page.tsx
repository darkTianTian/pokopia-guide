import type { Metadata } from "next"
import { MaterialDetailPage } from "@/components/pages/material-detail-page"
import { getAllMaterialSlugs, getMaterialBySlug } from "@/lib/materials"
import { getPageAlternates } from "@/i18n/config"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return getAllMaterialSlugs("en").map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const material = getMaterialBySlug(slug, "en")
  if (!material) return { title: "Not Found" }

  return {
    title: `${material.name} — Habitat Materials`,
    description: `${material.name} is used in ${material.totalUsage} Pokopia habitats. See which habitats need this material and the quantities required.`,
    alternates: getPageAlternates("en", `/habitat/materials/${slug}`),
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  return <MaterialDetailPage slug={slug} locale="en" />
}
