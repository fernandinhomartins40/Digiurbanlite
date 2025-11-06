import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para adicionar token e tenant-id
api.interceptors.request.use((config) => {
  // CORREÇÃO PROFISSIONAL: Sempre buscar o token fresco do localStorage
  // Não usar typeof window check aqui pois o componente já é 'use client'
  try {
    const token = localStorage.getItem('digiurban_admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('[API] Token adicionado ao request:', config.url)
    } else {
      console.warn('[API] Nenhum token encontrado no localStorage para:', config.url)
    }

    // Buscar tenantId do localStorage ou user data
    let tenantId = localStorage.getItem('digiurban_tenant_id')

    // Se não encontrar no localStorage, tentar buscar dos cookies (AdminAuth)
    if (!tenantId) {
      try {
        const userData = localStorage.getItem('digiurban_admin_user')
        if (userData) {
          const user = JSON.parse(userData)
          tenantId = user.tenantId
        }
      } catch (e) {
        console.warn('[API] Erro ao buscar tenantId do user data')
      }
    }

    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId
      console.log('[API] Tenant-ID adicionado:', tenantId)
    } else {
      // Fallback: buscar primeiro tenant do banco
      config.headers['X-Tenant-ID'] = 'cmhav73z00000cblg3uhyri24'
      console.warn('[API] Usando tenant-id default do sistema')
    }
  } catch (error) {
    // SSR context - sem localStorage disponível
    console.log('[API] Contexto SSR - sem localStorage')
    config.headers['X-Tenant-ID'] = 'demo'
  }
  return config
})

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('[API] Erro 401 - Não autorizado:', error.config?.url)

      try {
        // Verificar se realmente não há token ou se o token está inválido
        const token = localStorage.getItem('digiurban_admin_token')
        if (!token) {
          console.error('[API] Nenhum token encontrado - redirecionando para login')
          localStorage.removeItem('digiurban_admin_token')
          window.location.href = '/admin/login'
        } else {
          console.error('[API] Token existe mas foi rejeitado - pode estar expirado')
          localStorage.removeItem('digiurban_admin_token')
          window.location.href = '/admin/login'
        }
      } catch (e) {
        // SSR context
        console.log('[API] Erro 401 em contexto SSR')
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
