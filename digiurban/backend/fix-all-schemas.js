const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// IDs para remover de TODOS os formSchemas
const ID_FIELDS = ['citizenId', 'pacienteId', 'alunoId', 'produtorId', 'beneficiarioId', 'cidadaoId'];

async function fixAllSchemas() {
  console.log('🔧 Corrigindo TODOS os formSchemas no banco...\n');

  // Buscar todos os serviços
  const services = await prisma.serviceSimplified.findMany();
  console.log(`📦 Encontrados ${services.length} serviços\n`);

  let updatedCount = 0;

  for (const service of services) {
    let schema = service.formSchema;

    if (!schema || typeof schema !== 'object') continue;

    let modified = false;

    // Remover campos de ID das properties
    if (schema.properties) {
      for (const idField of ID_FIELDS) {
        if (schema.properties[idField]) {
          delete schema.properties[idField];
          modified = true;
          console.log(`  ✓ ${service.name}: removido ${idField} das properties`);
        }
      }
    }

    // Remover campos de ID do required
    if (schema.required && Array.isArray(schema.required)) {
      const originalLength = schema.required.length;
      schema.required = schema.required.filter(field => !ID_FIELDS.includes(field));
      if (schema.required.length < originalLength) {
        modified = true;
        console.log(`  ✓ ${service.name}: removido IDs do required`);
      }
    }

    // Atualizar no banco se foi modificado
    if (modified) {
      await prisma.serviceSimplified.update({
        where: { id: service.id },
        data: { formSchema: schema }
      });
      updatedCount++;
    }
  }

  console.log(`\n✅ ${updatedCount} serviços atualizados!`);

  // Verificar Cadastro de Produtor Rural
  const produtor = await prisma.serviceSimplified.findFirst({
    where: { name: 'Cadastro de Produtor Rural' }
  });

  console.log('\n📋 Verificação: Cadastro de Produtor Rural');
  const schema = produtor?.formSchema;
  if (schema?.properties?.citizenId) {
    console.log('❌ ERRO: citizenId ainda existe!');
  } else {
    console.log('✅ citizenId removido das properties');
  }

  if (schema?.required?.includes('citizenId')) {
    console.log('❌ ERRO: citizenId ainda está no required');
  } else {
    console.log('✅ citizenId removido do required');
  }

  await prisma.$disconnect();
}

fixAllSchemas().catch(console.error);
