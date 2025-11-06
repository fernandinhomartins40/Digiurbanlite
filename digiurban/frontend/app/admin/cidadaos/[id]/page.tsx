'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CitizenFamilyComposition } from '@/components/admin/CitizenFamilyComposition'
import { useToast } from '@/hooks/use-toast'
import { useAdminAuth, useAdminPermissions } from '@/contexts/AdminAuthContext'
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Users,
  Bell,
  Home,
} from 'lucide-react'

interface CitizenDetails {
  id: string
  cpf: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  birthDate?: string
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  verifiedAt?: string
  verifiedBy?: string
  verificationNotes?: string
  registrationSource: 'WEB_PORTAL' | 'MOBILE_APP' | 'ADMIN_PANEL' | 'IMPORT'
  isActive: boolean
  createdAt: string
  familyAsHead?: Array<{
    id: string
    memberName: string
    relationship: string
    member?: {
      id: string
      name: string
      cpf: string
    }
  }>
  vulnerableFamilyData?: {
    id: string
    perCapitaIncome: number
    monthlyIncome: number
    householdMembers: number
    benefitRequests?: Array<{
      id: string
      benefitType: string
      status: string
      requestDate: string
    }>
    homeVisits?: Array<{
      id: string
      visitDate: string
      socialWorkerName: string
      observations: string
    }>
  }
  protocols?: Array<{
    id: string
    protocolNumber: string
    status: string
    createdAt: string
    service: { name: string }
    department: { name: string }
  }>
  _count: {
    protocols: number
    familyAsHead: number
    notifications: number
  }
}

export default function CitizenDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { apiRequest } = useAdminAuth()
  const { hasPermission } = useAdminPermissions()

  const citizenId = params.id as string
  const [citizen, setCitizen] = useState<CitizenDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCitizen()
  }, [citizenId])

  const loadCitizen = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`/admin/citizens/${citizenId}/details`)

      if (response.success) {
        setCitizen(response.data.citizen)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os dados do cidadão',
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendente', variant: 'default' as const, icon: Clock },
      VERIFIED: { label: 'Verificado', variant: 'default' as const, icon: CheckCircle2 },
      REJECTED: { label: 'Rejeitado', variant: 'destructive' as const, icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const getSourceLabel = (source: string) => {
    const sources = {
      WEB_PORTAL: 'Portal Web',
      MOBILE_APP: 'App Mobile',
      ADMIN_PANEL: 'Painel Admin',
      IMPORT: 'Importação',
    }
    return sources[source as keyof typeof sources] || source
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="text-gray-500">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!citizen) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Cidadão não encontrado</p>
            <Button onClick={() => router.back()} variant="outline" className="mt-4">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const canEdit = hasPermission('citizens:update')

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{citizen.name}</h1>
            <p className="text-sm text-gray-500">CPF: {citizen.cpf}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(citizen.verificationStatus)}
          {!citizen.isActive && (
            <Badge variant="destructive">Inativo</Badge>
          )}
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{citizen._count.protocols}</div>
                <div className="text-sm text-gray-500">Protocolos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{citizen._count.familyAsHead}</div>
                <div className="text-sm text-gray-500">Membros da Família</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{citizen._count.notifications}</div>
                <div className="text-sm text-gray-500">Notificações</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-sm font-medium">{getSourceLabel(citizen.registrationSource)}</div>
                <div className="text-sm text-gray-500">Origem</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Informações */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="family">Composição Familiar</TabsTrigger>
          <TabsTrigger value="protocols">Protocolos</TabsTrigger>
          {citizen.vulnerableFamilyData && (
            <TabsTrigger value="vulnerability">Vulnerabilidade</TabsTrigger>
          )}
        </TabsList>

        {/* Dados Pessoais */}
        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome Completo</label>
                <p className="text-gray-900">{citizen.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">CPF</label>
                <p className="text-gray-900">{citizen.cpf}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900 flex items-center gap-2">
                  {citizen.email ? (
                    <>
                      <Mail className="h-4 w-4 text-gray-400" />
                      {citizen.email}
                    </>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Telefone</label>
                <p className="text-gray-900 flex items-center gap-2">
                  {citizen.phone ? (
                    <>
                      <Phone className="h-4 w-4 text-gray-400" />
                      {citizen.phone}
                    </>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Data de Nascimento</label>
                <p className="text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(citizen.birthDate)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Data de Cadastro</label>
                <p className="text-gray-900">{formatDate(citizen.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {citizen.address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Logradouro</label>
                  <p className="text-gray-900">{citizen.address}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                {citizen.city && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cidade</label>
                    <p className="text-gray-900">{citizen.city}</p>
                  </div>
                )}
                {citizen.state && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado</label>
                    <p className="text-gray-900">{citizen.state}</p>
                  </div>
                )}
                {citizen.zipCode && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">CEP</label>
                    <p className="text-gray-900">{citizen.zipCode}</p>
                  </div>
                )}
              </div>
              {!citizen.address && !citizen.city && !citizen.state && (
                <p className="text-gray-500">Endereço não informado</p>
              )}
            </CardContent>
          </Card>

          {/* Verificação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Status de Verificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(citizen.verificationStatus)}</div>
              </div>
              {citizen.verifiedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Data da Verificação</label>
                  <p className="text-gray-900">{formatDate(citizen.verifiedAt)}</p>
                </div>
              )}
              {citizen.verificationNotes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    {citizen.verificationStatus === 'REJECTED' ? 'Motivo da Rejeição' : 'Observações'}
                  </label>
                  <p className="text-gray-900">{citizen.verificationNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Composição Familiar */}
        <TabsContent value="family">
          <CitizenFamilyComposition
            citizenId={citizen.id}
            citizenName={citizen.name}
            canEdit={canEdit}
          />
        </TabsContent>

        {/* Protocolos */}
        <TabsContent value="protocols">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Histórico de Protocolos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {citizen.protocols && citizen.protocols.length > 0 ? (
                <div className="space-y-3">
                  {citizen.protocols.map((protocol) => (
                    <div
                      key={protocol.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {protocol.protocolNumber}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {protocol.service.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {protocol.department.name} • {formatDate(protocol.createdAt)}
                          </div>
                        </div>
                        <Badge variant={protocol.status === 'CONCLUIDO' ? 'default' : 'secondary'}>
                          {protocol.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum protocolo encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vulnerabilidade */}
        {citizen.vulnerableFamilyData && (
          <TabsContent value="vulnerability">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Dados de Vulnerabilidade
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Renda Per Capita</label>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(citizen.vulnerableFamilyData.perCapitaIncome)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Renda Mensal</label>
                    <p className="text-xl font-bold text-gray-900">
                      {formatCurrency(citizen.vulnerableFamilyData.monthlyIncome)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Membros no Domicílio</label>
                    <p className="text-xl font-bold text-gray-900">
                      {citizen.vulnerableFamilyData.householdMembers}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Visitas Domiciliares */}
              {citizen.vulnerableFamilyData.homeVisits && citizen.vulnerableFamilyData.homeVisits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Visitas Domiciliares</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {citizen.vulnerableFamilyData.homeVisits.map((visit) => (
                        <div key={visit.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{visit.socialWorkerName}</span>
                            <span className="text-sm text-gray-500">{formatDate(visit.visitDate)}</span>
                          </div>
                          <p className="text-sm text-gray-600">{visit.observations}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
