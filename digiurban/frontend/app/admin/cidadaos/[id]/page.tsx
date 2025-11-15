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
  Eye,
  Download,
  Trash2,
  Check,
  X,
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
    documents: number
  }
  documents?: Array<{
    id: string
    documentType: string
    fileName: string
    fileSize: number
    mimeType: string
    status: 'PENDING' | 'UPLOADED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
    notes?: string
    uploadedAt: string
    reviewedBy?: string
    reviewedAt?: string
    rejectionReason?: string
  }>
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
  const [previewDocument, setPreviewDocument] = useState<any>(null)
  const [approving, setApproving] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)

  useEffect(() => {
    loadCitizen()
  }, [citizenId])

  const loadCitizen = async () => {
    try {
      setLoading(true)
      const response = await apiRequest(`/admin/citizens/${citizenId}/details`)

      if (response.success) {
        console.log('Dados do cidadão:', response.data.citizen)
        console.log('Documentos do cidadão:', response.data.citizen.documents)
        console.log('Contador de documentos:', response.data.citizen._count)
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

  const getDocumentLabel = (type: string) => {
    const labels: Record<string, string> = {
      rg: 'RG - Identidade',
      cpf: 'CPF',
      comprovante_residencia: 'Comprovante de Residência',
      certidao_nascimento: 'Certidão de Nascimento',
      titulo_eleitor: 'Título de Eleitor',
      carteira_trabalho: 'Carteira de Trabalho',
      comprovante_renda: 'Comprovante de Renda',
      outro: 'Outro Documento',
    }
    return labels[type] || type
  }

  const handleApproveDocument = async (documentId: string) => {
    try {
      setApproving(documentId)
      const response = await apiRequest(`/admin/citizen-documents/${documentId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Documento aprovado' }),
      })

      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Documento aprovado com sucesso',
        })
        loadCitizen()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao aprovar documento',
      })
    } finally {
      setApproving(null)
    }
  }

  const handleRejectDocument = async (documentId: string) => {
    const reason = prompt('Digite o motivo da rejeição:')
    if (!reason) return

    try {
      setRejecting(documentId)
      const response = await apiRequest(`/admin/citizen-documents/${documentId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ notes: reason }),
      })

      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Documento rejeitado',
        })
        loadCitizen()
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao rejeitar documento',
      })
    } finally {
      setRejecting(null)
    }
  }

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const response = await apiRequest(`/admin/citizen-documents/${documentId}/download?download=true`)

      if (!response.ok) {
        throw new Error('Erro ao fazer download')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao fazer download',
      })
    }
  }

  const isImageDocument = (mimeType: string) => {
    return mimeType?.startsWith('image/')
  }

  const getDocumentStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'Pendente', variant: 'secondary' as const },
      UPLOADED: { label: 'Enviado', variant: 'default' as const },
      UNDER_REVIEW: { label: 'Em Análise', variant: 'default' as const },
      APPROVED: { label: 'Aprovado', variant: 'default' as const },
      REJECTED: { label: 'Rejeitado', variant: 'destructive' as const },
      EXPIRED: { label: 'Expirado', variant: 'destructive' as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return <Badge variant={config.variant}>{config.label}</Badge>
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
              <FileText className="h-8 w-8 text-indigo-600" />
              <div>
                <div className="text-2xl font-bold">{citizen._count.documents || 0}</div>
                <div className="text-sm text-gray-500">Documentos</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Informações */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList>
          <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
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
              {(() => {
                // Verificar se address é um objeto ou string
                const addressObj = typeof citizen.address === 'object' && citizen.address !== null
                  ? citizen.address as any
                  : null;
                const addressStr = typeof citizen.address === 'string' ? citizen.address : null;

                return (
                  <>
                    {(addressObj?.logradouro || addressStr) && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Logradouro</label>
                        <p className="text-gray-900">
                          {addressObj?.logradouro || addressStr}
                          {addressObj?.numero && `, ${addressObj.numero}`}
                        </p>
                      </div>
                    )}
                    {addressObj?.complemento && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Complemento</label>
                        <p className="text-gray-900">{addressObj.complemento}</p>
                      </div>
                    )}
                    {addressObj?.bairro && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Bairro</label>
                        <p className="text-gray-900">{addressObj.bairro}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-4">
                      {(addressObj?.cidade || citizen.city) && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Cidade</label>
                          <p className="text-gray-900">{addressObj?.cidade || citizen.city}</p>
                        </div>
                      )}
                      {(addressObj?.uf || citizen.state) && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Estado</label>
                          <p className="text-gray-900">{addressObj?.uf || citizen.state}</p>
                        </div>
                      )}
                      {(addressObj?.cep || citizen.zipCode) && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">CEP</label>
                          <p className="text-gray-900">{addressObj?.cep || citizen.zipCode}</p>
                        </div>
                      )}
                    </div>
                    {!citizen.address && !citizen.city && !citizen.state && (
                      <p className="text-gray-500">Endereço não informado</p>
                    )}
                  </>
                );
              })()}
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

        {/* Documentos */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              {citizen.documents && citizen.documents.length > 0 ? (
                <div className="space-y-3">
                  {citizen.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {getDocumentLabel(doc.documentType)}
                            </h3>
                            {getDocumentStatusBadge(doc.status)}
                          </div>
                          <p className="text-sm text-gray-600">{doc.fileName}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Enviado em {formatDate(doc.uploadedAt)}
                          </p>
                          {doc.notes && (
                            <p className="text-xs text-orange-600 mt-1">
                              Observação: {doc.notes}
                            </p>
                          )}
                          {doc.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1">
                              Motivo da rejeição: {doc.rejectionReason}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewDocument(doc)}
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc.id, doc.fileName)}
                            title="Baixar"
                          >
                            <Download className="w-4 h-4" />
                          </Button>

                          {doc.status === 'PENDING' && canEdit && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApproveDocument(doc.id)}
                                disabled={approving === doc.id}
                                className="text-green-600 hover:text-green-700"
                                title="Aprovar"
                              >
                                {approving === doc.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectDocument(doc.id)}
                                disabled={rejecting === doc.id}
                                className="text-red-600 hover:text-red-700"
                                title="Rejeitar"
                              >
                                {rejecting === doc.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                                ) : (
                                  <X className="w-4 h-4" />
                                )}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhum documento enviado ainda</p>
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

      {/* Modal de Preview de Documentos */}
      {previewDocument && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewDocument(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">
                    {getDocumentLabel(previewDocument.documentType)}
                  </h2>
                  <p className="text-sm text-gray-500">{previewDocument.fileName}</p>
                </div>
                <button
                  onClick={() => setPreviewDocument(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                {getDocumentStatusBadge(previewDocument.status)}
              </div>

              <div className="mb-4 bg-gray-100 rounded-lg p-2 flex items-center justify-center min-h-[400px]">
                {isImageDocument(previewDocument.mimeType) ? (
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL}/admin/citizen-documents/${previewDocument.id}/download`}
                    alt={previewDocument.fileName}
                    className="max-w-full max-h-[600px] object-contain"
                  />
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Preview não disponível para este tipo de arquivo</p>
                    <Button
                      onClick={() => handleDownloadDocument(previewDocument.id, previewDocument.fileName)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Documento
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadDocument(previewDocument.id, previewDocument.fileName)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
                {previewDocument.status === 'PENDING' && canEdit && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleApproveDocument(previewDocument.id)
                        setPreviewDocument(null)
                      }}
                      disabled={approving === previewDocument.id}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleRejectDocument(previewDocument.id)
                        setPreviewDocument(null)
                      }}
                      disabled={rejecting === previewDocument.id}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Rejeitar
                    </Button>
                  </>
                )}
                <Button onClick={() => setPreviewDocument(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
