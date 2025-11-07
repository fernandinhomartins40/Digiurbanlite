import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar tenant-id (httpOnly cookies são enviados automaticamente)
api.interceptors.request.use((config) => {
  // ✅ httpOnly cookies são enviados automaticamente pelo navegador
  // Não é necessário adicionar Authorization header manualmente

  // Enviar cookies automaticamente (necessário para httpOnly)
  config.withCredentials = true

  try {
    // Buscar tenantId do localStorage (Single Tenant: sempre o mesmo)
    const tenantId = localStorage.getItem('digiurban_tenant_id') || 'cmhav73z00000cblg3uhyri24'
    config.headers['X-Tenant-ID'] = tenantId
  } catch (error) {
    // SSR context - usar tenant default
    config.headers['X-Tenant-ID'] = 'cmhav73z00000cblg3uhyri24'
  }

  return config
})

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[API] Erro 401 - Não autorizado:', error.config?.url)

      // httpOnly cookie foi rejeitado ou expirou
      // O backend já limpou o cookie, apenas redirecionar
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login'
      }
    }
    return Promise.reject(error)
  }
)

// Helper para CRUD genérico
export const createCRUDService = (basePath: string) => ({
  list: (params?: any) => api.get(basePath, { params }),
  get: (id: string) => api.get(`${basePath}/${id}`),
  create: (data: any) => api.post(basePath, data),
  update: (id: string, data: any) => api.put(`${basePath}/${id}`, data),
  delete: (id: string) => api.delete(`${basePath}/${id}`),
})
