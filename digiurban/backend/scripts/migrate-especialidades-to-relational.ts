/**
 * Script de Migração: JSON Especialidades → Tabela Relacional
 *
 * Converte o campo `especialidades Json?` do modelo ProfissionalSaude
 * para relacionamentos N:N na tabela profissional_especialidade
 *
 * Uso: npx ts-node scripts/migrate-especialidades-to-relational.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EspecialidadeJSON {
  id?: string;
  nome?: string;
  isPrincipal?: boolean;
}

async function migrateEspecialidades() {
  console.log('🚀 Iniciando migração de especialidades JSON → Relacional\n');

  try {
    // 1. Buscar todos os profissionais com especialidades em JSON
    const profissionais = await prisma.profissionalSaude.findMany({
      where: {
        especialidades: {
          not: null,
        },
      },
      select: {
        id: true,
        nome: true,
        especialidades: true,
      },
    });

    console.log(`📊 Encontrados ${profissionais.length} profissionais com especialidades em JSON\n`);

    if (profissionais.length === 0) {
      console.log('✅ Nenhum dado para migrar. Finalizando...');
      return;
    }

    // 2. Buscar todas as especialidades médicas do sistema
    const especialidadesMedicas = await prisma.especialidadeMedica.findMany({
      select: {
        id: true,
        nome: true,
      },
    });

    const especialidadesMap = new Map(
      especialidadesMedicas.map(esp => [esp.nome.toLowerCase(), esp.id])
    );

    console.log(`📚 ${especialidadesMedicas.length} especialidades cadastradas no sistema\n`);

    let migrados = 0;
    let erros = 0;
    let especialidadesNaoEncontradas = new Set<string>();

    // 3. Processar cada profissional
    for (const profissional of profissionais) {
      try {
        const especialidadesJSON = profissional.especialidades as any;

        if (!Array.isArray(especialidadesJSON)) {
          console.log(`⚠️  ${profissional.nome}: especialidades não é um array, pulando...`);
          continue;
        }

        console.log(`\n🔄 Processando: ${profissional.nome} (${especialidadesJSON.length} especialidades)`);

        for (const espJSON of especialidadesJSON) {
          const espData = espJSON as EspecialidadeJSON;

          // Tentar localizar a especialidade por ID ou nome
          let especialidadeId: string | undefined;

          if (espData.id) {
            // Verificar se o ID existe
            const existe = await prisma.especialidadeMedica.findUnique({
              where: { id: espData.id },
            });
            if (existe) {
              especialidadeId = espData.id;
            }
          }

          if (!especialidadeId && espData.nome) {
            // Buscar por nome
            especialidadeId = especialidadesMap.get(espData.nome.toLowerCase());
          }

          if (!especialidadeId) {
            const nomeEsp = espData.nome || espData.id || 'Desconhecida';
            especialidadesNaoEncontradas.add(nomeEsp);
            console.log(`   ❌ Especialidade não encontrada: ${nomeEsp}`);
            continue;
          }

          // Verificar se vínculo já existe
          const vinculoExistente = await prisma.profissionalEspecialidade.findUnique({
            where: {
              profissionalId_especialidadeId: {
                profissionalId: profissional.id,
                especialidadeId: especialidadeId,
              },
            },
          });

          if (vinculoExistente) {
            console.log(`   ⏭️  Vínculo já existe, pulando...`);
            continue;
          }

          // Criar vínculo
          await prisma.profissionalEspecialidade.create({
            data: {
              profissionalId: profissional.id,
              especialidadeId: especialidadeId,
              isPrincipal: espData.isPrincipal || false,
              ativo: true,
              observacoes: 'Migrado automaticamente do campo JSON',
            },
          });

          console.log(`   ✅ Vínculo criado: ${espData.nome || especialidadeId}`);
          migrados++;
        }

      } catch (error: any) {
        console.error(`   ❌ Erro ao processar ${profissional.nome}:`, error.message);
        erros++;
      }
    }

    // 4. Resumo
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(60));
    console.log(`✅ Vínculos criados: ${migrados}`);
    console.log(`❌ Erros: ${erros}`);

    if (especialidadesNaoEncontradas.size > 0) {
      console.log(`\n⚠️  Especialidades não encontradas (${especialidadesNaoEncontradas.size}):`);
      especialidadesNaoEncontradas.forEach(nome => {
        console.log(`   - ${nome}`);
      });
    }

    console.log('\n✅ Migração concluída!\n');
    console.log('⚠️  PRÓXIMOS PASSOS:');
    console.log('   1. Verifique os vínculos criados no banco de dados');
    console.log('   2. Após validação, remova o campo "especialidades Json?" do schema.prisma');
    console.log('   3. Execute: npx prisma migrate dev --name remove-especialidades-json\n');

  } catch (error: any) {
    console.error('\n❌ ERRO FATAL:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar migração
migrateEspecialidades()
  .catch((error) => {
    console.error('Erro ao executar migração:', error);
    process.exit(1);
  });
