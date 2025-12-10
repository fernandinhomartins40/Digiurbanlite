const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.citizen.count();
  console.log('Total de cidadãos:', count);
  await prisma.$disconnect();
}

main();
