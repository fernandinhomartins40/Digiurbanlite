import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function applyUnifiedSystem() {
  console.log('🚀 Aplicando sistema unificado de vinculação...\n');

  const sql = `
    -- CreateEnum
    DO $$ BEGIN
      CREATE TYPE "TipoUnidadeOrganizacional" AS ENUM ('SECRETARIA', 'DIRETORIA', 'COORDENADORIA', 'DIVISAO', 'SETOR', 'NUCLEO', 'GERENCIA', 'UNIDADE_ESPECIAL', 'DEPARTAMENTO', 'ASSESSORIA');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "TipoCargo" AS ENUM ('EFETIVO', 'COMISSIONADO', 'TEMPORARIO', 'CONTRATADO', 'ESTAGIARIO', 'VOLUNTARIO');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "NivelCargo" AS ENUM ('OPERACIONAL', 'TECNICO', 'ANALISTA', 'ESPECIALISTA', 'COORDENACAO', 'GERENCIA', 'DIRECAO', 'SECRETARIADO');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "TipoFuncao" AS ENUM ('GRATIFICADA', 'COMISSIONADA', 'DESIGNACAO', 'REPRESENTACAO');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "TipoVinculo" AS ENUM ('LOTACAO', 'CEDENCIA', 'REQUISICAO', 'REMOCAO', 'DISPOSICAO');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "SituacaoVinculo" AS ENUM ('ATIVO', 'AFASTADO', 'LICENCA', 'SUSPENSO', 'CEDIDO', 'INATIVO');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "TipoHierarquia" AS ENUM ('HIERARQUICO', 'FUNCIONAL', 'TECNICO', 'MATRICIAL');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "TipoTeam" AS ENUM ('PERMANENTE', 'TEMPORARIA', 'PROJETO', 'GRUPO_TRABALHO', 'COMISSAO', 'CONSELHO');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      CREATE TYPE "TipoOperacaoVinculo" AS ENUM ('CRIACAO', 'ATIVACAO', 'DESATIVACAO', 'TRANSFERENCIA', 'REMOCAO', 'PROMOCAO', 'DESIGNACAO', 'EXONERACAO', 'ALTERACAO_CARGA_HORARIA', 'ALTERACAO_FUNCAO', 'AFASTAMENTO', 'RETORNO', 'CEDENCIA', 'REQUISICAO');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    -- CreateTable organizational_units
    CREATE TABLE IF NOT EXISTS "organizational_units" (
        "id" TEXT NOT NULL,
        "nome" TEXT NOT NULL,
        "sigla" TEXT,
        "tipo" "TipoUnidadeOrganizacional" NOT NULL,
        "nivel" INTEGER NOT NULL,
        "departmentId" TEXT NOT NULL,
        "parentId" TEXT,
        "responsavelId" TEXT,
        "descricao" TEXT,
        "competencias" JSONB,
        "endereco" TEXT,
        "telefone" TEXT,
        "email" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT,
        CONSTRAINT "organizational_units_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable positions
    CREATE TABLE IF NOT EXISTS "positions" (
        "id" TEXT NOT NULL,
        "nome" TEXT NOT NULL,
        "descricao" TEXT,
        "cbo" TEXT,
        "tipo" "TipoCargo" NOT NULL,
        "categoria" TEXT,
        "nivel" "NivelCargo",
        "requisitos" JSONB,
        "atribuicoes" JSONB,
        "departmentId" TEXT NOT NULL,
        "organizationalUnitId" TEXT,
        "cargaHorariaPadrao" INTEGER DEFAULT 40,
        "salarioBase" DECIMAL(10,2),
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT,
        CONSTRAINT "positions_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable functions
    CREATE TABLE IF NOT EXISTS "functions" (
        "id" TEXT NOT NULL,
        "nome" TEXT NOT NULL,
        "descricao" TEXT,
        "tipo" "TipoFuncao" NOT NULL,
        "simbolo" TEXT,
        "valor" DECIMAL(10,2),
        "departmentId" TEXT NOT NULL,
        "requisitos" JSONB,
        "atribuicoes" JSONB,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT,
        CONSTRAINT "functions_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable employee_assignments
    CREATE TABLE IF NOT EXISTS "employee_assignments" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "departmentId" TEXT NOT NULL,
        "organizationalUnitId" TEXT,
        "positionId" TEXT,
        "functionId" TEXT,
        "tipo" "TipoVinculo" NOT NULL,
        "situacao" "SituacaoVinculo" NOT NULL,
        "isPrimary" BOOLEAN NOT NULL DEFAULT false,
        "dataInicio" TIMESTAMP(3) NOT NULL,
        "dataFim" TIMESTAMP(3),
        "cargaHoraria" INTEGER,
        "percentualDedicacao" INTEGER,
        "observacoes" TEXT,
        "documentoVinculo" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT,
        CONSTRAINT "employee_assignments_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable employee_hierarchies
    CREATE TABLE IF NOT EXISTS "employee_hierarchies" (
        "id" TEXT NOT NULL,
        "subordinadoId" TEXT NOT NULL,
        "supervisorId" TEXT NOT NULL,
        "tipo" "TipoHierarquia" NOT NULL,
        "organizationalUnitId" TEXT,
        "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dataFim" TIMESTAMP(3),
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "observacoes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT,
        CONSTRAINT "employee_hierarchies_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable health_professional_data
    CREATE TABLE IF NOT EXISTS "health_professional_data" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "categoria" TEXT NOT NULL,
        "registroProfissional" TEXT,
        "tipoRegistro" TEXT,
        "ufRegistro" TEXT,
        "cns" TEXT,
        "cbo" TEXT,
        "especialidades" JSONB,
        "aceitaAgendamento" BOOLEAN NOT NULL DEFAULT true,
        "tempoMedioConsulta" INTEGER DEFAULT 30,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "motivoInativacao" TEXT,
        "dataInativacao" TIMESTAMP(3),
        "observacoes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT,
        CONSTRAINT "health_professional_data_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable education_professional_data
    CREATE TABLE IF NOT EXISTS "education_professional_data" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "categoria" TEXT NOT NULL,
        "registroProfissional" TEXT,
        "formacao" TEXT,
        "posGraduacao" JSONB,
        "disciplinas" JSONB,
        "nivelEnsino" JSONB,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "observacoes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT,
        CONSTRAINT "education_professional_data_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable engineering_professional_data
    CREATE TABLE IF NOT EXISTS "engineering_professional_data" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "categoria" TEXT NOT NULL,
        "registroProfissional" TEXT,
        "tipoRegistro" TEXT,
        "ufRegistro" TEXT,
        "especialidades" JSONB,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "observacoes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT,
        CONSTRAINT "engineering_professional_data_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable social_assistance_professional_data
    CREATE TABLE IF NOT EXISTS "social_assistance_professional_data" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "categoria" TEXT NOT NULL,
        "registroProfissional" TEXT,
        "tipoRegistro" TEXT,
        "ufRegistro" TEXT,
        "areasAtuacao" JSONB,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "observacoes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT,
        CONSTRAINT "social_assistance_professional_data_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable teams
    CREATE TABLE IF NOT EXISTS "teams" (
        "id" TEXT NOT NULL,
        "nome" TEXT NOT NULL,
        "sigla" TEXT,
        "tipo" "TipoTeam" NOT NULL,
        "finalidade" TEXT,
        "departmentId" TEXT NOT NULL,
        "organizationalUnitId" TEXT,
        "coordenadorId" TEXT,
        "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dataFim" TIMESTAMP(3),
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT,
        CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable team_members
    CREATE TABLE IF NOT EXISTS "team_members" (
        "id" TEXT NOT NULL,
        "teamId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "papel" TEXT,
        "atribuicoes" TEXT,
        "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "dataFim" TIMESTAMP(3),
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        "createdBy" TEXT,
        CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
    );

    -- CreateTable assignment_audits
    CREATE TABLE IF NOT EXISTS "assignment_audits" (
        "id" TEXT NOT NULL,
        "assignmentId" TEXT,
        "tipo" "TipoOperacaoVinculo" NOT NULL,
        "userId" TEXT NOT NULL,
        "userName" TEXT NOT NULL,
        "userCPF" TEXT,
        "departmentId" TEXT,
        "departmentName" TEXT,
        "unitOrigemId" TEXT,
        "unitOrigemName" TEXT,
        "unitDestinoId" TEXT,
        "unitDestinoName" TEXT,
        "positionOrigemId" TEXT,
        "positionOrigemName" TEXT,
        "positionDestinoId" TEXT,
        "positionDestinoName" TEXT,
        "executorId" TEXT,
        "executorName" TEXT,
        "aprovadorId" TEXT,
        "aprovadorName" TEXT,
        "documentoLegal" TEXT,
        "motivo" TEXT,
        "detalhes" JSONB,
        "dataEfetivacao" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "assignment_audits_pkey" PRIMARY KEY ("id")
    );
  `;

  console.log('📋 Executando SQL para criar enums e tabelas...');

  try {
    await prisma.$executeRawUnsafe(sql);
    console.log('✅ Enums e tabelas criadas com sucesso!\n');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('✅ Tabelas já existem, pulando...\n');
    } else {
      console.error('❌ Erro ao criar tabelas:', error.message);
      throw error;
    }
  }

  console.log('🔗 Criando índices e constraints...');

  const indexes = [
    `CREATE UNIQUE INDEX IF NOT EXISTS "organizational_units_departmentId_sigla_key" ON "organizational_units"("departmentId", "sigla")`,
    `CREATE INDEX IF NOT EXISTS "organizational_units_departmentId_tipo_isActive_idx" ON "organizational_units"("departmentId", "tipo", "isActive")`,
    `CREATE INDEX IF NOT EXISTS "organizational_units_parentId_idx" ON "organizational_units"("parentId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "positions_departmentId_nome_key" ON "positions"("departmentId", "nome")`,
    `CREATE INDEX IF NOT EXISTS "positions_departmentId_tipo_isActive_idx" ON "positions"("departmentId", "tipo", "isActive")`,
    `CREATE INDEX IF NOT EXISTS "positions_organizationalUnitId_idx" ON "positions"("organizationalUnitId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "functions_departmentId_simbolo_key" ON "functions"("departmentId", "simbolo")`,
    `CREATE INDEX IF NOT EXISTS "functions_departmentId_tipo_isActive_idx" ON "functions"("departmentId", "tipo", "isActive")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "employee_assignments_userId_organizationalUnitId_positionId_key" ON "employee_assignments"("userId", "organizationalUnitId", "positionId", "dataInicio")`,
    `CREATE INDEX IF NOT EXISTS "employee_assignments_userId_isPrimary_situacao_idx" ON "employee_assignments"("userId", "isPrimary", "situacao")`,
    `CREATE INDEX IF NOT EXISTS "employee_assignments_departmentId_situacao_idx" ON "employee_assignments"("departmentId", "situacao")`,
    `CREATE INDEX IF NOT EXISTS "employee_assignments_organizationalUnitId_situacao_idx" ON "employee_assignments"("organizationalUnitId", "situacao")`,
    `CREATE INDEX IF NOT EXISTS "employee_assignments_positionId_idx" ON "employee_assignments"("positionId")`,
    `CREATE INDEX IF NOT EXISTS "employee_assignments_situacao_idx" ON "employee_assignments"("situacao")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "employee_hierarchies_subordinadoId_supervisorId_tipo_dataIn_key" ON "employee_hierarchies"("subordinadoId", "supervisorId", "tipo", "dataInicio")`,
    `CREATE INDEX IF NOT EXISTS "employee_hierarchies_subordinadoId_ativo_idx" ON "employee_hierarchies"("subordinadoId", "ativo")`,
    `CREATE INDEX IF NOT EXISTS "employee_hierarchies_supervisorId_ativo_idx" ON "employee_hierarchies"("supervisorId", "ativo")`,
    `CREATE INDEX IF NOT EXISTS "employee_hierarchies_organizationalUnitId_idx" ON "employee_hierarchies"("organizationalUnitId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "health_professional_data_userId_key" ON "health_professional_data"("userId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "health_professional_data_registroProfissional_key" ON "health_professional_data"("registroProfissional")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "health_professional_data_cns_key" ON "health_professional_data"("cns")`,
    `CREATE INDEX IF NOT EXISTS "health_professional_data_userId_idx" ON "health_professional_data"("userId")`,
    `CREATE INDEX IF NOT EXISTS "health_professional_data_categoria_ativo_idx" ON "health_professional_data"("categoria", "ativo")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "education_professional_data_userId_key" ON "education_professional_data"("userId")`,
    `CREATE INDEX IF NOT EXISTS "education_professional_data_userId_idx" ON "education_professional_data"("userId")`,
    `CREATE INDEX IF NOT EXISTS "education_professional_data_categoria_ativo_idx" ON "education_professional_data"("categoria", "ativo")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "engineering_professional_data_userId_key" ON "engineering_professional_data"("userId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "engineering_professional_data_registroProfissional_key" ON "engineering_professional_data"("registroProfissional")`,
    `CREATE INDEX IF NOT EXISTS "engineering_professional_data_userId_idx" ON "engineering_professional_data"("userId")`,
    `CREATE INDEX IF NOT EXISTS "engineering_professional_data_categoria_ativo_idx" ON "engineering_professional_data"("categoria", "ativo")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "social_assistance_professional_data_userId_key" ON "social_assistance_professional_data"("userId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "social_assistance_professional_data_registroProfissional_key" ON "social_assistance_professional_data"("registroProfissional")`,
    `CREATE INDEX IF NOT EXISTS "social_assistance_professional_data_userId_idx" ON "social_assistance_professional_data"("userId")`,
    `CREATE INDEX IF NOT EXISTS "social_assistance_professional_data_categoria_ativo_idx" ON "social_assistance_professional_data"("categoria", "ativo")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "teams_departmentId_sigla_key" ON "teams"("departmentId", "sigla")`,
    `CREATE INDEX IF NOT EXISTS "teams_departmentId_ativo_idx" ON "teams"("departmentId", "ativo")`,
    `CREATE INDEX IF NOT EXISTS "teams_organizationalUnitId_idx" ON "teams"("organizationalUnitId")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "team_members_teamId_userId_dataInicio_key" ON "team_members"("teamId", "userId", "dataInicio")`,
    `CREATE INDEX IF NOT EXISTS "team_members_userId_ativo_idx" ON "team_members"("userId", "ativo")`,
    `CREATE INDEX IF NOT EXISTS "team_members_teamId_ativo_idx" ON "team_members"("teamId", "ativo")`,
    `CREATE INDEX IF NOT EXISTS "assignment_audits_userId_tipo_createdAt_idx" ON "assignment_audits"("userId", "tipo", "createdAt")`,
    `CREATE INDEX IF NOT EXISTS "assignment_audits_assignmentId_idx" ON "assignment_audits"("assignmentId")`,
    `CREATE INDEX IF NOT EXISTS "assignment_audits_tipo_createdAt_idx" ON "assignment_audits"("tipo", "createdAt")`,
  ];

  for (const indexSql of indexes) {
    try {
      await prisma.$executeRawUnsafe(indexSql);
    } catch (error: any) {
      if (!error.message?.includes('already exists')) {
        console.error(`❌ Erro ao criar índice: ${error.message}`);
      }
    }
  }

  console.log('✅ Índices criados com sucesso!\n');

  console.log('🔗 Criando foreign keys...');

  const foreignKeys = [
    `ALTER TABLE "organizational_units" DROP CONSTRAINT IF EXISTS "organizational_units_departmentId_fkey"`,
    `ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,

    `ALTER TABLE "organizational_units" DROP CONSTRAINT IF EXISTS "organizational_units_parentId_fkey"`,
    `ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE`,

    `ALTER TABLE "organizational_units" DROP CONSTRAINT IF EXISTS "organizational_units_responsavelId_fkey"`,
    `ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`,

    `ALTER TABLE "positions" DROP CONSTRAINT IF EXISTS "positions_departmentId_fkey"`,
    `ALTER TABLE "positions" ADD CONSTRAINT "positions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,

    `ALTER TABLE "positions" DROP CONSTRAINT IF EXISTS "positions_organizationalUnitId_fkey"`,
    `ALTER TABLE "positions" ADD CONSTRAINT "positions_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE`,

    `ALTER TABLE "functions" DROP CONSTRAINT IF EXISTS "functions_departmentId_fkey"`,
    `ALTER TABLE "functions" ADD CONSTRAINT "functions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,

    `ALTER TABLE "employee_assignments" DROP CONSTRAINT IF EXISTS "employee_assignments_userId_fkey"`,
    `ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,

    `ALTER TABLE "employee_assignments" DROP CONSTRAINT IF EXISTS "employee_assignments_departmentId_fkey"`,
    `ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,

    `ALTER TABLE "employee_assignments" DROP CONSTRAINT IF EXISTS "employee_assignments_organizationalUnitId_fkey"`,
    `ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE`,

    `ALTER TABLE "employee_assignments" DROP CONSTRAINT IF EXISTS "employee_assignments_positionId_fkey"`,
    `ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE`,

    `ALTER TABLE "employee_assignments" DROP CONSTRAINT IF EXISTS "employee_assignments_functionId_fkey"`,
    `ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "functions"("id") ON DELETE SET NULL ON UPDATE CASCADE`,

    `ALTER TABLE "employee_hierarchies" DROP CONSTRAINT IF EXISTS "employee_hierarchies_subordinadoId_fkey"`,
    `ALTER TABLE "employee_hierarchies" ADD CONSTRAINT "employee_hierarchies_subordinadoId_fkey" FOREIGN KEY ("subordinadoId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,

    `ALTER TABLE "employee_hierarchies" DROP CONSTRAINT IF EXISTS "employee_hierarchies_supervisorId_fkey"`,
    `ALTER TABLE "employee_hierarchies" ADD CONSTRAINT "employee_hierarchies_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,

    `ALTER TABLE "employee_hierarchies" DROP CONSTRAINT IF EXISTS "employee_hierarchies_organizationalUnitId_fkey"`,
    `ALTER TABLE "employee_hierarchies" ADD CONSTRAINT "employee_hierarchies_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE`,

    `ALTER TABLE "health_professional_data" DROP CONSTRAINT IF EXISTS "health_professional_data_userId_fkey"`,
    `ALTER TABLE "health_professional_data" ADD CONSTRAINT "health_professional_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,

    `ALTER TABLE "education_professional_data" DROP CONSTRAINT IF EXISTS "education_professional_data_userId_fkey"`,
    `ALTER TABLE "education_professional_data" ADD CONSTRAINT "education_professional_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,

    `ALTER TABLE "engineering_professional_data" DROP CONSTRAINT IF EXISTS "engineering_professional_data_userId_fkey"`,
    `ALTER TABLE "engineering_professional_data" ADD CONSTRAINT "engineering_professional_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,

    `ALTER TABLE "social_assistance_professional_data" DROP CONSTRAINT IF EXISTS "social_assistance_professional_data_userId_fkey"`,
    `ALTER TABLE "social_assistance_professional_data" ADD CONSTRAINT "social_assistance_professional_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,

    `ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "teams_departmentId_fkey"`,
    `ALTER TABLE "teams" ADD CONSTRAINT "teams_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,

    `ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "teams_organizationalUnitId_fkey"`,
    `ALTER TABLE "teams" ADD CONSTRAINT "teams_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE`,

    `ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "teams_coordenadorId_fkey"`,
    `ALTER TABLE "teams" ADD CONSTRAINT "teams_coordenadorId_fkey" FOREIGN KEY ("coordenadorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`,

    `ALTER TABLE "team_members" DROP CONSTRAINT IF EXISTS "team_members_teamId_fkey"`,
    `ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE`,

    `ALTER TABLE "team_members" DROP CONSTRAINT IF EXISTS "team_members_userId_fkey"`,
    `ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`,

    `ALTER TABLE "assignment_audits" DROP CONSTRAINT IF EXISTS "assignment_audits_assignmentId_fkey"`,
    `ALTER TABLE "assignment_audits" ADD CONSTRAINT "assignment_audits_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "employee_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  ];

  for (const fkSql of foreignKeys) {
    try {
      await prisma.$executeRawUnsafe(fkSql);
    } catch (error: any) {
      if (!error.message?.includes('already exists') && !error.message?.includes('does not exist')) {
        console.error(`❌ Erro ao criar FK: ${error.message}`);
      }
    }
  }

  console.log('✅ Foreign keys criadas com sucesso!\n');

  console.log('🎉 Sistema unificado de vinculação aplicado com sucesso!');
  console.log('\n📊 Tabelas criadas:');
  console.log('  ✅ organizational_units');
  console.log('  ✅ positions');
  console.log('  ✅ functions');
  console.log('  ✅ employee_assignments');
  console.log('  ✅ employee_hierarchies');
  console.log('  ✅ health_professional_data');
  console.log('  ✅ education_professional_data');
  console.log('  ✅ engineering_professional_data');
  console.log('  ✅ social_assistance_professional_data');
  console.log('  ✅ teams');
  console.log('  ✅ team_members');
  console.log('  ✅ assignment_audits\n');
}

applyUnifiedSystem()
  .then(() => {
    console.log('✅ Concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
