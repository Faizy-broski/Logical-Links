import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import { cn } from "@/lib/utils"
import NavigationProgress from '@/components/NavigationProgress'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: 'Logical Links',
    template: '%s | Logical Links',
  },
  description: 'Premium tyres and autoparts — shop, compare, and book fitting online.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body suppressHydrationWarning className={`${cormorant.variable} ${inter.variable} antialiased`}>
        <NavigationProgress />
        {children}
      </body>
    </html>
  )
}
