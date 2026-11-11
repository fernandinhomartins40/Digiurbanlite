'use client'

/**
 * Prefeitura em números (pública, sem login): pedidos recebidos e resolvidos
 * no mês, tempo médio de resposta, nota dos cidadãos e serviços mais pedidos.
 * Só números do município, nenhum nome. A prefeitura liga a página no painel.
 * No domínio principal, `?municipio=<slug>` escolhe o município do link.
 */

import { useEffect, useState } from 'react'
import { BarChart3, CheckCircle2, Clock, Inbox, Loader2, Star } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CityNumbers {
  municipio: { nome: string; nomeMunicipio: string; uf: string }
  mes: { inicio: string; recebidos: number; resolvidos: number }
  tempoMedioDias: number | null
  satisfacao: number | null
  avaliacoes: number
  servicosMaisPedidos: Array<{ nome: string; pedidos: number }>
  geradoEm: string
}

const fmt = (value: number) => value.toLocaleString('pt-BR')

export default function PrefeituraEmNumerosPage() {
  const [data, setData] = useState<CityNumbers | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'off' | 'error'>('loading')

  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get('municipio')
    fetch('/api/public/city-numbers', { headers: slug ? { 'X-Tenant-Slug': slug } : undefined })
      .then(async (response) => {
        if (response.status === 404) return setState('off')
        if (!response.ok) return setState('error')
        setData(await response.json())
        setState('ok')
      })
      .catch(() => setState('error'))
  }, [])

  if (state !== 'ok' || !data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4 text-center">
        {state === 'loading' ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Carregando" />
        ) : (
          <p className="text-muted-foreground max-w-sm">
            {state === 'off'
              ? 'Esta prefeitura ainda não publicou os seus números.'
              : 'Não foi possível carregar os números agora. Tente de novo daqui a pouco.'}
          </p>
        )}
      </main>
    )
  }

  const mes = new Date(data.mes.inicio).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'America/Sao_Paulo' })
  const max = Math.max(1, ...data.servicosMaisPedidos.map((item) => item.pedidos))
  const cards = [
    { icon: Inbox, label: `Pedidos recebidos em ${mes}`, value: fmt(data.mes.recebidos) },
    { icon: CheckCircle2, label: `Pedidos resolvidos em ${mes}`, value: fmt(data.mes.resolvidos) },
    {
      icon: Clock,
      label: 'Tempo médio de resposta (últimos 90 dias)',
      value: data.tempoMedioDias === null ? '—' : `${String(data.tempoMedioDias).replace('.', ',')} dia(s)`,
    },
    {
      icon: Star,
      label: `Nota dos cidadãos (${fmt(data.avaliacoes)} avaliação(ões), últimos 90 dias)`,
      value: data.satisfacao === null ? '—' : `${String(data.satisfacao).replace('.', ',')} de 5`,
    },
  ]

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {data.municipio.nomeMunicipio} – {data.municipio.uf}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Prefeitura em números</h1>
          <p className="text-muted-foreground">Como a prefeitura está atendendo os pedidos dos cidadãos.</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map(({ icon: Icon, label, value }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 p-5">
                <Icon className="h-8 w-8 shrink-0 text-primary" aria-hidden />
                <div>
                  <p className="text-2xl font-semibold">{value}</p>
                  <p className="text-sm text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {data.servicosMaisPedidos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" aria-hidden /> Serviços mais pedidos (últimos 90 dias)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.servicosMaisPedidos.map((item) => (
                <div key={item.nome}>
                  <div className="flex justify-between gap-4 text-sm">
                    <span>{item.nome}</span>
                    <span className="font-medium">{fmt(item.pedidos)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${(item.pedidos / max) * 100}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground">
          Atualizado em {new Date(data.geradoEm).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}. Só números do município, sem
          dados de nenhuma pessoa.
        </p>
      </div>
    </main>
  )
}
