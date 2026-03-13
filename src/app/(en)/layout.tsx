import type { Metadata } from "next"
import Script from "next/script"
import { Nunito, Nunito_Sans } from "next/font/google"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { GoogleAnalytics } from "@/components/google-analytics"
import { ScrollToTop } from "@/components/layout/scroll-to-top"
import { ThemeProvider } from "@/components/theme-provider"
import "@/app/globals.css"

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
})

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Pokémon Pokopia Guide | Pokédex & Wiki | PokopiaGuide.com",
    template: "%s | Pokopia Guide",
  },
  description:
    "Your complete Pokémon Pokopia guide & database — Pokédex with types & specialties, habitat building, crafting recipes, cooking buffs, and materials list.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://pokopiaguide.com",
    siteName: "Pokopia Guide",
    images: [
      {
        url: "https://pokopiaguide.com/og-image-v5.jpg",
        width: 1200,
        height: 630,
        alt: "Pokopia Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://pokopiaguide.com/og-image-v5.jpg"],
  },
}

export default function EnLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2305559697829239"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
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
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-[10%] left-[10%] h-[50vw] w-[50vw] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply opacity-70 animate-blob dark:mix-blend-screen dark:opacity-20" />
            <div className="absolute top-[20%] right-[5%] h-[40vw] w-[40vw] rounded-full bg-emerald-400/20 blur-[100px] mix-blend-multiply opacity-60 animate-blob animation-delay-2000 dark:mix-blend-screen dark:opacity-20" />
            <div className="absolute -bottom-[20%] left-[30%] h-[60vw] w-[60vw] rounded-full bg-primary/20 blur-[130px] mix-blend-multiply opacity-50 animate-blob animation-delay-4000 dark:mix-blend-screen dark:opacity-20" />
          </div>

          <div className="flex min-h-screen flex-col">
            <Header locale="en" />
            <main className="flex-1">{children}</main>
            <Footer locale="en" />
          </div>
          <ScrollToTop />
          <GoogleAnalytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
