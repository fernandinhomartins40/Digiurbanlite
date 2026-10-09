'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Ban, Check, Inbox } from 'lucide-react';
import { FiltroPendentes, MotivoDialog, PedidoCard, StatusBadge, fmtData, portalApi } from './shared';

const STATUS = {
  PENDENTE: { label: 'Aguardando', className: 'bg-yellow-600' },
  APROVADA: { label: 'Aprovada', className: 'bg-green-600' },
  RECUSADA: { label: 'Recusada', variant: 'destructive' },
};

const TIPO: Record<string, string> = { RENOVACAO: 'Renovação', TRANSFERENCIA_PONTO: 'Troca de ponto' };
const BASE = '/api/apps/transportes-transito/alteracoes';

/** Renovações e trocas de ponto pedidas no portal (credencial que já existe). */
export function AlteracoesCredencialPedidos({ credenciais, onChanged, onCount }: { credenciais: any[]; onChanged?: () => void; onCount?: (pendentes: number) => void }) {
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [somentePendentes, setSomentePendentes] = useState(true);
  const [aprovar, setAprovar] = useState<any>(null);
  const [credencialId, setCredencialId] = useState('');
  const [recusar, setRecusar] = useState<any>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await portalApi(BASE);
      const lista = Array.isArray(data) ? data : [];
      setPedidos(lista);
      onCount?.(lista.filter((p: any) => p.status === 'PENDENTE').length);
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [onCount]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const visiveis = useMemo(
    () => (somentePendentes ? pedidos.filter((p) => p.status === 'PENDENTE') : pedidos),
    [pedidos, somentePendentes]
  );
  const ativas = useMemo(() => credenciais.filter((c) => ['ATIVA', 'SUSPENSA'].includes(c.status)), [credenciais]);

  const confirmarAprovar = async () => {
    if (!aprovar) return;
    const id = aprovar.credencialId || credencialId;
    if (!id) {
      toast({ title: 'Escolha a credencial', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await portalApi(`${BASE}/${aprovar.id}/aprovar`, { method: 'POST', body: JSON.stringify({ credencialId: id }) });
      toast({ title: aprovar.tipo === 'RENOVACAO' ? 'Credencial renovada. O titular foi avisado.' : 'Ponto trocado. O titular foi avisado.' });
      setAprovar(null);
      await carregar();
      onChanged?.();
    } catch (error: any) {
      toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          Renovações e trocas de ponto pedidas no portal
        </CardTitle>
        <FiltroPendentes somentePendentes={somentePendentes} onChange={setSomentePendentes} total={visiveis.length} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : visiveis.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum pedido {somentePendentes ? 'aguardando' : 'encontrado'}</div>
        ) : (
          <div className="space-y-3">
            {visiveis.map((p) => (
              <PedidoCard
                key={p.id}
                titulo={`${TIPO[p.tipo] || p.tipo} — ${p.credencial?.titularNome || p.citizen?.name || 'Titular'}`}
                subtitulo={
                  p.credencial
                    ? `Credencial ${p.credencial.numeroCredencial || '(sem número)'} · placa ${p.credencial.veiculoPlaca || '-'} · vale até ${fmtData(p.credencial.validade)}`
                    : `Credencial não encontrada (informado: ${p.numeroInformado || '-'}${p.placa ? `, placa ${p.placa}` : ''})`
                }
                detalhes={[
                  p.tipo === 'TRANSFERENCIA_PONTO' && `De: ${p.pontoAtual || p.credencial?.ponto || '-'}`,
                  p.tipo === 'TRANSFERENCIA_PONTO' && `Para: ${p.pontoDesejado || '-'}`,
                  p.motivo && `Motivo: ${p.motivo}`,
                  p.motivoDecisao && `Resposta: ${p.motivoDecisao}`,
                ]}
                protocolNumber={p.protocolNumber}
                criadoEm={p.createdAt}
                status={<StatusBadge status={p.status} map={STATUS} />}
                acoes={
                  p.status === 'PENDENTE' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          setCredencialId('');
                          setAprovar(p);
                        }}
                      >
                        <Check className="h-4 w-4 mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setRecusar(p)}>
                        <Ban className="h-4 w-4 mr-1" /> Recusar
                      </Button>
                    </>
                  )
                }
              />
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!aprovar} onOpenChange={(open) => !open && setAprovar(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Aprovar {aprovar ? (TIPO[aprovar.tipo] || '').toLowerCase() : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            {aprovar?.credencialId ? (
              <p>
                {aprovar.tipo === 'RENOVACAO'
                  ? `A credencial ${aprovar.credencial?.numeroCredencial || ''} ganha mais 12 meses de validade a partir de hoje.`
                  : `A credencial ${aprovar.credencial?.numeroCredencial || ''} passa a valer no ponto "${aprovar.pontoDesejado}".`}
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-gray-600">
                  O número/placa informados não bateram com nenhuma credencial. Escolha a credencial certa:
                </p>
                <Label>Credencial</Label>
                <Select value={credencialId} onValueChange={setCredencialId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ativas.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.numeroCredencial || 'sem número'} — {c.titularNome || '-'} ({c.veiculoPlaca || '-'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAprovar(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={confirmarAprovar} disabled={salvando || (!aprovar?.credencialId && !credencialId)}>
              {salvando ? 'Salvando...' : 'Aprovar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MotivoDialog
        aberto={!!recusar}
        titulo={`Recusar ${recusar ? (TIPO[recusar.tipo] || '').toLowerCase() : ''}`}
        rotulo="Motivo (o titular vai ler)"
        exemplo="Ex.: vistoria do veículo vencida"
        confirmar="Recusar"
        onClose={() => setRecusar(null)}
        onConfirm={async (motivo) => {
          try {
            await portalApi(`${BASE}/${recusar.id}/recusar`, { method: 'POST', body: JSON.stringify({ motivo }) });
            toast({ title: 'Pedido recusado. O titular foi avisado.' });
            setRecusar(null);
            await carregar();
          } catch (error: any) {
            toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
          }
        }}
      />
    </Card>
  );
}
