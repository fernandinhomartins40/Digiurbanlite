'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  decodePendingCreationContext,
  PendingCreationContext,
} from '@/src/components/admin/protocol/protocol-pending-context'
import { ProtocolPendingCreationForm } from '@/src/components/admin/protocol/ProtocolPendingCreationForm'

export default function ProtocolPendingCreationPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { apiRequest } = useAdminAuth()
  const { toast } = useToast()

  const protocolId = params.id as string
  const creationContext = decodePendingCreationContext(searchParams.get('context')) as PendingCreationContext | null

  const [protocol, setProtocol] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const backToProtocol = () => {
    router.push(`/admin/protocolos/${protocolId}?tab=pendencias`)
  }

  useEffect(() => {
    const loadProtocol = async () => {
      try {
        setLoading(true)
        const response = await apiRequest(`/protocols/${protocolId}`)
        if (!response?.success) {
          throw new Error(response?.error || 'Erro ao carregar protocolo')
        }
        setProtocol(response.data)
      } catch (error) {
        toast({
          title: 'Erro ao carregar protocolo',
          description: error instanceof Error ? error.message : 'Erro desconhecido',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    if (protocolId) {
      loadProtocol()
    }
  }, [apiRequest, protocolId, toast])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Button variant="ghost" className="w-fit px-0 text-muted-foreground" onClick={backToProtocol}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para o protocolo
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Criar pendência</h1>
              <p className="text-sm text-muted-foreground">
                Registre uma pendência vinculada ao protocolo e à etapa atual, com seleção precisa de documentos e dados exigidos pelo serviço.
              </p>
            </div>
          </div>

          {protocol?.number && (
            <div className="rounded-lg border bg-white px-4 py-3 text-sm shadow-sm">
              <p className="font-medium text-foreground">{protocol.number}</p>
              <p className="text-muted-foreground">{protocol.service?.name || protocol.title || 'Protocolo'}</p>
            </div>
          )}
        </div>

        {creationContext?.stageName && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-amber-950">Origem da criação</p>
                <p className="text-amber-800">
                  Esta pendência será criada a partir da etapa <span className="font-medium">{creationContext.stageName}</span>.
                </p>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Formulário da pendência</CardTitle>
            <CardDescription>
              Selecione exatamente os documentos ou campos que o cidadão precisa complementar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Carregando dados do protocolo...</div>
            ) : (
              <ProtocolPendingCreationForm
                protocolId={protocolId}
                service={protocol?.service}
                creationContext={creationContext}
                onCancel={backToProtocol}
                onCreated={backToProtocol}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}