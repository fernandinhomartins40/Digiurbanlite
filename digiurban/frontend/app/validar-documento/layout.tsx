import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Validar Documento - DigiUrban',
  description: 'Valide a autenticidade e integridade de documentos oficiais gerados pela plataforma DigiUrban. Sistema de validação digital com código único para verificar documentos em segundos.',
  keywords: [
    'validar documento',
    'validação de documento',
    'autenticidade de documento',
    'verificar documento oficial',
    'validação digital',
    'código de validação',
    'verificação de integridade',
    'documento autêntico',
    'certificado digital',
    'validar PDF',
  ],
  openGraph: {
    title: 'Validar Documento - DigiUrban',
    description: 'Valide a autenticidade e integridade de documentos oficiais gerados pela plataforma DigiUrban.',
    url: '/validar-documento',
    type: 'website',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'DigiUrban - Sistema de Validação de Documentos',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Validar Documento - DigiUrban',
    description: 'Valide a autenticidade e integridade de documentos oficiais em segundos.',
    images: ['/icon-512x512.png'],
  },
  alternates: {
    canonical: '/validar-documento',
  },
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
}

export default function ValidarDocumentoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
