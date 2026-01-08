const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista de workflows do seed
const workflowModules = [
  'ATENDIMENTOS_SAUDE', 'AGENDAMENTOS_MEDICOS', 'CONTROLE_MEDICAMENTOS', 'CAMPANHAS_SAUDE',
  'PROGRAMAS_SAUDE', 'ENCAMINHAMENTOS_TFD', 'EXAMES', 'TRANSPORTE_PACIENTES',
  'CADASTRO_PACIENTE', 'VACINACAO', 'GESTAO_ACS',
  'MATRICULA_ESCOLAR', 'TRANSFERENCIA_ESCOLAR', 'GESTAO_MERENDA', 'MATRICULA_ALUNO',
  'TRANSPORTE_ESCOLAR', 'INSCRICAO_CURSO_LIVRE', 'CADASTRO_PROFESSOR', 'ATENDIMENTOS_EDUCACAO',
  'REGISTRO_OCORRENCIA_ESCOLAR', 'SOLICITACAO_DOCUMENTO_ESCOLAR', 'CONSULTA_FREQUENCIA',
  'CONSULTA_NOTAS', 'GESTAO_ESCOLAR',
  'ATENDIMENTOS_ASSISTENCIA_SOCIAL', 'SOLICITACAO_BENEFICIO', 'CADASTRO_UNICO', 'BOLSA_FAMILIA',
  'ATENDIMENTO_CRAS', 'CESTA_BASICA', 'GESTAO_BENEFICIOS', 'ENTREGA_EMERGENCIAL',
  'INSCRICAO_GRUPO_OFICINA', 'VISITAS_DOMICILIARES', 'INSCRICAO_PROGRAMA_SOCIAL',
  'AGENDAMENTO_ATENDIMENTO_SOCIAL', 'GESTAO_CRAS_CREAS',
  'CADASTRO_PRODUTOR', 'SOLICITACAO_MAQUINAS', 'FEIRA_PRODUTOR', 'PROGRAMA_SEMENTES',
  'ATENDIMENTOS_AGRICULTURA', 'ASSISTENCIA_TECNICA', 'INSCRICAO_CURSO_RURAL',
  'INSCRICAO_PROGRAMA_RURAL', 'CADASTRO_PROPRIEDADE_RURAL',
  'INSCRICAO_OFICINA', 'CADASTRO_ARTISTA', 'INSCRICAO_EDITAL', 'ATENDIMENTOS_CULTURA',
  'INSCRICAO_ESCOLINHA', 'RESERVA_ESPACO_CULTURAL', 'INSCRICAO_OFICINA_CULTURAL',
  'CADASTRO_GRUPO_ARTISTICO', 'PROJETO_CULTURAL', 'SUBMISSAO_PROJETO_CULTURAL',
  'CADASTRO_EVENTO_CULTURAL', 'REGISTRO_MANIFESTACAO_CULTURAL',
  'INSCRICAO_MODALIDADE', 'ALUGUEL_QUADRA', 'INSCRICAO_TORNEIO', 'ATENDIMENTOS_ESPORTES',
  'CADASTRO_ATLETA', 'RESERVA_ESPACO_ESPORTIVO', 'INSCRICAO_COMPETICAO',
  'CADASTRO_EQUIPE_ESPORTIVA', 'CADASTRO_MODALIDADE',
  'REGULARIZACAO_FUNDIARIA', 'MINHA_CASA', 'AUTORIZACAO_CONSTRUCAO', 'ATENDIMENTOS_HABITACAO',
  'INSCRICAO_PROGRAMA_HABITACIONAL', 'SOLICITACAO_AUXILIO_ALUGUEL',
  'CADASTRO_UNIDADE_HABITACIONAL', 'INSCRICAO_FILA_HABITACAO',
  'LICENCIAMENTO_AMBIENTAL', 'COLETA_SELETIVA', 'GESTAO_RESIDUOS', 'AUTORIZACAO_PODA',
  'ATENDIMENTOS_MEIO_AMBIENTE', 'LICENCA_AMBIENTAL', 'DENUNCIA_AMBIENTAL',
  'PROGRAMA_AMBIENTAL', 'AUTORIZACAO_PODA_CORTE', 'VISTORIA_AMBIENTAL',
  'GESTAO_AREAS_PROTEGIDAS',
  'APROVACAO_PROJETO', 'AUTORIZACAO_DEMOLICAO', 'GESTAO_OBRAS', 'ATENDIMENTOS_OBRAS',
  'SOLICITACAO_REPARO_VIA', 'VISTORIA_TECNICA_OBRAS', 'CADASTRO_OBRA_PUBLICA', 'INSPECAO_OBRA',
  'PARCELAMENTO_SOLO', 'VIABILIDADE_URBANISTICA', 'ATENDIMENTOS_PLANEJAMENTO',
  'ALVARA_CONSTRUCAO', 'ALVARA_FUNCIONAMENTO', 'SOLICITACAO_CERTIDAO',
  'DENUNCIA_CONSTRUCAO_IRREGULAR', 'CADASTRO_LOTEAMENTO',
  'REGISTRO_OCORRENCIA', 'PATROLHAMENTO', 'AUTORIZACAO_EVENTO_SEG', 'ATENDIMENTOS_SEGURANCA',
  'SOLICITACAO_RONDA', 'SOLICITACAO_CAMERA_SEGURANCA', 'DENUNCIA_ANONIMA',
  'CADASTRO_PONTO_CRITICO', 'ALERTA_SEGURANCA', 'REGISTRO_PATRULHA',
  'GESTAO_GUARDA_MUNICIPAL', 'GESTAO_VIGILANCIA',
  'DESOBSTRUCAO_BUEIRO', 'SOLICITACAO_PODA', 'GESTAO_EQUIPES_SERVICOS',
  'ATENDIMENTOS_SERVICOS_PUBLICOS', 'ILUMINACAO_PUBLICA', 'LIMPEZA_URBANA',
  'COLETA_ESPECIAL', 'SOLICITACAO_CAPINA', 'SOLICITACAO_DESOBSTRUCAO',
  'ATENDIMENTOS_TURISMO', 'CADASTRO_ESTABELECIMENTO_TURISTICO', 'CADASTRO_GUIA_TURISTICO',
  'INSCRICAO_PROGRAMA_TURISTICO', 'REGISTRO_ATRATIVO_TURISTICO', 'CADASTRO_ROTEIRO_TURISTICO',
  'CADASTRO_EVENTO_TURISTICO'
];

async function compareServicesWorkflows() {
  try {
    // Buscar todos os serviços únicos por moduleType
    const services = await prisma.serviceSimplified.findMany({
      select: {
        moduleType: true,
        name: true
      },
      where: {
        moduleType: { not: null }
      }
    });

    // Agrupar por moduleType
    const serviceModules = {};
    services.forEach(s => {
      if (!serviceModules[s.moduleType]) {
        serviceModules[s.moduleType] = [];
      }
      serviceModules[s.moduleType].push(s.name);
    });

    const uniqueServiceModules = Object.keys(serviceModules).sort();

    console.log('='.repeat(80));
    console.log('COMPARAÇÃO: SERVIÇOS vs WORKFLOWS SEED');
    console.log('='.repeat(80));
    console.log();
    console.log(`Total de módulos em serviços: ${uniqueServiceModules.length}`);
    console.log(`Total de módulos em workflows seed: ${workflowModules.length}`);
    console.log();

    // Módulos que estão nos serviços mas NÃO estão no seed de workflows
    const missingInWorkflowSeed = uniqueServiceModules.filter(m => !workflowModules.includes(m));

    // Módulos que estão no seed de workflows mas NÃO estão nos serviços
    const extraInWorkflowSeed = workflowModules.filter(m => !uniqueServiceModules.includes(m));

    if (missingInWorkflowSeed.length > 0) {
      console.log('='.repeat(80));
      console.log('❌ MÓDULOS EM SERVIÇOS SEM WORKFLOW NO SEED:');
      console.log('='.repeat(80));
      console.log();

      missingInWorkflowSeed.forEach(moduleType => {
        const servicesUsingIt = serviceModules[moduleType];
        console.log(`❌ ${moduleType}`);
        console.log(`   Serviços (${servicesUsingIt.length}):`);
        servicesUsingIt.forEach(s => console.log(`      - ${s}`));
        console.log();
      });

      console.log(`Total: ${missingInWorkflowSeed.length} módulos precisam de workflow\n`);
    } else {
      console.log('✅ Todos os módulos de serviços têm workflow no seed!\n');
    }

    if (extraInWorkflowSeed.length > 0) {
      console.log('='.repeat(80));
      console.log('⚠️  MÓDULOS NO SEED DE WORKFLOWS SEM SERVIÇOS:');
      console.log('='.repeat(80));
      console.log();

      extraInWorkflowSeed.forEach(moduleType => {
        console.log(`⚠️  ${moduleType} (sem serviços usando)`);
      });

      console.log(`\nTotal: ${extraInWorkflowSeed.length} workflows sem serviços\n`);
    }

    // Gerar código para adicionar ao seed
    if (missingInWorkflowSeed.length > 0) {
      console.log('='.repeat(80));
      console.log('📝 CÓDIGO PARA ADICIONAR AO module-workflows.seed.ts:');
      console.log('='.repeat(80));
      console.log();

      missingInWorkflowSeed.forEach(moduleType => {
        const serviceName = serviceModules[moduleType][0]; // Usar o primeiro serviço como base
        const name = serviceName.replace(/^(Solicitação de |Cadastro de |Inscrição em |Autorização para |Aprovação de )/, '');
        console.log(`  { moduleType: '${moduleType}', name: '${name}', description: 'Gestão de ${name.toLowerCase()}', defaultSLA: 7 },`);
      });
      console.log();
    }

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareServicesWorkflows();
