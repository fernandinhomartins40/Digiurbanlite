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
  Wrench,
  Plus,
  Send,
  Play,
  Check,
  Ban,
  Clock,
  AlertTriangle,
  ClipboardList,
} from 'lucide-react';

const STATUS_LABEL: Record<string, { label: string; className?: string }> = {
  ABERTA: { label: 'Aberta (triagem)', className: 'bg-yellow-600' },
  DESPACHADA: { label: 'Despachada', className: 'bg-blue-600' },
  EM_EXECUCAO: { label: 'Em execução', className: 'bg-indigo-600' },
  CONCLUIDA: { label: 'Concluída', className: 'bg-green-600' },
  CANCELADA: { label: 'Cancelada', className: 'bg-gray-600' },
};

const PRIORIDADE_LABEL: Record<string, { label: string; className?: string }> = {
  BAIXA: { label: 'Baixa', className: 'bg-gray-500' },
  NORMAL: { label: 'Normal', className: 'bg-blue-500' },
  ALTA: { label: 'Alta', className: 'bg-orange-600' },
  URGENTE: { label: 'Urgente', className: 'bg-red-600' },
};

const TIPOS_OS = [
  'Iluminação Pública',
  'Buraco na via',
  'Poda de árvore',
  'Limpeza urbana',
  'Coleta de entulho',
  'Drenagem/Boca de lobo',
  'Sinalização',
  'Praças e jardins',
  'Outros',
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

export default function OrdensServicoPage() {
  const { toast } = useToast();
  const [ordens, setOrdens] = useState<any[]>([]);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [filtroStatus, setFiltroStatus] = useState('ATIVAS');
  const [busca, setBusca] = useState('');

  // Nova OS
  const [novaAberta, setNovaAberta] = useState(false);
  const [novaOS, setNovaOS] = useState({
    tipo: '',
    descricao: '',
    prioridade: 'NORMAL',
    endereco: '',
    bairro: '',
  });

  // Despacho
  const [osDespacho, setOsDespacho] = useState<any>(null);
  const [equipeId, setEquipeId] = useState('');
  const [obsDespacho, setObsDespacho] = useState('');

  // Conclusão
  const [osConclusao, setOsConclusao] = useState<any>(null);
  const [conclusao, setConclusao] = useState({ descricao: '', horas: '' });

  // Cancelamento
  const [osCancelamento, setOsCancelamento] = useState<any>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');

  // Detalhe
  const [osDetalhe, setOsDetalhe] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordensData, statsData, equipesData] = await Promise.all([
        api('/api/apps/servicos-publicos/os'),
        api('/api/apps/servicos-publicos/os/stats').catch(() => null),
        api('/api/apps/servicos-publicos/equipes').catch(() => []),
      ]);
      setOrdens(Array.isArray(ordensData) ? ordensData : []);
      setStats(statsData);
      setEquipes(Array.isArray(equipesData) ? equipesData : []);
    } catch (error) {
      console.error('Erro ao carregar OS:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtradas = useMemo(() => {
    let lista = ordens;
    if (filtroStatus === 'ATIVAS') {
      lista = lista.filter((o) => !['CONCLUIDA', 'CANCELADA'].includes(o.status));
    } else if (filtroStatus !== 'TODAS') {
      lista = lista.filter((o) => o.status === filtroStatus);
    }
    if (busca) {
      const termo = busca.toLowerCase();
      lista = lista.filter(
        (o) =>
          o.numero?.toLowerCase().includes(termo) ||
          o.tipo?.toLowerCase().includes(termo) ||
          o.bairro?.toLowerCase().includes(termo) ||
          o.endereco?.toLowerCase().includes(termo)
      );
    }
    return lista;
  }, [ordens, filtroStatus, busca]);

  const totalPorStatus = (status: string) =>
    stats?.porStatus?.find((s: any) => s.status === status)?.total || 0;

  const criarOS = async () => {
    if (!novaOS.tipo) {
      toast({ title: 'Selecione o tipo de serviço', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api('/api/apps/servicos-publicos/os', {
        method: 'POST',
        body: JSON.stringify(novaOS),
      });
      toast({ title: 'Ordem de serviço criada' });
      setNovaAberta(false);
      setNovaOS({ tipo: '', descricao: '', prioridade: 'NORMAL', endereco: '', bairro: '' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const despachar = async () => {
    if (!osDespacho || !equipeId) {
      toast({ title: 'Selecione a equipe', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await api(`/api/apps/servicos-publicos/os/${osDespacho.id}/despachar`, {
        method: 'POST',
        body: JSON.stringify({ equipeId, observacoes: obsDespacho }),
      });
      toast({ title: 'OS despachada' });
      setOsDespacho(null);
      setEquipeId('');
      setObsDespacho('');
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const acaoSimples = async (os: any, rota: string, body: any = {}) => {
    try {
      await api(`/api/apps/servicos-publicos/os/${os.id}/${rota}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast({ title: 'Situação atualizada' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    }
  };

  const concluirOS = async () => {
    if (!osConclusao) return;
    setSalvando(true);
    try {
      await api(`/api/apps/servicos-publicos/os/${osConclusao.id}/concluir`, {
        method: 'POST',
        body: JSON.stringify({
          descricao: conclusao.descricao,
          horas: conclusao.horas ? Number(conclusao.horas) : undefined,
        }),
      });
      toast({ title: 'OS concluída' });
      setOsConclusao(null);
      setConclusao({ descricao: '', horas: '' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const cancelarOS = async () => {
    if (!osCancelamento) return;
    setSalvando(true);
    try {
      await api(`/api/apps/servicos-publicos/os/${osCancelamento.id}/cancelar`, {
        method: 'POST',
        body: JSON.stringify({ motivo: motivoCancelamento }),
      });
      toast({ title: 'OS cancelada' });
      setOsCancelamento(null);
      setMotivoCancelamento('');
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  const abrirDetalhe = async (os: any) => {
    try {
      const detalhe = await api(`/api/apps/servicos-publicos/os/${os.id}`);
      setOsDetalhe(detalhe);
    } catch {
      setOsDetalhe(os);
    }
  };

  const acoesOS = (os: any) => {
    switch (os.status) {
      case 'ABERTA':
        return (
          <div className="flex gap-1">
            <Button size="sm" onClick={() => setOsDespacho(os)}>
              <Send className="h-4 w-4 mr-1" /> Despachar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOsCancelamento(os)}>
              <Ban className="h-4 w-4" />
            </Button>
          </div>
        );
      case 'DESPACHADA':
        return (
          <Button size="sm" onClick={() => acaoSimples(os, 'iniciar')}>
            <Play className="h-4 w-4 mr-1" /> Iniciar execução
          </Button>
        );
      case 'EM_EXECUCAO':
        return (
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setOsConclusao(os)}
          >
            <Check className="h-4 w-4 mr-1" /> Concluir
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
          <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
            <Wrench className="h-7 w-7 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ordens de Serviço</h1>
            <p className="text-gray-500">
              Triagem → despacho para equipe → execução → conclusão
            </p>
          </div>
        </div>
        <Button onClick={() => setNovaAberta(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova OS
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Na triagem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{totalPorStatus('ABERTA')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Despachadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalPorStatus('DESPACHADA')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {totalPorStatus('EM_EXECUCAO')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalPorStatus('CONCLUIDA')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Fora do prazo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.atrasadas ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {stats?.backlogPorBairro?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Backlog por bairro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.backlogPorBairro.map((b: any) => (
                <Badge key={b.bairro} variant="secondary" className="text-sm">
                  {b.bairro}: {b.total}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Buscar por número, tipo, bairro ou endereço..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="flex-1"
            />
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVAS">Ativas (fila de trabalho)</SelectItem>
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
            Fila de despacho
            <Badge variant="secondary">{filtradas.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : filtradas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma ordem de serviço</div>
          ) : (
            <div className="space-y-3">
              {filtradas.map((os: any) => {
                const statusBadge = STATUS_LABEL[os.status] || { label: os.status };
                const prioridadeBadge = PRIORIDADE_LABEL[os.prioridade] || { label: os.prioridade };
                const atrasada =
                  os.slaPrazo &&
                  !['CONCLUIDA', 'CANCELADA'].includes(os.status) &&
                  new Date(os.slaPrazo) < new Date();
                return (
                  <div
                    key={os.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1 cursor-pointer" onClick={() => abrirDetalhe(os)}>
                      <div className="font-medium flex items-center gap-2">
                        {os.numero}
                        <span className="text-gray-600 font-normal">{os.tipo}</span>
                        <Badge className={prioridadeBadge.className}>
                          {prioridadeBadge.label}
                        </Badge>
                        {atrasada && (
                          <Badge className="bg-red-600">
                            <Clock className="h-3 w-3 mr-1" /> Atrasada
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {[os.endereco, os.bairro].filter(Boolean).join(' — ') || 'Sem endereço'}
                        {os.equipe && ` | Equipe: ${os.equipe.nome}`}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Aberta em {new Date(os.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                      {acoesOS(os)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog nova OS */}
      <Dialog open={novaAberta} onOpenChange={setNovaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova ordem de serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de serviço</Label>
                <Select
                  value={novaOS.tipo}
                  onValueChange={(v) => setNovaOS({ ...novaOS, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_OS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioridade</Label>
                <Select
                  value={novaOS.prioridade}
                  onValueChange={(v) => setNovaOS({ ...novaOS, prioridade: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORIDADE_LABEL).map(([valor, cfg]) => (
                      <SelectItem key={valor} value={valor}>
                        {cfg.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={novaOS.descricao}
                onChange={(e) => setNovaOS({ ...novaOS, descricao: e.target.value })}
                placeholder="Descreva o problema/serviço"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Endereço</Label>
                <Input
                  value={novaOS.endereco}
                  onChange={(e) => setNovaOS({ ...novaOS, endereco: e.target.value })}
                />
              </div>
              <div>
                <Label>Bairro</Label>
                <Input
                  value={novaOS.bairro}
                  onChange={(e) => setNovaOS({ ...novaOS, bairro: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarOS} disabled={salvando}>
              {salvando ? 'Criando...' : 'Criar OS'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog despacho */}
      <Dialog open={!!osDespacho} onOpenChange={(open) => !open && setOsDespacho(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Despachar {osDespacho?.numero} — {osDespacho?.tipo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Equipe de campo</Label>
              <Select value={equipeId} onValueChange={setEquipeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a equipe" />
                </SelectTrigger>
                <SelectContent>
                  {equipes.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome}
                      {e._count?.membros ? ` (${e._count.membros} membros)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {equipes.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Nenhuma equipe cadastrada na secretaria. Cadastre equipes no Organograma.
                </p>
              )}
            </div>
            <div>
              <Label>Orientações para a equipe</Label>
              <Textarea value={obsDespacho} onChange={(e) => setObsDespacho(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOsDespacho(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={despachar} disabled={salvando || !equipeId}>
              {salvando ? 'Despachando...' : 'Despachar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog conclusão */}
      <Dialog open={!!osConclusao} onOpenChange={(open) => !open && setOsConclusao(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Concluir {osConclusao?.numero}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>O que foi executado</Label>
              <Textarea
                value={conclusao.descricao}
                onChange={(e) => setConclusao({ ...conclusao, descricao: e.target.value })}
              />
            </div>
            <div>
              <Label>Horas trabalhadas</Label>
              <Input
                type="number"
                min={0}
                step="0.5"
                value={conclusao.horas}
                onChange={(e) => setConclusao({ ...conclusao, horas: e.target.value })}
              />
            </div>
            {osConclusao?.protocolId && (
              <p className="text-xs text-gray-500">
                O protocolo de origem será concluído automaticamente.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOsConclusao(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={concluirOS}
              disabled={salvando}
            >
              {salvando ? 'Concluindo...' : 'Concluir OS'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog cancelamento */}
      <Dialog open={!!osCancelamento} onOpenChange={(open) => !open && setOsCancelamento(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar {osCancelamento?.numero}</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Motivo do cancelamento</Label>
            <Textarea
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOsCancelamento(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={cancelarOS}
              disabled={salvando || !motivoCancelamento}
            >
              {salvando ? 'Cancelando...' : 'Cancelar OS'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog detalhe */}
      <Dialog open={!!osDetalhe} onOpenChange={(open) => !open && setOsDetalhe(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {osDetalhe?.numero} — {osDetalhe?.tipo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge className={STATUS_LABEL[osDetalhe?.status]?.className}>
                {STATUS_LABEL[osDetalhe?.status]?.label || osDetalhe?.status}
              </Badge>
              <Badge className={PRIORIDADE_LABEL[osDetalhe?.prioridade]?.className}>
                {PRIORIDADE_LABEL[osDetalhe?.prioridade]?.label || osDetalhe?.prioridade}
              </Badge>
            </div>
            {osDetalhe?.descricao && <p className="text-gray-700">{osDetalhe.descricao}</p>}
            <div className="text-gray-500">
              {[osDetalhe?.endereco, osDetalhe?.bairro].filter(Boolean).join(' — ') ||
                'Sem endereço'}
            </div>
            {osDetalhe?.equipe && (
              <div>
                <span className="text-gray-500">Equipe:</span>{' '}
                <span className="font-medium">{osDetalhe.equipe.nome}</span>
              </div>
            )}
            {osDetalhe?.protocolId && (
              <div>
                <span className="text-gray-500">Protocolo de origem:</span>{' '}
                <span className="font-mono text-xs">{osDetalhe.protocolId}</span>
              </div>
            )}
            <div className="font-medium mt-2">
              Histórico ({(osDetalhe?.apontamentos || []).length})
            </div>
            {(osDetalhe?.apontamentos || []).length === 0 ? (
              <p className="text-gray-500">Sem apontamentos registrados</p>
            ) : (
              <div className="space-y-2">
                {osDetalhe.apontamentos.map((a: any) => (
                  <div key={a.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{a.tipo}</Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(a.createdAt).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    {a.descricao && <p className="mt-1 text-gray-700">{a.descricao}</p>}
                    {a.horas != null && (
                      <p className="text-xs text-gray-500 mt-1">{a.horas}h trabalhadas</p>
                    )}
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
