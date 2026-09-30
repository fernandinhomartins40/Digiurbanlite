import type { Metadata } from 'next'
import { AdminLayoutContent } from './layout-content'
import './animations.css'
import { THEME_BOOT_SCRIPT } from '@/lib/lg-theme-boot'

/**
 * Configurações de rota para todo o /admin
 *
 * dynamic: 'force-dynamic' = Forçar renderização dinâmica (sem SSG/ISR)
 * revalidate: false = Desabilitar completamente o cache/revalidação
 *
 * JUSTIFICATIVA:
 * - Páginas admin dependem de autenticação em tempo real
 * - Dados de usuário, permissões e estatísticas mudam frequentemente
 * - Não podemos servir páginas cacheadas com dados desatualizados
 * - Client Components usam useEffect para buscar dados, mas a casca HTML
 *   ainda é pré-renderizada - esta config garante que até a casca seja dinâmica
 */
export const dynamic = 'force-dynamic'
export const revalidate = false

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
  return (
    <>
      {/* Aplica o tema antes da primeira pintura (evita piscar claro no modo escuro) */}
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </>
  )
}
