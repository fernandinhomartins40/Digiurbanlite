import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface Protocol {
  id: string
  number: string
  title: string
  status: string
  latitude: number
  longitude: number
  address?: string
  locationType?: string
  geocodingPrecision?: string
  createdAt: string
  service?: { name: string; category: string }
  department?: { name: string }
  citizen?: { name: string }
}

const getAuthConfig = () => {
  const tenant = 'cmhav73z00000cblg3uhyri24' // Single Tenant

  return {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenant,
    },
    withCredentials: true // httpOnly cookies são enviados automaticamente
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
      `${API_URL}/admin/gabinete/mapa-demandas/protocols?${params.toString()}`,
      getAuthConfig()
    )
    return response.data
  },

  async getStats() {
    const response = await axios.get(
      `${API_URL}/admin/gabinete/mapa-demandas/stats`,
      getAuthConfig()
    )
    return response.data
  }
}
