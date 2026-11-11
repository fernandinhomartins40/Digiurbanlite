/**
 * /api/admin/search?q= — busca do painel (Ctrl+K): cidadãos, pedidos e
 * processos internos no escopo de quem procura.
 */

import { Router } from 'express';
import { adminAuthMiddleware } from '../middleware/admin-auth';
import { adminSearch } from '../services/admin-search.service';

const router = Router();
router.use(adminAuthMiddleware as any);

router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const result = await adminSearch(
      { id: user.id, role: user.role, name: user.name, departmentId: user.departmentId, departmentIds: user.departmentIds },
      req.query.q
    );
    res.json(result);
  } catch (error) {
    console.error('[admin-search]', error);
    res.status(500).json({ error: 'Não foi possível buscar agora' });
  }
});

export default router;
