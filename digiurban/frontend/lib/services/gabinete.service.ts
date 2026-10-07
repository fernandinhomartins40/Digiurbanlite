/**
 * Mapa dos pedidos (/api/map): o servidor vê o que pode ver (a secretaria dele,
 * ou os pedidos com ele); o Gabinete do Prefeito vê o município todo.
 * Antes este arquivo mandava um código de município fixo em toda chamada.
 */

export interface MapProtocol {
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
  overdue?: boolean
  service?: { name: string; category: string }
  department?: { id?: string; name: string }
}

export interface MapFilters {
  situacao?: 'todos' | 'abertos' | 'atrasados'
  departmentId?: string
  from?: string
  to?: string
}

function query(filters: MapFilters = {}) {
  const params = new URLSearchParams()
  if (filters.situacao && filters.situacao !== 'todos') params.append('situacao', filters.situacao)
  if (filters.departmentId) params.append('departmentId', filters.departmentId)
  if (filters.from) params.append('from', filters.from)
  if (filters.to) params.append('to', filters.to)
  return params.toString()
}

async function get(path: string) {
  const response = await fetch(`/api${path}`, { credentials: 'include' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.success === false) throw new Error(data?.error || 'Não foi possível carregar o mapa')
  return data
}

export const mapaDemandasService = {
  async getProtocolsWithLocation(filters?: MapFilters) {
    return get(`/map/protocols?${query(filters)}`) as Promise<{ success: boolean; data: MapProtocol[]; meta: { shown: number; limit: number; withoutLocation: number } }>
  },

  async getStats(filters?: MapFilters) {
    return get(`/map/stats?${query(filters)}`) as Promise<{
      success: boolean
      data: { totalWithLocation: number; byStatus: Array<{ status: string; count: number }>; byDepartment: Array<{ departmentId: string; name: string; count: number }> }
    }>
  },
}
