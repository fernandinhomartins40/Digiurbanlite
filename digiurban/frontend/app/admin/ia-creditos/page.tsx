'use client'

/**
 * IA e créditos do município (painel do servidor, administradores).
 * Saldo, consumo por tipo de uso, extrato e compra de pacotes. A compra gera
 * uma fatura da plataforma; os créditos entram quando o pagamento é confirmado.
 */

import { useCallback, useEffect, useState } from 'react'
import { Bot, CheckCircle2, Clock, Loader2, ShoppingCart, Sparkles, TriangleAlert } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

interface Pkg {
  id: string
  name: string
  description: string | null
  credits: number
  priceBrl: number
}

interface Summary {
  wallet: { balance: number; totalPurchased: number; totalConsumed: number }
  byTask: Array<{ task: string | null; calls: number; credits: number }>
  ledger: Array<{ id: string; kind: string; credits: number; balanceAfter: number; description: string | null; task: string | null; createdAt: string }>
  orders: Array<{ id: string; packageName: string; credits: number; priceBrl: number; status: string; createdAt: string }>
  packages: Pkg[]
  creditValueBrl: number
  aiAvailable: boolean
}

const TASK_LABEL: Record<string, string> = {
  intent: 'Entender o que o cidadão quer',
  select_option: 'Escolher serviço/opção',
  extract_fields: 'Preencher formulários',
  extract_option: 'Preencher formulários',
  correction_field: 'Correções de dados',
  correction_option: 'Correções de dados',
  correction_value: 'Correções de dados',
  guidance: 'Respostas e orientações',
}

const KIND_LABEL: Record<string, string> = { PURCHASE: 'Compra', USAGE: 'Uso', GRANT: 'Bônus', REFUND: 'Estorno', ADJUST: 'Ajuste' }
const ORDER_LABEL: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Aguardando pagamento', className: 'bg-amber-100 text-amber-800' },
  PAID: { label: 'Créditos liberados', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', className: 'bg-gray-200 text-gray-700' },
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmt = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

export default function AiCreditsPage() {
  const { toast } = useToast()
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-credits', { credentials: 'include' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar')
      setData(json)
    } catch (error: any) {
      toast({ title: 'Erro ao carregar os créditos de IA', description: error.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const buy = async (pkg: Pkg) => {
    if (!confirm(`Comprar o pacote "${pkg.name}" (${fmt(pkg.credits)} créditos) por ${brl(pkg.priceBrl)}? Uma fatura será gerada.`)) return
    setBuying(pkg.id)
    try {
      const res = await fetch('/api/admin/ai-credits/orders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast({ title: 'Pedido registrado', description: json.message })
      load()
    } catch (error: any) {
      toast({ title: 'Não foi possível comprar', description: error.message, variant: 'destructive' })
    } finally {
      setBuying(null)
    }
  }

  if (!loading && !data) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-gray-600">
        <TriangleAlert className="h-6 w-6 text-amber-600" />
        Não foi possível carregar os créditos de IA.
        <Button variant="outline" onClick={() => { setLoading(true); load() }}>
          Tentar de novo
        </Button>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Carregando…
      </div>
    )
  }

  const { wallet } = data
  const low = wallet.balance <= 0
  const byGroup = new Map<string, { calls: number; credits: number }>()
  for (const t of data.byTask) {
    const label = TASK_LABEL[t.task || ''] || 'Outros usos'
    const g = byGroup.get(label) || { calls: 0, credits: 0 }
    byGroup.set(label, { calls: g.calls + t.calls, credits: g.credits + t.credits })
  }
  const totalCalls = data.byTask.reduce((n, t) => n + t.calls, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold text-gray-900">
          <Sparkles className="h-7 w-7 text-blue-600" />
          IA e créditos
        </h1>
        <p className="text-gray-600">
          O DigiBot usa inteligência artificial para entender o cidadão e preencher os pedidos. Cada uso consome créditos do município.
        </p>
      </div>

      {low && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex items-start gap-3 pt-6 text-sm text-amber-900">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Sem créditos de IA</p>
              <p>O DigiBot continua atendendo pelos menus, mas sem entender textos livres. Compre um pacote abaixo para reativar a inteligência.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Saldo</p>
            <p className={`text-3xl font-bold ${low ? 'text-red-600' : ''}`}>{fmt(wallet.balance)}</p>
            <p className="text-xs text-gray-500">créditos ≈ {brl(wallet.balance * data.creditValueBrl)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Usos nos últimos 30 dias</p>
            <p className="text-3xl font-bold">{totalCalls.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-gray-500">{fmt(data.byTask.reduce((n, t) => n + t.credits, 0))} créditos consumidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">IA da plataforma</p>
            <p className="flex items-center gap-2 text-lg font-semibold">
              {data.aiAvailable ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Disponível
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 text-amber-600" />
                  Em configuração
                </>
              )}
            </p>
            <p className="text-xs text-gray-500">Dados pessoais são mascarados antes de qualquer envio (LGPD).</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Comprar créditos
          </CardTitle>
          <CardDescription>A fatura aparece para pagamento; os créditos entram assim que o pagamento é confirmado.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {data.packages.map((p) => (
            <div key={p.id} className="flex flex-col rounded-2xl border p-4">
              <p className="text-lg font-semibold">{p.name}</p>
              <p className="text-sm text-gray-600">{p.description}</p>
              <p className="mt-3 text-2xl font-bold">{brl(p.priceBrl)}</p>
              <p className="text-sm text-gray-500">{fmt(p.credits)} créditos</p>
              <Button className="mt-4" disabled={buying === p.id} onClick={() => buy(p)}>
                {buying === p.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Comprar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Onde a IA foi usada (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {byGroup.size === 0 && <p className="text-gray-500">Ainda sem uso.</p>}
            {[...byGroup.entries()].map(([label, g]) => (
              <div key={label} className="flex justify-between border-b pb-1.5">
                <span>{label}</span>
                <span className="text-gray-600">
                  {g.calls.toLocaleString('pt-BR')} usos · {fmt(g.credits)} créditos
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pedidos de créditos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.orders.length === 0 && <p className="text-gray-500">Nenhum pedido ainda.</p>}
            {data.orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 border-b pb-1.5">
                <span>
                  {o.packageName} · {brl(o.priceBrl)}
                  <span className="block text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</span>
                </span>
                <Badge className={ORDER_LABEL[o.status]?.className}>{ORDER_LABEL[o.status]?.label || o.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Extrato</CardTitle>
          <CardDescription>Últimas 50 movimentações.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="py-2">Quando</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th className="text-right">Créditos</th>
                <th className="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.ledger.map((l) => (
                <tr key={l.id}>
                  <td className="py-1.5">{new Date(l.createdAt).toLocaleString('pt-BR')}</td>
                  <td>{KIND_LABEL[l.kind] || l.kind}</td>
                  <td className="text-gray-600">{l.description || TASK_LABEL[l.task || ''] || '—'}</td>
                  <td className={`text-right ${l.credits < 0 ? 'text-red-600' : 'text-green-700'}`}>{l.credits > 0 ? '+' : ''}{fmt(l.credits)}</td>
                  <td className="text-right">{fmt(l.balanceAfter)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
