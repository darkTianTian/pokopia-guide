import type { Metadata } from "next"
import { Breadcrumb } from "@/components/layout/breadcrumb"
import { GuideCard } from "@/components/guides/guide-card"
import { getAllGuides } from "@/lib/guides"

export const metadata: Metadata = {
  title: "攻略文章",
  description:
    "Pokopia 最全面的攻略合集，包含新手入门、进阶技巧、通关攻略等内容。",
}

export default async function GuidesPage() {
  const guides = await getAllGuides()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumb items={[{ label: "攻略" }]} />
      <div className="mb-8">
        <h1 className="text-3xl font-bold">攻略文章</h1>
        <p className="mt-2 text-muted-foreground">
          从新手入门到进阶技巧，助你成为最强训练家
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => (
          <GuideCard key={guide.slug} guide={guide} />
        ))}
      </div>
    </div>
  )
}
