-- CreateEnum
CREATE TYPE "TipoUnidadeOrganizacional" AS ENUM ('SECRETARIA', 'DIRETORIA', 'COORDENADORIA', 'DIVISAO', 'SETOR', 'NUCLEO', 'GERENCIA', 'UNIDADE_ESPECIAL', 'DEPARTAMENTO', 'ASSESSORIA');

-- CreateEnum
CREATE TYPE "TipoCargo" AS ENUM ('EFETIVO', 'COMISSIONADO', 'TEMPORARIO', 'CONTRATADO', 'ESTAGIARIO', 'VOLUNTARIO');

-- CreateEnum
CREATE TYPE "NivelCargo" AS ENUM ('OPERACIONAL', 'TECNICO', 'ANALISTA', 'ESPECIALISTA', 'COORDENACAO', 'GERENCIA', 'DIRECAO', 'SECRETARIADO');

-- CreateEnum
CREATE TYPE "TipoFuncao" AS ENUM ('GRATIFICADA', 'COMISSIONADA', 'DESIGNACAO', 'REPRESENTACAO');

-- CreateEnum
CREATE TYPE "TipoVinculo" AS ENUM ('LOTACAO', 'CEDENCIA', 'REQUISICAO', 'REMOCAO', 'DISPOSICAO');

-- CreateEnum
CREATE TYPE "SituacaoVinculo" AS ENUM ('ATIVO', 'AFASTADO', 'LICENCA', 'SUSPENSO', 'CEDIDO', 'INATIVO');

-- CreateEnum
CREATE TYPE "TipoHierarquia" AS ENUM ('HIERARQUICO', 'FUNCIONAL', 'TECNICO', 'MATRICIAL');

-- CreateEnum
CREATE TYPE "TipoTeam" AS ENUM ('PERMANENTE', 'TEMPORARIA', 'PROJETO', 'GRUPO_TRABALHO', 'COMISSAO', 'CONSELHO');

-- CreateEnum
CREATE TYPE "TipoOperacaoVinculo" AS ENUM ('CRIACAO', 'ATIVACAO', 'DESATIVACAO', 'TRANSFERENCIA', 'REMOCAO', 'PROMOCAO', 'DESIGNACAO', 'EXONERACAO', 'ALTERACAO_CARGA_HORARIA', 'ALTERACAO_FUNCAO', 'AFASTAMENTO', 'RETORNO', 'CEDENCIA', 'REQUISICAO');

-- CreateTable
CREATE TABLE "organizational_units" (
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

-- CreateTable
CREATE TABLE "positions" (
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

-- CreateTable
CREATE TABLE "functions" (
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

-- CreateTable
CREATE TABLE "employee_assignments" (
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

-- CreateTable
CREATE TABLE "employee_hierarchies" (
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

-- CreateTable
CREATE TABLE "health_professional_data" (
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

-- CreateTable
CREATE TABLE "education_professional_data" (
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

-- CreateTable
CREATE TABLE "engineering_professional_data" (
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

-- CreateTable
CREATE TABLE "social_assistance_professional_data" (
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

-- CreateTable
CREATE TABLE "teams" (
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

-- CreateTable
CREATE TABLE "team_members" (
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

-- CreateTable
CREATE TABLE "assignment_audits" (
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

-- CreateIndex
CREATE UNIQUE INDEX "organizational_units_departmentId_sigla_key" ON "organizational_units"("departmentId", "sigla");

-- CreateIndex
CREATE INDEX "organizational_units_departmentId_tipo_isActive_idx" ON "organizational_units"("departmentId", "tipo", "isActive");

-- CreateIndex
CREATE INDEX "organizational_units_parentId_idx" ON "organizational_units"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "positions_departmentId_nome_key" ON "positions"("departmentId", "nome");

-- CreateIndex
CREATE INDEX "positions_departmentId_tipo_isActive_idx" ON "positions"("departmentId", "tipo", "isActive");

-- CreateIndex
CREATE INDEX "positions_organizationalUnitId_idx" ON "positions"("organizationalUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "functions_departmentId_simbolo_key" ON "functions"("departmentId", "simbolo");

-- CreateIndex
CREATE INDEX "functions_departmentId_tipo_isActive_idx" ON "functions"("departmentId", "tipo", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "employee_assignments_userId_organizationalUnitId_positionId_key" ON "employee_assignments"("userId", "organizationalUnitId", "positionId", "dataInicio");

-- CreateIndex
CREATE INDEX "employee_assignments_userId_isPrimary_situacao_idx" ON "employee_assignments"("userId", "isPrimary", "situacao");

-- CreateIndex
CREATE INDEX "employee_assignments_departmentId_situacao_idx" ON "employee_assignments"("departmentId", "situacao");

-- CreateIndex
CREATE INDEX "employee_assignments_organizationalUnitId_situacao_idx" ON "employee_assignments"("organizationalUnitId", "situacao");

-- CreateIndex
CREATE INDEX "employee_assignments_positionId_idx" ON "employee_assignments"("positionId");

-- CreateIndex
CREATE INDEX "employee_assignments_situacao_idx" ON "employee_assignments"("situacao");

-- CreateIndex
CREATE UNIQUE INDEX "employee_hierarchies_subordinadoId_supervisorId_tipo_dataIn_key" ON "employee_hierarchies"("subordinadoId", "supervisorId", "tipo", "dataInicio");

-- CreateIndex
CREATE INDEX "employee_hierarchies_subordinadoId_ativo_idx" ON "employee_hierarchies"("subordinadoId", "ativo");

-- CreateIndex
CREATE INDEX "employee_hierarchies_supervisorId_ativo_idx" ON "employee_hierarchies"("supervisorId", "ativo");

-- CreateIndex
CREATE INDEX "employee_hierarchies_organizationalUnitId_idx" ON "employee_hierarchies"("organizationalUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "health_professional_data_userId_key" ON "health_professional_data"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "health_professional_data_registroProfissional_key" ON "health_professional_data"("registroProfissional");

-- CreateIndex
CREATE UNIQUE INDEX "health_professional_data_cns_key" ON "health_professional_data"("cns");

-- CreateIndex
CREATE INDEX "health_professional_data_userId_idx" ON "health_professional_data"("userId");

-- CreateIndex
CREATE INDEX "health_professional_data_categoria_ativo_idx" ON "health_professional_data"("categoria", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "education_professional_data_userId_key" ON "education_professional_data"("userId");

-- CreateIndex
CREATE INDEX "education_professional_data_userId_idx" ON "education_professional_data"("userId");

-- CreateIndex
CREATE INDEX "education_professional_data_categoria_ativo_idx" ON "education_professional_data"("categoria", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "engineering_professional_data_userId_key" ON "engineering_professional_data"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "engineering_professional_data_registroProfissional_key" ON "engineering_professional_data"("registroProfissional");

-- CreateIndex
CREATE INDEX "engineering_professional_data_userId_idx" ON "engineering_professional_data"("userId");

-- CreateIndex
CREATE INDEX "engineering_professional_data_categoria_ativo_idx" ON "engineering_professional_data"("categoria", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "social_assistance_professional_data_userId_key" ON "social_assistance_professional_data"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "social_assistance_professional_data_registroProfissional_key" ON "social_assistance_professional_data"("registroProfissional");

-- CreateIndex
CREATE INDEX "social_assistance_professional_data_userId_idx" ON "social_assistance_professional_data"("userId");

-- CreateIndex
CREATE INDEX "social_assistance_professional_data_categoria_ativo_idx" ON "social_assistance_professional_data"("categoria", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "teams_departmentId_sigla_key" ON "teams"("departmentId", "sigla");

-- CreateIndex
CREATE INDEX "teams_departmentId_ativo_idx" ON "teams"("departmentId", "ativo");

-- CreateIndex
CREATE INDEX "teams_organizationalUnitId_idx" ON "teams"("organizationalUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_teamId_userId_dataInicio_key" ON "team_members"("teamId", "userId", "dataInicio");

-- CreateIndex
CREATE INDEX "team_members_userId_ativo_idx" ON "team_members"("userId", "ativo");

-- CreateIndex
CREATE INDEX "team_members_teamId_ativo_idx" ON "team_members"("teamId", "ativo");

-- CreateIndex
CREATE INDEX "assignment_audits_userId_tipo_createdAt_idx" ON "assignment_audits"("userId", "tipo", "createdAt");

-- CreateIndex
CREATE INDEX "assignment_audits_assignmentId_idx" ON "assignment_audits"("assignmentId");

-- CreateIndex
CREATE INDEX "assignment_audits_tipo_createdAt_idx" ON "assignment_audits"("tipo", "createdAt");

-- AddForeignKey
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positions" ADD CONSTRAINT "positions_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "functions" ADD CONSTRAINT "functions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "functions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_hierarchies" ADD CONSTRAINT "employee_hierarchies_subordinadoId_fkey" FOREIGN KEY ("subordinadoId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_hierarchies" ADD CONSTRAINT "employee_hierarchies_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_hierarchies" ADD CONSTRAINT "employee_hierarchies_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "health_professional_data" ADD CONSTRAINT "health_professional_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "education_professional_data" ADD CONSTRAINT "education_professional_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engineering_professional_data" ADD CONSTRAINT "engineering_professional_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_assistance_professional_data" ADD CONSTRAINT "social_assistance_professional_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_coordenadorId_fkey" FOREIGN KEY ("coordenadorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_audits" ADD CONSTRAINT "assignment_audits_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "employee_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
