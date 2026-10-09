'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { CidadaoSelector } from '@/components/apps/saude/CidadaoSelector';
import { Ban, Bus, Inbox } from 'lucide-react';
import { FiltroPendentes, MotivoDialog, PedidoCard, StatusBadge, portalApi } from './shared';

const STATUS = {
  PENDENTE: { label: 'Aguardando', className: 'bg-yellow-600' },
  ATENDIDA: { label: 'Na rota', className: 'bg-green-600' },
  INDEFERIDA: { label: 'Não atendido', variant: 'destructive' },
};

const BASE = '/api/apps/educacao/transporte/solicitacoes';

/** Pedidos de vaga no transporte escolar feitos no portal. */
export function TransporteEscolarPedidos({ rotas, onChanged, onCount }: { rotas: any[]; onChanged?: () => void; onCount?: (pendentes: number) => void }) {
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [somentePendentes, setSomentePendentes] = useState(true);
  const [atender, setAtender] = useState<any>(null);
  const [rotaId, setRotaId] = useState('');
  const [ponto, setPonto] = useState('');
  const [aluno, setAluno] = useState<any>(null);
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

  const abrirAtender = (pedido: any) => {
    setAtender(pedido);
    setRotaId('');
    setPonto(pedido.enderecoEmbarque || '');
    setAluno(null);
  };

  const confirmarAtender = async () => {
    if (!atender || !rotaId) return;
    if (!atender.alunoId && !aluno?.id) {
      toast({ title: 'Escolha o cadastro do aluno', variant: 'destructive' });
      return;
    }
    setSalvando(true);
    try {
      await portalApi(`${BASE}/${atender.id}/atender`, {
        method: 'POST',
        body: JSON.stringify({ rotaId, pontoEmbarque: ponto || undefined, alunoId: aluno?.id }),
      });
      toast({ title: 'Aluno colocado na rota. O responsável foi avisado.' });
      setAtender(null);
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
          Pedidos de vaga feitos no portal
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
                titulo={p.nomeAluno}
                subtitulo={`Responsável: ${p.citizen?.name || '-'}${p.citizen?.phone ? ` · ${p.citizen.phone}` : ''}`}
                detalhes={[
                  p.unidadeEscolar && `Escola: ${p.unidadeEscolar}`,
                  p.serie && `Série: ${p.serie}`,
                  p.turno && `Turno: ${p.turno}`,
                  p.enderecoEmbarque && `Embarque: ${p.enderecoEmbarque}`,
                  p.distanciaKm != null && `${p.distanciaKm} km da escola`,
                  p.veiculoAdaptado && 'Precisa de veículo adaptado',
                  !p.alunoId && 'Aluno sem cadastro ligado',
                  p.motivo && `Motivo: ${p.motivo}`,
                ]}
                protocolNumber={p.protocolNumber}
                criadoEm={p.createdAt}
                status={<StatusBadge status={p.status} map={STATUS} />}
                acoes={
                  p.status === 'PENDENTE' && (
                    <>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => abrirAtender(p)}>
                        <Bus className="h-4 w-4 mr-1" /> Colocar na rota
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setRecusar(p)}>
                        <Ban className="h-4 w-4 mr-1" /> Não atender
                      </Button>
                    </>
                  )
                }
              />
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!atender} onOpenChange={(open) => !open && setAtender(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Colocar {atender?.nomeAluno} na rota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!atender?.alunoId && (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  O pedido não achou o cadastro do aluno na família do responsável. Procure pelo nome ou CPF.
                </p>
                <CidadaoSelector label="Aluno" onSelect={setAluno} selectedCidadao={aluno} />
              </div>
            )}
            <div>
              <Label>Rota</Label>
              {rotas.length === 0 ? (
                <p className="text-sm text-orange-600">Nenhuma rota cadastrada. Crie a rota na aba Rotas.</p>
              ) : (
                <Select value={rotaId} onValueChange={setRotaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a rota" />
                  </SelectTrigger>
                  <SelectContent>
                    {rotas.map((r: any) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.nome} — {r.turno} (saída {r.horarioSaida})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label>Ponto de embarque</Label>
              <Input value={ponto} onChange={(e) => setPonto(e.target.value)} placeholder="Onde o aluno pega o ônibus" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAtender(null)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={confirmarAtender} disabled={salvando || !rotaId}>
              {salvando ? 'Salvando...' : 'Colocar na rota'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MotivoDialog
        aberto={!!recusar}
        titulo={`Não atender — ${recusar?.nomeAluno || ''}`}
        rotulo="Motivo (o responsável vai ler)"
        exemplo="Ex.: a casa fica a menos de 2 km da escola"
        confirmar="Não atender"
        onClose={() => setRecusar(null)}
        onConfirm={async (motivo) => {
          try {
            await portalApi(`${BASE}/${recusar.id}/indeferir`, { method: 'POST', body: JSON.stringify({ motivo }) });
            toast({ title: 'Pedido encerrado. O responsável foi avisado.' });
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
