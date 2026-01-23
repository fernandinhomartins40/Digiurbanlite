'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Send, FileText, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface GeneratedDocument {
  id: string
  documentType?: string
  name?: string
  fileName?: string
  createdAt?: string
  wasSent?: boolean
  sentAt?: string
  sentTo?: string
}

interface ProtocolSendGeneratedDocumentTabProps {
  protocolId: string
  protocolNumber: string
  citizenId?: string
  citizenEmail?: string
  citizenName?: string
  generatedDocuments: GeneratedDocument[]
  onRefresh?: () => void
}

export function ProtocolSendGeneratedDocumentTab({
  protocolId,
  protocolNumber,
  citizenId,
  citizenEmail,
  citizenName,
  generatedDocuments,
  onRefresh
}: ProtocolSendGeneratedDocumentTabProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const sortedDocuments = useMemo(() => {
    return [...generatedDocuments].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })
  }, [generatedDocuments])

  const toggleDocument = (docId: string) => {
    setSelectedDocumentIds(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedDocumentIds.length === sortedDocuments.length) {
      setSelectedDocumentIds([])
    } else {
      setSelectedDocumentIds(sortedDocuments.map(doc => doc.id))
    }
  }

  const handleSend = async () => {
    if (selectedDocumentIds.length === 0) {
      toast({
        title: 'Selecione ao menos um documento',
        description: 'Marque os documentos que deseja enviar',
        variant: 'destructive'
      })
      return
    }

    if (!citizenEmail) {
      toast({
        title: 'Email não cadastrado',
        description: 'O cidadão não possui email cadastrado',
        variant: 'destructive'
      })
      return
    }

    if (!citizenId) {
      toast({
        title: 'Cidadão não identificado',
        description: 'Não foi possível identificar o cidadão',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSending(true)
      const result = await apiRequest(`/generated-documents/send-multiple`, {
        method: 'POST',
        body: JSON.stringify({
          documentIds: selectedDocumentIds,
          citizenId,
          recipientEmail: citizenEmail,
          recipientName: citizenName,
          subject: `Documentos do Protocolo ${protocolNumber}`,
          message: message.trim() || undefined,
          protocolNumber
        })
      })

      if (result.success) {
        toast({
          title: 'Documentos enviados',
          description: `${selectedDocumentIds.length} documento(s) enviado(s) para ${citizenEmail} e adicionado(s) aos documentos do cidadão`
        })
        setMessage('')
        setSelectedDocumentIds([])
        onRefresh?.()
      } else {
        throw new Error(result.error || 'Erro ao enviar documentos')
      }
    } catch (error) {
      toast({
        title: 'Erro ao enviar documentos',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  const allSelected = sortedDocuments.length > 0 && selectedDocumentIds.length === sortedDocuments.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="h-4 w-4" />
          Enviar Documentos Gerados
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Selecione os documentos para enviar por email e adicionar aos documentos do cidadão
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seleção de Documentos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Documentos Disponíveis ({sortedDocuments.length})</Label>
            {sortedDocuments.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
              >
                {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
              </Button>
            )}
          </div>

          {sortedDocuments.length === 0 ? (
            <div className="p-8 text-center border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhum documento gerado ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Vá para a aba "Gerar Documentos" para criar documentos
              </p>
            </div>
          ) : (
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {sortedDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors ${
                    selectedDocumentIds.includes(doc.id) ? 'bg-blue-50' : ''
                  }`}
                >
                  <Checkbox
                    id={`doc-${doc.id}`}
                    checked={selectedDocumentIds.includes(doc.id)}
                    onCheckedChange={() => toggleDocument(doc.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      htmlFor={`doc-${doc.id}`}
                      className="text-sm font-medium cursor-pointer block"
                    >
                      {doc.name || doc.documentType || doc.fileName || 'Documento gerado'}
                    </label>
                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      {doc.fileName && (
                        <p className="truncate">Arquivo: {doc.fileName}</p>
                      )}
                      {doc.createdAt && (
                        <p>
                          Gerado em: {format(new Date(doc.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                      {doc.wasSent && doc.sentAt && (
                        <p className="text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Enviado em: {format(new Date(doc.sentAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          {doc.sentTo && ` para ${doc.sentTo}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedDocumentIds.length > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                {selectedDocumentIds.length} documento(s) selecionado(s)
              </p>
            </div>
          )}
        </div>

        {/* Informações do Destinatário */}
        {citizenEmail && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Destinatário:</span> {citizenName}
            </p>
            <p className="text-sm text-muted-foreground">{citizenEmail}</p>
          </div>
        )}

        {/* Mensagem Opcional */}
        <div className="space-y-2">
          <Label htmlFor="send-message">Mensagem Personalizada (opcional)</Label>
          <Textarea
            id="send-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Escreva uma mensagem para o cidadão (será incluída no email e na notificação)"
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Os documentos serão enviados por email e ficarão disponíveis na aba "Meus Documentos" do cidadão
          </p>
        </div>

        {/* Botão de Envio */}
        <Button
          onClick={handleSend}
          disabled={isSending || selectedDocumentIds.length === 0 || !citizenEmail}
          className="w-full"
          size="lg"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando {selectedDocumentIds.length} documento(s)...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar {selectedDocumentIds.length > 0 ? `${selectedDocumentIds.length} ` : ''}documento(s)
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
