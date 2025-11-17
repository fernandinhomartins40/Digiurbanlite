'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FileText, AlertCircle, Plus, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PendingType, PendingPriority } from '@/types/protocol-enhancements'
import { getFullApiUrl } from '@/lib/api-config'
import { normalizeRequiredDocuments } from '@/lib/normalize-documents'

interface ServiceDocument {
  id?: string
  name: string
  description?: string
  required?: boolean
}

interface QuickActionsDialogProps {
  protocolId: string
  serviceId?: string
  onDocumentRequest: (documentName: string, description: string) => Promise<void>
  onPendingCreate: (title: string, description: string, type: PendingType, priority: PendingPriority, dueDate?: string) => Promise<void>
}

export function QuickActionsDialog({ protocolId, serviceId, onDocumentRequest, onPendingCreate }: QuickActionsDialogProps) {
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false)
  const [isPendingDialogOpen, setIsPendingDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const { toast } = useToast()

  // Documentos do serviço
  const [serviceDocuments, setServiceDocuments] = useState<ServiceDocument[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([])
  const [customDocumentName, setCustomDocumentName] = useState('')
  const [customDocumentDesc, setCustomDocumentDesc] = useState('')

  // Estados para Criar Pendência
  const [pendingTitle, setPendingTitle] = useState('')
  const [pendingDescription, setPendingDescription] = useState('')
  const [pendingType, setPendingType] = useState<PendingType>(PendingType.INFORMATION)
  const [pendingPriority, setPendingPriority] = useState<PendingPriority>(PendingPriority.MEDIUM)
  const [pendingDueDate, setPendingDueDate] = useState('')

  // Carregar documentos do serviço
  useEffect(() => {
    if (isDocumentDialogOpen && serviceId) {
      loadServiceDocuments()
    }
  }, [isDocumentDialogOpen, serviceId])

  const loadServiceDocuments = async () => {
    try {
      setIsLoadingDocs(true)
      const apiUrl = getFullApiUrl(`/api/services/${serviceId}`)
      const response = await fetch(apiUrl, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar serviço')
      }

      const data = await response.json()
      const service = data.data || data

      // Normalizar requiredDocuments para array
      const docs = normalizeRequiredDocuments(service.requiredDocuments)
      setServiceDocuments(docs)
    } catch (error) {
      console.error('Erro ao carregar documentos do serviço:', error)
      setServiceDocuments([])
    } finally {
      setIsLoadingDocs(false)
    }
  }

  const toggleDocument = (docName: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docName)
        ? prev.filter(d => d !== docName)
        : [...prev, docName]
    )
  }

  const handleDocumentRequest = async () => {
    const docsToRequest = [...selectedDocuments]
    if (customDocumentName.trim()) {
      docsToRequest.push(customDocumentName.trim())
    }

    if (docsToRequest.length === 0) {
      toast({
        title: 'Seleção obrigatória',
        description: 'Selecione ao menos um documento ou adicione um personalizado',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Enviar solicitação para cada documento selecionado
      for (const docName of docsToRequest) {
        const doc = serviceDocuments.find(d => d.name === docName)
        const description = docName === customDocumentName.trim()
          ? customDocumentDesc
          : doc?.description || ''

        await onDocumentRequest(docName, description)
      }

      // Limpar campos
      setSelectedDocuments([])
      setCustomDocumentName('')
      setCustomDocumentDesc('')
      setIsDocumentDialogOpen(false)

      toast({
        title: 'Documentos solicitados',
        description: `${docsToRequest.length} documento(s) solicitado(s) ao cidadão`,
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao solicitar documentos',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePendingCreate = async () => {
    if (!pendingTitle.trim() || !pendingDescription.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe título e descrição da pendência',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      await onPendingCreate(
        pendingTitle,
        pendingDescription,
        pendingType,
        pendingPriority,
        pendingDueDate || undefined
      )

      // Limpar campos
      setPendingTitle('')
      setPendingDescription('')
      setPendingType(PendingType.INFORMATION)
      setPendingPriority(PendingPriority.MEDIUM)
      setPendingDueDate('')
      setIsPendingDialogOpen(false)

      toast({
        title: 'Pendência criada',
        description: 'A pendência foi registrada no protocolo',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao criar pendência',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const pendingTypeLabels: Record<PendingType, string> = {
    [PendingType.DOCUMENT]: 'Documento',
    [PendingType.INFORMATION]: 'Informação',
    [PendingType.CORRECTION]: 'Correção',
    [PendingType.VALIDATION]: 'Validação',
    [PendingType.PAYMENT]: 'Pagamento',
  }

  const pendingPriorityLabels: Record<PendingPriority, string> = {
    [PendingPriority.LOW]: 'Baixa',
    [PendingPriority.MEDIUM]: 'Média',
    [PendingPriority.HIGH]: 'Alta',
    [PendingPriority.URGENT]: 'Urgente',
  }

  return (
    <div className="flex gap-2">
      {/* Botão Cobrar Documento */}
      <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Cobrar Documento
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cobrar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Documentos do Serviço */}
            {isLoadingDocs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Carregando documentos...</span>
              </div>
            ) : serviceDocuments.length > 0 ? (
              <div className="space-y-2">
                <Label>Documentos do Serviço</Label>
                <ScrollArea className="h-[200px] border rounded-md p-4">
                  <div className="space-y-3">
                    {serviceDocuments.map((doc, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <Checkbox
                          id={`doc-${index}`}
                          checked={selectedDocuments.includes(doc.name)}
                          onCheckedChange={() => toggleDocument(doc.name)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={`doc-${index}`} className="cursor-pointer font-medium">
                            {doc.name}
                            {doc.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground mt-1">{doc.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground">
                  {selectedDocuments.length} documento(s) selecionado(s)
                </p>
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                Nenhum documento cadastrado para este serviço
              </div>
            )}

            {/* Documento Personalizado */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Plus className="h-4 w-4" />
                <Label>Adicionar Documento Personalizado</Label>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="custom-doc-name">Nome do Documento</Label>
                  <Input
                    id="custom-doc-name"
                    placeholder="Ex: Certidão de Nascimento, Comprovante de Renda..."
                    value={customDocumentName}
                    onChange={(e) => setCustomDocumentName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-doc-desc">Descrição / Instruções</Label>
                  <Textarea
                    id="custom-doc-desc"
                    placeholder="Instruções adicionais sobre o documento..."
                    value={customDocumentDesc}
                    onChange={(e) => setCustomDocumentDesc(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDocumentDialogOpen(false)
                  setSelectedDocuments([])
                  setCustomDocumentName('')
                  setCustomDocumentDesc('')
                }}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handleDocumentRequest} disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Botão Criar Pendência */}
      <Dialog open={isPendingDialogOpen} onOpenChange={setIsPendingDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <AlertCircle className="h-4 w-4 mr-2" />
            Criar Pendência
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Pendência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="pending-title">Título *</Label>
              <Input
                id="pending-title"
                placeholder="Título da pendência"
                value={pendingTitle}
                onChange={(e) => setPendingTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pending-desc">Descrição *</Label>
              <Textarea
                id="pending-desc"
                placeholder="Descreva a pendência..."
                value={pendingDescription}
                onChange={(e) => setPendingDescription(e.target.value)}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pending-type">Tipo</Label>
                <Select
                  value={pendingType}
                  onValueChange={(value) => setPendingType(value as PendingType)}
                >
                  <SelectTrigger id="pending-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(pendingTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pending-priority">Prioridade</Label>
                <Select
                  value={pendingPriority}
                  onValueChange={(value) => setPendingPriority(value as PendingPriority)}
                >
                  <SelectTrigger id="pending-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(pendingPriorityLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pending-due">Data de Vencimento (Opcional)</Label>
              <Input
                id="pending-due"
                type="date"
                value={pendingDueDate}
                onChange={(e) => setPendingDueDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsPendingDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button onClick={handlePendingCreate} disabled={isSubmitting}>
                {isSubmitting ? 'Criando...' : 'Criar Pendência'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
