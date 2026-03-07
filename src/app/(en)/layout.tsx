import type { Metadata } from "next"
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
    "Beginner's guide to Pokémon Pokopia. Pokédex, habitat creation, and furniture crafting recipes to help new trainers get started.",
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
      <body
        className={`${nunito.variable} ${nunitoSans.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
