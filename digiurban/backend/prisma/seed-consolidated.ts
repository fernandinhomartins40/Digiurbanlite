/**
 * ============================================================================
 * SEED CONSOLIDADO - DigiUrban Single Tenant
 * ============================================================================
 *
 * Este arquivo consolida todos os seeds da aplicação em ordem de execução:
 *
 * 1. Configuração do Município (Singleton)
 * 2. Usuários do Sistema (Super Admin, Admin, Gerente, User)
 * 3. Departamentos (21 Secretarias)
 * 4. Cidadão de Teste
 * 5. Serviços Simplificados (~400 serviços com formSchemas)
 *
 * Execução: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { migrateDocumentsToTable } from './migrations-data/migrate-documents-to-table';
import { seedEmailServer } from './seeds/email-server.seed';
import { seedServiceWorkflows } from './seeds/service-workflows.seed';

const prisma = new PrismaClient();

/**
 * ⚠️ MULTI-TENANT (corrigido 2026-09-15)
 *
 * Este seed usava `upsert({ where: { email } })` para criar os usuários. Desde o
 * plano multi-tenant 2026-07-13 a unique de User é COMPOSTA
 * (`users_tenantId_email_key`), então `where: { email }` nem valida no Prisma:
 *   PrismaClientValidationError: Invalid `prisma.user.upsert()` invocation
 *
 * O seed morria na seção 2 — por isso o banco ficava com o Município
 * Demonstração criado (seção 1, que usa `id: 'singleton'`) mas SEM usuários,
 * secretarias, serviços ou cidadãos.
 *
 * Este helper faz o upsert respeitando a unique composta: `findFirst` escopado
 * por tenant + create/update por `id`. Mesma correção já aplicada em
 * scripts/create-super-admin.ts.
 */
const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || 'tenant-default';

async function upsertUserPorTenant(params: {
  email: string;
  name: string;
  hashedPassword: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER';
  departmentId?: string | null;
}) {
  const existente = await prisma.user.findFirst({
    where: { email: params.email, tenantId: DEFAULT_TENANT_ID },
    select: { id: true },
  });

  const dadosComuns = {
    password: params.hashedPassword,
    isActive: true,
    role: params.role,
    mustChangePassword: false,
  };

  if (existente) {
    return prisma.user.update({
      where: { id: existente.id },
      data: dadosComuns,
    });
  }

  return prisma.user.create({
    data: {
      tenantId: DEFAULT_TENANT_ID,
      email: params.email,
      name: params.name,
      ...(params.departmentId ? { departmentId: params.departmentId } : {}),
      ...dadosComuns,
    } as any,
  });
}

async function main() {
  const shouldSeedServiceWorkflows =
    process.env.SEED_SERVICE_WORKFLOWS === 'true' || process.env.NODE_ENV !== 'production';
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🌱 SEED CONSOLIDADO - DigiUrban Single Tenant        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // ========================================================================
    // 1. CONFIGURAÇÃO DO MUNICÍPIO (SINGLETON)
    // ========================================================================
    console.log('1️⃣  Configuração do Município');
    console.log('   ─────────────────────────────');

    // ⚠️ MULTI-TENANT (2026-09-15): o seed criava apenas `municipioConfig`
    // (singleton, modelo pré-multi-tenant) e NUNCA a linha em `tenants`. Como
    // agora usuários, cidadãos e demais registros nascem com
    // `tenantId = tenant-default`, sem esta linha todos os creates falhariam
    // por violação de chave estrangeira. Idempotente.
    await prisma.tenant.upsert({
      where: { id: DEFAULT_TENANT_ID },
      update: {},
      create: {
        id: DEFAULT_TENANT_ID,
        slug: 'default',
        nome: 'Município Demonstração',
        cnpj: '00000000000191',
        nomeMunicipio: 'Demonstração',
        ufMunicipio: 'SP',
        status: 'ACTIVE',
      } as any,
    });
    console.log(`   ✅ Tenant: ${DEFAULT_TENANT_ID}`);

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

    await upsertUserPorTenant({
      email: superAdminEmail,
      name: 'Super Administrador DigiUrban',
      hashedPassword: hashedSuperAdminPassword,
      role: 'SUPER_ADMIN',
    });
    console.log(`   ✅ Super Admin: ${superAdminEmail}`);

    // 2.2 Admin
    const adminEmail = 'admin@demo.gov.br';
    const adminPassword = 'Admin@123';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 12);

    await upsertUserPorTenant({
      email: adminEmail,
      name: 'Administrador Municipal',
      hashedPassword: hashedAdminPassword,
      role: 'ADMIN',
    });
    console.log(`   ✅ Admin: ${adminEmail}`);

    // 2.3 Gerente
    const managerEmail = 'gerente@demo.gov.br';
    const managerPassword = 'Gerente@123';
    const hashedManagerPassword = await bcrypt.hash(managerPassword, 12);

    await upsertUserPorTenant({
      email: managerEmail,
      name: 'Gerente Municipal',
      hashedPassword: hashedManagerPassword,
      role: 'MANAGER',
    });
    console.log(`   ✅ Gerente: ${managerEmail}`);

    // 2.4 Usuário
    const userEmail = 'user@demo.gov.br';
    const userPassword = 'User@123';
    const hashedUserPassword = await bcrypt.hash(userPassword, 12);

    await upsertUserPorTenant({
      email: userEmail,
      name: 'Usuário Teste',
      hashedPassword: hashedUserPassword,
      role: 'USER',
    });
    console.log(`   ✅ Usuário: ${userEmail}\n`);

    // ========================================================================
    // 3. DEPARTAMENTOS (21 SECRETARIAS)
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
      { name: 'Secretaria de Fazenda', code: 'FINANCAS', description: 'Arrecadação, IPTU, ISS, certidões e gestão fiscal' },
      { name: 'Secretaria de Administração', code: 'ADMINISTRACAO', description: 'Gestão administrativa, protocolo, ouvidoria e serviços gerais' },
      { name: 'Defesa Civil', code: 'DEFESA_CIVIL', description: 'Prevenção de riscos, gestão de emergências e proteção civil' },
      { name: 'Secretaria de Políticas para Mulheres', code: 'POLITICAS_MULHERES', description: 'Políticas públicas para mulheres, combate à violência e empoderamento feminino' },
      { name: 'Secretaria de Tecnologia e Inovação', code: 'TECNOLOGIA_INOVACAO', description: 'Tecnologia da informação, inovação, sistemas municipais e inclusão digital' },
      { name: 'Secretaria de Transportes e Trânsito', code: 'TRANSPORTES_TRANSITO', description: 'Gestão de trânsito, credenciamento de veículos e sinalização viária' },
      { name: 'Secretaria de Desenvolvimento Econômico', code: 'DESENVOLVIMENTO_ECONOMICO', description: 'Fomento econômico, empreendedorismo, qualificação profissional e emprego' },
      { name: 'Secretaria de Mobilidade Urbana', code: 'MOBILIDADE_URBANA', description: 'Transporte público, acessibilidade e integração modal' },
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

    // ⚠️ MULTI-TENANT: a unique de Citizen também é composta
    // (`citizens_tenantId_cpf_key`), então `where: { cpf }` não valida no
    // Prisma — mesmo problema dos usuários acima. Resolvemos o id primeiro e
    // then usamos update/create por id.
    const cidadaoExistente = await prisma.citizen.findFirst({
      where: { cpf: citizenCPF, tenantId: DEFAULT_TENANT_ID },
      select: { id: true },
    });

    await prisma.citizen.upsert({
      where: cidadaoExistente
        ? { id: cidadaoExistente.id }
        : { id: '__nao_existe__' }, // força o caminho de `create`
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
        tenantId: DEFAULT_TENANT_ID,
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
    // 8. SERVICE WORKFLOWS
    // ========================================================================
    console.log('8️⃣  Service Workflows');
    console.log('   ─────────────────────────────');

    if (shouldSeedServiceWorkflows) {
      await seedServiceWorkflows();
    } else {
      console.log('   Workflow seed ignorado em producao para preservar customizacoes');
    }
    if (shouldSeedServiceWorkflows) {
      console.log('   ✅ Workflows de serviços criados com sucesso\n');
    } else {
      console.log('');
    }

    // ========================================================================
    // 9. SISTEMA UNIFICADO DE VINCULAÇÕES V2.0
    // ========================================================================
    console.log('9️⃣  Sistema Unificado de Vinculações V2.0');
    console.log('   ─────────────────────────────');
    console.log('   📦 Importando sistema unificado...');

    try {
      const { default: seedUnifiedSystem } = await import('./seeds/unified-system.seed');
      await seedUnifiedSystem();
      console.log('   ✅ Sistema Unificado criado com sucesso\n');
    } catch (error: any) {
      console.error('   ⚠️  Erro ao importar sistema unificado:', error.message);
      console.log('   ℹ️  Continuando sem o sistema unificado...\n');
    }

    // ========================================================================
    // 10. SEEDS DOS APPS DE SAÚDE (INTEGRADO AO SISTEMA UNIFICADO)
    // ========================================================================
    console.log('🔟 Seeds dos Apps de Saúde');
    console.log('   ─────────────────────────────');
    console.log('   📦 Importando seeds de saúde...');

    try {
      const { default: masterSeedSaude } = await import('./seeds/apps/saude/master-seed-saude');
      await masterSeedSaude();
      console.log('   ✅ Seeds de Saúde criados com sucesso\n');
    } catch (error: any) {
      console.error('   ⚠️  Erro ao importar seeds de saúde:', error.message);
      console.log('   ℹ️  Continuando sem os seeds de saúde...\n');
    }

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

    // ========================================================================
    // 7. MIGRAÇÃO DE DOCUMENTOS (JSON → Tabela)
    // ========================================================================
    console.log('7️⃣  Migração de Documentos');
    console.log('   ─────────────────────────────');

    try {
      await migrateDocumentsToTable();
    } catch (migrationError) {
      console.error('   ⚠️  Erro na migração de documentos (continuando):', migrationError);
      // Não falhar o seed se migração der erro
    }

    // ========================================================================
    // 6. PLANOS DE EMAIL (Configuráveis) - EXECUTAR PRIMEIRO!
    // ========================================================================
    console.log('\n6️⃣  Planos de Email (Configuráveis)');
    console.log('   ─────────────────────────────\n');

    const { seedEmailPlans } = await import('./seeds/email-plans.seed');
    await seedEmailPlans();

    // ========================================================================
    // 7. SERVIDOR DE EMAIL (Precisa dos planos já criados)
    // ========================================================================
    console.log('\n7️⃣  Servidor de Email');
    console.log('   ─────────────────────────────\n');

    await seedEmailServer();

    // ========================================================================
    // 8. CATEGORIAS DE CIDADÃOS
    // ========================================================================
    console.log('\n8️⃣  Categorias de Cidadãos');
    console.log('   ─────────────────────────────\n');

    const { seedCitizenCategories } = await import('./seeds/citizen-categories.seed');
    await seedCitizenCategories();

    // ========================================================================
    // 9. TEMPLATES DE DOCUMENTOS
    // ========================================================================
    console.log('\n9️⃣  Templates de Documentos');
    console.log('   ─────────────────────────────\n');

    const seedDocumentTemplates = (await import('./seeds/document-templates.seed')).default;
    await seedDocumentTemplates();

    // ========================================================================
    // 10. NORMALIZAÇÃO MULTI-TENANT (onda 8 — plano 2026-07-13)
    // Os seeds usam PrismaClient cru (sem a tenant-extension), então linhas
    // criadas aqui nascem com tenantId NULL — invisíveis às leituras escopadas
    // do app. Este passo herda o tenant default em TODA tabela com coluna
    // tenantId (mesmo critério do backfill das migrations das ondas 1-8).
    // ========================================================================
    console.log('\n🔟 Normalizando tenantId dos dados seedados...');
    try {
      await prisma.$executeRawUnsafe(`
        DO $seedfix$
        DECLARE r RECORD; default_tenant TEXT;
        BEGIN
          SELECT id INTO default_tenant FROM tenants ORDER BY "createdAt" ASC LIMIT 1;
          IF default_tenant IS NULL THEN default_tenant := 'tenant-default'; END IF;
          FOR r IN
            SELECT DISTINCT table_name FROM information_schema.columns
            WHERE column_name = 'tenantId' AND table_schema = 'public' AND table_name <> 'tenants'
          LOOP
            EXECUTE format('UPDATE %I SET "tenantId" = %L WHERE "tenantId" IS NULL', r.table_name, default_tenant);
          END LOOP;
        END $seedfix$;
      `);
      console.log('   ✅ tenantId normalizado para o tenant default');
    } catch (normalizeError) {
      console.error('   ⚠️  Erro na normalização de tenantId (continuando):', normalizeError);
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
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
