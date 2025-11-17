const { PrismaClient } = require('./digiurban/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function compareServices() {
  console.log('🔍 COMPARANDO SERVIÇO PADRÃO vs SERVIÇO CRIADO\n');
  console.log('='.repeat(70));

  try {
    // Buscar um serviço padrão
    const standardService = await prisma.serviceSimplified.findFirst({
      where: { name: 'Agendamento de Consulta Médica' }
    });

    // Buscar um serviço criado
    const createdService = await prisma.serviceSimplified.findFirst({
      where: { name: 'Terapia Ocupacional' }
    });

    if (!standardService || !createdService) {
      console.log('❌ Serviços não encontrados');
      return;
    }

    console.log('\n📋 SERVIÇO PADRÃO: Agendamento de Consulta Médica');
    console.log('-'.repeat(70));
    console.log('ServiceType:', standardService.serviceType);
    console.log('ModuleType:', standardService.moduleType);
    console.log('\nformSchema.type:', standardService.formSchema?.type);
    console.log('formSchema tem properties?', !!standardService.formSchema?.properties);
    console.log('formSchema tem fields?', !!standardService.formSchema?.fields);
    console.log('formSchema tem citizenFields?', !!standardService.formSchema?.citizenFields);

    if (standardService.formSchema?.properties) {
      const propKeys = Object.keys(standardService.formSchema.properties);
      console.log(`\nTotal de properties: ${propKeys.length}`);
      console.log('Primeiros 10 properties:', propKeys.slice(0, 10).join(', '));
    }

    if (standardService.formSchema?.fields) {
      console.log(`Total de fields: ${standardService.formSchema.fields.length}`);
      console.log('Primeiros 5 fields:');
      standardService.formSchema.fields.slice(0, 5).forEach((f, i) => {
        const fieldId = f.id || f.name;
        console.log(`  ${i+1}. ${fieldId} (${f.type}) - ${f.label}`);
      });
    }

    if (standardService.formSchema?.citizenFields) {
      console.log('\ncitizenFields:', standardService.formSchema.citizenFields);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n📋 SERVIÇO CRIADO: Terapia Ocupacional');
    console.log('-'.repeat(70));
    console.log('ServiceType:', createdService.serviceType);
    console.log('ModuleType:', createdService.moduleType);
    console.log('\nformSchema.type:', createdService.formSchema?.type);
    console.log('formSchema tem properties?', !!createdService.formSchema?.properties);
    console.log('formSchema tem fields?', !!createdService.formSchema?.fields);
    console.log('formSchema tem citizenFields?', !!createdService.formSchema?.citizenFields);

    if (createdService.formSchema?.properties) {
      const propKeys = Object.keys(createdService.formSchema.properties);
      console.log(`\nTotal de properties: ${propKeys.length}`);
      console.log('Properties:', propKeys.join(', '));
    }

    if (createdService.formSchema?.fields) {
      console.log(`\nTotal de fields: ${createdService.formSchema.fields.length}`);
      console.log('Fields:');
      createdService.formSchema.fields.forEach((f, i) => {
        const fieldId = f.id || f.name;
        console.log(`  ${i+1}. ${fieldId} (${f.type}) - ${f.label}`);
      });
    }

    if (createdService.formSchema?.citizenFields) {
      console.log('\ncitizenFields:', createdService.formSchema.citizenFields);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n🔎 DIFERENÇAS PRINCIPAIS:');
    console.log('-'.repeat(70));

    const diff = [];

    if (!!standardService.formSchema?.properties !== !!createdService.formSchema?.properties) {
      diff.push('❌ PADRÃO tem properties, CRIADO não tem (ou vice-versa)');
    }

    if (!!standardService.formSchema?.fields !== !!createdService.formSchema?.fields) {
      diff.push('❌ PADRÃO tem fields, CRIADO não tem (ou vice-versa)');
    }

    if (!createdService.formSchema?.citizenFields) {
      diff.push('❌ CRIADO não tem citizenFields');
    }

    if (diff.length === 0) {
      console.log('✅ Estruturas parecem similares');
    } else {
      diff.forEach(d => console.log(d));
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareServices();
