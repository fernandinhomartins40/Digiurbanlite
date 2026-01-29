import { Router } from 'express';
import filaAtendimentoRoutes from './fila-atendimento.routes';
import escutaInicialRoutes from './escuta-inicial.routes';
import triagemRoutes from './triagem.routes';
import equipesRoutes from './equipes.routes';
import atividadesColetivasRoutes from './atividades-coletivas.routes';
import agendaRoutes from './agenda.routes';

const router = Router();

// Rotas de Saúde PEC e-SUS
router.use('/fila-atendimento', filaAtendimentoRoutes);
router.use('/escuta-inicial', escutaInicialRoutes);
router.use('/triagem', triagemRoutes);
router.use('/equipes', equipesRoutes);
router.use('/atividades-coletivas', atividadesColetivasRoutes);
router.use('/agenda', agendaRoutes);

export default router;
