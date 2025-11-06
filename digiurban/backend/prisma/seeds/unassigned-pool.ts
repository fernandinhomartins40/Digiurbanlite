/**
 * SEED: UNASSIGNED_POOL - Tenant Pool Global
 *
 * Cria o tenant especial que serve como "sala de espera" para cidadãos
 * de municípios que ainda não possuem tenant ativo na plataforma.
 *
 * Este seed é idempotente - pode ser executado múltiplas vezes sem duplicação.
 */

import { PrismaClient } from '@prisma/client';
import { UNASSIGNED_POOL_CONFIG } from '../../src/config/tenants';

const prisma = new PrismaClient();

export async function seedUnassignedPool() {
  console.log('🏗️  Verificando tenant UNASSIGNED_POOL...');

  // Verificar se já existe
  const existingPool = await prisma.tenant.findUnique({
    where: { id: UNASSIGNED_POOL_CONFIG.id }
  });

  if (existingPool) {
    console.log('✅ UNASSIGNED_POOL já existe, atualizando configurações...');

    // Atualizar para garantir que está com as configs corretas
    await prisma.tenant.update({
      where: { id: UNASSIGNED_POOL_CONFIG.id },
      data: {
        name: UNASSIGNED_POOL_CONFIG.name,
        status: UNASSIGNED_POOL_CONFIG.status,
        metadata: UNASSIGNED_POOL_CONFIG.metadata,
      }
    });

    console.log('✅ UNASSIGNED_POOL atualizado com sucesso');
  } else {
    console.log('🆕 Criando UNASSIGNED_POOL...');

    await prisma.tenant.create({
      data: {
        id: UNASSIGNED_POOL_CONFIG.id,
        name: UNASSIGNED_POOL_CONFIG.name,
        cnpj: UNASSIGNED_POOL_CONFIG.cnpj,
        domain: UNASSIGNED_POOL_CONFIG.domain,
        status: UNASSIGNED_POOL_CONFIG.status,
        plan: UNASSIGNED_POOL_CONFIG.plan as any, // Cast necessário pois SYSTEM não está no enum
        population: UNASSIGNED_POOL_CONFIG.population,
        metadata: UNASSIGNED_POOL_CONFIG.metadata,
      }
    });

    console.log('✅ UNASSIGNED_POOL criado com sucesso');
  }

  // Contar cidadãos no pool
  const citizensCount = await prisma.citizen.count({
    where: { tenantId: UNASSIGNED_POOL_CONFIG.id }
  });

  console.log(`📊 Cidadãos no UNASSIGNED_POOL: ${citizensCount}`);
}

// Permitir execução standalone
if (require.main === module) {
  seedUnassignedPool()
    .then(() => {
      console.log('✅ Seed concluído');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro no seed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
