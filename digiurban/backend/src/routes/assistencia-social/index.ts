import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import unidadesRoutes from './unidades.routes';
import familiasRoutes from './familias.routes';
import programasRoutes from './programas.routes';

const router = Router();
router.use(authenticateAdmin);

// App Assistência Social — /api/apps/assistencia-social/*
router.use('/unidades', unidadesRoutes);
router.use('/familias', familiasRoutes);
router.use('/programas', programasRoutes);

export default router;
