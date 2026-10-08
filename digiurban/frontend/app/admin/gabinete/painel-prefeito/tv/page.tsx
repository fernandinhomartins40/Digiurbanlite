'use client'

/**
 * Painel do Prefeito — modo TV (perfil Gabinete). Para deixar aberto numa TV,
 * no visual padrão da aplicação (DigiUrban Glass, mesmos cartões do Painel):
 * mapa grande com os pedidos em aberto, barra lateral com os pedidos
 * chegando/andando ao vivo, Demandas do Gabinete e secretarias com mais
 * atraso, e os números do dia no topo. Atualiza sozinho (30 s; mapa 60 s).
 * Sem barra de cima nem menu inferior (AdminLayout não desenha nesta rota).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, Maximize, Minimize } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LgAmbient } from '@/components/liquid-glass/LgAmbient'
import { cn } from '@/lib/utils'
import type { TvPoint } from '@/components/admin/gabinete/tv/TvMap'

const TvMap = dynamic(() => import('@/components/admin/gabinete/tv/TvMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-lg bg-gray-100" />,
})

const STATUS: Record<string, { label: string; className: string }> = {
  VINCULADO: { label: 'Novo', className: 'bg-blue-100 text-blue-800' },
  PROGRESSO: { label: 'Em andamento', className: 'bg-amber-100 text-amber-800' },
  ATUALIZACAO: { label: 'Atualização', className: 'bg-purple-100 text-purple-800' },
  PENDENCIA: { label: 'Pendência', className: 'bg-purple-100 text-purple-800' },
  CONCLUIDO: { label: 'Concluído', className: 'bg-green-100 text-green-800' },
  CANCELADO: { label: 'Cancelado', className: 'bg-gray-200 text-gray-700' },
}

const TICKET: Record<string, string> = {
  PENDING: 'Aguardando a secretaria',
  ACCEPTED: 'Aceitas',
  PROTOCOL_CREATED: 'Viraram pedido',
  REJECTED: 'Recusadas',
  CANCELLED: 'Canceladas',
}

const hhmm = (value: string | Date) => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

async function get(path: string) {
  const response = await fetch(path, { credentials: 'include' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.success === false) throw new Error(data?.error || 'Sem conexão')
  return data
}

function Kpi({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium text-gray-600 sm:text-sm">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('text-3xl font-bold tabular-nums xl:text-4xl', tone)}>{value}</div>
      </CardContent>
    </Card>
  )
}

export default function PainelTvPage() {
  const { user } = useAdminAuth()
  const hasGabinete = user?.role === 'SUPER_ADMIN' || user?.gabineteAccess === true
  const [data, setData] = useState<any>(null)
  const [points, setPoints] = useState<TvPoint[]>([])
  const [now, setNow] = useState(new Date())
  const [offline, setOffline] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [fresh, setFresh] = useState<Set<string>>(new Set())
  const knownFeed = useRef<Set<string> | null>(null)

  // números + pedidos ao vivo (30 s); o que mudou desde a última leitura fica em destaque
  useEffect(() => {
    if (!hasGabinete) return
    let stop = false
    const load = async () => {
      try {
        const result = await get('/api/admin/gabinete/painel-prefeito/tv')
        if (stop) return
        const feed = result.data?.feed || []
        if (knownFeed.current) {
          const changed = feed.filter((item: any) => !knownFeed.current!.has(`${item.id}:${item.status}`)).map((item: any) => item.id)
          if (changed.length) {
            setFresh(new Set(changed))
            setTimeout(() => setFresh(new Set()), 25000)
          }
        }
        knownFeed.current = new Set(feed.map((item: any) => `${item.id}:${item.status}`))
        setData(result.data)
        setOffline(false)
      } catch {
        if (!stop) setOffline(true)
      }
    }
    void load()
    const timer = setInterval(load, 30000)
    return () => {
      stop = true
      clearInterval(timer)
    }
  }, [hasGabinete])

  // pontos do mapa (60 s): pedidos em aberto do município
  useEffect(() => {
    if (!hasGabinete) return
    let stop = false
    const load = () =>
      get('/api/map/protocols?situacao=abertos')
        .then((result) => !stop && setPoints(result.data || []))
        .catch(() => undefined)
    void load()
    const timer = setInterval(load, 60000)
    return () => {
      stop = true
      clearInterval(timer)
    }
  }, [hasGabinete])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => {
      clearInterval(timer)
      document.removeEventListener('fullscreenchange', onChange)
    }
  }, [])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen().catch(() => undefined)
  }

  const kpis = data?.kpis
  const ticketTotal = useMemo(() => Object.values((data?.demandas?.porSituacao || {}) as Record<string, number>).reduce((sum, value) => sum + value, 0), [data])

  if (user && !hasGabinete) {
    return (
      <div className="lg-root flex min-h-screen items-center justify-center">
        <LgAmbient />
        <Card className="relative">
          <CardHeader>
            <CardTitle>Acesso restrito</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">Só quem tem o perfil Gabinete do Prefeito abre o painel na TV.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="lg-root relative flex h-screen flex-col gap-3 overflow-hidden p-3 xl:gap-4 xl:p-5">
      <LgAmbient />

      {/* topo: mesma faixa azul do Painel do Prefeito */}
      <header className="relative flex items-center justify-between gap-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-3 text-white xl:px-6 xl:py-4">
        <div className="min-w-0">
          <p className="truncate text-sm text-blue-100">{data?.municipality || 'Prefeitura'}</p>
          <h1 className="text-xl font-bold xl:text-3xl">Painel do Prefeito · ao vivo</h1>
        </div>
        <div className="flex items-center gap-2 xl:gap-3">
          <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs xl:text-sm', offline ? 'bg-red-500/30' : 'bg-white/20')}>
            <span className={cn('h-2 w-2 rounded-full bg-current', !offline && 'animate-pulse')} />
            {offline ? 'sem conexão — tentando de novo' : data ? `atualizado às ${hhmm(data.generatedAt)}` : 'conectando'}
          </span>
          <span className="font-mono text-2xl tabular-nums xl:text-4xl">{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <Button variant="secondary" size="sm" onClick={toggleFullscreen} aria-label="Tela cheia">
            {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          {!fullscreen && (
            <Button variant="secondary" size="sm" asChild>
              <Link href="/admin/gabinete/painel-prefeito" aria-label="Voltar ao painel"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
          )}
        </div>
      </header>

      {/* números do dia */}
      <section className="relative grid grid-cols-3 gap-3 lg:grid-cols-6">
        <Kpi label="Em aberto" value={kpis?.abertos ?? '–'} tone="text-blue-700" />
        <Kpi label="Atrasados" value={kpis?.atrasados ?? '–'} tone={kpis?.atrasados ? 'text-red-600' : 'text-green-600'} />
        <Kpi label="No prazo" value={kpis?.noPrazo ?? '–'} tone="text-green-700" />
        <Kpi label="Chegaram hoje" value={kpis?.novosHoje ?? '–'} tone="text-gray-900" />
        <Kpi label="Concluídos hoje" value={kpis?.concluidosHoje ?? '–'} tone="text-green-700" />
        <Kpi label="Satisfação" value={kpis?.satisfacao != null ? kpis.satisfacao.toFixed(1) : '–'} tone="text-amber-600" />
      </section>

      {/* mapa + barra lateral */}
      <section className="relative grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_460px] xl:gap-4">
        <Card className="relative min-h-[300px] overflow-hidden p-0">
          <TvMap points={points} highlight={fresh} />
          <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex flex-wrap gap-3 rounded-lg border bg-white/90 px-3 py-2 text-xs text-gray-700 xl:text-sm">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-red-500" />Atrasado</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-blue-500" />Novo</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-500" />Em andamento</span>
            <span className="text-gray-500">{points.length} no mapa</span>
          </div>
        </Card>

        <aside className="flex min-h-0 flex-col gap-3">
          <Card className="flex min-h-0 flex-1 flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />Pedidos ao vivo
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-0 flex-1 overflow-hidden">
              <ul className="space-y-2">
                {(data?.feed || []).map((item: any) => {
                  const status = STATUS[item.status] || STATUS.PROGRESSO
                  return (
                    <li
                      key={`${item.id}:${item.status}`}
                      className={cn('rounded-md border px-3 py-2 transition-colors', fresh.has(item.id) ? 'border-blue-300 bg-blue-50' : 'bg-white/60')}
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-mono text-gray-500">#{item.number} · {hhmm(item.updatedAt)}</span>
                        <span className={cn('rounded-full px-2 py-0.5', item.overdue ? 'bg-red-100 text-red-700' : status.className)}>
                          {item.overdue ? 'Atrasado' : status.label}
                        </span>
                      </div>
                      <p className="truncate text-sm font-medium text-gray-900 xl:text-base">{item.service?.name || item.title}</p>
                      <p className="truncate text-xs text-gray-500">{item.department?.name}</p>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Demandas do Gabinete · {ticketTotal}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries((data?.demandas?.porSituacao || {}) as Record<string, number>).map(([status, count]) => (
                  <span key={status} className={cn('rounded-full px-2.5 py-1', status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700')}>
                    {TICKET[status] || status}: <strong>{count}</strong>
                  </span>
                ))}
                {ticketTotal === 0 && <span className="text-gray-500">Nenhuma demanda.</span>}
              </div>
              <ul className="space-y-1 text-sm">
                {(data?.demandas?.recentes || []).slice(0, 3).map((item: any) => (
                  <li key={item.id} className="truncate text-gray-700">
                    <span className="font-mono text-xs text-gray-500">{item.number}</span> {item.title}
                    <span className="text-xs text-gray-500"> · {item.department?.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mais atrasos por secretaria</CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.secretariasAtrasadas || []).length === 0 && <p className="text-sm text-green-700">Nenhuma secretaria com atraso.</p>}
              <ul className="space-y-1.5">
                {(data?.secretariasAtrasadas || []).map((item: any) => {
                  const max = data.secretariasAtrasadas[0]?.count || 1
                  return (
                    <li key={item.name} className="text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="truncate text-gray-900">{item.name}</span>
                        <span className="tabular-nums text-red-700">{item.count}</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-red-500" style={{ width: `${(item.count / max) * 100}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  )
}
