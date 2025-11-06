'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  MessageSquare,
  Send,
  User,
  UserCircle,
  Bot,
  Paperclip,
} from 'lucide-react'
import { useCitizenAuth } from '@/contexts/CitizenAuthContext'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProtocolInteraction {
  id: string
  protocolId: string
  type: string
  authorType: string
  authorId: string
  authorName: string | null
  message: string | null
  isInternal: boolean
  isRead: boolean
  attachments: any
  metadata: any
  createdAt: string
  updatedAt: string
}

interface CitizenProtocolInteractionsTabProps {
  protocolId: string
}

export function CitizenProtocolInteractionsTab({
  protocolId,
}: CitizenProtocolInteractionsTabProps) {
  const [interactions, setInteractions] = useState<ProtocolInteraction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { apiRequest } = useCitizenAuth()

  const loadInteractions = async () => {
    try {
      setIsLoading(true)
      const data = await apiRequest(`/citizen/protocols/${protocolId}/interactions`)
      setInteractions(data.interactions || data.data || [])
    } catch (error) {
      toast.error('Erro ao carregar interações')
      console.error('Erro ao carregar interações:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInteractions()
  }, [protocolId])

  useEffect(() => {
    scrollToBottom()
  }, [interactions])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return

    try {
      setIsSending(true)

      await apiRequest(`/citizen/protocols/${protocolId}/interactions`, {
        method: 'POST',
        body: JSON.stringify({
          message: message.trim(),
          type: 'MESSAGE',
        }),
      })

      setMessage('')
      await loadInteractions()

      toast.success('Mensagem enviada com sucesso')
    } catch (error) {
      toast.error('Erro ao enviar mensagem')
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setIsSending(false)
    }
  }

  const getInteractionIcon = (authorType: string) => {
    switch (authorType) {
      case 'CITIZEN':
        return <User className="h-4 w-4" />
      case 'SERVER':
        return <UserCircle className="h-4 w-4" />
      case 'SYSTEM':
        return <Bot className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getInteractionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      COMMENT: 'Comentário',
      MESSAGE: 'Mensagem',
      STATUS_CHANGE: 'Mudança de Status',
      STATUS_CHANGED: 'Status Alterado',
      ASSIGNMENT: 'Atribuição',
      ASSIGNED: 'Protocolo Atribuído',
      DOCUMENT_UPLOAD: 'Upload de Documento',
      DOCUMENT_REQUEST: 'Solicitação de Documento',
      NOTIFICATION: 'Notificação',
      PENDING_CREATED: 'Pendência Criada',
      PENDING_RESOLVED: 'Pendência Resolvida',
      INSPECTION_SCHEDULED: 'Vistoria Agendada',
      INSPECTION_COMPLETED: 'Vistoria Concluída',
      APPROVAL: 'Aprovação',
      REJECTION: 'Rejeição',
      CANCELLATION: 'Cancelamento',
      NOTE: 'Nota Interna',
      SYSTEM: 'Sistema',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Interações</h3>
        </div>
      </div>

      {/* Lista de Mensagens */}
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando interações...
            </div>
          ) : interactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma interação registrada</p>
              <p className="text-sm mt-1">Envie uma mensagem para iniciar a conversa</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {interactions.map((interaction) => (
                <div
                  key={interaction.id}
                  className={`p-4 rounded-lg border ${
                    interaction.authorType === 'CITIZEN'
                      ? 'bg-blue-50 border-blue-200 ml-8'
                      : 'bg-gray-50 border-gray-200 mr-8'
                  }`}
                >
                  {/* Cabeçalho da Mensagem */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {(interaction.authorName || 'U')
                            .split(' ')
                            .map((n: string) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {interaction.authorName || 'Usuário'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getInteractionIcon(interaction.authorType || 'CITIZEN')}
                            <span className="ml-1">
                              {interaction.authorType === 'CITIZEN'
                                ? 'Você'
                                : interaction.authorType === 'SERVER'
                                ? 'Atendente'
                                : 'Sistema'}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(interaction.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                    {interaction.type && interaction.type !== 'MESSAGE' && (
                      <Badge variant="secondary" className="text-xs">
                        {getInteractionTypeLabel(interaction.type)}
                      </Badge>
                    )}
                  </div>

                  {/* Conteúdo da Mensagem */}
                  {interaction.message && (
                    <p className="text-sm whitespace-pre-wrap ml-10">
                      {interaction.message}
                    </p>
                  )}

                  {/* Anexos */}
                  {interaction.attachments && (
                    <div className="mt-2 ml-10">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        <span>Anexos disponíveis</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campo de Nova Mensagem */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Textarea
              placeholder="Digite sua mensagem..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSendMessage()
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Pressione Ctrl+Enter para enviar
              </p>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSending ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
