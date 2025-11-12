import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToasterProvider } from '@/components/providers/ToasterProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DigiUrban - Sistema de Gestão Municipal',
  description: 'Plataforma completa para gestão municipal com foco em protocolos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <ToasterProvider />
        </QueryProvider>
      </body>
    </html>
  )
}