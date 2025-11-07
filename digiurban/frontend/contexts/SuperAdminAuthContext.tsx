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

  // ⚠️ NOTA: Não podemos verificar cookies httpOnly via JavaScript
  // O cookie existe, mas é inacessível por document.cookie (por segurança)
  // Vamos confiar na requisição /auth/me para validar a autenticação

  // ✅ SEGURANÇA: Função para fazer requisições autenticadas (usa cookies automáticos)
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    console.log('[SuperAdminAuth] ====== apiRequest DEBUG ======')
    console.log('[SuperAdminAuth] Endpoint solicitado:', endpoint)

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    // Usar getFullApiUrl para construir URL correta
    const { getFullApiUrl } = await import('@/lib/api-config')
    // Remove /api do endpoint se já estiver presente pois getFullApiUrl já adiciona
    const cleanEndpoint = endpoint.replace(/^\/api/, '')
    const url = getFullApiUrl(cleanEndpoint)

    console.log('[SuperAdminAuth] URL construída:', url)
    console.log('[SuperAdminAuth] Headers:', headers)
    console.log('[SuperAdminAuth] Cookies do navegador:', document.cookie ? 'EXISTEM' : 'VAZIO')

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // ✅ CRÍTICO: Enviar cookies automaticamente
    })

    console.log('[SuperAdminAuth] Resposta recebida:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido', code: null }))
      console.log('[SuperAdminAuth] ❌ Erro na resposta:', errorData)

      // Se token expirado ou inválido (401), limpar autenticação
      if (response.status === 401) {
        console.log('[SuperAdminAuth] 🔒 Status 401 - Limpando autenticação')
        setUser(null)
        setStats(null)

        // Redirecionar apenas se não estiver na página de login e não estiver já redirecionando
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login') &&
          !isRedirecting
        ) {
          console.log('[SuperAdminAuth] 🔄 Redirecionando para login...')
          setIsRedirecting(true)
          setTimeout(() => {
            window.location.href = '/super-admin/login'
          }, 100)
        }
      }

      throw new Error(errorData.error || 'Erro na requisição')
    }

    const data = await response.json()
    console.log('[SuperAdminAuth] ✅ Sucesso! Dados recebidos:', Object.keys(data))
    return data
  }

  // Função de login
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
        credentials: 'include', // ✅ CRÍTICO: Receber cookies
        body: JSON.stringify({ email, password })
      })

      console.log('[SuperAdminAuth] Resposta do login:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.log('[SuperAdminAuth] ❌ Erro no login:', errorData)
        throw new Error(errorData.error || 'Erro no login')
      }

      const data = await response.json()
      console.log('[SuperAdminAuth] ✅ Login bem-sucedido! Usuário:', data.user?.email)
      console.log('[SuperAdminAuth] Cookies após login:', document.cookie ? 'EXISTEM' : 'VAZIO')

      // ✅ SEGURANÇA: Token agora vem em cookie httpOnly, não em JSON
      // Atualizar estado com dados do login (já vêm na resposta)
      setUser(data.user)
      setStats(data.stats || null)

      // Não chamar refreshUserData() aqui - dados já vieram no login
      // O refreshUserData() será chamado pelo checkAuth() ao montar o dashboard

      console.log('[SuperAdminAuth] 🔄 Redirecionando para dashboard...')
      router.push('/super-admin')
    } catch (err) {
      console.error('[SuperAdminAuth] 💥 Erro no login:', err)
      setError(err instanceof Error ? err.message : 'Erro no login')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Função de logout
  const logout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

      // ✅ SEGURANÇA: Chamar endpoint de logout para limpar cookie httpOnly
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

  // Função para atualizar dados do usuário
  const refreshUserData = async (): Promise<boolean> => {
    try {
      console.log('[SuperAdminAuth] ====== REFRESH USER DATA ======')
      const response = await apiRequest('/super-admin/auth/me')
      console.log('[SuperAdminAuth] ✅ Dados atualizados:', response.user?.email)
      setUser(response.user)
      setStats(response.stats || null)
      return true
    } catch (err) {
      console.log('[SuperAdminAuth] ❌ Erro ao atualizar dados:', err instanceof Error ? err.message : 'Unknown')
      // Silenciar erro 401 (já tratado no apiRequest) e erro de token
      if (err instanceof Error &&
          !err.message.includes('Token não fornecido') &&
          !err.message.includes('Authentication failed') &&
          !err.message.includes('Não autenticado')) {
        console.error('[SuperAdminAuth] Erro inesperado ao atualizar dados:', err)
      }
      // Se erro de token, limpar estado silenciosamente
      if (err instanceof Error && err.message.includes('Token não fornecido')) {
        console.log('[SuperAdminAuth] 🔒 Limpando estado por falta de token')
        setUser(null)
        setStats(null)
      }
      return false
    }
  }

  // Função para verificar autenticação ao carregar
  const checkAuth = async () => {
    try {
      // ✅ Tentar carregar dados do usuário (o cookie httpOnly será enviado automaticamente)
      await refreshUserData()
    } catch (err) {
      // Silenciar erro 401/token - comportamento esperado para usuários não autenticados
      // Erro 401 já é tratado no apiRequest, que limpa o estado
    } finally {
      setLoading(false)
    }
  }

  // Hook para verificar autenticação ao montar o componente
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
