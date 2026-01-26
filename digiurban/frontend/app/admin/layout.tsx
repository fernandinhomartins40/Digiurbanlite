import type { Metadata } from 'next'
import { AdminLayoutContent } from './layout-content'

export const metadata: Metadata = {
  title: {
    default: 'Admin - DigiUrban',
    template: '%s | Admin - DigiUrban',
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

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>
}
