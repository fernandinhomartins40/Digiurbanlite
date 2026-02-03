/**
 * SCRIPT DE VALIDAÇÃO - SEEDS DOS APPS DE SAÚDE
 *
 * Valida se todos os seeds de saúde foram executados corretamente
 * e se os dados estão íntegros no banco de dados.
 *
 * Uso: npx tsx scripts/validate-seeds-saude.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function validateSeedsSaude() {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🔍  VALIDAÇÃO - SEEDS DOS APPS DE SAÚDE');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('\n');

  let hasErrors = false;

  try {
    // =====================================================
    // 1. VALIDAR ESTRUTURA ORGANIZACIONAL
    // =====================================================
    console.log('1️⃣  Estrutura Organizacional');
    console.log('   ─────────────────────────────');

    const departamentoSaude = await prisma.department.findFirst({
      where: { code: 'SAUDE' }
    });

    if (!departamentoSaude) {
      console.log('   ❌ ERRO: Departamento de Saúde não encontrado');
      hasErrors = true;
    } else {
      console.log(`   ✅ Departamento de Saúde: ${departamentoSaude.name}`);
    }

    const orgUnits = await prisma.organizationalUnit.count({
      where: { departmentId: departamentoSaude?.id }
    });

    if (orgUnits === 0) {
      console.log('   ❌ ERRO: Nenhuma unidade organizacional encontrada');
      hasErrors = true;
    } else if (orgUnits < 16) {
      console.log(`   ⚠️  AVISO: Esperado 16+ unidades, encontrado ${orgUnits}`);
    } else {
      console.log(`   ✅ Unidades Organizacionais: ${orgUnits}`);
    }

    // =====================================================
    // 2. VALIDAR UNIDADES DE SAÚDE
    // =====================================================
    console.log('\n2️⃣  Unidades de Saúde');
    console.log('   ─────────────────────────────');

    const unidadesSaude = await prisma.unidadeSaude.count({
      where: { isActive: true }
    });

    if (unidadesSaude === 0) {
      console.log('   ❌ ERRO: Nenhuma unidade de saúde encontrada');
      hasErrors = true;
    } else if (unidadesSaude < 12) {
      console.log(`   ⚠️  AVISO: Esperado 12 unidades, encontrado ${unidadesSaude}`);
    } else {
      console.log(`   ✅ Unidades de Saúde: ${unidadesSaude}`);
    }

    // Verificar vinculação com OrganizationalUnit
    const unidadesVinculadas = await prisma.unidadeSaude.count({
      where: {
        isActive: true,
        organizationalUnitId: { not: null }
      }
    });

    if (unidadesVinculadas < unidadesSaude) {
      console.log(`   ⚠️  AVISO: ${unidadesSaude - unidadesVinculadas} unidades sem vínculo organizacional`);
    } else {
      console.log(`   ✅ Todas as unidades vinculadas ao Sistema Unificado`);
    }

    // =====================================================
    // 3. VALIDAR SERVIDORES DE SAÚDE
    // =====================================================
    console.log('\n3️⃣  Servidores de Saúde');
    console.log('   ─────────────────────────────');

    const servidores = await prisma.user.count({
      where: {
        email: { endsWith: '@saude.sp.gov.br' }
      }
    });

    if (servidores === 0) {
      console.log('   ❌ ERRO: Nenhum servidor de saúde encontrado');
      hasErrors = true;
    } else if (servidores < 25) {
      console.log(`   ⚠️  AVISO: Esperado 25 servidores, encontrado ${servidores}`);
    } else {
      console.log(`   ✅ Servidores de Saúde: ${servidores}`);
    }

    const healthData = await prisma.healthProfessionalData.count();

    if (healthData === 0) {
      console.log('   ❌ ERRO: Nenhum dado profissional de saúde encontrado');
      hasErrors = true;
    } else if (healthData < servidores) {
      console.log(`   ⚠️  AVISO: ${servidores - healthData} servidores sem dados profissionais`);
    } else {
      console.log(`   ✅ Dados Profissionais: ${healthData}`);
    }

    // Validar registros profissionais únicos
    const registrosUnicos = await prisma.healthProfessionalData.findMany({
      where: { registroProfissional: { not: null } },
      select: { registroProfissional: true }
    });

    const registrosDuplicados = registrosUnicos.length - new Set(registrosUnicos.map(r => r.registroProfissional)).size;

    if (registrosDuplicados > 0) {
      console.log(`   ⚠️  AVISO: ${registrosDuplicados} registros profissionais duplicados`);
    } else {
      console.log(`   ✅ Todos os registros profissionais são únicos`);
    }

    // =====================================================
    // 4. VALIDAR VÍNCULOS PROFISSIONAIS
    // =====================================================
    console.log('\n4️⃣  Vínculos Profissionais');
    console.log('   ─────────────────────────────');

    const vinculos = await prisma.employeeAssignment.count({
      where: { departmentId: departamentoSaude?.id }
    });

    if (vinculos === 0) {
      console.log('   ❌ ERRO: Nenhum vínculo profissional encontrado');
      hasErrors = true;
    } else if (vinculos < 35) {
      console.log(`   ⚠️  AVISO: Esperado 35+ vínculos, encontrado ${vinculos}`);
    } else {
      console.log(`   ✅ Vínculos Funcionais: ${vinculos}`);
    }

    const vinculosPrimarios = await prisma.employeeAssignment.count({
      where: {
        departmentId: departamentoSaude?.id,
        isPrimary: true
      }
    });

    console.log(`   ✅ Vínculos Primários: ${vinculosPrimarios}`);
    console.log(`   ✅ Vínculos Secundários: ${vinculos - vinculosPrimarios}`);

    const cargos = await prisma.position.count({
      where: { departmentId: departamentoSaude?.id }
    });

    if (cargos < 13) {
      console.log(`   ⚠️  AVISO: Esperado 13 cargos, encontrado ${cargos}`);
    } else {
      console.log(`   ✅ Cargos (Positions): ${cargos}`);
    }

    const auditorias = await prisma.assignmentAudit.count();

    if (auditorias < vinculos) {
      console.log(`   ⚠️  AVISO: ${vinculos - auditorias} vínculos sem auditoria`);
    } else {
      console.log(`   ✅ Registros de Auditoria: ${auditorias}`);
    }

    // =====================================================
    // 5. VALIDAR EQUIPES DE SAÚDE
    // =====================================================
    console.log('\n5️⃣  Equipes de Saúde');
    console.log('   ─────────────────────────────');

    const equipesSaude = await prisma.equipeSaude.count({
      where: { ativo: true }
    });

    if (equipesSaude === 0) {
      console.log('   ❌ ERRO: Nenhuma equipe de saúde encontrada');
      hasErrors = true;
    } else if (equipesSaude < 8) {
      console.log(`   ⚠️  AVISO: Esperado 8 equipes, encontrado ${equipesSaude}`);
    } else {
      console.log(`   ✅ Equipes de Saúde: ${equipesSaude}`);
    }

    const teamsUnificadas = await prisma.team.count({
      where: { departmentId: departamentoSaude?.id }
    });

    if (teamsUnificadas < equipesSaude) {
      console.log(`   ⚠️  AVISO: ${equipesSaude - teamsUnificadas} equipes sem vínculo unificado`);
    } else {
      console.log(`   ✅ Teams (Sistema Unificado): ${teamsUnificadas}`);
    }

    const teamMembers = await prisma.teamMember.count({
      where: {
        team: { departmentId: departamentoSaude?.id }
      }
    });

    if (teamMembers === 0) {
      console.log('   ❌ ERRO: Nenhum membro de equipe encontrado');
      hasErrors = true;
    } else {
      console.log(`   ✅ Membros de Equipes: ${teamMembers}`);
    }

    // =====================================================
    // 6. VALIDAR INFRAESTRUTURA
    // =====================================================
    console.log('\n6️⃣  Infraestrutura');
    console.log('   ─────────────────────────────');

    const salas = await prisma.salaConsultorio.count({
      where: { ativa: true }
    });

    if (salas === 0) {
      console.log('   ❌ ERRO: Nenhuma sala de consultório encontrada');
      hasErrors = true;
    } else if (salas < 40) {
      console.log(`   ⚠️  AVISO: Esperado 40+ salas, encontrado ${salas}`);
    } else {
      console.log(`   ✅ Salas de Consultório: ${salas}`);
    }

    const turnos = await prisma.turnoTrabalho.count({
      where: { ativo: true }
    });

    if (turnos < 5) {
      console.log(`   ⚠️  AVISO: Esperado 5 turnos, encontrado ${turnos}`);
    } else {
      console.log(`   ✅ Turnos de Trabalho: ${turnos}`);
    }

    const configsAtendimento = await prisma.configuracaoAtendimento.count();

    console.log(`   ✅ Configurações de Atendimento: ${configsAtendimento}`);

    const agendas = await prisma.configuracaoAgenda.count({
      where: { ativo: true }
    });

    console.log(`   ✅ Configurações de Agenda: ${agendas}`);

    // =====================================================
    // RESUMO FINAL
    // =====================================================
    console.log('\n');
    console.log('═══════════════════════════════════════════════════════════════════');
    if (hasErrors) {
      console.log('❌  VALIDAÇÃO FALHOU - Existem erros críticos');
    } else {
      console.log('✅  VALIDAÇÃO BEM-SUCEDIDA - Todos os seeds foram executados');
    }
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('\n');

    if (!hasErrors) {
      console.log('📊 ESTATÍSTICAS FINAIS:');
      console.log(`   • ${orgUnits} Unidades Organizacionais`);
      console.log(`   • ${unidadesSaude} Unidades de Saúde`);
      console.log(`   • ${servidores} Servidores de Saúde`);
      console.log(`   • ${healthData} Dados Profissionais`);
      console.log(`   • ${vinculos} Vínculos Funcionais`);
      console.log(`   • ${cargos} Cargos (Positions)`);
      console.log(`   • ${auditorias} Registros de Auditoria`);
      console.log(`   • ${equipesSaude} Equipes de Saúde`);
      console.log(`   • ${teamsUnificadas} Teams Unificadas`);
      console.log(`   • ${teamMembers} Membros de Equipes`);
      console.log(`   • ${salas} Salas de Consultório`);
      console.log(`   • ${turnos} Turnos de Trabalho`);
      console.log(`   • ${configsAtendimento} Configurações de Atendimento`);
      console.log(`   • ${agendas} Configurações de Agenda`);
      console.log('\n');
      console.log('🎉 Sistema pronto para testes!');
      console.log('\n');
    }

    return !hasErrors;

  } catch (error) {
    console.error('\n❌ ERRO DURANTE VALIDAÇÃO:', error);
    return false;
  }
}

// Executar validação
validateSeedsSaude()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
