/**
 * INDEX - SEEDS DOS APPS DE SAÚDE
 *
 * Exporta todos os seeds individuais para facilitar imports
 */

export { seed01UnidadesSaudeCompletas } from './01-unidades-saude-completas.seed';
export { seed02ServidoresSaude } from './02-servidores-saude.seed';
export { seed03VinculosProfissionais } from './03-vinculos-profissionais.seed';
export { seed04EquipesSaude } from './04-equipes-saude.seed';
export { seed05EspecialidadesCBO } from './05-especialidades-cbo.seed';
export { seed06AgendasTurnos } from './06-agendas-turnos.seed';

// Master seed como default export
export { default } from './master-seed-saude';
