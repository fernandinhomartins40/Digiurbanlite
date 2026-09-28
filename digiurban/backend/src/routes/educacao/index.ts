import { Router } from 'express';
import unidadesRoutes from './unidades.routes';
import turmasRoutes from './turmas.routes';
import matriculasRoutes from './matriculas.routes';
import transporteRoutes from './transporte.routes';
import { requireDepartmentAccess } from '../../middleware/department-access';

const router = Router();
// Equipe da secretaria + ADMIN (antes: só ADMIN)
router.use(...requireDepartmentAccess('EDUCACAO'));

// App Educação — /api/apps/educacao/*
router.use('/unidades', unidadesRoutes);
router.use('/turmas', turmasRoutes);
router.use('/matriculas', matriculasRoutes);
router.use('/transporte', transporteRoutes);

export default router;
