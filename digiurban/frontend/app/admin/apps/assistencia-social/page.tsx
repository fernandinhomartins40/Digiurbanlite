'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartHandshake, Users, HandCoins, Building2, ArrowRight } from 'lucide-react';

async function tryFetch(url: string) {
  try {
    const res = await fetch(url, { credentials: 'include' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export default function AssistenciaSocialAppPage() {
  const [statsFamilias, setStatsFamilias] = useState<any>(null);
  const [statsProgramas, setStatsProgramas] = useState<any>(null);
  const [statsUnidades, setStatsUnidades] = useState<any>(null);

  useEffect(() => {
    tryFetch('/api/apps/assistencia-social/familias/stats').then(setStatsFamilias);
    tryFetch('/api/apps/assistencia-social/programas/stats').then(setStatsProgramas);
    tryFetch('/api/apps/assistencia-social/unidades/stats').then(setStatsUnidades);
  }, []);

  const beneficiosAtivos =
    statsProgramas?.inscricoesPorStatus
      ?.filter((s: any) => s.status === 'ATIVO' || s.status === 'ATIVA')
      .reduce((acc: number, s: any) => acc + s.total, 0) || 0;

  const areas = [
    {
      href: '/admin/apps/assistencia-social/familias',
      titulo: 'Famílias (CadÚnico)',
      descricao: 'Cadastro de famílias, entrevistas, validação e composição familiar',
      icone: Users,
    },
    {
      href: '/admin/apps/assistencia-social/beneficios',
      titulo: 'Programas & Benefícios',
      descricao: 'Inscrições em programas sociais, análise, concessão, pagamentos e acompanhamento',
      icone: HandCoins,
    },
    {
      href: '/admin/apps/assistencia-social/unidades',
      titulo: 'Unidades (CRAS/CREAS)',
      descricao: 'Centros de referência e equipamentos da assistência social',
      icone: Building2,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-rose-100 flex items-center justify-center">
          <HeartHandshake className="h-7 w-7 text-rose-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assistência Social</h1>
          <p className="text-gray-500">CadÚnico municipal, programas sociais e benefícios</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Famílias cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsFamilias?.totalFamilias ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pessoas nas famílias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsFamilias?.totalMembros ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Benefícios ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{beneficiosAtivos}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pago no mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsProgramas
                ? `R$ ${(statsProgramas.valorPagoNoMes || 0).toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                  })}`
                : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {areas.map((area) => (
          <Link key={area.href} href={area.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <area.icone className="h-5 w-5 text-rose-600" />
                    {area.titulo}
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{area.descricao}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
