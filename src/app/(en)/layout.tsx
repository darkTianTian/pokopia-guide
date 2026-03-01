import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { LOCALES, getLocalePath, LOCALE_LANG } from "@/i18n/config"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    siteName: "Pokopia Guide",
  },
  alternates: {
    languages: Object.fromEntries(
      LOCALES.map((loc) => [LOCALE_LANG[loc], `https://pokopiaguide.com${getLocalePath(loc, "/")}`])
    ),
  },
}

export default function EnLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <Header locale="en" />
          <main className="flex-1">{children}</main>
          <Footer locale="en" />
        </div>
      </body>
    </html>
  )
}
