'use client'

/**
 * Painel do Prefeito — perfil Gabinete (marcado no cadastro do servidor).
 * Uma página com abas, para analisar e administrar o que acontece:
 *  - Hoje: pedidos (no prazo/atrasados/concluídos), satisfação, alertas,
 *    Agenda do Prefeito, assinaturas esperando, demandas do gabinete;
 *  - Secretarias: como cada uma está, com "ver atrasados" e "cobrar";
 *  - Território: o mapa dos pedidos do município;
 *  - Demandas do Gabinete: cidadão atendido no gabinete, acompanhar, ordens;
 *  - Gestão interna: processos internos, contratações por etapa, ordens do gabinete.
 * A busca do cidadão fica sempre em destaque, na faixa azul. "Abrir na TV"
 * abre o modo tela cheia (mapa ao vivo + pedidos chegando + números do dia).
 */

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, Bell, Building2, Calendar, ChevronDown, Monitor, ChevronUp, Circle, Loader2, PenLine, Plus, RefreshCw, Star } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { CitizenSearchBar } from '@/components/admin/gabinete/CitizenSearchBar'
import { ChamadosRecentesList } from '@/components/admin/gabinete/ChamadosRecentesList'
import { ProtocolsMapView } from '@/components/admin/map/ProtocolsMapView'
import { GabineteDemandas } from '@/components/admin/gabinete/GabineteDemandas'
import { cn } from '@/lib/utils'

const TABS = ['hoje', 'secretarias', 'territorio', 'demandas', 'gestao'] as const
type Tab = (typeof TABS)[number]

const time = (value: string) => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
const date = (value?: string | null) => (value ? new Date(value).toLocaleDateString('pt-BR') : '-')
const brl = (value?: number | null) => (value ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }) : '')

async function call(path: string, init?: RequestInit) {
  const response = await fetch(`/api/admin/gabinete/painel-prefeito${path}`, {
    credentials: 'include',
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.success === false) throw new Error(data?.error || 'Não foi possível concluir')
  return data
}

function Kpi({ label, value, hint, tone = 'text-gray-900' }: { label: string; value: string | number; hint?: string; tone?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-gray-600 sm:text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold sm:text-3xl', tone)}>{value}</div>
        {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function PainelPrefeito() {
  const { user } = useAdminAuth()
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tab: Tab = (TABS as readonly string[]).includes(searchParams.get('aba') || '') ? (searchParams.get('aba') as Tab) : 'hoje'
  const [territorioVisited, setTerritorioVisited] = useState(tab === 'territorio')
  useEffect(() => {
    if (tab === 'territorio') setTerritorioVisited(true)
  }, [tab])
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [openDept, setOpenDept] = useState<string | null>(null)
  const [overdueList, setOverdueList] = useState<any[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  const hasGabinete = user?.role === 'SUPER_ADMIN' || user?.gabineteAccess === true

  const load = async () => {
    try {
      setLoading(true)
      const result = await call('/overview')
      setData(result.data)
      setUpdatedAt(new Date())
    } catch (error: any) {
      toast({ title: 'Erro', description: error?.message || 'Não foi possível carregar o painel', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!hasGabinete) return
    void load()
    const interval = setInterval(load, 120000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGabinete])

  if (!user || !hasGabinete) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
            <CardDescription>Só quem tem o perfil Gabinete do Prefeito (marcado no cadastro do servidor) acessa este painel.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const changeTab = (next: string) => router.replace(next === 'hoje' ? pathname : `${pathname}?aba=${next}`, { scroll: false })

  const toggleDept = async (departmentId: string) => {
    if (openDept === departmentId) return setOpenDept(null)
    setOpenDept(departmentId)
    setOverdueList([])
    try {
      const result = await call(`/secretarias/${departmentId}/atrasados`)
      setOverdueList(result.data || [])
    } catch {
      setOverdueList([])
    }
  }

  const chargeDept = async (departmentId: string, name: string) => {
    try {
      setBusy(`dept:${departmentId}`)
      const result = await call(`/secretarias/${departmentId}/cobrar`, { method: 'POST', body: JSON.stringify({}) })
      toast({ title: `Cobrança enviada à ${name}`, description: result.data?.notified ? `${result.data.notified} pessoa(s) da chefia avisada(s)` : 'A secretaria não tem gerente/coordenador cadastrado para avisar' })
    } catch (error: any) {
      toast({ title: 'Não foi possível cobrar', description: error?.message, variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }

  const chargeProtocol = async (protocolId: string) => {
    try {
      setBusy(`protocol:${protocolId}`)
      const result = await call(`/request-urgency/${protocolId}`, { method: 'POST', body: JSON.stringify({}) })
      toast({ title: 'Cobrança enviada', description: result.message })
    } catch (error: any) {
      toast({ title: 'Não foi possível cobrar', description: error?.message, variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }

  const hoje = data?.hoje
  const variation = hoje && hoje.concluidosMesAnterior ? Math.round(((hoje.concluidosMes - hoje.concluidosMesAnterior) / hoje.concluidosMesAnterior) * 100) : null

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Painel do Prefeito</h1>
            <p className="text-sm text-blue-100">O que acontece na administração, hoje.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs">
              <Circle className="h-2 w-2 fill-current" />
              {updatedAt ? `atualizado às ${updatedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'carregando'}
            </span>
            <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />Atualizar
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <a href="/admin/gabinete/painel-prefeito/tv" target="_blank" rel="noreferrer">
                <Monitor className="mr-2 h-4 w-4" />Abrir na TV
              </a>
            </Button>
          </div>
        </div>
        {/* busca do cidadão: sempre à mão, em destaque */}
        <div className="mt-4 w-full max-w-3xl">
          <CitizenSearchBar />
        </div>
      </div>

      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="hoje">Hoje</TabsTrigger>
          <TabsTrigger value="secretarias">Secretarias</TabsTrigger>
          <TabsTrigger value="territorio">Território</TabsTrigger>
          <TabsTrigger value="demandas">Demandas do Gabinete</TabsTrigger>
          <TabsTrigger value="gestao">Gestão interna</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------ HOJE */}
        <TabsContent value="hoje" className="mt-4 space-y-4">
          {!data ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="Pedidos em aberto" value={hoje.abertos} hint={`${hoje.novosHoje} novo(s) hoje`} tone="text-blue-700" />
                <Kpi label="Atrasados" value={hoje.atrasados} hint={`${hoje.noPrazo} no prazo`} tone={hoje.atrasados ? 'text-red-600' : 'text-green-600'} />
                <Kpi
                  label="Concluídos no mês"
                  value={hoje.concluidosMes}
                  hint={variation === null ? `mês anterior: ${hoje.concluidosMesAnterior}` : `${variation >= 0 ? '+' : ''}${variation}% sobre o mês anterior`}
                  tone="text-green-700"
                />
                <Kpi
                  label="Satisfação (90 dias)"
                  value={hoje.satisfacao === null ? '—' : `${hoje.satisfacao.toFixed(1)} / 5`}
                  hint={`${hoje.avaliacoes} avaliação(ões) · tempo médio ${hoje.tempoMedioDias ?? '—'} dias`}
                  tone="text-amber-600"
                />
              </div>

              {data.alertas.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="h-5 w-5 text-red-600" />Atenção</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-sm">
                    {data.alertas.map((alert: any) => (
                      <p key={alert.text} className={cn('rounded-md px-3 py-2', alert.level === 'alto' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-900')}>
                        {alert.href ? <Link href={alert.href} className="hover:underline">{alert.text}</Link> : alert.text}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span className="flex items-center gap-2"><Calendar className="h-5 w-5 text-purple-600" />Agenda do Prefeito — hoje</span>
                      <Link href="/admin/agenda" className="text-xs font-normal text-blue-700 hover:underline">abrir agenda</Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {data.agendaHoje.length === 0 && <p className="text-gray-500">Nenhum compromisso hoje.</p>}
                    {data.agendaHoje.map((event: any) => (
                      <div key={event.id} className="flex gap-3 rounded-md border p-2">
                        <span className="w-14 shrink-0 font-mono text-gray-700">{time(event.startAt)}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">{event.title}{event.isPrivate ? ' (particular)' : ''}</p>
                          {event.location && <p className="text-xs text-gray-500">{event.location}</p>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base"><PenLine className="h-5 w-5 text-amber-600" />Esperando a sua assinatura</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5 text-sm">
                    {data.assinaturas.length === 0 && <p className="text-gray-500">Nada para assinar.</p>}
                    {data.assinaturas.map((item: any) => (
                      <Link key={item.id} href={item.url} className="block rounded-md bg-amber-50 px-3 py-2 hover:bg-amber-100">
                        <span className="block truncate text-gray-900">{item.title}</span>
                        <span className="text-xs text-gray-600">pedido por {item.by}</span>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <ChamadosRecentesList />
            </>
          )}
        </TabsContent>

        {/* ------------------------------------------------ SECRETARIAS */}
        <TabsContent value="secretarias" className="mt-4 space-y-3">
          {!data ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : data.secretarias.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum pedido nas secretarias ainda.</p>
          ) : (
            data.secretarias.map((dept: any) => (
              <Card key={dept.id}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-medium text-gray-900"><Building2 className="h-4 w-4 text-gray-500" />{dept.name}</p>
                      <div className="mt-2 h-2 w-full max-w-md overflow-hidden rounded-full bg-gray-100" title={`${dept.percentualAtraso}% atrasados`}>
                        <div className={cn('h-full', dept.percentualAtraso >= 50 ? 'bg-red-500' : dept.percentualAtraso >= 30 ? 'bg-amber-500' : 'bg-green-500')} style={{ width: `${Math.max(dept.percentualAtraso, dept.abertos ? 3 : 0)}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-5">
                      <span><strong>{dept.abertos}</strong> em aberto</span>
                      <span className={dept.atrasados ? 'text-red-700' : ''}><strong>{dept.atrasados}</strong> atrasados</span>
                      <span><strong>{dept.concluidos30}</strong> concluídos (30d)</span>
                      <span>{dept.tempoMedioDias ?? '—'} dias em média</span>
                      <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" />{dept.satisfacao ?? '—'}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleDept(dept.id)} disabled={!dept.atrasados}>
                      {openDept === dept.id ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}Ver atrasados
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => chargeDept(dept.id, dept.name)} disabled={!dept.atrasados || busy === `dept:${dept.id}`}>
                      <Bell className="mr-1 h-4 w-4" />Cobrar a secretaria
                    </Button>
                  </div>
                  {openDept === dept.id && (
                    <div className="space-y-2">
                      {overdueList.length === 0 && <p className="text-sm text-gray-500">Carregando...</p>}
                      {overdueList.map((item: any) => (
                        <div key={item.id} className="flex flex-col gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <Link href={`/admin/protocolos/${item.id}`} className="font-medium text-blue-700 hover:underline">#{item.number}</Link>{' '}
                            <span className="text-gray-900">{item.title}</span>
                            <p className="text-xs text-gray-600">
                              {item.service?.name} · {item.sla?.daysOverdue || 0} dia(s) de atraso · com {item.currentAssignedUser?.name || 'ninguém atribuído'}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => chargeProtocol(item.id)} disabled={busy === `protocol:${item.id}`}>
                            <Bell className="mr-1 h-4 w-4" />Cobrar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ------------------------------------------------ TERRITÓRIO */}
        {/* depois de aberto, o mapa fica vivo (escondido) ao trocar de aba: voltar não conta nova abertura do Google */}
        <div role="tabpanel" className={tab === 'territorio' ? 'mt-4' : 'hidden'}>
          {territorioVisited && <ProtocolsMapView defaultSituacao="abertos" />}
        </div>

        {/* ------------------------------------------------ DEMANDAS DO GABINETE */}
        <TabsContent value="demandas" className="mt-4">
          {tab === 'demandas' && <GabineteDemandas onOpenGestao={() => changeTab('gestao')} />}
        </TabsContent>

        {/* ------------------------------------------------ GESTÃO INTERNA */}
        <TabsContent value="gestao" className="mt-4 space-y-4">
          {!data ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Kpi label="Processos internos em aberto" value={data.gestaoInterna.abertos} tone="text-blue-700" />
                <Kpi label="Fora do prazo" value={data.gestaoInterna.atrasados} tone={data.gestaoInterna.atrasados ? 'text-red-600' : 'text-green-600'} />
                <Kpi label="Contratações em andamento" value={data.gestaoInterna.licitacoes.length} tone="text-indigo-700" />
                <Kpi label="Contratações com etapa vencida" value={data.gestaoInterna.licitacoesAtrasadas} tone={data.gestaoInterna.licitacoesAtrasadas ? 'text-red-600' : 'text-green-600'} />
              </div>

              {data.gestaoInterna.porTipo.length > 0 && (
                <div className="flex flex-wrap gap-2 text-sm">
                  {data.gestaoInterna.porTipo.map((item: any) => (
                    <span key={item.name} className="rounded-full bg-gray-100 px-3 py-1">{item.name}: {item.count}</span>
                  ))}
                </div>
              )}

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Contratações (Lei 14.133) por etapa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {data.gestaoInterna.licitacoes.length === 0 && <p className="text-gray-500">Nenhuma contratação em andamento.</p>}
                  {data.gestaoInterna.licitacoes.map((item: any) => (
                    <Link key={item.id} href={`/admin/processos-internos/${item.id}`} className={cn('block rounded-md border p-2 hover:bg-gray-50', item.overdue && 'border-red-200 bg-red-50')}>
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-gray-500">{item.number}</span>
                        <span className="font-medium text-gray-900">{item.subject}</span>
                        {item.valor && <span className="text-xs text-gray-600">{brl(item.valor)}</span>}
                      </p>
                      <p className="text-xs text-gray-600">
                        {item.flow} · etapa {item.stageIndex}/{item.stages}: <strong>{item.stage}</strong> · com {item.unit} · prazo da etapa {date(item.stageDueAt)}
                        {item.overdue && <span className="ml-1 font-medium text-red-700">(vencido)</span>}
                      </p>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                    <span>Ordens do gabinete às secretarias</span>
                    <Button size="sm" asChild>
                      <Link href="/admin/processos-internos/novo?tipo=OFI"><Plus className="mr-1 h-4 w-4" />Nova ordem</Link>
                    </Button>
                  </CardTitle>
                  <CardDescription>Ofícios e memorandos enviados pela equipe do gabinete, em andamento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {data.gestaoInterna.ordens.length === 0 && <p className="text-gray-500">Nenhuma ordem em andamento.</p>}
                  {data.gestaoInterna.ordens.map((item: any) => (
                    <Link key={item.id} href={`/admin/processos-internos/${item.id}`} className={cn('block rounded-md border p-2 hover:bg-gray-50', item.overdue && 'border-red-200 bg-red-50')}>
                      <p><span className="font-mono text-xs text-gray-500">{item.number}</span> <span className="font-medium text-gray-900">{item.subject}</span></p>
                      <p className="text-xs text-gray-600">com {item.currentUnitName} · prazo {date(item.dueAt)} · por {item.createdByName}{item.overdue && <span className="ml-1 font-medium text-red-700">(vencido)</span>}</p>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

      </Tabs>
    </div>
  )
}

export default function PainelPrefeitoPage() {
  return (
    <Suspense fallback={null}>
      <PainelPrefeito />
    </Suspense>
  )
}
