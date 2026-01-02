import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true
    }
  });

  console.log('Usuários no sistema:', users);

  const superAdmins = users.filter(u => u.role === 'SUPER_ADMIN');
  console.log(`\nTotal de SUPER_ADMINs: ${superAdmins.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
