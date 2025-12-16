/**
 * SEED DE MODULE WORKFLOWS
 * Cria os workflows padrão para cada tipo de módulo
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Workflow padrão genérico
 * ✅ Removida etapa "Novo" - protocolo já nasce novo!
 */
const defaultStages = [
  {
    id: 'em_analise',
    name: 'Em Análise',
    description: 'Em análise pela equipe',
    order: 1,
    color: '#f59e0b',
    slaDays: 3,
    allowedNextStages: ['aprovado', 'reprovado', 'pendente', 'cancelado'],
  },
  {
    id: 'pendente',
    name: 'Pendente',
    description: 'Aguardando documentação ou informação',
    order: 2,
    color: '#eab308',
    slaDays: 7,
    allowedNextStages: ['em_analise', 'cancelado'],
  },
  {
    id: 'aprovado',
    name: 'Aprovado',
    description: 'Solicitação aprovada',
    order: 3,
    color: '#22c55e',
    slaDays: 1,
    allowedNextStages: ['concluido'],
  },
  {
    id: 'reprovado',
    name: 'Reprovado',
    description: 'Solicitação reprovada',
    order: 4,
    color: '#ef4444',
    allowedNextStages: [],
  },
  {
    id: 'concluido',
    name: 'Concluído',
    description: 'Processo finalizado',
    order: 5,
    color: '#10b981',
    allowedNextStages: [],
  },
  {
    id: 'cancelado',
    name: 'Cancelado',
    description: 'Protocolo cancelado',
    order: 6,
    color: '#6b7280',
    allowedNextStages: [],
  },
];

/**
 * Lista de todos os módulos com seus metadados
 */
const moduleWorkflows = [
  // SAÚDE
  { moduleType: 'ATENDIMENTOS_SAUDE', name: 'Atendimentos de Saúde', description: 'Gestão de atendimentos na unidade de saúde', defaultSLA: 5 },
  { moduleType: 'AGENDAMENTOS_MEDICOS', name: 'Agendamentos Médicos', description: 'Sistema de agendamento de consultas', defaultSLA: 3 },
  { moduleType: 'CONTROLE_MEDICAMENTOS', name: 'Controle de Medicamentos', description: 'Gestão de estoque e dispensação de medicamentos', defaultSLA: 2 },
  { moduleType: 'CAMPANHAS_SAUDE', name: 'Campanhas de Saúde', description: 'Gestão de campanhas de saúde pública', defaultSLA: 10 },
  { moduleType: 'PROGRAMAS_SAUDE', name: 'Programas de Saúde', description: 'Gestão de programas de saúde', defaultSLA: 15 },
  { moduleType: 'ENCAMINHAMENTOS_TFD', name: 'Tratamento Fora do Domicílio', description: 'Gestão de encaminhamentos TFD', defaultSLA: 7 },
  { moduleType: 'EXAMES', name: 'Exames', description: 'Agendamento e gestão de exames', defaultSLA: 5 },
  { moduleType: 'TRANSPORTE_PACIENTES', name: 'Transporte de Pacientes', description: 'Gestão de transporte de pacientes', defaultSLA: 2 },
  { moduleType: 'CADASTRO_PACIENTE', name: 'Cadastro de Pacientes', description: 'Gestão de cadastro de pacientes', defaultSLA: 1 },
  { moduleType: 'VACINACAO', name: 'Vacinação', description: 'Gestão de campanhas e registro de vacinação', defaultSLA: 1 },
  { moduleType: 'GESTAO_ACS', name: 'Gestão de ACS', description: 'Gestão de Agentes Comunitários de Saúde', defaultSLA: 7 },

  // EDUCAÇÃO
  { moduleType: 'MATRICULA_ESCOLAR', name: 'Matrícula Escolar', description: 'Sistema de matrícula de alunos', defaultSLA: 5 },
  { moduleType: 'TRANSFERENCIA_ESCOLAR', name: 'Transferência Escolar', description: 'Gestão de transferências entre escolas', defaultSLA: 7 },
  { moduleType: 'GESTAO_MERENDA', name: 'Gestão de Merenda', description: 'Controle de merenda escolar', defaultSLA: 5 },
  { moduleType: 'MATRICULA_ALUNO', name: 'Matrícula de Aluno', description: 'Sistema de matrícula estudantil', defaultSLA: 5 },
  { moduleType: 'TRANSPORTE_ESCOLAR', name: 'Transporte Escolar', description: 'Gestão de transporte de estudantes', defaultSLA: 3 },
  { moduleType: 'INSCRICAO_CURSO_LIVRE', name: 'Cursos Livres', description: 'Inscrição em cursos livres', defaultSLA: 5 },
  { moduleType: 'CADASTRO_PROFESSOR', name: 'Cadastro de Professores', description: 'Gestão de cadastro de professores', defaultSLA: 10 },
  { moduleType: 'ATENDIMENTOS_EDUCACAO', name: 'Atendimentos Educação', description: 'Atendimentos gerais da secretaria de educação', defaultSLA: 5 },
  { moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR', name: 'Ocorrências Escolares', description: 'Registro de ocorrências escolares', defaultSLA: 2 },
  { moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR', name: 'Documentos Escolares', description: 'Solicitação de documentos escolares', defaultSLA: 7 },
  { moduleType: 'CONSULTA_FREQUENCIA', name: 'Consulta Frequência', description: 'Consulta de frequência escolar', defaultSLA: 1 },
  { moduleType: 'CONSULTA_NOTAS', name: 'Consulta de Notas', description: 'Consulta de notas e boletim', defaultSLA: 1 },
  { moduleType: 'GESTAO_ESCOLAR', name: 'Gestão Escolar', description: 'Gestão administrativa escolar', defaultSLA: 10 },

  // ASSISTÊNCIA SOCIAL
  { moduleType: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL', name: 'Atendimentos Sociais', description: 'Atendimentos da assistência social', defaultSLA: 3 },
  { moduleType: 'SOLICITACAO_BENEFICIO', name: 'Solicitação de Benefícios', description: 'Solicitação de benefícios sociais', defaultSLA: 10 },
  { moduleType: 'CADASTRO_UNICO', name: 'Cadastro Único', description: 'Cadastro Único para programas sociais', defaultSLA: 5 },
  { moduleType: 'BOLSA_FAMILIA', name: 'Bolsa Família', description: 'Gestão do programa Bolsa Família', defaultSLA: 10 },
  { moduleType: 'ATENDIMENTO_CRAS', name: 'Atendimento CRAS', description: 'Atendimentos no CRAS', defaultSLA: 3 },
  { moduleType: 'CESTA_BASICA', name: 'Cesta Básica', description: 'Distribuição de cestas básicas', defaultSLA: 3 },
  { moduleType: 'GESTAO_BENEFICIOS', name: 'Gestão de Benefícios', description: 'Gestão geral de benefícios', defaultSLA: 10 },
  { moduleType: 'ENTREGA_EMERGENCIAL', name: 'Entrega Emergencial', description: 'Entregas emergenciais', defaultSLA: 1 },
  { moduleType: 'INSCRICAO_GRUPO_OFICINA', name: 'Grupos e Oficinas', description: 'Inscrição em grupos e oficinas', defaultSLA: 5 },
  { moduleType: 'VISITAS_DOMICILIARES', name: 'Visitas Domiciliares', description: 'Gestão de visitas domiciliares', defaultSLA: 5 },
  { moduleType: 'INSCRICAO_PROGRAMA_SOCIAL', name: 'Programas Sociais', description: 'Inscrição em programas sociais', defaultSLA: 7 },
  { moduleType: 'AGENDAMENTO_ATENDIMENTO_SOCIAL', name: 'Agendamento Social', description: 'Agendamento de atendimentos', defaultSLA: 3 },
  { moduleType: 'GESTAO_CRAS_CREAS', name: 'Gestão CRAS/CREAS', description: 'Gestão de unidades CRAS e CREAS', defaultSLA: 10 },

  // AGRICULTURA
  { moduleType: 'CADASTRO_PRODUTOR', name: 'Cadastro de Produtores', description: 'Cadastro de produtores rurais', defaultSLA: 5 },
  { moduleType: 'SOLICITACAO_MAQUINAS', name: 'Solicitação de Máquinas', description: 'Solicitação de máquinas agrícolas', defaultSLA: 7 },
  { moduleType: 'FEIRA_PRODUTOR', name: 'Feira do Produtor', description: 'Gestão da feira do produtor', defaultSLA: 5 },
  { moduleType: 'PROGRAMA_SEMENTES', name: 'Programa de Sementes', description: 'Distribuição de sementes', defaultSLA: 10 },
  { moduleType: 'ATENDIMENTOS_AGRICULTURA', name: 'Atendimentos Agricultura', description: 'Atendimentos gerais da agricultura', defaultSLA: 5 },
  { moduleType: 'ASSISTENCIA_TECNICA', name: 'Assistência Técnica', description: 'Assistência técnica rural', defaultSLA: 7 },
  { moduleType: 'INSCRICAO_CURSO_RURAL', name: 'Cursos Rurais', description: 'Inscrição em cursos rurais', defaultSLA: 10 },
  { moduleType: 'INSCRICAO_PROGRAMA_RURAL', name: 'Programas Rurais', description: 'Inscrição em programas rurais', defaultSLA: 10 },
  { moduleType: 'CADASTRO_PROPRIEDADE_RURAL', name: 'Propriedades Rurais', description: 'Cadastro de propriedades rurais', defaultSLA: 7 },

  // CULTURA
  { moduleType: 'INSCRICAO_OFICINA', name: 'Oficinas Culturais', description: 'Inscrição em oficinas culturais', defaultSLA: 5 },
  { moduleType: 'CADASTRO_ARTISTA', name: 'Cadastro de Artistas', description: 'Cadastro de artistas locais', defaultSLA: 5 },
  { moduleType: 'INSCRICAO_EDITAL', name: 'Editais Culturais', description: 'Inscrição em editais de cultura', defaultSLA: 15 },
  { moduleType: 'ATENDIMENTOS_CULTURA', name: 'Atendimentos Cultura', description: 'Atendimentos gerais da cultura', defaultSLA: 5 },
  { moduleType: 'INSCRICAO_ESCOLINHA', name: 'Escolinhas de Arte', description: 'Inscrição em escolinhas de arte', defaultSLA: 5 },
  { moduleType: 'RESERVA_ESPACO_CULTURAL', name: 'Reserva de Espaços', description: 'Reserva de espaços culturais', defaultSLA: 7 },
  { moduleType: 'INSCRICAO_OFICINA_CULTURAL', name: 'Oficinas Culturais', description: 'Inscrição em oficinas culturais', defaultSLA: 5 },
  { moduleType: 'CADASTRO_GRUPO_ARTISTICO', name: 'Grupos Artísticos', description: 'Cadastro de grupos artísticos', defaultSLA: 7 },
  { moduleType: 'PROJETO_CULTURAL', name: 'Projetos Culturais', description: 'Gestão de projetos culturais', defaultSLA: 15 },
  { moduleType: 'SUBMISSAO_PROJETO_CULTURAL', name: 'Submissão de Projetos', description: 'Submissão de projetos culturais', defaultSLA: 15 },
  { moduleType: 'CADASTRO_EVENTO_CULTURAL', name: 'Eventos Culturais', description: 'Cadastro de eventos culturais', defaultSLA: 10 },
  { moduleType: 'REGISTRO_MANIFESTACAO_CULTURAL', name: 'Manifestações Culturais', description: 'Registro de manifestações culturais', defaultSLA: 10 },

  // ESPORTES
  { moduleType: 'INSCRICAO_MODALIDADE', name: 'Inscrição em Modalidades', description: 'Inscrição em modalidades esportivas', defaultSLA: 5 },
  { moduleType: 'ALUGUEL_QUADRA', name: 'Aluguel de Quadras', description: 'Aluguel de quadras esportivas', defaultSLA: 3 },
  { moduleType: 'INSCRICAO_TORNEIO', name: 'Torneios e Competições', description: 'Inscrição em torneios', defaultSLA: 7 },
  { moduleType: 'ATENDIMENTOS_ESPORTES', name: 'Atendimentos Esportes', description: 'Atendimentos gerais do esporte', defaultSLA: 5 },
  { moduleType: 'CADASTRO_ATLETA', name: 'Cadastro de Atletas', description: 'Cadastro de atletas', defaultSLA: 5 },
  { moduleType: 'RESERVA_ESPACO_ESPORTIVO', name: 'Reserva de Espaços', description: 'Reserva de espaços esportivos', defaultSLA: 3 },
  { moduleType: 'INSCRICAO_COMPETICAO', name: 'Competições', description: 'Inscrição em competições', defaultSLA: 7 },
  { moduleType: 'CADASTRO_EQUIPE_ESPORTIVA', name: 'Equipes Esportivas', description: 'Cadastro de equipes esportivas', defaultSLA: 5 },
  { moduleType: 'CADASTRO_MODALIDADE', name: 'Cadastro de Modalidades', description: 'Cadastro de modalidades esportivas', defaultSLA: 10 },

  // HABITAÇÃO
  { moduleType: 'REGULARIZACAO_FUNDIARIA', name: 'Regularização Fundiária', description: 'Regularização de terrenos', defaultSLA: 30 },
  { moduleType: 'MINHA_CASA', name: 'Minha Casa Minha Vida', description: 'Programa Minha Casa Minha Vida', defaultSLA: 30 },
  { moduleType: 'AUTORIZACAO_CONSTRUCAO', name: 'Autorização de Construção', description: 'Autorização para construção', defaultSLA: 15 },
  { moduleType: 'ATENDIMENTOS_HABITACAO', name: 'Atendimentos Habitação', description: 'Atendimentos gerais de habitação', defaultSLA: 7 },
  { moduleType: 'INSCRICAO_PROGRAMA_HABITACIONAL', name: 'Programas Habitacionais', description: 'Inscrição em programas de habitação', defaultSLA: 15 },
  { moduleType: 'SOLICITACAO_AUXILIO_ALUGUEL', name: 'Auxílio Aluguel', description: 'Solicitação de auxílio aluguel', defaultSLA: 10 },
  { moduleType: 'CADASTRO_UNIDADE_HABITACIONAL', name: 'Unidades Habitacionais', description: 'Cadastro de unidades habitacionais', defaultSLA: 7 },
  { moduleType: 'INSCRICAO_FILA_HABITACAO', name: 'Fila de Habitação', description: 'Inscrição na fila de habitação', defaultSLA: 10 },

  // MEIO AMBIENTE
  { moduleType: 'LICENCIAMENTO_AMBIENTAL', name: 'Licenciamento Ambiental', description: 'Licenciamento de atividades', defaultSLA: 30 },
  { moduleType: 'COLETA_SELETIVA', name: 'Coleta Seletiva', description: 'Gestão de coleta seletiva', defaultSLA: 5 },
  { moduleType: 'GESTAO_RESIDUOS', name: 'Gestão de Resíduos', description: 'Gestão de resíduos sólidos', defaultSLA: 7 },
  { moduleType: 'AUTORIZACAO_PODA', name: 'Autorização de Poda', description: 'Autorização para poda de árvores', defaultSLA: 7 },
  { moduleType: 'ATENDIMENTOS_MEIO_AMBIENTE', name: 'Atendimentos Meio Ambiente', description: 'Atendimentos gerais ambientais', defaultSLA: 5 },
  { moduleType: 'LICENCA_AMBIENTAL', name: 'Licença Ambiental', description: 'Emissão de licenças ambientais', defaultSLA: 30 },
  { moduleType: 'DENUNCIA_AMBIENTAL', name: 'Denúncias Ambientais', description: 'Registro de denúncias ambientais', defaultSLA: 3 },
  { moduleType: 'PROGRAMA_AMBIENTAL', name: 'Programas Ambientais', description: 'Gestão de programas ambientais', defaultSLA: 15 },
  { moduleType: 'AUTORIZACAO_PODA_CORTE', name: 'Poda e Corte', description: 'Autorização para poda e corte', defaultSLA: 7 },
  { moduleType: 'VISTORIA_AMBIENTAL', name: 'Vistorias Ambientais', description: 'Realização de vistorias ambientais', defaultSLA: 10 },
  { moduleType: 'GESTAO_AREAS_PROTEGIDAS', name: 'Áreas Protegidas', description: 'Gestão de áreas protegidas', defaultSLA: 15 },

  // OBRAS PÚBLICAS
  { moduleType: 'APROVACAO_PROJETO', name: 'Aprovação de Projetos', description: 'Aprovação de projetos de obras', defaultSLA: 20 },
  { moduleType: 'AUTORIZACAO_DEMOLICAO', name: 'Autorização de Demolição', description: 'Autorização para demolição', defaultSLA: 15 },
  { moduleType: 'GESTAO_OBRAS', name: 'Gestão de Obras', description: 'Gestão de obras públicas', defaultSLA: 30 },
  { moduleType: 'ATENDIMENTOS_OBRAS', name: 'Atendimentos Obras', description: 'Atendimentos de obras públicas', defaultSLA: 5 },
  { moduleType: 'SOLICITACAO_REPARO_VIA', name: 'Reparo de Vias', description: 'Solicitação de reparo de vias', defaultSLA: 10 },
  { moduleType: 'VISTORIA_TECNICA_OBRAS', name: 'Vistorias Técnicas', description: 'Realização de vistorias técnicas', defaultSLA: 10 },
  { moduleType: 'CADASTRO_OBRA_PUBLICA', name: 'Obras Públicas', description: 'Cadastro de obras públicas', defaultSLA: 7 },
  { moduleType: 'INSPECAO_OBRA', name: 'Inspeção de Obras', description: 'Inspeção de obras em andamento', defaultSLA: 7 },

  // PLANEJAMENTO URBANO
  { moduleType: 'PARCELAMENTO_SOLO', name: 'Parcelamento de Solo', description: 'Aprovação de parcelamento', defaultSLA: 30 },
  { moduleType: 'VIABILIDADE_URBANISTICA', name: 'Viabilidade Urbanística', description: 'Análise de viabilidade urbanística', defaultSLA: 15 },
  { moduleType: 'ATENDIMENTOS_PLANEJAMENTO', name: 'Atendimentos Planejamento', description: 'Atendimentos de planejamento urbano', defaultSLA: 7 },
  { moduleType: 'ALVARA_CONSTRUCAO', name: 'Alvará de Construção', description: 'Emissão de alvará de construção', defaultSLA: 20 },
  { moduleType: 'ALVARA_FUNCIONAMENTO', name: 'Alvará de Funcionamento', description: 'Emissão de alvará de funcionamento', defaultSLA: 15 },
  { moduleType: 'SOLICITACAO_CERTIDAO', name: 'Certidões', description: 'Solicitação de certidões', defaultSLA: 7 },
  { moduleType: 'DENUNCIA_CONSTRUCAO_IRREGULAR', name: 'Denúncias Construções', description: 'Denúncia de construções irregulares', defaultSLA: 5 },
  { moduleType: 'CADASTRO_LOTEAMENTO', name: 'Cadastro de Loteamentos', description: 'Cadastro de loteamentos', defaultSLA: 20 },

  // SEGURANÇA PÚBLICA
  { moduleType: 'REGISTRO_OCORRENCIA', name: 'Registro de Ocorrências', description: 'Registro de ocorrências', defaultSLA: 1 },
  { moduleType: 'PATROLHAMENTO', name: 'Patrolhamento', description: 'Gestão de patrolhamento', defaultSLA: 1 },
  { moduleType: 'AUTORIZACAO_EVENTO_SEG', name: 'Autorização de Eventos', description: 'Autorização de eventos com segurança', defaultSLA: 10 },
  { moduleType: 'ATENDIMENTOS_SEGURANCA', name: 'Atendimentos Segurança', description: 'Atendimentos de segurança pública', defaultSLA: 1 },
  { moduleType: 'SOLICITACAO_RONDA', name: 'Solicitação de Ronda', description: 'Solicitação de ronda', defaultSLA: 1 },
  { moduleType: 'SOLICITACAO_CAMERA_SEGURANCA', name: 'Câmeras de Segurança', description: 'Solicitação de câmeras de segurança', defaultSLA: 15 },
  { moduleType: 'DENUNCIA_ANONIMA', name: 'Denúncias Anônimas', description: 'Registro de denúncias anônimas', defaultSLA: 1 },
  { moduleType: 'CADASTRO_PONTO_CRITICO', name: 'Pontos Críticos', description: 'Cadastro de pontos críticos', defaultSLA: 5 },
  { moduleType: 'ALERTA_SEGURANCA', name: 'Alertas de Segurança', description: 'Gestão de alertas de segurança', defaultSLA: 1 },
  { moduleType: 'REGISTRO_PATRULHA', name: 'Registro de Patrulhas', description: 'Registro de patrulhas realizadas', defaultSLA: 1 },
  { moduleType: 'GESTAO_GUARDA_MUNICIPAL', name: 'Gestão Guarda Municipal', description: 'Gestão da guarda municipal', defaultSLA: 7 },
  { moduleType: 'GESTAO_VIGILANCIA', name: 'Gestão de Vigilância', description: 'Gestão de sistema de vigilância', defaultSLA: 7 },

  // SERVIÇOS PÚBLICOS
  { moduleType: 'DESOBSTRUCAO_BUEIRO', name: 'Desobstrução de Bueiros', description: 'Desobstrução de bueiros', defaultSLA: 3 },
  { moduleType: 'SOLICITACAO_PODA', name: 'Solicitação de Poda', description: 'Solicitação de poda de árvores', defaultSLA: 7 },
  { moduleType: 'GESTAO_EQUIPES_SERVICOS', name: 'Gestão de Equipes', description: 'Gestão de equipes de serviços', defaultSLA: 7 },
  { moduleType: 'ATENDIMENTOS_SERVICOS_PUBLICOS', name: 'Atendimentos Serviços', description: 'Atendimentos de serviços públicos', defaultSLA: 5 },
  { moduleType: 'ILUMINACAO_PUBLICA', name: 'Iluminação Pública', description: 'Solicitações de iluminação pública', defaultSLA: 5 },
  { moduleType: 'LIMPEZA_URBANA', name: 'Limpeza Urbana', description: 'Solicitações de limpeza urbana', defaultSLA: 3 },
  { moduleType: 'COLETA_ESPECIAL', name: 'Coleta Especial', description: 'Solicitação de coleta especial', defaultSLA: 5 },
  { moduleType: 'SOLICITACAO_CAPINA', name: 'Solicitação de Capina', description: 'Solicitação de capina', defaultSLA: 7 },
  { moduleType: 'SOLICITACAO_DESOBSTRUCAO', name: 'Solicitação Desobstrução', description: 'Solicitação de desobstrução', defaultSLA: 3 },

  // TURISMO
  { moduleType: 'ATENDIMENTOS_TURISMO', name: 'Atendimentos Turismo', description: 'Atendimentos de turismo', defaultSLA: 5 },
  { moduleType: 'CADASTRO_ESTABELECIMENTO_TURISTICO', name: 'Estabelecimentos Turísticos', description: 'Cadastro de estabelecimentos turísticos', defaultSLA: 10 },
  { moduleType: 'CADASTRO_GUIA_TURISTICO', name: 'Guias Turísticos', description: 'Cadastro de guias turísticos', defaultSLA: 10 },
  { moduleType: 'INSCRICAO_PROGRAMA_TURISTICO', name: 'Programas Turísticos', description: 'Inscrição em programas turísticos', defaultSLA: 7 },
  { moduleType: 'REGISTRO_ATRATIVO_TURISTICO', name: 'Atrativos Turísticos', description: 'Registro de atrativos turísticos', defaultSLA: 10 },
  { moduleType: 'CADASTRO_ROTEIRO_TURISTICO', name: 'Roteiros Turísticos', description: 'Cadastro de roteiros turísticos', defaultSLA: 10 },
  { moduleType: 'CADASTRO_EVENTO_TURISTICO', name: 'Eventos Turísticos', description: 'Cadastro de eventos turísticos', defaultSLA: 10 },
];

export async function seedModuleWorkflows() {
  console.log('\n📦 Iniciando seed de ModuleWorkflows...');

  let created = 0;
  let updated = 0;

  for (const module of moduleWorkflows) {
    const existing = await prisma.moduleWorkflow.findUnique({
      where: { moduleType: module.moduleType },
    });

    if (existing) {
      await prisma.moduleWorkflow.update({
        where: { moduleType: module.moduleType },
        data: {
          name: module.name,
          description: module.description,
          stages: defaultStages,
          defaultSLA: module.defaultSLA,
        },
      });
      updated++;
      console.log(`   🔄 ${module.name}`);
    } else {
      await prisma.moduleWorkflow.create({
        data: {
          moduleType: module.moduleType,
          name: module.name,
          description: module.description,
          stages: defaultStages,
          defaultSLA: module.defaultSLA,
        },
      });
      created++;
      console.log(`   ✅ ${module.name}`);
    }
  }

  console.log(`\n✅ ModuleWorkflows: ${created} criados, ${updated} atualizados`);
  return { created, updated };
}

// Executar seed se chamado diretamente
if (require.main === module) {
  seedModuleWorkflows()
    .then(() => {
      console.log('✅ Seed de ModuleWorkflows concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar seed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
