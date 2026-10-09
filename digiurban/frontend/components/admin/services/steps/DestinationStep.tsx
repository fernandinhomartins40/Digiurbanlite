'use client'

/**
 * Passo "Depois do pedido" do assistente de serviço.
 *
 * O serviço declara para onde o pedido vai (ARQUITETURA-DE-PRODUTO.md 6.1):
 * - FILA: analisado e concluído no próprio protocolo;
 * - APP: vira um caso num app da secretaria (TFD, Habitação, Ordens de Serviço…).
 *
 * Inteligência (2026-10-09, sem IA):
 * - pelo NOME do serviço o sistema sugere o app (e, num serviço novo, já deixa
 *   escolhido, dizendo por quê) — vale para serviço criado à mão ou por sugestão;
 * - escolhido o app, mostra o que ele vai receber do formulário (campo achado
 *   pelo título, vindo do perfil do cidadão ou do nome do serviço), deixa trocar
 *   o campo e acrescenta com um clique os campos que faltam.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, AppWindow, CheckCircle2, Inbox, Info, Plus, Sparkles } from 'lucide-react'

export type ServiceDestination = 'FILA' | 'APP'

interface CatalogApp {
  code: string
  name: string
  description: string
  actions: { code: string; label: string; stage: 'CRIACAO' | 'APROVACAO' }[]
}

interface Suggestion {
  appAction: string
  appName: string
  actionLabel: string
  matched: string[]
  confident: boolean
}

interface RoleCheck {
  key: string
  label: string
  required: boolean
  field?: { id: string; title: string; how: 'ligado' | 'nome' | 'titulo' }
  source?: 'servico' | 'pessoa' | 'perfil'
}

interface FieldCheck {
  roles: RoleCheck[]
  missingRequired: string[]
  fieldsToAdd: Record<string, any>
}

interface Props {
  departmentCode?: string
  destination: ServiceDestination
  appAction: string
  onChange: (field: any, value: any) => void
  /** Nome/descrição/subtipo do serviço — base da sugestão de app */
  serviceName?: string
  description?: string
  serviceSubtype?: string
  /** Formulário do serviço — base da conferência de campos */
  formSchema?: any
  /** Serviço novo: aplica a sugestão sozinho enquanto ninguém escolheu o destino */
  autoSuggest?: boolean
  /** Avisado quando a pessoa (ou a sugestão automática) define o destino */
  onTouched?: () => void
}

const SOURCE_TEXT: Record<string, string> = {
  servico: 'vem do nome do serviço',
  pessoa: 'vem do nome de quem pediu',
  perfil: 'vem do perfil do cidadão',
}

/** Tipo do campo na lista que a tela de captura de dados edita */
function fieldTypeOf(prop: any): string {
  if (prop?.type === 'boolean') return 'checkbox'
  if (prop?.type === 'number') return 'number'
  if (prop?.format === 'date') return 'date'
  if (prop?.widget === 'textarea') return 'textarea'
  return 'text'
}

export function DestinationStep({
  departmentCode,
  destination,
  appAction,
  onChange,
  serviceName,
  description,
  serviceSubtype,
  formSchema,
  autoSuggest = false,
  onTouched,
}: Props) {
  const { apiRequest } = useAdminAuth()
  const [apps, setApps] = useState<CatalogApp[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [autoApplied, setAutoApplied] = useState(false)
  const [check, setCheck] = useState<FieldCheck | null>(null)
  const autoTried = useRef(false)

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

  // Sugestão de app pelo nome do serviço
  useEffect(() => {
    if (!serviceName?.trim() || !departmentCode) {
      setSuggestion(null)
      return
    }
    let active = true
    apiRequest('/api/app-catalog/suggest', {
      method: 'POST',
      body: JSON.stringify({ name: serviceName, description, departmentCode, serviceSubtype }),
    })
      .then((res: any) => {
        if (!active) return
        const best: Suggestion | undefined = res?.data?.suggestions?.[0]
        setSuggestion(best?.confident ? best : null)
      })
      .catch(() => active && setSuggestion(null))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceName, description, departmentCode, serviceSubtype])

  // Serviço novo: aplica a sugestão uma vez, enquanto o destino não foi escolhido
  useEffect(() => {
    if (!autoSuggest || autoTried.current || !suggestion || apps.length === 0) return
    autoTried.current = true
    if (destination === 'FILA' && !appAction && apps.some((app) => app.actions.some((a) => a.code === suggestion.appAction))) {
      onChange('destination', 'APP')
      onChange('appAction', suggestion.appAction)
      setAutoApplied(true)
      onTouched?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSuggest, suggestion, apps])

  // O que o app vai receber deste formulário
  const schemaKey = useMemo(() => JSON.stringify(formSchema?.properties || {}), [formSchema])
  useEffect(() => {
    if (destination !== 'APP' || !appAction) {
      setCheck(null)
      return
    }
    let active = true
    apiRequest('/api/app-catalog/field-check', {
      method: 'POST',
      body: JSON.stringify({ appAction, formSchema: formSchema || {} }),
    })
      .then((res: any) => active && setCheck(res?.data || null))
      .catch(() => active && setCheck(null))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, appAction, schemaKey])

  const selected = useMemo(() => {
    for (const app of apps) {
      const action = app.actions.find((a) => a.code === appAction)
      if (action) return { app, action }
    }
    return null
  }, [apps, appAction])

  const formFields = useMemo(
    () =>
      Object.entries<any>(formSchema?.properties || {})
        .filter(([id]) => !id.startsWith('citizen_'))
        .map(([id, prop]) => ({ id, title: String(prop?.title || id) })),
    [formSchema]
  )

  const choose = (field: 'destination' | 'appAction', value: string) => {
    setAutoApplied(false)
    onTouched?.()
    onChange(field, value)
  }

  /** Acrescenta ao formulário os campos que o app precisa e ainda não existem */
  const addMissingFields = () => {
    if (!check) return
    const toAdd = Object.entries<any>(check.fieldsToAdd || {})
    if (!toAdd.length) return
    const requiredKeys = new Set(check.roles.filter((role) => role.required).map((role) => role.key))
    const base = formSchema || { type: 'object', properties: {}, required: [] }
    const properties = { ...(base.properties || {}) }
    const fields = Array.isArray(base.fields) ? [...base.fields] : null
    const required = new Set<string>(Array.isArray(base.required) ? base.required : [])
    for (const [key, prop] of toAdd) {
      properties[key] = prop
      if (requiredKeys.has(key)) required.add(key)
      fields?.push({ id: key, type: fieldTypeOf(prop), label: prop.title, required: requiredKeys.has(key) })
    }
    onChange('formSchema', { ...base, type: 'object', properties, required: [...required], ...(fields ? { fields } : {}) })
  }

  /** Diz ao app qual campo do formulário é aquele dado (fica gravado no campo) */
  const bindField = (roleKey: string, fieldId: string) => {
    const base = formSchema || { type: 'object', properties: {} }
    const properties: Record<string, any> = {}
    for (const [id, prop] of Object.entries<any>(base.properties || {})) {
      const { ['x-app-field']: current, ...rest } = prop || {}
      if (id === fieldId) properties[id] = { ...rest, 'x-app-field': roleKey }
      else properties[id] = current === roleKey ? rest : prop
    }
    onChange('formSchema', { ...base, properties })
  }

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
          choose('destination', value)
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
  const suggestionIsOther = suggestion && !(destination === 'APP' && appAction === suggestion.appAction)
  const missingCount = check ? Object.keys(check.fieldsToAdd || {}).length : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">O que acontece depois do pedido?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Todo pedido gera um protocolo para o cidadão acompanhar. Escolha onde ele será atendido.
        </p>
      </div>

      {autoApplied && suggestion && destination === 'APP' && appAction === suggestion.appAction && (
        <div className="flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">
          <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Escolhemos o app <strong>{suggestion.appName}</strong> porque o nome do serviço fala de &quot;
            {suggestion.matched.slice(0, 2).join('", "')}&quot;. Se não for isso, marque &quot;Analisado no próprio
            protocolo&quot;.
          </span>
        </div>
      )}

      {suggestionIsOther && hasApps && (
        <div className="flex flex-col gap-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Este serviço parece ser do app <strong>{suggestion!.appName}</strong> ({suggestion!.actionLabel}).
            </span>
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              choose('destination', 'APP')
              onChange('appAction', suggestion!.appAction)
            }}
          >
            Usar este app
          </Button>
        </div>
      )}

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
          <Select value={appAction || undefined} onValueChange={(value) => choose('appAction', value)}>
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

      {destination === 'APP' && check && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-medium">O que o app vai receber do formulário</h3>
              <p className="text-sm text-muted-foreground">
                O sistema acha cada dado pelo título do campo. Se ele errou, escolha o campo certo.
              </p>
            </div>
            {missingCount > 0 && (
              <Button size="sm" onClick={addMissingFields}>
                <Plus className="h-4 w-4 mr-1" /> Acrescentar {missingCount === 1 ? 'o campo que falta' : `os ${missingCount} campos que faltam`}
              </Button>
            )}
          </div>

          {check.missingRequired.length > 0 && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Sem {check.missingRequired.join(', ')}, o caso chega incompleto ao app e a equipe vai ter que perguntar ao
                cidadão.
              </span>
            </div>
          )}

          <div className="divide-y rounded-md border">
            {check.roles.map((role) => {
              const ok = Boolean(role.field || role.source)
              return (
                <div key={role.key} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-2 text-sm">
                    {ok ? (
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                    ) : role.required ? (
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 shrink-0" />
                    ) : (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gray-300" />
                    )}
                    <div>
                      <span className="font-medium">{role.label}</span>
                      {role.required && !ok && <Badge variant="outline" className="ml-2 text-amber-700">necessário</Badge>}
                      <div className="text-xs text-muted-foreground">
                        {role.field
                          ? `campo "${role.field.title}"`
                          : role.source
                            ? SOURCE_TEXT[role.source]
                            : role.required
                              ? 'nenhum campo do formulário'
                              : 'opcional — não está no formulário'}
                      </div>
                    </div>
                  </div>
                  {formFields.length > 0 && (
                    <Select value={role.field?.id || undefined} onValueChange={(fieldId) => bindField(role.key, fieldId)}>
                      <SelectTrigger className="h-8 w-full sm:w-64 text-xs" aria-label={`Campo de ${role.label}`}>
                        <SelectValue placeholder="Escolher campo do formulário" />
                      </SelectTrigger>
                      <SelectContent>
                        {formFields.map((field) => (
                          <SelectItem key={field.id} value={field.id}>
                            {field.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Campos do formulário que não aparecem aqui não se perdem: chegam ao app em &quot;Outros dados&quot;.
          </p>
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
