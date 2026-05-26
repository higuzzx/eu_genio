import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { ProjectProvider } from '@/context/project-context'
import { Navbar } from '@/components/navbar'

export const metadata: Metadata = {
  title: 'Eu Gênio — Solucionador Simplex',
  description: 'Resolva problemas de Programação Linear pelo método Simplex com visualização passo a passo, gráfico da região viável, dualidade, análise de sensibilidade e Branch & Bound.',
  keywords: ['simplex', 'programação linear', 'pesquisa operacional', 'otimização', 'dualidade', 'branch and bound'],
  authors: [{ name: 'Eu Gênio' }],
  openGraph: {
    title: 'Eu Gênio — Solucionador Simplex',
    description: 'Resolva problemas de Programação Linear com visualização passo a passo.',
    type: 'website',
    locale: 'pt_BR',
  },
  icons: {
    icon: '/logo-eu-genio.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
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
