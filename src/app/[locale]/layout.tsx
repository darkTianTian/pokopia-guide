import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GoogleAnalytics } from "@/components/google-analytics"
import {
  LOCALE_LANG,
  getTranslations,
  t,
  isValidLocale,
  type Locale,
} from "@/i18n/config"
import { notFound } from "next/navigation"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export function generateStaticParams() {
  return [{ locale: "zh" }, { locale: "ja" }]
}

interface LayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isValidLocale(locale)) return {}

  const translations = await getTranslations(locale)

  return {
    title: {
      default: t(translations, "site.title"),
      template: t(translations, "site.titleTemplate"),
    },
    description: t(translations, "site.description"),
    openGraph: {
      type: "website",
      locale: LOCALE_LANG[locale].replace("-", "_"),
      siteName: t(translations, "site.name"),
    },
  }
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params

  if (!isValidLocale(locale)) {
    notFound()
  }

  const validLocale: Locale = locale

  return (
    <html lang={LOCALE_LANG[validLocale]}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <Header locale={validLocale} />
          <main className="flex-1">{children}</main>
          <Footer locale={validLocale} />
        </div>
        <GoogleAnalytics />
      </body>
    </html>
  )
}
