/**
 * Nomes em português dos status que o backend guarda em inglês (enums).
 * Uma fonte só para as telas do console da plataforma.
 */

export const INVOICE_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Em aberto',
  PAID: 'Paga',
  OVERDUE: 'Vencida',
  CANCELLED: 'Cancelada',
  FAILED: 'Falhou',
};

export const TENANT_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Ativo',
  TRIAL: 'Em teste',
  SUSPENDED: 'Suspenso',
  INACTIVE: 'Inativo',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

export const invoiceStatusLabel = (status: string) => INVOICE_STATUS_LABEL[status] || status;
export const tenantStatusLabel = (status: string) => TENANT_STATUS_LABEL[status] || status;
