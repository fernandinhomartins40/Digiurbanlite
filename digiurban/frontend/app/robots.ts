import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://digiurban.com.br'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/landing',
          '/validar-documento',
        ],
        disallow: [
          '/api/',
          '/cidadao/',
          '/admin/',
          '/super-admin/',
          '/offline',
          '/_next/',
          '/private/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/landing',
          '/validar-documento',
        ],
        disallow: [
          '/api/',
          '/cidadao/',
          '/admin/',
          '/super-admin/',
          '/offline',
        ],
      },
      {
        userAgent: 'Googlebot-Image',
        allow: [
          '/icon-*.png',
          '/logo-*.png',
          '/apple-touch-icon.png',
          '/favicon.png',
        ],
        disallow: [
          '/cidadao/',
          '/admin/',
          '/super-admin/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
