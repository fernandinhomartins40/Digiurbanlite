/**
 * Script Master de Migração: Apps de Saúde → Sistema Unificado V2.0
 *
 * Este script executa todos os passos de migração na ordem correta:
 * 1. DadosSaude → HealthProfessionalData
 * 2. UnidadeSaude → OrganizationalUnit
 * 3. ProfissionalUnidade → EmployeeAssignment
 * 4. EquipeSaude → Team + ProfissionalEquipe → TeamMember
 *
 * Execução: npx tsx scripts/migrate-health-to-unified-system.ts
 */

import { execSync } from 'child_process';

const SCRIPTS = [
  {
    name: 'Migração de Dados Profissionais',
    script: 'migrate-health-professional-data.ts',
    description: 'DadosSaude → HealthProfessionalData',
  },
  {
    name: 'Mapeamento de Unidades',
    script: 'map-health-units-to-org-structure.ts',
    description: 'UnidadeSaude → OrganizationalUnit',
  },
  {
    name: 'Migração de Vínculos',
    script: 'migrate-health-assignments.ts',
    description: 'ProfissionalUnidade → EmployeeAssignment',
  },
  {
    name: 'Migração de Equipes',
    script: 'migrate-health-teams.ts',
    description: 'EquipeSaude → Team + ProfissionalEquipe → TeamMember',
  },
];

async function runMigration() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   MIGRAÇÃO COMPLETA: Apps de Saúde → Sistema Unificado   ║');
  console.log('║                      V2.0                                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('📋 Ordem de execução:');
  SCRIPTS.forEach((script, index) => {
    console.log(`   ${index + 1}. ${script.name}`);
    console.log(`      → ${script.description}\n`);
  });

  console.log('⚠️  ATENÇÃO: Esta migração irá:');
  console.log('   • Criar novos registros no Sistema Unificado V2.0');
  console.log('   • Manter dados legados intactos (não destrutivo)');
  console.log('   • Criar vínculos entre sistemas legado e novo\n');

  console.log('═══════════════════════════════════════════════════════════\n');

  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < SCRIPTS.length; i++) {
    const script = SCRIPTS[i];
    console.log(`\n🚀 EXECUTANDO PASSO ${i + 1}/${SCRIPTS.length}: ${script.name}`);
    console.log(`   ${script.description}`);
    console.log('───────────────────────────────────────────────────────────\n');

    try {
      execSync(`npx tsx scripts/${script.script}`, {
        stdio: 'inherit',
        cwd: process.cwd(),
      });
      successCount++;
      console.log(`\n✅ PASSO ${i + 1} CONCLUÍDO COM SUCESSO!\n`);
    } catch (error) {
      errorCount++;
      console.error(`\n❌ ERRO NO PASSO ${i + 1}!`);
      console.error('   Verifique os logs acima para mais detalhes.');
      console.error('   Os próximos passos podem falhar devido a este erro.\n');

      // Perguntar se deve continuar
      console.log('   Deseja continuar com os próximos passos? (Ctrl+C para cancelar)\n');
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                  MIGRAÇÃO FINALIZADA                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log('📊 RESUMO GERAL:');
  console.log(`   ✅ Scripts executados com sucesso: ${successCount}/${SCRIPTS.length}`);
  console.log(`   ❌ Scripts com erro: ${errorCount}/${SCRIPTS.length}`);
  console.log(`   ⏱️  Tempo total: ${duration}s\n`);

  if (errorCount === 0) {
    console.log('🎉 SUCESSO! Todos os dados foram migrados para o Sistema Unificado V2.0\n');
    console.log('📋 Próximos passos:');
    console.log('   1. Revisar os dados migrados no banco');
    console.log('   2. Testar as rotas adaptadoras');
    console.log('   3. Atualizar frontend para usar Sistema Unificado V2.0');
    console.log('   4. Após validação completa, eliminar modelos legados\n');
  } else {
    console.log('⚠️  ATENÇÃO! Alguns scripts falharam.');
    console.log('   Revise os erros acima antes de prosseguir.\n');
  }
}

// Executar migração
runMigration().catch((error) => {
  console.error('💥 Erro fatal na migração:', error);
  process.exit(1);
});
