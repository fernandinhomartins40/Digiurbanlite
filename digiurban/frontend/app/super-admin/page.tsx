'use client';

/**
 * Dashboard do super-admin — visão da PLATAFORMA (todos os municípios).
 *
 * Antes mostrava "o município" e os números só do município padrão
 * (/api/super-admin/stats roda no contexto do tenant da requisição).
 * Agora consome /api/platform/overview (runAsPlatform).
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  RefreshCw,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Overview {
  tenants: { total: number; active: number; suspended: number; other: number };
  usage: { activeUsers: number; citizens: number; protocols: number; protocolsLast30Days: number };
  billing: { openCount: number; openAmount: number; overdueCount: number; overdueAmount: number; paidThisMonth: number };
  leads: { new: number; last30Days: number };
  health: { database: boolean; uptimeSeconds: number; memoryUsedPct: number };
  attention: { tenantId: string; name: string; uf: string; reasons: { code: string; detail: string }[] }[];
  generatedAt: string;
}

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const num = (v: number) => v.toLocaleString('pt-BR');
const uptime = (s: number) => {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h ${Math.floor((s % 3600) / 60)}min`;
};

const REASON_STYLE: Record<string, string> = {
  SUSPENDED: 'bg-red-100 text-red-800',
  OVERDUE_INVOICE: 'bg-orange-100 text-orange-800',
  PLAN_ENDING: 'bg-amber-100 text-amber-800',
  NEAR_USER_LIMIT: 'bg-blue-100 text-blue-800',
  NEAR_CITIZEN_LIMIT: 'bg-blue-100 text-blue-800',
};

function Kpi({ title, value, hint, icon: Icon, href }: { title: string; value: string; hint: string; icon: LucideIcon; href?: string }) {
  const card = (
    <Card className={href ? 'h-full transition-shadow hover:shadow-md' : 'h-full'}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/platform/overview', { credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || 'Não foi possível carregar o resumo da plataforma');
      setData(body.overview);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-600">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando a visão da plataforma...
      </div>
    );
  }

  if (error && !data) {
    return (
      <Card className="border-red-200">
        <CardContent className="p-6 text-center space-y-3">
          <XCircle className="h-8 w-8 text-red-500 mx-auto" />
          <p className="text-gray-800">{error}</p>
          <Button variant="outline" onClick={load}>Tentar de novo</Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visão da plataforma</h1>
          <p className="text-gray-600 mt-1">Todos os municípios em um só lugar.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          title="Municípios"
          value={num(data.tenants.total)}
          hint={`${data.tenants.active} ${data.tenants.active === 1 ? 'ativo' : 'ativos'} · ${data.tenants.suspended} ${data.tenants.suspended === 1 ? 'suspenso' : 'suspensos'}`}
          icon={Building2}
          href="/super-admin/tenants"
        />
        <Kpi
          title="Pedidos (protocolos)"
          value={num(data.usage.protocols)}
          hint={`${num(data.usage.protocolsLast30Days)} nos últimos 30 dias`}
          icon={FileText}
        />
        <Kpi
          title="Faturas em aberto"
          value={brl(data.billing.openAmount)}
          hint={data.billing.overdueCount ? `${data.billing.overdueCount} vencida(s): ${brl(data.billing.overdueAmount)}` : `${data.billing.openCount} fatura(s) · nenhuma vencida`}
          icon={CreditCard}
          href="/super-admin/billing"
        />
        <Kpi
          title="Leads novos"
          value={num(data.leads.new)}
          hint={`${num(data.leads.last30Days)} nos últimos 30 dias`}
          icon={UserPlus}
          href="/super-admin/leads"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Precisam de atenção ({data.attention.length})
            </CardTitle>
            <CardDescription>Municípios suspensos, com fatura vencida, plano vencendo ou perto do limite.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.attention.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-5 w-5" /> Nenhum município precisa de atenção agora.
              </div>
            ) : (
              <div className="divide-y rounded-lg border">
                {data.attention.map((item) => (
                  <Link
                    key={item.tenantId}
                    href={`/super-admin/tenants/${item.tenantId}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">{item.name} - {item.uf}</span>
                    <span className="flex flex-wrap gap-1.5">
                      {item.reasons.map((r) => (
                        <Badge key={r.code} className={`${REASON_STYLE[r.code] || 'bg-gray-100 text-gray-800'} hover:bg-inherit`}>
                          {r.detail}
                        </Badge>
                      ))}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" /> Uso da plataforma
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Servidores ativos</span><span className="font-semibold">{num(data.usage.activeUsers)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Cidadãos cadastrados</span><span className="font-semibold">{num(data.usage.citizens)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Recebido este mês</span><span className="font-semibold">{brl(data.billing.paidThisMonth)}</span></div>
            </CardContent>
          </Card>

          <Link href="/super-admin/monitoring" className="block">
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {data.health.database ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                    Sistema
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Banco de dados</span><span className={`font-semibold ${data.health.database ? 'text-green-700' : 'text-red-700'}`}>{data.health.database ? 'Funcionando' : 'Fora do ar'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">No ar há</span><span className="font-semibold">{uptime(data.health.uptimeSeconds)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Memória em uso</span><span className="font-semibold">{data.health.memoryUsedPct}%</span></div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
