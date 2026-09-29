/**
 * GET /api/app-catalog?departmentCode=SAUDE
 * Catálogo de Apps (config/app-catalog.ts) para o painel: assistente de
 * serviço ("O que acontece depois do pedido?") e navegação de apps.
 */
import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { appsForDepartment } from '../config/app-catalog';

const router = Router();
router.use(adminAuthMiddleware);

router.get('/', (req, res) => {
  const departmentCode = typeof req.query.departmentCode === 'string' ? req.query.departmentCode : undefined;
  const onlyWithActions = req.query.withActions === 'true';
  const apps = appsForDepartment(departmentCode).filter((app) => !onlyWithActions || app.actions.length > 0);
  res.json({ success: true, data: { apps } });
});

export default router;
