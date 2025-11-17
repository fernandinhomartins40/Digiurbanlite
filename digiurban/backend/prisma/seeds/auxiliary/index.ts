import { PrismaClient } from '@prisma/client';
import { seedEntidadesMunicipais } from './entidades-municipais.seed';
import { seedCategoriasTipos } from './categorias-tipos.seed';
import { seedProfissionais } from './profissionais.seed';
import { seedTiposDocumento } from './tipos-documento.seed';

const prisma = new PrismaClient();

export async function seedAllAuxiliaryData() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  📊 SEED DE DADOS AUXILIARES - 100% DO PLANO                  ║');
  console.log('║  25 Tabelas Auxiliares                                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  try {
    // CATEGORIA 1: Entidades Municipais (4 tabelas)
    await seedEntidadesMunicipais();

    // CATEGORIA 2: Categorias e Tipos (13 tabelas)
    await seedCategoriasTipos();

    // CATEGORIA 3: Profissionais (3 tabelas)
    await seedProfissionais();

    // CATEGORIA 4: Documentos (1 tabela)
    await seedTiposDocumento();

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TODOS OS DADOS AUXILIARES CRIADOS COM SUCESSO!            ║');
    console.log('║  📊 Total: 25 tabelas auxiliares populadas                    ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Erro ao criar dados auxiliares:', error);
    throw error;
  }
}

// Se executado diretamente
if (require.main === module) {
  seedAllAuxiliaryData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
