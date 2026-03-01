import { Construction } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getTranslations, getLocalePath, t, type Locale } from "@/i18n/config"

interface ComingSoonProps {
  title: string
  description: string
  locale: Locale
}

export async function ComingSoon({ title, description, locale }: ComingSoonProps) {
  const translations = await getTranslations(locale)

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 rounded-full bg-accent/30 p-5">
        <Construction className="h-12 w-12 text-primary" />
      </div>
      <h1 className="mb-3 text-3xl font-bold">{title}</h1>
      <p className="mb-2 max-w-md text-lg text-muted-foreground">
        {description}
      </p>
      <p className="mb-8 text-sm text-muted-foreground">
        {t(translations, "comingSoon.releaseNote")}
      </p>
      <Button asChild variant="outline">
        <Link href={getLocalePath(locale, "/")}>
          {t(translations, "comingSoon.backHome")}
        </Link>
      </Button>
    </div>
  )
}
