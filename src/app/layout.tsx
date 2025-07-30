import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import StreakHeader from "@/components/streak-header"
import { Toaster } from 'sonner'
import Link from "next/link"
import { ReactNode } from "react"
import { getCurrentYear } from "@/lib/date-utils"
import { ClientProviders } from "@/components/client-providers"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-background text-foreground"}>
        <ClientProviders>
          <div className="flex flex-col min-h-screen bg-background">
            <StreakHeader />
            <main className="flex-1 container mx-auto py-6 px-4">{children}</main>
            <footer className="py-4 text-center text-sm text-muted-foreground bg-background">
              <div className="container mx-auto flex items-center justify-center space-x-2">
                <Link
                  href="https://x.com/boobachad"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors duration-200"
                >
                  Boobachad
                </Link>
                <span>&copy; {getCurrentYear()}</span>
              </div>
            </footer>
          </div>
          <Toaster />
        </ClientProviders>
      </body>
    </html>
  )
}
