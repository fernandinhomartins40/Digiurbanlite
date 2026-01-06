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
  const [isMobile, setIsMobile] = useState(() => {
    // Detectar mobile no estado inicial (SSR safe)
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768
    }
    return false
  })

  const toggle = () => setIsOpen((prev) => !prev)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  // Listener para mudanças de tamanho da janela
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Adicionar listener
    window.addEventListener('resize', handleResize)

    // Limpar listener
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
