import { getApiUrl } from './api-config'

const API_BASE_URL = getApiUrl()

interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
}

function getErrorMessage(data: unknown): string {
  if (data && typeof data === 'object') {
    const message = 'message' in data && typeof data.message === 'string' ? data.message : null
    const error = 'error' in data && typeof data.error === 'string' ? data.error : null
    return message || error || 'Erro na requisição'
  }

  return 'Erro na requisição'
}

async function parseJsonResponse(response: Response): Promise<any> {
  const text = await response.text()
  if (!text) return undefined

  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
    }
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
        credentials: 'include',
      })

      const data = await parseJsonResponse(response)

      if (!response.ok) {
        return { error: getErrorMessage(data) }
      }

      return { data }
    } catch {
      return { error: 'Erro de conexão' }
    }
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      })

      const data = await parseJsonResponse(response)

      if (!response.ok) {
        return { error: getErrorMessage(data) }
      }

      return { data }
    } catch {
      return { error: 'Erro de conexão' }
    }
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      })

      const data = await parseJsonResponse(response)

      if (!response.ok) {
        return { error: getErrorMessage(data) }
      }

      return { data }
    } catch {
      return { error: 'Erro de conexão' }
    }
  }

  async delete<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      })

      const data = await parseJsonResponse(response)

      if (!response.ok) {
        return { error: getErrorMessage(data) }
      }

      return { data }
    } catch {
      return { error: 'Erro de conexão' }
    }
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
      })

      const data = await parseJsonResponse(response)

      if (!response.ok) {
        return { error: getErrorMessage(data) }
      }

      return { data }
    } catch {
      return { error: 'Erro de conexão' }
    }
  }
}

export const apiClient = new ApiClient()

export async function apiRequest(endpoint: string, options?: RequestInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  }

  const url = `${API_BASE_URL}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })

  return response.json()
}
export default apiClient
