const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkServices() {
  try {
    console.log('\n🔍 Buscando todos os serviços...\n');

    const services = await prisma.serviceSimplified.findMany({
      where: {
        OR: [
          { name: { contains: 'Produtor' } },
          { name: { contains: 'produtor' } },
          { name: { contains: 'Rural' } },
          { name: { contains: 'rural' } },
          { name: { contains: 'Agricultur' } },
          { name: { contains: 'agricultur' } },
        ]
      },
      include: {
        department: true,
        tenant: {
          select: {
            id: true,
            name: true,
            cnpj: true,
          }
        }
      }
    });

    if (services.length === 0) {
      console.log('❌ Nenhum serviço relacionado a Produtor Rural encontrado!\n');
    } else {
      console.log(`✅ Encontrados ${services.length} serviços:\n`);

      services.forEach((service, index) => {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📋 Serviço ${index + 1}:`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🆔 ID: ${service.id}`);
        console.log(`📝 Nome: ${service.name}`);
        console.log(`📄 Descrição: ${service.description || 'N/A'}`);
        console.log(`🏢 Departamento: ${service.department.name}`);
        console.log(`🏛️  Tenant: ${service.tenant.name} (${service.tenant.cnpj})`);
        console.log(`📦 Tipo de Serviço: ${service.serviceType}`);
        console.log(`🔧 Tipo de Módulo: ${service.moduleType || 'N/A'}`);
        console.log(`✅ Ativo: ${service.isActive ? 'Sim' : 'Não'}`);
        console.log(`📂 Categoria: ${service.category || 'N/A'}`);
        console.log(`⭐ Prioridade: ${service.priority}`);
        console.log(`📅 Criado em: ${service.createdAt.toLocaleString('pt-BR')}`);
      });
    }

    console.log('\n\n🔍 Buscando TODOS os serviços do sistema...\n');

    const allServices = await prisma.serviceSimplified.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        moduleType: true,
        tenantId: true,
        department: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`\n📊 Total de serviços no sistema: ${allServices.length}\n`);

    const byTenant = {};
    allServices.forEach(s => {
      if (!byTenant[s.tenantId]) {
        byTenant[s.tenantId] = [];
      }
      byTenant[s.tenantId].push(s);
    });

    Object.entries(byTenant).forEach(([tenantId, services]) => {
      console.log(`\n🏛️  Tenant ID: ${tenantId}`);
      console.log(`📦 Serviços: ${services.length}`);
      services.forEach(s => {
        const icon = s.isActive ? '✅' : '❌';
        console.log(`   ${icon} ${s.name} (${s.department.name}) ${s.moduleType ? `[${s.moduleType}]` : ''}`);
      });
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkServices();
