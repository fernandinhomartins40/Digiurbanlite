'use client';

import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Map as MapIcon } from 'lucide-react';

const OSMap = lazy(() =>
  import('@/components/apps/servicos-publicos/OSMap').then((module) => ({
    default: module.OSMap,
  }))
);

const STATUS_OPCOES = [
  { valor: 'ATIVAS', label: 'Ativas (abertas/despachadas/em execução)' },
  { valor: 'TODAS', label: 'Todas' },
  { valor: 'ABERTA', label: 'Abertas' },
  { valor: 'DESPACHADA', label: 'Despachadas' },
  { valor: 'EM_EXECUCAO', label: 'Em execução' },
  { valor: 'CONCLUIDA', label: 'Concluídas' },
];

export default function MapaOSPage() {
  const router = useRouter();
  const [pontos, setPontos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('ATIVAS');

  useEffect(() => {
    fetch('/api/apps/servicos-publicos/os/mapa', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPontos(Array.isArray(data) ? data : []))
      .catch(() => setPontos([]))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = useMemo(() => {
    if (filtroStatus === 'TODAS') return pontos;
    if (filtroStatus === 'ATIVAS') {
      return pontos.filter((p) => !['CONCLUIDA', 'CANCELADA'].includes(p.status));
    }
    return pontos.filter((p) => p.status === filtroStatus);
  }, [pontos, filtroStatus]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/apps/servicos-publicos')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <MapIcon className="h-8 w-8 text-orange-600" />
              Mapa de Ordens de Serviço
            </h1>
            <p className="text-gray-500 mt-1">
              Distribuição geográfica das demandas — cor por status, tamanho por prioridade
            </p>
          </div>
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPCOES.map((o) => (
              <SelectItem key={o.valor} value={o.valor}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            OS georreferenciadas
            <Badge variant="secondary">{filtrados.length}</Badge>
            <span className="ml-auto flex items-center gap-3 text-xs font-normal text-gray-500">
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-yellow-600 inline-block" /> Aberta
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-blue-600 inline-block" /> Despachada
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-indigo-600 inline-block" /> Em execução
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-green-600 inline-block" /> Concluída
              </span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="bg-gray-100 h-[600px] rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Carregando ordens de serviço...</p>
            </div>
          ) : filtrados.length === 0 ? (
            <div className="bg-gray-50 h-[300px] rounded-lg flex flex-col items-center justify-center gap-2">
              <MapIcon className="h-10 w-10 text-gray-300" />
              <p className="text-gray-500">
                Nenhuma OS georreferenciada
                {filtroStatus !== 'TODAS' ? ' para este filtro' : ''}
              </p>
              <p className="text-xs text-gray-400">
                OS criadas a partir de protocolos com localização aparecem aqui automaticamente
              </p>
            </div>
          ) : (
            <Suspense
              fallback={
                <div className="bg-gray-100 h-[600px] rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">Carregando mapa...</p>
                </div>
              }
            >
              <OSMap pontos={filtrados} />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
