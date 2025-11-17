/**
 * INDEX DE SEEDS DE ESTABELECIMENTOS
 * Agrupa todos os seeds de unidades e espaços públicos
 */

import { seedUnidadesSaude } from './unidades-saude.seed';
import { seedUnidadesEducacao } from './unidades-educacao.seed';
import { seedUnidadesCRAS } from './unidades-cras.seed';
import { seedEspacosPublicos } from './espacos-publicos.seed';

export async function seedAllEstabelecimentos() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🏛️  SEED DE ESTABELECIMENTOS E ESPAÇOS PÚBLICOS      ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  await seedUnidadesSaude();
  await seedUnidadesEducacao();
  await seedUnidadesCRAS();
  await seedEspacosPublicos();

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  ✅ ESTABELECIMENTOS CRIADOS COM SUCESSO              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

// Executar se chamado diretamente
if (require.main === module) {
  seedAllEstabelecimentos()
    .then(() => {
      console.log('✅ Seed de estabelecimentos concluído!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro ao executar seed:', error);
      process.exit(1);
    });
}
