/**
 * Script de teste para verificar registro de handlers
 */

import { initializeHandlers, getRegistryStats, getRegisteredModuleTypes } from './src/modules/handlers/registry';

async function testHandlers() {
  console.log('🧪 Testando registro de handlers da Fase 2...\n');

  try {
    // Inicializar handlers
    await initializeHandlers();

    // Obter estatísticas
    const stats = getRegistryStats();
    const moduleTypes = getRegisteredModuleTypes();

    console.log('\n📊 ESTATÍSTICAS DO REGISTRY:\n');
    console.log(`Total de handlers: ${stats.totalHandlers}`);
    console.log('\nHandlers por departamento:');
    Object.entries(stats.handlersByDepartment).forEach(([dept, count]) => {
      console.log(`  ${dept}: ${count} handlers`);
    });

    // Verificar handlers específicos da Fase 2
    console.log('\n🎯 VERIFICANDO HANDLERS DA FASE 2:\n');

    const fase2Handlers = [
      // Educação
      'ATENDIMENTOS_EDUCACAO',
      'MATRICULA_ALUNO',
      'TRANSPORTE_ESCOLAR',
      'REGISTRO_OCORRENCIA_ESCOLAR',
      'SOLICITACAO_DOCUMENTO_ESCOLAR',
      'TRANSFERENCIA_ESCOLAR',
      'CONSULTA_FREQUENCIA',
      'CONSULTA_NOTAS',
      'GESTAO_ESCOLAR',
      'GESTAO_MERENDA',
      'MATERIAL_ESCOLAR',

      // Saúde
      'ATENDIMENTOS_SAUDE',
      'AGENDAMENTOS_MEDICOS',
      'CONTROLE_MEDICAMENTOS',
      'CAMPANHAS_SAUDE',
      'PROGRAMAS_SAUDE',
      'EXAMES',
      'VACINACAO',
      'ATENDIMENTO_DOMICILIAR',
      'ENCAMINHAMENTOS_TFD',
      'TRANSPORTE_PACIENTES',
      'CADASTRO_PACIENTE',
      'GESTAO_ACS',

      // Assistência Social
      'ATENDIMENTOS_ASSISTENCIA_SOCIAL',
      'CADASTRO_UNICO',
      'SOLICITACAO_BENEFICIO',
      'ENTREGA_EMERGENCIAL',
      'INSCRICAO_GRUPO_OFICINA',
      'VISITAS_DOMICILIARES',
      'INSCRICAO_PROGRAMA_SOCIAL',
      'AGENDAMENTO_ATENDIMENTO_SOCIAL',
      'GESTAO_CRAS_CREAS',
      'SOLICITACAO_DOCUMENTO_SOCIAL'
    ];

    let registered = 0;
    let missing = 0;

    fase2Handlers.forEach(handler => {
      const isRegistered = moduleTypes.includes(handler);
      if (isRegistered) {
        console.log(`  ✅ ${handler}`);
        registered++;
      } else {
        console.log(`  ❌ ${handler} - NÃO REGISTRADO`);
        missing++;
      }
    });

    console.log(`\n📈 RESULTADO:`);
    console.log(`  Registrados: ${registered}/${fase2Handlers.length} (${Math.round(registered/fase2Handlers.length*100)}%)`);
    console.log(`  Faltando: ${missing}`);

    if (missing === 0) {
      console.log('\n✅ TODOS OS HANDLERS DA FASE 2 ESTÃO REGISTRADOS!\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  ALGUNS HANDLERS NÃO FORAM REGISTRADOS\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Erro ao testar handlers:', error);
    process.exit(1);
  }
}

testHandlers();
