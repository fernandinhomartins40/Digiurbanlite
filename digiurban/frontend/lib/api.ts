import { getApiUrl } from './api-config'

const API_BASE_URL = getApiUrl()

interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // ✅ NOTA: Não é mais necessário enviar Authorization header
    // O JWT é enviado automaticamente via httpOnly cookie (mais seguro)
    // Fallback mantido apenas para retrocompatibilidade temporária
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('digiurban_super_admin_token') || localStorage.getItem('digiurban_admin_token')
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    return headers
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`)

      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null) {
            url.searchParams.append(key, String(params[key]))
          }
        })
      }

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
        credentials: 'include', // ✅ Enviar cookies httpOnly
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.message || 'Erro na requisição' }
      }

      return { data }
    } catch (error) {
      return { error: 'Erro de conexão' }
    }
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // ✅ Enviar cookies httpOnly
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.message || 'Erro na requisição' }
      }

      return { data }
    } catch (error) {
      return { error: 'Erro de conexão' }
    }
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // ✅ Enviar cookies httpOnly
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.message || 'Erro na requisição' }
      }

      return { data }
    } catch (error) {
      return { error: 'Erro de conexão' }
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        credentials: 'include', // ✅ Enviar cookies httpOnly
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.message || 'Erro na requisição' }
      }

      return { data }
    } catch (error) {
      return { error: 'Erro de conexão' }
    }
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include', // ✅ Enviar cookies httpOnly
      })

      const data = await response.json()

      if (!response.ok) {
        return { error: data.message || 'Erro na requisição' }
      }

      return { data }
    } catch (error) {
      return { error: 'Erro de conexão' }
    }
  }
}

export const apiClient = new ApiClient()

// ✅ SOLUÇÃO PROFISSIONAL: Extrair tenant ID do JWT (fonte única da verdade)
function getTenantFromToken(token: string | null): string | null {
  if (!token) return null

  try {
    // JWT format: header.payload.signature
    const payload = token.split('.')[1]
    if (!payload) return null

    const decoded = JSON.parse(atob(payload))
    return decoded.tenantId || null
  } catch {
    return null
  }
}

// Helper function for backward compatibility
export async function apiRequest(endpoint: string, options?: RequestInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  }

  if (typeof window !== 'undefined') {
    // Tentar buscar token do super admin primeiro, depois admin normal
    const token = localStorage.getItem('digiurban_super_admin_token') || localStorage.getItem('digiurban_admin_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`

      // ✅ PROFISSIONAL: Extrair tenant do JWT ao invés de localStorage separado
      const tenantId = getTenantFromToken(token)
      if (tenantId) {
        headers['X-Tenant-ID'] = tenantId
      }
    }
  }

  // Build the full URL
  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Necessário para enviar cookies httpOnly
  })

  return response.json()
}

export default apiClient