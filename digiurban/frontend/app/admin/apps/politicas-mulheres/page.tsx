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
  HeartHandshake,
  Plus,
  ClipboardList,
  Lock,
  ShieldCheck,
  Users,
  Send,
  FileText,
  Check,
  RotateCcw,
} from 'lucide-react';

const STATUS_LABEL: Record<string, { label: string; className?: string }> = {
  ABERTO: { label: 'Aberto', className: 'bg-yellow-600' },
  EM_ACOMPANHAMENTO: { label: 'Em acompanhamento', className: 'bg-blue-600' },
  ENCERRADO: { label: 'Encerrado', className: 'bg-gray-600' },
};

const TIPO_LABEL: Record<string, string> = {
  VIOLENCIA_DOMESTICA: 'Violência doméstica',
  ASSEDIO: 'Assédio',
  ACOLHIMENTO: 'Acolhimento',
  MEDIDA_PROTETIVA: 'Medida protetiva',
  ACOMPANHAMENTO: 'Acompanhamento',
  OUTRO: 'Outro',
};

const RISCO_LABEL: Record<string, { label: string; className: string }> = {
  BAIXO: { label: 'Risco baixo', className: 'bg-gray-500' },
  MEDIO: { label: 'Risco médio', className: 'bg-yellow-600' },
  ALTO: { label: 'Risco alto', className: 'bg-orange-600' },
  IMINENTE: { label: 'Risco iminente', className: 'bg-red-700' },
};

const ATENDIMENTO_TIPOS: Record<string, string> = {
  ACOLHIMENTO: 'Acolhimento',
  PSICOLOGICO: 'Atendimento psicológico',
  JURIDICO: 'Atendimento jurídico',
  SOCIAL: 'Atendimento social',
  VISITA: 'Visita',
  CONTATO: 'Contato',
  NOTA: 'Nota interna',
};

const DESTINO_LABEL: Record<string, string> = {
  DEAM: 'DEAM / Delegacia da Mulher',
  CASA_ABRIGO: 'Casa abrigo',
  MEDIDA_PROTETIVA: 'Medida protetiva (Justiça)',
  DEFENSORIA: 'Defensoria Pública',
  MINISTERIO_PUBLICO: 'Ministério Público',
  CRAS_CREAS: 'CRAS / CREAS',
  SAUDE: 'Rede de saúde',
  OUTRO: 'Outro',
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

export default function PoliticasMulheresAppPage() {
  const { toast } = useToast();
  const [casos, setCasos] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('ATIVOS');
  const [busca, setBusca] = useState('');

  // Novo caso
  const [novoAberto, setNovoAberto] = useState(false);
  const [novo, setNovo] = useState({
    tipo: '',
    risco: 'MEDIO',
    nomeAtendida: '',
    telefoneSeguro: '',
    planoAcompanhamento: '',
  });

  // Detalhe (ficha)
  const [detalhe, setDetalhe] = useState<any>(null);

  // Atendimento
  const [atendimento, setAtendimento] = useState({ tipo: 'ACOLHIMENTO', relato: '' });
  const [registrandoAtendimento, setRegistrandoAtendimento] = useState(false);

  // Encaminhamento
  const [encaminhamento, setEncaminhamento] = useState({ destino: '', detalhes: '' });
  const [registrandoEncaminhamento, setRegistrandoEncaminhamento] = useState(false);

  // Equipe
  const [servidores, setServidores] = useState<any[]>([]);
  const [novoMembro, setNovoMembro] = useState('');

  // Plano
  const [editandoPlano, setEditandoPlano] = useState(false);
  const [plano, setPlano] = useState('');

  // Encerrar
  const [encerrandoCaso, setEncerrandoCaso] = useState<any>(null);
  const [motivoEncerramento, setMotivoEncerramento] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [casosData, statsData] = await Promise.all([
        api('/api/apps/politicas-mulheres/casos'),
        api('/api/apps/politicas-mulheres/casos/stats').catch(() => null),
      ]);
      setCasos(Array.isArray(casosData) ? casosData : []);
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao carregar casos:', error);
    } finally {
      setLoading(false);
    }
  };

  const carregarServidores = async () => {
    try {
      const data = await api('/api/admin/users').catch(() => null);
      const lista = Array.isArray(data) ? data : data?.data || data?.users || [];
      setServidores(Array.isArray(lista) ? lista : []);
    } catch {
      setServidores([]);
    }
  };

  const filtrados = useMemo(() => {
    let lista = casos;
    if (filtroStatus === 'ATIVOS') {
      lista = lista.filter((c) => c.status !== 'ENCERRADO');
    } else if (filtroStatus !== 'TODOS') {
      lista = lista.filter((c) => c.status === filtroStatus);
    }
    if (busca) {
      const termo = busca.toLowerCase();
      lista = lista.filter(
        (c) =>
          c.numero?.toLowerCase().includes(termo) ||
          (!c.acessoRestrito && c.nomeAtendida?.toLowerCase().includes(termo))
      );
    }
    return lista;
  }, [casos, filtroStatus, busca]);

  const totalRisco = (risco: string) =>
    stats?.ativosPorRisco?.find((r: any) => r.risco === risco)?.total || 0;

  const emAcompanhamento =
    (stats?.porStatus || [])
      .filter((s: any) => s.status !== 'ENCERRADO')
      .reduce((acc: number, s: any) => acc + s.total, 0) || 0;

  const criarCaso = async () => {
    if (!novo.tipo) {
      toast({ title: 'Selecione o tipo do caso', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/politicas-mulheres/casos', {
        method: 'POST',
        body: JSON.stringify(novo),
      });
      toast({ title: 'Caso aberto — você entrou na equipe do caso' });
      setNovoAberto(false);
      setNovo({ tipo: '', risco: 'MEDIO', nomeAtendida: '', telefoneSeguro: '', planoAcompanhamento: '' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const abrirFicha = async (c: any) => {
    try {
      const ficha = await api(`/api/apps/politicas-mulheres/casos/${c.id}`);
      setDetalhe(ficha);
      setPlano(ficha.planoAcompanhamento || '');
      setEditandoPlano(false);
      setAtendimento({ tipo: 'ACOLHIMENTO', relato: '' });
      setEncaminhamento({ destino: '', detalhes: '' });
      carregarServidores();
    } catch (error: any) {
      toast({
        title: 'Acesso restrito',
        description: String(error?.message || error),
        variant: 'destructive',
      });
    }
  };

  const recarregarFicha = async () => {
    if (!detalhe) return;
    try {
      setDetalhe(await api(`/api/apps/politicas-mulheres/casos/${detalhe.id}`));
    } catch {
      setDetalhe(null);
    }
    await loadData();
  };

  const registrarAtendimento = async () => {
    if (!detalhe || !atendimento.relato) return;
    setRegistrandoAtendimento(true);
    try {
      await api(`/api/apps/politicas-mulheres/casos/${detalhe.id}/atendimentos`, {
        method: 'POST',
        body: JSON.stringify(atendimento),
      });
      toast({ title: 'Atendimento registrado' });
      setAtendimento({ tipo: 'ACOLHIMENTO', relato: '' });
      await recarregarFicha();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setRegistrandoAtendimento(false);
    }
  };

  const registrarEncaminhamento = async () => {
    if (!detalhe || !encaminhamento.destino) return;
    setRegistrandoEncaminhamento(true);
    try {
      await api(`/api/apps/politicas-mulheres/casos/${detalhe.id}/encaminhamentos`, {
        method: 'POST',
        body: JSON.stringify(encaminhamento),
      });
      toast({ title: 'Encaminhamento registrado' });
      setEncaminhamento({ destino: '', detalhes: '' });
      await recarregarFicha();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setRegistrandoEncaminhamento(false);
    }
  };

  const atualizarEncaminhamento = async (encId: string, status: string) => {
    try {
      await api(`/api/apps/politicas-mulheres/encaminhamentos/${encId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await recarregarFicha();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const adicionarMembro = async () => {
    if (!detalhe || !novoMembro) return;
    try {
      await api(`/api/apps/politicas-mulheres/casos/${detalhe.id}/equipe`, {
        method: 'POST',
        body: JSON.stringify({ adicionar: [novoMembro] }),
      });
      toast({ title: 'Profissional adicionado à equipe' });
      setNovoMembro('');
      await recarregarFicha();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const removerMembro = async (userId: string) => {
    if (!detalhe) return;
    try {
      await api(`/api/apps/politicas-mulheres/casos/${detalhe.id}/equipe`, {
        method: 'POST',
        body: JSON.stringify({ remover: [userId] }),
      });
      await recarregarFicha();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const salvarPlano = async () => {
    if (!detalhe) return;
    try {
      await api(`/api/apps/politicas-mulheres/casos/${detalhe.id}`, {
        method: 'PUT',
        body: JSON.stringify({ planoAcompanhamento: plano }),
      });
      toast({ title: 'Plano de acompanhamento salvo' });
      setEditandoPlano(false);
      await recarregarFicha();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const encerrarCaso = async () => {
    if (!encerrandoCaso) return;
    setSalvando(true);
    try {
      await api(`/api/apps/politicas-mulheres/casos/${encerrandoCaso.id}/encerrar`, {
        method: 'POST',
        body: JSON.stringify({ motivo: motivoEncerramento }),
      });
      toast({ title: 'Caso encerrado' });
      setEncerrandoCaso(null);
      setMotivoEncerramento('');
      setDetalhe(null);
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const reabrirCaso = async (c: any) => {
    try {
      await api(`/api/apps/politicas-mulheres/casos/${c.id}/reabrir`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast({ title: 'Caso reaberto' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
            <HeartHandshake className="h-7 w-7 text-purple-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rede de Atendimento à Mulher</h1>
            <p className="text-gray-500 flex items-center gap-1">
              <Lock className="h-4 w-4" />
              Casos sigilosos — ficha visível apenas à equipe do caso; toda leitura é auditada
            </p>
          </div>
        </div>
        <Button onClick={() => setNovoAberto(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo caso
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Casos ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{emAcompanhamento}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risco alto / iminente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalRisco('ALTO') + totalRisco('IMINENTE')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Encaminhamentos abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats?.encaminhamentosAbertos ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Casos no ano</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{stats?.casosNoAno ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Buscar por número do caso (ou nome, se você estiver na equipe)..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1"
            />
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVOS">Ativos</SelectItem>
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
            Casos
            <Badge variant="secondary">{filtrados.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum caso encontrado</div>
          ) : (
            <div className="space-y-3">
              {filtrados.map((c: any) => {
                const badge = STATUS_LABEL[c.status] || { label: c.status };
                const risco = RISCO_LABEL[c.risco];
                return (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div
                      className={`flex-1 ${!c.acessoRestrito ? 'cursor-pointer' : ''}`}
                      onClick={() => !c.acessoRestrito && abrirFicha(c)}
                    >
                      <div className="font-medium flex items-center gap-2">
                        {c.numero}
                        <span className="text-gray-600 font-normal">
                          {TIPO_LABEL[c.tipo] || c.tipo}
                        </span>
                        {risco && <Badge className={risco.className}>{risco.label}</Badge>}
                        {c.acessoRestrito && (
                          <Badge variant="outline" className="text-gray-500">
                            <Lock className="h-3 w-3 mr-1" /> Acesso restrito
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {c.acessoRestrito
                          ? 'Ficha visível apenas à equipe do caso'
                          : c.nomeAtendida || 'Atendida não identificada'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Aberto em {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={badge.className}>{badge.label}</Badge>
                      {!c.acessoRestrito && c.status !== 'ENCERRADO' && (
                        <Button size="sm" variant="outline" onClick={() => abrirFicha(c)}>
                          <FileText className="h-4 w-4 mr-1" /> Ficha
                        </Button>
                      )}
                      {!c.acessoRestrito && c.status === 'ENCERRADO' && (
                        <Button size="sm" variant="outline" onClick={() => reabrirCaso(c)}>
                          <RotateCcw className="h-4 w-4 mr-1" /> Reabrir
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

      {/* Dialog novo caso */}
      <Dialog open={novoAberto} onOpenChange={setNovoAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-4 w-4" /> Novo caso sigiloso
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
              <div>
                <Label>Risco</Label>
                <Select value={novo.risco} onValueChange={(v) => setNovo({ ...novo, risco: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RISCO_LABEL).map(([valor, cfg]) => (
                      <SelectItem key={valor} value={valor}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome da atendida</Label>
                <Input
                  value={novo.nomeAtendida}
                  onChange={(e) => setNovo({ ...novo, nomeAtendida: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone seguro</Label>
                <Input
                  value={novo.telefoneSeguro}
                  onChange={(e) => setNovo({ ...novo, telefoneSeguro: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Plano de acompanhamento inicial</Label>
              <Textarea
                value={novo.planoAcompanhamento}
                onChange={(e) => setNovo({ ...novo, planoAcompanhamento: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-500">
              Você entrará automaticamente na equipe do caso. A ficha fica invisível para quem não
              é da equipe.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarCaso} disabled={salvando}>
              {salvando ? 'Abrindo...' : 'Abrir caso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog ficha do caso */}
      <Dialog open={!!detalhe} onOpenChange={(open) => !open && setDetalhe(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-600" />
              {detalhe?.numero} — {TIPO_LABEL[detalhe?.tipo] || detalhe?.tipo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={STATUS_LABEL[detalhe?.status]?.className}>
                {STATUS_LABEL[detalhe?.status]?.label || detalhe?.status}
              </Badge>
              {detalhe?.risco && RISCO_LABEL[detalhe.risco] && (
                <Badge className={RISCO_LABEL[detalhe.risco].className}>
                  {RISCO_LABEL[detalhe.risco].label}
                </Badge>
              )}
              <span className="text-xs text-gray-400">Leituras desta ficha são auditadas</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-500">Atendida:</span>{' '}
                <span className="font-medium">{detalhe?.nomeAtendida || '-'}</span>
              </div>
              <div>
                <span className="text-gray-500">Telefone seguro:</span>{' '}
                {detalhe?.telefoneSeguro || '-'}
              </div>
            </div>

            {/* Equipe do caso */}
            <div className="p-3 border rounded-lg">
              <div className="font-medium flex items-center gap-2 mb-2">
                <Users className="h-4 w-4" /> Equipe do caso ({(detalhe?.equipe || []).length})
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {(detalhe?.equipe || []).map((m: any) => (
                  <Badge key={m.id} variant="outline" className="flex items-center gap-1">
                    {m.name}
                    {detalhe?.status !== 'ENCERRADO' && m.id !== detalhe?.createdById && (
                      <button
                        className="ml-1 text-gray-400 hover:text-red-600"
                        onClick={() => removerMembro(m.id)}
                      >
                        ×
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {detalhe?.status !== 'ENCERRADO' && (
                <div className="flex gap-2">
                  <Select value={novoMembro} onValueChange={setNovoMembro}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Adicionar profissional..." />
                    </SelectTrigger>
                    <SelectContent>
                      {servidores
                        .filter((s) => !(detalhe?.equipe || []).some((m: any) => m.id === s.id))
                        .map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={adicionarMembro} disabled={!novoMembro}>
                    Adicionar
                  </Button>
                </div>
              )}
            </div>

            {/* Plano de acompanhamento */}
            <div className="p-3 border rounded-lg">
              <div className="font-medium flex items-center justify-between mb-2">
                Plano de acompanhamento
                {detalhe?.status !== 'ENCERRADO' && !editandoPlano && (
                  <Button size="sm" variant="outline" onClick={() => setEditandoPlano(true)}>
                    Editar
                  </Button>
                )}
              </div>
              {editandoPlano ? (
                <div className="space-y-2">
                  <Textarea value={plano} onChange={(e) => setPlano(e.target.value)} rows={3} />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditandoPlano(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={salvarPlano}>
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 whitespace-pre-line">
                  {detalhe?.planoAcompanhamento || 'Sem plano registrado'}
                </p>
              )}
            </div>

            {/* Encaminhamentos */}
            <div className="p-3 border rounded-lg space-y-2">
              <div className="font-medium flex items-center gap-2">
                <Send className="h-4 w-4" /> Encaminhamentos (
                {(detalhe?.encaminhamentos || []).length})
              </div>
              {(detalhe?.encaminhamentos || []).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between text-sm border-b pb-1">
                  <div>
                    <span className="font-medium">{DESTINO_LABEL[e.destino] || e.destino}</span>
                    {e.detalhes && <span className="text-gray-500"> — {e.detalhes}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        e.status === 'CONCLUIDO'
                          ? 'bg-green-600'
                          : e.status === 'CONFIRMADO'
                            ? 'bg-blue-600'
                            : 'bg-yellow-600'
                      }
                    >
                      {e.status}
                    </Badge>
                    {e.status !== 'CONCLUIDO' && detalhe?.status !== 'ENCERRADO' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          atualizarEncaminhamento(
                            e.id,
                            e.status === 'ENCAMINHADO' ? 'CONFIRMADO' : 'CONCLUIDO'
                          )
                        }
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {detalhe?.status !== 'ENCERRADO' && (
                <div className="flex gap-2 pt-1">
                  <Select
                    value={encaminhamento.destino}
                    onValueChange={(v) => setEncaminhamento({ ...encaminhamento, destino: v })}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Destino..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DESTINO_LABEL).map(([valor, label]) => (
                        <SelectItem key={valor} value={valor}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Detalhes"
                    value={encaminhamento.detalhes}
                    onChange={(e) =>
                      setEncaminhamento({ ...encaminhamento, detalhes: e.target.value })
                    }
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={registrarEncaminhamento}
                    disabled={registrandoEncaminhamento || !encaminhamento.destino}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Timeline de atendimentos */}
            <div className="p-3 border rounded-lg space-y-2">
              <div className="font-medium">
                Atendimentos ({(detalhe?.atendimentos || []).length})
              </div>
              {(detalhe?.atendimentos || []).map((a: any) => (
                <div key={a.id} className="border-b pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{ATENDIMENTO_TIPOS[a.tipo] || a.tipo}</Badge>
                    <span className="text-xs text-gray-400">
                      {new Date(a.createdAt).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  {a.relato && <p className="mt-1 text-gray-700">{a.relato}</p>}
                </div>
              ))}
              {detalhe?.status !== 'ENCERRADO' && (
                <div className="space-y-2 pt-1">
                  <div className="flex gap-2">
                    <Select
                      value={atendimento.tipo}
                      onValueChange={(v) => setAtendimento({ ...atendimento, tipo: v })}
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ATENDIMENTO_TIPOS).map(([valor, label]) => (
                          <SelectItem key={valor} value={valor}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea
                    placeholder="Relato do atendimento..."
                    value={atendimento.relato}
                    onChange={(e) => setAtendimento({ ...atendimento, relato: e.target.value })}
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={registrarAtendimento}
                      disabled={registrandoAtendimento || !atendimento.relato}
                    >
                      {registrandoAtendimento ? 'Registrando...' : 'Registrar atendimento'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            {detalhe?.status !== 'ENCERRADO' && (
              <Button variant="destructive" onClick={() => setEncerrandoCaso(detalhe)}>
                Encerrar caso
              </Button>
            )}
            <Button variant="outline" onClick={() => setDetalhe(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog encerrar */}
      <Dialog open={!!encerrandoCaso} onOpenChange={(open) => !open && setEncerrandoCaso(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Encerrar {encerrandoCaso?.numero}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Motivo do encerramento</Label>
            <Textarea
              value={motivoEncerramento}
              onChange={(e) => setMotivoEncerramento(e.target.value)}
            />
            {encerrandoCaso?.protocolId && (
              <p className="text-xs text-gray-500 mt-2">
                O protocolo de origem será concluído automaticamente.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEncerrandoCaso(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={encerrarCaso}
              disabled={salvando || !motivoEncerramento}
            >
              {salvando ? 'Encerrando...' : 'Encerrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
