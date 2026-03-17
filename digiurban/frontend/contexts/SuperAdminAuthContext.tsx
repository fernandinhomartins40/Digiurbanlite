'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface SuperAdminUser {
  id: string
  name: string
  email: string
  role: 'SUPER_ADMIN'
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

export interface SuperAdminStats {
  totalTenants: number
  activeTenants: number
  totalUsers: number
  totalRevenue: number
  activeSubscriptions: number
  pendingOnboarding: number
}

interface SuperAdminAuthContextType {
  user: SuperAdminUser | null
  stats: SuperAdminStats | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
  error: string | null
  refreshUser: () => Promise<boolean>
  apiRequest: (endpoint: string, options?: RequestInit) => Promise<any>
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextType | undefined>(undefined)

interface SuperAdminAuthProviderProps {
  children: ReactNode
}

export function SuperAdminAuthProvider({ children }: SuperAdminAuthProviderProps) {
  const [user, setUser] = useState<SuperAdminUser | null>(null)
  const [stats, setStats] = useState<SuperAdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  // âš ï¸ NOTA: NÃ£o podemos verificar cookies httpOnly via JavaScript
  // O cookie existe, mas Ã© inacessÃ­vel por document.cookie (por seguranÃ§a)
  // Vamos confiar na requisiÃ§Ã£o /auth/me para validar a autenticaÃ§Ã£o

  // âœ… SEGURANÃ‡A: FunÃ§Ã£o para fazer requisiÃ§Ãµes autenticadas (usa cookies automÃ¡ticos)
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    console.log('[SuperAdminAuth] ====== apiRequest DEBUG ======')
    console.log('[SuperAdminAuth] Endpoint solicitado:', endpoint)

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    // Usar getFullApiUrl para construir URL correta
    const { getFullApiUrl } = await import('@/lib/api-config')
    // Remove /api do endpoint se jÃ¡ estiver presente pois getFullApiUrl jÃ¡ adiciona
    const cleanEndpoint = endpoint.replace(/^\/api/, '')
    const url = getFullApiUrl(cleanEndpoint)

    console.log('[SuperAdminAuth] URL construÃ­da:', url)
    console.log('[SuperAdminAuth] Headers:', headers)
    console.log('[SuperAdminAuth] Cookies do navegador:', document.cookie ? 'EXISTEM' : 'VAZIO')

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // âœ… CRÃTICO: Enviar cookies automaticamente
    })

    console.log('[SuperAdminAuth] Resposta recebida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido', code: null }))
      console.log('[SuperAdminAuth] âŒ Erro na resposta:', errorData)

      // Se token expirado ou invÃ¡lido (401), limpar autenticaÃ§Ã£o
      if (response.status === 401) {
        console.log('[SuperAdminAuth] ðŸ”’ Status 401 - Limpando autenticaÃ§Ã£o')
        setUser(null)
        setStats(null)

        // Redirecionar apenas se nÃ£o estiver em pÃ¡ginas pÃºblicas e nÃ£o estiver jÃ¡ redirecionando
        const publicPaths = ['/login', '/forgot-password', '/reset-password']
        const isPublicPath = publicPaths.some(path => window.location.pathname.includes(path))

        if (
          typeof window !== 'undefined' &&
          !isPublicPath &&
          !isRedirecting
        ) {
          console.log('[SuperAdminAuth] ðŸ”„ Redirecionando para login...')
          setIsRedirecting(true)
          setTimeout(() => {
            window.location.href = '/super-admin/login'
          }, 100)
        }
      }

      throw new Error(errorData.error || 'Erro na requisiÃ§Ã£o')
    }

    const data = await response.json()
    console.log('[SuperAdminAuth] âœ… Sucesso! Dados recebidos:', Object.keys(data))
    return data
  }

  // FunÃ§Ã£o de login
  const login = async (email: string, password: string) => {
    try {
      console.log('[SuperAdminAuth] ====== LOGIN INICIADO ======')
      console.log('[SuperAdminAuth] Email:', email)

      setLoading(true)
      setError(null)
      setIsRedirecting(false)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
      const loginUrl = `${apiUrl}/super-admin/login`

      console.log('[SuperAdminAuth] URL de login:', loginUrl)

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // âœ… CRÃTICO: Receber cookies
        body: JSON.stringify({ email, password })
      })

      console.log('[SuperAdminAuth] Resposta do login:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log('[SuperAdminAuth] âŒ Erro no login:', errorData)
        throw new Error(errorData.error || 'Erro no login')
      }

      const data = await response.json()
      console.log('[SuperAdminAuth] âœ… Login bem-sucedido! UsuÃ¡rio:', data.user?.email)
      console.log('[SuperAdminAuth] Cookies apÃ³s login:', document.cookie ? 'EXISTEM' : 'VAZIO')

      // âœ… SEGURANÃ‡A: Token agora vem em cookie httpOnly, nÃ£o em JSON
      // Atualizar estado com dados do login (jÃ¡ vÃªm na resposta)
      setUser(data.user)
      setStats(data.stats || null)

      // NÃ£o chamar refreshUserData() aqui - dados jÃ¡ vieram no login
      // O refreshUserData() serÃ¡ chamado pelo checkAuth() ao montar o dashboard

      console.log('[SuperAdminAuth] ðŸ”„ Redirecionando para dashboard...')
      router.push('/super-admin')
    } catch (err) {
      console.error('[SuperAdminAuth] ðŸ’¥ Erro no login:', err)
      setError(err instanceof Error ? err.message : 'Erro no login')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // FunÃ§Ã£o de logout
  const logout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // âœ… SEGURANÃ‡A: Chamar endpoint de logout para limpar cookie httpOnly
      await fetch(`${apiUrl}/super-admin/logout`, {
        method: 'POST',
        credentials: 'include',
      }).catch(() => {
        // Ignorar erro - vamos limpar localmente de qualquer forma
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setUser(null)
      setStats(null)
      router.push('/super-admin/login')
    }
  }

  // FunÃ§Ã£o para atualizar dados do usuÃ¡rio
  const refreshUserData = async (): Promise<boolean> => {
    try {
      console.log('[SuperAdminAuth] ====== REFRESH USER DATA ======')
      const response = await apiRequest('/super-admin/auth/me')
      console.log('[SuperAdminAuth] Dados atualizados:', response.user?.email)
      setUser(response.user)
      setStats(response.stats || null)
      return true
    } catch (err) {
      console.log('[SuperAdminAuth] Erro ao atualizar dados:', err instanceof Error ? err.message : 'Unknown')
      const expectedAuthMessages = [
        'Token não fornecido',
        'Authentication failed',
        'Não autenticado',
        'Token de acesso necessário',
      ]
      const isExpectedAuthError =
        err instanceof Error &&
        expectedAuthMessages.some((message) => err.message.includes(message))

      if (err instanceof Error && !isExpectedAuthError) {
        console.error('[SuperAdminAuth] Erro inesperado ao atualizar dados:', err)
      }

      if (isExpectedAuthError) {
        console.log('[SuperAdminAuth] Limpando estado por falta de token')
        setUser(null)
        setStats(null)
      }
      return false
    }
  }

  // FunÃ§Ã£o para verificar autenticaÃ§Ã£o ao carregar
  const checkAuth = async () => {
    try {
      // âœ… Tentar carregar dados do usuÃ¡rio (o cookie httpOnly serÃ¡ enviado automaticamente)
      await refreshUserData()
    } catch (err) {
      // Silenciar erro 401/token - comportamento esperado para usuÃ¡rios nÃ£o autenticados
      // Erro 401 jÃ¡ Ã© tratado no apiRequest, que limpa o estado
    } finally {
      setLoading(false)
    }
  }

  // Hook para verificar autenticaÃ§Ã£o ao montar o componente
  useEffect(() => {
    checkAuth()
  }, [])

  const value: SuperAdminAuthContextType = {
    user,
    stats,
    login,
    apiRequest,
    logout,
    loading,
    error,
    refreshUser: refreshUserData
  }

  return (
    <SuperAdminAuthContext.Provider value={value}>
      {children}
    </SuperAdminAuthContext.Provider>
  )
}

// Hook personalizado para usar o contexto
export function useSuperAdminAuth() {
  const context = useContext(SuperAdminAuthContext)
  if (context === undefined) {
    throw new Error('useSuperAdminAuth deve ser usado dentro de um SuperAdminAuthProvider')
  }
  return context
}
