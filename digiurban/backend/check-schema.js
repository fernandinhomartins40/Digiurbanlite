const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const service = await prisma.serviceSimplified.findFirst({
    where: { name: 'Cadastro de Produtor Rural' }
  });

  console.log('\n📋 Serviço:', service?.name);
  console.log('\n📝 FormSchema:');
  console.log(JSON.stringify(service?.formSchema, null, 2));

  const schema = service?.formSchema;
  if (schema?.properties?.citizenId) {
    console.log('\n❌ ERRO: Campo citizenId ainda existe!');
  } else {
    console.log('\n✅ Campo citizenId removido com sucesso!');
  }

  if (schema?.required?.includes('citizenId')) {
    console.log('❌ ERRO: citizenId ainda está no required!');
  } else {
    console.log('✅ citizenId removido do required!');
  }

  await prisma.$disconnect();
}

check().catch(console.error);
