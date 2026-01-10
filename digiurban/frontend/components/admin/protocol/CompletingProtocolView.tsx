'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle2,
  FileText,
  Send,
  AlertCircle,
  Download,
  Eye,
  FilePlus,
  MessageSquare,
  Clock
} from 'lucide-react'
import { WorkflowProgressBar } from './WorkflowProgressBar'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'

interface CompletingProtocolViewProps {
  protocol: {
    id: string
    protocolNumber: string
    status: string
    citizenId: string
    citizen?: {
      name: string
      email?: string
    }
  }
  stages: Array<{
    id: string
    stageName: string
    stageOrder: number
    status: string
    completedAt?: Date | string
    notes?: string
  }>
  documents: any[]
  formData: Record<string, any>
  onComplete: () => void
}

export function CompletingProtocolView({
  protocol,
  stages,
  documents,
  formData,
  onComplete
}: CompletingProtocolViewProps) {
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'summary-final' | 'document-generation' | 'send'>('summary-final')
  const [finalNotes, setFinalNotes] = useState('')
  const [generatedDocument, setGeneratedDocument] = useState<{ url: string; name: string } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const [sendMessage, setSendMessage] = useState('')

  // Estatísticas
  const completedStages = stages.filter(s => s.status === 'COMPLETED').length
  const approvedDocs = documents.filter(d => d.status === 'APPROVED').length
  const totalDocs = documents.length

  // Gerar documento final
  const handleGenerateDocument = async () => {
    setIsGenerating(true)
    try {
      const result = await apiRequest(`/protocols/${protocol.id}/generate-completion-document`, {
        method: 'POST',
        body: JSON.stringify({
          includeStageHistory: true,
          includeDocuments: true,
          includeFormData: true,
          notes: finalNotes
        })
      })

      if (result.success) {
        setGeneratedDocument({
          url: result.data.documentUrl,
          name: result.data.documentName
        })
        toast({
          title: 'Documento gerado',
          description: 'Documento de conclusão criado com sucesso'
        })
        setActiveTab('send')
      } else {
        throw new Error(result.error || 'Erro ao gerar documento')
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao gerar documento',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // Enviar para cidadão
  const handleSendToCitizen = async () => {
    if (!sendMessage.trim()) {
      toast({
        title: 'Mensagem obrigatória',
        description: 'Digite uma mensagem para o cidadão',
        variant: 'destructive'
      })
      return
    }

    setIsSending(true)
    try {
      const result = await apiRequest(`/protocols/${protocol.id}/send-completion`, {
        method: 'POST',
        body: JSON.stringify({
          message: sendMessage,
          documentUrl: generatedDocument?.url,
          notifyEmail: !!protocol.citizen?.email
        })
      })

      if (result.success) {
        toast({
          title: 'Enviado com sucesso',
          description: 'Cidadão foi notificado sobre a conclusão'
        })
      } else {
        throw new Error(result.error || 'Erro ao enviar')
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsSending(false)
    }
  }

  // Concluir protocolo definitivamente
  const handleCompleteProtocol = async () => {
    if (!generatedDocument) {
      toast({
        title: 'Documento necessário',
        description: 'Gere o documento de conclusão antes de finalizar',
        variant: 'destructive'
      })
      return
    }

    setIsCompleting(true)
    try {
      const result = await apiRequest(`/protocols/${protocol.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          finalNotes,
          documentUrl: generatedDocument.url
        })
      })

      if (result.success) {
        toast({
          title: 'Protocolo concluído!',
          description: 'O protocolo foi finalizado e arquivado com sucesso'
        })
        onComplete()
      } else {
        throw new Error(result.error || 'Erro ao concluir')
      }
    } catch (error: any) {
      toast({
        title: 'Erro ao concluir',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header de Conclusão */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-green-900 mb-1">
                Pronto para Concluir
              </h2>
              <p className="text-sm text-green-700">
                Todas as etapas foram cumpridas. Revise o resumo final, gere o documento de conclusão e finalize o protocolo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progresso Final */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo de Progresso</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkflowProgressBar stages={stages} compact={false} />

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-700">{completedStages}/{stages.length}</p>
              <p className="text-xs text-gray-600 mt-1">Etapas Concluídas</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-700">{approvedDocs}/{totalDocs}</p>
              <p className="text-xs text-gray-600 mt-1">Documentos Aprovados</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-700">{Object.keys(formData).length}</p>
              <p className="text-xs text-gray-600 mt-1">Campos Preenchidos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Finalização */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm mb-4">
          <TabsTrigger value="summary-final" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Resumo Final</span>
          </TabsTrigger>
          <TabsTrigger value="document-generation" className="flex items-center gap-2">
            <FilePlus className="h-4 w-4" />
            <span className="hidden sm:inline">Gerar Documento</span>
            {generatedDocument && <CheckCircle2 className="h-3 w-3 text-green-600" />}
          </TabsTrigger>
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Enviar</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba: Resumo Final */}
        <TabsContent value="summary-final" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Histórico de Etapas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stages
                  .sort((a, b) => a.stageOrder - b.stageOrder)
                  .map((stage) => (
                    <div
                      key={stage.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full shrink-0">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900">{stage.stageName}</p>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            Etapa {stage.stageOrder}
                          </Badge>
                        </div>
                        {stage.completedAt && (
                          <p className="text-xs text-gray-600 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Concluída em: {new Date(stage.completedAt).toLocaleString('pt-BR')}
                          </p>
                        )}
                        {stage.notes && (
                          <p className="text-xs text-gray-700 mt-1 bg-white p-2 rounded border">
                            {stage.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos Recebidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {documents.filter(d => d.status === 'APPROVED').map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-900">{doc.documentType}</span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      Aprovado
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Geração de Documento */}
        <TabsContent value="document-generation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FilePlus className="h-4 w-4" />
                Gerar Documento de Conclusão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  O documento de conclusão incluirá todo o histórico do protocolo, etapas cumpridas,
                  documentos recebidos e dados fornecidos pelo cidadão.
                </AlertDescription>
              </Alert>

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">
                  Observações Finais (opcional)
                </label>
                <Textarea
                  placeholder="Adicione observações finais sobre o atendimento..."
                  value={finalNotes}
                  onChange={(e) => setFinalNotes(e.target.value)}
                  rows={4}
                  className="w-full"
                />
              </div>

              {generatedDocument ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-green-900">
                      Documento gerado com sucesso!
                    </p>
                  </div>
                  <p className="text-sm text-gray-700">{generatedDocument.name}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(generatedDocument.url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = generatedDocument.url
                        link.download = generatedDocument.name
                        link.click()
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleGenerateDocument}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>Gerando documento...</>
                  ) : (
                    <>
                      <FilePlus className="h-4 w-4 mr-2" />
                      Gerar Documento de Conclusão
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba: Enviar */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Send className="h-4 w-4" />
                Enviar para o Cidadão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!generatedDocument && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Você precisa gerar o documento de conclusão antes de enviar ao cidadão.
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">
                  Mensagem para {protocol.citizen?.name}
                </label>
                <Textarea
                  placeholder="Digite uma mensagem informando sobre a conclusão do protocolo..."
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  rows={5}
                  disabled={!generatedDocument}
                  className="w-full"
                />
                {protocol.citizen?.email && (
                  <p className="text-xs text-gray-600 mt-2">
                    <MessageSquare className="h-3 w-3 inline mr-1" />
                    Será enviado para: {protocol.citizen.email}
                  </p>
                )}
              </div>

              <Button
                onClick={handleSendToCitizen}
                disabled={isSending || !generatedDocument || !sendMessage.trim()}
                className="w-full"
              >
                {isSending ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Notificação ao Cidadão
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ação Final: Concluir Protocolo */}
      <Card className="border-green-300 bg-green-50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-green-900 mb-1">
                Finalizar Protocolo
              </h3>
              <p className="text-sm text-green-700">
                Após enviar ao cidadão, clique aqui para concluir definitivamente o protocolo #{protocol.protocolNumber}
              </p>
            </div>
            <Button
              onClick={handleCompleteProtocol}
              disabled={isCompleting || !generatedDocument}
              size="lg"
              className="bg-green-600 hover:bg-green-700 shrink-0"
            >
              {isCompleting ? (
                <>Concluindo...</>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Concluir Protocolo
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
