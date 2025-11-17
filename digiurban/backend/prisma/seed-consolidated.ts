/**
 * ============================================================================
 * SEED CONSOLIDADO - DigiUrban Single Tenant
 * ============================================================================
 *
 * Este arquivo consolida todos os seeds da aplicação em ordem de execução:
 *
 * 1. Configuração do Município (Singleton)
 * 2. Usuários do Sistema (Super Admin, Admin, Gerente, User)
 * 3. Departamentos (14 Secretarias)
 * 4. Cidadão de Teste
 * 5. Serviços Simplificados (114 serviços com formSchemas)
 *
 * Execução: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🌱 SEED CONSOLIDADO - DigiUrban Single Tenant        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // ========================================================================
    // 1. CONFIGURAÇÃO DO MUNICÍPIO (SINGLETON)
    // ========================================================================
    console.log('1️⃣  Configuração do Município');
    console.log('   ─────────────────────────────');

    const municipioConfig = await prisma.municipioConfig.upsert({
      where: { id: 'singleton' },
      update: {
        subscriptionEnds: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        subscriptionPlan: 'professional',
        maxUsers: 50,
        maxCitizens: 50000,
        features: {
          analytics: true,
          customModules: true,
          advancedReports: true,
          api: true
        }
      },
      create: {
        id: 'singleton',
        nome: 'Município Demonstração',
        cnpj: '00000000000191',
        codigoIbge: '0000000',
        nomeMunicipio: 'Demonstração',
        ufMunicipio: 'SP',
        brasao: null,
        corPrimaria: '#0066cc',
        isActive: true,
        isSuspended: false,
        paymentStatus: 'active',
        subscriptionPlan: 'professional',
        subscriptionEnds: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxUsers: 50,
        maxCitizens: 50000,
        configuracoes: {
          sistemaNome: 'DigiUrban',
          versao: '2.0.0',
          modoDeploy: 'single-tenant'
        },
        features: {
          analytics: true,
          customModules: true,
          advancedReports: true,
          api: true
        }
      }
    });
    console.log(`   ✅ Município: ${municipioConfig.nome}`);
    console.log(`   📍 CNPJ: ${municipioConfig.cnpj}`);
    console.log(`   📊 Plano: ${municipioConfig.subscriptionPlan}\n`);

    // ========================================================================
    // 2. USUÁRIOS DO SISTEMA
    // ========================================================================
    console.log('2️⃣  Usuários do Sistema');
    console.log('   ─────────────────────────────');

    // 2.1 Super Admin
    const superAdminEmail = 'superadmin@digiurban.com.br';
    const superAdminPassword = 'SuperAdmin@2025';
    const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 12);

    await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: {
        password: hashedSuperAdminPassword,
        isActive: true,
        role: 'SUPER_ADMIN',
        mustChangePassword: false
      },
      create: {
        email: superAdminEmail,
        name: 'Super Administrador DigiUrban',
        password: hashedSuperAdminPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
        mustChangePassword: false
      }
    });
    console.log(`   ✅ Super Admin: ${superAdminEmail}`);

    // 2.2 Admin
    const adminEmail = 'admin@demo.gov.br';
    const adminPassword = 'Admin@123';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedAdminPassword,
        isActive: true,
        role: 'ADMIN',
        mustChangePassword: false
      },
      create: {
        email: adminEmail,
        name: 'Administrador Municipal',
        password: hashedAdminPassword,
        role: 'ADMIN',
        isActive: true,
        mustChangePassword: false
      }
    });
    console.log(`   ✅ Admin: ${adminEmail}`);

    // 2.3 Gerente
    const managerEmail = 'gerente@demo.gov.br';
    const managerPassword = 'Gerente@123';
    const hashedManagerPassword = await bcrypt.hash(managerPassword, 12);

    await prisma.user.upsert({
      where: { email: managerEmail },
      update: {
        password: hashedManagerPassword,
        isActive: true,
        role: 'MANAGER',
        mustChangePassword: false
      },
      create: {
        email: managerEmail,
        name: 'Gerente Municipal',
        password: hashedManagerPassword,
        role: 'MANAGER',
        isActive: true,
        mustChangePassword: false
      }
    });
    console.log(`   ✅ Gerente: ${managerEmail}`);

    // 2.4 Usuário
    const userEmail = 'user@demo.gov.br';
    const userPassword = 'User@123';
    const hashedUserPassword = await bcrypt.hash(userPassword, 12);

    await prisma.user.upsert({
      where: { email: userEmail },
      update: {
        password: hashedUserPassword,
        isActive: true,
        role: 'USER',
        mustChangePassword: false
      },
      create: {
        email: userEmail,
        name: 'Usuário Teste',
        password: hashedUserPassword,
        role: 'USER',
        isActive: true,
        mustChangePassword: false
      }
    });
    console.log(`   ✅ Usuário: ${userEmail}\n`);

    // ========================================================================
    // 3. DEPARTAMENTOS (14 SECRETARIAS)
    // ========================================================================
    console.log('3️⃣  Departamentos (Secretarias)');
    console.log('   ─────────────────────────────');

    const departments = [
      { name: 'Secretaria de Saúde', code: 'SAUDE', description: 'Gestão de saúde pública, consultas, exames e programas de saúde' },
      { name: 'Secretaria de Educação', code: 'EDUCACAO', description: 'Gestão educacional, matrículas, transporte escolar e merenda' },
      { name: 'Secretaria de Assistência Social', code: 'ASSISTENCIA_SOCIAL', description: 'Programas sociais, acolhimento e atendimento psicossocial' },
      { name: 'Secretaria de Agricultura', code: 'AGRICULTURA', description: 'Apoio ao produtor rural, assistência técnica e fomento agrícola' },
      { name: 'Secretaria de Cultura', code: 'CULTURA', description: 'Eventos culturais, patrimônio histórico e incentivo à cultura' },
      { name: 'Secretaria de Esportes', code: 'ESPORTES', description: 'Gestão de equipamentos esportivos, eventos e programas de esporte' },
      { name: 'Secretaria de Habitação', code: 'HABITACAO', description: 'Programas habitacionais, regularização fundiária e auxílio moradia' },
      { name: 'Secretaria de Meio Ambiente', code: 'MEIO_AMBIENTE', description: 'Licenciamento ambiental, fiscalização e educação ambiental' },
      { name: 'Secretaria de Obras Públicas', code: 'OBRAS_PUBLICAS', description: 'Obras públicas, pavimentação, drenagem e fiscalização de obras' },
      { name: 'Secretaria de Planejamento Urbano', code: 'PLANEJAMENTO_URBANO', description: 'Planejamento urbano, plano diretor, alvarás e licenciamento' },
      { name: 'Secretaria de Segurança Pública', code: 'SEGURANCA_PUBLICA', description: 'Guarda municipal, videomonitoramento e segurança pública' },
      { name: 'Secretaria de Serviços Públicos', code: 'SERVICOS_PUBLICOS', description: 'Limpeza urbana, iluminação pública e manutenção de vias' },
      { name: 'Secretaria de Turismo', code: 'TURISMO', description: 'Promoção turística, cadastro de guias e apoio a eventos' },
      { name: 'Secretaria de Fazenda', code: 'FAZENDA', description: 'Arrecadação, IPTU, ISS, certidões e gestão fiscal' },
    ];

    let deptCount = 0;
    for (const dept of departments) {
      await prisma.department.upsert({
        where: { name: dept.name },
        update: { code: dept.code, description: dept.description, isActive: true },
        create: {
          name: dept.name,
          code: dept.code,
          description: dept.description,
          isActive: true
        }
      });
      deptCount++;
      console.log(`   ✅ ${dept.code}`);
    }
    console.log(`\n   📊 Total: ${deptCount} departamentos criados\n`);

    // ========================================================================
    // 4. CIDADÃO DE TESTE
    // ========================================================================
    console.log('4️⃣  Cidadão de Teste');
    console.log('   ─────────────────────────────');

    const citizenCPF = '12345678901';
    const citizenPassword = 'Cidadao@123';
    const hashedCitizenPassword = await bcrypt.hash(citizenPassword, 12);

    await prisma.citizen.upsert({
      where: { cpf: citizenCPF },
      update: {
        password: hashedCitizenPassword,
        phoneSecondary: '11988888888',
        rg: '123456789',
        motherName: 'Maria Silva',
        maritalStatus: 'Casado(a)',
        occupation: 'Analista de Sistemas',
        familyIncome: '3 a 5 salários mínimos',
        address: {
          cep: '01310100',
          logradouro: 'Avenida Paulista',
          numero: '1000',
          complemento: 'Apto 101',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          uf: 'SP',
          pontoReferencia: 'Próximo ao MASP'
        },
        isActive: true
      },
      create: {
        cpf: citizenCPF,
        name: 'José Silva',
        email: 'jose.silva@example.com',
        phone: '11999999999',
        phoneSecondary: '11988888888',
        password: hashedCitizenPassword,
        birthDate: new Date('1990-01-01'),
        rg: '123456789',
        motherName: 'Maria Silva',
        maritalStatus: 'Casado(a)',
        occupation: 'Analista de Sistemas',
        familyIncome: '3 a 5 salários mínimos',
        address: {
          cep: '01310100',
          logradouro: 'Avenida Paulista',
          numero: '1000',
          complemento: 'Apto 101',
          bairro: 'Bela Vista',
          cidade: 'São Paulo',
          uf: 'SP',
          pontoReferencia: 'Próximo ao MASP'
        },
        isActive: true
      }
    });
    console.log(`   ✅ Cidadão: José Silva (CPF: ${citizenCPF})\n`);

    // ========================================================================
    // 5. SERVIÇOS SIMPLIFICADOS
    // ========================================================================
    console.log('5️⃣  Serviços Simplificados');
    console.log('   ─────────────────────────────');
    console.log('   📦 Importando serviços...');

    try {
      const { seedServices } = await import('./seeds/services/index');
      const servicesCreated = await seedServices();
      console.log(`   ✅ ${servicesCreated} serviços criados/atualizados\n`);
    } catch (error: any) {
      console.error('   ⚠️  Erro ao importar serviços:', error.message);
      console.log('   ℹ️  Continuando sem os serviços...\n');
    }

    // ========================================================================
    // 6. ESTABELECIMENTOS (Unidades de Saúde, Escolas, CRAS, Espaços Públicos)
    // ========================================================================
    console.log('6️⃣  Estabelecimentos e Espaços Públicos');
    console.log('   ─────────────────────────────');
    console.log('   📦 Importando estabelecimentos...');

    try {
      const { seedAllEstabelecimentos } = await import('./seeds/establishments/index');
      await seedAllEstabelecimentos();
      console.log(`   ✅ Estabelecimentos criados com sucesso\n`);
    } catch (error: any) {
      console.error('   ⚠️  Erro ao importar estabelecimentos:', error.message);
      console.log('   ℹ️  Continuando sem os estabelecimentos...\n');
    }

    // ========================================================================
    // 7. DADOS AUXILIARES (25 tabelas auxiliares - 100% do plano)
    // ========================================================================
    console.log('7️⃣  Dados Auxiliares (25 tabelas)');
    console.log('   ─────────────────────────────');
    console.log('   📦 Importando dados auxiliares...');

    try {
      const { seedAllAuxiliaryData } = await import('./seeds/auxiliary/index');
      await seedAllAuxiliaryData();
      console.log(`   ✅ Todos os dados auxiliares criados com sucesso\n`);
    } catch (error: any) {
      console.error('   ⚠️  Erro ao importar dados auxiliares:', error.message);
      console.log('   ℹ️  Continuando sem os dados auxiliares...\n');
    }

    // ========================================================================
    // 8. MODULE WORKFLOWS (REMOVIDO - Feature não implementada)
    // ========================================================================
    // Workflows são opcionais e serão criados via interface admin quando necessário
    // A infraestrutura está pronta (tabela module_workflows, APIs, etc)
    // mas não pre-populamos workflows pois não há interface visual ainda
    console.log('8️⃣  Module Workflows');
    console.log('   ─────────────────────────────');
    console.log('   ⏭️  Pulado - Workflows serão criados via interface admin\n');

    // ========================================================================
    // RESUMO FINAL
    // ========================================================================
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║           ✅ SEED CONSOLIDADO CONCLUÍDO               ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('📋 CREDENCIAIS DE ACESSO\n');
    console.log('🔐 SUPER ADMIN:');
    console.log(`   Email: ${superAdminEmail}`);
    console.log(`   Senha: ${superAdminPassword}\n`);

    console.log('👤 ADMIN MUNICIPAL:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminPassword}\n`);

    console.log('👥 GERENTE MUNICIPAL:');
    console.log(`   Email: ${managerEmail}`);
    console.log(`   Senha: ${managerPassword}\n`);

    console.log('👤 USUÁRIO TESTE:');
    console.log(`   Email: ${userEmail}`);
    console.log(`   Senha: ${userPassword}\n`);

    console.log('🏠 CIDADÃO TESTE:');
    console.log(`   Email: jose.silva@example.com`);
    console.log(`   CPF: ${citizenCPF}`);
    console.log(`   Senha: ${citizenPassword}\n`);

    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║  🚀 Sistema pronto para uso!                          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ ERRO NO SEED:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('\n❌ ERRO FATAL NO SEED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
