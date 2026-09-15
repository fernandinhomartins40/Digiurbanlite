'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

/**
 * IDENTIDADE DE PLATAFORMA (corrigido 2026-09-15 — achado A6 da auditoria)
 *
 * Este painel é o console da PLATAFORMA: gerencia municípios, billing e planos.
 * Antes ele validava a sessão em `/super-admin/auth/me`, rota guardada por
 * `adminAuthMiddleware` — ou seja, pelo cookie MUNICIPAL (digiurban_admin_token)
 * e pelo role SUPER_ADMIN de `User`, que por definição pertence a UM município.
 * Resultado: o operador entrava no console da plataforma com identidade de
 * administrador de município — a confusão de papel relatada.
 *
 * Agora a sessão é validada contra `/api/platform/auth/me` (PlatformUser, cookie
 * digiurban_platform_token). O PlatformUser é "sem tenantId por design"
 * (schema.prisma, model PlatformUser) e é quem de fato controla todos os
 * municípios. As páginas do painel já consumiam `/api/platform/*` — só a guarda
 * de sessão continuava no caminho antigo.
 *
 * A ponte de identidade do login (super-admin.ts) permanece: o operador faz UM
 * login e recebe os dois cookies. Nada de segundo login.
 */
export interface PlatformUser {
  id: string
  name: string
  email: string
  role: 'PLATFORM_ADMIN' | 'PLATFORM_SUPPORT'
  mustChangePassword?: boolean
}

/** @deprecated Use PlatformUser — mantido para não quebrar imports existentes. */
export type SuperAdminUser = PlatformUser

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

        // Redirecionar apenas se não estiver em páginas públicas e não estiver já redirecionando
        const publicPaths = ['/login', '/forgot-password', '/reset-password']
        const isPublicPath = publicPaths.some(path => window.location.pathname.includes(path))

        if (
          typeof window !== 'undefined' &&
          !isPublicPath &&
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
      //
      // IDENTIDADE (corrigido 2026-09-15): `data.user` é o User MUNICIPAL
      // (role SUPER_ADMIN, preso a um tenant) devolvido por /super-admin/login.
      // Guardá-lo aqui reintroduziria a confusão de papel logo após o login.
      // O mesmo login já emite o cookie digiurban_platform_token (ponte de
      // identidade em super-admin.ts), então buscamos a identidade de PLATAFORMA
      // — a que este painel de fato representa.
      const okPlatform = await refreshUserData()
      if (!okPlatform) {
        // Sem identidade de plataforma o painel não deve abrir: seria um
        // SUPER_ADMIN municipal entrando no console da plataforma (achado R2).
        throw new Error(
          'Login válido, mas sem identidade de operador de plataforma. ' +
            'Verifique se este usuário é PlatformUser.'
        )
      }

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
      // Identidade de PLATAFORMA (ver comentário no topo do arquivo). A resposta
      // vem como { success, platformUser } — formato de /api/platform/auth/me,
      // diferente do { user, stats } da rota municipal antiga.
      const response = await apiRequest('/platform/auth/me')
      const platformUser = response.platformUser ?? response.user ?? null
      console.log('[SuperAdminAuth] Operador de plataforma:', platformUser?.email)
      setUser(platformUser)
      // `stats` não existe em /api/platform/auth/me — as páginas do painel
      // buscam seus próprios dados em /api/platform/*.
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
