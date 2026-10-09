'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Ban, Check, Clock, Inbox, Pill } from 'lucide-react';
import { FiltroPendentes, MotivoDialog, PedidoCard, StatusBadge, portalApi } from './shared';

const STATUS = {
  PENDENTE: { label: 'Aguardando', className: 'bg-yellow-600' },
  AGUARDANDO_ESTOQUE: { label: 'Em falta', className: 'bg-orange-600' },
  ENTREGUE: { label: 'Entregue', className: 'bg-green-600' },
  RECUSADA: { label: 'Não atendido', variant: 'destructive' },
};

const BASE = '/api/saude/farmacia/solicitacoes';
const ABERTOS = ['PENDENTE', 'AGUARDANDO_ESTOQUE'];

type Acao = { pedido: any; tipo: 'falta' | 'entregue' | 'recusar' };

/**
 * Pedidos de remédio feitos no portal. "Entregar" abre a dispensação já com o
 * cidadão e o remédio; ao registrar, o estoque baixa e o pedido é concluído.
 */
export function PedidosMedicamento() {
  const router = useRouter();
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [somentePendentes, setSomentePendentes] = useState(true);
  const [acao, setAcao] = useState<Acao | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await portalApi(BASE);
      setPedidos(Array.isArray(data) ? data : []);
    } catch {
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const visiveis = useMemo(
    () => (somentePendentes ? pedidos.filter((p) => ABERTOS.includes(p.status)) : pedidos),
    [pedidos, somentePendentes]
  );

  // Sem pedidos do portal a tela fica como sempre foi
  if (!loading && pedidos.length === 0) return null;

  const textos = {
    falta: {
      titulo: 'Remédio em falta',
      rotulo: 'Recado para o cidadão (opcional)',
      exemplo: 'Ex.: previsão de chegada na sexta-feira',
      confirmar: 'Avisar que está em falta',
      obrigatorio: false,
      destrutivo: false,
      caminho: 'aguardar',
      campo: 'mensagem',
      ok: 'Cidadão avisado. O pedido continua na fila.',
    },
    entregue: {
      titulo: 'Marcar como entregue (sem baixar o estoque)',
      rotulo: 'Observação (opcional)',
      exemplo: 'Ex.: retirado na farmácia do Estado',
      confirmar: 'Marcar entregue',
      obrigatorio: false,
      destrutivo: false,
      caminho: 'entregar',
      campo: 'observacao',
      ok: 'Pedido concluído. O cidadão foi avisado.',
    },
    recusar: {
      titulo: 'Não atender o pedido',
      rotulo: 'Motivo (o cidadão vai ler)',
      exemplo: 'Ex.: precisa de receita médica válida',
      confirmar: 'Não atender',
      obrigatorio: true,
      destrutivo: true,
      caminho: 'recusar',
      campo: 'motivo',
      ok: 'Pedido encerrado. O cidadão foi avisado.',
    },
  } as const;
  const cfg = acao ? textos[acao.tipo] : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          Pedidos de remédio feitos no portal
        </CardTitle>
        <FiltroPendentes somentePendentes={somentePendentes} onChange={setSomentePendentes} total={visiveis.length} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-gray-500">Carregando...</div>
        ) : visiveis.length === 0 ? (
          <div className="text-center py-6 text-gray-500">Nenhum pedido aguardando</div>
        ) : (
          <div className="space-y-3">
            {visiveis.map((p) => (
              <PedidoCard
                key={p.id}
                titulo={
                  <>
                    {p.medicamento}
                    {p.dosagem ? ` ${p.dosagem}` : ''}
                    {p.altoCusto && <Badge className="ml-2 bg-purple-600">Alto custo</Badge>}
                    {p.usoContinuo && (
                      <Badge variant="secondary" className="ml-2">
                        Uso contínuo
                      </Badge>
                    )}
                  </>
                }
                subtitulo={`${p.citizen?.name || 'Cidadão'}${p.citizen?.cpf ? ` · CPF ${p.citizen.cpf}` : ''}${p.citizen?.phone ? ` · ${p.citizen.phone}` : ''}`}
                detalhes={[
                  p.principioAtivo && `Princípio ativo: ${p.principioAtivo}`,
                  p.unidadePreferida && `Retirar em: ${p.unidadePreferida}`,
                  p.motivo && `Obs.: ${p.motivo}`,
                ]}
                protocolNumber={p.protocolNumber}
                criadoEm={p.createdAt}
                status={<StatusBadge status={p.status} map={STATUS} />}
                acoes={
                  ABERTOS.includes(p.status) && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => router.push(`/admin/apps/saude/farmacia/dispensacao/nova?solicitacao=${p.id}`)}
                      >
                        <Pill className="h-4 w-4 mr-1" /> Entregar
                      </Button>
                      {p.status === 'PENDENTE' && (
                        <Button size="sm" variant="outline" onClick={() => setAcao({ pedido: p, tipo: 'falta' })}>
                          <Clock className="h-4 w-4 mr-1" /> Em falta
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => setAcao({ pedido: p, tipo: 'entregue' })}>
                        <Check className="h-4 w-4 mr-1" /> Já entregue
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setAcao({ pedido: p, tipo: 'recusar' })}>
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

      {cfg && acao && (
        <MotivoDialog
          aberto
          titulo={`${cfg.titulo} — ${acao.pedido.medicamento}`}
          rotulo={cfg.rotulo}
          exemplo={cfg.exemplo}
          obrigatorio={cfg.obrigatorio}
          destrutivo={cfg.destrutivo}
          confirmar={cfg.confirmar}
          onClose={() => setAcao(null)}
          onConfirm={async (texto) => {
            try {
              await portalApi(`${BASE}/${acao.pedido.id}/${cfg.caminho}`, {
                method: 'POST',
                body: JSON.stringify({ [cfg.campo]: texto || undefined }),
              });
              toast({ title: cfg.ok });
              setAcao(null);
              await carregar();
            } catch (error: any) {
              toast({ title: 'Erro', description: String(error?.message || error), variant: 'destructive' });
            }
          }}
        />
      )}
    </Card>
  );
}
