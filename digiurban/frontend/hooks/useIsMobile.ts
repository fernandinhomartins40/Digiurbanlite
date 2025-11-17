'use client'

import { useState, useEffect } from 'react'

/**
 * Hook para detectar se o dispositivo é mobile
 * @param breakpoint - Largura máxima em pixels para considerar mobile (padrão: 768px)
 * @returns boolean indicando se é mobile
 */
export function useIsMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Função para verificar se é mobile
    const checkIsMobile = () => {
      // Verificar tamanho da tela
      const screenWidth = window.innerWidth

      // Verificar user agent para dispositivos móveis
      const userAgent = navigator.userAgent.toLowerCase()
      const mobileKeywords = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile']
      const isMobileDevice = mobileKeywords.some(keyword => userAgent.includes(keyword))

      // É mobile se a tela for pequena OU for um dispositivo móvel
      return screenWidth <= breakpoint || isMobileDevice
    }

    // Verificar inicialmente
    setIsMobile(checkIsMobile())

    // Adicionar listener para mudanças de tamanho
    const handleResize = () => {
      setIsMobile(checkIsMobile())
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [breakpoint])

  return isMobile
}

/**
 * Hook para detectar orientação do dispositivo
 * @returns 'portrait' | 'landscape'
 */
export function useOrientation(): 'portrait' | 'landscape' {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth
      setOrientation(isPortrait ? 'portrait' : 'landscape')
    }

    checkOrientation()

    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  return orientation
}

/**
 * Hook para vibração (haptic feedback)
 * @returns função para vibrar
 */
export function useHaptics() {
  const vibrate = (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  return { vibrate }
}
