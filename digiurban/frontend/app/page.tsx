'use client'

import { useEffect } from 'react'

export default function Home() {
  useEffect(() => {
    // Redirect to landing page
    window.location.href = '/landing'
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Carregando DigiUrban...</p>
      </div>
    </div>
  )
}