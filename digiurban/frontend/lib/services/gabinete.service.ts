import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface AgendaEvent {
  id?: string
  tipo: string
  titulo: string
  descricao?: string
  dataHoraInicio: Date | string
  dataHoraFim: Date | string
  local?: string
  participantes?: string
  status?: string
  observacoes?: string
  anexos?: string[]
}

interface Protocol {
  id: string
  number: string
  title: string
  status: string
  latitude: number
  longitude: number
  endereco?: string
  createdAt: string
  service?: { name: string; category: string }
  department?: { name: string }
  citizen?: { name: string }
}

const getAuthConfig = () => {
  const token = localStorage.getItem('digiurban_admin_token')
  const tenant = typeof window !== 'undefined' && window.location.hostname.split('.')[0] !== 'localhost'
    ? window.location.hostname.split('.')[0]
    : 'demo'

  return {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenant,
      ...(token && { Authorization: `Bearer ${token}` })
    },
    withCredentials: true // Necessário para enviar cookies httpOnly
  }
}

// ============================================
// AGENDA EXECUTIVA
// ============================================

export const agendaService = {
  async getEvents(filters?: { startDate?: string; endDate?: string; tipo?: string; status?: string }) {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.tipo) params.append('tipo', filters.tipo)
    if (filters?.status) params.append('status', filters.status)

    const response = await axios.get(
      `${API_URL}/api/admin/gabinete/agenda?${params.toString()}`,
      getAuthConfig()
    )
    return response.data
  },

  async getEventById(id: string) {
    const response = await axios.get(
      `${API_URL}/api/admin/gabinete/agenda/${id}`,
      getAuthConfig()
    )
    return response.data
  },

  async createEvent(data: AgendaEvent) {
    const response = await axios.post(
      `${API_URL}/api/admin/gabinete/agenda`,
      data,
      getAuthConfig()
    )
    return response.data
  },

  async updateEvent(id: string, data: Partial<AgendaEvent>) {
    const response = await axios.put(
      `${API_URL}/api/admin/gabinete/agenda/${id}`,
      data,
      getAuthConfig()
    )
    return response.data
  },

  async deleteEvent(id: string) {
    const response = await axios.delete(
      `${API_URL}/api/admin/gabinete/agenda/${id}`,
      getAuthConfig()
    )
    return response.data
  },

  async markAsRealized(id: string) {
    const response = await axios.patch(
      `${API_URL}/api/admin/gabinete/agenda/${id}/realize`,
      {},
      getAuthConfig()
    )
    return response.data
  }
}

// ============================================
// MAPA DE DEMANDAS
// ============================================

export const mapaDemandasService = {
  async getProtocolsWithLocation(filters?: { categoria?: string; status?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams()
    if (filters?.categoria) params.append('categoria', filters.categoria)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)

    const response = await axios.get<{ success: boolean; data: Protocol[] }>(
      `${API_URL}/api/admin/gabinete/mapa-demandas/protocols?${params.toString()}`,
      getAuthConfig()
    )
    return response.data
  },

  async getStats() {
    const response = await axios.get(
      `${API_URL}/api/admin/gabinete/mapa-demandas/stats`,
      getAuthConfig()
    )
    return response.data
  }
}
