/**
 * Script de Migração: ProfissionalUnidade → EmployeeAssignment
 *
 * Este script migra todos os vínculos de ProfissionalUnidade (legado) para
 * EmployeeAssignment (Sistema Unificado V2.0)
 *
 * Execução: npx tsx scripts/migrate-health-assignments.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateProfissionalUnidadeToAssignments() {
  console.log('🔄 Iniciando migração: ProfissionalUnidade → EmployeeAssignment');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Buscar todos os vínculos ProfissionalUnidade
    const vinculos = await prisma.profissionalUnidade.findMany({
      include: {
        profissional: {
          include: {
            department: true,
            healthData: true,
          },
        },
        unidade: {
          include: {
            organizationalUnit: true,
          },
        },
      },
      orderBy: { dataInicio: 'asc' },
    });

    console.log(`📊 Total de vínculos a migrar: ${vinculos.length}\n`);

    let migrados = 0;
    let semDadosSaude = 0;
    let semOrgUnit = 0;
    let erros = 0;

    for (const vinculo of vinculos) {
      try {
        // Verificar se profissional tem dados de saúde
        if (!vinculo.profissional.healthData) {
          console.log(`⚠️  ${vinculo.profissional.name} não tem HealthProfessionalData - pulando`);
          semDadosSaude++;
          continue;
        }

        // Verificar se unidade foi mapeada
        if (!vinculo.unidade.organizationalUnit) {
          console.log(`⚠️  Unidade ${vinculo.unidade.nome} não tem OrganizationalUnit - pulando`);
          semOrgUnit++;
          continue;
        }

        // Buscar ou criar Position baseada na categoria profissional
        let position = await prisma.position.findFirst({
          where: {
            departmentId: vinculo.profissional.departmentId!,
            nome: vinculo.profissional.healthData.categoria,
          },
        });

        if (!position) {
          // Criar Position se não existir
          position = await prisma.position.create({
            data: {
              nome: vinculo.profissional.healthData.categoria,
              descricao: `Cargo: ${vinculo.profissional.healthData.categoria}`,
              tipo: 'EFETIVO',
              nivel: 'OPERACIONAL',
              departmentId: vinculo.profissional.departmentId!,
              quantidadeVagas: 0,
              isActive: true,
            },
          });
        }

        // Mapear situação
        const situacao = vinculo.ativo ? 'ATIVO' : 'ENCERRADO';

        // Criar EmployeeAssignment
        const assignment = await prisma.employeeAssignment.create({
          data: {
            userId: vinculo.profissionalId,
            departmentId: vinculo.profissional.departmentId!,
            organizationalUnitId: vinculo.unidade.organizationalUnitId!,
            positionId: position.id,
            tipo: 'FUNCIONAL',
            situacao: situacao,
            isPrimary: false,
            dataInicio: vinculo.dataInicio,
            dataFim: vinculo.dataFim,
            cargaHoraria: vinculo.cargaHoraria,
            percentualDedicacao: vinculo.percentualDedicacao,
            observacoes: `Migrado de ProfissionalUnidade - ${vinculo.unidade.nome}`,
          },
        });

        // Criar auditoria
        await prisma.assignmentAudit.create({
          data: {
            assignmentId: assignment.id,
            tipo: 'CRIACAO',
            userId: vinculo.profissionalId,
            userName: vinculo.profissional.name,
            dataAcao: vinculo.createdAt,
            motivo: 'Migração de dados legados',
            observacoes: `ProfissionalUnidade → EmployeeAssignment. Unidade: ${vinculo.unidade.nome} (CNES: ${vinculo.unidade.cnes || 'N/A'})`,
          },
        });

        console.log(
          `✅ Migrado: ${vinculo.profissional.name} → ${vinculo.unidade.nome} (${situacao})`
        );
        migrados++;
      } catch (error: any) {
        console.error(
          `❌ Erro ao migrar vínculo de ${vinculo.profissional.name}:`,
          error.message
        );
        erros++;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMO DA MIGRAÇÃO:');
    console.log(`   ✅ Vínculos migrados: ${migrados}`);
    console.log(`   ⚠️  Sem HealthProfessionalData: ${semDadosSaude}`);
    console.log(`   ⚠️  Sem OrganizationalUnit: ${semOrgUnit}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📊 Total processado: ${vinculos.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (erros === 0 && semDadosSaude === 0 && semOrgUnit === 0) {
      console.log('✅ Migração concluída com sucesso!\n');
    } else {
      console.log('⚠️  Migração concluída com avisos. Revise os logs acima.\n');
      if (semDadosSaude > 0) {
        console.log(
          `💡 Execute primeiro: npx tsx scripts/migrate-health-professional-data.ts`
        );
      }
      if (semOrgUnit > 0) {
        console.log(
          `💡 Execute primeiro: npx tsx scripts/map-health-units-to-org-structure.ts\n`
        );
      }
    }
  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateProfissionalUnidadeToAssignments()
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
