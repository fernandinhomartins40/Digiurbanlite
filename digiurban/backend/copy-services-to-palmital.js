const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function copyServices() {
  try {
    // Buscar tenant demo (origem)
    const demoTenant = await prisma.tenant.findFirst({
      where: { name: { contains: 'demo' } }
    });

    if (!demoTenant) {
      console.log('❌ Tenant demo não encontrado');
      return;
    }

    // Buscar tenant Palmital (destino)
    const palmitalTenant = await prisma.tenant.findFirst({
      where: { name: { contains: 'Palmital' } }
    });

    if (!palmitalTenant) {
      console.log('❌ Tenant Palmital não encontrado');
      return;
    }

    console.log('✅ Tenant origem:', demoTenant.name, '(ID:', demoTenant.id + ')');
    console.log('✅ Tenant destino:', palmitalTenant.name, '(ID:', palmitalTenant.id + ')');

    // Buscar serviços do demo
    const demoServices = await prisma.serviceSimplified.findMany({
      where: { tenantId: demoTenant.id },
      include: { department: true }
    });

    console.log(`\n📊 Total de serviços no demo: ${demoServices.length}`);

    // Buscar ou criar departamentos no Palmital
    console.log('\n🏢 Verificando departamentos no Palmital...');

    const departmentMap = {};

    for (const service of demoServices) {
      const deptName = service.department.name;

      if (!departmentMap[deptName]) {
        // Buscar departamento no Palmital com mesmo nome
        let palmitalDept = await prisma.department.findFirst({
          where: {
            tenantId: palmitalTenant.id,
            name: deptName
          }
        });

        if (!palmitalDept) {
          console.log(`   ⚠️  Departamento não encontrado: ${deptName}`);
          console.log(`   ⚠️  Certifique-se que os departamentos foram criados no Palmital`);
          return;
        }

        departmentMap[deptName] = palmitalDept.id;
        console.log(`   ✅ ${deptName}`);
      }
    }

    console.log('\n📋 Copiando serviços...');

    let copied = 0;
    for (const service of demoServices) {
      const deptId = departmentMap[service.department.name];

      await prisma.serviceSimplified.create({
        data: {
          name: service.name,
          description: service.description,
          departmentId: deptId,
          tenantId: palmitalTenant.id,
          serviceType: service.serviceType,
          moduleType: service.moduleType,
          formSchema: service.formSchema,
          isActive: service.isActive,
          requiresDocuments: service.requiresDocuments,
          requiredDocuments: service.requiredDocuments,
          estimatedDays: service.estimatedDays,
          priority: service.priority,
          category: service.category,
          icon: service.icon,
          color: service.color,
          slug: service.slug
        }
      });

      copied++;
      if (copied % 10 === 0) {
        console.log(`   Copiados: ${copied}/${demoServices.length}`);
      }
    }

    console.log(`\n✅ ${copied} serviços copiados com sucesso!`);

    // Verificar total final
    const finalCount = await prisma.serviceSimplified.count({
      where: { tenantId: palmitalTenant.id }
    });

    console.log(`\n📊 Total final no Palmital: ${finalCount}`);

    if (finalCount === 114) {
      console.log('✅ Total correto: 114 serviços!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

copyServices();
