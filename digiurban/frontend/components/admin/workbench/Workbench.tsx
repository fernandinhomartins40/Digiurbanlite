'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { openCommandPalette } from '@/components/admin/command/CommandPalette'
import { cn } from '@/lib/utils'
import { CheckCircle2, ChevronRight, Search } from 'lucide-react'

export type WorkbenchTipo =
  | 'pedido'
  | 'pedido_sem_responsavel'
  | 'processo_interno'
  | 'assinatura'
  | 'cidadao'
  | 'conversa'
  | 'atendimento'
  | 'compromisso'

type Urgencia = 'atrasado' | 'hoje' | 'com_prazo' | 'sem_prazo'

export interface WorkbenchItem {
  id: string
  tipo: WorkbenchTipo
  titulo: string
  subtitulo: string | null
  prazo: string | null
  atrasado: boolean
  urgencia: Urgencia
  link: string
}

export interface WorkbenchData {
  total: number
  itens: WorkbenchItem[]
  contagem: Partial<Record<WorkbenchTipo, number>>
  apps: Array<{ app: string; quantidade: number; link: string }>
  geradoEm: string
}

const TIPO_LABEL: Record<WorkbenchTipo, string> = {
  pedido: 'Pedidos seus',
  pedido_sem_responsavel: 'Pedidos sem responsável',
  processo_interno: 'Processos internos',
  assinatura: 'Assinaturas',
  cidadao: 'Cidadãos a conferir',
  conversa: 'Conversas',
  atendimento: 'Atendimentos aguardando',
  compromisso: 'Compromissos de hoje',
}

const GRUPOS: Array<{ key: Urgencia; label: string; className: string }> = [
  { key: 'atrasado', label: 'Atrasados', className: 'text-red-600' },
  { key: 'hoje', label: 'Vence hoje', className: 'text-amber-600' },
  { key: 'com_prazo', label: 'Com prazo', className: 'text-foreground' },
  { key: 'sem_prazo', label: 'Sem prazo', className: 'text-muted-foreground' },
]

export function useWorkbench() {
  const { apiRequest } = useAdminAuth()
  return useQuery<WorkbenchData>({
    queryKey: ['admin-workbench'],
    queryFn: async () => (await apiRequest('/api/admin/workbench')).data,
    staleTime: 30_000,
    refetchInterval: 120_000,
  })
}

function saudacao(date = new Date()) {
  const h = date.getHours()
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
}

function formatPrazo(item: WorkbenchItem) {
  if (!item.prazo) return null
  const d = new Date(item.prazo)
  if (item.tipo === 'compromisso' || item.urgencia === 'hoje') {
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

/** Cabeçalho: "Bom dia, Fulano — N coisas esperam por você" + atalho da busca (Ctrl+K). */
export function WorkbenchHeader({ data, loading }: { data?: WorkbenchData; loading: boolean }) {
  const { user } = useAdminAuth()
  const firstName = user?.name?.split(' ')[0] || ''
  const total = data?.total ?? 0

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {saudacao()}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        {loading ? (
          <Skeleton className="mt-2 h-5 w-56" />
        ) : data ? (
          <p className="mt-1 text-muted-foreground">
            {total === 0
              ? 'Nada esperando por você agora.'
              : total === 1
                ? '1 coisa espera por você.'
                : `${total} coisas esperam por você.`}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={openCommandPalette}
        className="flex w-full items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/40"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 truncate">Buscar pessoa, pedido ou tela…</span>
        <kbd className="hidden rounded border px-1.5 text-xs sm:inline">Ctrl+K</kbd>
      </button>
    </div>
  )
}

/** Lista "esperando por você", agrupada por urgência, com filtro por tipo e filas dos apps. */
export function WorkbenchList({
  data,
  loading,
  error,
  emptySuggestion,
}: {
  data?: WorkbenchData
  loading: boolean
  error: boolean
  emptySuggestion?: { label: string; href: string }
}) {
  const [filtro, setFiltro] = useState<WorkbenchTipo | 'tudo'>('tudo')

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-md rounded-full" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          Não foi possível carregar a sua mesa agora. Tente de novo em instantes.
        </CardContent>
      </Card>
    )
  }

  const tipos = (Object.keys(TIPO_LABEL) as WorkbenchTipo[]).filter((t) => (data.contagem[t] ?? 0) > 0)
  const ativo = filtro !== 'tudo' && !tipos.includes(filtro) ? 'tudo' : filtro
  const itens = ativo === 'tudo' ? data.itens : data.itens.filter((i) => i.tipo === ativo)

  return (
    <div className="space-y-4">
      {data.apps.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {data.apps.map((a) => (
            <Link
              key={a.link}
              href={a.link}
              className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted/40"
            >
              {a.app}
              <span className="rounded-full bg-primary/10 px-2 text-xs font-semibold text-primary">{a.quantidade}</span>
            </Link>
          ))}
        </div>
      )}

      {data.total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <p className="font-semibold">Tudo em dia!</p>
            <p className="text-sm text-muted-foreground">Nenhum pedido, documento ou conversa esperando por você.</p>
            {emptySuggestion && (
              <Link href={emptySuggestion.href} className="text-sm font-medium text-primary hover:underline">
                {emptySuggestion.label}
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {tipos.length > 1 && (
            <div className="lg-glass lg-bar inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1" role="tablist">
              {(['tudo', ...tipos] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  aria-selected={ativo === t}
                  onClick={() => setFiltro(t)}
                  className={cn(
                    'lg-tab whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium',
                    ativo === t && 'lg-tab-on'
                  )}
                >
                  {t === 'tudo' ? 'Tudo' : TIPO_LABEL[t]} ({t === 'tudo' ? data.total : data.contagem[t]})
                </button>
              ))}
            </div>
          )}

          {GRUPOS.map((g) => {
            const doGrupo = itens.filter((i) => i.urgencia === g.key)
            if (doGrupo.length === 0) return null
            return (
              <section key={g.key} className="space-y-2">
                <h2 className={cn('text-sm font-semibold', g.className)}>
                  {g.label} ({doGrupo.length})
                </h2>
                <div className="divide-y rounded-md border bg-card">
                  {doGrupo.map((item) => (
                    <Link
                      key={`${item.tipo}-${item.id}`}
                      href={item.link}
                      className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.titulo}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {TIPO_LABEL[item.tipo]}
                          {item.subtitulo ? ` · ${item.subtitulo}` : ''}
                        </p>
                      </div>
                      {formatPrazo(item) && (
                        <span className={cn('shrink-0 text-xs', item.atrasado ? 'font-semibold text-red-600' : 'text-muted-foreground')}>
                          {formatPrazo(item)}
                        </span>
                      )}
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </>
      )}
    </div>
  )
}
