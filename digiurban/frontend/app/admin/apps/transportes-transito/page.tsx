'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Car,
  Plus,
  BadgeCheck,
  Play,
  Check,
  X,
  ClipboardList,
  CalendarClock,
  RefreshCw,
  Ban,
  Gavel,
  Wrench,
} from 'lucide-react';

const STATUS_CREDENCIAL: Record<string, { label: string; className?: string }> = {
  SOLICITADA: { label: 'Solicitada', className: 'bg-yellow-600' },
  EM_ANALISE: { label: 'Em análise', className: 'bg-blue-600' },
  ATIVA: { label: 'Ativa', className: 'bg-green-600' },
  INDEFERIDA: { label: 'Indeferida', className: 'bg-red-600' },
  SUSPENSA: { label: 'Suspensa', className: 'bg-orange-600' },
  CANCELADA: { label: 'Cancelada', className: 'bg-gray-600' },
};

const STATUS_VISTORIA: Record<string, { label: string; className?: string }> = {
  SOLICITADA: { label: 'Solicitada', className: 'bg-yellow-600' },
  AGENDADA: { label: 'Agendada', className: 'bg-blue-600' },
  REALIZADA: { label: 'Realizada', className: 'bg-green-600' },
  CANCELADA: { label: 'Cancelada', className: 'bg-gray-600' },
};

const STATUS_DEFESA: Record<string, { label: string; className?: string }> = {
  RECEBIDA: { label: 'Recebida', className: 'bg-yellow-600' },
  EM_ANALISE: { label: 'Em análise', className: 'bg-blue-600' },
  DEFERIDA: { label: 'Deferida', className: 'bg-green-600' },
  INDEFERIDA: { label: 'Indeferida', className: 'bg-red-600' },
  CANCELADA: { label: 'Cancelada', className: 'bg-gray-600' },
};

const TIPOS_CREDENCIAL: Record<string, string> = {
  TAXI: 'Táxi',
  MOTOTAXI: 'Mototáxi',
  TRANSPORTE_ESCOLAR: 'Transporte Escolar',
};

const RESULTADO_LABEL: Record<string, string> = {
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  CONDICIONAL: 'Condicional',
};

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Erro ${res.status}`);
  }
  return res.json();
}

const dataBR = (d: any) => (d ? new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '');

export default function TransitoAppPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [credenciais, setCredenciais] = useState<any[]>([]);
  const [vistorias, setVistorias] = useState<any[]>([]);
  const [defesas, setDefesas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // filtros
  const [buscaCredencial, setBuscaCredencial] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroStatusCredencial, setFiltroStatusCredencial] = useState('ATIVAS_E_PENDENTES');
  const [filtroStatusVistoria, setFiltroStatusVistoria] = useState('PENDENTES');
  const [filtroStatusDefesa, setFiltroStatusDefesa] = useState('PENDENTES');

  // dialogs
  const [novaCredencialAberta, setNovaCredencialAberta] = useState(false);
  const [novaCredencial, setNovaCredencial] = useState({
    tipo: 'TAXI',
    titularNome: '',
    cpf: '',
    telefone: '',
    veiculoPlaca: '',
    veiculoModelo: '',
    ponto: '',
  });

  const [credencialEmitir, setCredencialEmitir] = useState<any>(null);
  const [validadeMeses, setValidadeMeses] = useState('12');

  const [acaoMotivo, setAcaoMotivo] = useState<{
    titulo: string;
    rota: string;
    rotulo: string;
  } | null>(null);
  const [motivo, setMotivo] = useState('');

  const [novaVistoriaAberta, setNovaVistoriaAberta] = useState(false);
  const [novaVistoria, setNovaVistoria] = useState({
    veiculoPlaca: '',
    solicitanteNome: '',
    credencialId: '',
    agendadaPara: '',
  });

  const [vistoriaAgendar, setVistoriaAgendar] = useState<any>(null);
  const [dataAgendamento, setDataAgendamento] = useState('');

  const [vistoriaResultado, setVistoriaResultado] = useState<any>(null);
  const [resultado, setResultado] = useState({ resultado: 'APROVADO', itens: '' });

  const [novaDefesaAberta, setNovaDefesaAberta] = useState(false);
  const [novaDefesa, setNovaDefesa] = useState({
    numeroAutuacao: '',
    requerenteNome: '',
    cpf: '',
    veiculoPlaca: '',
    motivo: '',
  });

  const [defesaJulgar, setDefesaJulgar] = useState<any>(null);
  const [julgamento, setJulgamento] = useState({ decisao: 'DEFERIDA', parecer: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, credenciaisData, vistoriasData, defesasData] = await Promise.all([
        api('/api/apps/transportes-transito/stats').catch(() => null),
        api('/api/apps/transportes-transito/credenciais').catch(() => []),
        api('/api/apps/transportes-transito/vistorias').catch(() => []),
        api('/api/apps/transportes-transito/defesas').catch(() => []),
      ]);
      setStats(statsData);
      setCredenciais(Array.isArray(credenciaisData) ? credenciaisData : []);
      setVistorias(Array.isArray(vistoriasData) ? vistoriasData : []);
      setDefesas(Array.isArray(defesasData) ? defesasData : []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const executar = async (rotulo: string, fn: () => Promise<any>) => {
    setSalvando(true);
    try {
      await fn();
      toast({ title: rotulo });
      await loadData();
      return true;
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
      return false;
    } finally {
      setSalvando(false);
    }
  };

  const credenciaisFiltradas = useMemo(() => {
    let lista = credenciais;
    if (filtroStatusCredencial === 'ATIVAS_E_PENDENTES') {
      lista = lista.filter((c) => ['SOLICITADA', 'EM_ANALISE', 'ATIVA', 'SUSPENSA'].includes(c.status));
    } else if (filtroStatusCredencial !== 'TODAS') {
      lista = lista.filter((c) => c.status === filtroStatusCredencial);
    }
    if (filtroTipo !== 'TODOS') lista = lista.filter((c) => c.tipo === filtroTipo);
    if (buscaCredencial) {
      const termo = buscaCredencial.toLowerCase();
      lista = lista.filter(
        (c) =>
          c.titularNome?.toLowerCase().includes(termo) ||
          c.cpf?.includes(termo.replace(/\D/g, '')) ||
          c.veiculoPlaca?.toLowerCase().includes(termo) ||
          c.numeroCredencial?.toLowerCase().includes(termo)
      );
    }
    return lista;
  }, [credenciais, filtroStatusCredencial, filtroTipo, buscaCredencial]);

  const vistoriasFiltradas = useMemo(() => {
    if (filtroStatusVistoria === 'TODAS') return vistorias;
    if (filtroStatusVistoria === 'PENDENTES') {
      return vistorias.filter((v) => ['SOLICITADA', 'AGENDADA'].includes(v.status));
    }
    return vistorias.filter((v) => v.status === filtroStatusVistoria);
  }, [vistorias, filtroStatusVistoria]);

  const defesasFiltradas = useMemo(() => {
    if (filtroStatusDefesa === 'TODAS') return defesas;
    if (filtroStatusDefesa === 'PENDENTES') {
      return defesas.filter((d) => ['RECEBIDA', 'EM_ANALISE'].includes(d.status));
    }
    return defesas.filter((d) => d.status === filtroStatusDefesa);
  }, [defesas, filtroStatusDefesa]);

  const criarCredencial = () =>
    executar('Solicitação registrada', async () => {
      if (!novaCredencial.titularNome) throw new Error('Informe o titular');
      await api('/api/apps/transportes-transito/credenciais', {
        method: 'POST',
        body: JSON.stringify(novaCredencial),
      });
      setNovaCredencialAberta(false);
      setNovaCredencial({
        tipo: 'TAXI',
        titularNome: '',
        cpf: '',
        telefone: '',
        veiculoPlaca: '',
        veiculoModelo: '',
        ponto: '',
      });
    });

  const emitirCredencial = () =>
    executar('Credencial emitida', async () => {
      await api(`/api/apps/transportes-transito/credenciais/${credencialEmitir.id}/emitir`, {
        method: 'POST',
        body: JSON.stringify({ validadeMeses: Number(validadeMeses) || 12 }),
      });
      setCredencialEmitir(null);
      setValidadeMeses('12');
    });

  const confirmarAcaoMotivo = async () => {
    if (!acaoMotivo) return;
    const ok = await executar(acaoMotivo.rotulo, () =>
      api(acaoMotivo.rota, { method: 'POST', body: JSON.stringify({ motivo }) })
    );
    if (ok) {
      setAcaoMotivo(null);
      setMotivo('');
    }
  };

  const criarVistoria = () =>
    executar('Vistoria registrada', async () => {
      if (!novaVistoria.veiculoPlaca) throw new Error('Informe a placa');
      await api('/api/apps/transportes-transito/vistorias', {
        method: 'POST',
        body: JSON.stringify({
          ...novaVistoria,
          credencialId: novaVistoria.credencialId || undefined,
          agendadaPara: novaVistoria.agendadaPara || undefined,
        }),
      });
      setNovaVistoriaAberta(false);
      setNovaVistoria({ veiculoPlaca: '', solicitanteNome: '', credencialId: '', agendadaPara: '' });
    });

  const agendarVistoria = () =>
    executar('Vistoria agendada', async () => {
      if (!dataAgendamento) throw new Error('Informe a data');
      await api(`/api/apps/transportes-transito/vistorias/${vistoriaAgendar.id}/agendar`, {
        method: 'POST',
        body: JSON.stringify({ agendadaPara: dataAgendamento }),
      });
      setVistoriaAgendar(null);
      setDataAgendamento('');
    });

  const registrarResultado = () =>
    executar('Resultado registrado', async () => {
      await api(`/api/apps/transportes-transito/vistorias/${vistoriaResultado.id}/resultado`, {
        method: 'POST',
        body: JSON.stringify(resultado),
      });
      setVistoriaResultado(null);
      setResultado({ resultado: 'APROVADO', itens: '' });
    });

  const criarDefesa = () =>
    executar('Defesa registrada', async () => {
      if (!novaDefesa.numeroAutuacao) throw new Error('Informe o número da autuação');
      await api('/api/apps/transportes-transito/defesas', {
        method: 'POST',
        body: JSON.stringify(novaDefesa),
      });
      setNovaDefesaAberta(false);
      setNovaDefesa({ numeroAutuacao: '', requerenteNome: '', cpf: '', veiculoPlaca: '', motivo: '' });
    });

  const julgarDefesa = () =>
    executar('Defesa julgada', async () => {
      await api(`/api/apps/transportes-transito/defesas/${defesaJulgar.id}/julgar`, {
        method: 'POST',
        body: JSON.stringify(julgamento),
      });
      setDefesaJulgar(null);
      setJulgamento({ decisao: 'DEFERIDA', parecer: '' });
    });

  const acoesCredencial = (c: any) => {
    switch (c.status) {
      case 'SOLICITADA':
        return (
          <Button
            size="sm"
            onClick={() =>
              executar('Análise iniciada', () =>
                api(`/api/apps/transportes-transito/credenciais/${c.id}/iniciar-analise`, {
                  method: 'POST',
                  body: JSON.stringify({}),
                })
              )
            }
          >
            <Play className="h-4 w-4 mr-1" /> Analisar
          </Button>
        );
      case 'EM_ANALISE':
        return (
          <div className="flex gap-1 flex-wrap justify-end">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setCredencialEmitir(c)}
            >
              <BadgeCheck className="h-4 w-4 mr-1" /> Emitir
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setAcaoMotivo({
                  titulo: `Indeferir credencial de ${c.titularNome || 'titular'}`,
                  rota: `/api/apps/transportes-transito/credenciais/${c.id}/indeferir`,
                  rotulo: 'Credencial indeferida',
                })
              }
            >
              <X className="h-4 w-4 mr-1" /> Indeferir
            </Button>
          </div>
        );
      case 'ATIVA':
        return (
          <div className="flex gap-1 flex-wrap justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                executar('Credencial renovada por 12 meses', () =>
                  api(`/api/apps/transportes-transito/credenciais/${c.id}/renovar`, {
                    method: 'POST',
                    body: JSON.stringify({}),
                  })
                )
              }
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Renovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setAcaoMotivo({
                  titulo: `Suspender credencial ${c.numeroCredencial || ''}`,
                  rota: `/api/apps/transportes-transito/credenciais/${c.id}/suspender`,
                  rotulo: 'Credencial suspensa',
                })
              }
            >
              <Ban className="h-4 w-4 mr-1" /> Suspender
            </Button>
          </div>
        );
      case 'SUSPENSA':
        return (
          <Button
            size="sm"
            onClick={() =>
              executar('Credencial reativada', () =>
                api(`/api/apps/transportes-transito/credenciais/${c.id}/reativar`, {
                  method: 'POST',
                  body: JSON.stringify({}),
                })
              )
            }
          >
            <Check className="h-4 w-4 mr-1" /> Reativar
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-sky-100 flex items-center justify-center">
            <Car className="h-7 w-7 text-sky-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Credenciamentos & Vistorias</h1>
            <p className="text-gray-500">
              Credenciais de táxi, mototáxi e transporte escolar com validade, vistorias veiculares
              e defesas de autuação (JARI)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Credenciais ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.credenciaisAtivas ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Solicitações em análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.solicitacoesEmAnalise ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vistorias pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.vistoriasPendentes ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vencendo em 30 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.credenciaisVencendo30d ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="credenciais">
        <TabsList>
          <TabsTrigger value="credenciais">Credenciais</TabsTrigger>
          <TabsTrigger value="vistorias">Vistorias</TabsTrigger>
          <TabsTrigger value="defesas">Defesas (JARI)</TabsTrigger>
        </TabsList>

        {/* ----------------------------------------------------- credenciais */}
        <TabsContent value="credenciais" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Buscar por titular, CPF, placa ou nº da credencial..."
                  value={buscaCredencial}
                  onChange={(e) => setBuscaCredencial(e.target.value)}
                  className="flex-1"
                />
                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                  <SelectTrigger className="w-full md:w-52">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os tipos</SelectItem>
                    {Object.entries(TIPOS_CREDENCIAL).map(([valor, label]) => (
                      <SelectItem key={valor} value={valor}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroStatusCredencial} onValueChange={setFiltroStatusCredencial}>
                  <SelectTrigger className="w-full md:w-52">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVAS_E_PENDENTES">Ativas e pendentes</SelectItem>
                    <SelectItem value="TODAS">Todas</SelectItem>
                    {Object.entries(STATUS_CREDENCIAL).map(([valor, cfg]) => (
                      <SelectItem key={valor} value={valor}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setNovaCredencialAberta(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova solicitação
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Credenciais
                <Badge variant="secondary">{credenciaisFiltradas.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : credenciaisFiltradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma credencial encontrada</div>
              ) : (
                <div className="space-y-3">
                  {credenciaisFiltradas.map((c: any) => {
                    const badge = STATUS_CREDENCIAL[c.status] || { label: c.status };
                    const vencida =
                      c.status === 'ATIVA' && c.validade && new Date(c.validade) < new Date();
                    return (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {c.numeroCredencial && (
                              <Badge variant="outline" className="bg-sky-50 text-sky-700">
                                {c.numeroCredencial}
                              </Badge>
                            )}
                            {c.titularNome || 'Sem titular'}
                            <Badge variant="outline">{TIPOS_CREDENCIAL[c.tipo] || c.tipo}</Badge>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {c.veiculoPlaca && `Placa ${c.veiculoPlaca}`}
                            {c.veiculoModelo && ` (${c.veiculoModelo})`}
                            {c.ponto && ` | Ponto: ${c.ponto}`}
                            {c.telefone && ` | ${c.telefone}`}
                          </div>
                          {c.validade && (
                            <div
                              className={`text-xs mt-1 ${vencida ? 'text-red-600 font-medium' : 'text-gray-400'}`}
                            >
                              Validade: {dataBR(c.validade)}
                              {vencida && ' — VENCIDA'}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={badge.className}>{badge.label}</Badge>
                          {acoesCredencial(c)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------- vistorias */}
        <TabsContent value="vistorias" className="space-y-4 mt-4">
          <div className="flex justify-between gap-4">
            <Select value={filtroStatusVistoria} onValueChange={setFiltroStatusVistoria}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDENTES">Pendentes</SelectItem>
                <SelectItem value="TODAS">Todas</SelectItem>
                {Object.entries(STATUS_VISTORIA).map(([valor, cfg]) => (
                  <SelectItem key={valor} value={valor}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setNovaVistoriaAberta(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova vistoria
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Vistorias veiculares
                <Badge variant="secondary">{vistoriasFiltradas.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : vistoriasFiltradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma vistoria encontrada</div>
              ) : (
                <div className="space-y-3">
                  {vistoriasFiltradas.map((v: any) => {
                    const badge = STATUS_VISTORIA[v.status] || { label: v.status };
                    return (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {v.veiculoPlaca || 'Placa não informada'}
                            {v.resultado && (
                              <span
                                className={`text-sm font-normal ml-2 ${
                                  v.resultado === 'APROVADO'
                                    ? 'text-green-600'
                                    : v.resultado === 'REPROVADO'
                                      ? 'text-red-600'
                                      : 'text-orange-600'
                                }`}
                              >
                                {RESULTADO_LABEL[v.resultado] || v.resultado}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {v.solicitanteNome || v.credencial?.titularNome || 'Solicitante não informado'}
                            {v.credencial?.numeroCredencial && ` | ${v.credencial.numeroCredencial}`}
                            {v.agendadaPara && ` | Agendada: ${dataBR(v.agendadaPara)}`}
                            {v.realizadaEm && ` | Realizada: ${dataBR(v.realizadaEm)}`}
                          </div>
                          {v.itens && <div className="text-xs text-gray-400 mt-1">{v.itens}</div>}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <Badge className={badge.className}>{badge.label}</Badge>
                          {['SOLICITADA', 'AGENDADA'].includes(v.status) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setVistoriaAgendar(v);
                                  setDataAgendamento(
                                    v.agendadaPara ? String(v.agendadaPara).slice(0, 10) : ''
                                  );
                                }}
                              >
                                <CalendarClock className="h-4 w-4 mr-1" />
                                {v.status === 'AGENDADA' ? 'Reagendar' : 'Agendar'}
                              </Button>
                              <Button size="sm" onClick={() => setVistoriaResultado(v)}>
                                <Check className="h-4 w-4 mr-1" /> Resultado
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  executar('Vistoria cancelada', () =>
                                    api(`/api/apps/transportes-transito/vistorias/${v.id}/cancelar`, {
                                      method: 'POST',
                                      body: JSON.stringify({}),
                                    })
                                  )
                                }
                              >
                                <X className="h-4 w-4 mr-1" /> Cancelar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* --------------------------------------------------------- defesas */}
        <TabsContent value="defesas" className="space-y-4 mt-4">
          <div className="flex justify-between gap-4">
            <Select value={filtroStatusDefesa} onValueChange={setFiltroStatusDefesa}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDENTES">Pendentes</SelectItem>
                <SelectItem value="TODAS">Todas</SelectItem>
                {Object.entries(STATUS_DEFESA).map(([valor, cfg]) => (
                  <SelectItem key={valor} value={valor}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setNovaDefesaAberta(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova defesa
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Defesas de autuação
                <Badge variant="secondary">{defesasFiltradas.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : defesasFiltradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma defesa encontrada</div>
              ) : (
                <div className="space-y-3">
                  {defesasFiltradas.map((d: any) => {
                    const badge = STATUS_DEFESA[d.status] || { label: d.status };
                    return (
                      <div key={d.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">
                              {d.numeroAutuacao ? `Auto ${d.numeroAutuacao}` : 'Sem nº de autuação'}
                              {d.veiculoPlaca && (
                                <span className="text-sm text-gray-500 font-normal ml-2">
                                  Placa {d.veiculoPlaca}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {d.requerenteNome || 'Requerente não informado'}
                              {d.julgadaEm && ` | Julgada em ${dataBR(d.julgadaEm)}`}
                            </div>
                            {d.motivo && (
                              <div className="text-xs text-gray-400 mt-1 line-clamp-2">{d.motivo}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <Badge className={badge.className}>{badge.label}</Badge>
                            {d.status === 'RECEBIDA' && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  executar('Análise iniciada', () =>
                                    api(
                                      `/api/apps/transportes-transito/defesas/${d.id}/iniciar-analise`,
                                      { method: 'POST', body: JSON.stringify({}) }
                                    )
                                  )
                                }
                              >
                                <Play className="h-4 w-4 mr-1" /> Analisar
                              </Button>
                            )}
                            {d.status === 'EM_ANALISE' && (
                              <Button size="sm" onClick={() => setDefesaJulgar(d)}>
                                <Gavel className="h-4 w-4 mr-1" /> Julgar
                              </Button>
                            )}
                          </div>
                        </div>
                        {d.parecerJari && (
                          <p className="text-xs text-gray-500 mt-2 pl-3 border-l-2 border-sky-200">
                            <span className="font-medium">Parecer JARI:</span> {d.parecerJari}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog nova credencial */}
      <Dialog open={novaCredencialAberta} onOpenChange={setNovaCredencialAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova solicitação de credencial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select
                  value={novaCredencial.tipo}
                  onValueChange={(v) => setNovaCredencial({ ...novaCredencial, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPOS_CREDENCIAL).map(([valor, label]) => (
                      <SelectItem key={valor} value={valor}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Titular *</Label>
                <Input
                  value={novaCredencial.titularNome}
                  onChange={(e) =>
                    setNovaCredencial({ ...novaCredencial, titularNome: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>CPF</Label>
                <Input
                  value={novaCredencial.cpf}
                  onChange={(e) => setNovaCredencial({ ...novaCredencial, cpf: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={novaCredencial.telefone}
                  onChange={(e) =>
                    setNovaCredencial({ ...novaCredencial, telefone: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Placa</Label>
                <Input
                  value={novaCredencial.veiculoPlaca}
                  onChange={(e) =>
                    setNovaCredencial({ ...novaCredencial, veiculoPlaca: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input
                  value={novaCredencial.veiculoModelo}
                  onChange={(e) =>
                    setNovaCredencial({ ...novaCredencial, veiculoModelo: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Ponto</Label>
                <Input
                  placeholder="Ex.: Praça Central"
                  value={novaCredencial.ponto}
                  onChange={(e) => setNovaCredencial({ ...novaCredencial, ponto: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNovaCredencialAberta(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button onClick={criarCredencial} disabled={salvando}>
              {salvando ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog emitir credencial */}
      <Dialog open={!!credencialEmitir} onOpenChange={(open) => !open && setCredencialEmitir(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Emitir credencial — {credencialEmitir?.titularNome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Validade (meses)</Label>
              <Input
                type="number"
                min={1}
                value={validadeMeses}
                onChange={(e) => setValidadeMeses(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500">
              O número da credencial (CRD-ano-sequência) é gerado automaticamente
              {credencialEmitir?.protocolId && ' e o protocolo de origem será concluído'}.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCredencialEmitir(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={emitirCredencial}
              disabled={salvando}
            >
              {salvando ? 'Emitindo...' : 'Emitir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog motivo (indeferir/suspender) */}
      <Dialog open={!!acaoMotivo} onOpenChange={(open) => !open && setAcaoMotivo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{acaoMotivo?.titulo}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Motivo</Label>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcaoMotivo(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarAcaoMotivo}
              disabled={salvando || !motivo}
            >
              {salvando ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog nova vistoria */}
      <Dialog open={novaVistoriaAberta} onOpenChange={setNovaVistoriaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova vistoria veicular</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Placa *</Label>
                <Input
                  value={novaVistoria.veiculoPlaca}
                  onChange={(e) =>
                    setNovaVistoria({ ...novaVistoria, veiculoPlaca: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Solicitante</Label>
                <Input
                  value={novaVistoria.solicitanteNome}
                  onChange={(e) =>
                    setNovaVistoria({ ...novaVistoria, solicitanteNome: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Credencial vinculada</Label>
                <Select
                  value={novaVistoria.credencialId}
                  onValueChange={(v) => setNovaVistoria({ ...novaVistoria, credencialId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {credenciais
                      .filter((c) => c.status === 'ATIVA')
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.numeroCredencial || c.titularNome} ({TIPOS_CREDENCIAL[c.tipo] || c.tipo})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Agendar para</Label>
                <Input
                  type="date"
                  value={novaVistoria.agendadaPara}
                  onChange={(e) =>
                    setNovaVistoria({ ...novaVistoria, agendadaPara: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNovaVistoriaAberta(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button onClick={criarVistoria} disabled={salvando}>
              {salvando ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog agendar vistoria */}
      <Dialog open={!!vistoriaAgendar} onOpenChange={(open) => !open && setVistoriaAgendar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar vistoria — {vistoriaAgendar?.veiculoPlaca}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Data *</Label>
            <Input
              type="date"
              value={dataAgendamento}
              onChange={(e) => setDataAgendamento(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVistoriaAgendar(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={agendarVistoria} disabled={salvando || !dataAgendamento}>
              {salvando ? 'Agendando...' : 'Agendar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog resultado da vistoria */}
      <Dialog
        open={!!vistoriaResultado}
        onOpenChange={(open) => !open && setVistoriaResultado(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resultado — {vistoriaResultado?.veiculoPlaca}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Resultado *</Label>
              <Select
                value={resultado.resultado}
                onValueChange={(v) => setResultado({ ...resultado, resultado: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APROVADO">Aprovado</SelectItem>
                  <SelectItem value="REPROVADO">Reprovado</SelectItem>
                  <SelectItem value="CONDICIONAL">Condicional (com pendências)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Itens reprovados / pendências</Label>
              <Textarea
                value={resultado.itens}
                onChange={(e) => setResultado({ ...resultado, itens: e.target.value })}
              />
            </div>
            {vistoriaResultado?.protocolId && (
              <p className="text-xs text-gray-500">
                O protocolo de origem será concluído automaticamente.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVistoriaResultado(null)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button onClick={registrarResultado} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Registrar resultado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog nova defesa */}
      <Dialog open={novaDefesaAberta} onOpenChange={setNovaDefesaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova defesa de autuação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nº da autuação *</Label>
                <Input
                  value={novaDefesa.numeroAutuacao}
                  onChange={(e) => setNovaDefesa({ ...novaDefesa, numeroAutuacao: e.target.value })}
                />
              </div>
              <div>
                <Label>Placa</Label>
                <Input
                  value={novaDefesa.veiculoPlaca}
                  onChange={(e) => setNovaDefesa({ ...novaDefesa, veiculoPlaca: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Requerente</Label>
                <Input
                  value={novaDefesa.requerenteNome}
                  onChange={(e) => setNovaDefesa({ ...novaDefesa, requerenteNome: e.target.value })}
                />
              </div>
              <div>
                <Label>CPF</Label>
                <Input
                  value={novaDefesa.cpf}
                  onChange={(e) => setNovaDefesa({ ...novaDefesa, cpf: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Motivo da defesa</Label>
              <Textarea
                value={novaDefesa.motivo}
                onChange={(e) => setNovaDefesa({ ...novaDefesa, motivo: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaDefesaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarDefesa} disabled={salvando}>
              {salvando ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog julgar defesa */}
      <Dialog open={!!defesaJulgar} onOpenChange={(open) => !open && setDefesaJulgar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Julgar — Auto {defesaJulgar?.numeroAutuacao}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Decisão *</Label>
              <Select
                value={julgamento.decisao}
                onValueChange={(v) => setJulgamento({ ...julgamento, decisao: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEFERIDA">Deferida (autuação cancelada)</SelectItem>
                  <SelectItem value="INDEFERIDA">Indeferida (autuação mantida)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Parecer JARI</Label>
              <Textarea
                value={julgamento.parecer}
                onChange={(e) => setJulgamento({ ...julgamento, parecer: e.target.value })}
              />
            </div>
            {defesaJulgar?.protocolId && (
              <p className="text-xs text-gray-500">
                O protocolo de origem será concluído automaticamente.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDefesaJulgar(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={julgarDefesa} disabled={salvando}>
              {salvando ? 'Julgando...' : 'Julgar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
