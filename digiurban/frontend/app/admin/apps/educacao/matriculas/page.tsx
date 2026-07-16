'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { CidadaoSelector } from '@/components/apps/saude/CidadaoSelector';
import { ClipboardList, Plus, Check, X, School } from 'lucide-react';

const STATUS_LABEL: Record<string, { label: string; className?: string; variant?: any }> = {
  INSCRITO_AGUARDANDO_VALIDACAO: { label: 'Aguardando validação', className: 'bg-yellow-600' },
  DOCUMENTACAO_PENDENTE: { label: 'Documentação pendente', className: 'bg-orange-600' },
  DOCUMENTOS_VALIDADOS: { label: 'Documentos validados', className: 'bg-blue-600' },
  AGUARDANDO_DISTRIBUICAO: { label: 'Aguardando distribuição', className: 'bg-blue-500' },
  VAGA_ATRIBUIDA: { label: 'Vaga atribuída', className: 'bg-indigo-600' },
  LISTA_ESPERA: { label: 'Lista de espera', variant: 'secondary' },
  MATRICULADO: { label: 'Matriculado', className: 'bg-green-600' },
  CONFIRMADA: { label: 'Confirmada', className: 'bg-green-600' },
  RECUSADA: { label: 'Recusada', variant: 'destructive' },
  INDEFERIDA: { label: 'Indeferida', variant: 'destructive' },
  CANCELADA: { label: 'Cancelada', variant: 'secondary' },
  EXPIRADA: { label: 'Expirada', variant: 'secondary' },
};

const SERIES = [
  'Berçário',
  'Maternal I',
  'Maternal II',
  'Pré I',
  'Pré II',
  '1º Ano',
  '2º Ano',
  '3º Ano',
  '4º Ano',
  '5º Ano',
  '6º Ano',
  '7º Ano',
  '8º Ano',
  '9º Ano',
  'EJA',
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

export default function MatriculasPage() {
  const { toast } = useToast();
  const [inscricoes, setInscricoes] = useState<any[]>([]);
  const [matriculas, setMatriculas] = useState<any[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('TODAS');
  const [loading, setLoading] = useState(true);

  // Nova inscrição
  const [novaAberta, setNovaAberta] = useState(false);
  const [aluno, setAluno] = useState<any>(null);
  const [responsavel, setResponsavel] = useState<any>(null);
  const [serie, setSerie] = useState('');
  const [turno, setTurno] = useState('MATUTINO');
  const [unidades, setUnidades] = useState<any[]>([]);
  const [escolaPreferencia, setEscolaPreferencia] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Atribuir vaga
  const [inscricaoVaga, setInscricaoVaga] = useState<any>(null);
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<any[]>([]);
  const [turmaEscolhida, setTurmaEscolhida] = useState('');

  useEffect(() => {
    loadData();
    api('/api/apps/educacao/unidades?ativas=true')
      .then((data) => setUnidades(Array.isArray(data) ? data : []))
      .catch(() => setUnidades([]));
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [insc, mat] = await Promise.all([
        api('/api/apps/educacao/matriculas/inscricoes'),
        api('/api/apps/educacao/matriculas?situacao=ATIVA'),
      ]);
      setInscricoes(Array.isArray(insc) ? insc : []);
      setMatriculas(Array.isArray(mat) ? mat : []);
    } catch (error) {
      console.error('Erro ao carregar matrículas:', error);
    } finally {
      setLoading(false);
    }
  };

  const inscricoesFiltradas = useMemo(() => {
    if (filtroStatus === 'TODAS') return inscricoes;
    return inscricoes.filter((i) => i.status === filtroStatus);
  }, [inscricoes, filtroStatus]);

  const criarInscricao = async () => {
    if (!aluno?.id || !responsavel?.id || !serie) {
      toast({ title: 'Informe aluno, responsável e série', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/educacao/matriculas/inscricoes', {
        method: 'POST',
        body: JSON.stringify({
          alunoId: aluno.id,
          responsavelId: responsavel.id,
          serie,
          turno,
          escolaPreferencia1: escolaPreferencia || undefined,
        }),
      });
      toast({ title: 'Inscrição registrada' });
      setNovaAberta(false);
      setAluno(null);
      setResponsavel(null);
      setSerie('');
      setEscolaPreferencia('');
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao inscrever',
        description: String(error?.message || error),
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  const validarDocumentos = async (inscricao: any, aprovado: boolean) => {
    try {
      await api(`/api/apps/educacao/matriculas/inscricoes/${inscricao.id}/validar-documentos`, {
        method: 'POST',
        body: JSON.stringify({ aprovado }),
      });
      toast({ title: aprovado ? 'Documentos aprovados' : 'Documentação marcada como pendente' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const abrirAtribuirVaga = async (inscricao: any) => {
    setInscricaoVaga(inscricao);
    setTurmaEscolhida('');
    try {
      const params = new URLSearchParams({ serie: inscricao.serie });
      if (inscricao.escolaPreferencia1) params.set('unidadeId', inscricao.escolaPreferencia1);
      const turmas = await api(`/api/apps/educacao/turmas?${params}`);
      setTurmasDisponiveis(
        (Array.isArray(turmas) ? turmas : []).filter((t: any) => t.vagasOcupadas < t.capacidade)
      );
    } catch {
      setTurmasDisponiveis([]);
    }
  };

  const atribuirVaga = async () => {
    if (!inscricaoVaga || !turmaEscolhida) return;
    setSalvando(true);
    try {
      await api(`/api/apps/educacao/matriculas/inscricoes/${inscricaoVaga.id}/atribuir-vaga`, {
        method: 'POST',
        body: JSON.stringify({ turmaId: turmaEscolhida }),
      });
      toast({ title: 'Vaga atribuída' });
      setInscricaoVaga(null);
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const confirmarMatricula = async (inscricao: any) => {
    try {
      await api(`/api/apps/educacao/matriculas/inscricoes/${inscricao.id}/confirmar`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast({ title: 'Matrícula confirmada! 🎓' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const acoesInscricao = (inscricao: any) => {
    switch (inscricao.status) {
      case 'INSCRITO_AGUARDANDO_VALIDACAO':
      case 'DOCUMENTACAO_PENDENTE':
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => validarDocumentos(inscricao, true)}
            >
              <Check className="h-4 w-4 mr-1" /> Aprovar docs
            </Button>
            <Button size="sm" variant="outline" onClick={() => validarDocumentos(inscricao, false)}>
              <X className="h-4 w-4 mr-1" /> Pendente
            </Button>
          </div>
        );
      case 'DOCUMENTOS_VALIDADOS':
      case 'AGUARDANDO_DISTRIBUICAO':
        return (
          <Button size="sm" onClick={() => abrirAtribuirVaga(inscricao)}>
            <School className="h-4 w-4 mr-1" /> Atribuir vaga
          </Button>
        );
      case 'VAGA_ATRIBUIDA':
        return (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => confirmarMatricula(inscricao)}
          >
            <Check className="h-4 w-4 mr-1" /> Confirmar matrícula
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Matrículas</h1>
          <p className="text-gray-500 mt-1">
            Inscrição → validação de documentos → atribuição de vaga → confirmação
          </p>
        </div>
        <Button onClick={() => setNovaAberta(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova inscrição
        </Button>
      </div>

      <Tabs defaultValue="inscricoes">
        <TabsList>
          <TabsTrigger value="inscricoes">Inscrições ({inscricoes.length})</TabsTrigger>
          <TabsTrigger value="matriculados">Matriculados ({matriculas.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="inscricoes" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-72">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Inscrições
                <Badge variant="secondary">{inscricoesFiltradas.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-gray-500">Carregando...</div>
              ) : inscricoesFiltradas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma inscrição encontrada</div>
              ) : (
                <div className="space-y-3">
                  {inscricoesFiltradas.map((i: any) => {
                    const badge = STATUS_LABEL[i.status] || { label: i.status };
                    return (
                      <div
                        key={i.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {i.aluno?.name || 'Aluno'}
                            <span className="text-sm text-gray-500 font-normal ml-2">
                              — {i.serie} ({i.turno})
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            Responsável: {i.responsavel?.name || '-'} | Ano letivo: {i.anoLetivo}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Inscrita em {new Date(i.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={badge.variant} className={badge.className}>
                            {badge.label}
                          </Badge>
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

        <TabsContent value="matriculados">
          <Card>
            <CardContent className="pt-6">
              {matriculas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhuma matrícula ativa</div>
              ) : (
                <div className="space-y-3">
                  {matriculas.map((m: any) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{m.aluno?.name || 'Aluno'}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          Matrícula {m.numeroMatricula} | Turma{' '}
                          {m.turma?.codigo || m.turma?.nome || '-'} ({m.turma?.serie},{' '}
                          {m.turma?.turno})
                        </div>
                      </div>
                      <Badge className="bg-green-600">Ativa</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog nova inscrição */}
      <Dialog open={novaAberta} onOpenChange={setNovaAberta}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova inscrição de matrícula</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <CidadaoSelector label="Aluno" onSelect={setAluno} selectedCidadao={aluno} />
            <CidadaoSelector
              label="Responsável"
              onSelect={setResponsavel}
              selectedCidadao={responsavel}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Série</Label>
                <Select value={serie} onValueChange={setSerie}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Turno</Label>
                <Select value={turno} onValueChange={setTurno}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATUTINO">Matutino</SelectItem>
                    <SelectItem value="VESPERTINO">Vespertino</SelectItem>
                    <SelectItem value="INTEGRAL">Integral</SelectItem>
                    <SelectItem value="INDIFERENTE">Indiferente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Escola de preferência</Label>
              <Select value={escolaPreferencia} onValueChange={setEscolaPreferencia}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarInscricao} disabled={salvando}>
              {salvando ? 'Enviando...' : 'Inscrever'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog atribuir vaga */}
      <Dialog open={!!inscricaoVaga} onOpenChange={(open) => !open && setInscricaoVaga(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Atribuir vaga — {inscricaoVaga?.aluno?.name} ({inscricaoVaga?.serie})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {turmasDisponiveis.length === 0 ? (
              <p className="text-sm text-orange-600">
                Nenhuma turma com vagas para esta série. Crie uma turma em
                Turmas ou ajuste a capacidade.
              </p>
            ) : (
              <div>
                <Label>Turma</Label>
                <Select value={turmaEscolhida} onValueChange={setTurmaEscolhida}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmasDisponiveis.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.codigo} — {t.serie} {t.turno} ({t.capacidade - t.vagasOcupadas} vagas)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInscricaoVaga(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={atribuirVaga} disabled={salvando || !turmaEscolhida}>
              {salvando ? 'Atribuindo...' : 'Atribuir vaga'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
