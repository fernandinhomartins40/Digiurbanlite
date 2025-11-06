const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const targetCpf = '05282248913';
const formattedCpf = '052.822.489-13';

async function findCpfEverywhere() {
  console.log(`\n🔍 Buscando CPF: ${formattedCpf} (${targetCpf})\n`);

  try {
    // 1. Citizens
    console.log('1️⃣ Tabela: citizens');
    const citizens = await prisma.citizen.findMany({
      where: {
        OR: [
          { cpf: targetCpf },
          { cpf: formattedCpf },
          { cpf: { contains: '05282248913' } }
        ]
      }
    });
    console.log(`   Encontrados: ${citizens.length}`);
    if (citizens.length > 0) {
      citizens.forEach(c => {
        console.log(`   → ID: ${c.id}, Nome: ${c.name}, TenantID: ${c.tenantId}, Active: ${c.isActive}`);
      });
    }

    // 2. RuralProducers
    console.log('\n2️⃣ Tabela: rural_producers');
    const producers = await prisma.ruralProducer.findMany({
      where: {
        OR: [
          { cpf: targetCpf },
          { cpf: formattedCpf },
          { cpf: { contains: '05282248913' } }
        ]
      }
    });
    console.log(`   Encontrados: ${producers.length}`);
    if (producers.length > 0) {
      producers.forEach(p => {
        console.log(`   → ID: ${p.id}, Nome: ${p.name}, TenantID: ${p.tenantId}`);
      });
    }

    // 3. Verificar índices únicos
    console.log('\n3️⃣ Verificando constraints UNIQUE:');
    const result = await prisma.$queryRaw`
      SELECT sql FROM sqlite_master
      WHERE type='index' AND tbl_name='citizens' AND sql IS NOT NULL
    `;
    console.log('   Índices em citizens:');
    result.forEach(r => console.log(`   → ${r.sql}`));

    // 4. Verificar se há registros "soft deleted" ou inativos
    console.log('\n4️⃣ Cidadãos inativos ou com problemas:');
    const inactiveCitizens = await prisma.citizen.findMany({
      where: {
        OR: [
          { isActive: false },
          { verificationStatus: 'REJECTED' }
        ]
      },
      select: {
        id: true,
        name: true,
        cpf: true,
        isActive: true,
        verificationStatus: true,
        tenantId: true
      }
    });
    console.log(`   Encontrados: ${inactiveCitizens.length}`);
    if (inactiveCitizens.length > 0) {
      inactiveCitizens.forEach(c => {
        console.log(`   → CPF: ${c.cpf}, Nome: ${c.name}, Status: ${c.verificationStatus}, Active: ${c.isActive}`);
      });
    }

    console.log('\n✅ Busca completa finalizada!\n');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findCpfEverywhere();
