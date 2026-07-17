'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Leaf,
  Plus,
  Play,
  FileText,
  Search,
  Check,
  X,
  Award,
  ClipboardList,
  Gavel,
  Archive,
  RefreshCw,
} from 'lucide-react';

const STATUS_LABEL: Record<string, { label: string; className?: string }> = {
  ABERTO: { label: 'Aberto', className: 'bg-yellow-600' },
  EM_ANALISE: { label: 'Em análise', className: 'bg-blue-600' },
  EXIGENCIA: { label: 'Com exigência', className: 'bg-orange-600' },
  VISTORIA: { label: 'Em vistoria', className: 'bg-indigo-600' },
  APROVADO: { label: 'Aprovado', className: 'bg-emerald-600' },
  LICENCA_EMITIDA: { label: 'Licença emitida', className: 'bg-green-700' },
  AUTUADO: { label: 'Autuado', className: 'bg-red-700' },
  ARQUIVADO: { label: 'Arquivado', className: 'bg-gray-500' },
  INDEFERIDO: { label: 'Indeferido', className: 'bg-red-600' },
  CANCELADO: { label: 'Cancelado', className: 'bg-gray-600' },
};

const TIPO_LABEL: Record<string, string> = {
  LICENCA_AMBIENTAL: 'Licença Ambiental',
  AUTORIZACAO_PODA_CORTE: 'Autorização de Poda/Corte',
  AUTORIZACAO_SUPRESSAO: 'Autorização de Supressão',
  DENUNCIA: 'Denúncia Ambiental',
  VISTORIA: 'Vistoria Ambiental',
};

/** Tipos que seguem a corrente de fiscalização (autuar/arquivar). */
const TIPOS_FISCALIZACAO = ['DENUNCIA', 'VISTORIA'];

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

export default function MeioAmbienteAppPage() {
  const { toast } = useToast();
  const [processos, setProcessos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('ATIVOS');
  const [busca, setBusca] = useState('');

  // Novo processo
  const [novoAberto, setNovoAberto] = useState(false);
  const [novo, setNovo] = useState({
    tipo: '',
    requerenteNome: '',
    atividade: '',
    endereco: '',
    bairro: '',
    descricao: '',
  });

  // Parecer
  const [processoParecer, setProcessoParecer] = useState<any>(null);
  const [parecer, setParecer] = useState({ tipo: 'ANALISE_TECNICA', resultado: 'FAVORAVEL', texto: '' });

  // Vistoria (agendar)
  const [processoVistoria, setProcessoVistoria] = useState<any>(null);
  const [vistoria, setVistoria] = useState({ dataAgendada: '', observacoes: '' });

  // Vistoria (registrar resultado)
  const [vistoriaRegistro, setVistoriaRegistro] = useState<any>(null);
  const [registro, setRegistro] = useState({ resultado: 'CONFORME', constatacoes: '' });

  // Auto de infração
  const [processoAuto, setProcessoAuto] = useState<any>(null);
  const [auto, setAuto] = useState({
    infratorNome: '',
    infratorDocumento: '',
    descricao: '',
    enquadramento: '',
    gravidade: 'LEVE',
    valorMulta: '',
  });

  // Indeferir/arquivar/cancelar (motivo)
  const [acaoMotivo, setAcaoMotivo] = useState<{ processo: any; rota: string; titulo: string } | null>(null);
  const [motivo, setMotivo] = useState('');

  // Emitir licença
  const [processoLicenca, setProcessoLicenca] = useState<any>(null);
  const [validadeMeses, setValidadeMeses] = useState('12');
  const [condicionantes, setCondicionantes] = useState('');

  // Detalhe
  const [detalhe, setDetalhe] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [processosData, statsData] = await Promise.all([
        api('/api/apps/meio-ambiente/processos'),
        api('/api/apps/meio-ambiente/processos/stats').catch(() => null),
      ]);
      setProcessos(Array.isArray(processosData) ? processosData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar processos:', error);
    } finally {
      setLoading(false);
    }
  };

  const encerrados = ['LICENCA_EMITIDA', 'AUTUADO', 'ARQUIVADO', 'INDEFERIDO', 'CANCELADO'];

  const filtrados = useMemo(() => {
    let lista = processos;
    if (filtroStatus === 'ATIVOS') {
      lista = lista.filter((p) => !encerrados.includes(p.status));
    } else if (filtroStatus !== 'TODOS') {
      lista = lista.filter((p) => p.status === filtroStatus);
    }
    if (busca) {
      const termo = busca.toLowerCase();
      lista = lista.filter(
        (p) =>
          p.numero?.toLowerCase().includes(termo) ||
          p.requerenteNome?.toLowerCase().includes(termo) ||
          p.atividade?.toLowerCase().includes(termo) ||
          p.endereco?.toLowerCase().includes(termo) ||
          p.bairro?.toLowerCase().includes(termo) ||
          p.licencaNumero?.toLowerCase().includes(termo)
      );
    }
    return lista;
  }, [processos, filtroStatus, busca]);

  const emAndamento =
    (stats?.porStatus || [])
      .filter((s: any) => !encerrados.includes(s.status))
      .reduce((acc: number, s: any) => acc + s.total, 0) || 0;

  const criarProcesso = async () => {
    if (!novo.tipo) {
      toast({ title: 'Selecione o tipo de processo', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/meio-ambiente/processos', {
        method: 'POST',
        body: JSON.stringify(novo),
      });
      toast({ title: 'Processo aberto' });
      setNovoAberto(false);
      setNovo({ tipo: '', requerenteNome: '', atividade: '', endereco: '', bairro: '', descricao: '' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const acao = async (processo: any, rota: string, body: any = {}) => {
    try {
      await api(`/api/apps/meio-ambiente/processos/${processo.id}/${rota}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast({ title: 'Situação atualizada' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const registrarParecer = async () => {
    if (!processoParecer) return;
    setSalvando(true);
    try {
      await api(`/api/apps/meio-ambiente/processos/${processoParecer.id}/pareceres`, {
        method: 'POST',
        body: JSON.stringify(parecer),
      });
      toast({ title: 'Parecer registrado' });
      setProcessoParecer(null);
      setParecer({ tipo: 'ANALISE_TECNICA', resultado: 'FAVORAVEL', texto: '' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const agendarVistoria = async () => {
    if (!processoVistoria) return;
    setSalvando(true);
    try {
      await api(`/api/apps/meio-ambiente/processos/${processoVistoria.id}/agendar-vistoria`, {
        method: 'POST',
        body: JSON.stringify(vistoria),
      });
      toast({ title: 'Vistoria agendada' });
      setProcessoVistoria(null);
      setVistoria({ dataAgendada: '', observacoes: '' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const registrarVistoria = async () => {
    if (!vistoriaRegistro) return;
    setSalvando(true);
    try {
      await api(`/api/apps/meio-ambiente/vistorias/${vistoriaRegistro.id}/registrar`, {
        method: 'POST',
        body: JSON.stringify(registro),
      });
      toast({ title: 'Vistoria registrada' });
      setVistoriaRegistro(null);
      setRegistro({ resultado: 'CONFORME', constatacoes: '' });
      setDetalhe(null);
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const lavrarAuto = async () => {
    if (!processoAuto) return;
    setSalvando(true);
    try {
      await api(`/api/apps/meio-ambiente/processos/${processoAuto.id}/lavrar-auto`, {
        method: 'POST',
        body: JSON.stringify({
          ...auto,
          valorMulta: auto.valorMulta ? Number(auto.valorMulta) : undefined,
        }),
      });
      toast({ title: 'Auto de infração lavrado' });
      setProcessoAuto(null);
      setAuto({
        infratorNome: '',
        infratorDocumento: '',
        descricao: '',
        enquadramento: '',
        gravidade: 'LEVE',
        valorMulta: '',
      });
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
      await acao(acaoMotivo.processo, acaoMotivo.rota, { motivo });
      setAcaoMotivo(null);
      setMotivo('');
    } finally {
      setSalvando(false);
    }
  };

  const emitirLicenca = async () => {
    if (!processoLicenca) return;
    setSalvando(true);
    try {
      await api(`/api/apps/meio-ambiente/processos/${processoLicenca.id}/emitir-licenca`, {
        method: 'POST',
        body: JSON.stringify({
          validadeMeses: Number(validadeMeses) || 12,
          condicionantes: condicionantes
            .split('\n')
            .map((c) => c.trim())
            .filter(Boolean),
        }),
      });
      toast({ title: 'Licença emitida' });
      setProcessoLicenca(null);
      setValidadeMeses('12');
      setCondicionantes('');
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const renovar = async (p: any) => {
    try {
      const criado = await api(`/api/apps/meio-ambiente/processos/${p.id}/renovar`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast({ title: `Renovação aberta: ${criado.numero}` });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const abrirDetalhe = async (p: any) => {
    try {
      setDetalhe(await api(`/api/apps/meio-ambiente/processos/${p.id}`));
    } catch {
      setDetalhe(p);
    }
  };

  const acoesProcesso = (p: any) => {
    const fiscalizacao = TIPOS_FISCALIZACAO.includes(p.tipo);
    switch (p.status) {
      case 'ABERTO':
        return (
          <Button size="sm" onClick={() => acao(p, 'iniciar-analise')}>
            <Play className="h-4 w-4 mr-1" /> Iniciar análise
          </Button>
        );
      case 'EM_ANALISE':
      case 'EXIGENCIA':
      case 'VISTORIA':
        return (
          <div className="flex gap-1 flex-wrap justify-end">
            <Button size="sm" variant="outline" onClick={() => setProcessoParecer(p)}>
              <FileText className="h-4 w-4 mr-1" /> Parecer
            </Button>
            {p.status !== 'VISTORIA' && (
              <Button size="sm" variant="outline" onClick={() => setProcessoVistoria(p)}>
                <Search className="h-4 w-4 mr-1" /> Vistoria
              </Button>
            )}
            {fiscalizacao ? (
              <>
                <Button
                  size="sm"
                  className="bg-red-700 hover:bg-red-800"
                  onClick={() => setProcessoAuto(p)}
                >
                  <Gavel className="h-4 w-4 mr-1" /> Autuar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setAcaoMotivo({ processo: p, rota: 'arquivar', titulo: `Arquivar ${p.numero}` })
                  }
                >
                  <Archive className="h-4 w-4 mr-1" /> Arquivar
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => acao(p, 'aprovar')}
                >
                  <Check className="h-4 w-4 mr-1" /> Aprovar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setAcaoMotivo({ processo: p, rota: 'indeferir', titulo: `Indeferir ${p.numero}` })
                  }
                >
                  <X className="h-4 w-4 mr-1" /> Indeferir
                </Button>
              </>
            )}
          </div>
        );
      case 'APROVADO':
        return (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setProcessoLicenca(p)}
          >
            <Award className="h-4 w-4 mr-1" /> Emitir licença
          </Button>
        );
      case 'LICENCA_EMITIDA':
        return (
          <Button size="sm" variant="outline" onClick={() => renovar(p)}>
            <RefreshCw className="h-4 w-4 mr-1" /> Renovar
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
          <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
            <Leaf className="h-7 w-7 text-green-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Licenciamento & Fiscalização Ambiental</h1>
            <p className="text-gray-500">
              Licenças com condicionantes, denúncias, vistorias de campo e autos de infração
            </p>
          </div>
        </div>
        <Button onClick={() => setNovoAberto(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo processo
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
            <CardTitle className="text-sm font-medium">Fiscalizações abertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.fiscalizacoesAbertas ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Licenças no ano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats?.licencasEmitidasNoAno ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Autos no ano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.autosLavradosNoAno ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Buscar por número, requerente, atividade, endereço ou licença..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1"
            />
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVOS">Ativos (em tramitação)</SelectItem>
                <SelectItem value="TODOS">Todos</SelectItem>
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
            Processos
            <Badge variant="secondary">{filtrados.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum processo encontrado</div>
          ) : (
            <div className="space-y-3">
              {filtrados.map((p: any) => {
                const badge = STATUS_LABEL[p.status] || { label: p.status };
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 cursor-pointer" onClick={() => abrirDetalhe(p)}>
                      <div className="font-medium flex items-center gap-2">
                        {p.numero}
                        <span className="text-gray-600 font-normal">
                          {TIPO_LABEL[p.tipo] || p.tipo}
                        </span>
                        {p.licencaNumero && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {p.licencaNumero}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {p.requerenteNome ||
                          (TIPOS_FISCALIZACAO.includes(p.tipo)
                            ? 'Denunciante não identificado'
                            : 'Requerente não informado')}
                        {p.atividade && ` | ${p.atividade}`}
                        {(p.endereco || p.bairro) &&
                          ` | ${[p.endereco, p.bairro].filter(Boolean).join(' — ')}`}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Aberto em {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                        {p.licencaValidade &&
                          ` | Licença válida até ${new Date(p.licencaValidade).toLocaleDateString('pt-BR')}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={badge.className}>{badge.label}</Badge>
                      {acoesProcesso(p)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog novo processo */}
      <Dialog open={novoAberto} onOpenChange={setNovoAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo processo ambiental</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo *</Label>
              <Select value={novo.tipo} onValueChange={(v) => setNovo({ ...novo, tipo: v })}>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Requerente / Denunciante</Label>
                <Input
                  value={novo.requerenteNome}
                  onChange={(e) => setNovo({ ...novo, requerenteNome: e.target.value })}
                />
              </div>
              <div>
                <Label>Atividade / Objeto</Label>
                <Input
                  value={novo.atividade}
                  onChange={(e) => setNovo({ ...novo, atividade: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Endereço / Local</Label>
                <Input
                  value={novo.endereco}
                  onChange={(e) => setNovo({ ...novo, endereco: e.target.value })}
                />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input
                  value={novo.bairro}
                  onChange={(e) => setNovo({ ...novo, bairro: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={novo.descricao}
                onChange={(e) => setNovo({ ...novo, descricao: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarProcesso} disabled={salvando}>
              {salvando ? 'Abrindo...' : 'Abrir processo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog parecer */}
      <Dialog open={!!processoParecer} onOpenChange={(open) => !open && setProcessoParecer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar parecer — {processoParecer?.numero}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de parecer</Label>
                <Select
                  value={parecer.tipo}
                  onValueChange={(v) => setParecer({ ...parecer, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANALISE_TECNICA">Análise técnica</SelectItem>
                    <SelectItem value="JURIDICO">Jurídico</SelectItem>
                    <SelectItem value="NOTA">Nota interna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Resultado</Label>
                <Select
                  value={parecer.resultado}
                  onValueChange={(v) => setParecer({ ...parecer, resultado: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FAVORAVEL">Favorável</SelectItem>
                    <SelectItem value="DESFAVORAVEL">Desfavorável</SelectItem>
                    <SelectItem value="EXIGENCIA">Exigência ao requerente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Parecer</Label>
              <Textarea
                value={parecer.texto}
                onChange={(e) => setParecer({ ...parecer, texto: e.target.value })}
                rows={4}
              />
            </div>
            {parecer.resultado === 'EXIGENCIA' && (
              <p className="text-xs text-orange-600">
                O processo ficará "Com exigência" até novo parecer.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessoParecer(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={registrarParecer} disabled={salvando || !parecer.texto}>
              {salvando ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog agendar vistoria */}
      <Dialog open={!!processoVistoria} onOpenChange={(open) => !open && setProcessoVistoria(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar vistoria — {processoVistoria?.numero}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data agendada</Label>
              <Input
                type="date"
                value={vistoria.dataAgendada}
                onChange={(e) => setVistoria({ ...vistoria, dataAgendada: e.target.value })}
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={vistoria.observacoes}
                onChange={(e) => setVistoria({ ...vistoria, observacoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessoVistoria(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={agendarVistoria} disabled={salvando}>
              {salvando ? 'Agendando...' : 'Agendar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog registrar resultado da vistoria */}
      <Dialog open={!!vistoriaRegistro} onOpenChange={(open) => !open && setVistoriaRegistro(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar resultado da vistoria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Resultado</Label>
              <Select
                value={registro.resultado}
                onValueChange={(v) => setRegistro({ ...registro, resultado: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONFORME">Conforme</SelectItem>
                  <SelectItem value="NAO_CONFORME">Não conforme</SelectItem>
                  <SelectItem value="PARCIAL">Parcialmente conforme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Constatações</Label>
              <Textarea
                value={registro.constatacoes}
                onChange={(e) => setRegistro({ ...registro, constatacoes: e.target.value })}
                rows={4}
              />
            </div>
            <p className="text-xs text-gray-500">O processo voltará para análise após o registro.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVistoriaRegistro(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={registrarVistoria} disabled={salvando || !registro.constatacoes}>
              {salvando ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog auto de infração */}
      <Dialog open={!!processoAuto} onOpenChange={(open) => !open && setProcessoAuto(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lavrar auto de infração — {processoAuto?.numero}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Infrator</Label>
                <Input
                  value={auto.infratorNome}
                  onChange={(e) => setAuto({ ...auto, infratorNome: e.target.value })}
                />
              </div>
              <div>
                <Label>CPF/CNPJ</Label>
                <Input
                  value={auto.infratorDocumento}
                  onChange={(e) => setAuto({ ...auto, infratorDocumento: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Descrição da infração *</Label>
              <Textarea
                value={auto.descricao}
                onChange={(e) => setAuto({ ...auto, descricao: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label>Enquadramento legal</Label>
              <Input
                placeholder="Ex.: Art. 70, Lei 9.605/1998"
                value={auto.enquadramento}
                onChange={(e) => setAuto({ ...auto, enquadramento: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Gravidade</Label>
                <Select value={auto.gravidade} onValueChange={(v) => setAuto({ ...auto, gravidade: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LEVE">Leve</SelectItem>
                    <SelectItem value="MEDIA">Média</SelectItem>
                    <SelectItem value="GRAVE">Grave</SelectItem>
                    <SelectItem value="GRAVISSIMA">Gravíssima</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Multa (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={auto.valorMulta}
                  onChange={(e) => setAuto({ ...auto, valorMulta: e.target.value })}
                />
              </div>
            </div>
            {processoAuto && TIPOS_FISCALIZACAO.includes(processoAuto.tipo) && (
              <p className="text-xs text-gray-500">
                O processo será encerrado como "Autuado" e o protocolo de origem concluído. O prazo
                de defesa padrão é de 20 dias.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessoAuto(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              className="bg-red-700 hover:bg-red-800"
              onClick={lavrarAuto}
              disabled={salvando || !auto.descricao}
            >
              {salvando ? 'Lavrando...' : 'Lavrar auto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog motivo (indeferir/arquivar) */}
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

      {/* Dialog emitir licença */}
      <Dialog open={!!processoLicenca} onOpenChange={(open) => !open && setProcessoLicenca(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Emitir licença — {processoLicenca?.numero}</DialogTitle>
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
            <div>
              <Label>Condicionantes (uma por linha)</Label>
              <Textarea
                placeholder={'Ex.:\nApresentar relatório semestral\nManter cortina vegetal'}
                value={condicionantes}
                onChange={(e) => setCondicionantes(e.target.value)}
                rows={4}
              />
            </div>
            {processoLicenca?.protocolId && (
              <p className="text-xs text-gray-500">
                O protocolo de origem será concluído automaticamente.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessoLicenca(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={emitirLicenca}
              disabled={salvando}
            >
              {salvando ? 'Emitindo...' : 'Emitir'}
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
              {detalhe?.licencaNumero && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {detalhe.licencaNumero}
                </Badge>
              )}
            </div>
            <div>
              <span className="text-gray-500">Requerente/Denunciante:</span>{' '}
              <span className="font-medium">{detalhe?.requerenteNome || '-'}</span>
            </div>
            {detalhe?.atividade && (
              <div>
                <span className="text-gray-500">Atividade:</span> {detalhe.atividade}
              </div>
            )}
            <div className="text-gray-500">
              {[detalhe?.endereco, detalhe?.bairro].filter(Boolean).join(' — ') || 'Sem endereço'}
            </div>
            {detalhe?.descricao && <p className="text-gray-700">{detalhe.descricao}</p>}
            {detalhe?.licencaValidade && (
              <div>
                <span className="text-gray-500">Licença válida até:</span>{' '}
                {new Date(detalhe.licencaValidade).toLocaleDateString('pt-BR')}
              </div>
            )}
            {Array.isArray(detalhe?.condicionantes) && detalhe.condicionantes.length > 0 && (
              <div>
                <div className="font-medium">Condicionantes</div>
                <ul className="list-disc ml-5 text-gray-700">
                  {detalhe.condicionantes.map((c: string, i: number) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="font-medium mt-2">Vistorias ({(detalhe?.vistorias || []).length})</div>
            {(detalhe?.vistorias || []).length === 0 ? (
              <p className="text-gray-500">Nenhuma vistoria</p>
            ) : (
              <div className="space-y-2">
                {detalhe.vistorias.map((v: any) => (
                  <div key={v.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {v.dataRealizada ? (
                          <Badge
                            className={
                              v.resultado === 'CONFORME'
                                ? 'bg-green-600'
                                : v.resultado === 'NAO_CONFORME'
                                  ? 'bg-red-600'
                                  : 'bg-orange-600'
                            }
                          >
                            {v.resultado || 'Realizada'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Agendada</Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {v.dataRealizada
                            ? `Realizada em ${new Date(v.dataRealizada).toLocaleDateString('pt-BR')}`
                            : v.dataAgendada
                              ? `Agendada para ${new Date(v.dataAgendada).toLocaleDateString('pt-BR')}`
                              : ''}
                        </span>
                      </div>
                      {!v.dataRealizada &&
                        !['AUTUADO', 'ARQUIVADO', 'INDEFERIDO', 'CANCELADO', 'LICENCA_EMITIDA'].includes(
                          detalhe?.status
                        ) && (
                          <Button size="sm" variant="outline" onClick={() => setVistoriaRegistro(v)}>
                            Registrar resultado
                          </Button>
                        )}
                    </div>
                    {v.constatacoes && <p className="mt-1 text-gray-700">{v.constatacoes}</p>}
                  </div>
                ))}
              </div>
            )}

            {(detalhe?.autos || []).length > 0 && (
              <>
                <div className="font-medium mt-2">Autos de infração ({detalhe.autos.length})</div>
                <div className="space-y-2">
                  {detalhe.autos.map((a: any) => (
                    <div key={a.id} className="p-3 border rounded-lg border-red-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-700">{a.numero}</Badge>
                          {a.gravidade && <Badge variant="outline">{a.gravidade}</Badge>}
                          <Badge variant="secondary">{a.status}</Badge>
                        </div>
                        {a.valorMulta != null && (
                          <span className="text-sm font-medium">
                            R$ {Number(a.valorMulta).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                      {a.infratorNome && (
                        <div className="text-xs text-gray-500 mt-1">
                          {a.infratorNome}
                          {a.infratorDocumento && ` (${a.infratorDocumento})`}
                        </div>
                      )}
                      {a.descricao && <p className="mt-1 text-gray-700">{a.descricao}</p>}
                      {a.enquadramento && (
                        <p className="text-xs text-gray-500 mt-1">{a.enquadramento}</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="font-medium mt-2">Pareceres ({(detalhe?.pareceres || []).length})</div>
            {(detalhe?.pareceres || []).length === 0 ? (
              <p className="text-gray-500">Nenhum parecer registrado</p>
            ) : (
              <div className="space-y-2">
                {detalhe.pareceres.map((pa: any) => (
                  <div key={pa.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{pa.tipo}</Badge>
                        {pa.resultado && (
                          <Badge
                            className={
                              pa.resultado === 'FAVORAVEL'
                                ? 'bg-green-600'
                                : pa.resultado === 'DESFAVORAVEL'
                                  ? 'bg-red-600'
                                  : 'bg-orange-600'
                            }
                          >
                            {pa.resultado}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(pa.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {pa.texto && <p className="mt-1 text-gray-700">{pa.texto}</p>}
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
