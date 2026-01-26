import type { Metadata } from 'next'

export const superAdminMetadata: Metadata = {
  title: {
    default: 'Super Admin - DigiUrban',
    template: '%s | Super Admin - DigiUrban',
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}
