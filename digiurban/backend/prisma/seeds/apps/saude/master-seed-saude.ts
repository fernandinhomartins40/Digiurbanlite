/**
 * MASTER SEED - APPS DE SAÚDE
 *
 * Executa todos os seeds dos Apps de Saúde na ordem correta
 * com integração total ao Sistema Unificado de Vinculações V2.0
 *
 * Ordem de execução:
 * 1. Unidades de Saúde Completas (estrutura organizacional + unidades)
 * 2. Servidores de Saúde (users + healthProfessionalData)
 * 3. Vínculos Profissionais (positions + employeeAssignments)
 * 4. Equipes de Saúde (teams + equipeSaude + teamMembers)
 * 5. Especialidades e CBOs (catálogos de referência)
 * 6. Agendas e Turnos (salas + turnos + configurações)
 *
 * IMPORTANTE: Este seed pode ser executado múltiplas vezes de forma segura (idempotente)
 */

import { PrismaClient } from '@prisma/client';
import { seed01UnidadesSaudeCompletas } from './01-unidades-saude-completas.seed';
import { seed02ServidoresSaude } from './02-servidores-saude.seed';
import { seed03VinculosProfissionais } from './03-vinculos-profissionais.seed';
import { seed04EquipesSaude } from './04-equipes-saude.seed';
import { seed05EspecialidadesCBO } from './05-especialidades-cbo.seed';
import { seed06AgendasTurnos } from './06-agendas-turnos.seed';

const prisma = new PrismaClient();

async function masterSeedSaude() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🏥  MASTER SEED - APPS DE SAÚDE');
  console.log('    Sistema Unificado de Vinculações V2.0');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('\n');

  const startTime = Date.now();

  try {
    // =====================================================
    // SEED 01: UNIDADES DE SAÚDE COMPLETAS
    // =====================================================
    console.log('━━━ ETAPA 1/6: UNIDADES DE SAÚDE ━━━\n');
    const unidades = await seed01UnidadesSaudeCompletas();
    console.log('\n');

    // =====================================================
    // SEED 02: SERVIDORES DE SAÚDE
    // =====================================================
    console.log('━━━ ETAPA 2/6: SERVIDORES DE SAÚDE ━━━\n');
    const servidores = await seed02ServidoresSaude();
    console.log('\n');

    // =====================================================
    // SEED 03: VÍNCULOS PROFISSIONAIS
    // =====================================================
    console.log('━━━ ETAPA 3/6: VÍNCULOS PROFISSIONAIS ━━━\n');
    const vinculos = await seed03VinculosProfissionais();
    console.log('\n');

    // =====================================================
    // SEED 04: EQUIPES DE SAÚDE
    // =====================================================
    console.log('━━━ ETAPA 4/6: EQUIPES DE SAÚDE ━━━\n');
    const equipes = await seed04EquipesSaude();
    console.log('\n');

    // =====================================================
    // SEED 05: ESPECIALIDADES E CBOs
    // =====================================================
    console.log('━━━ ETAPA 5/6: ESPECIALIDADES E CBOs ━━━\n');
    const referencias = await seed05EspecialidadesCBO();
    console.log('\n');

    // =====================================================
    // SEED 06: AGENDAS E TURNOS
    // =====================================================
    console.log('━━━ ETAPA 6/6: AGENDAS E TURNOS ━━━\n');
    const agendas = await seed06AgendasTurnos();
    console.log('\n');

    // =====================================================
    // RESUMO FINAL
    // =====================================================

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('✅  MASTER SEED CONCLUÍDO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('\n');
    console.log('📊 RESUMO GERAL:');
    console.log('\n');
    console.log('  🏥 UNIDADES DE SAÚDE:');
    console.log(`     • ${unidades.length} unidades criadas`);
    console.log(`     • 4 UBS + 2 ESF + 1 Policlínica`);
    console.log(`     • 2 UPA + 1 Hospital + 1 CAPS + 1 CER`);
    console.log('\n');
    console.log('  👥 RECURSOS HUMANOS:');
    console.log(`     • ${servidores.length} servidores de saúde`);
    console.log(`     • ${vinculos.length} vínculos funcionais criados`);
    console.log(`     • ${equipes.length} equipes de saúde`);
    console.log('\n');
    console.log('  📋 DADOS DE REFERÊNCIA:');
    console.log(`     • ${referencias.especialidades.length} especialidades médicas`);
    console.log(`     • ${referencias.cbos.length} códigos CBO`);
    console.log(`     • ${referencias.mapeamentoEspCBO.length} mapeamentos especialidade→CBO`);
    console.log('\n');
    console.log('  📅 AGENDAMENTO:');
    console.log(`     • ${agendas.salas} salas de consultório`);
    console.log(`     • ${agendas.turnos} turnos de trabalho`);
    console.log(`     • ${agendas.configs} configurações de atendimento`);
    console.log(`     • ${agendas.agendas} configurações de agenda`);
    console.log('\n');
    console.log('  🔗 INTEGRAÇÃO:');
    console.log('     • ✅ Sistema Unificado V2.0 (100%)');
    console.log('     • ✅ EmployeeAssignment (vínculos)');
    console.log('     • ✅ Team + TeamMember (equipes)');
    console.log('     • ✅ Position (cargos)');
    console.log('     • ✅ OrganizationalUnit (estrutura)');
    console.log('     • ✅ AssignmentAudit (auditoria)');
    console.log('\n');
    console.log(`  ⏱️  Tempo de execução: ${duration}s`);
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('🎉  DADOS REALISTAS PRONTOS PARA TESTES!');
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('\n');
    console.log('📖 PRÓXIMOS PASSOS:');
    console.log('\n');
    console.log('  1. Testar agendamento de consultas');
    console.log('  2. Validar fluxo de atendimento ESF');
    console.log('  3. Verificar hierarquia organizacional');
    console.log('  4. Testar múltiplos vínculos profissionais');
    console.log('  5. Explorar auditoria de vínculos');
    console.log('  6. Testar formação de equipes');
    console.log('\n');
    console.log('🔑 CREDENCIAIS DE TESTE:');
    console.log('  Email: [nome]@saude.sp.gov.br');
    console.log('  Senha: senha123');
    console.log('  Exemplos:');
    console.log('    • joao.silva@saude.sp.gov.br');
    console.log('    • maria.costa@saude.sp.gov.br');
    console.log('    • ana.rodrigues@saude.sp.gov.br');
    console.log('\n');

  } catch (error) {
    console.error('\n');
    console.error('═══════════════════════════════════════════════════════════════════');
    console.error('❌  ERRO AO EXECUTAR MASTER SEED');
    console.error('═══════════════════════════════════════════════════════════════════');
    console.error('\n');
    console.error('Detalhes do erro:');
    console.error(error);
    console.error('\n');
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  masterSeedSaude()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Falha ao executar master seed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default masterSeedSaude;
