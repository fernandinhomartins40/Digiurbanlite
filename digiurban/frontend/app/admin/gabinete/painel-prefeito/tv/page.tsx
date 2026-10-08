'use client'

/**
 * Painel do Prefeito — modo TV (perfil Gabinete). Para deixar aberto numa TV:
 * tela cheia escura, mapa grande com os pedidos em aberto, barra lateral com
 * os pedidos chegando/andando ao vivo, Demandas do Gabinete e secretarias com
 * mais atraso, e os números do dia no topo. Atualiza sozinho (30 s; mapa 60 s).
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowLeft, Maximize, Minimize } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { cn } from '@/lib/utils'
import type { TvPoint } from '@/components/admin/gabinete/tv/TvMap'

const TvMap = dynamic(() => import('@/components/admin/gabinete/tv/TvMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-slate-900" />,
})

const STATUS: Record<string, { label: string; className: string }> = {
  VINCULADO: { label: 'Novo', className: 'bg-sky-500/20 text-sky-300' },
  PROGRESSO: { label: 'Em andamento', className: 'bg-amber-500/20 text-amber-300' },
  ATUALIZACAO: { label: 'Atualização', className: 'bg-violet-500/20 text-violet-300' },
  PENDENCIA: { label: 'Pendência', className: 'bg-violet-500/20 text-violet-300' },
  CONCLUIDO: { label: 'Concluído', className: 'bg-emerald-500/20 text-emerald-300' },
  CANCELADO: { label: 'Cancelado', className: 'bg-slate-500/20 text-slate-300' },
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
    <div className="rounded-2xl bg-slate-900/80 px-4 py-3 ring-1 ring-white/5">
      <p className="text-xs uppercase tracking-wide text-slate-400 xl:text-sm">{label}</p>
      <p className={cn('text-3xl font-bold tabular-nums xl:text-5xl', tone)}>{value}</p>
    </div>
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

  // números + pedidos ao vivo (30 s); quem é novo desde a última leitura pisca no mapa e na lista
  useEffect(() => {
    if (!hasGabinete) return
    let stop = false
    const load = async () => {
      try {
        const result = await get('/api/admin/gabinete/painel-prefeito/tv')
        if (stop) return
        const ids: string[] = (result.data?.feed || []).map((item: any) => `${item.id}:${item.status}`)
        if (knownFeed.current) {
          const changed = (result.data?.feed || []).filter((item: any) => !knownFeed.current!.has(`${item.id}:${item.status}`)).map((item: any) => item.id)
          if (changed.length) {
            setFresh(new Set(changed))
            setTimeout(() => setFresh(new Set()), 25000)
          }
        }
        knownFeed.current = new Set(ids)
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
      <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950 text-slate-300">
        Só quem tem o perfil Gabinete do Prefeito abre o painel na TV.
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[300] flex flex-col gap-3 overflow-hidden bg-slate-950 p-3 text-white xl:gap-4 xl:p-5">
      {/* topo */}
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-400 xl:text-base">{data?.municipality || 'Prefeitura'}</p>
          <h1 className="text-xl font-bold xl:text-3xl">Painel do Prefeito · ao vivo</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('flex items-center gap-2 rounded-full px-3 py-1 text-xs xl:text-sm', offline ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/15 text-emerald-300')}>
            <span className={cn('h-2.5 w-2.5 rounded-full', offline ? 'bg-red-400' : 'animate-pulse bg-emerald-400')} />
            {offline ? 'sem conexão — tentando de novo' : data ? `atualizado ${hhmm(data.generatedAt)}` : 'conectando'}
          </span>
          <span className="font-mono text-2xl tabular-nums xl:text-4xl">{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          <button type="button" onClick={toggleFullscreen} className="rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="Tela cheia">
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
          {!fullscreen && (
            <Link href="/admin/gabinete/painel-prefeito" className="rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="Voltar ao painel">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
        </div>
      </header>

      {/* números do dia */}
      <section className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        <Kpi label="Em aberto" value={kpis?.abertos ?? '–'} tone="text-sky-300" />
        <Kpi label="Atrasados" value={kpis?.atrasados ?? '–'} tone={kpis?.atrasados ? 'text-red-400' : 'text-emerald-300'} />
        <Kpi label="No prazo" value={kpis?.noPrazo ?? '–'} tone="text-emerald-300" />
        <Kpi label="Chegaram hoje" value={kpis?.novosHoje ?? '–'} tone="text-white" />
        <Kpi label="Concluídos hoje" value={kpis ? `${kpis.concluidosHoje}` : '–'} tone="text-emerald-300" />
        <Kpi label="Satisfação" value={kpis?.satisfacao != null ? kpis.satisfacao.toFixed(1) : '–'} tone="text-amber-300" />
      </section>

      {/* mapa + barra lateral */}
      <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_460px] xl:gap-4">
        <div className="relative min-h-[300px] overflow-hidden rounded-2xl ring-1 ring-white/5">
          <TvMap points={points} highlight={fresh} />
          <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex gap-3 rounded-xl bg-slate-950/80 px-3 py-2 text-xs xl:text-sm">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-red-500" />Atrasado</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-sky-400" />Novo</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-400" />Em andamento</span>
            <span className="text-slate-400">{points.length} no mapa</span>
          </div>
        </div>

        <aside className="flex min-h-0 flex-col gap-3">
          {/* ao vivo */}
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl bg-slate-900/80 p-3 ring-1 ring-white/5">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />Pedidos ao vivo
            </p>
            <ul className="min-h-0 flex-1 space-y-2 overflow-hidden">
              {(data?.feed || []).map((item: any) => {
                const status = STATUS[item.status] || STATUS.PROGRESSO
                return (
                  <li
                    key={`${item.id}:${item.status}`}
                    className={cn('rounded-xl px-3 py-2 transition-colors', fresh.has(item.id) ? 'bg-sky-500/20 ring-1 ring-sky-400/60' : 'bg-white/[0.03]')}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono text-slate-400">#{item.number} · {hhmm(item.updatedAt)}</span>
                      <span className={cn('rounded-full px-2 py-0.5', item.overdue ? 'bg-red-500/20 text-red-300' : status.className)}>
                        {item.overdue ? 'Atrasado' : status.label}
                      </span>
                    </div>
                    <p className="truncate text-sm font-medium xl:text-base">{item.service?.name || item.title}</p>
                    <p className="truncate text-xs text-slate-400">{item.department?.name}</p>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* demandas do gabinete */}
          <div className="rounded-2xl bg-slate-900/80 p-3 ring-1 ring-white/5">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Demandas do Gabinete · {ticketTotal}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries((data?.demandas?.porSituacao || {}) as Record<string, number>).map(([status, count]) => (
                <span key={status} className={cn('rounded-full px-2.5 py-1', status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-300')}>
                  {TICKET[status] || status}: <strong>{count}</strong>
                </span>
              ))}
              {ticketTotal === 0 && <span className="text-slate-500">Nenhuma demanda.</span>}
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {(data?.demandas?.recentes || []).slice(0, 3).map((item: any) => (
                <li key={item.id} className="truncate text-slate-300">
                  <span className="font-mono text-xs text-slate-500">{item.number}</span> {item.title}
                  <span className="text-xs text-slate-500"> · {item.department?.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* secretarias com mais atraso */}
          <div className="rounded-2xl bg-slate-900/80 p-3 ring-1 ring-white/5">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Mais atrasos por secretaria</p>
            {(data?.secretariasAtrasadas || []).length === 0 && <p className="text-sm text-emerald-300">Nenhuma secretaria com atraso.</p>}
            <ul className="space-y-1.5">
              {(data?.secretariasAtrasadas || []).map((item: any) => {
                const max = data.secretariasAtrasadas[0]?.count || 1
                return (
                  <li key={item.name} className="text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="truncate">{item.name}</span>
                      <span className="tabular-nums text-red-300">{item.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-red-500/70" style={{ width: `${(item.count / max) * 100}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  )
}
