import type { Metadata } from 'next'
import { CitizenLayoutContent } from './layout-content'

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
  return <CitizenLayoutContent>{children}</CitizenLayoutContent>
}
