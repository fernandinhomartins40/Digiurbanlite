import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import unidadesRoutes from './unidades.routes';
import turmasRoutes from './turmas.routes';
import matriculasRoutes from './matriculas.routes';
import transporteRoutes from './transporte.routes';

const router = Router();
router.use(authenticateAdmin);

// App Educação — /api/apps/educacao/*
router.use('/unidades', unidadesRoutes);
router.use('/turmas', turmasRoutes);
router.use('/matriculas', matriculasRoutes);
router.use('/transporte', transporteRoutes);

export default router;
