import type { Metadata } from "next"
import { GuideDetailPage } from "@/components/pages/guide-detail-page"
import { getAllGuides, getGuideBySlug } from "@/lib/guides"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const guides = await getAllGuides("en")
  return guides.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const guide = await getGuideBySlug(slug, "en")
  if (!guide) return { title: "Not Found" }

  return {
    title: guide.title,
    description: guide.description,
  }
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  return <GuideDetailPage slug={slug} locale="en" />
}
