'use client';

/**
 * Peças comuns das filas "Pedidos do portal" dentro dos apps (Fase 1 da
 * auditoria de 2026-10-08): o pedido que o cidadão fez no portal/assistente
 * aparece aqui para a equipe decidir, e a decisão volta ao pedido dele.
 */

import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export async function portalApi(path: string, init?: RequestInit) {
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

export const fmtData = (value?: string | Date | null) => (value ? new Date(value).toLocaleDateString('pt-BR') : '-');

export function StatusBadge({ status, map }: { status: string; map: Record<string, { label: string; className?: string; variant?: any }> }) {
  const cfg = map[status] || { label: status, variant: 'secondary' };
  return (
    <Badge variant={cfg.variant} className={cfg.className}>
      {cfg.label}
    </Badge>
  );
}

/** Cartão de um pedido: quem pediu, número do pedido, resumo e ações. */
export function PedidoCard({
  titulo,
  subtitulo,
  detalhes,
  protocolNumber,
  criadoEm,
  status,
  acoes,
}: {
  titulo: ReactNode;
  subtitulo?: ReactNode;
  detalhes?: Array<string | false | null | undefined>;
  protocolNumber?: string | null;
  criadoEm?: string;
  status: ReactNode;
  acoes?: ReactNode;
}) {
  const linhas = (detalhes || []).filter(Boolean) as string[];
  return (
    <div className="flex flex-col gap-3 p-4 border rounded-lg hover:bg-gray-50 md:flex-row md:items-center md:justify-between">
      <div className="flex-1 min-w-0">
        <div className="font-medium">
          {titulo}
          {protocolNumber && (
            <Badge variant="outline" className="ml-2 font-normal">
              Pedido {protocolNumber}
            </Badge>
          )}
        </div>
        {subtitulo && <div className="text-sm text-gray-500 mt-1">{subtitulo}</div>}
        {linhas.length > 0 && <div className="text-xs text-gray-500 mt-1">{linhas.join(' · ')}</div>}
        {criadoEm && <div className="text-xs text-gray-400 mt-1">Pedido em {fmtData(criadoEm)}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {status}
        {acoes}
      </div>
    </div>
  );
}

/** Diálogo de texto (motivo/recado) — o cidadão lê o que for escrito aqui. */
export function MotivoDialog({
  aberto,
  titulo,
  rotulo,
  exemplo,
  obrigatorio = true,
  confirmar,
  destrutivo = true,
  onClose,
  onConfirm,
}: {
  aberto: boolean;
  titulo: string;
  rotulo: string;
  exemplo?: string;
  obrigatorio?: boolean;
  confirmar: string;
  destrutivo?: boolean;
  onClose: () => void;
  onConfirm: (texto: string) => Promise<void>;
}) {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const fechar = () => {
    setTexto('');
    onClose();
  };
  return (
    <Dialog open={aberto} onOpenChange={(open) => !open && fechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label>{rotulo}</Label>
          <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} placeholder={exemplo} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={fechar} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            variant={destrutivo ? 'destructive' : 'default'}
            disabled={enviando || (obrigatorio && !texto.trim())}
            onClick={async () => {
              setEnviando(true);
              try {
                await onConfirm(texto.trim());
                setTexto('');
              } finally {
                setEnviando(false);
              }
            }}
          >
            {enviando ? 'Enviando...' : confirmar}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Filtro simples "Aguardando / Todos" usado no topo das filas. */
export function FiltroPendentes({ somentePendentes, onChange, total }: { somentePendentes: boolean; onChange: (v: boolean) => void; total: number }) {
  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant={somentePendentes ? 'default' : 'outline'} onClick={() => onChange(true)}>
        Aguardando
      </Button>
      <Button size="sm" variant={!somentePendentes ? 'default' : 'outline'} onClick={() => onChange(false)}>
        Todos
      </Button>
      <Badge variant="secondary">{total}</Badge>
    </div>
  );
}
