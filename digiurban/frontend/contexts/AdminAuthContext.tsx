'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getFullApiUrl } from '@/lib/api-config'
import { ROLE_HIERARCHY, ROLE_DISPLAY_NAMES, type UserRoleType } from '@/types/roles'

// ✅ Type exportado agora vem do arquivo centralizado
export type UserRole = UserRoleType

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
  // ✅ NOVO: Múltiplos departamentos
  departments?: Array<{
    id: string
    name: string
    code: string
    description?: string
  }>
  primaryDepartment?: {
    id: string
    name: string
    code: string
    description?: string
  }
  // Dados do servidor público
  telefone?: string
  telefoneSecundario?: string
  cpf?: string
  rg?: string
  matricula?: string
  cargoEfetivo?: string
  dataAdmissao?: string
  situacaoFuncional?: string
  userDepartments?: Array<{
    id: string
    departmentId: string
    isPrimary: boolean
    isActive: boolean
    department: {
      id: string
      name: string
      code: string
      description?: string
    }
  }>
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
  unreadMessages?: number
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

type RequestError = Error & {
  status?: number
  code?: string | null
}

function createRequestError(message: string, status?: number, code?: string | null): RequestError {
  const error = new Error(message) as RequestError
  error.status = status
  error.code = code
  return error
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [stats, setStats] = useState<AdminAuthStats | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  const fetchCurrentUserData = useCallback(async () => {
    const response = await fetch(getFullApiUrl('/admin/auth/me'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      cache: 'no-store'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'Erro desconhecido',
        message: 'Erro desconhecido',
        code: null
      }))

      throw createRequestError(
        errorData.message || errorData.error || 'Erro na requisição',
        response.status,
        errorData.code ?? null
      )
    }

    const result = await response.json()
    return result.data || result
  }, [])

  // Função para fazer requisições autenticadas
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    // ✅ CORRIGIDO: TenantId não é mais necessário no header
    // O backend extrai automaticamente do JWT cookie

    // ✅ CORREÇÃO: Não adicionar Content-Type se body for FormData
    // O browser define automaticamente multipart/form-data com boundary
    const isFormData = options.body instanceof FormData;

    if (isFormData) {
      console.log('📎 [AUTH CONTEXT] Detectado FormData - Content-Type será definido pelo browser');
    }

    const headers = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      // Não precisa enviar X-Tenant-ID - backend extrai do JWT cookie
      ...options.headers
    }

    // ✅ Usar getFullApiUrl (já faz a limpeza de /api duplicado internamente)
    const url = getFullApiUrl(endpoint);

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Enviar cookies automaticamente
      cache: options.cache ?? 'no-store'
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido', code: null }))
      const requestError = createRequestError(
        errorData.message || errorData.error || 'Erro na requisição',
        response.status,
        errorData.code ?? null
      )

      // Se 401, token expirado ou inválido (cookie será limpo pelo backend)
      if (response.status === 401) {
        console.log('[Auth] 401 recebido, limpando autenticação...')
        setUser(null)
        setStats(null)
        setPermissions([])

        // NÃO redirecionar aqui - deixar o AdminLayout fazer isso
        // Isso evita múltiplos redirects e erros 301

        throw createRequestError(
          errorData.code === 'TOKEN_EXPIRED' ? 'Token expirado' : 'Não autenticado',
          response.status,
          errorData.code ?? null
        )
      }

      throw requestError
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
        cache: 'no-store'
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

      // O login retorna usuário e permissões, mas as estatísticas confiáveis
      // vêm de /admin/auth/me; sincronizamos antes da navegação.

      try {
        const currentUserData = await fetchCurrentUserData()
        setUser(currentUserData.user)
        setPermissions(currentUserData.permissions || data.permissions || [])
        setStats(currentUserData.stats || null)
      } catch (refreshError) {
        console.warn('[Auth] Login concluído, mas a sincronização inicial de /me falhou:', refreshError)
      }

      router.replace('/admin/dashboard')
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
      const data = await fetchCurrentUserData()
      setUser(data.user)
      setStats(data.stats)
      setPermissions(data.permissions || [])
      return true
    } catch (err) {
      if ((err as RequestError)?.status === 401) {
        setUser(null)
        setStats(null)
        setPermissions([])
        return false
      }

      if (err instanceof Error) {
        const normalizedMessage = err.message
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()

        const isExpectedAuthError =
          normalizedMessage.includes('authentication failed') ||
          normalizedMessage.includes('autenticado') ||
          normalizedMessage.includes('token nao fornecido') ||
          normalizedMessage.includes('nao autenticado')

        if (!isExpectedAuthError) {
          console.error('Erro ao atualizar dados do usuário:', err)
        }
      }

      return false
    }
  }, [fetchCurrentUserData])

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
  // CRITICAL FIX: Executar apenas uma vez, não observar dependências
  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // ✅ Usando ROLE_HIERARCHY centralizado
  const hasMinRole = (minRole: UserRole) => {
    const userLevel = ROLE_HIERARCHY[user?.role as keyof typeof ROLE_HIERARCHY] ?? 0
    const requiredLevel = ROLE_HIERARCHY[minRole as keyof typeof ROLE_HIERARCHY] ?? 999
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
