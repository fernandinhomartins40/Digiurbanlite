/**
 * Script de Migração: DadosSaude → HealthProfessionalData
 *
 * Este script migra todos os dados de DadosSaude (legado) para HealthProfessionalData (Sistema Unificado V2.0)
 *
 * Execução: npx tsx scripts/migrate-health-professional-data.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateDadosSaudeToHealthData() {
  console.log('🔄 Iniciando migração: DadosSaude → HealthProfessionalData');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Buscar todos os DadosSaude
    const dadosSaudeList = await prisma.dadosSaude.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    console.log(`📊 Total de registros a migrar: ${dadosSaudeList.length}\n`);

    let migrados = 0;
    let jaExistentes = 0;
    let erros = 0;

    for (const dados of dadosSaudeList) {
      try {
        // Verificar se já existe HealthProfessionalData para este usuário
        const existing = await prisma.healthProfessionalData.findUnique({
          where: { userId: dados.userId },
        });

        if (existing) {
          console.log(`⚠️  Já existe: ${dados.user.name} (${dados.user.email})`);
          jaExistentes++;
          continue;
        }

        // Mapear status
        let status: 'ATIVO' | 'INATIVO' | 'FERIAS' | 'AFASTADO' | 'LICENCA' | 'APOSENTADO' = 'ATIVO';
        if (!dados.ativo) {
          status = 'INATIVO';
        }

        // Criar HealthProfessionalData
        const healthData = await prisma.healthProfessionalData.create({
          data: {
            userId: dados.userId,
            categoria: dados.categoria,
            registroProfissional: dados.registroProfissional,
            tipoRegistro: dados.tipoRegistro,
            ufRegistro: dados.ufRegistro,
            cns: dados.cns,
            cbo: dados.cbo,
            status: status,
            motivoInativacao: dados.motivoInativacao,
            dataInativacao: dados.dataInativacao,
            aceitaAgendamento: dados.aceitaAgendamento,
            tempoMedioConsulta: dados.tempoMedioConsulta,
            especialidades: dados.especialidades,
            observacoes: dados.observacoes,
            createdAt: dados.createdAt,
            updatedAt: dados.updatedAt,
            createdBy: dados.createdBy,
          },
        });

        console.log(`✅ Migrado: ${dados.user.name} - ${dados.categoria} (${status})`);
        migrados++;
      } catch (error: any) {
        console.error(`❌ Erro ao migrar ${dados.user.name}:`, error.message);
        erros++;
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMO DA MIGRAÇÃO:');
    console.log(`   ✅ Migrados com sucesso: ${migrados}`);
    console.log(`   ⚠️  Já existentes: ${jaExistentes}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📊 Total processado: ${dadosSaudeList.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (erros === 0) {
      console.log('✅ Migração concluída com sucesso!\n');
    } else {
      console.log('⚠️  Migração concluída com erros. Revise os logs acima.\n');
    }
  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateDadosSaudeToHealthData()
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
