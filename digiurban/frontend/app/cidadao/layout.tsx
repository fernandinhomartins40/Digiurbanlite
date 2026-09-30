import type { Metadata } from 'next'
import { CitizenLayoutContent } from './layout-content'
import { THEME_BOOT_SCRIPT } from '@/lib/lg-theme-boot'

export const metadata: Metadata = {
  title: {
    default: 'Portal do Cidadão - DigiUrban',
    template: '%s | Portal do Cidadão - DigiUrban',
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

export default function CidadaoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Aplica o tema antes da primeira pintura (evita piscar claro no modo escuro) */}
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      <CitizenLayoutContent>{children}</CitizenLayoutContent>
    </>
  )
}
