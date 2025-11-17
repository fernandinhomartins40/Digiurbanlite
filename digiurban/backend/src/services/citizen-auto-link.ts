/**
 * DISABLED: SERVIÇO DE AUTO-VINCULAÇÃO INTELIGENTE DE CIDADÃOS
 *
 * Este serviço foi desabilitado na migração para single-tenant.
 * Em modo single-tenant, não há necessidade de vincular cidadãos a diferentes tenants.
 *
 * DIA 3: DISABLED - Multitenancy removed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AutoLinkResult {
  success: boolean;
  message: string;
  summary: {
    totalProcessed: number;
    linked: number;
    notLinked: number;
  };
  details: {
    linked: Array<{
      citizenId: string;
      name: string;
      email: string;
      linkedTo: {
      
        tenantName: string;
        municipio: string;
        uf: string;
      };
    }>;
    notLinked: Array<{
      citizenId: string;
      name: string;
      city?: string;
      state?: string;
      reason: string;
    }>;
  };
}

/**
 * DISABLED: Vincula automaticamente cidadãos (NÃO USADO EM SINGLE-TENANT)
 */
export async function autoLinkCitizens(_tenantId?: string): Promise<AutoLinkResult> {
  return {
    success: true,
    message: 'Auto-link desabilitado em modo single-tenant',
    summary: {
      totalProcessed: 0,
      linked: 0,
      notLinked: 0
    },
    details: { linked: [], notLinked: [] }
  };
}

/**
 * DISABLED: Hook para criação de tenant (NÃO USADO EM SINGLE-TENANT)
 */
export async function onTenantCreated(_tenantId: string): Promise<void> {
  // Disabled in single-tenant mode
  return;
}
