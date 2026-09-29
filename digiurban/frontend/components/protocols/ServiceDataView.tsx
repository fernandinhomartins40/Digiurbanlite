'use client'

/**
 * Vista "Dados" da Gestão de Protocolos.
 *
 * Mostra os dados do formulário de TODOS os pedidos de um serviço (no escopo
 * do usuário) usando as vistas automáticas que existiam nos antigos módulos
 * (cadastro, inscrições, mapa de denúncias, linha do tempo de licenças,
 * agenda, tabela). Substitui as páginas de "módulo" por serviço — que só
 * enxergavam os 50 pedidos mais recentes.
 */

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Info, RefreshCw } from 'lucide-react'
import { ConsolidatedDataTab } from '@/components/admin/module/ConsolidatedDataTab'
import { DataWorkspace } from '@/components/modules/secretaria/DataWorkspace'
import { listEntityTypes } from '@/services/registry.service'

interface ServiceDataResponse {
  service: any
  protocols: any[]
  total: number
  truncated: boolean
}

export function ServiceDataView({ serviceId }: { serviceId: string }) {
  const [data, setData] = useState<ServiceDataResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  // Painel personalizável (widgets do Registry), quando o serviço tem tipo de dado indexado
  const [registryCode, setRegistryCode] = useState<string | null>(null)
  const [mode, setMode] = useState<'auto' | 'painel'>('auto')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    fetch(`/api/protocols/service-data?serviceId=${encodeURIComponent(serviceId)}`, { credentials: 'include' })
      .then(async (response) => {
        const body = await response.json().catch(() => null)
        if (!response.ok || !body?.success) throw new Error(body?.error || 'Não foi possível carregar os dados')
        if (active) setData(body.data)
      })
      .catch((err: Error) => active && setError(err.message))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [serviceId, reloadKey])

  useEffect(() => {
    setRegistryCode(null)
    setMode('auto')
    const moduleType = data?.service?.moduleType
    if (!moduleType) return
    let active = true
    listEntityTypes()
      .then((res: any) => {
        const types: any[] = res?.entityTypes || []
        if (active && types.some((t) => t.code === moduleType)) setRegistryCode(moduleType)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [data?.service?.moduleType])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-red-600">{error || 'Não foi possível carregar os dados'}</p>
          <Button variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const concluded = data.protocols.filter((p) => p.status === 'CONCLUIDO').length

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <p>
          Dados dos formulários dos pedidos <strong>concluídos</strong> de &quot;{data.service.name}&quot; —{' '}
          {concluded} de {data.total} pedido{data.total === 1 ? '' : 's'}.
          {data.truncated && ' Mostrando os 2.000 mais recentes; use a exportação para análises maiores.'}
          {' '}Pedidos em andamento aparecem na vista Fila.
        </p>
      </div>
      {registryCode && (
        <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Tipo de painel">
          {[
            { id: 'auto', label: 'Vista automática' },
            { id: 'painel', label: 'Painel personalizável' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={mode === opt.id}
              onClick={() => setMode(opt.id as 'auto' | 'painel')}
              className={`rounded-md border px-3 py-1 text-sm ${
                mode === opt.id ? 'border-primary bg-primary/10 text-primary font-medium' : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
      {registryCode && mode === 'painel' ? (
        <DataWorkspace code={registryCode} />
      ) : (
        <ConsolidatedDataTab protocols={data.protocols} service={data.service} />
      )}
    </div>
  )
}
