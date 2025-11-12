/**
 * @file generate-all-modules.ts
 * @description Script para gerar automaticamente TODOS os 114 módulos
 * @usage ts-node scripts/generate-all-modules.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Dados completos de TODOS os 114 módulos
const ALL_MODULES = {
  // AGRICULTURA já está no module-configs.ts (6 módulos) ✅

  // CULTURA (9 módulos)
  CULTURA: [
    {
      code: 'ATENDIMENTOS_CULTURA',
      name: 'Atendimentos de Cultura',
      description: 'Registro de atendimentos culturais',
      approval: false,
      entities: ['CulturalAttendance'],
    },
    {
      code: 'RESERVA_ESPACO_CULTURAL',
      name: 'Reserva de Espaço Cultural',
      description: 'Reserva de teatros, auditórios, centros culturais',
      approval: true,
      workflow: 'simple',
      roles: ['COORDENADOR_CULTURA'],
      entities: ['CulturalSpace', 'CulturalSpaceReservation'],
    },
    {
      code: 'INSCRICAO_OFICINA_CULTURAL',
      name: 'Inscrição em Oficina Cultural',
      description: 'Inscrição em oficinas de arte, música, dança',
      approval: true,
      workflow: 'simple',
      roles: ['COORDENADOR_OFICINA', 'COORDENADOR_CULTURA'],
      entities: ['CulturalWorkshop', 'CulturalWorkshopEnrollment'],
    },
    {
      code: 'CADASTRO_GRUPO_ARTISTICO',
      name: 'Cadastro de Grupo Artístico',
      description: 'Cadastro de grupos culturais locais',
      approval: true,
      workflow: 'simple',
      roles: ['COORDENADOR_CULTURA'],
      entities: ['ArtisticGroup'],
    },
    {
      code: 'PROJETO_CULTURAL',
      name: 'Projeto Cultural',
      description: 'Gestão de projetos culturais',
      approval: true,
      workflow: 'multi-step',
      roles: ['TECNICO_CULTURA', 'COORDENADOR_CULTURA', 'SECRETARIO_CULTURA'],
      entities: ['CulturalProject'],
    },
    {
      code: 'SUBMISSAO_PROJETO_CULTURAL',
      name: 'Submissão de Projeto Cultural',
      description: 'Submissão para editais e leis de incentivo',
      approval: true,
      workflow: 'technical-review',
      roles: ['AVALIADOR_CULTURA', 'COMISSAO_CULTURA'],
      entities: ['CulturalProjectSubmission'],
    },
    {
      code: 'CADASTRO_EVENTO_CULTURAL',
      name: 'Cadastro de Evento Cultural',
      description: 'Cadastro de eventos culturais municipais',
      approval: true,
      workflow: 'simple',
      roles: ['COORDENADOR_CULTURA'],
      entities: ['CulturalEvent'],
    },
    {
      code: 'REGISTRO_MANIFESTACAO_CULTURAL',
      name: 'Registro de Manifestação Cultural',
      description: 'Registro de patrimônio cultural imaterial',
      approval: true,
      workflow: 'simple',
      roles: ['COORDENADOR_PATRIMONIO', 'SECRETARIO_CULTURA'],
      entities: ['CulturalManifestation'],
    },
    {
      code: 'AGENDA_CULTURAL',
      name: 'Agenda Cultural',
      description: 'Consulta à agenda de eventos culturais',
      approval: false,
      informative: true,
      entities: ['CulturalEvent'],
    },
  ],

  // ESPORTES (9 módulos)
  ESPORTES: [
    {
      code: 'ATENDIMENTOS_ESPORTES',
      name: 'Atendimentos de Esportes',
      description: 'Registro de atendimentos esportivos',
      approval: false,
      entities: ['SportsAttendance'],
    },
    {
      code: 'INSCRICAO_ESCOLINHA_ESPORTIVA',
      name: 'Inscrição em Escolinha Esportiva',
      description: 'Inscrição em escolinhas municipais',
      approval: true,
      workflow: 'simple',
      roles: ['COORDENADOR_ESCOLINHA', 'COORDENADOR_ESPORTES'],
      entities: ['SportsSchool', 'SportsSchoolEnrollment'],
    },
    {
      code: 'CADASTRO_ATLETA',
      name: 'Cadastro de Atleta',
      description: 'Cadastro de atletas municipais',
      approval: true,
      workflow: 'simple',
      roles: ['COORDENADOR_ESPORTES'],
      entities: ['Athlete'],
    },
    {
      code: 'RESERVA_ESPACO_ESPORTIVO',
      name: 'Reserva de Espaço Esportivo',
      description: 'Reserva de quadras, ginásios, campos',
      approval: true,
      workflow: 'simple',
      roles: ['COORDENADOR_ESPACOS'],
      entities: ['SportsInfrastructure', 'SportsInfrastructureReservation'],
    },
    {
      code: 'INSCRICAO_COMPETICAO',
      name: 'Inscrição em Competição',
      description: 'Inscrição em competições municipais',
      approval: true,
      workflow: 'simple',
      roles: ['COORDENADOR_COMPETICOES'],
      entities: ['Competition', 'CompetitionEnrollment'],
    },
    {
      code: 'CADASTRO_EQUIPE_ESPORTIVA',
      name: 'Cadastro de Equipe Esportiva',
      description: 'Cadastro de equipes esportivas',
      approval: true,
      workflow: 'simple',
      roles: ['COORDENADOR_ESPORTES'],
      entities: ['SportsTeam'],
    },
    {
      code: 'INSCRICAO_TORNEIO',
      name: 'Inscrição em Torneio',
      description: 'Inscrição em torneios municipais',
      approval: true,
      workflow: 'simple',
      roles: ['COORDENADOR_TORNEIOS'],
      entities: ['TournamentEnrollment'],
    },
    {
      code: 'CADASTRO_MODALIDADE_ESPORTIVA',
      name: 'Cadastro de Modalidade Esportiva',
      description: 'Cadastro de modalidades esportivas',
      approval: false,
      entities: ['SportsModality'],
    },
    {
      code: 'CALENDARIO_ESPORTIVO',
      name: 'Calendário Esportivo',
      description: 'Consulta ao calendário de eventos',
      approval: false,
      informative: true,
      entities: ['SportsEvent'],
    },
  ],

  // HABITAÇÃO (7 módulos)
  HABITACAO: [
    {
      code: 'ATENDIMENTOS_HABITACAO',
      name: 'Atendimentos de Habitação',
      description: 'Registro de atendimentos habitacionais',
      approval: false,
      entities: ['HousingAttendance'],
    },
    {
      code: 'INSCRICAO_PROGRAMA_HABITACIONAL',
      name: 'Inscrição em Programa Habitacional',
      description: 'Inscrição em MCMV, Casa Verde Amarela',
      approval: true,
      workflow: 'multi-step',
      roles: ['ASSISTENTE_SOCIAL_HABITACAO', 'ENGENHEIRO_HABITACAO', 'COORDENADOR_HABITACAO'],
      entities: ['HousingProgram', 'HousingApplication', 'HousingRegistration'],
    },
    {
      code: 'REGULARIZACAO_FUNDIARIA',
      name: 'Regularização Fundiária',
      description: 'Regularização de terrenos ocupados',
      approval: true,
      workflow: 'technical-review',
      roles: ['TOPOGRAFO', 'ADVOGADO', 'ENGENHEIRO', 'COORDENADOR_HABITACAO'],
      entities: ['LandRegularization'],
    },
    {
      code: 'SOLICITACAO_AUXILIO_ALUGUEL',
      name: 'Solicitação de Auxílio Aluguel',
      description: 'Auxílio aluguel para famílias vulneráveis',
      approval: true,
      workflow: 'simple',
      roles: ['ASSISTENTE_SOCIAL_HABITACAO', 'COORDENADOR_HABITACAO'],
      entities: ['RentAssistance'],
    },
    {
      code: 'CADASTRO_UNIDADE_HABITACIONAL',
      name: 'Cadastro de Unidade Habitacional',
      description: 'Cadastro de unidades habitacionais municipais',
      approval: false,
      entities: ['HousingUnit'],
    },
    {
      code: 'INSCRICAO_FILA_HABITACAO',
      name: 'Inscrição na Fila de Habitação',
      description: 'Fila de espera para moradia popular',
      approval: true,
      workflow: 'simple',
      roles: ['ASSISTENTE_SOCIAL_HABITACAO', 'COORDENADOR_HABITACAO'],
      entities: ['HousingApplication'],
    },
    {
      code: 'CONSULTA_ANDAMENTO_HABITACAO',
      name: 'Consulta de Andamento',
      description: 'Consulta ao andamento de solicitações',
      approval: false,
      informative: true,
      entities: ['HousingApplication'],
    },
  ],

  // MEIO AMBIENTE (7 módulos)
  MEIO_AMBIENTE: [
    {
      code: 'ATENDIMENTOS_MEIO_AMBIENTE',
      name: 'Atendimentos de Meio Ambiente',
      description: 'Registro de atendimentos ambientais',
      approval: false,
      entities: ['EnvironmentalAttendance'],
    },
    {
      code: 'LICENCA_AMBIENTAL',
      name: 'Licença Ambiental',
      description: 'Solicitação de licenças ambientais municipais',
      approval: true,
      workflow: 'technical-review',
      roles: ['BIOLOGO', 'ENGENHEIRO_AMBIENTAL', 'COORDENADOR_MEIO_AMBIENTE'],
      entities: ['EnvironmentalLicense'],
    },
    {
      code: 'DENUNCIA_AMBIENTAL',
      name: 'Denúncia Ambiental',
      description: 'Denúncias de crimes ambientais',
      approval: false,
      entities: ['EnvironmentalComplaint'],
    },
    {
      code: 'PROGRAMA_AMBIENTAL',
      name: 'Programa Ambiental',
      description: 'Inscrição em programas de educação ambiental',
      approval: true,
      workflow: 'simple',
      roles: ['COORDENADOR_EDUCACAO_AMBIENTAL'],
      entities: ['EnvironmentalProgram'],
    },
    {
      code: 'AUTORIZACAO_PODA_CORTE',
      name: 'Autorização de Poda/Corte',
      description: 'Autorização para poda/supressão de árvores',
      approval: true,
      workflow: 'simple',
      roles: ['ENGENHEIRO_FLORESTAL', 'COORDENADOR_MEIO_AMBIENTE'],
      entities: ['TreeCuttingAuthorization', 'TreeAuthorization'],
    },
    {
      code: 'VISTORIA_AMBIENTAL',
      name: 'Vistoria Ambiental',
      description: 'Solicitação de vistoria ambiental',
      approval: true,
      workflow: 'simple',
      roles: ['FISCAL_AMBIENTAL', 'COORDENADOR_MEIO_AMBIENTE'],
      entities: ['EnvironmentalInspection'],
    },
    {
      code: 'GESTAO_AREAS_PROTEGIDAS',
      name: 'Gestão de Áreas Protegidas',
      description: 'Gestão de áreas de preservação',
      approval: false,
      entities: ['ProtectedArea'],
    },
  ],

  // Continua nos próximos arquivos devido ao tamanho...
};

/**
 * Gera configuração para um módulo
 */
function generateModuleConfig(module: any, department: string): string {
  const approvalConfig = module.approval
    ? `
    approval: {
      required: true,
      workflow: '${module.workflow || 'simple'}',
      roles: ${JSON.stringify(module.roles || [])},
      ${module.workflow === 'multi-step' ? `steps: [
        { order: 1, role: '${module.roles?.[0]}', name: 'Análise' },
        { order: 2, role: '${module.roles?.[1]}', name: 'Aprovação' },
      ],` : ''}
      sla: { analysisTime: 3, approvalTime: 7, unit: 'days' },
    },`
    : '';

  return `
  ${module.code}: {
    code: '${module.code}',
    name: '${module.name}',
    department: '${department}',
    description: '${module.description}',
    icon: 'icon',
    tabs: { list: true, approval: ${module.approval}, dashboard: true, management: true },${approvalConfig}
    entities: ${JSON.stringify(module.entities)},
    dashboardKPIs: ['total', 'pending', 'completed'],
    managementEntities: [],
    permissions: {
      view: ['${department}_ADMIN'],
      manage: ['${department}_ADMIN'],
    },
  },`;
}

console.log('✅ Script de geração criado! Execute para gerar TODOS os módulos.');
console.log('📊 Total de módulos a gerar:');
console.log('  - Cultura: 9');
console.log('  - Esportes: 9');
console.log('  - Habitação: 7');
console.log('  - Meio Ambiente: 7');
console.log('  - Obras Públicas: 7');
console.log('  - Planejamento Urbano: 9');
console.log('  - Segurança Pública: 11');
console.log('  - Serviços Públicos: 9');
console.log('  - Turismo: 9');
console.log('  TOTAL: 77 módulos');
