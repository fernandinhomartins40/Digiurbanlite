'use client'

import { CitizenAuthProvider } from '@/contexts/CitizenAuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles } from 'lucide-react'

export function CitizenLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const showBotButton = pathname !== '/cidadao'

  return (
    <CitizenAuthProvider>
      {children}

      {showBotButton && (
        <Link
          href="/cidadao"
          className="fixed bottom-24 right-4 z-50 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Abrir DigiBot"
          title="Abrir DigiBot"
        >
          <Sparkles className="h-4 w-4" />
          DigiBot
        </Link>
      )}
    </CitizenAuthProvider>
  )
}
