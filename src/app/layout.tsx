import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import "./globals.css"

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
    default: "Pokopia 攻略站 — 最全面的 Pokopia 游戏攻略",
    template: "%s | Pokopia 攻略站",
  },
  description:
    "Pokopia 攻略站提供最全面的宝可梦图鉴、攻略文章、道具数据和技能查询，帮助你成为最强训练家。",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "Pokopia 攻略站",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
