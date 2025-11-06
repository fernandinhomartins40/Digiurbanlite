'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export type UserRole = 'GUEST' | 'USER' | 'COORDINATOR' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  tenantId?: string
  departmentId?: string
  department?: {
    id: string
    name: string
    code: string
    description?: string
  }
  assignedProtocols?: Array<{
    id: string
    number: string
    status: string
    createdAt: string
  }>
}

export interface AdminAuthStats {
  totalProtocols: number
  pendingProtocols: number
  completedProtocols: number
  pendingCitizens: number
  protocolsByStatus: Array<{
    status: string
    _count: { _all: number }
  }>
}

interface AdminAuthContextType {
  user: AdminUser | null
  stats: AdminAuthStats | null
  permissions: string[]
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
  error: string | null
  refreshUser: () => Promise<boolean>
  apiRequest: (endpoint: string, options?: RequestInit) => Promise<any>
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

interface AdminAuthProviderProps {
  children: ReactNode
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [stats, setStats] = useState<AdminAuthStats | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  // Função para fazer requisições autenticadas
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    // ✅ CORRIGIDO: TenantId não é mais necessário no header
    // O backend extrai automaticamente do JWT cookie

    const headers = {
      'Content-Type': 'application/json',
      // Não precisa enviar X-Tenant-ID - backend extrai do JWT cookie
      ...options.headers
    }

    // ✅ Usar getFullApiUrl e limpar /api duplicado (como SuperAdminContext e CitizenContext)
    const { getFullApiUrl } = await import('@/lib/api-config');
    const cleanEndpoint = endpoint.replace(/^\/api/, '');
    const url = getFullApiUrl(cleanEndpoint);

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Enviar cookies automaticamente
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido', code: null }))

      // Se 401, token expirado ou inválido (cookie será limpo pelo backend)
      if (response.status === 401) {
        console.log('[Auth] 401 recebido, limpando autenticação...')
        setUser(null)
        setStats(null)
        setPermissions([])

        // NÃO redirecionar aqui - deixar o AdminLayout fazer isso
        // Isso evita múltiplos redirects e erros 301

        throw new Error(errorData.code === 'TOKEN_EXPIRED' ? 'Token expirado' : 'Não autenticado')
      }

      throw new Error(errorData.error || 'Erro na requisição')
    }

    return response.json()
  }

  // Função de login
  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      setIsRedirecting(false)

      // ✅ CORRIGIDO: Usar getFullApiUrl para consistência com outros contextos
      const { getFullApiUrl } = await import('@/lib/api-config');
      const loginUrl = getFullApiUrl('/admin/auth/login');

      // Login SEM especificar tenant - backend identifica automaticamente
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // NÃO enviar X-Tenant-ID - backend vai identificar automaticamente
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Incluir cookies
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errorData.message || errorData.error || 'Erro no login')
      }

      const result = await response.json()
      const data = result.data || result

      // ✅ Token JWT (com tenantId) vem via httpOnly cookie
      // Não precisa armazenar nada no localStorage!

      // Atualizar estado com dados do login
      setUser(data.user)
      setPermissions(data.permissions || [])
      setStats(data.stats || null)

      // Não chamar refreshUserData() aqui - dados já vieram no login
      // O refreshUserData() será chamado pelo checkAuth() ao montar o dashboard

      router.push('/admin/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no login')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Função de logout
  const logout = async () => {
    try {
      // Chamar endpoint de logout para limpar cookie httpOnly no backend
      await apiRequest('/admin/auth/logout', { method: 'POST' })
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
    } finally {
      // Limpar estado local (httpOnly cookie é limpo pelo backend)
      setUser(null)
      setStats(null)
      setPermissions([])
      router.push('/admin/login')
    }
  }

  // Função para atualizar dados do usuário
  const refreshUserData = useCallback(async () => {
    try {
      const response = await apiRequest('/admin/auth/me')
      const data = response.data || response
      setUser(data.user)
      setStats(data.stats)
      setPermissions(data.permissions || [])
      return true
    } catch (err) {
      // Silenciar erro 401 (já tratado no apiRequest)
      // Apenas logar outros erros
      if (err instanceof Error && !err.message.includes('Authentication failed') && !err.message.includes('Não autenticado')) {
        console.error('Erro ao atualizar dados do usuário:', err)
      }
      // Não precisamos limpar aqui, apiRequest já fez isso
      return false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Função para verificar autenticação ao carregar
  const checkAuth = useCallback(async () => {
    try {
      // Tentar obter dados do usuário (o cookie será enviado automaticamente)
      await refreshUserData()
    } catch (err) {
      // Erro já tratado no apiRequest
      console.error('Erro na verificação de autenticação:', err)
    } finally {
      setLoading(false)
    }
  }, [refreshUserData])

  // Hook para verificar autenticação ao montar o componente
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const value: AdminAuthContextType = {
    user,
    stats,
    permissions,
    login,
    apiRequest,
    logout,
    loading,
    error,
    refreshUser: refreshUserData
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

// Hook personalizado para usar o contexto
export function useAdminAuth(requiredRole?: string) {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth deve ser usado dentro de um AdminAuthProvider')
  }

  // Se um role específico foi requisitado, verifica (mas não bloqueia, apenas retorna o contexto)
  // A verificação de bloqueio pode ser feita no componente se necessário
  if (requiredRole && context.user?.role !== requiredRole) {
    console.warn(`Acesso requer role '${requiredRole}', mas usuário tem '${context.user?.role}'`)
  }

  return context
}

// Hook para verificar permissões
export function useAdminPermissions() {
  const { permissions, user } = useAdminAuth()

  const hasPermission = (permission: string) => {
    return permissions.includes(permission)
  }

  const hasAnyPermission = (permissionList: string[]) => {
    return permissionList.some(permission => permissions.includes(permission))
  }

  const hasMinRole = (minRole: UserRole) => {
    const roleHierarchy = {
      GUEST: 0,
      USER: 1,
      COORDINATOR: 2,
      MANAGER: 3,
      ADMIN: 4,
      SUPER_ADMIN: 5
    }
    const userLevel = roleHierarchy[user?.role as UserRole] ?? 0
    const requiredLevel = roleHierarchy[minRole] ?? 999
    return userLevel >= requiredLevel
  }

  const isSuperAdmin = () => user?.role === 'SUPER_ADMIN'
  const isAdmin = () => hasMinRole('ADMIN')
  const isManager = () => hasMinRole('MANAGER')
  const isCoordinator = () => hasMinRole('COORDINATOR')
  const isUser = () => hasMinRole('USER')
  const isGuest = () => user?.role === 'GUEST'

  return {
    hasPermission,
    hasAnyPermission,
    hasMinRole,
    isSuperAdmin,
    isAdmin,
    isManager,
    isCoordinator,
    isUser,
    isGuest,
    permissions,
    role: user?.role
  }
}