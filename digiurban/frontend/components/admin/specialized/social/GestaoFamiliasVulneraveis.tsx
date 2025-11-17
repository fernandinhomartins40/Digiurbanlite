'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Heart,
  Users,
  Home,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Search,
  Plus,
  UserPlus,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  DollarSign,
  Building
} from 'lucide-react'

interface VulnerableFamily {
  id: string
  responsibleName: string
  responsibleCpf: string
  responsibleBirthDate?: string
  responsiblePhone?: string
  address: string
  region?: string
  familyMembers: number
  monthlyIncome?: number
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  vulnerabilities: string[]
  needs: string[]
  observations?: string
  status: 'ACTIVE' | 'INACTIVE' | 'TRANSFERRED'
  registeredAt: string
  registeredBy: string
  lastVisit?: {
    date: string
    observations: string
    socialWorker: string
  }
  benefits?: {
    id: string
    type: string
    status: string
    approvedAt?: string
  }[]
}

interface Visit {
  id: string
  familyId: string
  familyName: string
  visitDate: string
  socialWorker: string
  purpose: string
  findings: string
  recommendations: string
  nextVisit?: string
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELED'
}

interface GestaoFamiliasVulneraveisProps {
  onFamilyRegister?: (family: Partial<VulnerableFamily>) => void
  onScheduleVisit?: (visit: Partial<Visit>) => void
  onUpdateFamily?: (id: string, updates: Partial<VulnerableFamily>) => void
}

export default function GestaoFamiliasVulneraveis({
  onFamilyRegister,
  onScheduleVisit,
  onUpdateFamily
}: GestaoFamiliasVulneraveisProps) {
  const [families, setFamilies] = useState<VulnerableFamily[]>([])
  const [visits, setVisits] = useState<Visit[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRisk, setFilterRisk] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [activeTab, setActiveTab] = useState<'families' | 'visits' | 'reports'>('families')
  const [showFamilyForm, setShowFamilyForm] = useState(false)
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [selectedFamily, setSelectedFamily] = useState<VulnerableFamily | null>(null)

  // Estados do formulário de cadastro
  const [familyForm, setFamilyForm] = useState({
    responsibleName: '',
    responsibleCpf: '',
    responsibleBirthDate: '',
    responsiblePhone: '',
    address: '',
    region: '',
    familyMembers: 1,
    monthlyIncome: '',
    riskLevel: 'MEDIUM' as VulnerableFamily['riskLevel'],
    vulnerabilities: [] as string[],
    needs: [] as string[],
    observations: ''
  })

  const regions = [
    'Centro', 'Norte', 'Sul', 'Leste', 'Oeste',
    'Vila Nova', 'Jardim América', 'São José',
    'Santa Maria', 'Parque Industrial'
  ]

  const vulnerabilityTypes = [
    'Extrema pobreza',
    'Desemprego',
    'Trabalho infantil',
    'Violência doméstica',
    'Dependência química',
    'Idoso em situação de risco',
    'Criança/adolescente em risco',
    'Deficiência sem suporte',
    'Moradia inadequada',
    'Insegurança alimentar',
    'Discriminação',
    'Isolamento social'
  ]

  const needTypes = [
    'Auxílio alimentação',
    'Auxílio moradia',
    'Auxílio transporte',
    'Medicamentos',
    'Documentação',
    'Capacitação profissional',
    'Acompanhamento psicológico',
    'Cuidados médicos',
    'Educação/alfabetização',
    'Creche/escola',
    'Cesta básica',
    'Roupas/agasalhos'
  ]

  // Mock data
  useEffect(() => {
    const mockFamilies: VulnerableFamily[] = [
      {
        id: '1',
        responsibleName: 'Maria da Silva Santos',
        responsibleCpf: '123.456.789-01',
        responsibleBirthDate: '1985-03-15',
        responsiblePhone: '(11) 99999-1111',
        address: 'Rua das Flores, 123 - Vila Nova',
        region: 'Vila Nova',
        familyMembers: 4,
        monthlyIncome: 600,
        riskLevel: 'HIGH',
        vulnerabilities: ['Extrema pobreza', 'Desemprego', 'Insegurança alimentar'],
        needs: ['Auxílio alimentação', 'Capacitação profissional', 'Cesta básica'],
        observations: 'Família com 3 crianças menores. Pai desempregado há 8 meses.',
        status: 'ACTIVE',
        registeredAt: '2024-01-10T08:00:00',
        registeredBy: 'Ana Assistente Social',
        lastVisit: {
          date: '2024-01-20T14:00:00',
          observations: 'Situação mantida. Família continua necessitando de apoio alimentar.',
          socialWorker: 'Ana Assistente Social'
        },
        benefits: [
          {
            id: 'b1',
            type: 'Auxílio Emergencial',
            status: 'APPROVED',
            approvedAt: '2024-01-15T10:00:00'
          }
        ]
      },
      {
        id: '2',
        responsibleName: 'João Pedro Oliveira',
        responsibleCpf: '987.654.321-01',
        responsibleBirthDate: '1978-11-22',
        responsiblePhone: '(11) 88888-2222',
        address: 'Av. Principal, 456 - Centro',
        region: 'Centro',
        familyMembers: 2,
        monthlyIncome: 1200,
        riskLevel: 'MEDIUM',
        vulnerabilities: ['Dependência química', 'Violência doméstica'],
        needs: ['Acompanhamento psicológico', 'Tratamento médico'],
        observations: 'Homem em processo de recuperação. Esposa vítima de violência.',
        status: 'ACTIVE',
        registeredAt: '2024-01-15T09:30:00',
        registeredBy: 'Carlos Assistente Social',
        benefits: []
      },
      {
        id: '3',
        responsibleName: 'Rosa de Jesus Lima',
        responsibleCpf: '555.666.777-88',
        responsibleBirthDate: '1952-08-08',
        responsiblePhone: '(11) 77777-3333',
        address: 'Rua da Esperança, 789 - Jardim América',
        region: 'Jardim América',
        familyMembers: 1,
        monthlyIncome: 800,
        riskLevel: 'MEDIUM',
        vulnerabilities: ['Idoso em situação de risco', 'Isolamento social'],
        needs: ['Cuidados médicos', 'Companhia/visitas'],
        observations: 'Idosa morando sozinha. Família distante.',
        status: 'ACTIVE',
        registeredAt: '2024-01-08T11:15:00',
        registeredBy: 'Ana Assistente Social'
      }
    ]

    const mockVisits: Visit[] = [
      {
        id: '1',
        familyId: '1',
        familyName: 'Maria da Silva Santos',
        visitDate: '2024-01-25T14:00:00',
        socialWorker: 'Ana Assistente Social',
        purpose: 'Acompanhamento mensal',
        findings: 'Família mantém dificuldades financeiras. Crianças frequentando escola.',
        recommendations: 'Continuar auxílio alimentar. Encaminhar pai para programa de capacitação.',
        nextVisit: '2024-02-25T14:00:00',
        status: 'SCHEDULED'
      },
      {
        id: '2',
        familyId: '2',
        familyName: 'João Pedro Oliveira',
        visitDate: '2024-01-22T10:00:00',
        socialWorker: 'Carlos Assistente Social',
        purpose: 'Avaliação de progresso',
        findings: 'Cliente mantém abstinência. Situação familiar melhorando.',
        recommendations: 'Continuar acompanhamento psicológico. Avaliar redução de frequência.',
        status: 'COMPLETED'
      }
    ]

    setFamilies(mockFamilies)
    setVisits(mockVisits)
  }, [])

  const filteredFamilies = families.filter(family => {
    const matchesSearch = family.responsibleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         family.responsibleCpf.includes(searchTerm) ||
                         family.address.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRisk = !filterRisk || family.riskLevel === filterRisk
    const matchesRegion = !filterRegion || family.region === filterRegion
    const matchesStatus = !filterStatus || family.status === filterStatus

    return matchesSearch && matchesRisk && matchesRegion && matchesStatus
  })

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskLabel = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'Baixo'
      case 'MEDIUM': return 'Médio'
      case 'HIGH': return 'Alto'
      case 'CRITICAL': return 'Crítico'
      default: return 'Indefinido'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'TRANSFERRED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleFamilySubmit = () => {
    if (!familyForm.responsibleName || !familyForm.responsibleCpf || !familyForm.address) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    const newFamily: VulnerableFamily = {
      id: Date.now().toString(),
      responsibleName: familyForm.responsibleName,
      responsibleCpf: familyForm.responsibleCpf,
      responsibleBirthDate: familyForm.responsibleBirthDate || undefined,
      responsiblePhone: familyForm.responsiblePhone || undefined,
      address: familyForm.address,
      region: familyForm.region || undefined,
      familyMembers: familyForm.familyMembers,
      monthlyIncome: familyForm.monthlyIncome ? parseFloat(familyForm.monthlyIncome) : undefined,
      riskLevel: familyForm.riskLevel,
      vulnerabilities: familyForm.vulnerabilities,
      needs: familyForm.needs,
      observations: familyForm.observations || undefined,
      status: 'ACTIVE',
      registeredAt: new Date().toISOString(),
      registeredBy: 'Usuário Atual'
    }

    setFamilies(prev => [newFamily, ...prev])
    onFamilyRegister?.(newFamily)

    // Reset form
    setFamilyForm({
      responsibleName: '',
      responsibleCpf: '',
      responsibleBirthDate: '',
      responsiblePhone: '',
      address: '',
      region: '',
      familyMembers: 1,
      monthlyIncome: '',
      riskLevel: 'MEDIUM',
      vulnerabilities: [],
      needs: [],
      observations: ''
    })

    setShowFamilyForm(false)
  }

  const handleVulnerabilityToggle = (vulnerability: string) => {
    setFamilyForm(prev => ({
      ...prev,
      vulnerabilities: prev.vulnerabilities.includes(vulnerability)
        ? prev.vulnerabilities.filter(v => v !== vulnerability)
        : [...prev.vulnerabilities, vulnerability]
    }))
  }

  const handleNeedToggle = (need: string) => {
    setFamilyForm(prev => ({
      ...prev,
      needs: prev.needs.includes(need)
        ? prev.needs.filter(n => n !== need)
        : [...prev.needs, need]
    }))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center">
          <Heart className="w-6 h-6 mr-2 text-red-600" />
          Gestão de Famílias Vulneráveis
        </h2>

        <Button onClick={() => setShowFamilyForm(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Cadastrar Família
        </Button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Famílias</p>
                <p className="text-2xl font-bold">{families.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risco Alto/Crítico</p>
                <p className="text-2xl font-bold text-red-600">
                  {families.filter(f => f.riskLevel === 'HIGH' || f.riskLevel === 'CRITICAL').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Visitas Agendadas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {visits.filter(v => v.status === 'SCHEDULED').length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pessoas Atendidas</p>
                <p className="text-2xl font-bold text-green-600">
                  {families.reduce((acc, f) => acc + f.familyMembers, 0)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome, CPF ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterRisk} onValueChange={setFilterRisk}>
              <SelectTrigger>
                <SelectValue placeholder="Nível de Risco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os níveis</SelectItem>
                <SelectItem value="LOW">Baixo</SelectItem>
                <SelectItem value="MEDIUM">Médio</SelectItem>
                <SelectItem value="HIGH">Alto</SelectItem>
                <SelectItem value="CRITICAL">Crítico</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterRegion} onValueChange={setFilterRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Região" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as regiões</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="ACTIVE">Ativo</SelectItem>
                <SelectItem value="INACTIVE">Inativo</SelectItem>
                <SelectItem value="TRANSFERRED">Transferido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeTab === 'families' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('families')}
          className="flex-1"
        >
          <Users className="w-4 h-4 mr-2" />
          Famílias Cadastradas
        </Button>
        <Button
          variant={activeTab === 'visits' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('visits')}
          className="flex-1"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Visitas Domiciliares
        </Button>
        <Button
          variant={activeTab === 'reports' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('reports')}
          className="flex-1"
        >
          <FileText className="w-4 h-4 mr-2" />
          Relatórios
        </Button>
      </div>

      {/* Conteúdo das Tabs */}
      {activeTab === 'families' && (
        <div className="space-y-4">
          {filteredFamilies.map((family) => (
            <Card key={family.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium">{family.responsibleName}</h3>
                      <Badge className={getRiskColor(family.riskLevel)}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Risco {getRiskLabel(family.riskLevel)}
                      </Badge>
                      <Badge className={getStatusColor(family.status)}>
                        {family.status === 'ACTIVE' ? 'Ativo' :
                         family.status === 'INACTIVE' ? 'Inativo' : 'Transferido'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">CPF: {family.responsibleCpf}</p>
                        {family.responsiblePhone && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {family.responsiblePhone}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {family.familyMembers} membro(s)
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {family.address}
                        </p>
                        {family.region && (
                          <p className="text-sm text-gray-500">Região: {family.region}</p>
                        )}
                        {family.monthlyIncome && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            Renda: {formatCurrency(family.monthlyIncome)}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">
                          Cadastrado em: {new Date(family.registeredAt).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm text-gray-500">Por: {family.registeredBy}</p>
                        {family.lastVisit && (
                          <p className="text-sm text-blue-600">
                            Última visita: {new Date(family.lastVisit.date).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Vulnerabilidades */}
                    {family.vulnerabilities.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Vulnerabilidades:</h4>
                        <div className="flex flex-wrap gap-1">
                          {family.vulnerabilities.map(vuln => (
                            <Badge key={vuln} variant="outline" className="text-xs bg-red-50 text-red-700">
                              {vuln}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Necessidades */}
                    {family.needs.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Necessidades:</h4>
                        <div className="flex flex-wrap gap-1">
                          {family.needs.map(need => (
                            <Badge key={need} variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              {need}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Benefícios */}
                    {family.benefits && family.benefits.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Benefícios:</h4>
                        <div className="flex flex-wrap gap-1">
                          {family.benefits.map(benefit => (
                            <Badge key={benefit.id} variant="outline" className="text-xs bg-green-50 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {benefit.type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Observações */}
                    {family.observations && (
                      <div className="mt-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm"><strong>Observações:</strong> {family.observations}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFamily(family)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Detalhes
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedFamily(family)
                        setShowVisitForm(true)
                      }}
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Agendar Visita
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'visits' && (
        <div className="space-y-4">
          {visits.map((visit) => (
            <Card key={visit.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <h3 className="font-medium">{visit.familyName}</h3>
                      <Badge className={visit.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                      visit.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                                      'bg-red-100 text-red-800'}>
                        {visit.status === 'COMPLETED' ? 'Realizada' :
                         visit.status === 'SCHEDULED' ? 'Agendada' : 'Cancelada'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p><strong>Data:</strong> {new Date(visit.visitDate).toLocaleString('pt-BR')}</p>
                        <p><strong>Assistente Social:</strong> {visit.socialWorker}</p>
                        <p><strong>Propósito:</strong> {visit.purpose}</p>
                      </div>

                      {visit.status === 'COMPLETED' && (
                        <div>
                          <p><strong>Constatações:</strong> {visit.findings}</p>
                          <p><strong>Recomendações:</strong> {visit.recommendations}</p>
                          {visit.nextVisit && (
                            <p><strong>Próxima visita:</strong> {new Date(visit.nextVisit).toLocaleDateString('pt-BR')}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Ver Detalhes
                    </Button>
                    {visit.status === 'SCHEDULED' && (
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Famílias por Nível de Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(risk => {
                  const count = families.filter(f => f.riskLevel === risk).length
                  return (
                    <div key={risk} className="flex justify-between items-center">
                      <span className="text-sm">{getRiskLabel(risk)}</span>
                      <Badge className={getRiskColor(risk)}>{count} famílias</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Principais Vulnerabilidades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vulnerabilityTypes.slice(0, 6).map(vuln => {
                  const count = families.filter(f => f.vulnerabilities.includes(vuln)).length
                  return (
                    <div key={vuln} className="flex justify-between items-center">
                      <span className="text-sm">{vuln}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Cadastro de Família */}
      {showFamilyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="w-full max-w-4xl my-8">
            <Card className="w-full max-h-[calc(100vh-4rem)] flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle>Cadastrar Nova Família Vulnerável</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 overflow-y-auto flex-1">
              {/* Dados do Responsável */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados do Responsável</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsibleName">Nome Completo *</Label>
                    <Input
                      id="responsibleName"
                      value={familyForm.responsibleName}
                      onChange={(e) => setFamilyForm(prev => ({ ...prev, responsibleName: e.target.value }))}
                      placeholder="Nome completo do responsável"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsibleCpf">CPF *</Label>
                    <Input
                      id="responsibleCpf"
                      value={familyForm.responsibleCpf}
                      onChange={(e) => setFamilyForm(prev => ({ ...prev, responsibleCpf: e.target.value }))}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsibleBirthDate">Data de Nascimento</Label>
                    <Input
                      id="responsibleBirthDate"
                      type="date"
                      value={familyForm.responsibleBirthDate}
                      onChange={(e) => setFamilyForm(prev => ({ ...prev, responsibleBirthDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="responsiblePhone">Telefone</Label>
                    <Input
                      id="responsiblePhone"
                      value={familyForm.responsiblePhone}
                      onChange={(e) => setFamilyForm(prev => ({ ...prev, responsiblePhone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Endereço Completo *</Label>
                    <Input
                      id="address"
                      value={familyForm.address}
                      onChange={(e) => setFamilyForm(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua, número, bairro, CEP"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Região</Label>
                    <Select value={familyForm.region} onValueChange={(value) =>
                      setFamilyForm(prev => ({ ...prev, region: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a região" />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map(region => (
                          <SelectItem key={region} value={region}>{region}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Dados Familiares */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Dados Familiares</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="familyMembers">Número de Membros</Label>
                    <Input
                      id="familyMembers"
                      type="number"
                      min="1"
                      value={familyForm.familyMembers}
                      onChange={(e) => setFamilyForm(prev => ({ ...prev, familyMembers: parseInt(e.target.value) || 1 }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthlyIncome">Renda Mensal (R$)</Label>
                    <Input
                      id="monthlyIncome"
                      type="number"
                      step="0.01"
                      value={familyForm.monthlyIncome}
                      onChange={(e) => setFamilyForm(prev => ({ ...prev, monthlyIncome: e.target.value }))}
                      placeholder="0,00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="riskLevel">Nível de Risco</Label>
                    <Select value={familyForm.riskLevel} onValueChange={(value) =>
                      setFamilyForm(prev => ({ ...prev, riskLevel: value as VulnerableFamily['riskLevel'] }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Baixo</SelectItem>
                        <SelectItem value="MEDIUM">Médio</SelectItem>
                        <SelectItem value="HIGH">Alto</SelectItem>
                        <SelectItem value="CRITICAL">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Vulnerabilidades */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Vulnerabilidades Identificadas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {vulnerabilityTypes.map(vuln => (
                    <label key={vuln} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={familyForm.vulnerabilities.includes(vuln)}
                        onChange={() => handleVulnerabilityToggle(vuln)}
                        className="rounded"
                      />
                      <span className="text-sm">{vuln}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Necessidades */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Necessidades Identificadas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {needTypes.map(need => (
                    <label key={need} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={familyForm.needs.includes(need)}
                        onChange={() => handleNeedToggle(need)}
                        className="rounded"
                      />
                      <span className="text-sm">{need}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  value={familyForm.observations}
                  onChange={(e) => setFamilyForm(prev => ({ ...prev, observations: e.target.value }))}
                  placeholder="Informações adicionais sobre a família e sua situação"
                  rows={4}
                />
              </div>

              <div className="flex space-x-2 pt-4 flex-shrink-0 sticky bottom-0 bg-white border-t -mx-6 px-6 py-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFamilyForm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button onClick={handleFamilySubmit} className="flex-1">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Cadastrar Família
                </Button>
              </div>
            </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}