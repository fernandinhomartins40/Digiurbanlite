const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateSchemas() {
  console.log('🔄 Atualizando formSchemas...\n');

  // Schema correto para Cadastro de Produtor Rural
  const cadastroProdutor = {
    type: 'object',
    properties: {
      tipoProdutor: {
        type: 'string',
        title: 'Tipo de Produtor',
        enum: ['Agricultor Familiar', 'Produtor Rural', 'Assentado', 'Quilombola', 'Indígena']
      },
      dap: { type: 'string', title: 'DAP (Declaração de Aptidão ao PRONAF)' },
      areaTotalHectares: { type: 'number', title: 'Área Total (Hectares)' },
      principaisProducoes: { type: 'string', title: 'Principais Produções' }
    },
    required: ['tipoProdutor']
  };

  await prisma.serviceSimplified.updateMany({
    where: { name: 'Cadastro de Produtor Rural' },
    data: { formSchema: cadastroProdutor }
  });

  console.log('✅ Cadastro de Produtor Rural atualizado');

  // Verificar
  const service = await prisma.serviceSimplified.findFirst({
    where: { name: 'Cadastro de Produtor Rural' }
  });

  const schema = service?.formSchema;
  if (schema?.properties?.citizenId) {
    console.log('❌ ERRO: Campo citizenId ainda existe!');
  } else {
    console.log('✅ Campo citizenId removido!');
  }

  await prisma.$disconnect();
}

updateSchemas().catch(console.error);
