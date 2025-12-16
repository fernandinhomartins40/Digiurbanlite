'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { CitizenPendingCard, ProtocolPending } from './CitizenPendingCard'
import { toast } from 'sonner'

interface CitizenPendingsTabProps {
  protocolId: string
  apiRequest: (url: string, options?: RequestInit) => Promise<any>
}

export function CitizenPendingsTab({ protocolId, apiRequest }: CitizenPendingsTabProps) {
  const [pendings, setPendings] = useState<ProtocolPending[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadPendings()
  }, [protocolId])

  const loadPendings = async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest(`/citizen/protocols/${protocolId}/pendings`)

      if (response.success) {
        setPendings(response.data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar pendências:', error)
      toast.error('Erro ao carregar pendências')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolvePending = async (pendingId: string, resolution: string) => {
    try {
      const response = await apiRequest(
        `/citizen/protocols/${protocolId}/pendings/${pendingId}/resolve`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resolution }),
        }
      )

      if (response.success) {
        toast.success('Resolução enviada com sucesso!')
        // Recarregar pendências
        await loadPendings()
      } else {
        throw new Error(response.error || 'Erro ao enviar resolução')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao enviar resolução'
      toast.error(message)
      throw error
    }
  }

  const pendingPendings = pendings.filter(p => p.status === 'PENDING')
  const resolvedPendings = pendings.filter(p => p.status === 'RESOLVED')
  const cancelledPendings = pendings.filter(p => p.status === 'CANCELLED')

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Carregando pendências...</p>
        </CardContent>
      </Card>
    )
  }

  if (pendings.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-1">Nenhuma pendência</p>
          <p className="text-sm text-gray-500">
            Seu protocolo não possui pendências no momento
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Todas ({pendings.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pendentes ({pendingPendings.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Resolvidas ({resolvedPendings.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Canceladas ({cancelledPendings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          {pendings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Nenhuma pendência encontrada
              </CardContent>
            </Card>
          ) : (
            pendings.map((pending) => (
              <CitizenPendingCard
                key={pending.id}
                pending={pending}
                onResolve={(resolution) => handleResolvePending(pending.id, resolution)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {pendingPendings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400" />
                <p>Nenhuma pendência aguardando resolução</p>
              </CardContent>
            </Card>
          ) : (
            pendingPendings.map((pending) => (
              <CitizenPendingCard
                key={pending.id}
                pending={pending}
                onResolve={(resolution) => handleResolvePending(pending.id, resolution)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4 mt-4">
          {resolvedPendings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Nenhuma pendência resolvida
              </CardContent>
            </Card>
          ) : (
            resolvedPendings.map((pending) => (
              <CitizenPendingCard
                key={pending.id}
                pending={pending}
                onResolve={(resolution) => handleResolvePending(pending.id, resolution)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="cancelled" className="space-y-4 mt-4">
          {cancelledPendings.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Nenhuma pendência cancelada
              </CardContent>
            </Card>
          ) : (
            cancelledPendings.map((pending) => (
              <CitizenPendingCard
                key={pending.id}
                pending={pending}
                onResolve={(resolution) => handleResolvePending(pending.id, resolution)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
