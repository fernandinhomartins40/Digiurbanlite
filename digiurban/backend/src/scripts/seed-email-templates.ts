import { PrismaClient } from '@prisma/client';
import { transactionalEmailService } from '../lib/email/TransactionalEmailService';

const prisma = new PrismaClient();

async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...');

  try {
    // Verificar se EmailServer existe
    const emailServer = await prisma.emailServer.findFirst();

    if (!emailServer) {
      console.log('⚠️  Nenhum EmailServer encontrado. Criando templates sem emailServerId...');
    } else {
      console.log(`✅ EmailServer encontrado: ${emailServer.hostname}`);
    }

    // Criar templates padrão usando o serviço
    await transactionalEmailService.createDefaultTemplates('dummy-id');

    // Contar templates criados
    const count = await prisma.emailTemplate.count();
    console.log(`✅ ${count} templates criados/atualizados com sucesso!`);

    // Listar templates
    const templates = await prisma.emailTemplate.findMany({
      select: {
        id: true,
        name: true,
        subject: true,
        isActive: true,
      },
    });

    console.log('\n📧 Templates disponíveis:');
    templates.forEach((template) => {
      console.log(`  - ${template.name} (${template.isActive ? 'Ativo' : 'Inativo'})`);
      console.log(`    Assunto: ${template.subject}`);
    });

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar templates:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

seedEmailTemplates();
