const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 14 Departamentos Globais Padronizados
const GLOBAL_DEPARTMENTS = [
  { code: 'SAUDE', name: 'Secretaria de Saúde' },
  { code: 'EDUCACAO', name: 'Secretaria de Educação' },
  { code: 'ASSISTENCIA_SOCIAL', name: 'Secretaria de Assistência Social' },
  { code: 'AGRICULTURA', name: 'Secretaria de Agricultura' },
  { code: 'CULTURA', name: 'Secretaria de Cultura' },
  { code: 'ESPORTES', name: 'Secretaria de Esportes' },
  { code: 'HABITACAO', name: 'Secretaria de Habitação' },
  { code: 'MEIO_AMBIENTE', name: 'Secretaria de Meio Ambiente' },
  { code: 'OBRAS_PUBLICAS', name: 'Secretaria de Obras Públicas' },
  { code: 'PLANEJAMENTO_URBANO', name: 'Secretaria de Planejamento Urbano' },
  { code: 'SEGURANCA_PUBLICA', name: 'Secretaria de Segurança Pública' },
  { code: 'SERVICOS_PUBLICOS', name: 'Secretaria de Serviços Públicos' },
  { code: 'TURISMO', name: 'Secretaria de Turismo' },
  { code: 'FAZENDA', name: 'Secretaria de Fazenda' }
];

// Mapeamento de nomes antigos → código do departamento global
const NAME_MAPPING = {
  'Secretaria de Saúde': 'SAUDE',
  'Secretaria de Educação': 'EDUCACAO',
  'Secretaria de Assistência Social': 'ASSISTENCIA_SOCIAL',
  'Secretaria de Agricultura': 'AGRICULTURA',
  'Secretaria de Cultura': 'CULTURA',
  'Secretaria de Esportes': 'ESPORTES',
  'Secretaria de Esporte e Lazer': 'ESPORTES', // ✅ Normalizar
  'Secretaria de Habitação': 'HABITACAO',
  'Secretaria de Meio Ambiente': 'MEIO_AMBIENTE',
  'Secretaria de Obras Públicas': 'OBRAS_PUBLICAS',
  'Secretaria de Obras e Infraestrutura': 'OBRAS_PUBLICAS', // ✅ Normalizar
  'Secretaria de Planejamento Urbano': 'PLANEJAMENTO_URBANO',
  'Secretaria de Planejamento': 'PLANEJAMENTO_URBANO', // ✅ Normalizar
  'Secretaria de Segurança Pública': 'SEGURANCA_PUBLICA',
  'Secretaria de Serviços Públicos': 'SERVICOS_PUBLICOS',
  'Secretaria de Turismo': 'TURISMO',
  'Secretaria de Fazenda': 'FAZENDA',
  'Administração Geral': 'FAZENDA' // ✅ Mapear para Fazenda
};

async function migrateToGlobalDepartments() {
  console.log('🔄 INICIANDO MIGRAÇÃO PARA DEPARTAMENTOS GLOBAIS\n');
  console.log('⚠️  ESTA OPERAÇÃO MODIFICARÁ O BANCO DE DADOS\n');

  try {
    // PASSO 1: Validações
    console.log('📋 PASSO 1: Validações de segurança...');

    const allDepartments = await prisma.department.findMany({
      select: { id: true, name: true, tenantId: true }
    });

    console.log(`   ✅ ${allDepartments.length} departamentos encontrados`);

    const allServices = await prisma.serviceSimplified.findMany({
      select: { id: true, departmentId: true }
    });

    console.log(`   ✅ ${allServices.length} serviços encontrados`);

    const allProtocols = await prisma.protocolSimplified.findMany({
      select: { id: true, departmentId: true }
    });

    console.log(`   ✅ ${allProtocols.length} protocolos encontrados\n`);

    // PASSO 2: Criar Tabela Temporária para Departamentos Globais
    console.log('📋 PASSO 2: Criando departamentos globais temporários...');

    // Criar departamentos globais com IDs fixos
    const globalDeptMap = {};

    for (const dept of GLOBAL_DEPARTMENTS) {
      // Verificar se já existe (pode estar rodando novamente)
      const existing = await prisma.$queryRaw`
        SELECT * FROM departments WHERE code = ${dept.code} AND tenantId IS NULL LIMIT 1
      `;

      if (existing && existing.length > 0) {
        globalDeptMap[dept.code] = existing[0].id;
        console.log(`   ⏭️  Já existe: ${dept.name} (${dept.code})`);
      } else {
        // Criar novo departamento global (sem tenantId)
        // NOTA: Isso funcionará porque o schema ainda permite tenantId nullable
        const newDept = await prisma.$executeRaw`
          INSERT INTO departments (id, name, code, description, isActive, createdAt, updatedAt)
          VALUES (
            ${`global_${dept.code.toLowerCase()}`},
            ${dept.name},
            ${dept.code},
            ${'Departamento global - ' + dept.name},
            1,
            datetime('now'),
            datetime('now')
          )
        `;

        globalDeptMap[dept.code] = `global_${dept.code.toLowerCase()}`;
        console.log(`   ✅ Criado: ${dept.name} (${dept.code})`);
      }
    }

    console.log(`\n   ✅ ${Object.keys(globalDeptMap).length} departamentos globais prontos\n`);

    // PASSO 3: Migrar Serviços
    console.log('📋 PASSO 3: Migrando serviços para departamentos globais...');

    let migratedServices = 0;
    let unmappedDepts = new Set();

    for (const service of allServices) {
      // Buscar departamento atual do serviço
      const currentDept = allDepartments.find(d => d.id === service.departmentId);

      if (!currentDept) {
        console.log(`   ⚠️  Serviço ${service.id} sem departamento válido`);
        continue;
      }

      // Mapear para departamento global
      const globalCode = NAME_MAPPING[currentDept.name];

      if (!globalCode) {
        unmappedDepts.add(currentDept.name);
        continue;
      }

      const newDeptId = globalDeptMap[globalCode];

      // Atualizar serviço
      await prisma.serviceSimplified.update({
        where: { id: service.id },
        data: { departmentId: newDeptId }
      });

      migratedServices++;

      if (migratedServices % 50 === 0) {
        console.log(`   Migrados: ${migratedServices}/${allServices.length}`);
      }
    }

    console.log(`   ✅ ${migratedServices} serviços migrados\n`);

    if (unmappedDepts.size > 0) {
      console.log('   ⚠️  Departamentos não mapeados:');
      unmappedDepts.forEach(name => console.log(`     - ${name}`));
      console.log('');
    }

    // PASSO 4: Migrar Protocolos
    console.log('📋 PASSO 4: Migrando protocolos para departamentos globais...');

    let migratedProtocols = 0;

    for (const protocol of allProtocols) {
      const currentDept = allDepartments.find(d => d.id === protocol.departmentId);

      if (!currentDept) continue;

      const globalCode = NAME_MAPPING[currentDept.name];
      if (!globalCode) continue;

      const newDeptId = globalDeptMap[globalCode];

      await prisma.protocolSimplified.update({
        where: { id: protocol.id },
        data: { departmentId: newDeptId }
      });

      migratedProtocols++;

      if (migratedProtocols % 50 === 0) {
        console.log(`   Migrados: ${migratedProtocols}/${allProtocols.length}`);
      }
    }

    console.log(`   ✅ ${migratedProtocols} protocolos migrados\n`);

    // PASSO 5: Deletar Departamentos Antigos (com tenantId)
    console.log('📋 PASSO 5: Removendo departamentos antigos...');

    const oldDeptIds = allDepartments.map(d => d.id);
    const deleted = await prisma.department.deleteMany({
      where: {
        id: { in: oldDeptIds }
      }
    });

    console.log(`   ✅ ${deleted.count} departamentos antigos removidos\n`);

    // PASSO 6: Verificação Final
    console.log('📋 PASSO 6: Verificação final...');

    const finalDepts = await prisma.$queryRaw`SELECT COUNT(*) as count FROM departments`;
    const finalServices = await prisma.serviceSimplified.count();
    const finalProtocols = await prisma.protocolSimplified.count();

    console.log(`   ✅ Departamentos globais: ${finalDepts[0].count}`);
    console.log(`   ✅ Serviços: ${finalServices}`);
    console.log(`   ✅ Protocolos: ${finalProtocols}\n`);

    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!\n');
    console.log('📝 PRÓXIMOS PASSOS:');
    console.log('   1. Atualizar schema.prisma (remover tenantId de Department)');
    console.log('   2. Executar: npx prisma migrate dev --name global-departments');
    console.log('   3. Atualizar seed.ts para criar apenas departamentos globais');
    console.log('   4. Testar aplicação\n');

  } catch (error) {
    console.error('❌ ERRO NA MIGRAÇÃO:', error);
    console.error('\n⚠️  Restaure o backup se necessário!');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
migrateToGlobalDepartments();
