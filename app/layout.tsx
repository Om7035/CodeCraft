import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CodeCraft - AI-Powered IDE",
  description: "The next generation IDE with AI integration for multiple programming languages",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className + " w-screen h-screen min-h-screen min-w-0 max-w-full max-h-screen overflow-hidden flex flex-col"}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex-1 flex flex-col w-full h-full min-h-0 min-w-0 max-w-full max-h-full">
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
