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
import { useToast } from '@/components/ui/use-toast';
import {
  listarTransferencias,
  criarTransferencia,
  confirmarTransferencia,
  recusarTransferencia,
  cancelarTransferencia,
  listarUnidadesSaude,
  listarEstoque,
} from '@/lib/api/farmacia-api';
import { ArrowLeftRight, Plus, Check, X, Ban } from 'lucide-react';

type Transferencia = {
  id: string;
  quantidade: number;
  motivo?: string | null;
  status: string;
  dataSolicitacao?: string;
  dataConfirmacao?: string | null;
  medicamento?: { nome?: string } | null;
  unidadeOrigem?: { nome?: string } | null;
  unidadeDestino?: { nome?: string } | null;
};

const STATUS_BADGE: Record<string, { label: string; className?: string; variant?: any }> = {
  PENDENTE: { label: 'Pendente', className: 'bg-yellow-600' },
  APROVADA: { label: 'Aprovada', className: 'bg-green-600' },
  REJEITADA: { label: 'Recusada', variant: 'destructive' },
  CANCELADA: { label: 'Cancelada', variant: 'secondary' },
  CONCLUIDA: { label: 'Concluída', className: 'bg-green-700' },
};

export default function TransferenciasPage() {
  const { toast } = useToast();
  const [transferencias, setTransferencias] = useState<Transferencia[]>([]);
  const [unidades, setUnidades] = useState<any[]>([]);
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [loading, setLoading] = useState(true);

  // Nova transferência
  const [novaAberta, setNovaAberta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [origemId, setOrigemId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [medicamentoId, setMedicamentoId] = useState('');
  const [medicamentosOrigem, setMedicamentosOrigem] = useState<any[]>([]);
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');

  useEffect(() => {
    listarUnidadesSaude()
      .then(setUnidades)
      .catch(() => setUnidades([]));
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!origemId) {
      setMedicamentosOrigem([]);
      return;
    }
    listarEstoque(origemId)
      .then((data: any[]) => setMedicamentosOrigem(Array.isArray(data) ? data : []))
      .catch(() => setMedicamentosOrigem([]));
  }, [origemId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await listarTransferencias();
      setTransferencias(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar transferências:', error);
    } finally {
      setLoading(false);
    }
  };

  const listaFiltrada = useMemo(() => {
    if (filtroStatus === 'TODOS') return transferencias;
    return transferencias.filter((t) => t.status === filtroStatus);
  }, [transferencias, filtroStatus]);

  const pendentes = transferencias.filter((t) => t.status === 'PENDENTE').length;

  const criarNova = async () => {
    if (!origemId || !destinoId || !medicamentoId || !quantidade) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    if (origemId === destinoId) {
      toast({ title: 'Origem e destino devem ser diferentes', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await criarTransferencia({
        medicamentoId,
        unidadeOrigemId: origemId,
        unidadeDestinoId: destinoId,
        quantidade: parseInt(quantidade, 10),
        solicitadoPor: '',
        motivo,
      });
      toast({ title: 'Transferência solicitada' });
      setNovaAberta(false);
      setOrigemId('');
      setDestinoId('');
      setMedicamentoId('');
      setQuantidade('');
      setMotivo('');
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao solicitar transferência',
        description: String(error?.message || error),
        variant: 'destructive',
      });
    } finally {
      setSalvando(false);
    }
  };

  const executar = async (
    id: string,
    acao: 'confirmar' | 'recusar' | 'cancelar'
  ) => {
    try {
      if (acao === 'confirmar') await confirmarTransferencia(id, { aprovadoPor: '' });
      if (acao === 'recusar') await recusarTransferencia(id);
      if (acao === 'cancelar') await cancelarTransferencia(id);
      toast({ title: 'Transferência atualizada' });
      await loadData();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar transferência',
        description: String(error?.message || error),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transferências entre Unidades</h1>
          <p className="text-gray-500 mt-1">
            Solicite e acompanhe movimentações de medicamentos entre unidades de saúde
          </p>
        </div>
        <Button onClick={() => setNovaAberta(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova transferência
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transferencias.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes de aprovação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendentes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Aprovadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {transferencias.filter((t) => t.status === 'APROVADA' || t.status === 'CONCLUIDA').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Transferências
              <Badge variant="secondary">{listaFiltrada.length}</Badge>
            </CardTitle>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="PENDENTE">Pendentes</SelectItem>
                <SelectItem value="APROVADA">Aprovadas</SelectItem>
                <SelectItem value="REJEITADA">Recusadas</SelectItem>
                <SelectItem value="CANCELADA">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Carregando transferências...</div>
          ) : listaFiltrada.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhuma transferência encontrada</div>
          ) : (
            <div className="space-y-3">
              {listaFiltrada.map((t) => {
                const badge = STATUS_BADGE[t.status] || { label: t.status };
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{t.medicamento?.nome || 'Medicamento'}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {t.unidadeOrigem?.nome || 'Origem'} → {t.unidadeDestino?.nome || 'Destino'}
                      </div>
                      {t.motivo && (
                        <div className="text-xs text-gray-400 mt-1">Motivo: {t.motivo}</div>
                      )}
                      {t.dataSolicitacao && (
                        <div className="text-xs text-gray-400 mt-1">
                          Solicitada em {new Date(t.dataSolicitacao).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold">{t.quantidade}</div>
                        <div className="text-xs text-gray-500">unidades</div>
                      </div>
                      <Badge variant={badge.variant} className={badge.className}>
                        {badge.label}
                      </Badge>
                      {t.status === 'PENDENTE' && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => executar(t.id, 'confirmar')}
                          >
                            <Check className="h-4 w-4 mr-1" /> Aprovar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => executar(t.id, 'recusar')}
                          >
                            <X className="h-4 w-4 mr-1" /> Recusar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => executar(t.id, 'cancelar')}
                          >
                            <Ban className="h-4 w-4 mr-1" /> Cancelar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog nova transferência */}
      <Dialog open={novaAberta} onOpenChange={setNovaAberta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova transferência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Unidade de origem</Label>
              <Select value={origemId} onValueChange={setOrigemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
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
            <div>
              <Label>Unidade de destino</Label>
              <Select value={destinoId} onValueChange={setDestinoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o destino" />
                </SelectTrigger>
                <SelectContent>
                  {unidades
                    .filter((u: any) => u.id !== origemId)
                    .map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Medicamento (do estoque da origem)</Label>
              <Select
                value={medicamentoId}
                onValueChange={setMedicamentoId}
                disabled={!origemId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={origemId ? 'Selecione o medicamento' : 'Escolha a origem primeiro'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {medicamentosOrigem.map((item: any) => (
                    <SelectItem
                      key={item.medicamentoId || item.id}
                      value={item.medicamentoId || item.id}
                    >
                      {item.medicamento?.nome || item.medicamento || item.nome}
                      {typeof item.quantidadeAtual === 'number' &&
                        ` (${item.quantidadeAtual} disp.)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="qtd-transf">Quantidade</Label>
              <Input
                id="qtd-transf"
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="motivo-transf">Motivo</Label>
              <Input
                id="motivo-transf"
                placeholder="Ex.: reposição de estoque da UBS Central"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovaAberta(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={criarNova} disabled={salvando}>
              {salvando ? 'Enviando...' : 'Solicitar transferência'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
