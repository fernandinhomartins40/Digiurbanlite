'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Ban, CalendarPlus, Inbox } from 'lucide-react';
import { FiltroPendentes, MotivoDialog, PedidoCard, StatusBadge, portalApi } from './shared';

const STATUS = {
  PENDENTE: { label: 'Aguardando', className: 'bg-yellow-600' },
  AGENDADA: { label: 'Marcada', className: 'bg-green-600' },
  RECUSADA: { label: 'Não marcada', variant: 'destructive' },
};

const BASE = '/api/saude/agendamento/solicitacoes';

/**
 * Pedidos de consulta feitos no portal. "Marcar" entrega o pedido para a tela
 * de agendamento: a equipe escolhe profissional, dia e horário, e a consulta
 * marcada conclui o pedido do cidadão com dia, hora e local.
 */
export function PedidosConsulta({
  onMarcar,
  ativoId,
  refreshKey,
}: {
  onMarcar: (pedido: any) => void;
  /** Pedido que está sendo marcado agora (destaca o cartão) */
  ativoId?: string | null;
  /** Muda quando a tela marcou uma consulta: recarrega a fila */
  refreshKey?: number;
}) {
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [somentePendentes, setSomentePendentes] = useState(true);
  const [recusar, setRecusar] = useState<any>(null);

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
  }, [carregar, refreshKey]);

  const visiveis = useMemo(
    () => (somentePendentes ? pedidos.filter((p) => p.status === 'PENDENTE') : pedidos),
    [pedidos, somentePendentes]
  );

  // Sem pedidos do portal a tela fica como sempre foi
  if (!loading && pedidos.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          Pedidos de consulta feitos no portal
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
              <div key={p.id} className={ativoId === p.id ? 'ring-2 ring-blue-500 rounded-lg' : undefined}>
                <PedidoCard
                  titulo={`${p.citizen?.name || 'Cidadão'} — ${p.especialidade}`}
                  subtitulo={[p.citizen?.cpf && `CPF ${p.citizen.cpf}`, p.citizen?.phone].filter(Boolean).join(' · ') || undefined}
                  detalhes={[
                    p.unidadePreferida && `Prefere: ${p.unidadePreferida}`,
                    p.observacoes,
                    p.motivo && `Motivo: ${p.motivo}`,
                  ]}
                  protocolNumber={p.protocolNumber}
                  criadoEm={p.createdAt}
                  status={<StatusBadge status={p.status} map={STATUS} />}
                  acoes={
                    p.status === 'PENDENTE' && (
                      <>
                        <Button size="sm" onClick={() => onMarcar(p)}>
                          <CalendarPlus className="h-4 w-4 mr-1" /> Marcar
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setRecusar(p)}>
                          <Ban className="h-4 w-4 mr-1" /> Não marcar
                        </Button>
                      </>
                    )
                  }
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <MotivoDialog
        aberto={!!recusar}
        titulo={`Não marcar — ${recusar?.citizen?.name || ''}`}
        rotulo="Motivo (o cidadão vai ler)"
        exemplo="Ex.: essa especialidade é atendida só com encaminhamento da UBS"
        confirmar="Não marcar"
        onClose={() => setRecusar(null)}
        onConfirm={async (motivo) => {
          try {
            await portalApi(`${BASE}/${recusar.id}/recusar`, { method: 'POST', body: JSON.stringify({ motivo }) });
            toast({ title: 'Pedido encerrado. O cidadão foi avisado.' });
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
