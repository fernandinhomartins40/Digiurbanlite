import { Router } from 'express';
import unidadesRoutes from './unidades.routes';
import familiasRoutes from './familias.routes';
import programasRoutes from './programas.routes';
import { requireDepartmentAccess } from '../../middleware/department-access';

const router = Router();
// Equipe da secretaria + ADMIN (antes: só ADMIN)
router.use(...requireDepartmentAccess('ASSISTENCIA_SOCIAL'));

// App Assistência Social — /api/apps/assistencia-social/*
router.use('/unidades', unidadesRoutes);
router.use('/familias', familiasRoutes);
router.use('/programas', programasRoutes);

export default router;
