const { PrismaClient } = require('./digiurban/backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function fixCitizenFields() {
  console.log('🔧 ADICIONANDO citizenFields aos serviços COM_DADOS existentes\n');

  try {
    // Buscar todos os serviços COM_DADOS
    const services = await prisma.serviceSimplified.findMany({
      where: {
        serviceType: 'COM_DADOS',
        formSchema: { not: null }
      }
    });

    console.log(`📊 Encontrados ${services.length} serviços COM_DADOS\n`);

    let updated = 0;
    let skipped = 0;

    for (const service of services) {
      // Verificar se já tem citizenFields
      if (service.formSchema.citizenFields && service.formSchema.citizenFields.length > 0) {
        console.log(`⏭️  ${service.name} - já possui citizenFields`);
        skipped++;
        continue;
      }

      // Adicionar citizenFields
      const updatedFormSchema = {
        ...service.formSchema,
        citizenFields: [
          'citizen_name',
          'citizen_cpf',
          'citizen_rg',
          'citizen_birthDate',
          'citizen_phone',
          'citizen_email',
          'citizen_address',
          'citizen_addressNumber',
          'citizen_addressComplement',
          'citizen_neighborhood',
          'citizen_city',
          'citizen_state',
          'citizen_zipCode',
        ]
      };

      await prisma.serviceSimplified.update({
        where: { id: service.id },
        data: { formSchema: updatedFormSchema }
      });

      console.log(`✅ ${service.name} - citizenFields adicionado`);
      updated++;
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ CORREÇÃO CONCLUÍDA!');
    console.log('='.repeat(60));
    console.log(`✅ Serviços atualizados: ${updated}`);
    console.log(`⏭️  Serviços já corretos: ${skipped}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCitizenFields();
