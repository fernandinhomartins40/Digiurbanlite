'use client'

import { CitizenAuthProvider } from '@/contexts/CitizenAuthContext'

export function CitizenLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CitizenAuthProvider>
      {children}
    </CitizenAuthProvider>
  )
}
