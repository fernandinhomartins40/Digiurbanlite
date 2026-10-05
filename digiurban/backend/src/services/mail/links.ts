/**
 * Endereço público do município para links em e-mails (troca de senha, protocolo).
 * Ordem: domínio próprio → {slug}.TENANT_BASE_DOMAIN → FRONTEND_URL.
 */

import { TenantService } from '../tenant.service';
import { DEFAULT_TENANT_ID, tryGetTenantId } from '../../lib/tenant-context';

export async function tenantPortalUrl(tenantId?: string | null): Promise<string> {
  const fallback = (process.env.FRONTEND_URL || 'https://digiurban.com.br').replace(/\/+$/, '');
  const id = tenantId === undefined ? tryGetTenantId() : tenantId;
  if (!id || id === DEFAULT_TENANT_ID) return fallback;
  try {
    const tenant = await TenantService.getById(id);
    if (tenant?.customDomain) return `https://${tenant.customDomain}`;
    const baseDomain = (process.env.TENANT_BASE_DOMAIN || '').trim().toLowerCase();
    if (tenant?.slug && baseDomain) return `https://${tenant.slug}.${baseDomain}`;
  } catch {
    // sem município: link da plataforma
  }
  return fallback;
}
