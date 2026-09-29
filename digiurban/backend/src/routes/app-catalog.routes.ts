/**
 * GET /api/app-catalog?departmentCode=SAUDE
 * Catálogo de Apps (config/app-catalog.ts) para o painel: assistente de
 * serviço ("O que acontece depois do pedido?") e navegação de apps.
 *
 * `mine=true` devolve só os apps que o servidor logado pode abrir — mesma regra
 * do requireDepartmentAccess (equipe da secretaria dona + ADMIN/SUPER_ADMIN).
 */
import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { canAccessDepartmentApp, getUserDepartmentCodes } from '../middleware/department-access';
import { appsForDepartment } from '../config/app-catalog';

const router = Router();
router.use(adminAuthMiddleware);

router.get('/', async (req, res) => {
  try {
    const departmentCode = typeof req.query.departmentCode === 'string' ? req.query.departmentCode : undefined;
    const onlyWithActions = req.query.withActions === 'true';
    let apps = appsForDepartment(departmentCode).filter((app) => !onlyWithActions || app.actions.length > 0);

    if (req.query.mine === 'true') {
      const user = (req as any).user;
      const userCodes = await getUserDepartmentCodes(user);
      apps = apps.filter((app) => canAccessDepartmentApp(String(user.role), userCodes, app.departments));
    }

    res.json({ success: true, data: { apps } });
  } catch (error) {
    console.error('Erro ao listar catálogo de apps:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar apps' });
  }
});

export default router;
