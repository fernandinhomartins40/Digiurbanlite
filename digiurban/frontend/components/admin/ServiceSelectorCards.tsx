'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Loader2,
  FileText,
  Building2,
  Clock,
  CheckCircle,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertCircle,
  FolderOpen
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/services/api'
import { cn } from '@/lib/utils'

interface Service {
  id: string
  name: string
  description: string | null
  category: string | null
  departmentId: string
  department: {
    id: string
    name: string
    code?: string
  }
  requiresDocuments: boolean
  estimatedDays: number | null
  priority: number
  isActive: boolean
  icon?: string | null
  color?: string | null
  serviceType?: string
}

interface ServiceGroup {
  department: {
    id: string
    name: string
    code?: string
  }
  services: Service[]
}

interface ServiceSelectorCardsProps {
  selectedService: Service | null
  onSelectService: (service: Service) => void
  onRemoveService: () => void
}

export function ServiceSelectorCards({
  selectedService,
  onSelectService,
  onRemoveService
}: ServiceSelectorCardsProps) {
  // Estados
  const [searchTerm, setSearchTerm] = useState('')
  const [allServices, setAllServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Ref para debounce
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Carregar todos os serviços ao montar
  useEffect(() => {
    loadAllServices()
  }, [])

  const loadAllServices = async () => {
    setLoading(true)
    try {
      const response = await api.get('/services?isActive=true&limit=500')
      if (response.data.success && response.data.data) {
        const services = Array.isArray(response.data.data) ? response.data.data : []
        setAllServices(services)
        // Expandir todos os grupos por padrão
        const deptIds = new Set<string>(services.map((s: Service) => s.department.id))
        setExpandedGroups(deptIds)
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error)
      toast.error('Erro ao carregar lista de serviços')
    } finally {
      setLoading(false)
    }
  }

  // Agrupar serviços por departamento
  const serviceGroups = useMemo((): ServiceGroup[] => {
    const groups = new Map<string, ServiceGroup>()

    allServices.forEach(service => {
      const deptId = service.department.id
      if (!groups.has(deptId)) {
        groups.set(deptId, {
          department: service.department,
          services: []
        })
      }
      groups.get(deptId)!.services.push(service)
    })

    // Ordenar grupos por nome do departamento
    return Array.from(groups.values()).sort((a, b) =>
      a.department.name.localeCompare(b.department.name)
    )
  }, [allServices])

  // Filtrar serviços baseado na busca e departamento selecionado
  const filteredGroups = useMemo((): ServiceGroup[] => {
    let filtered = serviceGroups

    // Filtrar por departamento selecionado
    if (selectedDepartment) {
      filtered = filtered.filter(g => g.department.id === selectedDepartment)
    }

    // Filtrar por termo de busca
    if (searchTerm.trim().length >= 2) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.map(group => ({
        ...group,
        services: group.services.filter(service =>
          service.name.toLowerCase().includes(term) ||
          (service.description?.toLowerCase().includes(term)) ||
          (service.category?.toLowerCase().includes(term))
        )
      })).filter(group => group.services.length > 0)
    }

    return filtered
  }, [serviceGroups, selectedDepartment, searchTerm])

  // Lista única de departamentos para filtro
  const departments = useMemo(() => {
    return serviceGroups.map(g => g.department)
  }, [serviceGroups])

  // Total de serviços filtrados
  const totalFilteredServices = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.services.length, 0)
  }, [filteredGroups])

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }
    if (value.length >= 2) {
      setSearching(true)
      searchTimerRef.current = setTimeout(() => {
        setSearching(false)
      }, 300)
    }
  }

  const handleSelectDepartment = (deptId: string | null) => {
    setSelectedDepartment(prev => prev === deptId ? null : deptId)
  }

  const toggleGroup = (deptId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(deptId)) {
        newSet.delete(deptId)
      } else {
        newSet.add(deptId)
      }
      return newSet
    })
  }

  const handleSelectService = (service: Service) => {
    onSelectService(service)
    toast.success(`Serviço selecionado: ${service.name}`)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedDepartment(null)
  }

  // Se já tem serviço selecionado, mostrar card de confirmação
  if (selectedService) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-green-900">
              <CheckCircle className="h-5 w-5 mr-2" />
              Serviço Selecionado
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemoveService}
              className="text-green-700 hover:text-green-900 hover:bg-green-100"
            >
              Alterar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div>
              <p className="font-medium text-lg text-green-900">{selectedService.name}</p>
              <p className="text-sm text-green-700 flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {selectedService.department.name}
              </p>
            </div>
            {selectedService.description && (
              <p className="text-sm text-green-700">{selectedService.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedService.estimatedDays && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Clock className="h-3 w-3 mr-1" />
                  Prazo: {selectedService.estimatedDays} dias
                </Badge>
              )}
              {selectedService.requiresDocuments && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                  <FileText className="h-3 w-3 mr-1" />
                  Requer documentos
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Interface de seleção de serviços
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Sparkles className="h-5 w-5" />
          Selecionar Serviço
        </CardTitle>
        <CardDescription className="text-blue-700">
          Busque ou navegue pelos serviços disponíveis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Campo de Busca */}
        <div className="relative">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Digite para buscar serviços..."
            className="bg-white pr-10 pl-10"
            autoComplete="off"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            ) : searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filtros por Departamento */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 flex items-center gap-1">
              <Filter className="h-4 w-4" />
              Filtrar por Secretaria
            </span>
            {(selectedDepartment || searchTerm) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Limpar filtros
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {departments.map(dept => (
              <Badge
                key={dept.id}
                variant={selectedDepartment === dept.id ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all hover:scale-105",
                  selectedDepartment === dept.id
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white text-blue-700 border-blue-300 hover:bg-blue-50"
                )}
                onClick={() => handleSelectDepartment(dept.id)}
              >
                {dept.name}
                <span className="ml-1 opacity-70">
                  ({serviceGroups.find(g => g.department.id === dept.id)?.services.length || 0})
                </span>
              </Badge>
            ))}
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="text-sm text-blue-700 flex items-center justify-between">
          <span>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando serviços...
              </span>
            ) : (
              <>
                <span className="font-semibold">{totalFilteredServices}</span> serviço(s) encontrado(s)
              </>
            )}
          </span>
          {!loading && filteredGroups.length > 1 && (
            <button
              type="button"
              onClick={() => {
                if (expandedGroups.size === filteredGroups.length) {
                  setExpandedGroups(new Set())
                } else {
                  setExpandedGroups(new Set(filteredGroups.map(g => g.department.id)))
                }
              }}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {expandedGroups.size === filteredGroups.length ? 'Recolher todos' : 'Expandir todos'}
            </button>
          )}
        </div>

        {/* Lista de Serviços Agrupados */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8 text-blue-700">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum serviço encontrado</p>
            {(searchTerm || selectedDepartment) && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:underline mt-2"
              >
                Limpar filtros e mostrar todos
              </button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {filteredGroups.map(group => (
                <div key={group.department.id} className="bg-white rounded-lg border border-blue-100 overflow-hidden">
                  {/* Header do Grupo (Departamento) */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.department.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-900">{group.department.name}</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                        {group.services.length}
                      </Badge>
                    </div>
                    {expandedGroups.has(group.department.id) ? (
                      <ChevronUp className="h-4 w-4 text-blue-600" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-blue-600" />
                    )}
                  </button>

                  {/* Cards de Serviços */}
                  {expandedGroups.has(group.department.id) && (
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.services.map(service => (
                        <ServiceCard
                          key={service.id}
                          service={service}
                          onSelect={() => handleSelectService(service)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}

// Componente de Card de Serviço
interface ServiceCardProps {
  service: Service
  onSelect: () => void
}

function ServiceCard({ service, onSelect }: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left p-3 rounded-lg border transition-all",
        "bg-white hover:bg-blue-50 hover:border-blue-300 hover:shadow-md",
        "border-gray-200 group"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Ícone do Serviço */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
          "bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-colors"
        )}>
          <FileText className="h-5 w-5" />
        </div>

        {/* Informações do Serviço */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm truncate group-hover:text-blue-900">
            {service.name}
          </h4>

          {service.description && (
            <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
              {service.description}
            </p>
          )}

          {/* Badges de informação */}
          <div className="flex flex-wrap gap-1 mt-2">
            {service.estimatedDays && (
              <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                <Clock className="h-3 w-3 mr-1" />
                {service.estimatedDays}d
              </span>
            )}
            {service.requiresDocuments && (
              <span className="inline-flex items-center text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                <FileText className="h-3 w-3 mr-1" />
                Docs
              </span>
            )}
            {service.category && (
              <span className="inline-flex items-center text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                <FolderOpen className="h-3 w-3 mr-1" />
                {service.category}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
