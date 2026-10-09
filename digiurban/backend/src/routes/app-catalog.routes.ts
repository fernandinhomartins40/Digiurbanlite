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
import { appsForDepartment, findAppAction } from '../config/app-catalog';
import { checkAppFields, suggestAppActions } from '../services/apps/app-intelligence.service';
import { prisma } from '../lib/prisma';

const router = Router();
router.use(adminAuthMiddleware);

router.get('/', async (req, res) => {
  try {
    const departmentCode = typeof req.query.departmentCode === 'string' ? req.query.departmentCode : undefined;
    const onlyWithActions = req.query.withActions === 'true';
    let apps = appsForDepartment(departmentCode).filter((app) => !onlyWithActions || app.actions.length > 0);

    // secretarias da própria pessoa (null = todas, para ADMIN) — a tela usa para não mostrar o que é de outra secretaria
    let myDepartments: string[] | null | undefined;
    if (req.query.mine === 'true') {
      const user = (req as any).user;
      const userCodes = await getUserDepartmentCodes(user);
      apps = apps.filter((app) => canAccessDepartmentApp(String(user.role), userCodes, app.departments));
      myDepartments = ['ADMIN', 'SUPER_ADMIN'].includes(String(user.role)) ? null : userCodes;
    }

    res.json({ success: true, data: { apps, myDepartments } });
  } catch (error) {
    console.error('Erro ao listar catálogo de apps:', error);
    res.status(500).json({ success: false, error: 'Erro ao listar apps' });
  }
});

const INFORMATION_ONLY = ['CONSULTA_PUBLICA', 'CONSULTA_AUTENTICADA'];

/**
 * POST /api/app-catalog/suggest  { name, description?, departmentCode?, serviceSubtype? }
 * Para qual app o serviço parece ir (pelo nome; sem IA). Item só de informação nunca vai para app.
 */
router.post('/suggest', (req, res) => {
  const { name, description, departmentCode, serviceSubtype } = req.body || {};
  if (INFORMATION_ONLY.includes(String(serviceSubtype || ''))) return res.json({ success: true, data: { suggestions: [] } });
  res.json({ success: true, data: { suggestions: suggestAppActions({ name, description, departmentCode }) } });
});

/**
 * POST /api/app-catalog/field-check  { appAction, formSchema }
 * O que o app vai receber deste formulário, o que falta e os campos prontos para acrescentar.
 */
router.post('/field-check', (req, res) => {
  const { appAction, formSchema } = req.body || {};
  if (!findAppAction(appAction)) return res.status(400).json({ success: false, error: 'Escolha o app e o tipo de entrada' });
  res.json({ success: true, data: checkAppFields(appAction, formSchema) });
});

/**
 * GET /api/app-catalog/service-hints?departmentCode=SAUDE
 * Serviços que JÁ existem: os da fila que parecem ser de um app e os que vão
 * para app mas não mandam algum dado que ele precisa.
 */
router.get('/service-hints', async (req, res) => {
  try {
    const departmentCode = typeof req.query.departmentCode === 'string' ? req.query.departmentCode.toUpperCase().replace(/-/g, '_') : '';
    const services = await prisma.serviceSimplified.findMany({
      where: { isActive: true, ...(departmentCode ? { department: { code: departmentCode } } : {}) },
      select: { id: true, name: true, description: true, destination: true, appAction: true, formSchema: true, serviceSubtype: true, department: { select: { code: true } } },
      take: 1000,
    });
    const hints: any[] = [];
    for (const service of services) {
      if (service.destination === 'APP' && service.appAction) {
        const check = checkAppFields(service.appAction, service.formSchema);
        if (check?.missingRequired.length) hints.push({ serviceId: service.id, kind: 'MISSING_FIELDS', appAction: service.appAction, missing: check.missingRequired });
        continue;
      }
      if (INFORMATION_ONLY.includes(String(service.serviceSubtype || ''))) continue;
      const [best] = suggestAppActions({ name: service.name, description: service.description || '', departmentCode: service.department?.code });
      if (best?.confident) hints.push({ serviceId: service.id, kind: 'COULD_GO_TO_APP', appAction: best.appAction, appName: best.appName, actionLabel: best.actionLabel });
    }
    res.json({ success: true, data: { hints } });
  } catch (error) {
    console.error('Erro ao montar avisos dos serviços:', error);
    res.status(500).json({ success: false, error: 'Erro ao conferir os serviços' });
  }
});

export default router;
