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
  Palette,
  Plus,
  Users,
  CalendarCheck,
  MapPin,
  ScrollText,
  Music,
  Check,
  X,
  ClipboardList,
  UserPlus,
  Undo2,
  Play,
  MessageSquarePlus,
} from 'lucide-react';

const STATUS_MATRICULA: Record<string, { label: string; className?: string }> = {
  INSCRITA: { label: 'Inscrita', className: 'bg-yellow-600' },
  LISTA_ESPERA: { label: 'Lista de espera', className: 'bg-orange-600' },
  MATRICULADA: { label: 'Matriculada', className: 'bg-green-600' },
  DESLIGADA: { label: 'Desligada', className: 'bg-gray-600' },
  CANCELADA: { label: 'Cancelada', className: 'bg-gray-600' },
};

const STATUS_RESERVA: Record<string, { label: string; className?: string }> = {
  SOLICITADA: { label: 'Solicitada', className: 'bg-yellow-600' },
  CONFIRMADA: { label: 'Confirmada', className: 'bg-green-600' },
  RECUSADA: { label: 'Recusada', className: 'bg-red-600' },
  CANCELADA: { label: 'Cancelada', className: 'bg-gray-600' },
};

const STATUS_PROJETO: Record<string, { label: string; className?: string }> = {
  RECEBIDO: { label: 'Recebido', className: 'bg-yellow-600' },
  EM_ANALISE: { label: 'Em análise', className: 'bg-blue-600' },
  APROVADO: { label: 'Aprovado', className: 'bg-green-600' },
  REPROVADO: { label: 'Reprovado', className: 'bg-red-600' },
  CANCELADO: { label: 'Cancelado', className: 'bg-gray-600' },
};

const STATUS_EMPRESTIMO: Record<string, { label: string; className?: string }> = {
  SOLICITADO: { label: 'Solicitado', className: 'bg-yellow-600' },
  EMPRESTADO: { label: 'Emprestado', className: 'bg-blue-600' },
  DEVOLVIDO: { label: 'Devolvido', className: 'bg-green-600' },
  CANCELADO: { label: 'Cancelado', className: 'bg-gray-600' },
};

const STATUS_EDITAL: Record<string, string> = {
  INSCRICOES_ABERTAS: 'Inscrições abertas',
  EM_ANALISE: 'Em análise',
  RESULTADO_PUBLICADO: 'Resultado publicado',
  ENCERRADO: 'Encerrado',
  CANCELADO: 'Cancelado',
};

const CATEGORIAS = [
  'MUSICA',
  'DANCA',
  'TEATRO',
  'ARTES_VISUAIS',
  'ARTESANATO',
  'LITERATURA',
  'AUDIOVISUAL',
  'OUTRA',
];

const CATEGORIA_LABEL: Record<string, string> = {
  MUSICA: 'Música',
  DANCA: 'Dança',
  TEATRO: 'Teatro',
  ARTES_VISUAIS: 'Artes Visuais',
  ARTESANATO: 'Artesanato',
  LITERATURA: 'Literatura',
  AUDIOVISUAL: 'Audiovisual',
  OUTRA: 'Outra',
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

export default function CulturaAppPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [oficinas, setOficinas] = useState<any[]>([]);
  const [matriculas, setMatriculas] = useState<any[]>([]);
  const [espacos, setEspacos] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [editais, setEditais] = useState<any[]>([]);
  const [projetos, setProjetos] = useState<any[]>([]);
  const [emprestimos, setEmprestimos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // filtros
  const [buscaMatricula, setBuscaMatricula] = useState('');
  const [filtroOficina, setFiltroOficina] = useState('TODAS');
  const [filtroStatusMatricula, setFiltroStatusMatricula] = useState('ATIVAS');
  const [filtroStatusReserva, setFiltroStatusReserva] = useState('SOLICITADA');
  const [filtroStatusProjeto, setFiltroStatusProjeto] = useState('ATIVOS');
  const [filtroStatusEmprestimo, setFiltroStatusEmprestimo] = useState('ATIVOS');

  // dialogs
  const [novaOficinaAberta, setNovaOficinaAberta] = useState(false);
  const [novaOficina, setNovaOficina] = useState({
    nome: '',
    categoria: 'MUSICA',
    atividade: '',
    instrutor: '',
    espacoId: '',
    diasHorarios: '',
    vagas: '',
  });

  const [novaMatriculaAberta, setNovaMatriculaAberta] = useState(false);
  const [novaMatricula, setNovaMatricula] = useState({
    nome: '',
    dataNascimento: '',
    responsavelNome: '',
    telefone: '',
    atividadePretendida: '',
    observacoes: '',
  });

  const [matriculaVincular, setMatriculaVincular] = useState<any>(null);
  const [oficinaEscolhida, setOficinaEscolhida] = useState('');

  const [oficinaChamada, setOficinaChamada] = useState<any>(null);
  const [chamada, setChamada] = useState<{ data: string; presentes: string[] }>({
    data: new Date().toISOString().slice(0, 10),
    presentes: [],
  });
  const [alunosChamada, setAlunosChamada] = useState<any[]>([]);

  const [novaReservaAberta, setNovaReservaAberta] = useState(false);
  const [reservaEdicao, setReservaEdicao] = useState<any>(null);
  const [formReserva, setFormReserva] = useState({
    espacoId: '',
    solicitanteNome: '',
    data: '',
    horaInicio: '',
    horaFim: '',
    finalidade: '',
  });

  const [novoEditalAberto, setNovoEditalAberto] = useState(false);
  const [novoEdital, setNovoEdital] = useState({ nome: '', categoria: '', descricao: '' });

  const [novoProjetoAberto, setNovoProjetoAberto] = useState(false);
  const [novoProjeto, setNovoProjeto] = useState({
    editalId: '',
    titulo: '',
    proponente: '',
    telefone: '',
    categoria: '',
    descricao: '',
    valorSolicitado: '',
  });

  const [projetoParecer, setProjetoParecer] = useState<any>(null);
  const [parecer, setParecer] = useState({ texto: '', recomendacao: '' });

  const [projetoAprovar, setProjetoAprovar] = useState<any>(null);
  const [editalAprovacao, setEditalAprovacao] = useState('');

  const [projetoReprovar, setProjetoReprovar] = useState<any>(null);
  const [motivoReprovacao, setMotivoReprovacao] = useState('');

  const [novoEmprestimoAberto, setNovoEmprestimoAberto] = useState(false);
  const [novoEmprestimo, setNovoEmprestimo] = useState({
    item: '',
    quantidade: '1',
    solicitanteNome: '',
    telefone: '',
    dataPrevistaDevolucao: '',
  });

  const [emprestimoEntregar, setEmprestimoEntregar] = useState<any>(null);
  const [dataDevolucaoPrevista, setDataDevolucaoPrevista] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, oficinasData, matriculasData, espacosData, reservasData, editaisData, projetosData, emprestimosData] =
        await Promise.all([
          api('/api/apps/cultura/stats').catch(() => null),
          api('/api/apps/cultura/oficinas').catch(() => []),
          api('/api/apps/cultura/matriculas').catch(() => []),
          api('/api/apps/cultura/espacos').catch(() => []),
          api('/api/apps/cultura/reservas').catch(() => []),
          api('/api/apps/cultura/editais').catch(() => []),
          api('/api/apps/cultura/projetos').catch(() => []),
          api('/api/apps/cultura/emprestimos').catch(() => []),
        ]);
      setStats(statsData);
      setOficinas(Array.isArray(oficinasData) ? oficinasData : []);
      setMatriculas(Array.isArray(matriculasData) ? matriculasData : []);
      setEspacos(Array.isArray(espacosData) ? espacosData : []);
      setReservas(Array.isArray(reservasData) ? reservasData : []);
      setEditais(Array.isArray(editaisData) ? editaisData : []);
      setProjetos(Array.isArray(projetosData) ? projetosData : []);
      setEmprestimos(Array.isArray(emprestimosData) ? emprestimosData : []);
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

  const matriculasFiltradas = useMemo(() => {
    let lista = matriculas;
    if (filtroStatusMatricula === 'ATIVAS') {
      lista = lista.filter((m) => !['DESLIGADA', 'CANCELADA'].includes(m.status));
    } else if (filtroStatusMatricula !== 'TODAS') {
      lista = lista.filter((m) => m.status === filtroStatusMatricula);
    }
    if (filtroOficina === 'SEM_OFICINA') lista = lista.filter((m) => !m.oficinaId);
    else if (filtroOficina !== 'TODAS') lista = lista.filter((m) => m.oficinaId === filtroOficina);
    if (buscaMatricula) {
      const termo = buscaMatricula.toLowerCase();
      lista = lista.filter(
        (m) =>
          m.nome?.toLowerCase().includes(termo) ||
          m.responsavelNome?.toLowerCase().includes(termo)
      );
    }
    return lista;
  }, [matriculas, filtroStatusMatricula, filtroOficina, buscaMatricula]);

  const reservasFiltradas = useMemo(() => {
    if (filtroStatusReserva === 'TODAS') return reservas;
    return reservas.filter((r) => r.status === filtroStatusReserva);
  }, [reservas, filtroStatusReserva]);

  const projetosFiltrados = useMemo(() => {
    if (filtroStatusProjeto === 'TODOS') return projetos;
    if (filtroStatusProjeto === 'ATIVOS') {
      return projetos.filter((p) => ['RECEBIDO', 'EM_ANALISE'].includes(p.status));
    }
    return projetos.filter((p) => p.status === filtroStatusProjeto);
  }, [projetos, filtroStatusProjeto]);

  const emprestimosFiltrados = useMemo(() => {
    if (filtroStatusEmprestimo === 'TODOS') return emprestimos;
    if (filtroStatusEmprestimo === 'ATIVOS') {
      return emprestimos.filter((e) => ['SOLICITADO', 'EMPRESTADO'].includes(e.status));
    }
    return emprestimos.filter((e) => e.status === filtroStatusEmprestimo);
  }, [emprestimos, filtroStatusEmprestimo]);

  const criarOficina = () =>
    executar('Oficina criada', async () => {
      await api('/api/apps/cultura/oficinas', {
        method: 'POST',
        body: JSON.stringify({
          ...novaOficina,
          espacoId: novaOficina.espacoId || undefined,
          vagas: novaOficina.vagas ? Number(novaOficina.vagas) : undefined,
        }),
      });
      setNovaOficinaAberta(false);
      setNovaOficina({ ...novaOficina, nome: '', atividade: '', instrutor: '', diasHorarios: '', vagas: '' });
    });

  const criarMatricula = () =>
    executar('Inscrição criada', async () => {
      if (!novaMatricula.nome) throw new Error('Informe o nome do participante');
      await api('/api/apps/cultura/matriculas', {
        method: 'POST',
        body: JSON.stringify({
          ...novaMatricula,
          dataNascimento: novaMatricula.dataNascimento || undefined,
          atividadePretendida: novaMatricula.atividadePretendida || undefined,
        }),
      });
      setNovaMatriculaAberta(false);
      setNovaMatricula({
        nome: '',
        dataNascimento: '',
        responsavelNome: '',
        telefone: '',
        atividadePretendida: '',
        observacoes: '',
      });
    });

  const matricularNaOficina = () =>
    executar('Matrícula efetivada', async () => {
      if (!oficinaEscolhida) throw new Error('Selecione a oficina');
      await api(`/api/apps/cultura/matriculas/${matriculaVincular.id}/matricular`, {
        method: 'POST',
        body: JSON.stringify({ oficinaId: oficinaEscolhida }),
      });
      setMatriculaVincular(null);
      setOficinaEscolhida('');
    });

  const abrirChamada = async (oficina: any) => {
    setOficinaChamada(oficina);
    setChamada({ data: new Date().toISOString().slice(0, 10), presentes: [] });
    try {
      const alunos = await api(
        `/api/apps/cultura/matriculas?oficinaId=${oficina.id}&status=MATRICULADA`
      );
      setAlunosChamada(Array.isArray(alunos) ? alunos : []);
    } catch {
      setAlunosChamada([]);
    }
  };

  const salvarChamada = () =>
    executar('Frequência registrada', async () => {
      await api(`/api/apps/cultura/oficinas/${oficinaChamada.id}/frequencias`, {
        method: 'POST',
        body: JSON.stringify(chamada),
      });
      setOficinaChamada(null);
    });

  const salvarReserva = () =>
    executar(reservaEdicao ? 'Reserva atualizada' : 'Reserva criada', async () => {
      const body = JSON.stringify({
        ...formReserva,
        espacoId: formReserva.espacoId || undefined,
        data: formReserva.data || undefined,
      });
      if (reservaEdicao) {
        await api(`/api/apps/cultura/reservas/${reservaEdicao.id}`, { method: 'PUT', body });
      } else {
        await api('/api/apps/cultura/reservas', { method: 'POST', body });
      }
      setNovaReservaAberta(false);
      setReservaEdicao(null);
    });

  const abrirEdicaoReserva = (r: any) => {
    setFormReserva({
      espacoId: r.espacoId || '',
      solicitanteNome: r.solicitanteNome || '',
      data: r.data ? String(r.data).slice(0, 10) : '',
      horaInicio: r.horaInicio || '',
      horaFim: r.horaFim || '',
      finalidade: r.finalidade || '',
    });
    setReservaEdicao(r);
    setNovaReservaAberta(true);
  };

  const criarEdital = () =>
    executar('Edital criado', async () => {
      await api('/api/apps/cultura/editais', {
        method: 'POST',
        body: JSON.stringify(novoEdital),
      });
      setNovoEditalAberto(false);
      setNovoEdital({ nome: '', categoria: '', descricao: '' });
    });

  const criarProjeto = () =>
    executar('Projeto registrado', async () => {
      if (!novoProjeto.titulo) throw new Error('Informe o título do projeto');
      await api('/api/apps/cultura/projetos', {
        method: 'POST',
        body: JSON.stringify({
          ...novoProjeto,
          editalId: novoProjeto.editalId || undefined,
          valorSolicitado: novoProjeto.valorSolicitado
            ? Number(novoProjeto.valorSolicitado)
            : undefined,
        }),
      });
      setNovoProjetoAberto(false);
      setNovoProjeto({
        editalId: '',
        titulo: '',
        proponente: '',
        telefone: '',
        categoria: '',
        descricao: '',
        valorSolicitado: '',
      });
    });

  const salvarParecer = () =>
    executar('Parecer registrado', async () => {
      if (!parecer.texto) throw new Error('Escreva o parecer');
      await api(`/api/apps/cultura/projetos/${projetoParecer.id}/pareceres`, {
        method: 'POST',
        body: JSON.stringify({
          texto: parecer.texto,
          recomendacao: parecer.recomendacao || undefined,
        }),
      });
      setProjetoParecer(null);
      setParecer({ texto: '', recomendacao: '' });
    });

  const aprovarProjeto = () =>
    executar('Projeto aprovado', async () => {
      await api(`/api/apps/cultura/projetos/${projetoAprovar.id}/aprovar`, {
        method: 'POST',
        body: JSON.stringify({ editalId: editalAprovacao || undefined }),
      });
      setProjetoAprovar(null);
      setEditalAprovacao('');
    });

  const reprovarProjeto = () =>
    executar('Projeto reprovado', async () => {
      await api(`/api/apps/cultura/projetos/${projetoReprovar.id}/reprovar`, {
        method: 'POST',
        body: JSON.stringify({ motivo: motivoReprovacao || undefined }),
      });
      setProjetoReprovar(null);
      setMotivoReprovacao('');
    });

  const criarEmprestimo = () =>
    executar('Solicitação registrada', async () => {
      if (!novoEmprestimo.item) throw new Error('Informe o equipamento');
      await api('/api/apps/cultura/emprestimos', {
        method: 'POST',
        body: JSON.stringify({
          ...novoEmprestimo,
          quantidade: Number(novoEmprestimo.quantidade) || 1,
          dataPrevistaDevolucao: novoEmprestimo.dataPrevistaDevolucao || undefined,
        }),
      });
      setNovoEmprestimoAberto(false);
      setNovoEmprestimo({ item: '', quantidade: '1', solicitanteNome: '', telefone: '', dataPrevistaDevolucao: '' });
    });

  const registrarEntrega = () =>
    executar('Equipamento emprestado', async () => {
      await api(`/api/apps/cultura/emprestimos/${emprestimoEntregar.id}/emprestar`, {
        method: 'POST',
        body: JSON.stringify({ dataPrevistaDevolucao: dataDevolucaoPrevista || undefined }),
      });
      setEmprestimoEntregar(null);
      setDataDevolucaoPrevista('');
    });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
            <Palette className="h-7 w-7 text-purple-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Espaços & Oficinas Culturais</h1>
            <p className="text-gray-500">
              Oficinas com vagas e frequência, reservas de espaços sem conflito, editais com
              projetos e empréstimo de equipamento
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Participantes matriculados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.participantesMatriculados ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inscrições aguardando</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.inscricoesAguardando ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Reservas pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.reservasPendentes ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projetos em análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.projetosEmAnalise ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="matriculas">
        <TabsList>
          <TabsTrigger value="matriculas">Matrículas</TabsTrigger>
          <TabsTrigger value="oficinas">Oficinas ({oficinas.length})</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
          <TabsTrigger value="editais">Editais & Projetos</TabsTrigger>
          <TabsTrigger value="emprestimos">Empréstimos</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------ matrículas */}
        <TabsContent value="matriculas" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Buscar por participante ou responsável..."
                  value={buscaMatricula}
                  onChange={(e) => setBuscaMatricula(e.target.value)}
                  className="flex-1"
                />
                <Select value={filtroOficina} onValueChange={setFiltroOficina}>
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Oficina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todas as oficinas</SelectItem>
                    <SelectItem value="SEM_OFICINA">Sem oficina</SelectItem>
                    {oficinas.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filtroStatusMatricula} onValueChange={setFiltroStatusMatricula}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVAS">Ativas</SelectItem>
                    <SelectItem value="TODAS">Todas</SelectItem>
                    {Object.entries(STATUS_MATRICULA).map(([valor, cfg]) => (
                      <SelectItem key={valor} value={valor}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setNovaMatriculaAberta(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova inscrição
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Inscrições e matrículas
                <Badge variant="secondary">{matriculasFiltradas.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : matriculasFiltradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma inscrição encontrada</div>
              ) : (
                <div className="space-y-3">
                  {matriculasFiltradas.map((m: any) => {
                    const badge = STATUS_MATRICULA[m.status] || { label: m.status };
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{m.nome || 'Sem nome'}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {m.oficina?.nome ||
                              (m.atividadePretendida
                                ? `Pretende: ${m.atividadePretendida}`
                                : 'Sem oficina')}
                            {m.dataNascimento && ` | Nascimento ${dataBR(m.dataNascimento)}`}
                            {m.responsavelNome && ` | Resp.: ${m.responsavelNome}`}
                            {m.telefone && ` | ${m.telefone}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={badge.className}>{badge.label}</Badge>
                          {['INSCRITA', 'LISTA_ESPERA'].includes(m.status) && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setMatriculaVincular(m);
                                setOficinaEscolhida(m.oficinaId || '');
                              }}
                            >
                              <UserPlus className="h-4 w-4 mr-1" /> Matricular
                            </Button>
                          )}
                          {m.status === 'MATRICULADA' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                executar('Participante desligado', () =>
                                  api(`/api/apps/cultura/matriculas/${m.id}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({ status: 'DESLIGADA' }),
                                  })
                                )
                              }
                            >
                              <X className="h-4 w-4 mr-1" /> Desligar
                            </Button>
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

        {/* -------------------------------------------------------- oficinas */}
        <TabsContent value="oficinas" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setNovaOficinaAberta(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova oficina
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {oficinas.map((o) => (
              <Card key={o.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-purple-600" />
                      {o.nome}
                    </span>
                    <Badge variant="outline">{CATEGORIA_LABEL[o.categoria] || o.categoria}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span>
                      <Users className="h-3 w-3 inline mr-1" />
                      {o.matriculados}
                      {o.vagas != null && ` / ${o.vagas}`} participante(s)
                    </span>
                    {o.instrutor && <span>Instrutor(a): {o.instrutor}</span>}
                    {o.atividade && <span>{o.atividade}</span>}
                    {o.espaco?.nome && (
                      <span>
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {o.espaco.nome}
                      </span>
                    )}
                  </div>
                  {o.diasHorarios && <p className="text-xs">{o.diasHorarios}</p>}
                  <Button size="sm" variant="outline" onClick={() => abrirChamada(o)}>
                    <CalendarCheck className="h-4 w-4 mr-1" /> Registrar frequência
                  </Button>
                </CardContent>
              </Card>
            ))}
            {oficinas.length === 0 && !loading && (
              <p className="text-gray-500 col-span-2 text-center py-8">
                Nenhuma oficina cadastrada — crie a primeira para matricular participantes
              </p>
            )}
          </div>
        </TabsContent>

        {/* -------------------------------------------------------- reservas */}
        <TabsContent value="reservas" className="space-y-4 mt-4">
          <div className="flex justify-between gap-4">
            <Select value={filtroStatusReserva} onValueChange={setFiltroStatusReserva}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas</SelectItem>
                {Object.entries(STATUS_RESERVA).map(([valor, cfg]) => (
                  <SelectItem key={valor} value={valor}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setReservaEdicao(null);
                setFormReserva({
                  espacoId: '',
                  solicitanteNome: '',
                  data: '',
                  horaInicio: '',
                  horaFim: '',
                  finalidade: '',
                });
                setNovaReservaAberta(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova reserva
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Reservas de espaços
                <Badge variant="secondary">{reservasFiltradas.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : reservasFiltradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma reserva encontrada</div>
              ) : (
                <div className="space-y-3">
                  {reservasFiltradas.map((r: any) => {
                    const badge = STATUS_RESERVA[r.status] || { label: r.status };
                    return (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {r.espaco?.nome || 'Espaço a definir'}
                            {r.data && (
                              <span className="text-sm text-gray-500 font-normal ml-2">
                                {dataBR(r.data)}
                                {r.horaInicio && ` ${r.horaInicio}–${r.horaFim || '?'}`}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {r.solicitanteNome || 'Solicitante não informado'}
                            {r.finalidade && ` | ${r.finalidade}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <Badge className={badge.className}>{badge.label}</Badge>
                          {r.status === 'SOLICITADA' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() =>
                                  executar('Reserva confirmada', () =>
                                    api(`/api/apps/cultura/reservas/${r.id}/confirmar`, {
                                      method: 'POST',
                                      body: JSON.stringify({}),
                                    })
                                  )
                                }
                              >
                                <Check className="h-4 w-4 mr-1" /> Confirmar
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => abrirEdicaoReserva(r)}>
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  executar('Reserva recusada', () =>
                                    api(`/api/apps/cultura/reservas/${r.id}/recusar`, {
                                      method: 'POST',
                                      body: JSON.stringify({}),
                                    })
                                  )
                                }
                              >
                                <X className="h-4 w-4 mr-1" /> Recusar
                              </Button>
                            </>
                          )}
                          {r.status === 'CONFIRMADA' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                executar('Reserva cancelada', () =>
                                  api(`/api/apps/cultura/reservas/${r.id}/cancelar`, {
                                    method: 'POST',
                                    body: JSON.stringify({}),
                                  })
                                )
                              }
                            >
                              <X className="h-4 w-4 mr-1" /> Cancelar
                            </Button>
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

        {/* --------------------------------------------------------- editais */}
        <TabsContent value="editais" className="space-y-4 mt-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNovoEditalAberto(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo edital
            </Button>
            <Button onClick={() => setNovoProjetoAberto(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo projeto
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editais.map((e) => (
              <Card key={e.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <ScrollText className="h-4 w-4 text-purple-600" />
                      {e.nome}
                    </span>
                    <Badge variant="outline">{STATUS_EDITAL[e.status] || e.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    {e.categoria && <span>{e.categoria}</span>}
                    <span>{e.totalProjetos ?? 0} projeto(s)</span>
                  </div>
                  {e.descricao && <p className="text-xs">{e.descricao}</p>}
                </CardContent>
              </Card>
            ))}
            {editais.length === 0 && !loading && (
              <p className="text-gray-500 col-span-2 text-center py-8">Nenhum edital cadastrado</p>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Projetos e solicitações de apoio
                <Badge variant="secondary">{projetosFiltrados.length}</Badge>
                <div className="ml-auto">
                  <Select value={filtroStatusProjeto} onValueChange={setFiltroStatusProjeto}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATIVOS">Ativos</SelectItem>
                      <SelectItem value="TODOS">Todos</SelectItem>
                      {Object.entries(STATUS_PROJETO).map(([valor, cfg]) => (
                        <SelectItem key={valor} value={valor}>
                          {cfg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projetosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum projeto encontrado</div>
              ) : (
                <div className="space-y-3">
                  {projetosFiltrados.map((p: any) => {
                    const badge = STATUS_PROJETO[p.status] || { label: p.status };
                    return (
                      <div key={p.id} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium">{p.titulo || 'Sem título'}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {p.proponente || 'Proponente não informado'}
                              {p.edital?.nome && ` | ${p.edital.nome}`}
                              {p.categoria && ` | ${p.categoria}`}
                              {p.valorSolicitado != null &&
                                ` | R$ ${Number(p.valorSolicitado).toLocaleString('pt-BR')}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            <Badge className={badge.className}>{badge.label}</Badge>
                            {p.status === 'RECEBIDO' && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  executar('Análise iniciada', () =>
                                    api(`/api/apps/cultura/projetos/${p.id}/iniciar-analise`, {
                                      method: 'POST',
                                      body: JSON.stringify({}),
                                    })
                                  )
                                }
                              >
                                <Play className="h-4 w-4 mr-1" /> Analisar
                              </Button>
                            )}
                            {p.status === 'EM_ANALISE' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setProjetoParecer(p)}
                                >
                                  <MessageSquarePlus className="h-4 w-4 mr-1" /> Parecer
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    setProjetoAprovar(p);
                                    setEditalAprovacao(p.editalId || '');
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-1" /> Aprovar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setProjetoReprovar(p)}
                                >
                                  <X className="h-4 w-4 mr-1" /> Reprovar
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                        {Array.isArray(p.pareceres) && p.pareceres.length > 0 && (
                          <div className="mt-2 pl-3 border-l-2 border-purple-200 space-y-1">
                            {p.pareceres.slice(0, 3).map((par: any) => (
                              <p key={par.id} className="text-xs text-gray-500">
                                <span className="font-medium">
                                  {par.autorNome || 'Parecer'}
                                  {par.recomendacao && ` (${par.recomendacao})`}:
                                </span>{' '}
                                {par.texto}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ----------------------------------------------------- empréstimos */}
        <TabsContent value="emprestimos" className="space-y-4 mt-4">
          <div className="flex justify-between gap-4">
            <Select value={filtroStatusEmprestimo} onValueChange={setFiltroStatusEmprestimo}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVOS">Ativos</SelectItem>
                <SelectItem value="TODOS">Todos</SelectItem>
                {Object.entries(STATUS_EMPRESTIMO).map(([valor, cfg]) => (
                  <SelectItem key={valor} value={valor}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setNovoEmprestimoAberto(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo empréstimo
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Empréstimos de equipamento
                <Badge variant="secondary">{emprestimosFiltrados.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : emprestimosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum empréstimo encontrado</div>
              ) : (
                <div className="space-y-3">
                  {emprestimosFiltrados.map((e: any) => {
                    const badge = STATUS_EMPRESTIMO[e.status] || { label: e.status };
                    return (
                      <div
                        key={e.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {e.item || 'Equipamento'}
                            {e.quantidade > 1 && (
                              <span className="text-sm text-gray-500 font-normal"> ×{e.quantidade}</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {e.solicitanteNome || 'Solicitante não informado'}
                            {e.telefone && ` | ${e.telefone}`}
                            {e.dataPrevistaDevolucao &&
                              ` | Devolver até ${dataBR(e.dataPrevistaDevolucao)}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={badge.className}>{badge.label}</Badge>
                          {e.status === 'SOLICITADO' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setEmprestimoEntregar(e);
                                  setDataDevolucaoPrevista(
                                    e.dataPrevistaDevolucao
                                      ? String(e.dataPrevistaDevolucao).slice(0, 10)
                                      : ''
                                  );
                                }}
                              >
                                <Check className="h-4 w-4 mr-1" /> Emprestar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  executar('Solicitação cancelada', () =>
                                    api(`/api/apps/cultura/emprestimos/${e.id}/cancelar`, {
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
                          {e.status === 'EMPRESTADO' && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() =>
                                executar('Devolução registrada', () =>
                                  api(`/api/apps/cultura/emprestimos/${e.id}/devolver`, {
                                    method: 'POST',
                                    body: JSON.stringify({}),
                                  })
                                )
                              }
                            >
                              <Undo2 className="h-4 w-4 mr-1" /> Devolver
                            </Button>
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
      </Tabs>

      {/* Dialog nova oficina */}
      <Dialog open={novaOficinaAberta} onOpenChange={setNovaOficinaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova oficina</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex.: Violão popular — Noite"
                  value={novaOficina.nome}
                  onChange={(e) => setNovaOficina({ ...novaOficina, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Categoria *</Label>
                <Select
                  value={novaOficina.categoria}
                  onValueChange={(v) => setNovaOficina({ ...novaOficina, categoria: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {CATEGORIA_LABEL[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Atividade</Label>
                <Input
                  placeholder="Ex.: Violão, Ballet, Teatro de rua..."
                  value={novaOficina.atividade}
                  onChange={(e) => setNovaOficina({ ...novaOficina, atividade: e.target.value })}
                />
              </div>
              <div>
                <Label>Instrutor(a)</Label>
                <Input
                  value={novaOficina.instrutor}
                  onChange={(e) => setNovaOficina({ ...novaOficina, instrutor: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Espaço</Label>
                <Select
                  value={novaOficina.espacoId}
                  onValueChange={(v) => setNovaOficina({ ...novaOficina, espacoId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {espacos.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Vagas</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Sem limite"
                  value={novaOficina.vagas}
                  onChange={(e) => setNovaOficina({ ...novaOficina, vagas: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Dias e horários</Label>
              <Input
                placeholder="Ex.: Seg/Qua 19h–21h"
                value={novaOficina.diasHorarios}
                onChange={(e) => setNovaOficina({ ...novaOficina, diasHorarios: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaOficinaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarOficina} disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar oficina'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog nova inscrição em oficina */}
      <Dialog open={novaMatriculaAberta} onOpenChange={setNovaMatriculaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova inscrição em oficina</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome do participante *</Label>
                <Input
                  value={novaMatricula.nome}
                  onChange={(e) => setNovaMatricula({ ...novaMatricula, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Data de nascimento</Label>
                <Input
                  type="date"
                  value={novaMatricula.dataNascimento}
                  onChange={(e) =>
                    setNovaMatricula({ ...novaMatricula, dataNascimento: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Responsável (se menor)</Label>
                <Input
                  value={novaMatricula.responsavelNome}
                  onChange={(e) =>
                    setNovaMatricula({ ...novaMatricula, responsavelNome: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={novaMatricula.telefone}
                  onChange={(e) => setNovaMatricula({ ...novaMatricula, telefone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Atividade pretendida</Label>
              <Input
                placeholder="Ex.: Violão, Dança, Teatro..."
                value={novaMatricula.atividadePretendida}
                onChange={(e) =>
                  setNovaMatricula({ ...novaMatricula, atividadePretendida: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={novaMatricula.observacoes}
                onChange={(e) => setNovaMatricula({ ...novaMatricula, observacoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNovaMatriculaAberta(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button onClick={criarMatricula} disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar inscrição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog matricular na oficina */}
      <Dialog open={!!matriculaVincular} onOpenChange={(open) => !open && setMatriculaVincular(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Matricular — {matriculaVincular?.nome || 'participante'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Oficina *</Label>
              <Select value={oficinaEscolhida} onValueChange={setOficinaEscolhida}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {oficinas
                    .filter((o) => o.isActive !== false)
                    .map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.nome} ({o.matriculados}
                        {o.vagas != null ? `/${o.vagas}` : ''})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500">
              Se a oficina estiver lotada, a inscrição entra automaticamente na lista de espera.
              Com vaga, o protocolo de origem é concluído.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatriculaVincular(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={matricularNaOficina} disabled={salvando}>
              {salvando ? 'Matriculando...' : 'Matricular'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog frequência */}
      <Dialog open={!!oficinaChamada} onOpenChange={(open) => !open && setOficinaChamada(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Frequência — {oficinaChamada?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data da aula</Label>
              <Input
                type="date"
                value={chamada.data}
                onChange={(e) => setChamada({ ...chamada, data: e.target.value })}
              />
            </div>
            <div>
              <Label>Presentes</Label>
              {alunosChamada.length === 0 ? (
                <p className="text-xs text-gray-500 mt-1">
                  Nenhum participante matriculado nesta oficina.
                </p>
              ) : (
                <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
                  {alunosChamada.map((a: any) => {
                    const marcado = chamada.presentes.includes(a.id);
                    return (
                      <label key={a.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={(e) =>
                            setChamada({
                              ...chamada,
                              presentes: e.target.checked
                                ? [...chamada.presentes, a.id]
                                : chamada.presentes.filter((x) => x !== a.id),
                            })
                          }
                        />
                        <span>{a.nome || 'Sem nome'}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Registrar novamente no mesmo dia substitui a chamada anterior.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOficinaChamada(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvarChamada} disabled={salvando || alunosChamada.length === 0}>
              {salvando ? 'Salvando...' : 'Salvar chamada'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog nova reserva / editar */}
      <Dialog
        open={novaReservaAberta}
        onOpenChange={(open) => {
          setNovaReservaAberta(open);
          if (!open) setReservaEdicao(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{reservaEdicao ? 'Editar reserva' : 'Nova reserva'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Espaço *</Label>
                <Select
                  value={formReserva.espacoId}
                  onValueChange={(v) => setFormReserva({ ...formReserva, espacoId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {espacos.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Solicitante</Label>
                <Input
                  value={formReserva.solicitanteNome}
                  onChange={(e) =>
                    setFormReserva({ ...formReserva, solicitanteNome: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={formReserva.data}
                  onChange={(e) => setFormReserva({ ...formReserva, data: e.target.value })}
                />
              </div>
              <div>
                <Label>Início *</Label>
                <Input
                  type="time"
                  value={formReserva.horaInicio}
                  onChange={(e) => setFormReserva({ ...formReserva, horaInicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Fim *</Label>
                <Input
                  type="time"
                  value={formReserva.horaFim}
                  onChange={(e) => setFormReserva({ ...formReserva, horaFim: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Finalidade</Label>
              <Input
                placeholder="Ex.: Ensaio do grupo, sarau, exposição..."
                value={formReserva.finalidade}
                onChange={(e) => setFormReserva({ ...formReserva, finalidade: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-500">
              A confirmação verifica conflito com reservas já confirmadas no mesmo espaço, dia e
              horário — inclusive as do app de Esportes.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaReservaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvarReserva} disabled={salvando}>
              {salvando ? 'Salvando...' : reservaEdicao ? 'Salvar' : 'Criar reserva'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog novo edital */}
      <Dialog open={novoEditalAberto} onOpenChange={setNovoEditalAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo edital</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex.: Edital de Fomento 2026"
                  value={novoEdital.nome}
                  onChange={(e) => setNovoEdital({ ...novoEdital, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input
                  placeholder="Ex.: Fomento, Prêmio..."
                  value={novoEdital.categoria}
                  onChange={(e) => setNovoEdital({ ...novoEdital, categoria: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={novoEdital.descricao}
                onChange={(e) => setNovoEdital({ ...novoEdital, descricao: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoEditalAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarEdital} disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar edital'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog novo projeto */}
      <Dialog open={novoProjetoAberto} onOpenChange={setNovoProjetoAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo projeto / apoio cultural</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Edital</Label>
              <Select
                value={novoProjeto.editalId}
                onValueChange={(v) => setNovoProjeto({ ...novoProjeto, editalId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional — pode vincular depois)" />
                </SelectTrigger>
                <SelectContent>
                  {editais.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Título *</Label>
                <Input
                  value={novoProjeto.titulo}
                  onChange={(e) => setNovoProjeto({ ...novoProjeto, titulo: e.target.value })}
                />
              </div>
              <div>
                <Label>Proponente</Label>
                <Input
                  value={novoProjeto.proponente}
                  onChange={(e) => setNovoProjeto({ ...novoProjeto, proponente: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Telefone</Label>
                <Input
                  value={novoProjeto.telefone}
                  onChange={(e) => setNovoProjeto({ ...novoProjeto, telefone: e.target.value })}
                />
              </div>
              <div>
                <Label>Linguagem</Label>
                <Input
                  placeholder="Ex.: Música"
                  value={novoProjeto.categoria}
                  onChange={(e) => setNovoProjeto({ ...novoProjeto, categoria: e.target.value })}
                />
              </div>
              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={novoProjeto.valorSolicitado}
                  onChange={(e) =>
                    setNovoProjeto({ ...novoProjeto, valorSolicitado: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={novoProjeto.descricao}
                onChange={(e) => setNovoProjeto({ ...novoProjeto, descricao: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNovoProjetoAberto(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button onClick={criarProjeto} disabled={salvando}>
              {salvando ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog parecer */}
      <Dialog open={!!projetoParecer} onOpenChange={(open) => !open && setProjetoParecer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Parecer — {projetoParecer?.titulo || 'projeto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Recomendação</Label>
              <Select
                value={parecer.recomendacao}
                onValueChange={(v) => setParecer({ ...parecer, recomendacao: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APROVAR">Aprovar</SelectItem>
                  <SelectItem value="REPROVAR">Reprovar</SelectItem>
                  <SelectItem value="AJUSTES">Solicitar ajustes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Parecer *</Label>
              <Textarea
                value={parecer.texto}
                onChange={(e) => setParecer({ ...parecer, texto: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjetoParecer(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvarParecer} disabled={salvando || !parecer.texto}>
              {salvando ? 'Salvando...' : 'Registrar parecer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog aprovar projeto */}
      <Dialog open={!!projetoAprovar} onOpenChange={(open) => !open && setProjetoAprovar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aprovar — {projetoAprovar?.titulo || 'projeto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Edital</Label>
              <Select value={editalAprovacao} onValueChange={setEditalAprovacao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {editais.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {projetoAprovar?.protocolId && (
              <p className="text-xs text-gray-500">
                O protocolo de origem será concluído automaticamente.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjetoAprovar(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={aprovarProjeto} disabled={salvando}>
              {salvando ? 'Aprovando...' : 'Aprovar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog reprovar projeto */}
      <Dialog open={!!projetoReprovar} onOpenChange={(open) => !open && setProjetoReprovar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reprovar — {projetoReprovar?.titulo || 'projeto'}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Motivo</Label>
            <Textarea
              value={motivoReprovacao}
              onChange={(e) => setMotivoReprovacao(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjetoReprovar(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={reprovarProjeto}
              disabled={salvando || !motivoReprovacao}
            >
              {salvando ? 'Reprovando...' : 'Reprovar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog novo empréstimo */}
      <Dialog open={novoEmprestimoAberto} onOpenChange={setNovoEmprestimoAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo empréstimo de equipamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Equipamento *</Label>
                <Input
                  placeholder="Ex.: Caixa de som, projetor..."
                  value={novoEmprestimo.item}
                  onChange={(e) => setNovoEmprestimo({ ...novoEmprestimo, item: e.target.value })}
                />
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min={1}
                  value={novoEmprestimo.quantidade}
                  onChange={(e) =>
                    setNovoEmprestimo({ ...novoEmprestimo, quantidade: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Solicitante</Label>
                <Input
                  value={novoEmprestimo.solicitanteNome}
                  onChange={(e) =>
                    setNovoEmprestimo({ ...novoEmprestimo, solicitanteNome: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={novoEmprestimo.telefone}
                  onChange={(e) =>
                    setNovoEmprestimo({ ...novoEmprestimo, telefone: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Devolução prevista</Label>
              <Input
                type="date"
                value={novoEmprestimo.dataPrevistaDevolucao}
                onChange={(e) =>
                  setNovoEmprestimo({ ...novoEmprestimo, dataPrevistaDevolucao: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNovoEmprestimoAberto(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button onClick={criarEmprestimo} disabled={salvando}>
              {salvando ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog registrar entrega do equipamento */}
      <Dialog
        open={!!emprestimoEntregar}
        onOpenChange={(open) => !open && setEmprestimoEntregar(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Emprestar — {emprestimoEntregar?.item || 'equipamento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Devolução prevista</Label>
              <Input
                type="date"
                value={dataDevolucaoPrevista}
                onChange={(e) => setDataDevolucaoPrevista(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmprestimoEntregar(null)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button onClick={registrarEntrega} disabled={salvando}>
              {salvando ? 'Registrando...' : 'Confirmar entrega'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
