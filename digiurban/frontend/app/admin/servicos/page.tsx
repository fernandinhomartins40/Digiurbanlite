'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useCategorySuggestions } from '@/hooks/useCategorySuggestions'
import { CategorySuggestionModal } from '@/components/admin/CategorySuggestionModal'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Sparkles,
  AlertCircle,
  Tags,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

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
  requiredDocuments?: string[]
  estimatedDays: number | null
  priority: number
  isActive: boolean
  icon?: string | null
  color?: string | null
  createdAt: string
  updatedAt: string
  // ✅ NOVO: Informações de categorização
  categorizationStatus?: 'uncategorized' | 'pending' | 'categorized' | 'auto_categorized'
  pendingSuggestionsCount?: number
  categoriesCount?: number
  matchSuggestions?: Array<{
    id: string
    category: {
      code: string
      name: string
      icon?: string
    }
  }>
  categoryAssignments?: Array<{
    id: string
    category: {
      code: string
      name: string
      icon?: string
    }
  }>
}

interface Department {
  id: string
  name: string
  code?: string
}

export default function ServicesManagementPage() {
  const router = useRouter()
  const { apiRequest, loading: authLoading } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()
  const { toast } = useToast()

  const [services, setServices] = useState<Service[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [showViewDialog, setShowViewDialog] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  // ✅ NOVO: Modal de sugestões de categorização
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)
  const [selectedServiceForSuggestions, setSelectedServiceForSuggestions] = useState<string | null>(null)

  // Hook para re-análise de serviços
  const { analyzeService } = useCategorySuggestions()

  // Carregar serviços
  const loadServices = useCallback(async () => {
    try {
      setLoading(true)
      const response = await apiRequest('/api/services')

      // ✅ CORREÇÃO: Aceitar múltiplos formatos de resposta
      const servicesData = response.data || response.services || []

      console.log('✅ Serviços carregados:', {
        total: servicesData.length,
        responseKeys: Object.keys(response),
        hasData: !!response.data,
        hasServices: !!response.services
      })

      setServices(servicesData)
    } catch (error) {
      console.error('❌ Erro ao carregar serviços:', error)
      toast({
        title: 'Erro ao carregar serviços',
        description: error instanceof Error ? error.message : 'Não foi possível carregar a lista de serviços.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiRequest])

  // Carregar departamentos
  const loadDepartments = useCallback(async () => {
    try {
      const response = await apiRequest('/api/admin/departments')
      setDepartments(response.departments || response.data?.departments || [])
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error)
    }
  }, [apiRequest])


  // Desativar serviço
  const deleteService = async (serviceId: string) => {
    if (!confirm('Tem certeza que deseja desativar este serviço?')) return

    try {
      await apiRequest(`/api/services/${serviceId}`, {
        method: 'DELETE',
      })

      toast({
        title: 'Serviço desativado',
        description: 'O serviço foi desativado com sucesso.',
      })

      await loadServices()
    } catch (error: any) {
      console.error('Erro ao desativar serviço:', error)
      toast({
        title: 'Erro ao desativar serviço',
        description: error?.message || 'Ocorreu um erro ao desativar o serviço.',
        variant: 'destructive',
      })
    }
  }

  // ✅ NOVO: Re-analisar categorização de serviço
  const handleReanalyzeService = async (serviceId: string) => {
    try {
      await analyzeService(serviceId)
      await loadServices()

      // Abrir modal com sugestões
      setSelectedServiceForSuggestions(serviceId)
      setShowSuggestionsModal(true)
    } catch (error) {
      console.error('Erro ao re-analisar serviço:', error)
    }
  }

  // ✅ NOVO: Renderizar badge de status de categorização
  const renderCategorizationStatus = (service: Service) => {
    const status = service.categorizationStatus || 'uncategorized'

    switch (status) {
      case 'auto_categorized':
        return (
          <div className="flex items-center gap-1.5 text-xs text-purple-600">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-medium">{service.categoriesCount} auto</span>
          </div>
        )
      case 'categorized':
        return (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <Tags className="h-3.5 w-3.5" />
            <span className="font-medium">{service.categoriesCount} categoria(s)</span>
          </div>
        )
      case 'pending':
        return (
          <div className="flex items-center gap-1.5 text-xs text-orange-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="font-medium">{service.pendingSuggestionsCount} pendente(s)</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <XCircle className="h-3.5 w-3.5" />
            <span>Sem categoria</span>
          </div>
        )
    }
  }


  useEffect(() => {
    if (!authLoading) {
      loadServices()
      loadDepartments()
    }
  }, [authLoading, loadServices, loadDepartments])

  // Filtros
  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || service.category === categoryFilter
    const matchesDepartment = departmentFilter === 'all' || service.departmentId === departmentFilter
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && service.isActive) ||
                         (statusFilter === 'inactive' && !service.isActive)

    return matchesSearch && matchesCategory && matchesDepartment && matchesStatus
  })

  // Estatísticas
  const stats = {
    total: services.length,
    active: services.filter(s => s.isActive).length,
    inactive: services.filter(s => !s.isActive).length,
    requiresDocuments: services.filter(s => s.requiresDocuments).length,
  }

  // Categorias únicas
  const categories = Array.from(new Set(services.map(s => s.category).filter(Boolean)))

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gerenciamento de Serviços</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Gerencie o catálogo de serviços públicos do município
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasPermission('services:create') && (
            <Link href="/admin/servicos/novo">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Serviço
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inativos</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Com Documentos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.requiresDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat || ''}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os departamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os departamentos</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Serviços */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredServices.map((service) => (
            <Card key={service.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg line-clamp-1">{service.name}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1 text-xs sm:text-sm">
                      {service.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  <Badge variant={service.isActive ? "default" : "secondary"} className="text-xs shrink-0">
                    {service.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Categoria:</span>
                    <Badge variant="outline" className="text-xs">{service.category || 'Sem categoria'}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Departamento:</span>
                    <span className="font-medium text-xs text-right line-clamp-1 max-w-[60%]">{service.department.name}</span>
                  </div>

                  {service.estimatedDays !== null && (
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-gray-600">Prazo:</span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {service.estimatedDays} dias
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Documentos:</span>
                    <Badge variant={service.requiresDocuments ? "default" : "secondary"} className="text-xs">
                      {service.requiresDocuments ? 'Requer' : 'Não requer'}
                    </Badge>
                  </div>

                  {/* ✅ NOVO: Status de Categorização */}
                  <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t">
                    <span className="text-gray-600">Categorização:</span>
                    {renderCategorizationStatus(service)}
                  </div>

                  {/* ✅ NOVO: Botão de re-análise se houver sugestões pendentes ou não categorizado */}
                  {(service.categorizationStatus === 'pending' || service.categorizationStatus === 'uncategorized') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReanalyzeService(service.id)}
                      className="w-full text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      {service.categorizationStatus === 'pending' ? 'Ver Sugestões' : 'Analisar Categorias'}
                    </Button>
                  )}

                  <div className="pt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedService(service)
                        setShowViewDialog(true)
                      }}
                      className="flex-1 min-w-[80px]"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      <span className="text-xs">Ver</span>
                    </Button>

                    {hasPermission('services:update') && (
                      <Link href={`/admin/servicos/${service.id}/editar`} className="flex-1 min-w-[80px]">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          <span className="text-xs">Editar</span>
                        </Button>
                      </Link>
                    )}

                    {hasPermission('services:delete') && service.isActive && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteService(service.id)}
                        className="w-10"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredServices.length === 0 && !loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Nenhum serviço encontrado</p>
            <p className="text-sm text-gray-500">
              {searchTerm || categoryFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Crie seu primeiro serviço para começar'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog Ver Detalhes */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-full sm:max-w-lg lg:max-w-2xl mx-3 sm:mx-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Detalhes do Serviço</DialogTitle>
          </DialogHeader>

          {selectedService && (
            <div className="space-y-4 sm:space-y-5">
              <div>
                <Label className="text-xs sm:text-sm text-gray-600">Nome</Label>
                <p className="font-medium text-sm sm:text-base mt-1">{selectedService.name}</p>
              </div>

              {selectedService.description && (
                <div>
                  <Label className="text-xs sm:text-sm text-gray-600">Descrição</Label>
                  <p className="text-sm sm:text-base mt-1">{selectedService.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs sm:text-sm text-gray-600">Categoria</Label>
                  <p className="text-sm sm:text-base mt-1">{selectedService.category || 'Sem categoria'}</p>
                </div>

                <div>
                  <Label className="text-xs sm:text-sm text-gray-600">Departamento</Label>
                  <p className="text-sm sm:text-base mt-1">{selectedService.department.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs sm:text-sm text-gray-600">Prazo Estimado</Label>
                  <p className="text-sm sm:text-base mt-1">{selectedService.estimatedDays ? `${selectedService.estimatedDays} dias` : 'Não definido'}</p>
                </div>

                <div>
                  <Label className="text-xs sm:text-sm text-gray-600">Prioridade</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">{selectedService.priority}/5</Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-xs sm:text-sm text-gray-600">Status</Label>
                  <div className="mt-1">
                    <Badge variant={selectedService.isActive ? "default" : "secondary"} className="text-xs">
                      {selectedService.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-xs sm:text-sm text-gray-600">Requer Documentos</Label>
                <p className="text-sm sm:text-base mt-1">{selectedService.requiresDocuments ? 'Sim' : 'Não'}</p>
              </div>

              {selectedService.requiresDocuments && Array.isArray(selectedService.requiredDocuments) && selectedService.requiredDocuments.length > 0 && (
                <div>
                  <Label className="text-xs sm:text-sm text-gray-600">Documentos Necessários</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedService.requiredDocuments.map((doc, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">{doc}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                <div>
                  <Label className="text-xs sm:text-sm text-gray-600">Criado em</Label>
                  <p className="mt-1">{new Date(selectedService.createdAt).toLocaleString('pt-BR')}</p>
                </div>

                <div>
                  <Label className="text-xs sm:text-sm text-gray-600">Atualizado em</Label>
                  <p className="mt-1">{new Date(selectedService.updatedAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => { setShowViewDialog(false); setSelectedService(null); }}
              className="w-full sm:w-auto"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ NOVO: Modal de Sugestões de Categorização */}
      <CategorySuggestionModal
        serviceId={selectedServiceForSuggestions}
        isOpen={showSuggestionsModal}
        onClose={() => {
          setShowSuggestionsModal(false);
          setSelectedServiceForSuggestions(null);
        }}
        onApproved={() => {
          // Recarregar lista de serviços após aprovação
          loadServices();
        }}
      />
    </div>
  )
}
