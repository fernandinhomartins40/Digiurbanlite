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
import cuidadoRoutes from './cuidado.routes';
import { requireDepartmentAccess } from '../../middleware/department-access';

const router = Router();

// Dados clínicos (LGPD: dado sensível) — equipe da Saúde + ADMIN.
// Médicos e enfermeiros são USER do departamento SAUDE.
router.use(...requireDepartmentAccess('SAUDE'));

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
// Odontologia, pré-natal e visitas domiciliares (Fase 2 da auditoria de 2026-10-08)
router.use('/', cuidadoRoutes);

export default router;
