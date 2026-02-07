'use client'

import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react'

interface SidebarContextType {
  isOpen: boolean
  isMobile: boolean
  toggle: () => void
  open: () => void
  close: () => void
  setIsMobile: (isMobile: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  // Inicializar sempre como false para evitar hydration mismatch (SSR=false, Client=false)
  // O useEffect abaixo corrige o valor real no client após a hidratação
  const [isMobile, setIsMobile] = useState(false)

  const toggle = () => {
    console.log('[SIDEBAR DEBUG] toggle() chamado. Estado atual:', isOpen, 'isMobile:', isMobile)
    setIsOpen((prev) => {
      console.log('[SIDEBAR DEBUG] Mudando isOpen de', prev, 'para', !prev)
      return !prev
    })
  }
  const open = () => {
    console.log('[SIDEBAR DEBUG] open() chamado')
    setIsOpen(true)
  }
  const close = () => {
    console.log('[SIDEBAR DEBUG] close() chamado')
    setIsOpen(false)
  }

  // Detectar mobile no mount e ouvir mudanças de tamanho
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Setar valor real na primeira renderização client-side
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      isMobile,
      toggle,
      open,
      close,
      setIsMobile,
    }),
    [isOpen, isMobile]
  )

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
