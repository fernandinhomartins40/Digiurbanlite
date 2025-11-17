const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  const newSchema = {
    type: 'object',
    properties: {
      // Dados do Cidadão (pré-preenchidos automaticamente)
      nome: { type: 'string', title: 'Nome Completo', minLength: 3, maxLength: 200 },
      cpf: { type: 'string', title: 'CPF', pattern: '^\\d{11}$', minLength: 11, maxLength: 11 },
      email: { type: 'string', format: 'email', title: 'E-mail' },
      telefone: { type: 'string', title: 'Telefone', pattern: '^\\d{10,11}$' },
      endereco: { type: 'string', title: 'Endereço Completo', minLength: 10, maxLength: 500 },

      // Dados Específicos do Produtor Rural
      tipoProdutor: {
        type: 'string',
        title: 'Tipo de Produtor',
        enum: ['Agricultor Familiar', 'Produtor Rural', 'Assentado', 'Quilombola', 'Indígena']
      },
      dap: { type: 'string', title: 'DAP (Declaração de Aptidão ao PRONAF)' },
      areaTotalHectares: { type: 'number', title: 'Área Total (Hectares)' },
      principaisProducoes: { type: 'string', title: 'Principais Produções' }
    },
    required: ['nome', 'cpf', 'email', 'telefone', 'tipoProdutor']
  };

  await prisma.serviceSimplified.updateMany({
    where: { name: 'Cadastro de Produtor Rural' },
    data: { formSchema: newSchema }
  });

  console.log('✅ Schema atualizado!');

  // Verificar
  const service = await prisma.serviceSimplified.findFirst({
    where: { name: 'Cadastro de Produtor Rural' }
  });

  console.log('\nCampos no schema:');
  Object.keys(service.formSchema.properties).forEach(key => {
    console.log(`  - ${key}: ${service.formSchema.properties[key].title}`);
  });

  await prisma.$disconnect();
}

update().catch(console.error);
