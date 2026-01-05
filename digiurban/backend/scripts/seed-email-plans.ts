import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding email plans...');

  const plans = [
    {
      name: 'Básico',
      code: 'BASIC',
      monthlyPrice: 49.00,
      maxEmailsPerMonth: 5000,
      maxAccounts: 5,
      features: ['5.000 emails/mês', 'Domínio personalizado', 'DKIM/SPF automático', 'Suporte básico'],
      isActive: true
    },
    {
      name: 'Padrão',
      code: 'STANDARD',
      monthlyPrice: 99.00,
      maxEmailsPerMonth: 15000,
      maxAccounts: 15,
      features: ['15.000 emails/mês', 'Múltiplos domínios', 'Templates personalizados', 'Estatísticas avançadas'],
      isActive: true
    },
    {
      name: 'Premium',
      code: 'PREMIUM',
      monthlyPrice: 199.00,
      maxEmailsPerMonth: 50000,
      maxAccounts: 50,
      features: ['50.000 emails/mês', 'API completa', 'Automações avançadas', 'Suporte prioritário'],
      isActive: true
    },
    {
      name: 'Enterprise',
      code: 'ENTERPRISE',
      monthlyPrice: 399.00,
      maxEmailsPerMonth: 999999,
      maxAccounts: 999,
      features: ['Emails ilimitados', 'Servidor dedicado', 'SLA garantido', 'Suporte 24/7'],
      isActive: true
    }
  ];

  for (const plan of plans) {
    const result = await prisma.emailPlanConfig.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan
    });
    console.log(`✅ ${plan.name} (${plan.code}) - R$ ${plan.monthlyPrice}/mês`);
  }

  console.log('\n✅ Email plans seeded successfully!');
}

main()
  .catch((error) => {
    console.error('❌ Error seeding email plans:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
