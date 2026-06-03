import type React from "react"
import type { Metadata } from "next"
import { Fraunces, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { LenisProvider } from "@/components/motion/lenis-provider"
import "./globals.css"

// Headings + body — warm, high-contrast soft serif (the whole site runs on this)
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT"],
})

// Labels, nav, UI chrome — the "blueprint" monospace
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Bookee - Turn Your Website Into a Smart Booking Assistant",
  description:
    "A website that doesn't just take info—it starts with a conversation. Bookee handles customer bookings and answers questions 24/7 with AI-powered conversational agents.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.png",
  },
  openGraph: {
    title: "Bookee - Turn Your Website Into a Smart Booking Assistant",
    description: "A website that doesn't just take info—it starts with a conversation.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Bookee - Smart Booking Assistant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bookee - Turn Your Website Into a Smart Booking Assistant",
    description: "A website that doesn't just take info—it starts with a conversation.",
    images: ["/og-image.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html className="bg-background" lang="en">
      <body className={`font-sans ${fraunces.variable} ${jetbrainsMono.variable}`}>
        <LenisProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </LenisProvider>
        <Analytics />
      </body>
    </html>
  )
}
