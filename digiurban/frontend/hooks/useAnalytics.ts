'use client'

import { useCallback, useEffect } from 'react'

interface AnalyticsEvent {
  category: string
  action: string
  label?: string
  value?: number
  timestamp: number
}

interface CardClickEvent {
  cardTitle: string
  cardHref: string
  category: string
  timestamp: number
}

const STORAGE_KEY = 'admin-analytics'
const CARD_CLICKS_KEY = 'admin-card-clicks'
const MAX_EVENTS = 1000 // Limitar tamanho do storage

export function useAnalytics() {
  // Registrar evento genérico
  const trackEvent = useCallback((
    category: string,
    action: string,
    label?: string,
    value?: number
  ) => {
    try {
      const event: AnalyticsEvent = {
        category,
        action,
        label,
        value,
        timestamp: Date.now()
      }

      // Buscar eventos existentes
      const stored = localStorage.getItem(STORAGE_KEY)
      const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : []

      // Adicionar novo evento
      events.push(event)

      // Manter apenas os últimos N eventos
      const trimmedEvents = events.slice(-MAX_EVENTS)

      // Salvar
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedEvents))

      // Log em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Analytics:', event)
      }
    } catch (error) {
      console.error('Erro ao registrar evento de analytics:', error)
    }
  }, [])

  // Registrar clique em card do dashboard
  const trackCardClick = useCallback((
    cardTitle: string,
    cardHref: string,
    category: string = 'Dashboard'
  ) => {
    try {
      const clickEvent: CardClickEvent = {
        cardTitle,
        cardHref,
        category,
        timestamp: Date.now()
      }

      // Registrar no sistema de eventos genérico
      trackEvent('Dashboard', 'Card Click', cardTitle, 1)

      // Registrar em storage específico para cards
      const stored = localStorage.getItem(CARD_CLICKS_KEY)
      const clicks: CardClickEvent[] = stored ? JSON.parse(stored) : []
      clicks.push(clickEvent)

      // Manter últimos 500 cliques
      const trimmedClicks = clicks.slice(-500)
      localStorage.setItem(CARD_CLICKS_KEY, JSON.stringify(trimmedClicks))

      // Log em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('🖱️ Card Click:', clickEvent)
      }
    } catch (error) {
      console.error('Erro ao registrar clique em card:', error)
    }
  }, [trackEvent])

  // Obter estatísticas de cliques em cards
  const getCardClickStats = useCallback(() => {
    try {
      const stored = localStorage.getItem(CARD_CLICKS_KEY)
      if (!stored) return []

      const clicks: CardClickEvent[] = JSON.parse(stored)

      // Agrupar por card
      const statsMap = new Map<string, { title: string; href: string; count: number; lastClick: number }>()

      clicks.forEach((click) => {
        const key = click.cardHref
        const existing = statsMap.get(key)

        if (existing) {
          existing.count++
          existing.lastClick = Math.max(existing.lastClick, click.timestamp)
        } else {
          statsMap.set(key, {
            title: click.cardTitle,
            href: click.cardHref,
            count: 1,
            lastClick: click.timestamp
          })
        }
      })

      // Converter para array e ordenar por mais clicados
      return Array.from(statsMap.values())
        .sort((a, b) => b.count - a.count)
    } catch (error) {
      console.error('Erro ao obter estatísticas de cliques:', error)
      return []
    }
  }, [])

  // Obter cards mais populares (top 5)
  const getTopCards = useCallback((limit: number = 5) => {
    const stats = getCardClickStats()
    return stats.slice(0, limit)
  }, [getCardClickStats])

  // Limpar dados de analytics
  const clearAnalytics = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(CARD_CLICKS_KEY)
      console.log('🗑️ Analytics limpo')
    } catch (error) {
      console.error('Erro ao limpar analytics:', error)
    }
  }, [])

  // Registrar visualização de página
  const trackPageView = useCallback((pageName: string) => {
    trackEvent('Navigation', 'Page View', pageName, 1)
  }, [trackEvent])

  // Registrar tempo na página (chamar no unmount)
  const trackTimeOnPage = useCallback((pageName: string, seconds: number) => {
    trackEvent('Engagement', 'Time on Page', pageName, seconds)
  }, [trackEvent])

  // Registrar busca
  const trackSearch = useCallback((query: string, resultsCount: number) => {
    trackEvent('Search', 'Query', query, resultsCount)
  }, [trackEvent])

  // Registrar erro
  const trackError = useCallback((errorType: string, errorMessage: string) => {
    trackEvent('Error', errorType, errorMessage, 1)
  }, [trackEvent])

  return {
    trackEvent,
    trackCardClick,
    trackPageView,
    trackTimeOnPage,
    trackSearch,
    trackError,
    getCardClickStats,
    getTopCards,
    clearAnalytics
  }
}

// Hook para rastrear tempo na página automaticamente
export function usePageTracking(pageName: string) {
  const { trackPageView, trackTimeOnPage } = useAnalytics()

  useEffect(() => {
    // Registrar visualização
    trackPageView(pageName)

    // Registrar tempo ao sair
    const startTime = Date.now()

    return () => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      trackTimeOnPage(pageName, timeSpent)
    }
  }, [pageName, trackPageView, trackTimeOnPage])
}

// Hook para obter estatísticas de analytics
export function useAnalyticsStats() {
  const { getCardClickStats, getTopCards } = useAnalytics()

  return {
    cardClickStats: getCardClickStats(),
    topCards: getTopCards(5)
  }
}
