'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { HealthAppHeader } from '@/components/apps/saude/HealthAppHeader';
import { CidadaoSelector } from '@/components/apps/saude/CidadaoSelector';
import { portalApi as api, fmtData } from '@/components/apps/portal-requests/shared';
import { Baby, Plus } from 'lucide-react';

const STATUS: Record<string, string> = { EM_ANDAMENTO: 'Em acompanhamento', FINALIZADO: 'Parto realizado', INTERROMPIDO: 'Interrompido' };
const NOVA = { dum: '', gravidez: '1', partos: '0', abortos: '0', cesarianas: '0', riscoGestacional: 'HABITUAL', pesoInicial: '', alturaInicial: '', grupoSanguineo: '', fatorRh: '' };

export default function PreNatalPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [lista, setLista] = useState<any[]>([]);
  const [resumo, setResumo] = useState<any>(null);
  const [status, setStatus] = useState('EM_ANDAMENTO');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [aberta, setAberta] = useState(false);
  const [gestante, setGestante] = useState<any>(null);
  const [nova, setNova] = useState(NOVA);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [dados, numeros] = await Promise.all([
        api(`/api/saude/pre-natal${status === 'TODOS' ? '' : `?status=${status}`}`),
        api('/api/saude/pre-natal/resumo').catch(() => null),
      ]);
      setLista(Array.isArray(dados) ? dados : []);
      setResumo(numeros);
    } catch {
      setLista([]);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return termo ? lista.filter((p) => p.citizen?.name?.toLowerCase().includes(termo) || p.citizen?.cpf?.includes(termo)) : lista;
  }, [lista, busca]);

  const iniciar = async () => {
    if (!gestante?.id || !nova.dum) {
      toast({ title: 'Escolha a gestante e a data da última menstruação', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      const criado = await api('/api/saude/pre-natal', {
        method: 'POST',
        body: JSON.stringify({ ...nova, citizenId: gestante.id, alturaInicial: nova.alturaInicial ? Number(nova.alturaInicial.replace(',', '.')) : undefined, pesoInicial: nova.pesoInicial ? Number(nova.pesoInicial.replace(',', '.')) : undefined }),
      });
      toast({ title: 'Pré-natal iniciado' });
      setAberta(false);
      setGestante(null);
      setNova(NOVA);
      router.push(`/admin/apps/saude/atendimento/pre-natal/${criado.id}`);
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const numeros = [
    ['Em acompanhamento', resumo?.emAcompanhamento],
    ['Alto risco', resumo?.altoRisco],
    ['Parto nos próximos 30 dias', resumo?.partoEm30Dias],
    ['Sem consulta há mais de 30 dias', resumo?.semConsultaHa30Dias],
  ];

  return (
    <div className="p-6 space-y-6">
      <HealthAppHeader
        title="Pré-natal"
        description="Acompanhamento das gestantes: consultas, exames e data provável do parto."
        icon={Baby}
        backHref="/admin/apps/saude/atendimento"
        actions={
          <Button onClick={() => setAberta(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova gestante
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {numeros.map(([rotulo, valor]) => (
          <Card key={rotulo as string}>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{valor ?? '-'}</div>
              <div className="text-sm text-gray-500">{rotulo}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>
              Gestantes <Badge variant="secondary">{filtradas.length}</Badge>
            </span>
            <div className="flex gap-2">
              <Input placeholder="Buscar por nome ou CPF" value={busca} onChange={(e) => setBusca(e.target.value)} className="w-56" />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-52">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EM_ANDAMENTO">Em acompanhamento</SelectItem>
                  <SelectItem value="FINALIZADO">Parto realizado</SelectItem>
                  <SelectItem value="INTERROMPIDO">Interrompido</SelectItem>
                  <SelectItem value="TODOS">Todas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma gestante encontrada</div>
          ) : (
            <div className="space-y-3">
              {filtradas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => router.push(`/admin/apps/saude/atendimento/pre-natal/${p.id}`)}
                  className="w-full text-left flex flex-col gap-2 p-4 border rounded-lg hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="font-medium">{p.citizen?.name || 'Gestante'}</div>
                    <div className="text-sm text-gray-500">
                      {p.status === 'EM_ANDAMENTO' ? `${p.idadeGestacional} (${p.trimestre}º trimestre) · parto previsto para ${fmtData(p.dpp)}` : `${STATUS[p.status]} em ${fmtData(p.dataFim)}`}
                    </div>
                    <div className="text-xs text-gray-400">
                      {p._count?.consultas || 0} consulta(s) · {p._count?.exames || 0} exame(s)
                      {p.consultas?.[0]?.proximaConsulta ? ` · próxima consulta ${fmtData(p.consultas[0].proximaConsulta)}` : ''}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {p.riscoGestacional === 'ALTO_RISCO' && <Badge variant="destructive">Alto risco</Badge>}
                    <Badge variant="secondary">{STATUS[p.status] || p.status}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={aberta} onOpenChange={setAberta}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Iniciar pré-natal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <CidadaoSelector label="Gestante" onSelect={setGestante} selectedCidadao={gestante} />
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Data da última menstruação</Label>
                <Input type="date" value={nova.dum} onChange={(e) => setNova({ ...nova, dum: e.target.value })} />
                <p className="text-xs text-gray-500 mt-1">A data provável do parto e as semanas são calculadas sozinhas.</p>
              </div>
              {(
                [
                  ['gravidez', 'Nº desta gravidez'],
                  ['partos', 'Partos anteriores'],
                  ['cesarianas', 'Cesáreas'],
                  ['abortos', 'Abortos'],
                ] as const
              ).map(([campo, rotulo]) => (
                <div key={campo}>
                  <Label>{rotulo}</Label>
                  <Input type="number" min={0} value={nova[campo]} onChange={(e) => setNova({ ...nova, [campo]: e.target.value })} />
                </div>
              ))}
              <div>
                <Label>Peso (kg)</Label>
                <Input value={nova.pesoInicial} onChange={(e) => setNova({ ...nova, pesoInicial: e.target.value })} placeholder="62,5" />
              </div>
              <div>
                <Label>Altura (m)</Label>
                <Input value={nova.alturaInicial} onChange={(e) => setNova({ ...nova, alturaInicial: e.target.value })} placeholder="1,62" />
              </div>
              <div className="col-span-2">
                <Label>Risco da gestação</Label>
                <Select value={nova.riscoGestacional} onValueChange={(v) => setNova({ ...nova, riscoGestacional: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HABITUAL">Risco habitual</SelectItem>
                    <SelectItem value="ALTO_RISCO">Alto risco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={iniciar} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Iniciar pré-natal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
