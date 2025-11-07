import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed SINGLE TENANT do banco de dados...\n');

  try {
    // ========== 1. CRIAR CONFIGURAÇÃO DO MUNICÍPIO (SINGLETON) ==========
    console.log('🏛️  Criando configuração do município...');

    const municipioConfig = await prisma.municipioConfig.upsert({
      where: { id: 'singleton' },
      update: {
        subscriptionEnds: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
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
        subscriptionEnds: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
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
    console.log('   ✅ Configuração do município criada:', municipioConfig.nome);

    // ========== 2. CRIAR SUPER ADMIN ==========
    console.log('\n👑 Criando super administrador...');

    const superAdminEmail = 'superadmin@digiurban.com.br';
    const superAdminPassword = 'SuperAdmin@2025';

    let superAdminUser = await prisma.user.findUnique({
      where: { email: superAdminEmail }
    });

    const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 12);

    if (!superAdminUser) {
      superAdminUser = await prisma.user.create({
        data: {
          email: superAdminEmail,
          name: 'Super Administrador DigiUrban',
          password: hashedSuperAdminPassword,
          role: 'SUPER_ADMIN',
          isActive: true,
          mustChangePassword: false
        }
      });
      console.log('   ✅ Super Admin criado:', superAdminUser.email);
      console.log('   🔑 Senha:', superAdminPassword);
    } else {
      await prisma.user.update({
        where: { id: superAdminUser.id },
        data: {
          password: hashedSuperAdminPassword,
          isActive: true,
          role: 'SUPER_ADMIN',
          mustChangePassword: false
        }
      });
      console.log('   ℹ️  Super Admin já existe (senha atualizada):', superAdminUser.email);
      console.log('   🔑 Senha:', superAdminPassword);
    }

    // ========== 3. CRIAR ADMIN PRINCIPAL ==========
    console.log('\n👤 Criando administrador principal...');

    const adminEmail = 'admin@demo.gov.br';
    const adminPassword = 'Admin@123';

    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Administrador Municipal',
          password: hashedAdminPassword,
          role: 'ADMIN',
          isActive: true,
          mustChangePassword: false
        }
      });
      console.log('   ✅ Admin criado:', adminUser.email);
    } else {
      await prisma.user.update({
        where: { id: adminUser.id },
        data: {
          password: hashedAdminPassword,
          isActive: true,
          role: 'ADMIN',
          mustChangePassword: false
        }
      });
      console.log('   ℹ️  Admin já existe (senha atualizada):', adminUser.email);
    }

    // ========== 4. CRIAR USUÁRIO DE TESTE ==========
    console.log('\n👤 Criando usuário de teste...');

    const userEmail = 'user@demo.gov.br';
    const userPassword = 'User@123';

    let testUser = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    const hashedUserPassword = await bcrypt.hash(userPassword, 12);

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: userEmail,
          name: 'Usuário Teste',
          password: hashedUserPassword,
          role: 'USER',
          isActive: true,
          mustChangePassword: false
        }
      });
      console.log('   ✅ Usuário teste criado:', testUser.email);
    } else {
      await prisma.user.update({
        where: { id: testUser.id },
        data: {
          password: hashedUserPassword,
          isActive: true,
          role: 'USER',
          mustChangePassword: false
        }
      });
      console.log('   ℹ️  Usuário teste já existe (senha atualizada):', testUser.email);
    }

    // ========== 4. CRIAR DEPARTAMENTOS GLOBAIS (14 SECRETARIAS PADRÃO) ==========
    console.log('\n🏢 Criando departamentos (secretarias)...');

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
      console.log(`   ✅ ${dept.name} (${dept.code})`);
    }

    // ========== 5. CRIAR GERENTE DE TESTE ==========
    console.log('\n👤 Criando gerente de teste...');

    const managerEmail = 'gerente@demo.gov.br';
    const managerPassword = 'Gerente@123';

    let managerUser = await prisma.user.findUnique({
      where: { email: managerEmail }
    });

    const hashedManagerPassword = await bcrypt.hash(managerPassword, 12);

    if (!managerUser) {
      managerUser = await prisma.user.create({
        data: {
          email: managerEmail,
          name: 'Gerente Municipal',
          password: hashedManagerPassword,
          role: 'MANAGER',
          isActive: true,
          mustChangePassword: false
        }
      });
      console.log('   ✅ Gerente criado:', managerUser.email);
    } else {
      await prisma.user.update({
        where: { id: managerUser.id },
        data: {
          password: hashedManagerPassword,
          isActive: true,
          role: 'MANAGER',
          mustChangePassword: false
        }
      });
      console.log('   ℹ️  Gerente já existe (senha atualizada):', managerUser.email);
    }

    // ========== 6. CRIAR CIDADÃO DE TESTE ==========
    console.log('\n👤 Criando cidadão de teste...');

    const citizenCPF = '12345678901';
    const citizenPassword = 'Cidadao@123';

    let citizenUser = await prisma.citizen.findUnique({
      where: { cpf: citizenCPF }
    });

    const hashedCitizenPassword = await bcrypt.hash(citizenPassword, 12);

    if (!citizenUser) {
      citizenUser = await prisma.citizen.create({
        data: {
          cpf: citizenCPF,
          name: 'José Silva',
          email: 'jose.silva@example.com',
          phone: '11999999999',
          password: hashedCitizenPassword,
          birthDate: new Date('1990-01-01'),
          isActive: true
        }
      });
      console.log('   ✅ Cidadão criado:', citizenUser.name);
    } else {
      await prisma.citizen.update({
        where: { id: citizenUser.id },
        data: {
          password: hashedCitizenPassword,
          isActive: true
        }
      });
      console.log('   ℹ️  Cidadão já existe (senha atualizada):', citizenUser.name);
    }

    // ========== RESUMO FINAL ==========
    console.log('\n✅ Seed concluído com sucesso!');
    console.log('\n📋 ========================================');
    console.log('📋 CREDENCIAIS DE ACESSO - DigiUrban');
    console.log('📋 ========================================\n');

    console.log('🏛️  MUNICÍPIO:');
    console.log(`   Nome: ${municipioConfig.nome}`);
    console.log(`   CNPJ: ${municipioConfig.cnpj}`);
    console.log(`   Código IBGE: ${municipioConfig.codigoIbge}`);
    console.log(`   UF: ${municipioConfig.ufMunicipio}\n`);

    console.log('👤 ADMINISTRADOR MUNICIPAL:');
    console.log(`   📧 Email: ${adminEmail}`);
    console.log(`   🔑 Senha: ${adminPassword}\n`);

    console.log('👤 GERENTE MUNICIPAL:');
    console.log(`   📧 Email: ${managerEmail}`);
    console.log(`   🔑 Senha: ${managerPassword}\n`);

    console.log('👤 USUÁRIO TESTE:');
    console.log(`   📧 Email: ${userEmail}`);
    console.log(`   🔑 Senha: ${userPassword}\n`);

    console.log('👤 CIDADÃO TESTE:');
    console.log(`   📧 Email: jose.silva@example.com`);
    console.log(`   🆔 CPF: ${citizenCPF}`);
    console.log(`   🔑 Senha: ${citizenPassword}\n`);

    console.log('📋 ========================================');
    console.log('✅ Modo: SINGLE TENANT');
    console.log('✅ Sem multitenancy, sem tenantId');
    console.log('📋 ========================================\n');

  } catch (error) {
    console.error('❌ Erro no seed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro fatal no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
