'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { CitizenPendingCard, CitizenPendingUploadFile, ProtocolPending } from './CitizenPendingCard'
import { toast } from 'sonner'

interface CitizenPendingsTabProps {
  protocolId: string
  apiRequest: (url: string, options?: RequestInit) => Promise<any>
}

export function CitizenPendingsTab({ protocolId, apiRequest }: CitizenPendingsTabProps) {
  const [pendings, setPendings] = useState<ProtocolPending[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPendings()
  }, [protocolId])

  const loadPendings = async () => {
    try {
      setIsLoading(true)
      const response = await apiRequest(`/citizen/protocols/${protocolId}/pendings`)

      if (response.success) {
        setPendings(response.data || response.pendings || [])
      }
    } catch (error) {
      console.error('Erro ao carregar pendências:', error)
      toast.error('Erro ao carregar pendências')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResolvePending = async (
    pendingId: string,
    resolution: string,
    file?: File,
    files?: CitizenPendingUploadFile[]
  ) => {
    try {
      if ((Array.isArray(files) && files.length > 0) || file) {
        // Resolver com documento (upload)
        const formData = new FormData()
        const uploadFiles = Array.isArray(files) && files.length > 0
          ? files
          : file
            ? [{ docId: undefined, documentType: file.name, required: true, file }]
            : []

        uploadFiles.forEach(({ file: uploadFile }) => {
          formData.append('documents', uploadFile)
        })
        formData.append(
          'fileMetadata',
          JSON.stringify(
            uploadFiles.map(({ docId, documentType, required }) => ({
              docId,
              documentType,
              required,
            }))
          )
        )

        const response = await apiRequest(
          `/citizen/protocols/${protocolId}/pendings/${pendingId}/resolve-with-document`,
          {
            method: 'PATCH',
            body: formData,
            // Não adicionar Content-Type - o browser define automaticamente com boundary
          }
        )

        if (response.success) {
          toast.success('Documento enviado para análise com sucesso!')
          await loadPendings()
        } else {
          throw new Error(response.error || 'Erro ao enviar documento')
        }
      } else {
        // Resolver com texto ou campos dinâmicos
        const response = await apiRequest(
          `/citizen/protocols/${protocolId}/pendings/${pendingId}/resolve`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ resolution }),
          }
        )

        if (response.success) {
          toast.success('Resposta enviada para análise com sucesso!')
          await loadPendings()
        } else {
          throw new Error(response.error || 'Erro ao enviar resolução')
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao resolver pendência'
      toast.error(message)
      throw error
    }
  }

  const pendingPendings = pendings.filter(p => p.status === 'PENDING' || p.status === 'OPEN' || p.status === 'IN_PROGRESS')
  const underReviewPendings = pendings.filter(p => p.status === 'UNDER_REVIEW')
  const resolvedPendings = pendings.filter(p => p.status === 'RESOLVED')
  const cancelledPendings = pendings.filter(p => p.status === 'CANCELLED' || p.status === 'EXPIRED')

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

  const renderCard = (pending: ProtocolPending) => (
    <CitizenPendingCard
      key={pending.id}
      pending={pending}
      onResolve={(resolution, file) => handleResolvePending(pending.id, resolution, file)}
      onResolveWithDocument={(files) => handleResolvePending(pending.id, '', undefined, files)}
    />
  )
  const finished = [...resolvedPendings, ...cancelledPendings]

  // grupos em vez de 5 abas (que ficavam espremidas e sobrepostas no celular)
  return (
    <div className="space-y-6">
      {pendingPendings.length > 0 && (
        <section className="space-y-3">
          <h3 className="px-1 text-sm font-semibold text-orange-800">Para você responder ({pendingPendings.length})</h3>
          {pendingPendings.map(renderCard)}
        </section>
      )}

      {underReviewPendings.length > 0 && (
        <section className="space-y-3">
          <h3 className="px-1 text-sm font-semibold text-blue-800">Em análise pela prefeitura ({underReviewPendings.length})</h3>
          {underReviewPendings.map(renderCard)}
        </section>
      )}

      {pendingPendings.length === 0 && underReviewPendings.length === 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Nada para responder agora.
        </div>
      )}

      {finished.length > 0 && (
        <details className="group rounded-2xl border bg-white">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-gray-700 [&::-webkit-details-marker]:hidden">
            Já resolvidas ({finished.length})
            <span className="ml-1 text-gray-400 group-open:hidden">— mostrar</span>
          </summary>
          <div className="space-y-3 border-t p-3">{finished.map(renderCard)}</div>
        </details>
      )}
    </div>
  )
}
