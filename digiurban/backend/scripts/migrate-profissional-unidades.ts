/**
 * Script de migração de dados
 * Popula tabela ProfissionalUnidade com dados existentes do campo JSON unidadesAtendimento
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateProfissionalUnidades() {
  console.log('🚀 Iniciando migração de vínculos profissional-unidade...\n');

  try {
    // 1. Buscar todos os profissionais ativos
    const profissionais = await prisma.profissionalSaude.findMany({
      where: { isActive: true },
      select: {
        id: true,
        nome: true,
        unidadesAtendimento: true,
      },
    });

    console.log(`📊 Encontrados ${profissionais.length} profissionais ativos\n`);

    let totalVinculos = 0;
    let erros = 0;

    // 2. Para cada profissional, processar suas unidades
    for (const profissional of profissionais) {
      try {
        const unidadesArray = profissional.unidadesAtendimento as any;

        // Verificar se tem unidades no campo JSON
        if (Array.isArray(unidadesArray) && unidadesArray.length > 0) {
          console.log(`👨‍⚕️ ${profissional.nome}: ${unidadesArray.length} unidade(s)`);

          for (const unidadeId of unidadesArray) {
            // Verificar se a unidade existe
            const unidadeExiste = await prisma.unidadeSaude.findUnique({
              where: { id: unidadeId },
              select: { id: true, nome: true },
            });

            if (!unidadeExiste) {
              console.log(`   ⚠️  Unidade ${unidadeId} não encontrada - pulando`);
              continue;
            }

            // Verificar se o vínculo já existe
            const vinculoExistente = await prisma.profissionalUnidade.findFirst({
              where: {
                profissionalId: profissional.id,
                unidadeId: unidadeId,
              },
            });

            if (vinculoExistente) {
              console.log(`   ⏭️  Vínculo com ${unidadeExiste.nome} já existe`);
              continue;
            }

            // Criar vínculo
            await prisma.profissionalUnidade.create({
              data: {
                profissionalId: profissional.id,
                unidadeId: unidadeId,
                ativo: true,
                observacoes: 'Migrado automaticamente do campo unidadesAtendimento',
              },
            });

            console.log(`   ✅ Vinculado a ${unidadeExiste.nome}`);
            totalVinculos++;

            // Criar auditoria
            await prisma.auditoriaVinculo.create({
              data: {
                tipo: 'CRIACAO',
                profissionalId: profissional.id,
                profissionalNome: profissional.nome,
                unidadeDestinoId: unidadeId,
                unidadeDestinoNome: unidadeExiste.nome,
                motivo: 'Migração automática de dados',
                detalhes: {
                  origem: 'unidadesAtendimento JSON field',
                  dataProcessamento: new Date().toISOString(),
                },
              },
            });
          }
        } else {
          console.log(`👨‍⚕️ ${profissional.nome}: sem unidades cadastradas`);
        }
      } catch (error: any) {
        console.error(`   ❌ Erro ao processar ${profissional.nome}:`, error.message);
        erros++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Total de vínculos criados: ${totalVinculos}`);
    console.log(`❌ Erros encontrados: ${erros}`);
    console.log(`👥 Profissionais processados: ${profissionais.length}`);
    console.log('='.repeat(60) + '\n');

    console.log('✨ Migração concluída com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro fatal durante a migração:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateProfissionalUnidades()
  .then(() => {
    console.log('🎉 Script finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha ao executar script:', error);
    process.exit(1);
  });
