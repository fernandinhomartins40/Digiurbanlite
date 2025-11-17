const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkService() {
  const service = await prisma.serviceSimplified.findUnique({
    where: { id: 'cmhf0blcu001ucb7k8wonb6tt' },
    select: {
      id: true,
      name: true,
      moduleType: true,
      formSchema: true,
      department: {
        select: {
          name: true
        }
      }
    }
  });

  console.log(JSON.stringify(service, null, 2));
  await prisma.$disconnect();
}

checkService().catch(console.error);
