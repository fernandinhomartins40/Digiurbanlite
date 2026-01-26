'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import { FilePlus, Loader2 } from 'lucide-react'
import { DocumentSigningModalSimple } from '@/components/shared/DocumentSigningModalSimple'

interface DocumentTemplate {
  id: string
  name: string
  documentType?: string
  isActive?: boolean
}

interface ProtocolDocumentGenerationTabProps {
  protocolId: string
  serviceId?: string
  onRefresh: () => void
}

export function ProtocolDocumentGenerationTab({
  protocolId,
  serviceId,
  onRefresh
}: ProtocolDocumentGenerationTabProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedDocument, setGeneratedDocument] = useState<any>(null)
  const [showSigningModal, setShowSigningModal] = useState(false)

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoadingTemplates(true)
        const query = serviceId ? `?serviceId=${serviceId}&isActive=true` : '?isActive=true'
        const response = await apiRequest(`/document-templates${query}`)
        if (response.success) {
          const data = response.data || []
          setTemplates(data)
          if (!selectedTemplateId && data.length > 0) {
            setSelectedTemplateId(data[0].id)
          }
        }
      } catch (error) {
        toast({
          title: 'Erro ao carregar templates',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive'
        })
      } finally {
        setIsLoadingTemplates(false)
      }
    }

    loadTemplates()
  }, [apiRequest, serviceId, selectedTemplateId, toast])

  const handleGenerate = async () => {
    if (!selectedTemplateId) {
      toast({
        title: 'Selecione um template',
        description: 'Escolha um template para gerar o documento',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsGenerating(true)
      const result = await apiRequest(`/protocols/${protocolId}/generate-document`, {
        method: 'POST',
        body: JSON.stringify({
          templateId: selectedTemplateId,
          additionalData: {
            notes: notes.trim()
          }
        })
      })

      if (result.success) {
        toast({
          title: 'Documento gerado',
          description: 'Agora você pode assinar o documento'
        })
        setNotes('')

        // Armazenar documento gerado e abrir modal de assinatura
        setGeneratedDocument(result.document)
        setShowSigningModal(true)
      } else {
        // Verificar se é erro de certificado
        if (result.error === 'CERTIFICATE_REQUIRED' || result.error === 'CERTIFICATE_PENDING') {
          const data = result.data || {}

          if (data.requestCreated) {
            toast({
              title: 'Certificado Digital Necessário',
              description: 'Uma solicitação de certificado foi criada. Aguarde a aprovação do prefeito ou secretário para gerar documentos.',
              variant: 'default',
              duration: 8000
            })
          } else if (data.hasPendingRequest) {
            toast({
              title: 'Certificado Pendente',
              description: 'Sua solicitação de certificado está aguardando aprovação.',
              variant: 'default',
              duration: 6000
            })
          }
          return
        }

        throw new Error(result.message || result.error || 'Erro ao gerar documento')
      }
    } catch (error) {
      toast({
        title: 'Erro ao gerar documento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSigningComplete = () => {
    setShowSigningModal(false)
    setGeneratedDocument(null)
    onRefresh() // Atualizar lista de documentos
  }

  const handleCloseSigningModal = () => {
    setShowSigningModal(false)
    setGeneratedDocument(null)
    onRefresh() // Atualizar lista mesmo sem assinar
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FilePlus className="h-4 w-4" />
          Gerar Documento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="template-select">Template</Label>
          <select
            id="template-select"
            className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
            value={selectedTemplateId}
            onChange={(event) => setSelectedTemplateId(event.target.value)}
            disabled={isLoadingTemplates}
          >
            {templates.length === 0 ? (
              <option value="">Nenhum template disponivel</option>
            ) : (
              templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}{template.documentType ? ` (${template.documentType})` : ''}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="generation-notes">Observacoes (opcional)</Label>
          <Textarea
            id="generation-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Inclua observacoes para o documento"
            rows={3}
          />
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating || isLoadingTemplates}>
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            'Gerar documento'
          )}
        </Button>
      </CardContent>
    </Card>

    {/* Modal de assinatura após geração */}
    {showSigningModal && generatedDocument && (
      <DocumentSigningModalSimple
        document={generatedDocument}
        userType="admin"
        documentType="generated"
        onClose={handleCloseSigningModal}
        onSuccess={handleSigningComplete}
      />
    )}
    </>
  )
}
