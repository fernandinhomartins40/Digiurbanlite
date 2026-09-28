import { Router } from 'express';
import filaAtendimentoRoutes from './fila-atendimento.routes';
import escutaInicialRoutes from './escuta-inicial.routes';
import triagemRoutes from './triagem.routes';
import equipesRoutes from './equipes.routes';
import atividadesColetivasRoutes from './atividades-coletivas.routes';
import agendaRoutes from './agenda.routes';
import consultaMedicaRoutes from './consulta-medica.routes';
import painelRoutes from './painel.routes';
import imunizacaoRoutes from './imunizacao.routes';
import agendamentoRoutes from './agendamento.routes';
import { adminAuthMiddleware } from '../../middleware/admin-auth';

const router = Router();

// Dados clínicos (LGPD: dado sensível) — exige servidor autenticado.
// adminAuthMiddleware aceita qualquer servidor (USER..SUPER_ADMIN): médicos e
// enfermeiros são USER. Antes estas rotas respondiam sem autenticação alguma.
router.use(adminAuthMiddleware);

// Rotas de Saúde PEC e-SUS
router.use('/fila-atendimento', filaAtendimentoRoutes);
router.use('/escuta-inicial', escutaInicialRoutes);
router.use('/triagem', triagemRoutes);
router.use('/equipes', equipesRoutes);
router.use('/atividades-coletivas', atividadesColetivasRoutes);
router.use('/agenda', agendaRoutes);
router.use('/consulta-medica', consultaMedicaRoutes);
router.use('/painel', painelRoutes);
router.use('/imunizacao', imunizacaoRoutes);
router.use('/agendamento', agendamentoRoutes);

export default router;
