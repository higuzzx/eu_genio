import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ProjectProvider } from '@/context/project-context'
import { Navbar } from '@/components/navbar'

export const metadata: Metadata = {
  title: 'Eu Gênio - Solucionador Simplex',
  description: 'Sistema de resolução de problemas de programação linear pelo método Simplex.',
  icons: {
    icon: '/logo-eu-genio.png',
  },
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ProjectProvider>
          <Navbar />
          {children}
        </ProjectProvider>
        <Analytics />
      </body>
    </html>
  )
}
