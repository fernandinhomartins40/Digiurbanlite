import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.emailPlanConfig.findMany({
    include: {
      allowedDomains: {
        include: {
          domain: true
        }
      }
    }
  });

  console.log('📧 Planos de Email cadastrados:');
  console.log(JSON.stringify(plans, null, 2));
  console.log(`\n✅ Total: ${plans.length} planos`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
