/**
 * CONFIGURAÇÕES DE TENANTS ESPECIAIS DO SISTEMA
 *
 * Este arquivo define tenants especiais que fazem parte da infraestrutura
 * da plataforma e não podem ser deletados ou modificados por usuários.
 */

/**
 * UNASSIGNED_POOL - Tenant Pool Global
 *
 * Tenant especial que funciona como "sala de espera" para cidadãos de
 * municípios que ainda não possuem tenant ativo na plataforma.
 *
 * Características:
 * - ID fixo e imutável
 * - Não pode ser deletado
 * - Não aparece em listagens normais de tenants
 * - Cidadãos vinculados têm acesso limitado
 * - Vinculação automática quando tenant do município é criado
 */
export const UNASSIGNED_POOL_ID = 'clzunassigned000000000000000';

/**
 * Configuração completa do UNASSIGNED_POOL
 */
export const UNASSIGNED_POOL_CONFIG = {
  id: UNASSIGNED_POOL_ID,
  name: 'Pool Global - Municípios Não Cadastrados',
  cnpj: '00.000.000/0000-00', // CNPJ fictício para tenant especial
  // ❌ REMOVIDO: domain (não usamos mais subdomínios)
  status: 'ACTIVE' as const,
  plan: 'SYSTEM' as const, // Plano especial para tenants do sistema
  trialEndsAt: null,
  population: 0,
  codigoIbge: null,
  nomeMunicipio: null,
  ufMunicipio: null,
  metadata: {
    isSystemTenant: true,
    isUnassignedPool: true,
    description: 'Tenant especial para cidadãos de municípios sem tenant ativo',
    createdBy: 'SYSTEM',
    readOnly: true,
    cannotBeDeleted: true
        }
};

/**
 * Verifica se um tenantId é o UNASSIGNED_POOL
 */
export function isUnassignedPool(tenantId: string | null | undefined): boolean {
  return tenantId === UNASSIGNED_POOL_ID;
}

/**
 * Filtra tenants removendo tenants especiais do sistema
 */
export function filterSystemTenants<T extends { id: string }>(tenants: T[]): T[] {
  return tenants.filter(tenant => !isUnassignedPool(tenant.id));
}
