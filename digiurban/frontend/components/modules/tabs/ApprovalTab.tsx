'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { CheckCircle, XCircle, Clock, MessageSquare, User, Calendar, Loader2 } from 'lucide-react'
import { ModuleConfig } from '../BaseModuleView'

interface ApprovalTabProps {
  config: ModuleConfig
}

interface ApprovalItem {
  id: string
  protocol?: string
  title: string
  description?: string
  status: string
  requestedBy: string
  requestedAt: string
  currentStep?: number
  totalSteps?: number
  approvalHistory?: ApprovalHistoryItem[]
  [key: string]: any
}

interface ApprovalHistoryItem {
  id: string
  action: 'APPROVED' | 'REJECTED' | 'COMMENTED'
  comment: string
  user: string
  timestamp: string
}

export function ApprovalTab({ config }: ApprovalTabProps) {
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showCommentDialog, setShowCommentDialog] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchPendingApprovals()
  }, [])

  const fetchPendingApprovals = async () => {
    setLoading(true)
    try {
      const [department, module] = config.apiEndpoint.split('/')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const url = `${baseUrl}/admin/secretarias/${department}/${module}/approval`

      console.log('[ApprovalTab] Fetching:', url)

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('[ApprovalTab] Response status:', response.status)

      const data = await response.json()
      console.log('[ApprovalTab] Data received:', data)
      console.log('[ApprovalTab] Approvals count:', data.data?.length || 0)

      setPendingApprovals(data.data || [])
    } catch (error) {
      console.error('Erro ao carregar aprovações pendentes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (itemId: string) => {
    setActionLoading(true)
    try {
      const [department, module] = config.apiEndpoint.split('/')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const url = `${baseUrl}/admin/secretarias/${department}/${module}/approval/${itemId}/approve`

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      })

      if (!response.ok) throw new Error('Erro ao aprovar')

      toast({
        title: 'Sucesso',
        description: 'Solicitação aprovada com sucesso',
      })

      setComment('')
      setShowApproveDialog(false)
      fetchPendingApprovals()
    } catch (error) {
      console.error('Erro ao aprovar:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao aprovar solicitação',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (itemId: string) => {
    if (!comment.trim()) {
      toast({
        title: 'Atenção',
        description: 'Por favor, informe o motivo da rejeição',
        variant: 'destructive',
      })
      return
    }

    setActionLoading(true)
    try {
      const [department, module] = config.apiEndpoint.split('/')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const url = `${baseUrl}/admin/secretarias/${department}/${module}/approval/${itemId}/reject`

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      })

      if (!response.ok) throw new Error('Erro ao rejeitar')

      toast({
        title: 'Sucesso',
        description: 'Solicitação rejeitada com sucesso',
      })

      setComment('')
      setShowRejectDialog(false)
      fetchPendingApprovals()
    } catch (error) {
      console.error('Erro ao rejeitar:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao rejeitar solicitação',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleComment = async (itemId: string) => {
    if (!comment.trim()) {
      toast({
        title: 'Atenção',
        description: 'Por favor, adicione um comentário',
        variant: 'destructive',
      })
      return
    }

    setActionLoading(true)
    try {
      const [department, module] = config.apiEndpoint.split('/')
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
      const url = `${baseUrl}/admin/secretarias/${department}/${module}/approval/${itemId}/comment`

      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment }),
      })

      if (!response.ok) throw new Error('Erro ao adicionar comentário')

      toast({
        title: 'Sucesso',
        description: 'Comentário adicionado com sucesso',
      })

      setComment('')
      setShowCommentDialog(false)
      fetchPendingApprovals()
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao adicionar comentário',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">Carregando...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Aprovações Pendentes</CardTitle>
          <CardDescription>
            Solicitações aguardando sua análise e aprovação
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length > 0 ? (
            <div className="space-y-4">
              {pendingApprovals.map((item) => (
                <Card key={item.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-lg">{item.title}</h3>
                          {item.protocol && (
                            <Badge variant="outline">{item.protocol}</Badge>
                          )}
                          {item.currentStep && item.totalSteps && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Etapa {item.currentStep}/{item.totalSteps}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {item.requestedBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(item.requestedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Aguardando Aprovação
                      </Badge>
                    </div>

                    {/* Histórico de Aprovações */}
                    {item.approvalHistory && item.approvalHistory.length > 0 && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm mb-2">Histórico de Aprovações</h4>
                        <div className="space-y-2">
                          {item.approvalHistory.map((history) => (
                            <div key={history.id} className="flex items-start gap-2 text-sm">
                              {history.action === 'APPROVED' && (
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                              )}
                              {history.action === 'REJECTED' && (
                                <XCircle className="h-4 w-4 text-red-600 mt-0.5" />
                              )}
                              {history.action === 'COMMENTED' && (
                                <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-gray-700">
                                  <strong>{history.user}</strong> - {history.comment}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(history.timestamp).toLocaleString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setSelectedItem(item)
                          setShowApproveDialog(true)
                        }}
                        disabled={actionLoading}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </Button>

                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSelectedItem(item)
                          setShowRejectDialog(true)
                        }}
                        disabled={actionLoading}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeitar
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedItem(item)
                          setShowCommentDialog(true)
                        }}
                        disabled={actionLoading}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Comentar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma aprovação pendente
              </h3>
              <p className="text-gray-600">
                Todas as solicitações foram processadas
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Aprovar */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar Solicitação</DialogTitle>
            <DialogDescription>
              Confirme a aprovação da solicitação "{selectedItem?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Comentário (opcional)</label>
              <Textarea
                placeholder="Adicione um comentário sobre a aprovação..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => selectedItem && handleApprove(selectedItem.id)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Aprovando...
                  </>
                ) : (
                  'Confirmar Aprovação'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowApproveDialog(false)
                  setComment('')
                }}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Rejeitar */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Solicitação</DialogTitle>
            <DialogDescription>
              Confirme a rejeição da solicitação "{selectedItem?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Motivo da Rejeição *</label>
              <Textarea
                placeholder="Descreva o motivo da rejeição..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                required
                className="mt-1"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => selectedItem && handleReject(selectedItem.id)}
                disabled={!comment.trim() || actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Rejeitando...
                  </>
                ) : (
                  'Confirmar Rejeição'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false)
                  setComment('')
                }}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Comentar */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Comentário</DialogTitle>
            <DialogDescription>
              Adicione um comentário à solicitação "{selectedItem?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Comentário *</label>
              <Textarea
                placeholder="Digite seu comentário..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                required
                className="mt-1"
              />
            </div>
            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={() => selectedItem && handleComment(selectedItem.id)}
                disabled={!comment.trim() || actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Comentário'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCommentDialog(false)
                  setComment('')
                }}
                disabled={actionLoading}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
