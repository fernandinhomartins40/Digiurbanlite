'use client';

/**
 * Pedidos de sementes, mudas, adubo e calcário feitos no portal (2026-10-09).
 * "Entregar" baixa do estoque, registra a distribuição para o produtor e
 * encerra o pedido do cidadão; "Recusar" encerra com o motivo.
 */

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { FiltroPendentes, MotivoDialog, PedidoCard, StatusBadge, portalApi as api } from './shared';
import { Ban, PackageCheck } from 'lucide-react';

const BASE = '/api/agricultura/pedidos-insumos';
const STATUS = {
  AGUARDANDO: { label: 'Aguardando', className: 'bg-yellow-600' },
  ENTREGUE: { label: 'Entregue', className: 'bg-green-600' },
  RECUSADO: { label: 'Recusado', variant: 'secondary' },
};
export const TIPO_INSUMO: Record<string, string> = { SEMENTE: 'Semente', MUDA: 'Muda', ADUBO: 'Adubo', CALCARIO: 'Calcário', OUTRO: 'Outro' };

export function PedidosInsumos({ estoque, onMudou }: { estoque: any[]; onMudou?: () => void }) {
  const { toast } = useToast();
  const [itens, setItens] = useState<any[]>([]);
  const [somentePendentes, setSomentePendentes] = useState(true);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [entregar, setEntregar] = useState<{ pedido: any; estoqueId: string; quantidade: string } | null>(null);
  const [recusar, setRecusar] = useState<any>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await api(`${BASE}${somentePendentes ? '?pendentes=true' : ''}`);
      setItens(Array.isArray(lista) ? lista : []);
    } catch {
      setItens([]);
    } finally {
      setLoading(false);
    }
  }, [somentePendentes]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const executar = async (acao: () => Promise<unknown>, mensagem: string) => {
    setSalvando(true);
    try {
      await acao();
      toast({ title: mensagem });
      await carregar();
      onMudou?.();
      return true;
    } catch (error: any) {
      toast({ title: 'Não deu certo', description: String(error?.message || error), variant: 'destructive' });
      return false;
    } finally {
      setSalvando(false);
    }
  };

  /** Itens do estoque do mesmo tipo primeiro */
  const opcoes = (pedido: any) => [...estoque].filter((e) => e.quantidade > 0).sort((a, b) => Number(b.tipo === pedido.tipo) - Number(a.tipo === pedido.tipo));
  const escolhido = entregar ? estoque.find((e) => e.id === entregar.estoqueId) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Pedidos feitos no portal</CardTitle>
        <FiltroPendentes somentePendentes={somentePendentes} onChange={setSomentePendentes} total={itens.length} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Carregando...</div>
        ) : itens.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Nenhum pedido {somentePendentes ? 'aguardando' : 'encontrado'}</div>
        ) : (
          <div className="space-y-3">
            {itens.map((p) => (
              <PedidoCard
                key={p.id}
                titulo={
                  <>
                    {p.nome}
                    <Badge variant="outline" className="ml-2 font-normal">
                      {TIPO_INSUMO[p.tipo] || p.tipo}
                    </Badge>
                  </>
                }
                subtitulo={[p.item, p.quantidade && `Quantidade: ${p.quantidade}`, p.areaHectares && `${p.areaHectares} ha`].filter(Boolean).join(' · ')}
                detalhes={[p.finalidade, p.telefone && `Telefone: ${p.telefone}`, !p.produtorId && p.status === 'AGUARDANDO' && 'Ainda sem cadastro de produtor (será criado na entrega)', p.resposta]}
                protocolNumber={p.protocolNumber}
                criadoEm={p.createdAt}
                status={<StatusBadge status={p.status} map={STATUS} />}
                acoes={
                  p.status === 'AGUARDANDO' && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setEntregar({ pedido: p, estoqueId: opcoes(p)[0]?.id || '', quantidade: '' })}>
                        <PackageCheck className="h-4 w-4 mr-1" /> Entregar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRecusar(p)}>
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

      <Dialog open={!!entregar} onOpenChange={(open) => !open && setEntregar(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Entregar — {entregar?.pedido?.nome}</DialogTitle>
          </DialogHeader>
          {entregar && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Pediu: {[entregar.pedido.item || TIPO_INSUMO[entregar.pedido.tipo], entregar.pedido.quantidade].filter(Boolean).join(' — ')}
              </p>
              <div>
                <Label>Item do estoque</Label>
                <Select value={entregar.estoqueId} onValueChange={(v) => setEntregar({ ...entregar, estoqueId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoes(entregar.pedido).map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {[e.cultura, e.variedade].filter(Boolean).join(' ')} — {e.quantidade} {e.unidadeMedida} ({TIPO_INSUMO[e.tipo] || e.tipo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {opcoes(entregar.pedido).length === 0 && <p className="text-xs text-orange-600 mt-1">O estoque está vazio. Cadastre a entrada na aba Estoque.</p>}
              </div>
              <div>
                <Label>Quantidade entregue {escolhido ? `(${escolhido.unidadeMedida})` : ''}</Label>
                <Input type="number" min={0} step="0.1" value={entregar.quantidade} onChange={(e) => setEntregar({ ...entregar, quantidade: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEntregar(null)} disabled={salvando}>
              Voltar
            </Button>
            <Button
              disabled={salvando || !entregar?.estoqueId || !(Number(entregar?.quantidade) > 0)}
              onClick={async () => {
                if (
                  entregar &&
                  (await executar(
                    () => api(`${BASE}/${entregar.pedido.id}/entregar`, { method: 'POST', body: JSON.stringify({ estoqueId: entregar.estoqueId, quantidade: Number(entregar.quantidade) }) }),
                    'Entregue. O estoque foi baixado e o cidadão foi avisado.'
                  ))
                )
                  setEntregar(null);
              }}
            >
              Confirmar entrega
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MotivoDialog
        aberto={!!recusar}
        titulo={`Recusar — ${recusar?.nome || ''}`}
        rotulo="Motivo (o cidadão vai ler no pedido)"
        exemplo="Ex.: a distribuição de calcário deste ano já foi encerrada"
        confirmar="Recusar"
        onClose={() => setRecusar(null)}
        onConfirm={async (mensagem) => {
          if (await executar(() => api(`${BASE}/${recusar.id}/recusar`, { method: 'POST', body: JSON.stringify({ mensagem }) }), 'Recusado. O cidadão foi avisado.')) setRecusar(null);
        }}
      />
    </Card>
  );
}
