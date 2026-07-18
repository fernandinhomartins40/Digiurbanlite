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
  Trophy,
  Plus,
  Users,
  CalendarCheck,
  MapPin,
  Medal,
  Dumbbell,
  Check,
  X,
  ClipboardList,
  UserPlus,
  Undo2,
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

const STATUS_INSCRICAO: Record<string, { label: string; className?: string }> = {
  INSCRITA: { label: 'Inscrita', className: 'bg-yellow-600' },
  CONFIRMADA: { label: 'Confirmada', className: 'bg-green-600' },
  CANCELADA: { label: 'Cancelada', className: 'bg-gray-600' },
};

const STATUS_EMPRESTIMO: Record<string, { label: string; className?: string }> = {
  SOLICITADO: { label: 'Solicitado', className: 'bg-yellow-600' },
  EMPRESTADO: { label: 'Emprestado', className: 'bg-blue-600' },
  DEVOLVIDO: { label: 'Devolvido', className: 'bg-green-600' },
  CANCELADO: { label: 'Cancelado', className: 'bg-gray-600' },
};

const STATUS_COMPETICAO: Record<string, string> = {
  INSCRICOES_ABERTAS: 'Inscrições abertas',
  EM_ANDAMENTO: 'Em andamento',
  ENCERRADA: 'Encerrada',
  CANCELADA: 'Cancelada',
};

const MODALIDADES = [
  'FUTEBOL',
  'BASQUETE',
  'VOLEI',
  'NATACAO',
  'JUDO',
  'CAPOEIRA',
  'GINASTICA',
  'OUTRA',
];

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

export default function EsportesAppPage() {
  const { toast } = useToast();
  const [stats, setStats] = useState<any>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [matriculas, setMatriculas] = useState<any[]>([]);
  const [espacos, setEspacos] = useState<any[]>([]);
  const [reservas, setReservas] = useState<any[]>([]);
  const [competicoes, setCompeticoes] = useState<any[]>([]);
  const [inscricoes, setInscricoes] = useState<any[]>([]);
  const [emprestimos, setEmprestimos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // filtros
  const [buscaMatricula, setBuscaMatricula] = useState('');
  const [filtroTurma, setFiltroTurma] = useState('TODAS');
  const [filtroStatusMatricula, setFiltroStatusMatricula] = useState('ATIVAS');
  const [filtroStatusReserva, setFiltroStatusReserva] = useState('SOLICITADA');
  const [filtroStatusEmprestimo, setFiltroStatusEmprestimo] = useState('ATIVOS');

  // dialogs
  const [novaTurmaAberta, setNovaTurmaAberta] = useState(false);
  const [novaTurma, setNovaTurma] = useState({
    nome: '',
    modalidade: 'FUTEBOL',
    faixaEtaria: '',
    professor: '',
    espacoId: '',
    diasHorarios: '',
    vagas: '',
  });

  const [novaMatriculaAberta, setNovaMatriculaAberta] = useState(false);
  const [novaMatricula, setNovaMatricula] = useState({
    nomeAluno: '',
    dataNascimento: '',
    responsavelNome: '',
    telefone: '',
    modalidadePretendida: '',
    observacoes: '',
  });

  const [matriculaVincular, setMatriculaVincular] = useState<any>(null);
  const [turmaEscolhida, setTurmaEscolhida] = useState('');

  const [turmaChamada, setTurmaChamada] = useState<any>(null);
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

  const [novaCompeticaoAberta, setNovaCompeticaoAberta] = useState(false);
  const [novaCompeticao, setNovaCompeticao] = useState({
    nome: '',
    modalidade: '',
    local: '',
    descricao: '',
  });

  const [inscricaoConfirmar, setInscricaoConfirmar] = useState<any>(null);
  const [competicaoEscolhida, setCompeticaoEscolhida] = useState('');

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
      const [statsData, turmasData, matriculasData, espacosData, reservasData, competicoesData, inscricoesData, emprestimosData] =
        await Promise.all([
          api('/api/apps/esportes/stats').catch(() => null),
          api('/api/apps/esportes/turmas').catch(() => []),
          api('/api/apps/esportes/matriculas').catch(() => []),
          api('/api/apps/esportes/espacos').catch(() => []),
          api('/api/apps/esportes/reservas').catch(() => []),
          api('/api/apps/esportes/competicoes').catch(() => []),
          api('/api/apps/esportes/inscricoes-competicao').catch(() => []),
          api('/api/apps/esportes/emprestimos').catch(() => []),
        ]);
      setStats(statsData);
      setTurmas(Array.isArray(turmasData) ? turmasData : []);
      setMatriculas(Array.isArray(matriculasData) ? matriculasData : []);
      setEspacos(Array.isArray(espacosData) ? espacosData : []);
      setReservas(Array.isArray(reservasData) ? reservasData : []);
      setCompeticoes(Array.isArray(competicoesData) ? competicoesData : []);
      setInscricoes(Array.isArray(inscricoesData) ? inscricoesData : []);
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
    if (filtroTurma === 'SEM_TURMA') lista = lista.filter((m) => !m.turmaId);
    else if (filtroTurma !== 'TODAS') lista = lista.filter((m) => m.turmaId === filtroTurma);
    if (buscaMatricula) {
      const termo = buscaMatricula.toLowerCase();
      lista = lista.filter(
        (m) =>
          m.nomeAluno?.toLowerCase().includes(termo) ||
          m.responsavelNome?.toLowerCase().includes(termo)
      );
    }
    return lista;
  }, [matriculas, filtroStatusMatricula, filtroTurma, buscaMatricula]);

  const reservasFiltradas = useMemo(() => {
    if (filtroStatusReserva === 'TODAS') return reservas;
    return reservas.filter((r) => r.status === filtroStatusReserva);
  }, [reservas, filtroStatusReserva]);

  const emprestimosFiltrados = useMemo(() => {
    if (filtroStatusEmprestimo === 'TODOS') return emprestimos;
    if (filtroStatusEmprestimo === 'ATIVOS') {
      return emprestimos.filter((e) => ['SOLICITADO', 'EMPRESTADO'].includes(e.status));
    }
    return emprestimos.filter((e) => e.status === filtroStatusEmprestimo);
  }, [emprestimos, filtroStatusEmprestimo]);

  const criarTurma = () =>
    executar('Turma criada', async () => {
      await api('/api/apps/esportes/turmas', {
        method: 'POST',
        body: JSON.stringify({
          ...novaTurma,
          espacoId: novaTurma.espacoId || undefined,
          vagas: novaTurma.vagas ? Number(novaTurma.vagas) : undefined,
        }),
      });
      setNovaTurmaAberta(false);
      setNovaTurma({ ...novaTurma, nome: '', faixaEtaria: '', professor: '', diasHorarios: '', vagas: '' });
    });

  const criarMatricula = () =>
    executar('Inscrição criada', async () => {
      if (!novaMatricula.nomeAluno) throw new Error('Informe o nome do aluno');
      await api('/api/apps/esportes/matriculas', {
        method: 'POST',
        body: JSON.stringify({
          ...novaMatricula,
          dataNascimento: novaMatricula.dataNascimento || undefined,
          modalidadePretendida: novaMatricula.modalidadePretendida || undefined,
        }),
      });
      setNovaMatriculaAberta(false);
      setNovaMatricula({
        nomeAluno: '',
        dataNascimento: '',
        responsavelNome: '',
        telefone: '',
        modalidadePretendida: '',
        observacoes: '',
      });
    });

  const matricularNaTurma = () =>
    executar('Matrícula efetivada', async () => {
      if (!turmaEscolhida) throw new Error('Selecione a turma');
      await api(`/api/apps/esportes/matriculas/${matriculaVincular.id}/matricular`, {
        method: 'POST',
        body: JSON.stringify({ turmaId: turmaEscolhida }),
      });
      setMatriculaVincular(null);
      setTurmaEscolhida('');
    });

  const abrirChamada = async (turma: any) => {
    setTurmaChamada(turma);
    setChamada({ data: new Date().toISOString().slice(0, 10), presentes: [] });
    try {
      const alunos = await api(
        `/api/apps/esportes/matriculas?turmaId=${turma.id}&status=MATRICULADA`
      );
      setAlunosChamada(Array.isArray(alunos) ? alunos : []);
    } catch {
      setAlunosChamada([]);
    }
  };

  const salvarChamada = () =>
    executar('Frequência registrada', async () => {
      await api(`/api/apps/esportes/turmas/${turmaChamada.id}/frequencias`, {
        method: 'POST',
        body: JSON.stringify(chamada),
      });
      setTurmaChamada(null);
    });

  const salvarReserva = () =>
    executar(reservaEdicao ? 'Reserva atualizada' : 'Reserva criada', async () => {
      const body = JSON.stringify({
        ...formReserva,
        espacoId: formReserva.espacoId || undefined,
        data: formReserva.data || undefined,
      });
      if (reservaEdicao) {
        await api(`/api/apps/esportes/reservas/${reservaEdicao.id}`, { method: 'PUT', body });
      } else {
        await api('/api/apps/esportes/reservas', { method: 'POST', body });
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

  const criarCompeticao = () =>
    executar('Competição criada', async () => {
      await api('/api/apps/esportes/competicoes', {
        method: 'POST',
        body: JSON.stringify(novaCompeticao),
      });
      setNovaCompeticaoAberta(false);
      setNovaCompeticao({ nome: '', modalidade: '', local: '', descricao: '' });
    });

  const confirmarInscricao = () =>
    executar('Inscrição confirmada', async () => {
      await api(`/api/apps/esportes/inscricoes-competicao/${inscricaoConfirmar.id}/confirmar`, {
        method: 'POST',
        body: JSON.stringify({ competicaoId: competicaoEscolhida || undefined }),
      });
      setInscricaoConfirmar(null);
      setCompeticaoEscolhida('');
    });

  const criarEmprestimo = () =>
    executar('Solicitação registrada', async () => {
      if (!novoEmprestimo.item) throw new Error('Informe o material');
      await api('/api/apps/esportes/emprestimos', {
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
    executar('Material emprestado', async () => {
      await api(`/api/apps/esportes/emprestimos/${emprestimoEntregar.id}/emprestar`, {
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
          <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Trophy className="h-7 w-7 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Escolinhas & Espaços Esportivos</h1>
            <p className="text-gray-500">
              Turmas com vagas e frequência, reservas de espaços sem conflito, competições e
              empréstimo de material
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alunos matriculados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.alunosMatriculados ?? 0}</div>
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
            <CardTitle className="text-sm font-medium">Materiais emprestados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {stats?.materiaisEmprestados ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="matriculas">
        <TabsList>
          <TabsTrigger value="matriculas">Matrículas</TabsTrigger>
          <TabsTrigger value="turmas">Turmas ({turmas.length})</TabsTrigger>
          <TabsTrigger value="reservas">Reservas</TabsTrigger>
          <TabsTrigger value="competicoes">Competições</TabsTrigger>
          <TabsTrigger value="emprestimos">Empréstimos</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------ matrículas */}
        <TabsContent value="matriculas" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <Input
                  placeholder="Buscar por aluno ou responsável..."
                  value={buscaMatricula}
                  onChange={(e) => setBuscaMatricula(e.target.value)}
                  className="flex-1"
                />
                <Select value={filtroTurma} onValueChange={setFiltroTurma}>
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Turma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todas as turmas</SelectItem>
                    <SelectItem value="SEM_TURMA">Sem turma</SelectItem>
                    {turmas.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome}
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
                          <div className="font-medium">{m.nomeAluno || 'Sem nome'}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {m.turma?.nome ||
                              (m.modalidadePretendida
                                ? `Pretende: ${m.modalidadePretendida}`
                                : 'Sem turma')}
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
                                setTurmaEscolhida(m.turmaId || '');
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
                                executar('Aluno desligado', () =>
                                  api(`/api/apps/esportes/matriculas/${m.id}`, {
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

        {/* ---------------------------------------------------------- turmas */}
        <TabsContent value="turmas" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setNovaTurmaAberta(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova turma
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {turmas.map((t) => (
              <Card key={t.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {t.nome}
                    <Badge variant="outline">{t.modalidade}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    <span>
                      <Users className="h-3 w-3 inline mr-1" />
                      {t.matriculados}
                      {t.vagas != null && ` / ${t.vagas}`} aluno(s)
                    </span>
                    {t.professor && <span>Prof. {t.professor}</span>}
                    {t.faixaEtaria && <span>{t.faixaEtaria}</span>}
                    {t.espaco?.nome && (
                      <span>
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {t.espaco.nome}
                      </span>
                    )}
                  </div>
                  {t.diasHorarios && <p className="text-xs">{t.diasHorarios}</p>}
                  <Button size="sm" variant="outline" onClick={() => abrirChamada(t)}>
                    <CalendarCheck className="h-4 w-4 mr-1" /> Registrar frequência
                  </Button>
                </CardContent>
              </Card>
            ))}
            {turmas.length === 0 && !loading && (
              <p className="text-gray-500 col-span-2 text-center py-8">
                Nenhuma turma cadastrada — crie a primeira para matricular alunos
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
                                    api(`/api/apps/esportes/reservas/${r.id}/confirmar`, {
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
                                    api(`/api/apps/esportes/reservas/${r.id}/recusar`, {
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
                                  api(`/api/apps/esportes/reservas/${r.id}/cancelar`, {
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

        {/* ----------------------------------------------------- competições */}
        <TabsContent value="competicoes" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button onClick={() => setNovaCompeticaoAberta(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova competição
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competicoes.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Medal className="h-4 w-4 text-emerald-600" />
                      {c.nome}
                    </span>
                    <Badge variant="outline">{STATUS_COMPETICAO[c.status] || c.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                    {c.modalidade && <span>{c.modalidade}</span>}
                    {c.local && <span>{c.local}</span>}
                    <span>{c.totalInscricoes ?? 0} inscrição(ões)</span>
                  </div>
                  {c.descricao && <p className="text-xs">{c.descricao}</p>}
                </CardContent>
              </Card>
            ))}
            {competicoes.length === 0 && !loading && (
              <p className="text-gray-500 col-span-2 text-center py-8">
                Nenhuma competição cadastrada
              </p>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Inscrições em competições
                <Badge variant="secondary">{inscricoes.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inscricoes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma inscrição</div>
              ) : (
                <div className="space-y-3">
                  {inscricoes.map((i: any) => {
                    const badge = STATUS_INSCRICAO[i.status] || { label: i.status };
                    return (
                      <div
                        key={i.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{i.participante || 'Sem nome'}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {i.competicao?.nome || 'Sem competição vinculada'}
                            {i.categoria && ` | ${i.categoria}`}
                            {i.telefone && ` | ${i.telefone}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={badge.className}>{badge.label}</Badge>
                          {i.status === 'INSCRITA' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setInscricaoConfirmar(i);
                                  setCompeticaoEscolhida(i.competicaoId || '');
                                }}
                              >
                                <Check className="h-4 w-4 mr-1" /> Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  executar('Inscrição cancelada', () =>
                                    api(
                                      `/api/apps/esportes/inscricoes-competicao/${i.id}/cancelar`,
                                      { method: 'POST', body: JSON.stringify({}) }
                                    )
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
                <Dumbbell className="h-5 w-5" />
                Empréstimos de material
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
                            {e.item || 'Material'}
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
                                    api(`/api/apps/esportes/emprestimos/${e.id}/cancelar`, {
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
                                  api(`/api/apps/esportes/emprestimos/${e.id}/devolver`, {
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

      {/* Dialog nova turma */}
      <Dialog open={novaTurmaAberta} onOpenChange={setNovaTurmaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova turma</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex.: Futebol Sub-12 — Tarde"
                  value={novaTurma.nome}
                  onChange={(e) => setNovaTurma({ ...novaTurma, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Modalidade *</Label>
                <Select
                  value={novaTurma.modalidade}
                  onValueChange={(v) => setNovaTurma({ ...novaTurma, modalidade: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODALIDADES.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Professor</Label>
                <Input
                  value={novaTurma.professor}
                  onChange={(e) => setNovaTurma({ ...novaTurma, professor: e.target.value })}
                />
              </div>
              <div>
                <Label>Faixa etária</Label>
                <Input
                  placeholder="Ex.: 8 a 12 anos"
                  value={novaTurma.faixaEtaria}
                  onChange={(e) => setNovaTurma({ ...novaTurma, faixaEtaria: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Espaço</Label>
                <Select
                  value={novaTurma.espacoId}
                  onValueChange={(v) => setNovaTurma({ ...novaTurma, espacoId: v })}
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
                  value={novaTurma.vagas}
                  onChange={(e) => setNovaTurma({ ...novaTurma, vagas: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Dias e horários</Label>
              <Input
                placeholder="Ex.: Ter/Qui 14h–15h30"
                value={novaTurma.diasHorarios}
                onChange={(e) => setNovaTurma({ ...novaTurma, diasHorarios: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaTurmaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarTurma} disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar turma'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog nova inscrição de escolinha */}
      <Dialog open={novaMatriculaAberta} onOpenChange={setNovaMatriculaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova inscrição em escolinha</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome do aluno *</Label>
                <Input
                  value={novaMatricula.nomeAluno}
                  onChange={(e) => setNovaMatricula({ ...novaMatricula, nomeAluno: e.target.value })}
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
                <Label>Responsável</Label>
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
              <Label>Modalidade pretendida</Label>
              <Select
                value={novaMatricula.modalidadePretendida}
                onValueChange={(v) =>
                  setNovaMatricula({ ...novaMatricula, modalidadePretendida: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {MODALIDADES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Dialog matricular na turma */}
      <Dialog open={!!matriculaVincular} onOpenChange={(open) => !open && setMatriculaVincular(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Matricular — {matriculaVincular?.nomeAluno || 'aluno'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Turma *</Label>
              <Select value={turmaEscolhida} onValueChange={setTurmaEscolhida}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {turmas
                    .filter((t) => t.isActive !== false)
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome} ({t.matriculados}
                        {t.vagas != null ? `/${t.vagas}` : ''})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500">
              Se a turma estiver lotada, a inscrição entra automaticamente na lista de espera. Com
              vaga, o protocolo de origem é concluído.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMatriculaVincular(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={matricularNaTurma} disabled={salvando}>
              {salvando ? 'Matriculando...' : 'Matricular'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog frequência */}
      <Dialog open={!!turmaChamada} onOpenChange={(open) => !open && setTurmaChamada(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Frequência — {turmaChamada?.nome}</DialogTitle>
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
                <p className="text-xs text-gray-500 mt-1">Nenhum aluno matriculado nesta turma.</p>
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
                        <span>{a.nomeAluno || 'Sem nome'}</span>
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
            <Button variant="outline" onClick={() => setTurmaChamada(null)} disabled={salvando}>
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
                placeholder="Ex.: Treino da comunidade, evento escolar..."
                value={formReserva.finalidade}
                onChange={(e) => setFormReserva({ ...formReserva, finalidade: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-500">
              A confirmação verifica conflito com reservas já confirmadas no mesmo espaço, dia e
              horário.
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

      {/* Dialog nova competição */}
      <Dialog open={novaCompeticaoAberta} onOpenChange={setNovaCompeticaoAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova competição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex.: Campeonato Municipal 2026"
                  value={novaCompeticao.nome}
                  onChange={(e) => setNovaCompeticao({ ...novaCompeticao, nome: e.target.value })}
                />
              </div>
              <div>
                <Label>Modalidade</Label>
                <Input
                  value={novaCompeticao.modalidade}
                  onChange={(e) =>
                    setNovaCompeticao({ ...novaCompeticao, modalidade: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Local</Label>
              <Input
                value={novaCompeticao.local}
                onChange={(e) => setNovaCompeticao({ ...novaCompeticao, local: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={novaCompeticao.descricao}
                onChange={(e) =>
                  setNovaCompeticao({ ...novaCompeticao, descricao: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNovaCompeticaoAberta(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button onClick={criarCompeticao} disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar competição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar inscrição em competição */}
      <Dialog
        open={!!inscricaoConfirmar}
        onOpenChange={(open) => !open && setInscricaoConfirmar(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Confirmar inscrição — {inscricaoConfirmar?.participante || 'participante'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Competição *</Label>
              <Select value={competicaoEscolhida} onValueChange={setCompeticaoEscolhida}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {competicoes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {inscricaoConfirmar?.protocolId && (
              <p className="text-xs text-gray-500">
                O protocolo de origem será concluído automaticamente.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInscricaoConfirmar(null)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button onClick={confirmarInscricao} disabled={salvando || !competicaoEscolhida}>
              {salvando ? 'Confirmando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog novo empréstimo */}
      <Dialog open={novoEmprestimoAberto} onOpenChange={setNovoEmprestimoAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo empréstimo de material</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Material *</Label>
                <Input
                  placeholder="Ex.: Bolas de futsal"
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

      {/* Dialog registrar entrega do material */}
      <Dialog
        open={!!emprestimoEntregar}
        onOpenChange={(open) => !open && setEmprestimoEntregar(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Emprestar — {emprestimoEntregar?.item || 'material'}</DialogTitle>
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
