import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ToasterProvider } from '@/components/providers/ToasterProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://digiurban.com.br'),
  title: {
    default: 'DigiUrban - Sistema de Gestão Municipal Digital',
    template: '%s | DigiUrban'
  },
  description: 'Plataforma completa para gestão municipal com foco em protocolos digitais. Acesse serviços públicos online, acompanhe protocolos em tempo real e gerencie documentos de forma 100% digital. Disponível 24/7, seguro e gratuito para cidadãos.',
  manifest: '/manifest.json',
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: '/',
  },
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
    'serviços públicos online',
    'protocolos digitais',
    'portal do cidadão',
    'prefeitura digital',
    'governo digital',
    'e-gov Brasil',
    'atendimento ao cidadão',
    'solicitações online',
    'documentos digitais',
    'governo eletrônico',
    'transparência pública',
    'serviços municipais',
    'transformação digital',
    'administração pública',
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
    url: '/',
    siteName: 'DigiUrban',
    title: 'DigiUrban - Sistema de Gestão Municipal Digital',
    description: 'Plataforma completa para gestão municipal com foco em protocolos digitais e atendimento ao cidadão. Acesse serviços públicos 24/7 de forma gratuita e segura.',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'DigiUrban - Plataforma de Gestão Municipal Digital',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DigiUrban - Sistema de Gestão Municipal Digital',
    description: 'Plataforma completa para gestão municipal com foco em protocolos digitais e atendimento ao cidadão. Disponível 24/7, gratuito e seguro.',
    images: ['/icon-512x512.png'],
    creator: '@DigiUrban',
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
      <head>
        {/* Compat: alguns browsers reclamam do meta apple-only */}
        <meta name="mobile-web-app-capable" content="yes" />
        {/* OpenCV.js para jscanify (document scanner) - usando CDN com CORS habilitado */}
        <script src="https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.7.0-release.1/opencv.js" async></script>
      </head>
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <ToasterProvider />
        </QueryProvider>
      </body>
    </html>
  )
}
