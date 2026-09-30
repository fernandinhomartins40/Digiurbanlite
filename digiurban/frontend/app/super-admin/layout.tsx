import type { Metadata } from 'next'
import SuperAdminLayoutContent from './layout-content'
import { THEME_BOOT_SCRIPT } from '@/lib/lg-theme-boot'

export const metadata: Metadata = {
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

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Aplica o tema antes da primeira pintura (evita piscar claro no modo escuro) */}
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>
    </>
  )
}
