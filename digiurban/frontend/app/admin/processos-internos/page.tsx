'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowRightLeft,
  Plus,
  Search,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Archive,
  AlertTriangle,
  Send,
  RotateCcw,
  MessageSquare,
  PenTool,
  Download,
  Inbox,
  BarChart3,
  Settings,
  Eye,
  RefreshCw,
  X,
  Building2,
  User,
  Calendar,
  Hash,
  Flag,
  Lock,
} from 'lucide-react'
import {
  flowClient,
  InternalProcess,
  ProcessDetail,
  ProcessType,
  DashboardData,
} from '@/lib/flow-client'

// ============================================================================
// HELPERS
// ============================================================================

const STATUS_LABELS: Record<string, string> = {
  RASCUNHO: 'Rascunho',
  ABERTO: 'Aberto',
  EM_TRAMITACAO: 'Em Tramitação',
  PENDENTE: 'Pendente',
  CONCLUIDO: 'Concluído',
  ARQUIVADO: 'Arquivado',
  CANCELADO: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  RASCUNHO: 'bg-gray-100 text-gray-700',
  ABERTO: 'bg-blue-100 text-blue-700',
  EM_TRAMITACAO: 'bg-amber-100 text-amber-700',
  PENDENTE: 'bg-orange-100 text-orange-700',
  CONCLUIDO: 'bg-green-100 text-green-700',
  ARQUIVADO: 'bg-slate-100 text-slate-600',
  CANCELADO: 'bg-red-100 text-red-700',
}

const PRIORITY_LABELS: Record<number, string> = {
  0: 'Normal',
  1: 'Urgente',
  2: 'Urgentíssimo',
}

const PRIORITY_COLORS: Record<number, string> = {
  0: 'bg-gray-100 text-gray-600',
  1: 'bg-amber-100 text-amber-700',
  2: 'bg-red-100 text-red-700',
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dateStr))
}

function formatDateOnly(dateStr?: string | null): string {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('pt-BR').format(new Date(dateStr))
}

function isOverdue(process: InternalProcess): boolean {
  if (!process.dueAt) return false
  if (['CONCLUIDO', 'CANCELADO', 'ARQUIVADO'].includes(process.status)) return false
  return new Date(process.dueAt) < new Date()
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: number }) {
  if (priority === 0) return null
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${PRIORITY_COLORS[priority]}`}>
      <Flag className="w-3 h-3" />
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

// ============================================================================
// DIALOG: CRIAR PROCESSO
// ============================================================================

function CreateProcessDialog({
  open,
  onClose,
  processTypes,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  processTypes: ProcessType[]
  onCreated: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    typeId: '',
    subject: '',
    description: '',
    sigilo: 'PUBLICO',
    priority: '0',
    originSectorName: '',
    dueAt: '',
    tags: '',
  })

  const handleSubmit = async () => {
    if (!form.typeId || !form.subject || !form.originSectorName) {
      toast({ title: 'Preencha os campos obrigatórios', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await flowClient.createProcess({
        typeId: form.typeId,
        subject: form.subject,
        description: form.description || undefined,
        sigilo: form.sigilo,
        priority: parseInt(form.priority),
        originSectorId: form.originSectorName,
        originSectorName: form.originSectorName,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : undefined,
        tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      })
      toast({ title: 'Processo criado com sucesso!' })
      onCreated()
      onClose()
      setForm({ typeId: '', subject: '', description: '', sigilo: 'PUBLICO', priority: '0', originSectorName: '', dueAt: '', tags: '' })
    } catch (error) {
      toast({ title: 'Erro ao criar processo', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Processo Interno</DialogTitle>
          <DialogDescription>Preencha os dados para abrir um novo processo</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Tipo de Processo *</Label>
            <Select value={form.typeId} onValueChange={v => setForm(f => ({ ...f, typeId: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {processTypes.filter(t => t.isActive).map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name} ({t.prefix})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assunto *</Label>
            <Input
              value={form.subject}
              onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
              placeholder="Descreva o assunto do processo"
            />
          </div>
          <div>
            <Label>Setor de Origem *</Label>
            <Input
              value={form.originSectorName}
              onChange={e => setForm(f => ({ ...f, originSectorName: e.target.value }))}
              placeholder="Ex: Secretaria de Administração"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Sigilo</Label>
              <Select value={form.sigilo} onValueChange={v => setForm(f => ({ ...f, sigilo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLICO">Público</SelectItem>
                  <SelectItem value="RESTRITO">Restrito</SelectItem>
                  <SelectItem value="CONFIDENCIAL">Confidencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Normal</SelectItem>
                  <SelectItem value="1">Urgente</SelectItem>
                  <SelectItem value="2">Urgentíssimo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Prazo</Label>
            <Input
              type="datetime-local"
              value={form.dueAt}
              onChange={e => setForm(f => ({ ...f, dueAt: e.target.value }))}
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Detalhes adicionais (opcional)"
              rows={3}
            />
          </div>
          <div>
            <Label>Tags (separadas por vírgula)</Label>
            <Input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="Ex: urgente, financeiro, recurso"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Processo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// DIALOG: DESPACHAR PROCESSO
// ============================================================================

function DispatchDialog({
  process,
  onClose,
  onDone,
}: {
  process: InternalProcess | null
  onClose: () => void
  onDone: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [toSectorName, setToSectorName] = useState('')
  const [note, setNote] = useState('')
  const [action, setAction] = useState('ENCAMINHADO')

  const handleDispatch = async () => {
    if (!process || !toSectorName) {
      toast({ title: 'Informe o setor de destino', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await flowClient.dispatchProcess(process.id, {
        toSectorId: toSectorName,
        toSectorName,
        note: note || undefined,
        action,
      })
      toast({ title: `Processo ${process.number} encaminhado para ${toSectorName}` })
      setToSectorName('')
      setNote('')
      onDone()
      onClose()
    } catch (error) {
      toast({ title: 'Erro ao despachar', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!process} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Despachar Processo</DialogTitle>
          <DialogDescription>
            {process?.number} — {process?.subject}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Tipo de Ação</Label>
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ENCAMINHADO">Encaminhar</SelectItem>
                <SelectItem value="DESPACHO">Despacho</SelectItem>
                <SelectItem value="PARECER">Parecer</SelectItem>
                <SelectItem value="ASSINATURA">Para Assinatura</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Setor / Secretaria de Destino *</Label>
            <Input
              value={toSectorName}
              onChange={e => setToSectorName(e.target.value)}
              placeholder="Ex: Secretaria de Finanças"
            />
          </div>
          <div>
            <Label>Despacho / Observação</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Texto do despacho ou parecer..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleDispatch} disabled={loading}>
            <Send className="w-4 h-4 mr-2" />
            {loading ? 'Despachando...' : 'Despachar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// DIALOG: DEVOLVER PROCESSO
// ============================================================================

function ReturnDialog({
  process,
  onClose,
  onDone,
}: {
  process: InternalProcess | null
  onClose: () => void
  onDone: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')

  const handleReturn = async () => {
    if (!process || !note) {
      toast({ title: 'Informe o motivo da devolução', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await flowClient.returnProcess(process.id, note)
      toast({ title: `Processo ${process.number} devolvido ao setor anterior` })
      setNote('')
      onDone()
      onClose()
    } catch (error) {
      toast({ title: 'Erro ao devolver', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!process} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Devolver Processo</DialogTitle>
          <DialogDescription>
            {process?.number} — {process?.subject}
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Label>Motivo da devolução *</Label>
          <Textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Explique o motivo da devolução..."
            rows={4}
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleReturn} disabled={loading} variant="destructive">
            <RotateCcw className="w-4 h-4 mr-2" />
            {loading ? 'Devolvendo...' : 'Devolver'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// DIALOG: CONCLUIR / CANCELAR / ARQUIVAR
// ============================================================================

type ActionType = 'conclude' | 'cancel' | 'archive'

function ActionDialog({
  process,
  actionType,
  onClose,
  onDone,
}: {
  process: InternalProcess | null
  actionType: ActionType | null
  onClose: () => void
  onDone: () => void
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')

  const configMap: Record<ActionType, { title: string; label: string; btn: string; variant: 'default' | 'destructive' | 'outline'; icon: React.ElementType }> = {
    conclude: { title: 'Concluir Processo', label: 'Observação final', btn: 'Concluir', variant: 'default', icon: CheckCircle },
    cancel: { title: 'Cancelar Processo', label: 'Motivo do cancelamento *', btn: 'Cancelar Processo', variant: 'destructive', icon: XCircle },
    archive: { title: 'Arquivar Processo', label: 'Observação', btn: 'Arquivar', variant: 'outline', icon: Archive },
  }

  const handleAction = async () => {
    if (!process || !actionType) return
    if (actionType === 'cancel' && !note) {
      toast({ title: 'Informe o motivo do cancelamento', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      if (actionType === 'conclude') await flowClient.concludeProcess(process.id, note || undefined)
      else if (actionType === 'cancel') await flowClient.cancelProcess(process.id, note)
      else if (actionType === 'archive') await flowClient.archiveProcess(process.id)
      const labels = { conclude: 'concluído', cancel: 'cancelado', archive: 'arquivado' }
      toast({ title: `Processo ${process.number} ${labels[actionType]}` })
      setNote('')
      onDone()
      onClose()
    } catch (error) {
      toast({ title: 'Erro', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (!actionType || !process) return null
  const cfg = configMap[actionType]
  const Icon = cfg.icon

  return (
    <Dialog open={!!process && !!actionType} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{cfg.title}</DialogTitle>
          <DialogDescription>
            {process.number} — {process.subject}
          </DialogDescription>
        </DialogHeader>
        {actionType !== 'archive' && (
          <div className="py-2">
            <Label>{cfg.label}</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Digite aqui..."
              rows={3}
              className="mt-2"
            />
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAction} disabled={loading} variant={cfg.variant}>
            <Icon className="w-4 h-4 mr-2" />
            {loading ? 'Processando...' : cfg.btn}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// PAINEL DE DETALHES DO PROCESSO (drawer lateral)
// ============================================================================

function ProcessDetailPanel({
  processId,
  onClose,
  onRefresh,
}: {
  processId: string | null
  onClose: () => void
  onRefresh: () => void
}) {
  const { toast } = useToast()
  const [process, setProcess] = useState<ProcessDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('tramitacao')
  const [comment, setComment] = useState('')
  const [addingComment, setAddingComment] = useState(false)
  const [generatingDoc, setGeneratingDoc] = useState(false)
  const [dispatchOpen, setDispatchOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [actionType, setActionType] = useState<ActionType | null>(null)

  const loadProcess = useCallback(async () => {
    if (!processId) return
    setLoading(true)
    try {
      const p = await flowClient.getProcess(processId)
      setProcess(p)
    } catch {
      toast({ title: 'Erro ao carregar processo', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [processId, toast])

  useEffect(() => {
    loadProcess()
  }, [loadProcess])

  const handleAddComment = async () => {
    if (!process || !comment.trim()) return
    setAddingComment(true)
    try {
      await flowClient.addComment(process.id, comment)
      setComment('')
      toast({ title: 'Comentário adicionado' })
      loadProcess()
    } catch {
      toast({ title: 'Erro ao comentar', variant: 'destructive' })
    } finally {
      setAddingComment(false)
    }
  }

  const handleGenerateDoc = async (templateName: string) => {
    if (!process) return
    setGeneratingDoc(true)
    try {
      await flowClient.generateDocument(process.id, templateName)
      toast({ title: 'Documento gerado com sucesso!' })
      loadProcess()
    } catch {
      toast({ title: 'Erro ao gerar documento', variant: 'destructive' })
    } finally {
      setGeneratingDoc(false)
    }
  }

  if (!processId) return null

  const isFinal = process ? ['CONCLUIDO', 'CANCELADO', 'ARQUIVADO'].includes(process.status) : false

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="flex-1 bg-black/20" onClick={onClose} />
        <div className="w-[680px] bg-white shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="h-5 w-40 bg-gray-200 animate-pulse rounded" />
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-blue-700">{process?.number}</span>
                    {process && <StatusBadge status={process.status} />}
                    {process && <PriorityBadge priority={process.priority} />}
                    {process && isOverdue(process) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                        <AlertTriangle className="w-3 h-3" /> Vencido
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 mt-1 truncate">{process?.subject}</p>
                  <p className="text-xs text-gray-500">{process?.type.name} · {process?.currentSectorName}</p>
                </>
              )}
            </div>
            <div className="flex items-center gap-1 ml-3">
              <Button size="sm" variant="ghost" onClick={loadProcess}><RefreshCw className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={onClose}><X className="w-4 h-4" /></Button>
            </div>
          </div>

          {/* Ações rápidas */}
          {process && !isFinal && (
            <div className="flex gap-2 p-3 border-b bg-white flex-wrap">
              <Button size="sm" onClick={() => setDispatchOpen(true)}>
                <Send className="w-3.5 h-3.5 mr-1" /> Despachar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setReturnOpen(true)}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Devolver
              </Button>
              <Button size="sm" variant="outline" onClick={() => setActionType('conclude')}>
                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Concluir
              </Button>
              <Button size="sm" variant="outline" onClick={() => setActionType('cancel')}>
                <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelar
              </Button>
            </div>
          )}
          {process && (process.status === 'CONCLUIDO' || process.status === 'CANCELADO') && (
            <div className="flex gap-2 p-3 border-b">
              <Button size="sm" variant="outline" onClick={() => setActionType('archive')}>
                <Archive className="w-3.5 h-3.5 mr-1" /> Arquivar
              </Button>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-4 mt-3 w-auto justify-start">
              <TabsTrigger value="tramitacao">Tramitação</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="comentarios">Comentários</TabsTrigger>
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
              {/* Tramitação */}
              <TabsContent value="tramitacao" className="mt-0 space-y-3">
                <h3 className="text-sm font-medium text-gray-700 mt-2">Histórico de Movimentações</h3>
                {loading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 animate-pulse rounded" />)}</div>
                ) : (process?.history.length ?? 0) === 0 ? (
                  <p className="text-sm text-gray-500 py-4 text-center">Nenhuma movimentação registrada</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-4">
                      {process?.history.map((h) => (
                        <div key={h.id} className="flex gap-3 relative">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 z-10">
                            <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{h.description}</p>
                            {h.note && (
                              <div className="mt-1 p-2 bg-gray-50 rounded text-sm text-gray-700 border-l-2 border-blue-300">
                                {h.note}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{h.userName}</span>
                              <span className="text-xs text-gray-400">·</span>
                              <span className="text-xs text-gray-400">{formatDate(h.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Documentos */}
              <TabsContent value="documentos" className="mt-0 space-y-3">
                <div className="flex items-center justify-between mt-2">
                  <h3 className="text-sm font-medium text-gray-700">Documentos do Processo</h3>
                  <div className="flex gap-2 flex-wrap">
                    {['despacho', 'memorando', 'oficio'].map(t => (
                      <Button key={t} size="sm" variant="outline" disabled={generatingDoc} onClick={() => handleGenerateDoc(t)}>
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        {generatingDoc ? '...' : t.charAt(0).toUpperCase() + t.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                {loading ? (
                  <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 bg-gray-100 animate-pulse rounded" />)}</div>
                ) : (process?.documents.length ?? 0) === 0 ? (
                  <div className="py-8 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Nenhum documento anexado</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {process?.documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">{doc.documentType}</span>
                              {doc.isSigned && (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                  <PenTool className="w-3 h-3" /> Assinado
                                </span>
                              )}
                              <span className="text-xs text-gray-400">{formatDate(doc.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" asChild>
                          <a href={doc.filePath} target="_blank" rel="noopener noreferrer" title={`Baixar ${doc.name}`}>
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Comentários */}
              <TabsContent value="comentarios" className="mt-0 space-y-3">
                <h3 className="text-sm font-medium text-gray-700 mt-2">Anotações e Comentários</h3>
                {(process?.comments || []).filter(c => !c.isDeleted).length === 0 && !loading && (
                  <p className="text-sm text-gray-500 py-4 text-center">Nenhum comentário registrado</p>
                )}
                <div className="space-y-3">
                  {(process?.comments || []).filter(c => !c.isDeleted).map(c => (
                    <div key={c.id} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{c.userName}</span>
                        <span className="text-xs text-gray-400">{formatDate(c.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.content}</p>
                      {c.isInternal && (
                        <span className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Nota interna
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-2">
                  <Textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Adicionar anotação ao processo..."
                    rows={3}
                  />
                  <Button size="sm" onClick={handleAddComment} disabled={addingComment || !comment.trim()}>
                    <MessageSquare className="w-3.5 h-3.5 mr-1" />
                    {addingComment ? 'Salvando...' : 'Adicionar Anotação'}
                  </Button>
                </div>
              </TabsContent>

              {/* Detalhes */}
              <TabsContent value="detalhes" className="mt-0">
                {process && (
                  <div className="space-y-4 mt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Hash className="w-3 h-3" /> Número</p>
                        <p className="font-mono text-sm font-bold">{process.number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><FileText className="w-3 h-3" /> Tipo</p>
                        <p className="text-sm">{process.type.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Setor Origem</p>
                        <p className="text-sm">{process.originSectorName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" /> Setor Atual</p>
                        <p className="text-sm">{process.currentSectorName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Aberto por</p>
                        <p className="text-sm">{process.createdByName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Responsável</p>
                        <p className="text-sm">{process.currentUserName || 'Não atribuído'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Aberto em</p>
                        <p className="text-sm">{formatDateOnly(process.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Prazo</p>
                        <p className={`text-sm ${isOverdue(process) ? 'text-red-600 font-medium' : ''}`}>
                          {process.dueAt ? formatDateOnly(process.dueAt) : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Lock className="w-3 h-3" /> Sigilo</p>
                        <p className="text-sm">{process.sigilo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Flag className="w-3 h-3" /> Prioridade</p>
                        <p className="text-sm">{PRIORITY_LABELS[process.priority] || 'Normal'}</p>
                      </div>
                    </div>
                    {process.description && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Descrição</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">{process.description}</p>
                      </div>
                    )}
                    {process.tags.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {process.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      {process && (
        <>
          <DispatchDialog process={dispatchOpen ? process : null} onClose={() => setDispatchOpen(false)} onDone={() => { loadProcess(); onRefresh() }} />
          <ReturnDialog process={returnOpen ? process : null} onClose={() => setReturnOpen(false)} onDone={() => { loadProcess(); onRefresh() }} />
          <ActionDialog process={actionType ? process : null} actionType={actionType} onClose={() => setActionType(null)} onDone={() => { loadProcess(); onRefresh() }} />
        </>
      )}
    </>
  )
}

// ============================================================================
// CARD DE PROCESSO
// ============================================================================

function ProcessCard({
  process,
  onView,
  onDispatch,
  onReturn,
  onAction,
}: {
  process: InternalProcess
  onView: () => void
  onDispatch: () => void
  onReturn: () => void
  onAction: (type: ActionType) => void
}) {
  const overdue = isOverdue(process)
  const isFinal = ['CONCLUIDO', 'CANCELADO', 'ARQUIVADO'].includes(process.status)

  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${overdue ? 'border-red-200 bg-red-50/30' : 'bg-white hover:border-blue-200'}`}
      onClick={onView}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs font-bold text-blue-700">{process.number}</span>
            <StatusBadge status={process.status} />
            <PriorityBadge priority={process.priority} />
            {overdue && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                <AlertTriangle className="w-3 h-3" /> Vencido
              </span>
            )}
          </div>
          <p className="font-medium text-gray-900 text-sm truncate">{process.subject}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> {process.currentSectorName}
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <FileText className="w-3 h-3" /> {process.type.name}
            </span>
            {process.dueAt && (
              <span className={`text-xs flex items-center gap-1 ${overdue ? 'text-red-600' : 'text-gray-500'}`}>
                <Clock className="w-3 h-3" /> {formatDateOnly(process.dueAt)}
              </span>
            )}
          </div>
          {process._count && (
            <div className="flex items-center gap-3 mt-1">
              {(process._count.documents ?? 0) > 0 && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {process._count.documents} doc{(process._count.documents ?? 0) !== 1 ? 's' : ''}
                </span>
              )}
              {(process._count.dispatches ?? 0) > 0 && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" /> {process._count.dispatches} despacho{(process._count.dispatches ?? 0) !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
          {!isFinal && (
            <>
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={onDispatch}>
                <Send className="w-3 h-3 mr-1" /> Despachar
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={onReturn}>
                <RotateCcw className="w-3 h-3 mr-1" /> Devolver
              </Button>
              <Button size="sm" variant="ghost" className="text-xs h-7 text-green-700" onClick={() => onAction('conclude')}>
                <CheckCircle className="w-3 h-3 mr-1" /> Concluir
              </Button>
            </>
          )}
          {(process.status === 'CONCLUIDO' || process.status === 'CANCELADO') && (
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => onAction('archive')}>
              <Archive className="w-3 h-3 mr-1" /> Arquivar
            </Button>
          )}
          <Button size="sm" variant="ghost" className="text-xs h-7" onClick={onView}>
            <Eye className="w-3 h-3 mr-1" /> Ver
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TAB: LISTA DE PROCESSOS
// ============================================================================

function ProcessesTab({ processTypes }: { processTypes: ProcessType[] }) {
  const { toast } = useToast()
  const [processes, setProcesses] = useState<InternalProcess[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterType, setFilterType] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dispatchProcess, setDispatchProcess] = useState<InternalProcess | null>(null)
  const [returnProcess, setReturnProcess] = useState<InternalProcess | null>(null)
  const [actionProcess, setActionProcess] = useState<InternalProcess | null>(null)
  const [actionType, setActionType] = useState<ActionType | null>(null)

  const loadProcesses = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number | undefined> = { page, limit: 20 }
      if (search) params.search = search
      if (filterStatus !== 'all') params.status = filterStatus
      if (filterType !== 'all') params.typeId = filterType
      if (filterPriority !== 'all') params.priority = parseInt(filterPriority)
      const result = await flowClient.listProcesses(params)
      setProcesses(result.data)
      setTotal(result.pagination.total)
    } catch {
      toast({ title: 'Erro ao carregar processos', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [page, search, filterStatus, filterType, filterPriority, toast])

  useEffect(() => {
    loadProcesses()
  }, [loadProcesses])

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por número, assunto, responsável..."
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="ABERTO">Aberto</SelectItem>
            <SelectItem value="EM_TRAMITACAO">Em Tramitação</SelectItem>
            <SelectItem value="PENDENTE">Pendente</SelectItem>
            <SelectItem value="CONCLUIDO">Concluído</SelectItem>
            <SelectItem value="CANCELADO">Cancelado</SelectItem>
            <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={v => { setFilterType(v); setPage(1) }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {processTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={v => { setFilterPriority(v); setPage(1) }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Prioridade" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer prioridade</SelectItem>
            <SelectItem value="0">Normal</SelectItem>
            <SelectItem value="1">Urgente</SelectItem>
            <SelectItem value="2">Urgentíssimo</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => flowClient.exportCSV({
          status: filterStatus !== 'all' ? filterStatus : undefined,
          typeId: filterType !== 'all' ? filterType : undefined,
        })}>
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Novo Processo
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{total} processo{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</span>
        <Button variant="ghost" size="sm" onClick={loadProcesses}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />)}
        </div>
      ) : processes.length === 0 ? (
        <div className="py-16 text-center">
          <ArrowRightLeft className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum processo encontrado</p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Criar Primeiro Processo
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {processes.map(p => (
            <ProcessCard
              key={p.id}
              process={p}
              onView={() => setSelectedId(p.id)}
              onDispatch={() => setDispatchProcess(p)}
              onReturn={() => setReturnProcess(p)}
              onAction={(type) => { setActionProcess(p); setActionType(type) }}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
          <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Próxima</Button>
        </div>
      )}

      <CreateProcessDialog open={createOpen} onClose={() => setCreateOpen(false)} processTypes={processTypes} onCreated={loadProcesses} />
      <DispatchDialog process={dispatchProcess} onClose={() => setDispatchProcess(null)} onDone={loadProcesses} />
      <ReturnDialog process={returnProcess} onClose={() => setReturnProcess(null)} onDone={loadProcesses} />
      <ActionDialog process={actionProcess} actionType={actionType} onClose={() => { setActionProcess(null); setActionType(null) }} onDone={loadProcesses} />
      {selectedId && <ProcessDetailPanel processId={selectedId} onClose={() => setSelectedId(null)} onRefresh={loadProcesses} />}
    </div>
  )
}

// ============================================================================
// TAB: CAIXA DE ENTRADA
// ============================================================================

function InboxTab() {
  const { toast } = useToast()
  const [sectorInput, setSectorInput] = useState('')
  const [sectorId, setSectorId] = useState('')
  const [processes, setProcesses] = useState<InternalProcess[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dispatchProcess, setDispatchProcess] = useState<InternalProcess | null>(null)
  const [returnProcess, setReturnProcess] = useState<InternalProcess | null>(null)
  const [actionProcess, setActionProcess] = useState<InternalProcess | null>(null)
  const [actionType, setActionType] = useState<ActionType | null>(null)

  const loadInbox = useCallback(async () => {
    if (!sectorId) return
    setLoading(true)
    try {
      const data = await flowClient.getInbox(sectorId)
      setProcesses(data)
    } catch {
      toast({ title: 'Erro ao carregar caixa de entrada', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [sectorId, toast])

  useEffect(() => { loadInbox() }, [loadInbox])

  const handleMarkAllRead = async () => {
    if (!sectorId) return
    try {
      await flowClient.markAllDispatchesRead(sectorId)
      toast({ title: 'Todos os despachos marcados como lidos' })
    } catch {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Caixa de Entrada</CardTitle>
          <CardDescription>Processos aguardando ação no seu setor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={sectorInput}
              onChange={e => setSectorInput(e.target.value)}
              placeholder="Nome do setor"
              className="flex-1"
              onKeyDown={e => e.key === 'Enter' && setSectorId(sectorInput)}
            />
            <Button onClick={() => setSectorId(sectorInput)}>
              <Inbox className="w-4 h-4 mr-2" /> Buscar
            </Button>
            {sectorId && (
              <Button variant="outline" onClick={handleMarkAllRead}>Marcar Lidos</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {sectorId && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-800">
              Processos em {sectorId} <span className="text-sm font-normal text-gray-500">({processes.length})</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={loadInbox}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Atualizar
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />)}</div>
          ) : processes.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
              <p className="text-gray-500">Caixa de entrada vazia</p>
            </div>
          ) : (
            <div className="space-y-3">
              {processes.map(p => (
                <ProcessCard
                  key={p.id}
                  process={p}
                  onView={() => setSelectedId(p.id)}
                  onDispatch={() => setDispatchProcess(p)}
                  onReturn={() => setReturnProcess(p)}
                  onAction={(type) => { setActionProcess(p); setActionType(type) }}
                />
              ))}
            </div>
          )}

          <DispatchDialog process={dispatchProcess} onClose={() => setDispatchProcess(null)} onDone={loadInbox} />
          <ReturnDialog process={returnProcess} onClose={() => setReturnProcess(null)} onDone={loadInbox} />
          <ActionDialog process={actionProcess} actionType={actionType} onClose={() => { setActionProcess(null); setActionType(null) }} onDone={loadInbox} />
          {selectedId && <ProcessDetailPanel processId={selectedId} onClose={() => setSelectedId(null)} onRefresh={loadInbox} />}
        </>
      )}
    </div>
  )
}

// ============================================================================
// TAB: DASHBOARD / KPIs
// ============================================================================

function DashboardTab() {
  const { toast } = useToast()
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [overdue, setOverdue] = useState<InternalProcess[]>([])
  const [bottlenecks, setBottlenecks] = useState<{ sectorId: string; sectorName: string; count: number; oldestDays: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [dash, ov, bott] = await Promise.all([
        flowClient.getDashboard(),
        flowClient.getOverdueProcesses(),
        flowClient.getBottlenecks(),
      ])
      setDashboard(dash)
      setOverdue(ov)
      setBottlenecks(bott)
    } catch {
      toast({ title: 'Erro ao carregar dashboard', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadData() }, [loadData])

  const r = dashboard?.resumo
  const stats = [
    { label: 'Ativos', value: r?.ativos ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', icon: ArrowRightLeft },
    { label: 'Abertos', value: r?.abertos ?? 0, color: 'text-sky-600', bg: 'bg-sky-50', icon: FileText },
    { label: 'Em Tramitação', value: r?.emTramitacao ?? 0, color: 'text-amber-600', bg: 'bg-amber-50', icon: Send },
    { label: 'Pendentes', value: r?.pendentes ?? 0, color: 'text-orange-600', bg: 'bg-orange-50', icon: Clock },
    { label: 'Concluídos', value: r?.concluidos ?? 0, color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
    { label: 'Urgentes', value: r?.urgentes ?? 0, color: 'text-red-600', bg: 'bg-red-50', icon: Flag },
    { label: 'Vencidos', value: r?.vencidos ?? 0, color: 'text-red-700', bg: 'bg-red-100', icon: AlertTriangle },
    { label: 'Arquivados', value: r?.arquivados ?? 0, color: 'text-slate-600', bg: 'bg-slate-50', icon: Archive },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />)}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {dashboard && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Últimos 30 dias</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{dashboard.ultimos30Dias.criados}</p>
              <p className="text-xs text-gray-500">Processos criados</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{dashboard.ultimos30Dias.concluidos}</p>
              <p className="text-xs text-gray-500">Processos concluídos</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dashboard && dashboard.porTipo.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Por Tipo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {dashboard.porTipo.sort((a, b) => b.count - a.count).slice(0, 6).map(t => (
                <div key={t.tipoId} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 truncate flex-1">{t.tipoNome}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        // eslint-disable-next-line react/forbid-component-props
                        style={{ width: `${Math.min(100, (t.count / Math.max(r?.ativos ?? 1, 1)) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-800 w-5 text-right">{t.count}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {bottlenecks.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Gargalos por Setor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bottlenecks.slice(0, 5).map(b => (
                <div key={b.sectorId} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 truncate flex-1">{b.sectorName}</span>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span>{b.count} proc.</span>
                    <span className={b.oldestDays > 7 ? 'text-red-600 font-medium' : ''}>{b.oldestDays}d</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {overdue.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" /> {overdue.length} Processo{overdue.length !== 1 ? 's' : ''} com Prazo Vencido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdue.slice(0, 10).map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-100 cursor-pointer hover:bg-red-100"
                onClick={() => setSelectedId(p.id)}
              >
                <div>
                  <span className="font-mono text-xs font-bold text-red-700">{p.number}</span>
                  <span className="text-xs text-gray-700 ml-2">{p.subject.slice(0, 40)}</span>
                </div>
                <span className="text-xs text-red-600">Venceu {formatDateOnly(p.dueAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedId && <ProcessDetailPanel processId={selectedId} onClose={() => setSelectedId(null)} onRefresh={loadData} />}
    </div>
  )
}

// ============================================================================
// TAB: CONFIGURAÇÕES
// ============================================================================

function ConfigTab({ processTypes, onRefresh }: { processTypes: ProcessType[]; onRefresh: () => void }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [newType, setNewType] = useState({ name: '', prefix: '', description: '', defaultSlaHours: '168', defaultDocumentTemplate: 'memorando' })

  const handleCreateType = async () => {
    if (!newType.name || !newType.prefix) {
      toast({ title: 'Nome e prefixo são obrigatórios', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await flowClient.createProcessType({
        name: newType.name,
        prefix: newType.prefix.toUpperCase(),
        description: newType.description || undefined,
        defaultSlaHours: parseInt(newType.defaultSlaHours) || 168,
        defaultDocumentTemplate: newType.defaultDocumentTemplate,
        isActive: true,
      })
      toast({ title: 'Tipo de processo criado!' })
      setCreateOpen(false)
      setNewType({ name: '', prefix: '', description: '', defaultSlaHours: '168', defaultDocumentTemplate: 'memorando' })
      onRefresh()
    } catch (error) {
      toast({ title: 'Erro ao criar tipo', description: (error as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Tipos de Processo</CardTitle>
              <CardDescription>Gerencie os tipos disponíveis e seus prefixos de numeração</CardDescription>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Novo Tipo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {processTypes.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">{t.prefix}</span>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    {t.description && <p className="text-xs text-gray-500">{t.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>SLA: {t.defaultSlaHours}h</span>
                  {t._count && <span>{t._count.processes} processos</span>}
                  <Badge variant={t.isActive ? 'default' : 'secondary'}>{t.isActive ? 'Ativo' : 'Inativo'}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Templates de Documentos</CardTitle>
          <CardDescription>Templates disponíveis para geração automática de PDFs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {['despacho', 'memorando', 'oficio', 'capa-processo'].map(t => (
              <div key={t} className="flex items-center gap-3 p-3 border rounded-lg">
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium capitalize">{t.replace('-', ' ')}</p>
                  <p className="text-xs text-gray-500">Template HTML Handlebars</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Novo Tipo de Processo</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome *</Label>
              <Input value={newType.name} onChange={e => setNewType(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Portaria" />
            </div>
            <div>
              <Label>Prefixo * (até 5 letras)</Label>
              <Input value={newType.prefix} onChange={e => setNewType(f => ({ ...f, prefix: e.target.value.toUpperCase().slice(0, 5) }))} placeholder="Ex: POR" maxLength={5} />
            </div>
            <div>
              <Label>SLA padrão (horas)</Label>
              <Input type="number" value={newType.defaultSlaHours} onChange={e => setNewType(f => ({ ...f, defaultSlaHours: e.target.value }))} />
            </div>
            <div>
              <Label>Template padrão</Label>
              <Select value={newType.defaultDocumentTemplate} onValueChange={v => setNewType(f => ({ ...f, defaultDocumentTemplate: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="memorando">Memorando</SelectItem>
                  <SelectItem value="oficio">Ofício</SelectItem>
                  <SelectItem value="despacho">Despacho</SelectItem>
                  <SelectItem value="capa-processo">Capa de Processo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input value={newType.description} onChange={e => setNewType(f => ({ ...f, description: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateType} disabled={loading}>{loading ? 'Criando...' : 'Criar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

export default function ProcessosInternosPage() {
  const { toast } = useToast()
  const [processTypes, setProcessTypes] = useState<ProcessType[]>([])
  const [typesLoaded, setTypesLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState('processos')

  const loadTypes = useCallback(async () => {
    try {
      const types = await flowClient.listProcessTypes()
      setProcessTypes(types)
    } catch {
      toast({ title: 'Erro ao carregar tipos de processo', variant: 'destructive' })
    } finally {
      setTypesLoaded(true)
    }
  }, [toast])

  useEffect(() => { loadTypes() }, [loadTypes])

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-blue-600" />
            Processos Internos
          </h1>
          <p className="text-gray-500 mt-1">Gestão de tramitação administrativa — Memorandos, Ofícios e Processos</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadTypes}>
          <RefreshCw className="w-4 h-4 mr-1" /> Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="processos"><FileText className="w-4 h-4 mr-2" /> Processos</TabsTrigger>
          <TabsTrigger value="inbox"><Inbox className="w-4 h-4 mr-2" /> Caixa de Entrada</TabsTrigger>
          <TabsTrigger value="dashboard"><BarChart3 className="w-4 h-4 mr-2" /> Dashboard</TabsTrigger>
          <TabsTrigger value="config"><Settings className="w-4 h-4 mr-2" /> Configurações</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="processos">
            {typesLoaded && <ProcessesTab processTypes={processTypes} />}
          </TabsContent>
          <TabsContent value="inbox">
            <InboxTab />
          </TabsContent>
          <TabsContent value="dashboard">
            <DashboardTab />
          </TabsContent>
          <TabsContent value="config">
            <ConfigTab processTypes={processTypes} onRefresh={loadTypes} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
