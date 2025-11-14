import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkService() {
  try {
    const serviceId = 'cmhz4d173000ccbv42ncqjnxk';

    // Verificar tabela ServiceSimplified
    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId },
      include: { department: true }
    });

    console.log('\n=== DIAGNÓSTICO DO SERVIÇO ===\n');

    if (service) {
      console.log('✓ SERVIÇO ENCONTRADO');
      console.log('  - ID:', service.id);
      console.log('  - Nome:', service.name);
      console.log('  - Descrição:', service.description || '(sem descrição)');
      console.log('  - Tipo:', service.serviceType);
      console.log('  - Ativo:', service.isActive);
      console.log('  - Departamento:', service.department?.name);
      console.log('  - Icon:', service.icon || '(sem ícone)');
      console.log('  - Categoria:', service.category || '(sem categoria)');
      console.log('  - FormSchema:', service.formSchema ? 'SIM' : 'NÃO');
      console.log('  - RequiresDocuments:', service.requiresDocuments);
      console.log('  - RequiredDocuments:', service.requiredDocuments);
      console.log('\n✓ O serviço DEVERIA aparecer no portal do cidadão!');
      console.log('   Verifique se o backend está rodando e os logs de requisição.');
    } else {
      console.log('✗ SERVIÇO NÃO ENCONTRADO');
      console.log('   O serviço com esse ID não existe no banco de dados.');
      console.log('   Verifique se o ID está correto ou se o serviço foi criado.');
    }
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkService();
