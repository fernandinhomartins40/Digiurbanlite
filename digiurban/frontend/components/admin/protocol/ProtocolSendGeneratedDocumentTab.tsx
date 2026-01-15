'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Send } from 'lucide-react'

interface GeneratedDocument {
  id: string
  documentType?: string
  createdAt?: string
}

interface ProtocolSendGeneratedDocumentTabProps {
  protocolId: string
  protocolNumber: string
  citizenEmail?: string
  citizenName?: string
  generatedDocuments: GeneratedDocument[]
}

export function ProtocolSendGeneratedDocumentTab({
  protocolId,
  protocolNumber,
  citizenEmail,
  citizenName,
  generatedDocuments
}: ProtocolSendGeneratedDocumentTabProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [selectedDocumentId, setSelectedDocumentId] = useState('')
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  const sortedDocuments = useMemo(() => {
    return [...generatedDocuments].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return bTime - aTime
    })
  }, [generatedDocuments])

  const selectedId = selectedDocumentId || sortedDocuments[0]?.id || ''

  const handleSend = async () => {
    if (!selectedId) {
      toast({
        title: 'Selecione um documento',
        description: 'Gere um documento antes de enviar',
        variant: 'destructive'
      })
      return
    }

    if (!citizenEmail) {
      toast({
        title: 'Email nao cadastrado',
        description: 'O cidadao nao possui email cadastrado',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSending(true)
      const result = await apiRequest(`/generated-documents/${selectedId}/send`, {
        method: 'POST',
        body: JSON.stringify({
          recipientEmail: citizenEmail,
          recipientName: citizenName,
          subject: `Documento do Protocolo ${protocolNumber}`,
          message: message.trim() || undefined
        })
      })

      if (result.success) {
        toast({
          title: 'Documento enviado',
          description: `Documento enviado para ${citizenEmail}`
        })
        setMessage('')
      } else {
        throw new Error(result.error || 'Erro ao enviar documento')
      }
    } catch (error) {
      toast({
        title: 'Erro ao enviar documento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Send className="h-4 w-4" />
          Enviar Documento Gerado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="generated-select">Documento</Label>
          <select
            id="generated-select"
            className="h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm"
            value={selectedId}
            onChange={(event) => setSelectedDocumentId(event.target.value)}
            disabled={generatedDocuments.length === 0}
          >
            {sortedDocuments.length === 0 ? (
              <option value="">Nenhum documento gerado</option>
            ) : (
              sortedDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.documentType || 'Documento gerado'}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="send-message">Mensagem (opcional)</Label>
          <Textarea
            id="send-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Escreva uma mensagem para o cidadao"
            rows={4}
          />
        </div>

        <Button onClick={handleSend} disabled={isSending || !selectedId}>
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            'Enviar documento'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
