import type { Metadata } from "next"
import { Nunito, Nunito_Sans } from "next/font/google"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GoogleAnalytics } from "@/components/google-analytics"
import { ScrollToTop } from "@/components/layout/scroll-to-top"
import { ThemeProvider } from "@/components/theme-provider"
import {
  LOCALE_LANG,
  getTranslations,
  t,
  isValidLocale,
  type Locale,
} from "@/i18n/config"
import { notFound } from "next/navigation"

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
})

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
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
      url: `https://pokopiaguide.com/${locale}`,
      siteName: t(translations, "site.name"),
      images: [
        {
          url: "https://pokopiaguide.com/og-image.jpg",
          width: 1200,
          height: 630,
          alt: t(translations, "site.name"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      images: ["https://pokopiaguide.com/og-image.jpg"],
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
    <html lang={LOCALE_LANG[validLocale]} suppressHydrationWarning>
      <body
        className={`${nunito.variable} ${nunitoSans.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Soft Ditto-like Global Background Blobs */}
          <div className="pointer-events-none fixed inset-0 -z-50 overflow-hidden">
            <div className="absolute -left-[10%] -top-[10%] h-[50vw] w-[50vw] rounded-full bg-primary/15 blur-[120px]" />
            <div className="absolute -bottom-[10%] -right-[5%] h-[60vw] w-[60vw] rounded-full bg-accent/15 blur-[160px]" />
            <div className="absolute top-[30%] left-[20%] h-[30vw] w-[30vw] rounded-full bg-secondary/10 blur-[100px]" />
          </div>

          <div className="flex min-h-screen flex-col">
            <Header locale={validLocale} />
            <main className="flex-1">{children}</main>
            <Footer locale={validLocale} />
          </div>
          <ScrollToTop />
          <GoogleAnalytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
