import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRelatorios() {
  console.log('🌱 Criando relatórios de exemplo...');

  try {
    // Busca um usuário ADMIN para ser o criador
    const adminUser = await prisma.user.findFirst({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN', 'MANAGER']
        }
      }
    });

    if (!adminUser) {
      console.error('❌ Nenhum usuário ADMIN encontrado. Crie um usuário admin primeiro.');
      process.exit(1);
    }

    console.log(`✅ Usando usuário: ${adminUser.name} (${adminUser.email})`);

    // Relatório 1: Operacional
    const report1 = await prisma.report.upsert({
      where: { id: 'report_exemplo_001' },
      update: {},
      create: {
        id: 'report_exemplo_001',
        name: 'Relatório Operacional de Protocolos',
        description: 'Relatório completo com análise de protocolos por status, departamento e serviço',
        type: 'OPERATIONAL',
        category: 'analytics',
        config: {
          defaultFilters: {
            status: ['PROGRESSO', 'PENDENCIA']
          },
          fields: ['citizen', 'service', 'department'],
          limit: 1000
        },
        accessLevel: 0,
        departments: [],
        isActive: true,
        isPublic: true,
        createdBy: adminUser.id
      }
    });
    console.log(`✅ Criado: ${report1.name}`);

    // Relatório 2: Gerencial
    const report2 = await prisma.report.upsert({
      where: { id: 'report_exemplo_002' },
      update: {},
      create: {
        id: 'report_exemplo_002',
        name: 'Relatório Gerencial - Desempenho',
        description: 'Análise de desempenho dos departamentos e tempo médio de conclusão',
        type: 'MANAGERIAL',
        category: 'performance',
        config: {
          defaultFilters: {},
          fields: ['citizen', 'service', 'department', 'stages'],
          limit: 500
        },
        accessLevel: 1,
        departments: [],
        isActive: true,
        isPublic: false,
        createdBy: adminUser.id
      }
    });
    console.log(`✅ Criado: ${report2.name}`);

    // Relatório 3: Executivo
    const report3 = await prisma.report.upsert({
      where: { id: 'report_exemplo_003' },
      update: {},
      create: {
        id: 'report_exemplo_003',
        name: 'Dashboard Executivo',
        description: 'Visão executiva com KPIs principais e indicadores estratégicos',
        type: 'EXECUTIVE',
        category: 'analytics',
        config: {
          defaultFilters: {
            status: ['CONCLUIDO']
          },
          fields: ['service', 'department'],
          limit: 2000
        },
        accessLevel: 2,
        departments: [],
        isActive: true,
        isPublic: false,
        createdBy: adminUser.id
      }
    });
    console.log(`✅ Criado: ${report3.name}`);

    // Relatório 4: Protocolos Vencidos
    const report4 = await prisma.report.upsert({
      where: { id: 'report_exemplo_004' },
      update: {},
      create: {
        id: 'report_exemplo_004',
        name: 'Protocolos Vencidos',
        description: 'Lista de protocolos que ultrapassaram o prazo de vencimento',
        type: 'OPERATIONAL',
        category: 'compliance',
        config: {
          defaultFilters: {},
          fields: ['citizen', 'service', 'department'],
          limit: 500
        },
        accessLevel: 0,
        departments: [],
        isActive: true,
        isPublic: true,
        createdBy: adminUser.id
      }
    });
    console.log(`✅ Criado: ${report4.name}`);

    // Relatório 5: Satisfação do Cidadão
    const report5 = await prisma.report.upsert({
      where: { id: 'report_exemplo_005' },
      update: {},
      create: {
        id: 'report_exemplo_005',
        name: 'Satisfação do Cidadão',
        description: 'Análise das avaliações e satisfação dos cidadãos com os serviços prestados',
        type: 'CUSTOM',
        category: 'satisfaction',
        config: {
          defaultFilters: {
            status: ['CONCLUIDO']
          },
          fields: ['citizen', 'service', 'department'],
          limit: 1000
        },
        accessLevel: 0,
        departments: [],
        isActive: true,
        isPublic: true,
        createdBy: adminUser.id
      }
    });
    console.log(`✅ Criado: ${report5.name}`);

    console.log('\n✅ 5 relatórios de exemplo criados com sucesso!');
    console.log('\n📊 Acesse /admin/relatorios para visualizar e executar os relatórios.');

  } catch (error) {
    console.error('❌ Erro ao criar relatórios:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedRelatorios()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
