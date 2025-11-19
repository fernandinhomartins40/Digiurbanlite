import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToasterProvider } from '@/components/providers/ToasterProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'DigiUrban - Sistema de Gestão Municipal',
    template: '%s | DigiUrban'
  },
  description: 'Plataforma completa para gestão municipal com foco em protocolos. Acesse serviços públicos, acompanhe protocolos e gerencie documentos.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DigiUrban',
    startupImage: [
      {
        url: '/apple-touch-icon.png',
        media: '(device-width: 320px) and (device-height: 568px)',
      },
    ],
  },
  applicationName: 'DigiUrban',
  keywords: [
    'gestão municipal',
    'serviços públicos',
    'protocolos',
    'cidadão',
    'prefeitura',
    'governo digital',
    'e-gov',
    'atendimento digital',
    'solicitações online',
    'documentos digitais',
  ],
  authors: [{ name: 'DigiUrban', url: 'https://digiurban.com.br' }],
  creator: 'DigiUrban',
  publisher: 'DigiUrban',
  category: 'government',
  classification: 'Government Services',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icon.svg',
        color: '#0f6fbe',
      },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://digiurban.com.br',
    siteName: 'DigiUrban',
    title: 'DigiUrban - Sistema de Gestão Municipal',
    description: 'Plataforma completa para gestão municipal com foco em protocolos e atendimento ao cidadão.',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'DigiUrban Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'DigiUrban - Sistema de Gestão Municipal',
    description: 'Plataforma completa para gestão municipal com foco em protocolos e atendimento ao cidadão.',
    images: ['/icon-512x512.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#0f6fbe',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
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