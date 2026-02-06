'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertCircle,
  Plus,
  User,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  Search,
  Loader2,
  UserCheck,
  Check,
  Circle
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/services/api'
import Link from 'next/link'
import { ServiceSelectorCards } from '@/components/admin/ServiceSelectorCards'

interface Citizen {
  id: string
  name: string
  cpf: string
  email: string
  phone: string
  address?: any
  isActive: boolean
  createdAt?: string
}

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
}

export default function CriarChamadoPage() {
  const router = useRouter()
  const { user } = useAdminAuth()

  // Estados para cidadão
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null)
  const [citizenSearch, setCitizenSearch] = useState('')
  const [searchingCitizen, setSearchingCitizen] = useState(false)
  const [citizenResults, setCitizenResults] = useState<Citizen[]>([])

  // Estados para serviço
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  // Estados do formulário
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '',
    assignedUserId: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Refs para debounce
  const citizenSearchTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ============================================================================
  // BUSCA DE CIDADÃO (Padrão de /admin/servicos/[id]/solicitar)
  // ============================================================================

  const handleSearchCitizen = useCallback(async (searchTerm: string) => {
    if (searchTerm.trim().length < 2) {
      setCitizenResults([])
      setSearchingCitizen(false)
      return
    }

    setSearchingCitizen(true)
    try {
      const response = await api.get(`/admin/citizens/search?q=${encodeURIComponent(searchTerm.trim())}`)

      if (response.data.success && response.data.data) {
        const results = Array.isArray(response.data.data)
          ? response.data.data
          : (response.data.data.citizens || [])
        setCitizenResults(results)
      } else {
        setCitizenResults([])
      }
    } catch (error: any) {
      console.error('[Chamados] Erro ao buscar cidadão:', error)
      setCitizenResults([])
      toast.error('Erro ao buscar cidadão')
    } finally {
      setSearchingCitizen(false)
    }
  }, [])

  const debouncedCitizenSearch = useCallback((searchTerm: string) => {
    if (citizenSearchTimerRef.current) {
      clearTimeout(citizenSearchTimerRef.current)
    }

    citizenSearchTimerRef.current = setTimeout(() => {
      handleSearchCitizen(searchTerm)
    }, 400)
  }, [handleSearchCitizen])

  const handleSelectCitizen = (citizen: Citizen) => {
    setSelectedCitizen(citizen)
    setCitizenSearch(citizen.name)
    setCitizenResults([])
    toast.success(`Cidadão selecionado: ${citizen.name}`)
  }

  const handleRemoveCitizen = () => {
    setSelectedCitizen(null)
    setCitizenSearch('')
    setCitizenResults([])
  }

  // ============================================================================
  // HANDLERS DE SERVIÇO (para o novo componente ServiceSelectorCards)
  // ============================================================================

  const handleSelectService = (service: Service) => {
    setSelectedService(service)
  }

  const handleRemoveService = () => {
    setSelectedService(null)
  }

  // ============================================================================
  // SUBMIT DO FORMULÁRIO
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validações
    if (!selectedCitizen) {
      toast.error('Selecione um cidadão antes de criar o chamado')
      return
    }

    if (!selectedService) {
      toast.error('Selecione um serviço antes de criar o chamado')
      return
    }

    if (!formData.title || !formData.description || !formData.priority) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setIsSubmitting(true)

    try {
      // Converter prioridade de string para número
      const priorityMap: Record<string, number> = {
        'baixa': 1,
        'media': 2,
        'alta': 3,
        'urgente': 4,
        'critica': 5
      }

      const payload: any = {
        citizenId: selectedCitizen.id,
        serviceId: selectedService.id,
        title: formData.title,
        description: formData.description,
        priority: priorityMap[formData.priority] || 3,
        notifyCitizen: true,
        notifyDepartment: true
      };

      // Só adicionar assignedUserId se tiver valor
      if (formData.assignedUserId && formData.assignedUserId.trim()) {
        payload.assignedUserId = formData.assignedUserId;
      }

      const response = await api.post('/admin/chamados', payload)

      if (response.data.success) {
        const ticketNumber = response.data.data?.ticket?.number || 'N/A'

        toast.success('Chamado criado com sucesso!', {
          description: `Chamado ${ticketNumber} enviado para ${selectedService.department.name}. Aguardando análise da secretaria.`
        })

        // Resetar formulário
        setTimeout(() => {
          setFormData({
            title: '',
            description: '',
            priority: '',
            assignedUserId: ''
          })
          setSelectedCitizen(null)
          setSelectedService(null)
          setCitizenSearch('')

          // Redirecionar para a mesma página para criar novo chamado
          router.push('/admin/chamados')
          router.refresh()
        }, 1500)
      }
    } catch (error: any) {
      console.error('Erro ao criar chamado:', error)
      toast.error(
        error.response?.data?.message ||
        error.message ||
        'Erro ao criar chamado'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 mr-2 sm:mr-3" />
            Criar Novo Chamado
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2">
            Abertura de chamados/protocolos para cidadãos cadastrados
          </p>
        </div>
        <Link href="/admin/chamados/lista">
          <Button variant="outline" className="w-full sm:w-auto">
            <FileText className="h-4 w-4 mr-2" />
            Ver Meus Chamados
          </Button>
        </Link>
      </div>

      {/* Badge Modo Admin */}
      {user && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 text-orange-800 rounded-lg text-sm font-medium">
          <UserCheck className="h-4 w-4" />
          Modo Administrador - {user.name}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. BUSCAR/SELECIONAR CIDADÃO */}
            <div>
              {!selectedCitizen ? (
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-900">
                      <Search className="h-5 w-5" />
                      Buscar Cidadão
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      Digite o nome do cidadão para buscar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="relative">
                        <Input
                          type="text"
                          value={citizenSearch}
                          onChange={(e) => {
                            const value = e.target.value
                            setCitizenSearch(value)

                            if (!value.trim()) {
                              setCitizenResults([])
                              return
                            }

                            debouncedCitizenSearch(value)
                          }}
                          placeholder="Digite o nome do cidadão..."
                          className="bg-white pr-10"
                          autoComplete="off"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {searchingCitizen ? (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          ) : (
                            <Search className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Resultados da Busca */}
                      {citizenResults.length > 0 && (
                        <div className="bg-white border border-orange-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                          {citizenResults.map((citizen) => (
                            <button
                              key={citizen.id}
                              type="button"
                              onClick={() => handleSelectCitizen(citizen)}
                              className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">{citizen.name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                CPF: {citizen.cpf}
                                {citizen.email && ` • ${citizen.email}`}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Sem resultados */}
                      {citizenSearch.length >= 2 && !searchingCitizen && citizenResults.length === 0 && (
                        <div className="text-sm text-orange-700 bg-white rounded-lg p-3 border border-orange-200">
                          Nenhum cidadão encontrado com este nome
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-green-900">
                        <User className="h-5 w-5 mr-2" />
                        Cidadão Selecionado
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCitizen}
                        className="text-green-700 hover:text-green-900"
                      >
                        Alterar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium text-lg text-green-900">{selectedCitizen.name}</p>
                        <p className="text-sm text-green-700">CPF: {selectedCitizen.cpf}</p>
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-sm text-green-700">
                        {selectedCitizen.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="break-all">{selectedCitizen.phone}</span>
                          </div>
                        )}
                        {selectedCitizen.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="break-all">{selectedCitizen.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* 2. BUSCAR/SELECIONAR SERVIÇO - Novo componente com cards e filtros */}
            <ServiceSelectorCards
              selectedService={selectedService}
              onSelectService={handleSelectService}
              onRemoveService={handleRemoveService}
            />

            {/* 3. DADOS DO CHAMADO */}
            {selectedCitizen && selectedService && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-purple-600" />
                    Detalhes do Chamado
                  </CardTitle>
                  <CardDescription>
                    Informações sobre a solicitação ou problema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="title">Título do Chamado *</Label>
                      <span className={`text-xs ${
                        formData.title.length === 0 ? 'text-muted-foreground' :
                        formData.title.length < 5 ? 'text-red-500 font-semibold' :
                        'text-green-600 font-semibold'
                      }`}>
                        {formData.title.length}/5 mínimo
                      </span>
                    </div>
                    <Input
                      id="title"
                      placeholder="Resumo da solicitação (mínimo 5 caracteres)"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className={
                        formData.title.length > 0 && formData.title.length < 5
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : formData.title.length >= 5
                          ? 'border-green-500 focus-visible:ring-green-500'
                          : ''
                      }
                      required
                    />
                    {formData.title.length > 0 && formData.title.length < 5 && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Faltam {5 - formData.title.length} caracteres
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description">Descrição Detalhada *</Label>
                      <span className={`text-xs ${
                        formData.description.length === 0 ? 'text-muted-foreground' :
                        formData.description.length < 10 ? 'text-red-500 font-semibold' :
                        'text-green-600 font-semibold'
                      }`}>
                        {formData.description.length}/10 mínimo
                      </span>
                    </div>
                    <Textarea
                      id="description"
                      placeholder="Descreva detalhadamente a solicitação ou problema (mínimo 10 caracteres)..."
                      rows={6}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className={
                        formData.description.length > 0 && formData.description.length < 10
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : formData.description.length >= 10
                          ? 'border-green-500 focus-visible:ring-green-500'
                          : ''
                      }
                      required
                    />
                    {formData.description.length > 0 && formData.description.length < 10 && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Faltam {10 - formData.description.length} caracteres
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => handleInputChange('priority', value)}
                      required
                    >
                      <SelectTrigger id="priority" className={
                        formData.priority ? 'border-green-500' : ''
                      }>
                        <SelectValue placeholder="Selecione a prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    {!formData.priority && (
                      <p className="text-xs text-muted-foreground">
                        Selecione o nível de prioridade do chamado
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Validação Visual dos Campos */}
            {selectedCitizen && selectedService && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle className={`h-5 w-5 mt-0.5 ${
                      formData.title.length >= 5 &&
                      formData.description.length >= 10 &&
                      formData.priority
                        ? 'text-green-600'
                        : 'text-muted-foreground'
                    }`} />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium">Status da Validação:</p>
                      <div className="space-y-1 text-xs">
                        <div className={`flex items-center gap-2 ${
                          formData.title.length >= 5 ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {formData.title.length >= 5 ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                          Título com mínimo 5 caracteres
                        </div>
                        <div className={`flex items-center gap-2 ${
                          formData.description.length >= 10 ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {formData.description.length >= 10 ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                          Descrição com mínimo 10 caracteres
                        </div>
                        <div className={`flex items-center gap-2 ${
                          formData.priority ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {formData.priority ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                          Prioridade selecionada
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botões de Ação */}
            {selectedCitizen && selectedService && (
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:space-x-4 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    formData.title.length < 5 ||
                    formData.description.length < 10 ||
                    !formData.priority
                  }
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Criando Chamado...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Chamado
                    </>
                  )}
                </Button>
              </div>
            )}
          </form>
        </div>

        {/* Informações e Ajuda */}
        <div className="space-y-6">
          {/* Guia Rápido */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Guia Rápido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start">
                <User className="h-4 w-4 mr-2 mt-0.5 text-blue-600" />
                <div>
                  <p className="font-medium">1. Buscar Cidadão</p>
                  <p className="text-muted-foreground">Digite o nome para buscar</p>
                </div>
              </div>
              <div className="flex items-start">
                <FileText className="h-4 w-4 mr-2 mt-0.5 text-purple-600" />
                <div>
                  <p className="font-medium">2. Selecionar Serviço</p>
                  <p className="text-muted-foreground">Escolha o serviço solicitado</p>
                </div>
              </div>
              <div className="flex items-start">
                <Building2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                <div>
                  <p className="font-medium">3. Preencher Detalhes</p>
                  <p className="text-muted-foreground">Descreva o problema ou solicitação</p>
                </div>
              </div>
              <div className="flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 text-orange-600" />
                <div>
                  <p className="font-medium">4. Definir Prioridade</p>
                  <p className="text-muted-foreground">Avalie a urgência do atendimento</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Importantes */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-blue-900">
                <AlertCircle className="h-5 w-5 mr-2" />
                Importante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-blue-800">
              <p>• O cidadão deve estar cadastrado no sistema</p>
              <p>• Um chamado será enviado para a secretaria</p>
              <p>• A secretaria pode aceitar ou recusar o chamado</p>
              <p>• Se aceito, um protocolo será criado para o cidadão</p>
              <p>• O cidadão só será notificado quando o protocolo for criado</p>
              <p>• Todos os campos marcados com * são obrigatórios</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
