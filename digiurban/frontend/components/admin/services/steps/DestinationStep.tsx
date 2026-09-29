'use client'

/**
 * Passo "Depois do pedido" do assistente de serviço.
 *
 * O serviço declara para onde o pedido vai (ARQUITETURA-DE-PRODUTO.md 6.1):
 * - FILA: analisado e concluído no próprio protocolo;
 * - APP: vira um caso num app da secretaria (TFD, Habitação, Ordens de Serviço…).
 *
 * Antes isso era deduzido do nome do serviço, sem ninguém ver — e um nome
 * diferente fazia o pedido não chegar ao app.
 */

import { useEffect, useMemo, useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AppWindow, Inbox, Info } from 'lucide-react'

export type ServiceDestination = 'FILA' | 'APP'

interface CatalogApp {
  code: string
  name: string
  description: string
  actions: { code: string; label: string; stage: 'CRIACAO' | 'APROVACAO' }[]
}

interface Props {
  departmentCode?: string
  destination: ServiceDestination
  appAction: string
  onChange: (field: 'destination' | 'appAction', value: string) => void
}

export function DestinationStep({ departmentCode, destination, appAction, onChange }: Props) {
  const { apiRequest } = useAdminAuth()
  const [apps, setApps] = useState<CatalogApp[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!departmentCode) {
      setApps([])
      return
    }
    let active = true
    setLoading(true)
    apiRequest(`/api/app-catalog?departmentCode=${encodeURIComponent(departmentCode)}&withActions=true`)
      .then((res: any) => active && setApps(res?.data?.apps || []))
      .catch(() => active && setApps([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentCode])

  const selected = useMemo(() => {
    for (const app of apps) {
      const action = app.actions.find((a) => a.code === appAction)
      if (action) return { app, action }
    }
    return null
  }, [apps, appAction])

  const option = (value: ServiceDestination, title: string, text: string, Icon: typeof Inbox, disabled = false) => (
    <label
      className={`flex gap-3 rounded-lg border p-4 transition-colors ${
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
      } ${destination === value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
    >
      <input
        type="radio"
        name="destination"
        className="mt-1"
        checked={destination === value}
        disabled={disabled}
        onChange={() => {
          onChange('destination', value)
          if (value === 'FILA') onChange('appAction', '')
        }}
      />
      <div>
        <div className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{text}</p>
      </div>
    </label>
  )

  const hasApps = apps.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">O que acontece depois do pedido?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Todo pedido gera um protocolo para o cidadão acompanhar. Escolha onde ele será atendido.
        </p>
      </div>

      <div className="grid gap-3">
        {option(
          'FILA',
          'Analisado no próprio protocolo',
          'A equipe da secretaria recebe o pedido na Gestão de Protocolos, analisa e conclui ali mesmo. Ideal para certidões, declarações e solicitações gerais.',
          Inbox
        )}
        {option(
          'APP',
          'Vai para um app da secretaria',
          hasApps
            ? 'O pedido vira um caso num app especializado (agenda, estoque, pareceres, vistorias…). O cidadão continua acompanhando pelo protocolo.'
            : loading
              ? 'Carregando os apps da secretaria…'
              : 'Esta secretaria não tem app que receba pedidos. O pedido será analisado no protocolo.',
          AppWindow,
          !hasApps
        )}
      </div>

      {destination === 'APP' && hasApps && (
        <div className="space-y-2">
          <Label htmlFor="appAction">Para qual app e como o pedido entra?</Label>
          <Select value={appAction || undefined} onValueChange={(value) => onChange('appAction', value)}>
            <SelectTrigger id="appAction" aria-label="Ação do app">
              <SelectValue placeholder="Escolha o app e o tipo de entrada" />
            </SelectTrigger>
            <SelectContent>
              {apps.map((app) => (
                <SelectGroup key={app.code}>
                  <SelectLabel>{app.name}</SelectLabel>
                  {app.actions.map((action) => (
                    <SelectItem key={action.code} value={action.code}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          {selected && (
            <p className="flex items-start gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              {selected.action.stage === 'APROVACAO'
                ? `O caso é criado no app "${selected.app.name}" quando o pedido for aprovado.`
                : `O caso é criado no app "${selected.app.name}" assim que o cidadão fizer o pedido.`}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** Texto curto do destino para revisão/listagem */
export function describeDestination(destination?: string | null, appActionLabel?: string | null) {
  if (destination === 'APP') return appActionLabel ? `Vai para o app — ${appActionLabel}` : 'Vai para um app'
  return 'Analisado no próprio protocolo'
}
