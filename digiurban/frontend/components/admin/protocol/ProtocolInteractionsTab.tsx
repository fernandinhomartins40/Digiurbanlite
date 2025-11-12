'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  MessageSquare,
  Send,
  User,
  UserCircle,
  Bot,
  Eye,
  EyeOff,
  Paperclip,
} from 'lucide-react'
import {
  ProtocolInteraction,
  InteractionType,
  InteractionVisibility,
  CreateInteractionData,
} from '@/types/protocol-enhancements'
import {
  createInteraction,
  getProtocolInteractions,
  markInteractionAsRead,
  markAllInteractionsAsRead,
} from '@/services/protocol-interactions.service'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProtocolInteractionsTabProps {
  protocolId: string
  isServer?: boolean
}

export function ProtocolInteractionsTab({
  protocolId,
  isServer = true,
}: ProtocolInteractionsTabProps) {
  const [interactions, setInteractions] = useState<ProtocolInteraction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [showInternal, setShowInternal] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  const loadInteractions = async () => {
    try {
      setIsLoading(true)
      const data = await getProtocolInteractions(protocolId)
      setInteractions(data)
    } catch (error) {
      toast({
        title: 'Erro ao carregar interações',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadInteractions()
  }, [protocolId, showInternal])

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
      const data: CreateInteractionData = {
        protocolId,
        interactionType: InteractionType.MESSAGE,
        message: message.trim(),
        visibility: isInternal ? InteractionVisibility.INTERNAL : InteractionVisibility.PUBLIC,
      }

      await createInteraction(data)
      setMessage('')
      setIsInternal(false)
      await loadInteractions()

      toast({
        title: 'Mensagem enviada',
        description: 'A mensagem foi enviada com sucesso',
      })
    } catch (error) {
      toast({
        title: 'Erro ao enviar mensagem',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleMarkAsRead = async (interactionId: string) => {
    try {
      await markInteractionAsRead(protocolId, interactionId)
      await loadInteractions()
    } catch (error) {
      console.error('Erro ao marcar como lida:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await markAllInteractionsAsRead(protocolId)
      await loadInteractions()
      toast({
        title: 'Marcado como lido',
        description: 'Todas as interações foram marcadas como lidas',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      })
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

  const getInteractionTypeLabel = (type: InteractionType) => {
    const labels: Record<InteractionType, string> = {
      [InteractionType.COMMENT]: 'Comentário',
      [InteractionType.MESSAGE]: 'Mensagem',
      [InteractionType.STATUS_CHANGE]: 'Mudança de Status',
      [InteractionType.STATUS_CHANGED]: 'Status Alterado',
      [InteractionType.ASSIGNMENT]: 'Atribuição',
      [InteractionType.ASSIGNED]: 'Protocolo Atribuído',
      [InteractionType.DOCUMENT_UPLOAD]: 'Upload de Documento',
      [InteractionType.DOCUMENT_REQUEST]: 'Solicitação de Documento',
      [InteractionType.NOTIFICATION]: 'Notificação',
      [InteractionType.PENDING_CREATED]: 'Pendência Criada',
      [InteractionType.PENDING_RESOLVED]: 'Pendência Resolvida',
      [InteractionType.INSPECTION_SCHEDULED]: 'Vistoria Agendada',
      [InteractionType.INSPECTION_COMPLETED]: 'Vistoria Concluída',
      [InteractionType.APPROVAL]: 'Aprovação',
      [InteractionType.REJECTION]: 'Rejeição',
      [InteractionType.CANCELLATION]: 'Cancelamento',
      [InteractionType.NOTE]: 'Nota Interna',
      [InteractionType.SYSTEM]: 'Sistema',
    }
    return labels[type] || type
  }

  const unreadCount = interactions.filter((i) => !i.isRead).length

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">
            Interações {unreadCount > 0 && `(${unreadCount} não lidas)`}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isServer && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="show-internal"
                checked={showInternal}
                onCheckedChange={(checked) => setShowInternal(checked as boolean)}
              />
              <Label htmlFor="show-internal" className="text-sm cursor-pointer">
                {showInternal ? (
                  <>
                    <Eye className="inline h-3 w-3 mr-1" />
                    Internas Visíveis
                  </>
                ) : (
                  <>
                    <EyeOff className="inline h-3 w-3 mr-1" />
                    Internas Ocultas
                  </>
                )}
              </Label>
            </div>
          )}
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={handleMarkAllAsRead}>
              Marcar Todas como Lidas
            </Button>
          )}
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
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {interactions.map((interaction) => (
                <div
                  key={interaction.id}
                  className={`p-4 rounded-lg border ${
                    !interaction.isRead ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                  } ${interaction.isInternal ? 'border-l-4 border-l-yellow-500' : ''}`}
                  onClick={() =>
                    !interaction.isRead && handleMarkAsRead(interaction.id)
                  }
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
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
                            {getInteractionIcon(interaction.authorType || 'user')}
                            <span className="ml-1">{interaction.authorType || 'user'}</span>
                          </Badge>
                          {interaction.isInternal && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">
                              Interna
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(interaction.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                    {interaction.type && interaction.type !== InteractionType.MESSAGE && (
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
              {isServer && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="is-internal"
                    checked={isInternal}
                    onCheckedChange={(checked) => setIsInternal(checked as boolean)}
                  />
                  <Label htmlFor="is-internal" className="text-sm cursor-pointer">
                    Mensagem interna (visível apenas para servidores)
                  </Label>
                </div>
              )}
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSending}
                >
                  <Paperclip className="h-4 w-4 mr-2" />
                  Anexar
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isSending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar {isInternal && '(Interna)'}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Pressione Ctrl+Enter para enviar
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
