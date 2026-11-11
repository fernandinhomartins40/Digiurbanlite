/**
 * "Prefeitura em números".
 *
 *   GET /api/public/city-numbers          (default) números agregados, sem login; 404 se desligada
 *   GET /api/admin/city-numbers/settings  (adminCityNumbersRouter) opção liga/desliga — gerente+
 *   PUT /api/admin/city-numbers/settings  { enabled } — administrador
 */

import { Router, Request, Response } from 'express';
import { UserRole } from '@prisma/client';
import { runAsTenant, tryGetTenantId } from '../lib/tenant-context';
import { TenantService } from '../services/tenant.service';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import {
  getCityNumbers,
  getCityNumbersSetting,
  isCityNumbersEnabled,
  setCityNumbersSetting,
} from '../services/city-numbers/city-numbers.service';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const tenant = req.tenant || (await TenantService.getByHost(req.hostname));
    if (!tenant || !isCityNumbersEnabled(tenant.branding)) {
      res.status(404).json({ error: 'Página não disponível neste município' });
      return;
    }
    const numbers = await runAsTenant(tenant.id, async () => getCityNumbers());
    res.set('Cache-Control', 'public, max-age=300');
    res.set('Vary', 'Host, Cookie, X-Tenant-Slug');
    res.json({ success: true, municipio: { nome: tenant.nome, nomeMunicipio: tenant.nomeMunicipio, uf: tenant.ufMunicipio }, ...numbers });
  } catch (error) {
    console.error('[prefeitura-em-numeros]', error);
    res.status(500).json({ error: 'Não foi possível carregar os números agora' });
  }
});

export default router;

export const adminCityNumbersRouter = Router();
adminCityNumbersRouter.use(adminAuthMiddleware);

adminCityNumbersRouter.get('/settings', requireMinRole(UserRole.MANAGER), async (_req: Request, res: Response) => {
  const tenantId = tryGetTenantId();
  if (!tenantId) return res.status(400).json({ error: 'Município não identificado' });
  res.json({ success: true, enabled: await getCityNumbersSetting(tenantId) });
});

adminCityNumbersRouter.put('/settings', requireMinRole(UserRole.ADMIN), async (req: Request, res: Response) => {
  const tenantId = tryGetTenantId();
  if (!tenantId) return res.status(400).json({ error: 'Município não identificado' });
  if (typeof req.body?.enabled !== 'boolean') return res.status(400).json({ error: 'Informe se a página fica ligada ou desligada' });
  try {
    res.json({ success: true, enabled: await setCityNumbersSetting(tenantId, req.body.enabled) });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Não foi possível salvar' });
  }
});
