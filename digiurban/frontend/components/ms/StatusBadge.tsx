'use client';

import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: any }> = {
    AGUARDANDO_ANALISE: { label: 'Aguardando', variant: 'secondary' },
    AGUARDANDO_VALIDACAO: { label: 'Em Validação', variant: 'secondary' },
    AGUARDANDO_AGENDAMENTO: { label: 'Aguardando', variant: 'secondary' },
    EM_ANALISE: { label: 'Em Análise', variant: 'default' },
    APROVADO: { label: 'Aprovado', variant: 'default' },
    CONCLUIDO: { label: 'Concluído', variant: 'default' },
    MATRICULADO: { label: 'Matriculado', variant: 'default' },
    REJEITADO: { label: 'Rejeitado', variant: 'destructive' },
    CANCELADO: { label: 'Cancelado', variant: 'destructive' },
    AGENDADO: { label: 'Agendado', variant: 'default' },
    CONFIRMADO: { label: 'Confirmado', variant: 'default' },
    REALIZADO: { label: 'Realizado', variant: 'default' },
    FILA_ESPERA: { label: 'Fila de Espera', variant: 'secondary' },
    ATIVO: { label: 'Ativo', variant: 'default' },
    INATIVO: { label: 'Inativo', variant: 'outline' },
    FALTOU: { label: 'Faltou', variant: 'destructive' },
    RESULTADO_DISPONIVEL: { label: 'Resultado Disponível', variant: 'default' },
  };

  const config = statusConfig[status] || { label: status, variant: 'outline' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
