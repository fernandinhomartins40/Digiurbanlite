'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Wrench,
  Plus,
  ClipboardList,
  CalendarCheck,
  CheckCircle,
  Users,
  Play,
  Check,
} from 'lucide-react';
import { MetricCard } from '@/components/agricultura/metric-card';
import { useAssistenciaTecnica, useProdutores } from '@/lib/hooks/use-agricultura-api';
import { useToast } from '@/components/ui/use-toast';

const STATUS_LABEL: Record<string, { label: string; className?: string }> = {
  ABERTA: { label: 'Aberta', className: 'bg-yellow-600' },
  AGENDADA: { label: 'Visita agendada', className: 'bg-blue-600' },
  EM_ATENDIMENTO: { label: 'Em atendimento', className: 'bg-indigo-600' },
  CONCLUIDA: { label: 'Concluída', className: 'bg-green-600' },
  CANCELADA: { label: 'Cancelada', className: 'bg-gray-600' },
};

export default function AssistenciaTecnicaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const {
    listTecnicos,
    createTecnico,
    listSolicitacoes,
    createSolicitacao,
    createVisita,
    iniciarVisita,
    concluirVisita,
    getStatistics,
    loading,
  } = useAssistenciaTecnica();
  const { listProdutores } = useProdutores();

  const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
  const [tecnicos, setTecnicos] = useState<any[]>([]);
  const [produtores, setProdutores] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [filtroStatus, setFiltroStatus] = useState('TODAS');

  // Nova solicitação
  const [solAberta, setSolAberta] = useState(false);
  const [novaSol, setNovaSol] = useState({
    produtorId: '',
    tipoAssistencia: '',
    descricao: '',
    prioridade: 'NORMAL',
  });

  // Agendar visita
  const [solVisita, setSolVisita] = useState<any>(null);
  const [visita, setVisita] = useState({ tecnicoId: '', dataAgendada: '' });

  // Concluir visita
  const [visitaConclusao, setVisitaConclusao] = useState<any>(null);
  const [conclusao, setConclusao] = useState({ diagnostico: '', recomendacoes: '' });

  // Novo técnico
  const [tecnicoAberto, setTecnicoAberto] = useState(false);
  const [novoTecnico, setNovoTecnico] = useState({
    nome: '',
    registro: '',
    especialidade: '',
    telefone: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [solData, tecData, prodData, statsData] = await Promise.all([
        listSolicitacoes(),
        listTecnicos(),
        listProdutores(),
        getStatistics(),
      ]);
      setSolicitacoes(solData);
      setTecnicos(tecData);
      setProdutores(prodData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const filtradas = useMemo(
    () =>
      filtroStatus === 'TODAS'
        ? solicitacoes
        : solicitacoes.filter((s) => s.status === filtroStatus),
    [solicitacoes, filtroStatus]
  );

  const totalPorStatus = (status: string) =>
    statistics?.porStatus?.find((s: any) => s.status === status)?.total || 0;

  const criarSolicitacao = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSolicitacao(novaSol);
      toast({ title: 'Sucesso!', description: 'Solicitação registrada!' });
      setSolAberta(false);
      setNovaSol({ produtorId: '', tipoAssistencia: '', descricao: '', prioridade: 'NORMAL' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const agendarVisita = async () => {
    if (!solVisita || !visita.dataAgendada) return;
    try {
      await createVisita({
        solicitacaoId: solVisita.id,
        tecnicoId: visita.tecnicoId || undefined,
        dataAgendada: visita.dataAgendada,
      });
      toast({ title: 'Visita agendada' });
      setSolVisita(null);
      setVisita({ tecnicoId: '', dataAgendada: '' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const iniciar = async (s: any) => {
    const ultimaVisita = s.visitas?.[0];
    if (!ultimaVisita) return;
    try {
      await iniciarVisita(ultimaVisita.id);
      toast({ title: 'Atendimento iniciado' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const concluir = async () => {
    if (!visitaConclusao) return;
    try {
      await concluirVisita(visitaConclusao.id, conclusao);
      toast({ title: 'Atendimento concluído' });
      setVisitaConclusao(null);
      setConclusao({ diagnostico: '', recomendacoes: '' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const criarTecnico = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTecnico(novoTecnico);
      toast({ title: 'Técnico cadastrado' });
      setTecnicoAberto(false);
      setNovoTecnico({ nome: '', registro: '', especialidade: '', telefone: '' });
      loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    }
  };

  const acoesSolicitacao = (s: any) => {
    switch (s.status) {
      case 'ABERTA':
        return (
          <Button size="sm" onClick={() => setSolVisita(s)}>
            <CalendarCheck className="h-4 w-4 mr-1" /> Agendar visita
          </Button>
        );
      case 'AGENDADA':
        return (
          <Button size="sm" onClick={() => iniciar(s)}>
            <Play className="h-4 w-4 mr-1" /> Iniciar atendimento
          </Button>
        );
      case 'EM_ATENDIMENTO': {
        const ultimaVisita = s.visitas?.[0];
        return (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => ultimaVisita && setVisitaConclusao(ultimaVisita)}
          >
            <Check className="h-4 w-4 mr-1" /> Concluir
          </Button>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/admin/secretarias/agricultura')}
            className="shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shrink-0">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <span className="hidden sm:inline">Assistência Técnica Rural (ATER)</span>
              <span className="sm:hidden">Assistência</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Solicitação → visita técnica → diagnóstico e recomendações
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-600 text-white">MS-04</Badge>
          <Button variant="outline" onClick={() => setTecnicoAberto(true)}>
            <Users className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Técnicos</span>
          </Button>
          <Button className="bg-green-600 hover:bg-green-700" onClick={() => setSolAberta(true)}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nova Solicitação</span>
            <span className="sm:hidden">Nova</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Abertas"
          value={totalPorStatus('ABERTA')}
          icon={ClipboardList}
          description="Aguardando agendamento"
          color="orange"
          loading={!statistics}
        />
        <MetricCard
          title="Agendadas"
          value={totalPorStatus('AGENDADA')}
          icon={CalendarCheck}
          description="Com visita marcada"
          color="blue"
          loading={!statistics}
        />
        <MetricCard
          title="Visitas no Ano"
          value={statistics?.totalVisitas || 0}
          icon={Users}
          description={`${statistics?.visitasConcluidas || 0} concluídas`}
          color="purple"
          loading={!statistics}
        />
        <MetricCard
          title="Concluídas"
          value={totalPorStatus('CONCLUIDA')}
          icon={CheckCircle}
          description="Atendimentos finalizados"
          color="green"
          loading={!statistics}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Solicitações
              <Badge variant="secondary">{filtradas.length}</Badge>
            </CardTitle>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todos os status</SelectItem>
                {Object.entries(STATUS_LABEL).map(([valor, cfg]) => (
                  <SelectItem key={valor} value={valor}>
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filtradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma solicitação encontrada</div>
          ) : (
            <div className="space-y-3">
              {filtradas.map((s: any) => {
                const badge = STATUS_LABEL[s.status] || { label: s.status };
                const ultimaVisita = s.visitas?.[0];
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">
                        {s.produtor?.nome || 'Produtor'}
                        <span className="text-sm text-gray-500 font-normal ml-2">
                          {s.tipoAssistencia}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {s.descricao || 'Sem descrição'}
                        {s.propriedade && ` | ${s.propriedade.nome}`}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Aberta em {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                        {s.tecnico && ` | Técnico: ${s.tecnico.nome}`}
                        {ultimaVisita &&
                          ` | Visita: ${new Date(ultimaVisita.dataAgendada).toLocaleString('pt-BR')}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={badge.className}>{badge.label}</Badge>
                      {acoesSolicitacao(s)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog nova solicitação */}
      <Dialog open={solAberta} onOpenChange={setSolAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Solicitação de Assistência</DialogTitle>
            <DialogDescription>Registre a demanda do produtor rural</DialogDescription>
          </DialogHeader>
          <form onSubmit={criarSolicitacao} className="space-y-4">
            <div className="space-y-2">
              <Label>Produtor *</Label>
              <Select
                value={novaSol.produtorId}
                onValueChange={(v) => setNovaSol({ ...novaSol, produtorId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o produtor" />
                </SelectTrigger>
                <SelectContent>
                  {produtores.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome} — {p.cpf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de assistência *</Label>
                <Input
                  value={novaSol.tipoAssistencia}
                  onChange={(e) => setNovaSol({ ...novaSol, tipoAssistencia: e.target.value })}
                  placeholder="Ex: Manejo de solo"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={novaSol.prioridade}
                  onValueChange={(v) => setNovaSol({ ...novaSol, prioridade: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição da necessidade</Label>
              <Textarea
                value={novaSol.descricao}
                onChange={(e) => setNovaSol({ ...novaSol, descricao: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSolAberta(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !novaSol.produtorId}>
                {loading ? 'Salvando...' : 'Registrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog agendar visita */}
      <Dialog open={!!solVisita} onOpenChange={(open) => !open && setSolVisita(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar visita — {solVisita?.produtor?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Técnico</Label>
              <Select
                value={visita.tecnicoId}
                onValueChange={(v) => setVisita({ ...visita, tecnicoId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o técnico" />
                </SelectTrigger>
                <SelectContent>
                  {tecnicos.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                      {t.especialidade ? ` — ${t.especialidade}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tecnicos.length === 0 && (
                <p className="text-xs text-amber-600">
                  Nenhum técnico cadastrado — use o botão "Técnicos" para cadastrar.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Data e hora da visita</Label>
              <Input
                type="datetime-local"
                value={visita.dataAgendada}
                onChange={(e) => setVisita({ ...visita, dataAgendada: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSolVisita(null)}>
              Cancelar
            </Button>
            <Button onClick={agendarVisita} disabled={loading || !visita.dataAgendada}>
              Agendar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog concluir visita */}
      <Dialog open={!!visitaConclusao} onOpenChange={(open) => !open && setVisitaConclusao(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Concluir atendimento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Diagnóstico</Label>
              <Textarea
                value={conclusao.diagnostico}
                onChange={(e) => setConclusao({ ...conclusao, diagnostico: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Recomendações ao produtor</Label>
              <Textarea
                value={conclusao.recomendacoes}
                onChange={(e) => setConclusao({ ...conclusao, recomendacoes: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setVisitaConclusao(null)}>
              Cancelar
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={concluir} disabled={loading}>
              Concluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog novo técnico */}
      <Dialog open={tecnicoAberto} onOpenChange={setTecnicoAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cadastrar Técnico</DialogTitle>
            <DialogDescription>
              Técnicos já cadastrados: {tecnicos.map((t: any) => t.nome).join(', ') || 'nenhum'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={criarTecnico} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={novoTecnico.nome}
                onChange={(e) => setNovoTecnico({ ...novoTecnico, nome: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Registro (CREA/CFTA)</Label>
                <Input
                  value={novoTecnico.registro}
                  onChange={(e) => setNovoTecnico({ ...novoTecnico, registro: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={novoTecnico.telefone}
                  onChange={(e) => setNovoTecnico({ ...novoTecnico, telefone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Especialidade</Label>
              <Input
                value={novoTecnico.especialidade}
                onChange={(e) => setNovoTecnico({ ...novoTecnico, especialidade: e.target.value })}
                placeholder="Ex: Agronomia, Zootecnia"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setTecnicoAberto(false)}>
                Fechar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
