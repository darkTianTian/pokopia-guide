import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Guide } from "@/lib/types"

interface GuideCardProps {
  guide: Guide
}

export function GuideCard({ guide }: GuideCardProps) {
  return (
    <Link href={`/guides/${guide.slug}`}>
      <Card className="transition-shadow hover:shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{guide.category}</Badge>
            <span className="text-xs text-muted-foreground">{guide.date}</span>
          </div>
          <CardTitle className="text-lg">{guide.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="line-clamp-2">
            {guide.description}
          </CardDescription>
          <p className="mt-2 text-xs text-muted-foreground">
            作者: {guide.author}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
