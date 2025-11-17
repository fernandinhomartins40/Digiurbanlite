const { PrismaClient } = require('./digiurban/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function checkFormSchema() {
  console.log('🔍 VERIFICANDO FORMSCHEMA DE UM SERVIÇO CRIADO\n');

  try {
    // Pegar um serviço COM_DADOS recém criado (Terapia Ocupacional)
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        name: 'Terapia Ocupacional'
      }
    });

    if (!service) {
      console.log('❌ Serviço não encontrado');
      return;
    }

    console.log(`📋 Serviço: ${service.name}`);
    console.log(`🔧 ModuleType: ${service.moduleType}`);
    console.log(`📝 ServiceType: ${service.serviceType}`);
    console.log('\n📄 formSchema:');
    console.log(JSON.stringify(service.formSchema, null, 2));

    // Verificar se tem fields
    if (service.formSchema && service.formSchema.fields) {
      console.log(`\n✅ Total de fields: ${service.formSchema.fields.length}`);
      console.log('\n📋 Lista de campos:\n');
      service.formSchema.fields.forEach((field, i) => {
        console.log(`${i + 1}. ${field.name || field.id}`);
        console.log(`   ID: ${field.id}`);
        console.log(`   Label: ${field.label}`);
        console.log(`   Type: ${field.type}`);
        console.log(`   Required: ${field.required}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFormSchema();
