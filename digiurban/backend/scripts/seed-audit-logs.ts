import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando logs de auditoria de teste...');

  // Buscar primeiro usuário SUPER_ADMIN
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!superAdmin) {
    console.error('❌ Nenhum SUPER_ADMIN encontrado. Crie um primeiro.');
    return;
  }

  console.log(`✅ Encontrado SUPER_ADMIN: ${superAdmin.name}`);

  // Criar logs de auditoria variados
  const logs = [
    {
      userId: superAdmin.id,
      action: 'login_success',
      resource: '/api/super-admin/login',
      method: 'POST',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      success: true,
      details: {}
    },
    {
      userId: superAdmin.id,
      action: 'system_config_change',
      resource: '/api/super-admin/municipio',
      method: 'PUT',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      success: true,
      details: {
        changes: [
          { field: 'maxUsers', oldValue: '10', newValue: '50' },
          { field: 'maxCitizens', oldValue: '10000', newValue: '50000' }
        ]
      }
    },
    {
      userId: superAdmin.id,
      action: 'user_created',
      resource: '/api/users',
      method: 'POST',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      success: true,
      details: {
        resourceId: 'user-123',
        userName: 'Novo Usuário',
        role: 'ADMIN'
      }
    },
    {
      userId: superAdmin.id,
      action: 'login_failed',
      resource: '/api/admin/login',
      method: 'POST',
      ip: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      success: false,
      errorMessage: 'Credenciais inválidas',
      details: {
        identifier: 'admin@example.com'
      }
    },
    {
      userId: superAdmin.id,
      action: 'sensitive_data_access',
      resource: '/api/citizens/cpf-search',
      method: 'GET',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      success: true,
      details: {
        dataType: 'CPF',
        resourceId: 'citizen-456',
        reason: 'Verificação de dados cadastrais'
      }
    },
    {
      userId: superAdmin.id,
      action: 'account_locked',
      resource: '/api/admin/login',
      method: 'POST',
      ip: '192.168.1.110',
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      success: true,
      details: {
        failedAttempts: 5,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      }
    },
    {
      userId: superAdmin.id,
      action: 'data_export',
      resource: '/api/super-admin/audit/export',
      method: 'POST',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      success: true,
      details: {
        format: 'csv',
        recordCount: 150,
        dateRange: '30d'
      }
    },
    {
      userId: superAdmin.id,
      action: 'password_reset',
      resource: '/api/admin/reset-password',
      method: 'POST',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      success: true,
      details: {
        resourceId: 'user-789'
      }
    }
  ];

  // Criar logs com timestamps variados
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    const createdAt = new Date(Date.now() - (i * 15 * 60 * 1000)); // Espaçar 15min cada

    await prisma.auditLog.create({
      data: {
        ...log,
        createdAt
      }
    });

    console.log(`✅ Log criado: ${log.action}`);
  }

  console.log(`\n🎉 ${logs.length} logs de auditoria criados com sucesso!`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar logs:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
