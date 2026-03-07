import { isValidLocale, getLocalePath } from "@/i18n/config"
import { notFound, redirect } from "next/navigation"

interface PageProps {
  params: Promise<{ locale: string }>
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  redirect(getLocalePath(locale, "/habitat/list"))
}
