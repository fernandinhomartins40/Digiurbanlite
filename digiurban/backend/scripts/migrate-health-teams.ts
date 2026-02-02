/**
 * Script de Migração: ProfissionalEquipe → TeamMember + EquipeSaude → Team
 *
 * Este script:
 * 1. Cria Teams no Sistema Unificado V2.0 para cada EquipeSaude
 * 2. Migra ProfissionalEquipe para TeamMember
 *
 * Execução: npx tsx scripts/migrate-health-teams.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateHealthTeams() {
  console.log('🔄 Iniciando migração: EquipeSaude → Team + ProfissionalEquipe → TeamMember');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Buscar Secretaria de Saúde
    const secretariaSaude = await prisma.department.findFirst({
      where: {
        OR: [
          { code: 'SMS' },
          { code: 'SAUDE' },
          { name: { contains: 'Saúde', mode: 'insensitive' } },
        ],
      },
    });

    if (!secretariaSaude) {
      throw new Error('Secretaria de Saúde não encontrada!');
    }

    // PARTE 1: Criar Teams para cada EquipeSaude
    console.log('📋 PARTE 1: Criando Teams para EquipeSaude\n');

    const equipeSaudeList = await prisma.equipeSaude.findMany({
      where: {
        teamId: null, // Apenas equipes não mapeadas
        ativo: true,
      },
      include: {
        unidade: {
          include: {
            organizationalUnit: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    console.log(`📊 Total de equipes a mapear: ${equipeSaudeList.length}\n`);

    let equipesMapeadas = 0;
    let equipesErro = 0;

    for (const equipe of equipeSaudeList) {
      try {
        // Criar Team no Sistema Unificado V2.0
        const team = await prisma.team.create({
          data: {
            nome: equipe.nome,
            sigla: equipe.ine,
            tipo: 'EQUIPE_TRABALHO',
            finalidade: `Equipe ${equipe.tipo} - INE: ${equipe.ine}`,
            departmentId: secretariaSaude.id,
            organizationalUnitId: equipe.unidade.organizationalUnitId,
            dataInicio: equipe.createdAt,
            ativo: equipe.ativo,
          },
        });

        // Vincular EquipeSaude com Team
        await prisma.equipeSaude.update({
          where: { id: equipe.id },
          data: { teamId: team.id },
        });

        console.log(
          `✅ Team criado: ${equipe.nome} (${equipe.tipo}) → ${team.sigla}`
        );
        equipesMapeadas++;
      } catch (error: any) {
        console.error(`❌ Erro ao criar Team para ${equipe.nome}:`, error.message);
        equipesErro++;
      }
    }

    console.log(`\n📊 Resultado PARTE 1: ${equipesMapeadas} equipes mapeadas, ${equipesErro} erros\n`);

    // PARTE 2: Migrar ProfissionalEquipe para TeamMember
    console.log('📋 PARTE 2: Migrando ProfissionalEquipe → TeamMember\n');

    const vinculosEquipe = await prisma.profissionalEquipe.findMany({
      include: {
        profissional: {
          select: {
            id: true,
            name: true,
            healthData: true,
          },
        },
        equipe: {
          include: {
            team: true,
          },
        },
      },
      orderBy: { dataInicio: 'asc' },
    });

    console.log(`📊 Total de vínculos de equipe a migrar: ${vinculosEquipe.length}\n`);

    let membrosMigrados = 0;
    let semTeam = 0;
    let semHealthData = 0;
    let membrosErro = 0;

    for (const vinculo of vinculosEquipe) {
      try {
        // Verificar se equipe tem Team vinculado
        if (!vinculo.equipe.team) {
          console.log(`⚠️  Equipe ${vinculo.equipe.nome} não tem Team vinculado - pulando`);
          semTeam++;
          continue;
        }

        // Verificar se profissional tem dados de saúde
        if (!vinculo.profissional.healthData) {
          console.log(
            `⚠️  ${vinculo.profissional.name} não tem HealthProfessionalData - pulando`
          );
          semHealthData++;
          continue;
        }

        // Verificar se já existe TeamMember
        const existingMember = await prisma.teamMember.findFirst({
          where: {
            teamId: vinculo.equipe.teamId!,
            userId: vinculo.profissionalId,
          },
        });

        if (existingMember) {
          console.log(
            `⚠️  ${vinculo.profissional.name} já é membro de ${vinculo.equipe.nome} - pulando`
          );
          continue;
        }

        // Criar TeamMember
        await prisma.teamMember.create({
          data: {
            teamId: vinculo.equipe.teamId!,
            userId: vinculo.profissionalId,
            funcao: vinculo.funcao || 'MEMBRO',
            dataInicio: vinculo.dataInicio,
            dataFim: vinculo.dataFim,
            ativo: vinculo.ativo,
            observacoes: `Migrado de ProfissionalEquipe. CBO: ${vinculo.cbo || 'N/A'}`,
          },
        });

        console.log(
          `✅ Membro migrado: ${vinculo.profissional.name} → ${vinculo.equipe.nome} (${vinculo.funcao || 'MEMBRO'})`
        );
        membrosMigrados++;
      } catch (error: any) {
        console.error(
          `❌ Erro ao migrar membro ${vinculo.profissional.name}:`,
          error.message
        );
        membrosErro++;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMO DA MIGRAÇÃO:');
    console.log('\nPARTE 1 - Equipes:');
    console.log(`   ✅ Teams criados: ${equipesMapeadas}`);
    console.log(`   ❌ Erros: ${equipesErro}`);
    console.log('\nPARTE 2 - Membros:');
    console.log(`   ✅ Membros migrados: ${membrosMigrados}`);
    console.log(`   ⚠️  Sem Team vinculado: ${semTeam}`);
    console.log(`   ⚠️  Sem HealthProfessionalData: ${semHealthData}`);
    console.log(`   ❌ Erros: ${membrosErro}`);
    console.log(`   📊 Total processado: ${vinculosEquipe.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (equipesErro === 0 && membrosErro === 0 && semTeam === 0 && semHealthData === 0) {
      console.log('✅ Migração concluída com sucesso!\n');
    } else {
      console.log('⚠️  Migração concluída com avisos. Revise os logs acima.\n');
      if (semHealthData > 0) {
        console.log(
          `💡 Execute primeiro: npx tsx scripts/migrate-health-professional-data.ts`
        );
      }
      if (semTeam > 0) {
        console.log(
          `💡 Algumas equipes não foram mapeadas. Verifique EquipeSaude.teamId\n`
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
migrateHealthTeams()
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
