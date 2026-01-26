import Script from 'next/script'

interface OrganizationSchema {
  '@context': string
  '@type': string
  name: string
  url: string
  logo: string
  description: string
  contactPoint?: {
    '@type': string
    contactType: string
    availableLanguage: string
  }
  sameAs?: string[]
}

interface WebsiteSchema {
  '@context': string
  '@type': string
  name: string
  url: string
  description: string
  inLanguage: string
  potentialAction?: {
    '@type': string
    target: string
    'query-input': string
  }
}

interface GovernmentServiceSchema {
  '@context': string
  '@type': string
  name: string
  description: string
  provider: {
    '@type': string
    name: string
  }
  serviceType: string
  areaServed: {
    '@type': string
    name: string
  }
  availableChannel: {
    '@type': string
    serviceUrl: string
    availableLanguage: string
  }
}

export function OrganizationStructuredData() {
  const schema: OrganizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentOrganization',
    name: 'DigiUrban',
    url: 'https://digiurban.com.br',
    logo: 'https://digiurban.com.br/icon-512x512.png',
    description: 'Plataforma completa para gestão municipal com foco em protocolos e atendimento ao cidadão.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Atendimento ao Cidadão',
      availableLanguage: 'Portuguese',
    },
  }

  return (
    <Script
      id="organization-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebsiteStructuredData() {
  const schema: WebsiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'DigiUrban',
    url: 'https://digiurban.com.br',
    description: 'Plataforma digital de serviços públicos municipais disponível 24/7',
    inLanguage: 'pt-BR',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://digiurban.com.br/cidadao/servicos?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <Script
      id="website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function GovernmentServiceStructuredData() {
  const services: GovernmentServiceSchema[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'GovernmentService',
      name: 'Serviços de Saúde Municipal',
      description: 'Agendamento de consultas, marcação de exames e acesso à carteira de vacinação digital',
      provider: {
        '@type': 'GovernmentOrganization',
        name: 'DigiUrban',
      },
      serviceType: 'Saúde Pública',
      areaServed: {
        '@type': 'City',
        name: 'Município',
      },
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: 'https://digiurban.com.br/cidadao/servicos',
        availableLanguage: 'pt-BR',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'GovernmentService',
      name: 'Serviços de Educação Municipal',
      description: 'Matrícula escolar, transferências e emissão de declarações educacionais',
      provider: {
        '@type': 'GovernmentOrganization',
        name: 'DigiUrban',
      },
      serviceType: 'Educação',
      areaServed: {
        '@type': 'City',
        name: 'Município',
      },
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: 'https://digiurban.com.br/cidadao/servicos',
        availableLanguage: 'pt-BR',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'GovernmentService',
      name: 'Assistência Social Municipal',
      description: 'Acesso a programas sociais, benefícios e cadastro único',
      provider: {
        '@type': 'GovernmentOrganization',
        name: 'DigiUrban',
      },
      serviceType: 'Assistência Social',
      areaServed: {
        '@type': 'City',
        name: 'Município',
      },
      availableChannel: {
        '@type': 'ServiceChannel',
        serviceUrl: 'https://digiurban.com.br/cidadao/servicos',
        availableLanguage: 'pt-BR',
      },
    },
  ]

  return (
    <Script
      id="government-services-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(services) }}
    />
  )
}

export function FAQStructuredData() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'O DigiUrban é gratuito para cidadãos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim! A plataforma DigiUrban é 100% gratuita para todos os cidadãos. Você pode acessar todos os serviços municipais sem qualquer custo.',
        },
      },
      {
        '@type': 'Question',
        name: 'Como faço para criar uma conta?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Para criar uma conta, basta acessar o Portal do Cidadão e clicar em "Criar Conta". O processo leva menos de 2 minutos e você precisará apenas de CPF, e-mail e telefone.',
        },
      },
      {
        '@type': 'Question',
        name: 'A plataforma está disponível 24 horas?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim! O DigiUrban está disponível 24 horas por dia, 7 dias por semana. Você pode solicitar serviços e acompanhar protocolos a qualquer momento.',
        },
      },
      {
        '@type': 'Question',
        name: 'Meus dados estão seguros?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sim! Todos os dados são protegidos com criptografia de ponta a ponta e a plataforma está em total conformidade com a LGPD (Lei Geral de Proteção de Dados).',
        },
      },
      {
        '@type': 'Question',
        name: 'Como posso validar um documento digital?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Acesse a página "Validar Documento" e digite o código de validação que aparece no documento. Você também pode fazer upload do PDF para verificar sua integridade.',
        },
      },
    ],
  }

  return (
    <Script
      id="faq-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

interface BreadcrumbItem {
  name: string
  url: string
}

export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <Script
      id="breadcrumb-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
