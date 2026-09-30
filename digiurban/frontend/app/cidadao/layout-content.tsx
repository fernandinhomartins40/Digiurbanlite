'use client'

import { CitizenAuthProvider } from '@/contexts/CitizenAuthContext'
import { useLgThemeScope } from '@/lib/lg-theme'

/**
 * Envolve todo o portal do cidadão. Liga o tema claro/escuro (segue o aparelho,
 * ou o que a pessoa fixou no botão de tema) enquanto o portal está aberto.
 * O Assistente fica no círculo da barra inferior (CitizenLayout).
 */
export function CitizenLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  useLgThemeScope()

  return <CitizenAuthProvider>{children}</CitizenAuthProvider>
}
