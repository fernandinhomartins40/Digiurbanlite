'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  School,
  Users,
  Bus,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';

async function tryFetch(url: string) {
  try {
    const res = await fetch(url, { credentials: 'include' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export default function EducacaoAppPage() {
  const [statsMatriculas, setStatsMatriculas] = useState<any>(null);
  const [statsUnidades, setStatsUnidades] = useState<any>(null);
  const [statsTransporte, setStatsTransporte] = useState<any>(null);

  useEffect(() => {
    tryFetch('/api/apps/educacao/matriculas/stats').then(setStatsMatriculas);
    tryFetch('/api/apps/educacao/unidades/stats').then(setStatsUnidades);
    tryFetch('/api/apps/educacao/transporte/stats').then(setStatsTransporte);
  }, []);

  const aguardando =
    statsMatriculas?.inscricoesPorStatus?.find(
      (s: any) => s.status === 'INSCRITO_AGUARDANDO_VALIDACAO'
    )?.total || 0;

  const areas = [
    {
      href: '/admin/apps/educacao/matriculas',
      titulo: 'Matrículas',
      descricao: 'Inscrições, validação de documentos, atribuição de vagas e confirmação',
      icone: ClipboardList,
      destaque: aguardando > 0 ? `${aguardando} aguardando validação` : undefined,
    },
    {
      href: '/admin/apps/educacao/turmas',
      titulo: 'Turmas',
      descricao: 'Turmas por unidade, capacidade e ocupação de vagas',
      icone: Users,
    },
    {
      href: '/admin/apps/educacao/unidades',
      titulo: 'Unidades de Ensino',
      descricao: 'Escolas, creches e centros de educação do município',
      icone: School,
    },
    {
      href: '/admin/apps/educacao/transporte',
      titulo: 'Transporte Escolar',
      descricao: 'Veículos, rotas e alunos transportados',
      icone: Bus,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
          <GraduationCap className="h-7 w-7 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão Escolar</h1>
          <p className="text-gray-500">
            Matrículas, turmas, unidades e transporte escolar do município
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Matrículas ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsMatriculas?.matriculasAtivas ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vagas ocupadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsMatriculas
                ? `${statsMatriculas.vagasOcupadas}/${statsMatriculas.capacidadeTotal}`
                : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unidades ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsUnidades?.ativas ?? statsUnidades?.total ?? '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Veículos escolares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsTransporte?.totalVeiculos ?? '-'}</div>
          </CardContent>
        </Card>
      </div>

      {/* Áreas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {areas.map((area) => (
          <Link key={area.href} href={area.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <area.icone className="h-5 w-5 text-indigo-600" />
                    {area.titulo}
                  </CardTitle>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{area.descricao}</p>
                {area.destaque && (
                  <p className="text-sm font-medium text-orange-600 mt-2">{area.destaque}</p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
