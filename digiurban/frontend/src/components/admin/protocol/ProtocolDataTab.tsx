'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Info,
  Loader2,
  History,
  Filter
} from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import { FieldHistoryDialog } from './FieldHistoryDialog'

interface DataField {
  id: string
  fieldKey: string
  fieldLabel: string
  fieldValue: string
  isRequired: boolean
  fieldType: string | null
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CORRECTED'
  validatedBy: string | null
  validatedAt: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  version: number
  previousValue: string | null
}

interface FieldsStats {
  total: number
  required: number
  optional: number
  pending: number
  approved: number
  rejected: number
  corrected: number
  underReview: number
  allRequiredApproved: boolean
  percentageApproved: number
}

interface ProtocolDataTabProps {
  protocolId: string
  formData?: Record<string, any>
  metadata?: any
  onRefresh?: () => void
}

// Campos técnicos/metadados que nunca devem aparecer na aba de dados.
// Espelha EXCLUDED_FIELDS/EXCLUDED_PREFIXES do backend (createDataFieldsFromCustomData).
const EXCLUDED_FIELD_KEYS = new Set([
  'id', 'citizenId', 'serviceId', 'protocolId', 'createdAt', 'updatedAt',
  'createdBy', 'updatedBy', 'deletedAt', 'userId', 'departmentId'
])
const EXCLUDED_FIELD_PREFIXES = ['_', 'citizen', 'user', 'service', 'protocol']

function formatFieldLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

function isDisplayableCustomKey(key: string): boolean {
  if (EXCLUDED_FIELD_KEYS.has(key)) return false
  const lower = key.toLowerCase()
  return !EXCLUDED_FIELD_PREFIXES.some((prefix) => lower.startsWith(prefix))
}

/**
 * Constrói campos somente-leitura a partir do customData quando o protocolo
 * ainda não tem ProtocolDataField materializado (protocolos antigos ou cuja
 * criação de campos falhou). Não permite aprovação granular — para isso é
 * preciso rodar o backfill no backend —, mas garante que os dados apareçam.
 */
function buildReadOnlyFieldsFromFormData(formData: Record<string, any>): DataField[] {
  return Object.entries(formData)
    .filter(([key, value]) => isDisplayableCustomKey(key) && value !== null && value !== undefined && String(value) !== '')
    .map(([key, value], index) => ({
      id: `readonly-${key}-${index}`,
      fieldKey: key,
      fieldLabel: formatFieldLabel(key),
      fieldValue: String(value),
      isRequired: false,
      fieldType: null,
      status: 'APPROVED' as const,
      validatedBy: null,
      validatedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      version: 1,
      previousValue: null,
    }))
}

export function ProtocolDataTab({
  protocolId,
  formData,
  onRefresh
}: ProtocolDataTabProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  const [fields, setFields] = useState<DataField[]>([])
  const [stats, setStats] = useState<FieldsStats | null>(null)
  const [isReadOnlyFallback, setIsReadOnlyFallback] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [rejectingFieldId, setRejectingFieldId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)
  const [editedValue, setEditedValue] = useState('')
  const [processingFieldId, setProcessingFieldId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all') // all, pending, approved, rejected
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<{ key: string; label: string } | null>(null)

  const getFullApiUrl = (path: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3060/api'
    return `${apiUrl}${path}`
  }

  // Carregar campos de dados
  useEffect(() => {
    loadDataFields()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocolId, formData])

  const loadDataFields = async () => {
    try {
      setIsLoading(true)
      const url = getFullApiUrl(`/protocols/${protocolId}/data-fields`)
      const response = await fetch(url, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar campos de dados')
      }

      const result = await response.json()
      if (result.success) {
        const loadedFields: DataField[] = result.data.fields || []

        // Fallback: se não há campos materializados mas o protocolo tem
        // customData, exibe os dados em modo somente-leitura para não deixar
        // a aba vazia (resolve protocolos antigos/sem materialização).
        if (loadedFields.length === 0 && formData && Object.keys(formData).length > 0) {
          const readOnlyFields = buildReadOnlyFieldsFromFormData(formData)
          if (readOnlyFields.length > 0) {
            setFields(readOnlyFields)
            setStats(null)
            setIsReadOnlyFallback(true)
            return
          }
        }

        setFields(loadedFields)
        setStats(result.data.stats || null)
        setIsReadOnlyFallback(false)
      }
    } catch (error) {
      console.error('Error loading data fields:', error)

      // Mesmo em erro do endpoint, tenta exibir o customData que já temos.
      if (formData && Object.keys(formData).length > 0) {
        const readOnlyFields = buildReadOnlyFieldsFromFormData(formData)
        if (readOnlyFields.length > 0) {
          setFields(readOnlyFields)
          setStats(null)
          setIsReadOnlyFallback(true)
          return
        }
      }

      toast({
        title: 'Erro ao carregar campos',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Aprovar campo
  const handleApproveField = async (fieldId: string) => {
    try {
      setProcessingFieldId(fieldId)
      const url = getFullApiUrl(`/protocols/${protocolId}/data-fields/${fieldId}/approve`)
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao aprovar campo')
      }

      toast({
        title: 'Campo aprovado',
        description: 'O campo foi aprovado com sucesso'
      })

      await loadDataFields()
      if (onRefresh) onRefresh()
    } catch (error) {
      toast({
        title: 'Erro ao aprovar campo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setProcessingFieldId(null)
    }
  }

  // Rejeitar campo
  const handleRejectField = async (fieldId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Por favor, informe o motivo da rejeição',
        variant: 'destructive'
      })
      return
    }

    try {
      setProcessingFieldId(fieldId)
      const url = getFullApiUrl(`/protocols/${protocolId}/data-fields/${fieldId}/reject`)
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao rejeitar campo')
      }

      toast({
        title: 'Campo rejeitado',
        description: 'O campo foi rejeitado e o cidadão foi notificado'
      })

      setRejectingFieldId(null)
      setRejectionReason('')
      await loadDataFields()
      if (onRefresh) onRefresh()
    } catch (error) {
      toast({
        title: 'Erro ao rejeitar campo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setProcessingFieldId(null)
    }
  }

  // Corrigir campo (cidadão)
  const handleCorrectField = async (fieldId: string) => {
    if (!editedValue.trim()) {
      toast({
        title: 'Valor obrigatório',
        description: 'Por favor, informe o novo valor',
        variant: 'destructive'
      })
      return
    }

    try {
      setProcessingFieldId(fieldId)
      const url = getFullApiUrl(`/protocols/${protocolId}/data-fields/${fieldId}/correct`)
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newValue: editedValue })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao corrigir campo')
      }

      toast({
        title: 'Campo corrigido',
        description: 'O campo foi corrigido e enviado para revalidação'
      })

      setEditingFieldId(null)
      setEditedValue('')
      await loadDataFields()
      if (onRefresh) onRefresh()
    } catch (error) {
      toast({
        title: 'Erro ao corrigir campo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setProcessingFieldId(null)
    }
  }

  // Aprovar todos os campos
  const handleApproveAll = async () => {
    if (!confirm('Tem certeza que deseja aprovar todos os campos pendentes?')) {
      return
    }

    try {
      const url = getFullApiUrl(`/protocols/${protocolId}/data-fields/approve-all`)
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Erro ao aprovar campos')
      }

      const result = await response.json()
      toast({
        title: 'Campos aprovados',
        description: result.message || 'Todos os campos foram aprovados'
      })

      await loadDataFields()
      if (onRefresh) onRefresh()
    } catch (error) {
      toast({
        title: 'Erro ao aprovar campos',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      PENDING: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700', icon: Clock },
      UNDER_REVIEW: { label: 'Em Análise', className: 'bg-blue-100 text-blue-700', icon: Clock },
      APPROVED: { label: 'Aprovado', className: 'bg-green-100 text-green-700', icon: CheckCircle2 },
      REJECTED: { label: 'Rejeitado', className: 'bg-red-100 text-red-700', icon: XCircle },
      CORRECTED: { label: 'Corrigido', className: 'bg-purple-100 text-purple-700', icon: Clock }
    }

    const { label, className, icon: Icon } = config[status as keyof typeof config] || config.PENDING

    return (
      <Badge className={className}>
        <Icon className="h-3 w-3 mr-1" />
        {label}
      </Badge>
    )
  }

  const renderFieldValue = (field: DataField) => {
    const isProcessing = processingFieldId === field.id

    // APROVADO: apenas exibir
    if (field.status === 'APPROVED') {
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{field.fieldValue}</span>
          <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
        </div>
      )
    }

    // REJEITADO: permitir edição para cidadão
    if (field.status === 'REJECTED') {
      if (editingFieldId === field.id) {
        return (
          <div className="space-y-2">
            <Alert variant="destructive" className="mb-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Rejeitado:</strong> {field.rejectionReason}
              </AlertDescription>
            </Alert>

            {field.fieldType === 'textarea' ? (
              <Textarea
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
                rows={3}
                className="text-sm"
                placeholder="Digite o novo valor..."
              />
            ) : (
              <Input
                value={editedValue}
                onChange={(e) => setEditedValue(e.target.value)}
                className="text-sm"
                placeholder="Digite o novo valor..."
              />
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleCorrectField(field.id)}
                disabled={isProcessing}
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar Correção'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingFieldId(null)
                  setEditedValue('')
                }}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )
      }

      return (
        <div className="space-y-2">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Rejeitado:</strong> {field.rejectionReason}
            </AlertDescription>
          </Alert>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">{field.fieldValue}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingFieldId(field.id)
                setEditedValue(field.fieldValue)
              }}
            >
              Corrigir
            </Button>
          </div>
        </div>
      )
    }

    // PENDENTE/CORRIGIDO/EM_ANALISE: analista pode aprovar/rejeitar
    if (['PENDING', 'CORRECTED', 'UNDER_REVIEW'].includes(field.status)) {
      if (rejectingFieldId === field.id) {
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-900 font-medium mb-2">{field.fieldValue}</div>
            <div className="p-3 bg-gray-50 rounded space-y-2">
              <Label className="text-xs">Motivo da rejeição</Label>
              <Textarea
                placeholder="Ex: CPF inválido, área incompatível..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                className="text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleRejectField(field.id)}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Rejeição'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRejectingFieldId(null)
                    setRejectionReason('')
                  }}
                  disabled={isProcessing}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )
      }

      return (
        <div className="space-y-2">
          <div className="text-sm text-gray-900 font-medium">{field.fieldValue}</div>
          {field.status === 'CORRECTED' && field.previousValue && (
            <div className="text-xs text-gray-500">
              Valor anterior: {field.previousValue}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleApproveField(field.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRejectingFieldId(field.id)}
              disabled={isProcessing}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Rejeitar
            </Button>
          </div>
        </div>
      )
    }

    return <span className="text-gray-900">{field.fieldValue}</span>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-600">Carregando campos...</span>
      </div>
    )
  }

  if (fields.length === 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Este protocolo não possui campos de dados adicionais registrados.
            Os dados básicos do cidadão e serviço estão disponíveis na aba "Resumo".
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Filtrar campos baseado no filtro selecionado
  const filteredFields = fields.filter(field => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'pending') return field.status === 'PENDING' || field.status === 'UNDER_REVIEW' || field.status === 'CORRECTED'
    if (filterStatus === 'approved') return field.status === 'APPROVED'
    if (filterStatus === 'rejected') return field.status === 'REJECTED'
    return true
  })

  const requiredFields = filteredFields.filter(f => f.isRequired)
  const optionalFields = filteredFields.filter(f => !f.isRequired)

  return (
    <div className="space-y-4">
      {/* Aviso de modo somente-leitura (dados vindos do customData) */}
      {isReadOnlyFallback && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Exibindo os dados informados na solicitação. Este protocolo ainda não
            possui campos preparados para validação individual — os valores abaixo
            são somente para consulta.
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas com Barra de Progresso */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Progresso de Validação</span>
              {stats.pending > 0 && (
                <Button size="sm" variant="outline" onClick={handleApproveAll}>
                  Aprovar Todos ({stats.pending})
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Barra de Progresso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Aprovação Geral</span>
                <span className="font-semibold text-gray-900">{stats.percentageApproved}%</span>
              </div>
              <Progress value={stats.percentageApproved} className="h-2" />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{stats.approved} de {stats.total} campos aprovados</span>
                {stats.required > 0 && (
                  <span className={stats.allRequiredApproved ? 'text-green-600 font-medium' : ''}>
                    {stats.allRequiredApproved ? '✓ ' : ''}{fields.filter(f => f.isRequired && f.status === 'APPROVED').length}/{stats.required} obrigatórios
                  </span>
                )}
              </div>
            </div>

            {/* Grid de Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-500">Total de Campos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                <div className="text-xs text-gray-500">Aprovados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                <div className="text-xs text-gray-500">Rejeitados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending + stats.underReview + stats.corrected}</div>
                <div className="text-xs text-gray-500">Pendentes</div>
              </div>
            </div>

            {stats.allRequiredApproved && stats.required > 0 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  ✓ Todos os {stats.required} campos obrigatórios foram aprovados!
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtrar Campos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filterStatus} onValueChange={setFilterStatus}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs">
                Todos ({fields.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">
                Pendentes ({fields.filter(f => ['PENDING', 'UNDER_REVIEW', 'CORRECTED'].includes(f.status)).length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-xs">
                Aprovados ({fields.filter(f => f.status === 'APPROVED').length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs">
                Rejeitados ({fields.filter(f => f.status === 'REJECTED').length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Campos Obrigatórios */}
      {requiredFields.length > 0 && (
        <Card>
          <CardHeader className="bg-gray-50">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="text-red-600">*</span>
              Campos Obrigatórios ({requiredFields.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              {requiredFields.map((field) => (
                <div key={field.id} className="grid md:grid-cols-[200px_1fr_auto] gap-4 items-start p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                  {/* Label do Campo */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-900">
                      {field.fieldLabel}
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    {field.version > 1 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Versão {field.version}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 px-1 text-xs"
                          onClick={() => {
                            setSelectedField({ key: field.fieldKey, label: field.fieldLabel })
                            setHistoryDialogOpen(true)
                          }}
                        >
                          <History className="h-3 w-3 mr-1" />
                          Ver histórico
                        </Button>
                      </div>
                    )}
                    {field.validatedAt && (
                      <div className="text-xs text-gray-500">
                        Validado em {new Date(field.validatedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>

                  {/* Valor e Ações */}
                  <div className="flex-1">
                    {renderFieldValue(field)}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-start">
                    {getStatusBadge(field.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campos Opcionais */}
      {optionalFields.length > 0 && (
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              Campos Opcionais ({optionalFields.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-6">
              {optionalFields.map((field) => (
                <div key={field.id} className="grid md:grid-cols-[200px_1fr_auto] gap-4 items-start p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                  {/* Label do Campo */}
                  <div className="space-y-1">
                    <Label className="text-sm font-semibold text-gray-900">
                      {field.fieldLabel}
                    </Label>
                    {field.version > 1 && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Versão {field.version}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 px-1 text-xs"
                          onClick={() => {
                            setSelectedField({ key: field.fieldKey, label: field.fieldLabel })
                            setHistoryDialogOpen(true)
                          }}
                        >
                          <History className="h-3 w-3 mr-1" />
                          Ver histórico
                        </Button>
                      </div>
                    )}
                    {field.validatedAt && (
                      <div className="text-xs text-gray-500">
                        Validado em {new Date(field.validatedAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>

                  {/* Valor e Ações */}
                  <div className="flex-1">
                    {renderFieldValue(field)}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-start">
                    {getStatusBadge(field.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Histórico */}
      {selectedField && (
        <FieldHistoryDialog
          protocolId={protocolId}
          fieldKey={selectedField.key}
          fieldLabel={selectedField.label}
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
        />
      )}
    </div>
  )
}
