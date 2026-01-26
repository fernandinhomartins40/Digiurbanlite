import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DigiUrban - Plataforma Digital de Serviços Municipais',
  description: 'Acesse serviços públicos municipais de forma 100% digital. Saúde, educação, assistência social e mais. Disponível 24/7, grátis e seguro. Solicite serviços, acompanhe protocolos e gerencie documentos online.',
  keywords: [
    'serviços públicos online',
    'portal do cidadão',
    'prefeitura digital',
    'governo eletrônico',
    'e-gov Brasil',
    'protocolo digital',
    'atendimento ao cidadão',
    'serviços municipais',
    'saúde pública online',
    'educação municipal',
    'assistência social online',
    'documento digital',
    'validação de documentos',
    'transparência pública',
    'gestão municipal',
  ],
  openGraph: {
    title: 'DigiUrban - Plataforma Digital de Serviços Municipais',
    description: 'Acesse serviços públicos municipais de forma 100% digital. Disponível 24/7, grátis e seguro.',
    url: 'https://digiurban.com.br/landing',
    siteName: 'DigiUrban',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'DigiUrban - Portal de Serviços Municipais',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DigiUrban - Plataforma Digital de Serviços Municipais',
    description: 'Acesse serviços públicos municipais de forma 100% digital. Disponível 24/7, grátis e seguro.',
    images: ['/icon-512x512.png'],
  },
  alternates: {
    canonical: 'https://digiurban.com.br/landing',
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

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
