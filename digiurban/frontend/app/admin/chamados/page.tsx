'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useSearchCitizen, type Citizen } from '@/hooks/useSearchCitizen'
import { useServices } from '@/hooks/useServices'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  Calendar,
  Tag,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  X,
  Search,
  XCircle
} from 'lucide-react'

export default function CriarChamadoPage() {
  const router = useRouter()
  const { user } = useAdminAuth()
  const { searchByCPF, loading: searchLoading } = useSearchCitizen()
  const { services, loading: servicesLoading, getDepartmentByServiceId } = useServices()

  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null)
  const [cpfSearch, setCpfSearch] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    serviceId: '',
    category: '',
    priority: '',
    department: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    return value
  }

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value)
    setCpfSearch(formatted)
    setSearchError(null)
    setNotFound(false)
  }

  const handleSearchCitizen = async () => {
    if (cpfSearch.length < 14) {
      setSearchError('Digite um CPF válido')
      return
    }

    try {
      setSearchError(null)
      setNotFound(false)
      const citizen = await searchByCPF(cpfSearch.replace(/\D/g, ''))

      if (citizen) {
        setSelectedCitizen(citizen)
        setCpfSearch('')
      } else {
        setNotFound(true)
      }
    } catch (error) {
      setSearchError('Erro ao buscar cidadão')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearchCitizen()
    }
  }

  const handleRemoveCitizen = () => {
    if (confirm('Deseja remover o cidadão selecionado?')) {
      setSelectedCitizen(null)
      setNotFound(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedCitizen) {
      alert('Selecione um cidadão antes de criar o chamado')
      return
    }

    if (!formData.serviceId || !formData.title || !formData.description || !formData.category || !formData.priority || !formData.department) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    setIsSubmitting(true)

    // Simular envio - substituir por chamada real à API
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitSuccess(true)

      // Resetar formulário após 2 segundos
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          serviceId: '',
          category: '',
          priority: '',
          department: ''
        })
        setSelectedCitizen(null)
        setSubmitSuccess(false)
      }, 2000)
    }, 1500)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleServiceChange = (serviceId: string) => {
    setFormData(prev => ({ ...prev, serviceId }))

    // Selecionar automaticamente o departamento responsável pelo serviço
    const department = getDepartmentByServiceId(serviceId)
    if (department) {
      setFormData(prev => ({ ...prev, department: department.id }))
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <AlertCircle className="h-8 w-8 text-orange-600 mr-3" />
            Criar Novo Chamado
          </h1>
          <p className="text-gray-600 mt-2">
            Abertura de chamados/protocolos para cidadãos cadastrados
          </p>
        </div>
      </div>

      {/* Mensagem de Sucesso */}
      {submitSuccess && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center text-green-800">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Chamado criado com sucesso! Protocolo gerado.</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Buscar/Selecionar Cidadão */}
            <div>
              {!selectedCitizen ? (
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="searchCpf">Buscar Cidadão por CPF</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="searchCpf"
                          placeholder="000.000.000-00"
                          value={cpfSearch}
                          onChange={(e) => handleCPFChange(e.target.value)}
                          onKeyPress={handleKeyPress}
                          maxLength={14}
                        />
                        <Button
                          type="button"
                          onClick={handleSearchCitizen}
                          disabled={searchLoading || cpfSearch.length < 14}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          {searchLoading ? 'Buscando...' : 'Buscar'}
                        </Button>
                      </div>
                      {searchError && (
                        <p className="text-sm text-red-600">{searchError}</p>
                      )}
                    </div>

                    {/* Cidadão Não Encontrado */}
                    {notFound && (
                      <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                        <div className="flex items-center space-x-2 mb-2">
                          <XCircle className="h-5 w-5 text-yellow-600" />
                          <h3 className="font-medium text-yellow-900">Cidadão Não Encontrado</h3>
                        </div>
                        <p className="text-sm text-yellow-700">
                          Não encontramos nenhum cidadão cadastrado com o CPF <strong>{cpfSearch}</strong>.
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          O cidadão deve estar cadastrado no Portal do Cidadão para abrir chamados.
                        </p>
                      </div>
                    )}

                    {/* Dica de Uso */}
                    {!notFound && (
                      <div className="text-sm text-gray-500 flex items-start space-x-2">
                        <Search className="h-4 w-4 mt-0.5" />
                        <p>
                          Digite o CPF do cidadão (apenas números) e clique em buscar.
                          Se o cidadão estiver cadastrado, seus dados serão exibidos automaticamente.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center text-blue-900">
                        <User className="h-5 w-5 mr-2" />
                        Cidadão Selecionado
                      </CardTitle>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveCitizen}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium text-lg text-blue-900">{selectedCitizen.name}</p>
                        <p className="text-sm text-blue-700">CPF: {selectedCitizen.cpf}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-700">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          {selectedCitizen.phone}
                        </div>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {selectedCitizen.email}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Dados do Chamado */}
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
                  <Label htmlFor="service">Serviço Solicitado *</Label>
                  <Select
                    value={formData.serviceId}
                    onValueChange={handleServiceChange}
                    required
                  >
                    <SelectTrigger id="service">
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicesLoading ? (
                        <SelectItem value="loading" disabled>Carregando...</SelectItem>
                      ) : services.length === 0 ? (
                        <SelectItem value="empty" disabled>Nenhum serviço disponível</SelectItem>
                      ) : (
                        services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name} - {service.department.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título do Chamado *</Label>
                  <Input
                    id="title"
                    placeholder="Resumo da solicitação"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição Detalhada *</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva detalhadamente a solicitação ou problema..."
                    rows={6}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleInputChange('category', value)}
                      required
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="saude">Saúde</SelectItem>
                        <SelectItem value="educacao">Educação</SelectItem>
                        <SelectItem value="assistencia-social">Assistência Social</SelectItem>
                        <SelectItem value="obras">Obras e Infraestrutura</SelectItem>
                        <SelectItem value="meio-ambiente">Meio Ambiente</SelectItem>
                        <SelectItem value="habitacao">Habitação</SelectItem>
                        <SelectItem value="cultura">Cultura</SelectItem>
                        <SelectItem value="esportes">Esportes</SelectItem>
                        <SelectItem value="turismo">Turismo</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => handleInputChange('priority', value)}
                      required
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="media">Média</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Departamento Responsável *</Label>
                    <Input
                      id="department"
                      value={
                        formData.department
                          ? services.find(s => s.id === formData.serviceId)?.department.name || 'Selecione um serviço'
                          : 'Selecione um serviço'
                      }
                      disabled
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500">
                      O departamento será selecionado automaticamente ao escolher o serviço
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !selectedCitizen}>
                {isSubmitting ? (
                  <>Criando Chamado...</>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Chamado
                  </>
                )}
              </Button>
            </div>
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
                  <p className="text-muted-foreground">Digite o CPF para buscar</p>
                </div>
              </div>
              <div className="flex items-start">
                <FileText className="h-4 w-4 mr-2 mt-0.5 text-purple-600" />
                <div>
                  <p className="font-medium">2. Preencher Detalhes</p>
                  <p className="text-muted-foreground">Descreva o problema ou solicitação</p>
                </div>
              </div>
              <div className="flex items-start">
                <Building2 className="h-4 w-4 mr-2 mt-0.5 text-green-600" />
                <div>
                  <p className="font-medium">3. Definir Departamento</p>
                  <p className="text-muted-foreground">Escolha a secretaria responsável</p>
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
              <p>• Um protocolo será gerado automaticamente</p>
              <p>• O cidadão receberá o número por email/SMS</p>
              <p>• O departamento será notificado imediatamente</p>
              <p>• Todos os campos marcados com * são obrigatórios</p>
            </CardContent>
          </Card>

          {/* Estatísticas Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estatísticas de Hoje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Chamados criados:</span>
                <Badge variant="outline">23</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Em atendimento:</span>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">12</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Resolvidos:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">45</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
