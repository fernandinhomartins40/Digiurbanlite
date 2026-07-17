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
  Home,
  Plus,
  Play,
  ListOrdered,
  X,
  Award,
  ClipboardList,
  Dices,
  KeyRound,
  Building2,
} from 'lucide-react';

const STATUS_LABEL: Record<string, { label: string; className?: string }> = {
  INSCRITA: { label: 'Inscrita', className: 'bg-yellow-600' },
  EM_ANALISE: { label: 'Em análise', className: 'bg-blue-600' },
  CLASSIFICADA: { label: 'Na fila', className: 'bg-indigo-600' },
  SELECIONADA: { label: 'Selecionada', className: 'bg-emerald-600' },
  CONTEMPLADA: { label: 'Contemplada', className: 'bg-green-700' },
  INDEFERIDA: { label: 'Indeferida', className: 'bg-red-600' },
  CANCELADA: { label: 'Cancelada', className: 'bg-gray-600' },
};

const ENCERRADAS = ['CONTEMPLADA', 'INDEFERIDA', 'CANCELADA'];

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

export default function HabitacaoAppPage() {
  const { toast } = useToast();
  const [inscricoes, setInscricoes] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);
  const [conjuntos, setConjuntos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('ATIVAS');
  const [filtroPrograma, setFiltroPrograma] = useState('TODOS');
  const [busca, setBusca] = useState('');

  // Nova inscrição
  const [novaAberta, setNovaAberta] = useState(false);
  const [nova, setNova] = useState({
    programaId: '',
    nome: '',
    cpf: '',
    rendaFamiliar: '',
    membrosFamilia: '',
    observacoes: '',
  });

  // Vincular programa / editar critérios (classificação)
  const [inscricaoEdicao, setInscricaoEdicao] = useState<any>(null);
  const [edicao, setEdicao] = useState<{ programaId: string; criterios: string[] }>({
    programaId: '',
    criterios: [],
  });

  // Contemplar
  const [inscricaoContemplar, setInscricaoContemplar] = useState<any>(null);
  const [contemplacao, setContemplacao] = useState({ conjuntoId: '', unidadeIdentificacao: '' });

  // Indeferir (motivo)
  const [acaoMotivo, setAcaoMotivo] = useState<{ inscricao: any; rota: string; titulo: string } | null>(
    null
  );
  const [motivo, setMotivo] = useState('');

  // Sorteio
  const [sorteioAberto, setSorteioAberto] = useState(false);
  const [sorteio, setSorteio] = useState({ programaId: '', quantidade: '1' });
  const [resultadoSorteio, setResultadoSorteio] = useState<any[]>([]);

  // Novo programa
  const [novoProgramaAberto, setNovoProgramaAberto] = useState(false);
  const [novoPrograma, setNovoPrograma] = useState({
    nome: '',
    tipo: 'Aquisição',
    descricao: '',
    criterios: 'renda_baixa | Renda até 1 salário mínimo | 3\nmulher_chefe | Mulher chefe de família | 2\npcd | Pessoa com deficiência na família | 2\nidoso | Idoso na família | 1\narea_risco | Mora em área de risco | 3',
  });

  // Novo conjunto
  const [novoConjuntoAberto, setNovoConjuntoAberto] = useState(false);
  const [novoConjunto, setNovoConjunto] = useState({
    nome: '',
    endereco: '',
    bairro: '',
    totalUnidades: '',
    programaOrigem: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [inscricoesData, programasData, conjuntosData, statsData] = await Promise.all([
        api('/api/apps/habitacao/inscricoes'),
        api('/api/apps/habitacao/programas').catch(() => []),
        api('/api/apps/habitacao/conjuntos').catch(() => []),
        api('/api/apps/habitacao/inscricoes/stats').catch(() => null),
      ]);
      setInscricoes(Array.isArray(inscricoesData) ? inscricoesData : []);
      setProgramas(Array.isArray(programasData) ? programasData : []);
      setConjuntos(Array.isArray(conjuntosData) ? conjuntosData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtradas = useMemo(() => {
    let lista = inscricoes;
    if (filtroStatus === 'ATIVAS') {
      lista = lista.filter((i) => !ENCERRADAS.includes(i.status));
    } else if (filtroStatus !== 'TODAS') {
      lista = lista.filter((i) => i.status === filtroStatus);
    }
    if (filtroPrograma !== 'TODOS') {
      lista = lista.filter((i) =>
        filtroPrograma === 'SEM_PROGRAMA' ? !i.programaId : i.programaId === filtroPrograma
      );
    }
    if (busca) {
      const termo = busca.toLowerCase();
      lista = lista.filter(
        (i) => i.nome?.toLowerCase().includes(termo) || i.cpf?.includes(termo.replace(/\D/g, ''))
      );
    }
    return lista;
  }, [inscricoes, filtroStatus, filtroPrograma, busca]);

  const totalPorStatus = (status: string) =>
    stats?.porStatus?.find((s: any) => s.status === status)?.total || 0;

  const criteriosDoPrograma = (programaId: string): any[] => {
    const programa = programas.find((p) => p.id === programaId);
    return Array.isArray(programa?.criteriosElegibilidade) ? programa.criteriosElegibilidade : [];
  };

  const criarInscricao = async () => {
    if (!nova.nome) {
      toast({ title: 'Informe o nome', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/habitacao/inscricoes', {
        method: 'POST',
        body: JSON.stringify({
          ...nova,
          programaId: nova.programaId || undefined,
          rendaFamiliar: nova.rendaFamiliar ? Number(nova.rendaFamiliar) : undefined,
          membrosFamilia: nova.membrosFamilia ? Number(nova.membrosFamilia) : undefined,
        }),
      });
      toast({ title: 'Inscrição criada' });
      setNovaAberta(false);
      setNova({ programaId: '', nome: '', cpf: '', rendaFamiliar: '', membrosFamilia: '', observacoes: '' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const acao = async (inscricao: any, rota: string, body: any = {}) => {
    try {
      await api(`/api/apps/habitacao/inscricoes/${inscricao.id}/${rota}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast({ title: 'Situação atualizada' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const abrirEdicao = (i: any) => {
    setInscricaoEdicao(i);
    setEdicao({
      programaId: i.programaId || '',
      criterios: Array.isArray(i.criteriosAtendidos) ? i.criteriosAtendidos.map(String) : [],
    });
  };

  const salvarEdicao = async (classificarDepois: boolean) => {
    if (!inscricaoEdicao) return;
    if (!edicao.programaId) {
      toast({ title: 'Selecione o programa', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api(`/api/apps/habitacao/inscricoes/${inscricaoEdicao.id}`, {
        method: 'PUT',
        body: JSON.stringify({ programaId: edicao.programaId, criteriosAtendidos: edicao.criterios }),
      });
      if (classificarDepois) {
        await api(`/api/apps/habitacao/inscricoes/${inscricaoEdicao.id}/classificar`, {
          method: 'POST',
          body: JSON.stringify({}),
        });
      }
      toast({ title: classificarDepois ? 'Inscrição classificada na fila' : 'Inscrição atualizada' });
      setInscricaoEdicao(null);
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const contemplar = async () => {
    if (!inscricaoContemplar) return;
    setSalvando(true);
    try {
      await api(`/api/apps/habitacao/inscricoes/${inscricaoContemplar.id}/contemplar`, {
        method: 'POST',
        body: JSON.stringify({
          conjuntoId: contemplacao.conjuntoId || undefined,
          unidadeIdentificacao: contemplacao.unidadeIdentificacao || undefined,
        }),
      });
      toast({ title: 'Inscrição contemplada' });
      setInscricaoContemplar(null);
      setContemplacao({ conjuntoId: '', unidadeIdentificacao: '' });
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
      await acao(acaoMotivo.inscricao, acaoMotivo.rota, { motivo });
      setAcaoMotivo(null);
      setMotivo('');
    } finally {
      setSalvando(false);
    }
  };

  const realizarSorteio = async () => {
    if (!sorteio.programaId) {
      toast({ title: 'Selecione o programa', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      const resultado = await api(`/api/apps/habitacao/programas/${sorteio.programaId}/sortear`, {
        method: 'POST',
        body: JSON.stringify({ quantidade: Number(sorteio.quantidade) || 1 }),
      });
      setResultadoSorteio(resultado.selecionadas || []);
      toast({ title: `${(resultado.selecionadas || []).length} inscrição(ões) selecionada(s)` });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const criarPrograma = async () => {
    if (!novoPrograma.nome) {
      toast({ title: 'Informe o nome do programa', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      const criterios = novoPrograma.criterios
        .split('\n')
        .map((linha) => {
          const [codigo, label, pontos] = linha.split('|').map((s) => s.trim());
          return codigo ? { codigo, label: label || codigo, pontos: Number(pontos) || 0 } : null;
        })
        .filter(Boolean);
      await api('/api/apps/habitacao/programas', {
        method: 'POST',
        body: JSON.stringify({
          nome: novoPrograma.nome,
          tipo: novoPrograma.tipo,
          descricao: novoPrograma.descricao,
          criteriosElegibilidade: criterios,
        }),
      });
      toast({ title: 'Programa criado' });
      setNovoProgramaAberto(false);
      setNovoPrograma({ ...novoPrograma, nome: '', descricao: '' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const criarConjunto = async () => {
    if (!novoConjunto.nome) {
      toast({ title: 'Informe o nome do conjunto', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/habitacao/conjuntos', {
        method: 'POST',
        body: JSON.stringify({
          ...novoConjunto,
          totalUnidades: novoConjunto.totalUnidades ? Number(novoConjunto.totalUnidades) : undefined,
        }),
      });
      toast({ title: 'Conjunto cadastrado' });
      setNovoConjuntoAberto(false);
      setNovoConjunto({ nome: '', endereco: '', bairro: '', totalUnidades: '', programaOrigem: '' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const acoesInscricao = (i: any) => {
    switch (i.status) {
      case 'INSCRITA':
        return (
          <Button size="sm" onClick={() => acao(i, 'iniciar-analise')}>
            <Play className="h-4 w-4 mr-1" /> Analisar
          </Button>
        );
      case 'EM_ANALISE':
        return (
          <div className="flex gap-1 flex-wrap justify-end">
            <Button size="sm" onClick={() => abrirEdicao(i)}>
              <ListOrdered className="h-4 w-4 mr-1" /> Classificar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setAcaoMotivo({ inscricao: i, rota: 'indeferir', titulo: `Indeferir inscrição` })
              }
            >
              <X className="h-4 w-4 mr-1" /> Indeferir
            </Button>
          </div>
        );
      case 'CLASSIFICADA':
        return (
          <div className="flex gap-1 flex-wrap justify-end">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => acao(i, 'selecionar')}
            >
              <Award className="h-4 w-4 mr-1" /> Selecionar
            </Button>
            <Button size="sm" variant="outline" onClick={() => abrirEdicao(i)}>
              <ListOrdered className="h-4 w-4 mr-1" /> Critérios
            </Button>
          </div>
        );
      case 'SELECIONADA':
        return (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setInscricaoContemplar(i)}
          >
            <KeyRound className="h-4 w-4 mr-1" /> Contemplar
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
          <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center">
            <Home className="h-7 w-7 text-amber-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Programas Habitacionais</h1>
            <p className="text-gray-500">
              Inscrições, pontuação por critérios, fila, sorteio e contemplação de unidades
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSorteioAberto(true)}>
            <Dices className="h-4 w-4 mr-2" />
            Sorteio
          </Button>
          <Button onClick={() => setNovaAberta(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova inscrição
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Na fila</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {totalPorStatus('CLASSIFICADA')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aguardando análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalPorStatus('INSCRITA') + totalPorStatus('EM_ANALISE')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contempladas no ano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.contempladasNoAno ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unidades disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {stats?.unidadesDisponiveis ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inscricoes">
        <TabsList>
          <TabsTrigger value="inscricoes">Inscrições & Fila</TabsTrigger>
          <TabsTrigger value="programas">Programas ({programas.length})</TabsTrigger>
          <TabsTrigger value="conjuntos">Conjuntos ({conjuntos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inscricoes" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Buscar por nome ou CPF..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="flex-1"
                />
                <Select value={filtroPrograma} onValueChange={setFiltroPrograma}>
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Programa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos os programas</SelectItem>
                    <SelectItem value="SEM_PROGRAMA">Sem programa vinculado</SelectItem>
                    {programas.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                Inscrições
                <Badge variant="secondary">{filtradas.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : filtradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma inscrição encontrada</div>
              ) : (
                <div className="space-y-3">
                  {filtradas.map((i: any) => {
                    const badge = STATUS_LABEL[i.status] || { label: i.status };
                    return (
                      <div
                        key={i.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium flex items-center gap-2">
                            {i.posicaoFila != null && (
                              <Badge variant="outline" className="bg-indigo-50 text-indigo-700">
                                {i.posicaoFila}º
                              </Badge>
                            )}
                            {i.nome || 'Sem nome'}
                            {i.pontuacao > 0 && (
                              <span className="text-sm text-gray-500 font-normal">
                                {i.pontuacao} pts
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {i.programa?.nome || 'Sem programa vinculado'}
                            {i.cpf && ` | CPF ${i.cpf}`}
                            {i.rendaFamiliar != null &&
                              ` | Renda R$ ${Number(i.rendaFamiliar).toLocaleString('pt-BR')}`}
                            {i.membrosFamilia != null && ` | ${i.membrosFamilia} pessoa(s)`}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Inscrita em {new Date(i.createdAt).toLocaleDateString('pt-BR')}
                            {i.unidadeIdentificacao && ` | Unidade: ${i.unidadeIdentificacao}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={badge.className}>{badge.label}</Badge>
                          {acoesInscricao(i)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programas" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setNovoProgramaAberto(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo programa
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programas.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {p.nome}
                    <Badge variant="outline">{p.tipo}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  {p.descricao && <p>{p.descricao}</p>}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{p.totalInscricoes ?? 0} inscrição(ões)</span>
                    <span>
                      {(Array.isArray(p.criteriosElegibilidade) ? p.criteriosElegibilidade.length : 0)}{' '}
                      critério(s) de pontuação
                    </span>
                  </div>
                  {Array.isArray(p.criteriosElegibilidade) && p.criteriosElegibilidade.length > 0 && (
                    <ul className="text-xs text-gray-500 list-disc ml-4">
                      {p.criteriosElegibilidade.map((c: any) => (
                        <li key={c.codigo}>
                          {c.label || c.codigo} — {c.pontos} pt(s)
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
            {programas.length === 0 && !loading && (
              <p className="text-gray-500 col-span-2 text-center py-8">
                Nenhum programa cadastrado — crie o primeiro para montar a fila
              </p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="conjuntos" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setNovoConjuntoAberto(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo conjunto
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conjuntos.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-amber-600" />
                    {c.nome}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p>{[c.endereco, c.bairro].filter(Boolean).join(' — ') || 'Sem endereço'}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                    {c.totalUnidades != null && <span>{c.totalUnidades} unidades</span>}
                    <span className="text-green-600">{c.unidadesDisponiveis} disponíveis</span>
                    <span>{c.unidadesOcupadas} ocupadas</span>
                    {c.programaOrigem && <Badge variant="outline">{c.programaOrigem}</Badge>}
                  </div>
                </CardContent>
              </Card>
            ))}
            {conjuntos.length === 0 && !loading && (
              <p className="text-gray-500 col-span-2 text-center py-8">
                Nenhum conjunto habitacional cadastrado
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog nova inscrição */}
      <Dialog open={novaAberta} onOpenChange={setNovaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova inscrição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Programa</Label>
              <Select
                value={nova.programaId}
                onValueChange={(v) => setNova({ ...nova, programaId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional — pode vincular depois)" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input value={nova.nome} onChange={(e) => setNova({ ...nova, nome: e.target.value })} />
              </div>
              <div>
                <Label>CPF</Label>
                <Input value={nova.cpf} onChange={(e) => setNova({ ...nova, cpf: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Renda familiar (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={nova.rendaFamiliar}
                  onChange={(e) => setNova({ ...nova, rendaFamiliar: e.target.value })}
                />
              </div>
              <div>
                <Label>Pessoas na família</Label>
                <Input
                  type="number"
                  min={1}
                  value={nova.membrosFamilia}
                  onChange={(e) => setNova({ ...nova, membrosFamilia: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={nova.observacoes}
                onChange={(e) => setNova({ ...nova, observacoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarInscricao} disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar inscrição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog classificar / critérios */}
      <Dialog open={!!inscricaoEdicao} onOpenChange={(open) => !open && setInscricaoEdicao(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Classificação — {inscricaoEdicao?.nome || 'inscrição'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Programa *</Label>
              <Select
                value={edicao.programaId}
                onValueChange={(v) => setEdicao({ programaId: v, criterios: [] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {edicao.programaId && (
              <div>
                <Label>Critérios atendidos</Label>
                {criteriosDoPrograma(edicao.programaId).length === 0 ? (
                  <p className="text-xs text-gray-500 mt-1">
                    Este programa não tem critérios de pontuação configurados.
                  </p>
                ) : (
                  <div className="space-y-2 mt-2">
                    {criteriosDoPrograma(edicao.programaId).map((c: any) => {
                      const marcado = edicao.criterios.includes(c.codigo);
                      return (
                        <label
                          key={c.codigo}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={(e) =>
                              setEdicao({
                                ...edicao,
                                criterios: e.target.checked
                                  ? [...edicao.criterios, c.codigo]
                                  : edicao.criterios.filter((x) => x !== c.codigo),
                              })
                            }
                          />
                          <span className="flex-1">{c.label || c.codigo}</span>
                          <Badge variant="outline">{c.pontos} pt(s)</Badge>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInscricaoEdicao(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button variant="outline" onClick={() => salvarEdicao(false)} disabled={salvando}>
              Salvar
            </Button>
            {inscricaoEdicao?.status !== 'CLASSIFICADA' && (
              <Button onClick={() => salvarEdicao(true)} disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar e pôr na fila'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog contemplar */}
      <Dialog
        open={!!inscricaoContemplar}
        onOpenChange={(open) => !open && setInscricaoContemplar(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Contemplar — {inscricaoContemplar?.nome || 'inscrição'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Conjunto habitacional</Label>
              <Select
                value={contemplacao.conjuntoId}
                onValueChange={(v) => setContemplacao({ ...contemplacao, conjuntoId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {conjuntos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} ({c.unidadesDisponiveis} disponíveis)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Identificação da unidade</Label>
              <Input
                placeholder="Ex.: Quadra 3, Lote 12 / Apto 204"
                value={contemplacao.unidadeIdentificacao}
                onChange={(e) =>
                  setContemplacao({ ...contemplacao, unidadeIdentificacao: e.target.value })
                }
              />
            </div>
            {inscricaoContemplar?.protocolId && (
              <p className="text-xs text-gray-500">
                O protocolo de origem será concluído automaticamente.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInscricaoContemplar(null)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={contemplar} disabled={salvando}>
              {salvando ? 'Contemplando...' : 'Contemplar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog motivo (indeferir) */}
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
            <Button variant="destructive" onClick={confirmarAcaoMotivo} disabled={salvando || !motivo}>
              {salvando ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog sorteio */}
      <Dialog
        open={sorteioAberto}
        onOpenChange={(open) => {
          setSorteioAberto(open);
          if (!open) setResultadoSorteio([]);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sorteio público</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Programa *</Label>
              <Select
                value={sorteio.programaId}
                onValueChange={(v) => setSorteio({ ...sorteio, programaId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantidade de vagas</Label>
              <Input
                type="number"
                min={1}
                value={sorteio.quantidade}
                onChange={(e) => setSorteio({ ...sorteio, quantidade: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-500">
              O sorteio seleciona aleatoriamente entre as inscrições na fila (classificadas) do
              programa.
            </p>
            {resultadoSorteio.length > 0 && (
              <div className="p-3 border rounded-lg bg-emerald-50">
                <div className="font-medium text-sm mb-1">Sorteadas:</div>
                <ul className="text-sm list-disc ml-4">
                  {resultadoSorteio.map((s: any) => (
                    <li key={s.id}>{s.nome || s.id}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSorteioAberto(false)} disabled={salvando}>
              Fechar
            </Button>
            <Button onClick={realizarSorteio} disabled={salvando}>
              <Dices className="h-4 w-4 mr-1" />
              {salvando ? 'Sorteando...' : 'Sortear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
