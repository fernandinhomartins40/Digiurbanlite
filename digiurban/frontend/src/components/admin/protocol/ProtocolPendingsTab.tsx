'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle2, Clock, XCircle, Plus } from 'lucide-react'
import { ProtocolPending, PendingStatus, PendingType } from '@/types/protocol-enhancements'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ProtocolPendingsTabProps {
  protocolId: string
  pendings: ProtocolPending[]
  onRefresh: () => void
}

export function ProtocolPendingsTab({ protocolId, pendings, onRefresh }: ProtocolPendingsTabProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newPending, setNewPending] = useState({ type: '', title: '', description: '', dueDate: '', blocksProgress: true })
  const [resolvingPending, setResolvingPending] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')
  const { toast } = useToast()

  const getFullApiUrl = (path: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3060/api'
    return `${apiUrl}${path}`
  }

  const getStatusBadge = (status: PendingStatus) => {
    const config = {
      [PendingStatus.OPEN]: { icon: AlertCircle, label: 'Aberta', className: 'bg-red-100 text-red-700' },
      [PendingStatus.IN_PROGRESS]: { icon: Clock, label: 'Em Resolução', className: 'bg-yellow-100 text-yellow-700' },
      [PendingStatus.RESOLVED]: { icon: CheckCircle2, label: 'Resolvida', className: 'bg-green-100 text-green-700' },
      [PendingStatus.EXPIRED]: { icon: XCircle, label: 'Expirada', className: 'bg-gray-100 text-gray-700' },
      [PendingStatus.CANCELLED]: { icon: XCircle, label: 'Cancelada', className: 'bg-gray-100 text-gray-700' },
    }
    const Icon = config[status].icon
    return <Badge variant="outline" className={config[status].className}><Icon className="h-3 w-3 mr-1" />{config[status].label}</Badge>
  }

  const handleCreate = async () => {
    try {
      toast({ title: 'Pendência criada', description: 'A pendência foi criada com sucesso' })
      setIsOpen(false)
      setNewPending({ type: '', title: '', description: '', dueDate: '', blocksProgress: true })
      onRefresh()
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao criar pendência', variant: 'destructive' })
    }
  }

  // ✅ FASE 2: Resolver pendência
  const handleResolvePending = async (pendingId: string) => {
    if (!resolution.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Por favor, descreva como a pendência foi resolvida',
        variant: 'destructive'
      })
      return
    }

    try {
      const url = getFullApiUrl(`/protocols/${protocolId}/pendings/${pendingId}/resolve`)
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution })
      })

      if (!response.ok) {
        throw new Error('Erro ao resolver pendência')
      }

      toast({
        title: 'Pendência resolvida',
        description: 'A pendência foi resolvida com sucesso'
      })

      setResolvingPending(null)
      setResolution('')
      onRefresh()
    } catch (error) {
      toast({
        title: 'Erro ao resolver pendência',
        description: 'Não foi possível resolver a pendência',
        variant: 'destructive'
      })
    }
  }

  // ✅ FASE 2: Cancelar pendência
  const handleCancelPending = async (pendingId: string) => {
    if (!confirm('Tem certeza que deseja cancelar esta pendência?')) {
      return
    }

    try {
      const url = getFullApiUrl(`/protocols/${protocolId}/pendings/${pendingId}/cancel`)
      const response = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Erro ao cancelar pendência')
      }

      toast({
        title: 'Pendência cancelada',
        description: 'A pendência foi cancelada'
      })

      onRefresh()
    } catch (error) {
      toast({
        title: 'Erro ao cancelar pendência',
        description: 'Não foi possível cancelar a pendência',
        variant: 'destructive'
      })
    }
  }

  const openPendings = pendings.filter(p => p.status === PendingStatus.OPEN || p.status === PendingStatus.IN_PROGRESS)
  const closedPendings = pendings.filter(p => p.status === PendingStatus.RESOLVED || p.status === PendingStatus.CANCELLED || p.status === PendingStatus.EXPIRED)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Pendências ({openPendings.length} ativas)
        </h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Nova Pendência</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Nova Pendência</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Tipo</Label>
                <Select value={newPending.type} onValueChange={(v) => setNewPending({ ...newPending, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PendingType.DOCUMENT}>Documento</SelectItem>
                    <SelectItem value={PendingType.INFORMATION}>Informação</SelectItem>
                    <SelectItem value={PendingType.CORRECTION}>Correção</SelectItem>
                    <SelectItem value={PendingType.VALIDATION}>Validação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Título</Label>
                <Input value={newPending.title} onChange={(e) => setNewPending({ ...newPending, title: e.target.value })} />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={newPending.description} onChange={(e) => setNewPending({ ...newPending, description: e.target.value })} rows={3} />
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Pendência</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pendências Ativas */}
      {openPendings.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Ativas</h4>
          <div className="space-y-3">
            {openPendings.map(pending => (
              <Card key={pending.id} className={pending.blocksProgress ? 'border-red-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-medium">{pending.title}</h5>
                        {getStatusBadge(pending.status)}
                        {pending.blocksProgress && <Badge variant="destructive" className="text-xs">Bloqueia Progresso</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{pending.description}</p>
                      {pending.dueDate && (
                        <p className="text-xs text-muted-foreground">
                          Prazo: {format(new Date(pending.dueDate), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {resolvingPending === pending.id ? (
                        <div className="space-y-2 min-w-[300px]">
                          <Textarea
                            placeholder="Descreva como a pendência foi resolvida..."
                            value={resolution}
                            onChange={(e) => setResolution(e.target.value)}
                            rows={2}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleResolvePending(pending.id)}>Confirmar</Button>
                            <Button size="sm" variant="outline" onClick={() => { setResolvingPending(null); setResolution('') }}>Cancelar</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setResolvingPending(pending.id)}>Resolver</Button>
                          <Button size="sm" variant="ghost" onClick={() => handleCancelPending(pending.id)}>Cancelar</Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pendências Resolvidas */}
      {closedPendings.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-3">Resolvidas ({closedPendings.length})</h4>
          <div className="space-y-2">
            {closedPendings.map(pending => (
              <Card key={pending.id} className="opacity-60">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{pending.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {pending.resolvedAt && format(new Date(pending.resolvedAt), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pendings.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50 text-green-500" />
            <p>Nenhuma pendência registrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
