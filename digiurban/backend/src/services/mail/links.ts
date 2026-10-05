/**
 * Endereço público do município para links em e-mails (troca de senha, protocolo).
 * Ordem: {slug}.TENANT_BASE_DOMAIN → domínio próprio → FRONTEND_URL.
 *
 * O subdomínio vem primeiro porque sempre funciona. O "domínio próprio" do cadastro
 * (ex.: palmital.pr.gov.br) pode ser só o site da prefeitura, sem apontar para o
 * DigiUrban — link de troca de senha nele dá "não encontrado".
 */

import { TenantService } from '../tenant.service';
import { DEFAULT_TENANT_ID, tryGetTenantId } from '../../lib/tenant-context';

export async function tenantPortalUrl(tenantId?: string | null): Promise<string> {
  const fallback = (process.env.FRONTEND_URL || 'https://digiurban.com.br').replace(/\/+$/, '');
  const id = tenantId === undefined ? tryGetTenantId() : tenantId;
  if (!id || id === DEFAULT_TENANT_ID) return fallback;
  try {
    const tenant = await TenantService.getById(id);
    const baseDomain = (process.env.TENANT_BASE_DOMAIN || '').trim().toLowerCase();
    if (tenant?.slug && baseDomain) return `https://${tenant.slug}.${baseDomain}`;
    if (tenant?.customDomain) return `https://${tenant.customDomain}`;
  } catch {
    // sem município: link da plataforma
  }
  return fallback;
}

/** Quem assina o e-mail: "Prefeitura de Palmital" (ou DigiUrban quando é da plataforma) */
export async function mailSenderName(tenantId?: string | null): Promise<string> {
  const id = tenantId === undefined ? tryGetTenantId() : tenantId;
  if (!id || id === DEFAULT_TENANT_ID) return 'DigiUrban';
  try {
    const tenant = await TenantService.getById(id);
    const nome = (tenant?.nome || '').trim();
    if (!nome) return 'DigiUrban';
    return /^(prefeitura|munic[ií]pio|c[aâ]mara)/i.test(nome) ? nome : `Prefeitura de ${nome}`;
  } catch {
    return 'DigiUrban';
  }
}
