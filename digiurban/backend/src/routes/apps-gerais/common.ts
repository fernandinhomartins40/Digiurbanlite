import { requireDepartmentAccess } from '../../middleware/department-access';
import { scopeOf } from '../../services/apps-gerais/common';

/** Erro de regra vira 400 com a mensagem em português. */
export const handle = (fn: (req: any, res: any) => Promise<any>) => async (req: any, res: any) => {
  try {
    await fn(req, res);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro na operação' });
  }
};

/**
 * Login de servidor + equipe de uma das secretarias do app + `req.appScope`
 * (secretarias que a pessoa vê; null = todas, para ADMIN).
 */
export function appGeralAccess(departments: string[]) {
  return [
    ...requireDepartmentAccess(...departments),
    async (req: any, _res: any, next: any) => {
      try {
        req.appScope = await scopeOf(req.user, departments);
        next();
      } catch (error) {
        next(error);
      }
    },
  ];
}
