'use client'

/**
 * Painel do Prefeito — modo TV (perfil Gabinete), no visual padrão da
 * aplicação (DigiUrban Glass, cartões padrão, faixa azul do Painel):
 *  - números do dia em cartões coloridos;
 *  - mapa grande dos pedidos em aberto (abre no município mesmo sem pedidos);
 *  - faixa de gráficos acima do mapa, passando em loop: pedidos por situação, % no prazo, últimos 7 dias (chegaram ×
 *    concluídos), chegadas por hora hoje, atrasos por secretaria, demandas do
 *    gabinete;
 *  - lista de pedidos ao vivo rolando sozinha; o que chega entra no topo em destaque.
 * Atualiza sozinho (30 s; mapa 60 s). Sem barra de cima nem menu inferior.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock, FolderOpen, Inbox, Maximize, Minimize, PanelRightClose, PanelRightOpen, Star } from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LgAmbient } from '@/components/liquid-glass/LgAmbient'
import { cn } from '@/lib/utils'
import type { TvPoint } from '@/components/admin/gabinete/tv/TvMap'

const TvMap = dynamic(() => import('@/components/admin/gabinete/tv/TvMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-gray-100" />,
})

// cores padrão (Tailwind) usadas nas outras telas
const C = { blue: '#3b82f6', green: '#22c55e', red: '#ef4444', amber: '#f59e0b', purple: '#8b5cf6', pink: '#ec4899', cyan: '#06b6d4', indigo: '#6366f1', gray: '#9ca3af' }

const STATUS: Record<string, { label: string; className: string; color: string }> = {
  VINCULADO: { label: 'Novo', className: 'bg-blue-100 text-blue-800', color: C.blue },
  PROGRESSO: { label: 'Em andamento', className: 'bg-amber-100 text-amber-800', color: C.amber },
  ATUALIZACAO: { label: 'Atualização', className: 'bg-purple-100 text-purple-800', color: C.purple },
  PENDENCIA: { label: 'Pendência', className: 'bg-pink-100 text-pink-800', color: C.pink },
  CONCLUIDO: { label: 'Concluído', className: 'bg-green-100 text-green-800', color: C.green },
  CANCELADO: { label: 'Cancelado', className: 'bg-gray-200 text-gray-700', color: C.gray },
}

const TICKET: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Aguardando', color: C.amber },
  ACCEPTED: { label: 'Aceitas', color: C.blue },
  PROTOCOL_CREATED: { label: 'Viraram pedido', color: C.green },
  REJECTED: { label: 'Recusadas', color: C.red },
  CANCELLED: { label: 'Canceladas', color: C.gray },
}

const hhmm = (value: string | Date) => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

async function get(path: string) {
  const response = await fetch(path, { credentials: 'include' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.success === false) throw new Error(data?.error || 'Sem conexão')
  return data
}

function Kpi({ label, value, hint, icon: Icon, color, bg }: { label: string; value: string | number; hint?: string; icon: any; color: string; bg: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-2 px-3 py-1.5">
        <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full xl:h-8 xl:w-8', bg)}>
          <Icon className={cn('h-4 w-4 xl:h-5 xl:w-5', color)} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium text-gray-600 xl:text-xs">{label}</p>
          <p className="flex items-baseline gap-1.5 leading-tight">
            <span className={cn('text-lg font-bold tabular-nums xl:text-xl', color)}>{value}</span>
            {hint && <span className="truncate text-[10px] text-gray-500 xl:text-[11px]">{hint}</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={cn('flex h-full w-[210px] shrink-0 flex-col xl:w-[250px]', className)}>
      <CardHeader className="px-2.5 pb-0 pt-1.5">
        <CardTitle className="truncate text-xs xl:text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-1.5 pb-1 pt-0.5">{children}</CardContent>
    </Card>
  )
}

/**
 * Faixa que passa sozinha para o lado em loop sem fim (os cartões vêm duas
 * vezes: ao chegar no fim da 1ª volta, salta para o começo sem a pessoa
 * perceber). Mouse em cima, toque ou rolagem manual pausam por alguns segundos.
 * Se tudo cabe na tela, fica parada e sem repetir.
 */
function AutoMarquee({ children, className }: { children: React.ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const firstSet = useRef<HTMLDivElement>(null)
  const pausedUntil = useRef(0)
  const hovering = useRef(false)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const measure = () => {
      if (box.current && firstSet.current) setOverflowing(firstSet.current.scrollWidth > box.current.clientWidth + 4)
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (box.current) observer.observe(box.current)
    if (firstSet.current) observer.observe(firstSet.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!overflowing) return
    let frame = 0
    let last = performance.now()
    const step = (time: number) => {
      const element = box.current
      const set = firstSet.current
      const elapsed = time - last
      last = time
      if (element && set && !hovering.current && time > pausedUntil.current) {
        element.scrollLeft += elapsed * 0.04 // ~40 px por segundo
      }
      // loop: passou a 1ª volta (largura dos cartões + espaço), volta o mesmo tanto
      if (element && set) {
        const lap = set.offsetWidth + 12
        if (element.scrollLeft >= lap) element.scrollLeft -= lap
        else if (element.scrollLeft <= 0 && time <= pausedUntil.current) element.scrollLeft += lap
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [overflowing])

  const pause = () => (pausedUntil.current = performance.now() + 5000)

  return (
    <div
      ref={box}
      className={cn('flex gap-3 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}
      onMouseEnter={() => (hovering.current = true)}
      onMouseLeave={() => (hovering.current = false)}
      onWheel={(event) => {
        pause()
        // roda do mouse (para cima/baixo) também passa os cartões para o lado
        if (box.current && Math.abs(event.deltaY) > Math.abs(event.deltaX)) box.current.scrollLeft += event.deltaY
      }}
      onTouchStart={pause}
      onPointerDown={pause}
    >
      <div ref={firstSet} className="flex h-full shrink-0 gap-3">
        {children}
      </div>
      {overflowing && (
        <div className="flex h-full shrink-0 gap-3" aria-hidden>
          {children}
        </div>
      )}
    </div>
  )
}

/** Lista que rola sozinha (pausa com o mouse em cima); volta ao topo quando chega coisa nova */
function AutoScrollList({ children, resetKey }: { children: React.ReactNode; resetKey: string }) {
  const box = useRef<HTMLDivElement>(null)
  const paused = useRef(false)
  useEffect(() => {
    if (box.current) box.current.scrollTop = 0
  }, [resetKey])
  useEffect(() => {
    let frame = 0
    let last = performance.now()
    let hold = 0
    const step = (time: number) => {
      const element = box.current
      const elapsed = time - last
      last = time
      if (element && !paused.current) {
        const max = element.scrollHeight - element.clientHeight
        if (max > 0) {
          if (hold > 0) {
            hold -= elapsed
            if (hold <= 0 && element.scrollTop >= max - 1) element.scrollTop = 0
          } else {
            element.scrollTop += elapsed * 0.025 // ~25 px por segundo
            if (element.scrollTop >= max - 1) hold = 3000 // espera no fim e volta ao começo
          }
        }
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [])
  return (
    <div
      ref={box}
      className="h-full overflow-hidden"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      {children}
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
  // "Pedidos ao vivo" pode ser recolhido para o mapa ocupar tudo (lembrado neste aparelho)
  const [liveOpen, setLiveOpen] = useState(true)
  useEffect(() => {
    try {
      if (localStorage.getItem('tv-live-open') === '0') setLiveOpen(false)
    } catch {
      // sem armazenamento: fica aberto
    }
  }, [])
  const toggleLive = (open: boolean) => {
    setLiveOpen(open)
    try {
      localStorage.setItem('tv-live-open', open ? '1' : '0')
    } catch {
      // ignora
    }
  }

  // números, gráficos e pedidos ao vivo (30 s); o que mudou desde a última leitura fica em destaque
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
  const situacao = useMemo(
    () => (data?.graficos?.situacao || []).map((item: any) => ({ name: STATUS[item.status]?.label || item.status, value: item.total, color: STATUS[item.status]?.color || C.gray })),
    [data]
  )
  const noPrazoPct = kpis && kpis.abertos ? Math.round((kpis.noPrazo / kpis.abertos) * 100) : 100
  const prazoColor = noPrazoPct >= 80 ? C.green : noPrazoPct >= 60 ? C.amber : C.red
  const demandas = useMemo(
    () =>
      Object.entries((data?.demandas?.porSituacao || {}) as Record<string, number>).map(([status, value]) => ({
        name: TICKET[status]?.label || status,
        value,
        color: TICKET[status]?.color || C.gray,
      })),
    [data]
  )
  const demandasTotal = demandas.reduce((sum, item) => sum + item.value, 0)
  const feedKey = (data?.feed || []).slice(0, 1).map((item: any) => `${item.id}:${item.status}`).join()

  const charts = (
    <>
      <ChartCard title="Em aberto por situação">
        {situacao.length === 0 ? (
          <Empty text="Nenhum pedido em aberto" />
        ) : (
          <div className="grid h-full grid-cols-[1fr_auto] items-center gap-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={situacao} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="90%" paddingAngle={2}>
                  {situacao.map((item: any) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Legendary items={situacao} />
          </div>
        )}
      </ChartCard>

      <ChartCard title="No prazo">
        <div className="relative h-full">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ value: noPrazoPct }]} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar dataKey="value" cornerRadius={10} background fill={prazoColor} />
            </RadialBarChart>
          </ResponsiveContainer>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums xl:text-base" style={{ color: prazoColor }}>
            {noPrazoPct}%
          </span>
        </div>
      </ChartCard>

      <ChartCard title="7 dias: chegaram (azul) × concluídos (verde)" className="w-[280px] xl:w-[330px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data?.graficos?.semana || []} margin={{ top: 6, right: 10, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="tvIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.blue} stopOpacity={0.45} />
                <stop offset="100%" stopColor={C.blue} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="tvOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.green} stopOpacity={0.45} />
                <stop offset="100%" stopColor={C.green} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="dia" tick={{ fontSize: 9 }} interval={0} tickFormatter={(value: string) => value.slice(0, 2)} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Area type="monotone" dataKey="chegaram" name="Chegaram" stroke={C.blue} fill="url(#tvIn)" strokeWidth={2} />
            <Area type="monotone" dataKey="concluidos" name="Concluídos" stroke={C.green} fill="url(#tvOut)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Chegadas por hora — hoje">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={(data?.graficos?.horas || []).slice(6, 22)} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
            <XAxis dataKey="hora" tick={{ fontSize: 10 }} interval={2} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="pedidos" name="Pedidos" radius={[4, 4, 0, 0]}>
              {(data?.graficos?.horas || []).slice(6, 22).map((item: any) => (
                <Cell key={item.hora} fill={Number(item.hora.slice(0, 2)) === now.getHours() ? C.indigo : C.cyan} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Atrasos por secretaria">
        {(data?.secretariasAtrasadas || []).length === 0 ? (
          <Empty text="Nenhuma secretaria com atraso" good />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.secretariasAtrasadas.slice(0, 3)} layout="vertical" margin={{ top: 2, right: 10, left: 2, bottom: 0 }}>
              <XAxis type="number" allowDecimals={false} hide />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar dataKey="count" name="Atrasados" radius={[0, 4, 4, 0]}>
                {data.secretariasAtrasadas.slice(0, 3).map((item: any, index: number) => (
                  <Cell key={item.name} fill={[C.red, C.pink, C.amber, C.purple, C.indigo][index % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard title={`Demandas do Gabinete · ${demandasTotal}`}>
        {demandasTotal === 0 ? (
          <Empty text="Nenhuma demanda" />
        ) : (
          <div className="grid h-full grid-cols-[1fr_auto] items-center gap-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={demandas} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="90%" paddingAngle={2}>
                  {demandas.map((item) => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Legendary items={demandas} />
          </div>
        )}
      </ChartCard>
    </>
  )

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
    <div className="lg-root relative flex h-screen flex-col gap-3 overflow-hidden p-3 xl:p-4">
      <LgAmbient />

      {/* topo: mesma faixa azul do Painel do Prefeito */}
      <header className="relative flex items-center justify-between gap-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-2.5 text-white xl:px-6 xl:py-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-blue-100 xl:text-sm">{data?.municipality || 'Prefeitura'}</p>
          <h1 className="text-xl font-bold xl:text-3xl">Painel do Prefeito · ao vivo</h1>
        </div>
        <div className="flex items-center gap-2 xl:gap-3">
          <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs xl:text-sm', offline ? 'bg-red-500/40' : 'bg-white/20')}>
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
      <section className="relative grid grid-cols-3 gap-3 xl:grid-cols-6">
        <Kpi label="Em aberto" value={kpis?.abertos ?? '–'} icon={FolderOpen} color="text-blue-600" bg="bg-blue-50" />
        <Kpi label="Atrasados" value={kpis?.atrasados ?? '–'} icon={AlertTriangle} color="text-red-600" bg="bg-red-50" />
        <Kpi label="No prazo" value={kpis?.noPrazo ?? '–'} hint={`${noPrazoPct}% dos em aberto`} icon={Clock} color="text-green-600" bg="bg-green-50" />
        <Kpi label="Chegaram hoje" value={kpis?.novosHoje ?? '–'} icon={Inbox} color="text-purple-600" bg="bg-purple-50" />
        <Kpi label="Concluídos hoje" value={kpis?.concluidosHoje ?? '–'} hint={kpis ? `${kpis.concluidosMes} no mês` : undefined} icon={CheckCircle2} color="text-emerald-600" bg="bg-emerald-50" />
        <Kpi
          label="Satisfação"
          value={kpis?.satisfacao != null ? `${kpis.satisfacao.toFixed(1)}/5` : '–'}
          hint={kpis ? `${kpis.avaliacoes} avaliações` : undefined}
          icon={Star}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </section>

      {/* gráficos em cima do mapa: passam sozinhos em loop; dá para arrastar para o lado */}
      <AutoMarquee className="relative h-24 shrink-0 xl:h-28">{charts}</AutoMarquee>

      {/* mapa grande + pedidos ao vivo */}
      <section className={cn('relative grid min-h-0 flex-1 gap-3', liveOpen && 'lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_380px]')}>
        <Card className="relative min-h-[240px] overflow-hidden p-0">
          <TvMap points={points} highlight={fresh} center={data?.center} />
          {!liveOpen && (
            <button
              type="button"
              onClick={() => toggleLive(true)}
              className="absolute right-3 top-3 z-[400] flex items-center gap-2 rounded-full border bg-white/95 px-3 py-1.5 text-sm font-medium text-gray-800 shadow-md hover:bg-white"
            >
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              Ao vivo
              {fresh.size > 0 && <span className="rounded-full bg-blue-600 px-1.5 text-xs text-white">{fresh.size} novo{fresh.size > 1 ? 's' : ''}</span>}
              <PanelRightOpen className="h-4 w-4" />
            </button>
          )}
          <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex flex-wrap items-center gap-3 rounded-lg border bg-white/90 px-3 py-2 text-xs text-gray-700 shadow-sm xl:text-sm">
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-red-500" />Atrasado</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-blue-500" />Novo</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-500" />Em andamento</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-purple-500" />Pendência</span>
            <span className="font-medium text-gray-900">{points.length} no mapa</span>
          </div>
        </Card>

        {liveOpen && (
        <Card className="flex min-h-0 flex-col">
          <CardHeader className="px-3 pb-2 pt-3">
            <CardTitle className="flex items-center gap-2 text-sm xl:text-base">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              <span className="flex-1">Pedidos ao vivo</span>
              <button type="button" onClick={() => toggleLive(false)} className="rounded-md p-1 text-gray-500 hover:bg-gray-100" aria-label="Recolher pedidos ao vivo" title="Recolher (mapa maior)">
                <PanelRightClose className="h-4 w-4" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 px-3 pb-3">
            {(data?.feed || []).length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-gray-500">
                <Inbox className="h-10 w-10 text-gray-300" />
                Nenhum pedido ainda.
                <span className="text-xs">Os novos aparecem aqui sozinhos.</span>
              </div>
            ) : (
              <AutoScrollList resetKey={feedKey}>
                <ul className="space-y-2">
                  {(data?.feed || []).map((item: any) => {
                    const status = STATUS[item.status] || STATUS.PROGRESSO
                    const isFresh = fresh.has(item.id)
                    return (
                      <li
                        key={`${item.id}:${item.status}`}
                        className={cn(
                          'rounded-md border-l-4 bg-white/80 px-3 py-2 shadow-sm transition-all',
                          isFresh && 'animate-in fade-in slide-in-from-top-2 bg-blue-50 ring-1 ring-blue-300'
                        )}
                        style={{ borderLeftColor: item.overdue ? C.red : status.color }}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono text-gray-500">#{item.number} · {hhmm(item.updatedAt)}</span>
                          <span className={cn('shrink-0 rounded-full px-2 py-0.5', item.overdue ? 'bg-red-100 text-red-700' : status.className)}>
                            {isFresh ? (item.isNew ? 'Acabou de chegar' : 'Atualizado agora') : item.overdue ? 'Atrasado' : status.label}
                          </span>
                        </div>
                        <p className="truncate text-sm font-medium text-gray-900 xl:text-base">{item.service?.name || item.title}</p>
                        <p className="truncate text-xs text-gray-500">{item.department?.name}</p>
                      </li>
                    )
                  })}
                </ul>
              </AutoScrollList>
            )}
          </CardContent>
        </Card>
        )}
      </section>
    </div>
  )
}

function Empty({ text, good = false }: { text: string; good?: boolean }) {
  return <p className={cn('flex h-full items-center justify-center text-center text-xs xl:text-sm', good ? 'text-green-700' : 'text-gray-500')}>{text}</p>
}

/** Legenda compacta ao lado da rosca */
function Legendary({ items }: { items: Array<{ name: string; value: number; color: string }> }) {
  return (
    <ul className="space-y-0 text-[10px] leading-tight xl:text-[11px]">
      {items.map((item) => (
        <li key={item.name} className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color }} />
          {item.name} <strong className="tabular-nums">{item.value}</strong>
        </li>
      ))}
    </ul>
  )
}
