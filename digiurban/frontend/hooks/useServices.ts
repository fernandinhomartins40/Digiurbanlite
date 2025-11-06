import { useState, useEffect } from 'react'
import { api } from '@/lib/services/api'

export interface Department {
  id: string
  name: string
  code?: string
}

export interface Service {
  id: string
  name: string
  description: string | null
  category: string | null
  departmentId: string
  department: Department
  requiresDocuments: boolean
  estimatedDays: number | null
  priority: number
  isActive: boolean
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.get('/services')

      if (response.data.success && response.data.data) {
        setServices(response.data.data)
      } else {
        setError('Erro ao carregar serviços')
      }
    } catch (err) {
      console.error('Erro ao buscar serviços:', err)
      setError('Erro ao carregar serviços')
    } finally {
      setLoading(false)
    }
  }

  const getServiceById = (serviceId: string): Service | undefined => {
    return services.find(s => s.id === serviceId)
  }

  const getDepartmentByServiceId = (serviceId: string): Department | undefined => {
    const service = getServiceById(serviceId)
    return service?.department
  }

  return {
    services,
    loading,
    error,
    fetchServices,
    getServiceById,
    getDepartmentByServiceId,
  }
}
