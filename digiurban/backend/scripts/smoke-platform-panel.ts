/**
 * ============================================================================
 * SMOKE TEST — Painel super-admin multi-tenant (wizard/detalhe/billing/leads)
 * ============================================================================
 *   1. provisionTenant com plano/limites/branding/features/planEndsAt
 *   2. getTenantDetail: uso, limites, admins
 *   3. createTenantAdmin + resetTenantUserPassword (ownership cross-tenant)
 *   4. setTenantUserActive com preflight de tenant
 *   5. billing: createInvoice (valor do plano) + updateInvoiceStatus
 *   6. leads: createLead + listLeads + updateLeadStatus
 *
 * Uso: DATABASE_URL=... npx ts-node --transpile-only scripts/smoke-platform-panel.ts
 */

import { prisma } from '../src/lib/prisma';
import { runAsPlatform } from '../src/lib/tenant-context';
import {
  provisionTenant, getTenantDetail, createTenantAdmin,
  resetTenantUserPassword, setTenantUserActive,
} from '../src/services/tenant-provisioning.service';
import {
  createInvoice, updateInvoiceStatus, listTenantInvoices,
  createLead, listLeads, updateLeadStatus, PLAN_MONTHLY_PRICE,
} from '../src/services/platform-billing.service';

let passed = 0;
let failed = 0;
function assert(cond: boolean, name: string, detail?: string): void {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`); }
}

async function main(): Promise<void> {
  const stamp = Date.now();

  console.log('\n[1] provisionTenant completo (plano/limites/branding/features)');
  const result = await provisionTenant({
    slug: `panel-${stamp}`, nome: `Prefeitura Panel ${stamp}`,
    cnpj: `${stamp}`.padStart(14, '4').slice(0, 14),
    nomeMunicipio: 'Cidade Panel', ufMunicipio: 'SP',
    plan: 'professional', maxUsers: 50, maxCitizens: 100000,
    planEndsAt: '2027-01-01',
    features: { saude: false, turismo: false },
    branding: { corPrimaria: '#123456', corSecundaria: '#abcdef' },
    adminName: 'Admin Panel', adminEmail: `adm-${stamp}@panel.test`,
  });
  const tid = result.tenant.id;
  assert(result.tenant.plan === 'professional', 'plano gravado');
  assert(result.tenant.maxUsers === 50, 'limite de usuários gravado');
  assert(!!result.tenant.planEndsAt, 'validade do plano gravada');
  assert((result.tenant.features as any)?.saude === false, 'módulo saúde desabilitado');
  assert((result.tenant.branding as any)?.corPrimaria === '#123456', 'branding gravado');

  console.log('\n[2] getTenantDetail: uso, limites, admins');
  const detail = await getTenantDetail(tid);
  assert(detail.usage.users === 1, 'uso: 1 usuário (admin inicial)', String(detail.usage.users));
  assert(detail.usage.maxUsers === 50, 'uso expõe o limite');
  assert(detail.admins.length === 1, 'lista de admins traz o admin inicial');
  assert(detail.admins[0].mustChangePassword === true, 'admin inicial com mustChangePassword');

  console.log('\n[3] createTenantAdmin + reset de senha');
  const admin2 = await createTenantAdmin(tid, { name: 'Segundo Admin', email: `adm2-${stamp}@panel.test` });
  assert(!!admin2.temporaryPassword, 'novo admin recebe senha temporária');
  const detail2 = await getTenantDetail(tid);
  assert(detail2.admins.length === 2, 'agora há 2 admins');

  const reset = await resetTenantUserPassword(tid, admin2.id);
  assert(!!reset.temporaryPassword, 'reset gera nova senha temporária');

  console.log('\n[4] ownership cross-tenant no reset');
  const other = await provisionTenant({
    slug: `panel-o-${stamp}`, nome: `Outro ${stamp}`,
    cnpj: `${stamp + 1}`.padStart(14, '5').slice(0, 14),
    nomeMunicipio: 'Outro', ufMunicipio: 'RJ',
    adminName: 'Outro Admin', adminEmail: `outro-${stamp}@panel.test`,
  });
  let crossBlocked = false;
  try {
    // tentar resetar o admin do "other" a partir do tenant tid
    await resetTenantUserPassword(tid, (await getTenantDetail(other.tenant.id)).admins[0].id);
  } catch (e: any) {
    crossBlocked = e?.code === 'P2025';
  }
  assert(crossBlocked, 'reset cross-tenant é bloqueado (P2025)');

  console.log('\n[5] ativar/desativar usuário');
  await setTenantUserActive(tid, admin2.id, false);
  const detail3 = await getTenantDetail(tid);
  assert(detail3.admins.find((a: any) => a.id === admin2.id)?.isActive === false, 'usuário desativado');

  console.log('\n[6] billing: gerar fatura (valor do plano) + pagar');
  const invoice = await createInvoice({ tenantId: tid });
  assert(invoice.amount === PLAN_MONTHLY_PRICE.professional, 'valor derivado do plano professional', String(invoice.amount));
  assert(invoice.status === 'PENDING', 'fatura nasce PENDING');
  const paid = await updateInvoiceStatus(invoice.id, 'PAID');
  assert(paid.status === 'PAID' && !!paid.paidAt, 'fatura marcada como paga com paidAt');
  const invList = await listTenantInvoices(tid);
  assert(invList.length === 1, 'listagem de faturas do município');

  console.log('\n[7] leads: captar + funil');
  const lead = await createLead({ name: 'Prospect', email: `lead-${stamp}@x.test`, source: 'DEMO_REQUEST', company: 'Prefeitura X' });
  assert(lead.status === 'NEW', 'lead nasce NEW');
  const moved = await updateLeadStatus(lead.id, 'QUALIFIED');
  assert(moved.status === 'QUALIFIED', 'lead movido no funil');
  const leads = await listLeads('QUALIFIED');
  assert(leads.some((l: any) => l.id === lead.id), 'filtro de leads por status');

  // Cleanup
  await runAsPlatform(async () => {
    await prisma.invoice.deleteMany({ where: { tenantId: { in: [tid, other.tenant.id] } } });
    await prisma.lead.deleteMany({ where: { id: lead.id } });
    for (const t of [tid, other.tenant.id]) {
      await prisma.serviceSimplified.deleteMany({ where: { tenantId: t } });
      await prisma.department.deleteMany({ where: { tenantId: t } });
      await prisma.user.deleteMany({ where: { tenantId: t } });
      await prisma.tenant.delete({ where: { id: t } });
    }
  });

  console.log(`\nRESULTADO: ${passed} passou / ${failed} falhou`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Erro fatal no smoke:', error);
  process.exit(1);
});
