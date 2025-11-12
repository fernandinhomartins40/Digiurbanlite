'use client'

import { useEffect } from 'react'

/**
 * Componente de limpeza AGRESSIVA de tokens expirados
 * Remove qualquer token antigo do localStorage/sessionStorage/cookies
 */
export function TokenCleaner() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    console.log('[TokenCleaner] 🔍 Iniciando verificação de token...')

    // Verificar TODOS os storages possíveis
    const localToken = localStorage.getItem('digiurban_admin_token')
    const sessionToken = sessionStorage.getItem('digiurban_admin_token')

    let hasExpiredToken = false
    let tokenToCheck = localToken || sessionToken

    if (tokenToCheck) {
      try {
        // Decodificar o token sem verificar assinatura
        const parts = tokenToCheck.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]))
          const exp = payload.exp * 1000
          const now = Date.now()

          console.log('[TokenCleaner] Token encontrado:')
          console.log('  - Expira em:', new Date(exp).toISOString())
          console.log('  - Agora:', new Date(now).toISOString())
          console.log('  - Expirado?', exp < now)

          // Se token expirou, marcar para limpeza
          if (exp < now) {
            hasExpiredToken = true
            console.log('[TokenCleaner] ⚠️  TOKEN EXPIRADO DETECTADO!')
          } else {
            console.log('[TokenCleaner] ✅ Token válido')
          }
        }
      } catch (error) {
        // Se não conseguir decodificar, é inválido
        hasExpiredToken = true
        console.error('[TokenCleaner] ❌ Token inválido/corrompido:', error)
      }
    } else {
      console.log('[TokenCleaner] ℹ️  Nenhum token encontrado')
    }

    // Se encontrou token expirado, LIMPAR TUDO
    if (hasExpiredToken) {
      console.log('[TokenCleaner] 🧹 Limpando TODOS os storages...')

      // Limpar localStorage
      localStorage.removeItem('digiurban_admin_token')
      console.log('  ✓ localStorage limpo')

      // Limpar sessionStorage
      sessionStorage.removeItem('digiurban_admin_token')
      console.log('  ✓ sessionStorage limpo')

      // Limpar TODOS os cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      })
      console.log('  ✓ Cookies limpos')

      console.log('[TokenCleaner] ✅ Limpeza completa realizada!')

      // Redirecionar para login se não estiver lá
      if (!window.location.pathname.includes('/login')) {
        console.log('[TokenCleaner] 🔄 Redirecionando para login em 100ms...')
        setTimeout(() => {
          window.location.href = '/admin/login'
        }, 100)
      }
    }
  }, [])

  return null
}
