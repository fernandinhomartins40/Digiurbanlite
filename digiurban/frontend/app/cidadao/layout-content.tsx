'use client'

import { CitizenAuthProvider } from '@/contexts/CitizenAuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'

// Telas sem sessão (ou o próprio assistente) não mostram o atalho
const HIDE_ASSISTANT_PREFIXES = ['/cidadao/assistente', '/cidadao/login', '/cidadao/forgot-password', '/cidadao/reset-password']

export function CitizenLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() || ''
  const showAssistantButton = !HIDE_ASSISTANT_PREFIXES.some((prefix) => pathname.startsWith(prefix))

  return (
    <CitizenAuthProvider>
      {children}

      {/* Assistente disponível em todas as telas (no celular fica no botão central da barra inferior) */}
      {showAssistantButton && (
        <Link
          href="/cidadao/assistente"
          className="fixed bottom-6 right-6 z-50 hidden lg:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Abrir o assistente"
          title="Abrir o assistente"
        >
          <Sparkles className="h-4 w-4" />
          Assistente
        </Link>
      )}
    </CitizenAuthProvider>
  )
}
