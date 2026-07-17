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
  Siren,
  Plus,
  Play,
  ClipboardList,
  Check,
  Ban,
  Eye,
  Home,
  Users,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

const STATUS_LABEL: Record<string, { label: string; className?: string }> = {
  ABERTA: { label: 'Aberta', className: 'bg-yellow-600' },
  EM_ATENDIMENTO: { label: 'Em atendimento', className: 'bg-blue-600' },
  VISTORIADA: { label: 'Vistoriada', className: 'bg-indigo-600' },
  INTERDITADA: { label: 'Interditada', className: 'bg-red-700' },
  MONITORAMENTO: { label: 'Em monitoramento', className: 'bg-purple-600' },
  CONCLUIDA: { label: 'Concluída', className: 'bg-green-700' },
  CANCELADA: { label: 'Cancelada', className: 'bg-gray-600' },
};

const TIPO_LABEL: Record<string, string> = {
  DESLIZAMENTO: 'Deslizamento',
  ALAGAMENTO: 'Alagamento',
  VENDAVAL: 'Vendaval',
  INCENDIO: 'Incêndio',
  AREA_RISCO: 'Área de risco',
  VISTORIA: 'Vistoria',
  REMOCAO_PREVENTIVA: 'Remoção preventiva',
  SOLICITACAO_ABRIGO: 'Solicitação de abrigo',
  OUTRO: 'Outro',
};

const GRAVIDADE_LABEL: Record<string, { label: string; className: string }> = {
  BAIXA: { label: 'Baixa', className: 'bg-gray-500' },
  MEDIA: { label: 'Média', className: 'bg-yellow-600' },
  ALTA: { label: 'Alta', className: 'bg-orange-600' },
  CRITICA: { label: 'Crítica', className: 'bg-red-700' },
};

const SITUACAO_FAMILIA: Record<string, { label: string; className?: string }> = {
  DESALOJADA: { label: 'Desalojada', className: 'bg-orange-600' },
  DESABRIGADA: { label: 'Desabrigada', className: 'bg-red-600' },
  EM_ABRIGO: { label: 'Em abrigo', className: 'bg-blue-600' },
  RETORNOU: { label: 'Retornou', className: 'bg-green-700' },
};

const ENCERRADAS = ['CONCLUIDA', 'CANCELADA'];

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

export default function DefesaCivilAppPage() {
  const { toast } = useToast();
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [abrigos, setAbrigos] = useState<any[]>([]);
  const [familias, setFamilias] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('ATIVAS');
  const [busca, setBusca] = useState('');

  // Nova ocorrência
  const [novaAberta, setNovaAberta] = useState(false);
  const [nova, setNova] = useState({
    tipo: '',
    gravidade: 'MEDIA',
    solicitanteNome: '',
    endereco: '',
    bairro: '',
    descricao: '',
  });

  // Vistoria
  const [ocorrenciaVistoria, setOcorrenciaVistoria] = useState<any>(null);
  const [vistoria, setVistoria] = useState({ laudo: '', nivelRisco: 'BAIXO', interditar: false });

  // Concluir/cancelar (motivo)
  const [acaoMotivo, setAcaoMotivo] = useState<{
    ocorrencia: any;
    rota: string;
    campo: string;
    titulo: string;
  } | null>(null);
  const [motivo, setMotivo] = useState('');

  // Detalhe
  const [detalhe, setDetalhe] = useState<any>(null);

  // Novo abrigo
  const [novoAbrigoAberto, setNovoAbrigoAberto] = useState(false);
  const [novoAbrigo, setNovoAbrigo] = useState({
    nome: '',
    endereco: '',
    bairro: '',
    capacidade: '',
    responsavelNome: '',
    telefone: '',
  });

  // Nova família
  const [novaFamiliaAberta, setNovaFamiliaAberta] = useState(false);
  const [novaFamilia, setNovaFamilia] = useState({
    ocorrenciaId: '',
    responsavelNome: '',
    cpf: '',
    membros: '',
    situacao: 'DESALOJADA',
    necessidades: '',
  });

  // Alojar família
  const [familiaAlojar, setFamiliaAlojar] = useState<any>(null);
  const [abrigoEscolhido, setAbrigoEscolhido] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ocorrenciasData, abrigosData, familiasData, statsData] = await Promise.all([
        api('/api/apps/defesa-civil/ocorrencias'),
        api('/api/apps/defesa-civil/abrigos').catch(() => []),
        api('/api/apps/defesa-civil/familias').catch(() => []),
        api('/api/apps/defesa-civil/ocorrencias/stats').catch(() => null),
      ]);
      setOcorrencias(Array.isArray(ocorrenciasData) ? ocorrenciasData : []);
      setAbrigos(Array.isArray(abrigosData) ? abrigosData : []);
      setFamilias(Array.isArray(familiasData) ? familiasData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtradas = useMemo(() => {
    let lista = ocorrencias;
    if (filtroStatus === 'ATIVAS') {
      lista = lista.filter((o) => !ENCERRADAS.includes(o.status));
    } else if (filtroStatus !== 'TODAS') {
      lista = lista.filter((o) => o.status === filtroStatus);
    }
    if (busca) {
      const termo = busca.toLowerCase();
      lista = lista.filter(
        (o) =>
          o.numero?.toLowerCase().includes(termo) ||
          o.solicitanteNome?.toLowerCase().includes(termo) ||
          o.endereco?.toLowerCase().includes(termo) ||
          o.bairro?.toLowerCase().includes(termo)
      );
    }
    return lista;
  }, [ocorrencias, filtroStatus, busca]);

  const emAndamento =
    (stats?.porStatus || [])
      .filter((s: any) => !ENCERRADAS.includes(s.status))
      .reduce((acc: number, s: any) => acc + s.total, 0) || 0;

  const criarOcorrencia = async () => {
    if (!nova.tipo) {
      toast({ title: 'Selecione o tipo', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/defesa-civil/ocorrencias', {
        method: 'POST',
        body: JSON.stringify(nova),
      });
      toast({ title: 'Ocorrência registrada' });
      setNovaAberta(false);
      setNova({ tipo: '', gravidade: 'MEDIA', solicitanteNome: '', endereco: '', bairro: '', descricao: '' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const acao = async (ocorrencia: any, rota: string, body: any = {}) => {
    try {
      await api(`/api/apps/defesa-civil/ocorrencias/${ocorrencia.id}/${rota}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast({ title: 'Situação atualizada' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const registrarVistoria = async () => {
    if (!ocorrenciaVistoria) return;
    setSalvando(true);
    try {
      await api(`/api/apps/defesa-civil/ocorrencias/${ocorrenciaVistoria.id}/registrar-vistoria`, {
        method: 'POST',
        body: JSON.stringify(vistoria),
      });
      toast({ title: vistoria.interditar ? 'Área interditada' : 'Vistoria registrada' });
      setOcorrenciaVistoria(null);
      setVistoria({ laudo: '', nivelRisco: 'BAIXO', interditar: false });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const confirmarAcaoMotivo = async () => {
    if (!acaoMotivo) return;
    setSalvando(true);
    try {
      await acao(acaoMotivo.ocorrencia, acaoMotivo.rota, { [acaoMotivo.campo]: motivo });
      setAcaoMotivo(null);
      setMotivo('');
    } finally {
      setSalvando(false);
    }
  };

  const abrirDetalhe = async (o: any) => {
    try {
      setDetalhe(await api(`/api/apps/defesa-civil/ocorrencias/${o.id}`));
    } catch {
      setDetalhe(o);
    }
  };

  const criarAbrigo = async () => {
    if (!novoAbrigo.nome) {
      toast({ title: 'Informe o nome do abrigo', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/defesa-civil/abrigos', {
        method: 'POST',
        body: JSON.stringify({
          ...novoAbrigo,
          capacidade: novoAbrigo.capacidade ? Number(novoAbrigo.capacidade) : undefined,
        }),
      });
      toast({ title: 'Abrigo cadastrado' });
      setNovoAbrigoAberto(false);
      setNovoAbrigo({ nome: '', endereco: '', bairro: '', capacidade: '', responsavelNome: '', telefone: '' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const criarFamilia = async () => {
    if (!novaFamilia.responsavelNome) {
      toast({ title: 'Informe o responsável', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/defesa-civil/familias', {
        method: 'POST',
        body: JSON.stringify({
          ...novaFamilia,
          ocorrenciaId: novaFamilia.ocorrenciaId || undefined,
          membros: novaFamilia.membros ? Number(novaFamilia.membros) : undefined,
        }),
      });
      toast({ title: 'Família registrada' });
      setNovaFamiliaAberta(false);
      setNovaFamilia({
        ocorrenciaId: '',
        responsavelNome: '',
        cpf: '',
        membros: '',
        situacao: 'DESALOJADA',
        necessidades: '',
      });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const alojar = async () => {
    if (!familiaAlojar || !abrigoEscolhido) return;
    setSalvando(true);
    try {
      await api(`/api/apps/defesa-civil/familias/${familiaAlojar.id}/alojar`, {
        method: 'POST',
        body: JSON.stringify({ abrigoId: abrigoEscolhido }),
      });
      toast({ title: 'Família alojada' });
      setFamiliaAlojar(null);
      setAbrigoEscolhido('');
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const retirar = async (f: any) => {
    try {
      await api(`/api/apps/defesa-civil/familias/${f.id}/retirar`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast({ title: 'Saída registrada' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const acoesOcorrencia = (o: any) => {
    switch (o.status) {
      case 'ABERTA':
        return (
          <Button size="sm" onClick={() => acao(o, 'iniciar-atendimento')}>
            <Play className="h-4 w-4 mr-1" /> Atender
          </Button>
        );
      case 'EM_ATENDIMENTO':
        return (
          <Button size="sm" variant="outline" onClick={() => setOcorrenciaVistoria(o)}>
            <Eye className="h-4 w-4 mr-1" /> Vistoria
          </Button>
        );
      case 'VISTORIADA':
      case 'INTERDITADA':
      case 'MONITORAMENTO':
        return (
          <div className="flex gap-1 flex-wrap justify-end">
            {o.status !== 'MONITORAMENTO' && (
              <Button size="sm" variant="outline" onClick={() => acao(o, 'monitorar')}>
                <ShieldAlert className="h-4 w-4 mr-1" /> Monitorar
              </Button>
            )}
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() =>
                setAcaoMotivo({
                  ocorrencia: o,
                  rota: 'concluir',
                  campo: 'observacao',
                  titulo: `Concluir ${o.numero}`,
                })
              }
            >
              <Check className="h-4 w-4 mr-1" /> Concluir
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
            <Siren className="h-7 w-7 text-orange-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ocorrências & Áreas de Risco</h1>
            <p className="text-gray-500">
              Defesa Civil — ocorrências georreferenciadas, vistorias, interdições, abrigos e
              famílias atingidas
            </p>
          </div>
        </div>
        <Button onClick={() => setNovaAberta(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova ocorrência
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{emAndamento}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Áreas interditadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.areasInterditadas ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ocupação dos abrigos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.abrigos ? `${stats.abrigos.ocupacao}/${stats.abrigos.capacidade}` : '0/0'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Famílias em abrigo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.familiasEmAbrigo ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ocorrencias">
        <TabsList>
          <TabsTrigger value="ocorrencias">Ocorrências</TabsTrigger>
          <TabsTrigger value="abrigos">Abrigos ({abrigos.length})</TabsTrigger>
          <TabsTrigger value="familias">Famílias atingidas ({familias.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="ocorrencias" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Buscar por número, solicitante, endereço ou bairro..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="flex-1"
                />
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVAS">Ativas</SelectItem>
                    <SelectItem value="TODAS">Todas</SelectItem>
                    {Object.entries(STATUS_LABEL).map(([valor, cfg]) => (
                      <SelectItem key={valor} value={valor}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Ocorrências
                <Badge variant="secondary">{filtradas.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : filtradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma ocorrência encontrada</div>
              ) : (
                <div className="space-y-3">
                  {filtradas.map((o: any) => {
                    const badge = STATUS_LABEL[o.status] || { label: o.status };
                    const grav = GRAVIDADE_LABEL[o.gravidade];
                    return (
                      <div
                        key={o.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1 cursor-pointer" onClick={() => abrirDetalhe(o)}>
                          <div className="font-medium flex items-center gap-2">
                            {o.numero}
                            <span className="text-gray-600 font-normal">
                              {TIPO_LABEL[o.tipo] || o.tipo}
                            </span>
                            {grav && <Badge className={grav.className}>{grav.label}</Badge>}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {o.solicitanteNome || 'Solicitante não informado'}
                            {(o.endereco || o.bairro) &&
                              ` | ${[o.endereco, o.bairro].filter(Boolean).join(' — ')}`}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Aberta em {new Date(o.createdAt).toLocaleDateString('pt-BR')}
                            {o.nivelRisco && ` | Risco: ${o.nivelRisco}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={badge.className}>{badge.label}</Badge>
                          {acoesOcorrencia(o)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abrigos" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setNovoAbrigoAberto(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo abrigo
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {abrigos.map((a) => {
              const lotado = a.capacidade != null && a.ocupacao >= a.capacidade;
              return (
                <Card key={a.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-orange-600" />
                        {a.nome}
                      </span>
                      <Badge className={lotado ? 'bg-red-600' : 'bg-green-600'}>
                        {a.ocupacao}/{a.capacidade ?? '∞'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600">
                    <p>{[a.endereco, a.bairro].filter(Boolean).join(' — ') || 'Sem endereço'}</p>
                    {(a.responsavelNome || a.telefone) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {[a.responsavelNome, a.telefone].filter(Boolean).join(' | ')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {abrigos.length === 0 && !loading && (
              <p className="text-gray-500 col-span-2 text-center py-8">Nenhum abrigo cadastrado</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="familias" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setNovaFamiliaAberta(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registrar família
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              {familias.length === 0 && !loading ? (
                <p className="text-gray-500 text-center py-8">Nenhuma família registrada</p>
              ) : (
                <div className="space-y-3">
                  {familias.map((f: any) => {
                    const sit = SITUACAO_FAMILIA[f.situacao] || { label: f.situacao };
                    const abrigo = abrigos.find((a) => a.id === f.abrigoId);
                    return (
                      <div
                        key={f.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            {f.responsavelNome || 'Sem responsável'}
                            {f.membros != null && (
                              <span className="text-sm text-gray-500 font-normal">
                                {f.membros} pessoa(s)
                              </span>
                            )}
                            {f.cadUnicoFamiliaId && (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                CadÚnico
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {f.ocorrencia?.numero
                              ? `Ocorrência ${f.ocorrencia.numero}`
                              : 'Sem ocorrência vinculada'}
                            {f.cpf && ` | CPF ${f.cpf}`}
                            {abrigo && ` | Abrigo: ${abrigo.nome}`}
                          </div>
                          {f.necessidades && (
                            <div className="text-xs text-gray-400 mt-1">
                              Necessidades: {f.necessidades}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={sit.className}>{sit.label}</Badge>
                          {f.situacao === 'EM_ABRIGO' ? (
                            <Button size="sm" variant="outline" onClick={() => retirar(f)}>
                              <LogOut className="h-4 w-4 mr-1" /> Registrar saída
                            </Button>
                          ) : f.situacao !== 'RETORNOU' ? (
                            <Button size="sm" onClick={() => setFamiliaAlojar(f)}>
                              <Home className="h-4 w-4 mr-1" /> Alojar
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog nova ocorrência */}
      <Dialog open={novaAberta} onOpenChange={setNovaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova ocorrência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select value={nova.tipo} onValueChange={(v) => setNova({ ...nova, tipo: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_LABEL).map(([valor, label]) => (
                      <SelectItem key={valor} value={valor}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gravidade</Label>
                <Select
                  value={nova.gravidade}
                  onValueChange={(v) => setNova({ ...nova, gravidade: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(GRAVIDADE_LABEL).map(([valor, cfg]) => (
                      <SelectItem key={valor} value={valor}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Solicitante</Label>
              <Input
                value={nova.solicitanteNome}
                onChange={(e) => setNova({ ...nova, solicitanteNome: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Endereço / Local</Label>
                <Input
                  value={nova.endereco}
                  onChange={(e) => setNova({ ...nova, endereco: e.target.value })}
                />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input
                  value={nova.bairro}
                  onChange={(e) => setNova({ ...nova, bairro: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={nova.descricao}
                onChange={(e) => setNova({ ...nova, descricao: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarOcorrencia} disabled={salvando}>
              {salvando ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog vistoria */}
      <Dialog open={!!ocorrenciaVistoria} onOpenChange={(open) => !open && setOcorrenciaVistoria(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vistoria técnica — {ocorrenciaVistoria?.numero}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nível de risco</Label>
              <Select
                value={vistoria.nivelRisco}
                onValueChange={(v) => setVistoria({ ...vistoria, nivelRisco: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEM_RISCO">Sem risco</SelectItem>
                  <SelectItem value="BAIXO">Baixo</SelectItem>
                  <SelectItem value="MEDIO">Médio</SelectItem>
                  <SelectItem value="ALTO">Alto</SelectItem>
                  <SelectItem value="MUITO_ALTO">Muito alto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Laudo *</Label>
              <Textarea
                value={vistoria.laudo}
                onChange={(e) => setVistoria({ ...vistoria, laudo: e.target.value })}
                rows={4}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={vistoria.interditar}
                onChange={(e) => setVistoria({ ...vistoria, interditar: e.target.checked })}
              />
              <span className="flex items-center gap-1">
                <Ban className="h-4 w-4 text-red-600" /> Interditar a área
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOcorrenciaVistoria(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={registrarVistoria} disabled={salvando || !vistoria.laudo}>
              {salvando ? 'Registrando...' : 'Registrar vistoria'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog motivo/observação */}
      <Dialog open={!!acaoMotivo} onOpenChange={(open) => !open && setAcaoMotivo(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{acaoMotivo?.titulo}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Observação</Label>
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            {acaoMotivo?.ocorrencia?.protocolId && (
              <p className="text-xs text-gray-500 mt-2">
                O protocolo de origem será concluído automaticamente.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAcaoMotivo(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button onClick={confirmarAcaoMotivo} disabled={salvando}>
              {salvando ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog novo abrigo */}
      <Dialog open={novoAbrigoAberto} onOpenChange={setNovoAbrigoAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo abrigo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={novoAbrigo.nome}
                  onChange={(e) => setNovoAbrigo({ ...novoAbrigo, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Capacidade (pessoas)</Label>
                <Input
                  type="number"
                  min={0}
                  value={novoAbrigo.capacidade}
                  onChange={(e) => setNovoAbrigo({ ...novoAbrigo, capacidade: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Endereço</Label>
                <Input
                  value={novoAbrigo.endereco}
                  onChange={(e) => setNovoAbrigo({ ...novoAbrigo, endereco: e.target.value })}
                />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input
                  value={novoAbrigo.bairro}
                  onChange={(e) => setNovoAbrigo({ ...novoAbrigo, bairro: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Responsável</Label>
                <Input
                  value={novoAbrigo.responsavelNome}
                  onChange={(e) => setNovoAbrigo({ ...novoAbrigo, responsavelNome: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={novoAbrigo.telefone}
                  onChange={(e) => setNovoAbrigo({ ...novoAbrigo, telefone: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoAbrigoAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarAbrigo} disabled={salvando}>
              {salvando ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog nova família */}
      <Dialog open={novaFamiliaAberta} onOpenChange={setNovaFamiliaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar família atingida</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ocorrência</Label>
              <Select
                value={novaFamilia.ocorrenciaId}
                onValueChange={(v) => setNovaFamilia({ ...novaFamilia, ocorrenciaId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {ocorrencias
                    .filter((o) => !ENCERRADAS.includes(o.status))
                    .map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.numero} — {TIPO_LABEL[o.tipo] || o.tipo}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Responsável *</Label>
                <Input
                  value={novaFamilia.responsavelNome}
                  onChange={(e) =>
                    setNovaFamilia({ ...novaFamilia, responsavelNome: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>CPF</Label>
                <Input
                  value={novaFamilia.cpf}
                  onChange={(e) => setNovaFamilia({ ...novaFamilia, cpf: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pessoas na família</Label>
                <Input
                  type="number"
                  min={1}
                  value={novaFamilia.membros}
                  onChange={(e) => setNovaFamilia({ ...novaFamilia, membros: e.target.value })}
                />
              </div>
              <div>
                <Label>Situação</Label>
                <Select
                  value={novaFamilia.situacao}
                  onValueChange={(v) => setNovaFamilia({ ...novaFamilia, situacao: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DESALOJADA">Desalojada</SelectItem>
                    <SelectItem value="DESABRIGADA">Desabrigada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Necessidades</Label>
              <Textarea
                placeholder="Ex.: colchões, cestas básicas, medicamentos..."
                value={novaFamilia.necessidades}
                onChange={(e) => setNovaFamilia({ ...novaFamilia, necessidades: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-500">
              Se o CPF do responsável tiver cadastro no CadÚnico, a ficha é vinculada
              automaticamente.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaFamiliaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarFamilia} disabled={salvando}>
              {salvando ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog alojar família */}
      <Dialog open={!!familiaAlojar} onOpenChange={(open) => !open && setFamiliaAlojar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alojar — {familiaAlojar?.responsavelNome || 'família'}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Abrigo *</Label>
            <Select value={abrigoEscolhido} onValueChange={setAbrigoEscolhido}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {abrigos.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nome} ({a.ocupacao}/{a.capacidade ?? '∞'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-2">
              A ocupação do abrigo será somada com as pessoas da família.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFamiliaAlojar(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={alojar} disabled={salvando || !abrigoEscolhido}>
              {salvando ? 'Alojando...' : 'Alojar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog detalhe */}
      <Dialog open={!!detalhe} onOpenChange={(open) => !open && setDetalhe(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detalhe?.numero} — {TIPO_LABEL[detalhe?.tipo] || detalhe?.tipo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge className={STATUS_LABEL[detalhe?.status]?.className}>
                {STATUS_LABEL[detalhe?.status]?.label || detalhe?.status}
              </Badge>
              {detalhe?.gravidade && GRAVIDADE_LABEL[detalhe.gravidade] && (
                <Badge className={GRAVIDADE_LABEL[detalhe.gravidade].className}>
                  {GRAVIDADE_LABEL[detalhe.gravidade].label}
                </Badge>
              )}
              {detalhe?.nivelRisco && <Badge variant="outline">Risco {detalhe.nivelRisco}</Badge>}
            </div>
            <div>
              <span className="text-gray-500">Solicitante:</span>{' '}
              <span className="font-medium">{detalhe?.solicitanteNome || '-'}</span>
            </div>
            <div className="text-gray-500">
              {[detalhe?.endereco, detalhe?.bairro].filter(Boolean).join(' — ') || 'Sem endereço'}
            </div>
            {detalhe?.descricao && <p className="text-gray-700">{detalhe.descricao}</p>}
            {detalhe?.laudo && (
              <div className="p-3 border rounded-lg bg-gray-50">
                <div className="font-medium mb-1">
                  Laudo
                  {detalhe.vistoriaEm &&
                    ` (vistoria em ${new Date(detalhe.vistoriaEm).toLocaleDateString('pt-BR')})`}
                </div>
                <p className="text-gray-700 whitespace-pre-line">{detalhe.laudo}</p>
              </div>
            )}
            {detalhe?.interditadoEm && (
              <p className="text-red-600 text-xs">
                Interditada em {new Date(detalhe.interditadoEm).toLocaleDateString('pt-BR')}
              </p>
            )}
            <div className="font-medium mt-2">
              Famílias atingidas ({(detalhe?.familias || []).length})
            </div>
            {(detalhe?.familias || []).length === 0 ? (
              <p className="text-gray-500">Nenhuma família vinculada</p>
            ) : (
              <div className="space-y-2">
                {detalhe.familias.map((f: any) => (
                  <div key={f.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{f.responsavelNome || 'Sem responsável'}</span>
                      <Badge className={SITUACAO_FAMILIA[f.situacao]?.className}>
                        {SITUACAO_FAMILIA[f.situacao]?.label || f.situacao}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {f.membros != null && `${f.membros} pessoa(s)`}
                      {f.necessidades && ` | ${f.necessidades}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
