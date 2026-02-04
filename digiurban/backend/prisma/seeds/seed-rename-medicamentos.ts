import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface MedicamentoRename {
  nome: string;
  principioAtivo: string;
  concentracao: string;
  formaFarmaceutica: string;
  apresentacao: string;
  catmat: string;
  componenteRename: string;
  isControlado: boolean;
}

async function seedRenameMedicamentos() {
  console.log('🏥 Iniciando seed de medicamentos da RENAME 2024...');

  try {
    // Carregar dados do JSON
    const jsonPath = path.join(__dirname, '..', '..', 'src', 'data', 'rename-2024-medicamentos.json');
    const medicamentosData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as MedicamentoRename[];

    console.log(`📦 ${medicamentosData.length} medicamentos encontrados no arquivo RENAME 2024`);

    let criados = 0;
    let atualizados = 0;
    let erros = 0;

    for (const medicamento of medicamentosData) {
      try {
        // Verificar se medicamento já existe (por nome + princípio ativo)
        const existente = await prisma.medicamento.findFirst({
          where: {
            nome: medicamento.nome,
            principioAtivo: medicamento.principioAtivo,
            isRename: true
          }
        });

        if (existente) {
          // Atualizar medicamento existente
          await prisma.medicamento.update({
            where: { id: existente.id },
            data: {
              apresentacao: medicamento.apresentacao,
              catmat: medicamento.catmat,
              concentracao: medicamento.concentracao,
              tipo: medicamento.formaFarmaceutica as any,
              isControlado: medicamento.isControlado,
              isRename: true,
              isActive: true,
              updatedAt: new Date()
            }
          });
          atualizados++;
          console.log(`✅ Atualizado: ${medicamento.nome}`);
        } else {
          // Criar novo medicamento
          await prisma.medicamento.create({
            data: {
              nome: medicamento.nome,
              principioAtivo: medicamento.principioAtivo,
              apresentacao: medicamento.apresentacao,
              catmat: medicamento.catmat,
              concentracao: medicamento.concentracao,
              tipo: medicamento.formaFarmaceutica as any,
              isControlado: medicamento.isControlado,
              isRename: true,
              isActive: true
            }
          });
          criados++;
          console.log(`✨ Criado: ${medicamento.nome}`);
        }
      } catch (error) {
        erros++;
        console.error(`❌ Erro ao processar ${medicamento.nome}:`, error);
      }
    }

    console.log('\n📊 Resumo do Seed:');
    console.log(`   ✨ Criados: ${criados}`);
    console.log(`   ✅ Atualizados: ${atualizados}`);
    console.log(`   ❌ Erros: ${erros}`);
    console.log(`   📦 Total processado: ${medicamentosData.length}`);
    console.log('\n🎉 Seed de medicamentos RENAME concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro fatal durante o seed:', error);
    throw error;
  }
}

// Executar seed
seedRenameMedicamentos()
  .catch((error) => {
    console.error('💥 Falha no seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export { seedRenameMedicamentos };
