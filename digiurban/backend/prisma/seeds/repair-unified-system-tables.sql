-- =============================================
-- REPAIR: Criar tabelas do Sistema Unificado
-- As migrations foram marcadas como aplicadas mas
-- as tabelas nunca foram criadas no banco.
-- =============================================

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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    CONSTRAINT "employee_hierarchies_pkey" PRIMARY KEY ("id")
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

-- CreateTable protocol_server_assignments
CREATE TABLE IF NOT EXISTS "protocol_server_assignments" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "TipoAtribuicaoProtocolo" NOT NULL,
    "situacao" "SituacaoAtribuicao" NOT NULL DEFAULT 'ATIVA',
    "assignedById" TEXT,
    "assignedByName" TEXT,
    "motivo" TEXT,
    "prioridade" INTEGER,
    "percentualCarga" INTEGER,
    "prazoResposta" TIMESTAMP(3),
    "isDelegacao" BOOLEAN NOT NULL DEFAULT false,
    "delegadoPor" TEXT,
    "ativaAte" TIMESTAMP(3),
    "motivoDelegacao" TEXT,
    "departmentOrigemId" TEXT,
    "departmentOrigemName" TEXT,
    "departmentDestinoId" TEXT,
    "departmentDestinoName" TEXT,
    "isInterdepartamental" BOOLEAN NOT NULL DEFAULT false,
    "employeeAssignmentId" TEXT,
    "organizationalUnitId" TEXT,
    "comentario" TEXT,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "lidoEm" TIMESTAMP(3),
    "respondeEm" TIMESTAMP(3),
    "respostaTexto" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "protocol_server_assignments_pkey" PRIMARY KEY ("id")
);

-- =============================================
-- INDEXES (com IF NOT EXISTS via DO blocks)
-- =============================================

-- organizational_units indexes
CREATE UNIQUE INDEX IF NOT EXISTS "organizational_units_departmentId_sigla_key" ON "organizational_units"("departmentId", "sigla");
CREATE INDEX IF NOT EXISTS "organizational_units_departmentId_tipo_isActive_idx" ON "organizational_units"("departmentId", "tipo", "isActive");
CREATE INDEX IF NOT EXISTS "organizational_units_parentId_idx" ON "organizational_units"("parentId");

-- positions indexes
CREATE UNIQUE INDEX IF NOT EXISTS "positions_departmentId_nome_key" ON "positions"("departmentId", "nome");
CREATE INDEX IF NOT EXISTS "positions_departmentId_tipo_isActive_idx" ON "positions"("departmentId", "tipo", "isActive");
CREATE INDEX IF NOT EXISTS "positions_organizationalUnitId_idx" ON "positions"("organizationalUnitId");

-- functions indexes
CREATE UNIQUE INDEX IF NOT EXISTS "functions_departmentId_simbolo_key" ON "functions"("departmentId", "simbolo");
CREATE INDEX IF NOT EXISTS "functions_departmentId_tipo_isActive_idx" ON "functions"("departmentId", "tipo", "isActive");

-- employee_assignments indexes
CREATE UNIQUE INDEX IF NOT EXISTS "employee_assignments_userId_organizationalUnitId_positionId_key" ON "employee_assignments"("userId", "organizationalUnitId", "positionId", "dataInicio");
CREATE INDEX IF NOT EXISTS "employee_assignments_userId_isPrimary_situacao_idx" ON "employee_assignments"("userId", "isPrimary", "situacao");
CREATE INDEX IF NOT EXISTS "employee_assignments_departmentId_situacao_idx" ON "employee_assignments"("departmentId", "situacao");
CREATE INDEX IF NOT EXISTS "employee_assignments_organizationalUnitId_situacao_idx" ON "employee_assignments"("organizationalUnitId", "situacao");
CREATE INDEX IF NOT EXISTS "employee_assignments_positionId_idx" ON "employee_assignments"("positionId");
CREATE INDEX IF NOT EXISTS "employee_assignments_situacao_idx" ON "employee_assignments"("situacao");

-- employee_hierarchies indexes
CREATE UNIQUE INDEX IF NOT EXISTS "employee_hierarchies_subordinadoId_supervisorId_tipo_dataIn_key" ON "employee_hierarchies"("subordinadoId", "supervisorId", "tipo", "dataInicio");
CREATE INDEX IF NOT EXISTS "employee_hierarchies_subordinadoId_ativo_idx" ON "employee_hierarchies"("subordinadoId", "ativo");
CREATE INDEX IF NOT EXISTS "employee_hierarchies_supervisorId_ativo_idx" ON "employee_hierarchies"("supervisorId", "ativo");
CREATE INDEX IF NOT EXISTS "employee_hierarchies_organizationalUnitId_idx" ON "employee_hierarchies"("organizationalUnitId");

-- teams indexes
CREATE UNIQUE INDEX IF NOT EXISTS "teams_departmentId_sigla_key" ON "teams"("departmentId", "sigla");
CREATE INDEX IF NOT EXISTS "teams_departmentId_ativo_idx" ON "teams"("departmentId", "ativo");
CREATE INDEX IF NOT EXISTS "teams_organizationalUnitId_idx" ON "teams"("organizationalUnitId");

-- team_members indexes
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_teamId_userId_dataInicio_key" ON "team_members"("teamId", "userId", "dataInicio");
CREATE INDEX IF NOT EXISTS "team_members_userId_ativo_idx" ON "team_members"("userId", "ativo");
CREATE INDEX IF NOT EXISTS "team_members_teamId_ativo_idx" ON "team_members"("teamId", "ativo");

-- assignment_audits indexes
CREATE INDEX IF NOT EXISTS "assignment_audits_userId_tipo_createdAt_idx" ON "assignment_audits"("userId", "tipo", "createdAt");
CREATE INDEX IF NOT EXISTS "assignment_audits_assignmentId_idx" ON "assignment_audits"("assignmentId");
CREATE INDEX IF NOT EXISTS "assignment_audits_tipo_createdAt_idx" ON "assignment_audits"("tipo", "createdAt");

-- protocol_server_assignments indexes
CREATE INDEX IF NOT EXISTS "protocol_server_assignments_protocolId_situacao_idx" ON "protocol_server_assignments"("protocolId", "situacao");
CREATE INDEX IF NOT EXISTS "protocol_server_assignments_userId_situacao_idx" ON "protocol_server_assignments"("userId", "situacao");
CREATE INDEX IF NOT EXISTS "protocol_server_assignments_tipo_situacao_idx" ON "protocol_server_assignments"("tipo", "situacao");
CREATE INDEX IF NOT EXISTS "protocol_server_assignments_isDelegacao_ativaAte_idx" ON "protocol_server_assignments"("isDelegacao", "ativaAte");
CREATE INDEX IF NOT EXISTS "protocol_server_assignments_employeeAssignmentId_idx" ON "protocol_server_assignments"("employeeAssignmentId");
CREATE INDEX IF NOT EXISTS "protocol_server_assignments_organizationalUnitId_idx" ON "protocol_server_assignments"("organizationalUnitId");

-- =============================================
-- FOREIGN KEYS
-- =============================================

-- organizational_units FKs
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "organizational_units" ADD CONSTRAINT "organizational_units_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- positions FKs
ALTER TABLE "positions" ADD CONSTRAINT "positions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "positions" ADD CONSTRAINT "positions_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- functions FKs
ALTER TABLE "functions" ADD CONSTRAINT "functions_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- employee_assignments FKs
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "employee_assignments" ADD CONSTRAINT "employee_assignments_functionId_fkey" FOREIGN KEY ("functionId") REFERENCES "functions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- employee_hierarchies FKs
ALTER TABLE "employee_hierarchies" ADD CONSTRAINT "employee_hierarchies_subordinadoId_fkey" FOREIGN KEY ("subordinadoId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_hierarchies" ADD CONSTRAINT "employee_hierarchies_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "employee_hierarchies" ADD CONSTRAINT "employee_hierarchies_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- teams FKs
ALTER TABLE "teams" ADD CONSTRAINT "teams_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "teams" ADD CONSTRAINT "teams_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "teams" ADD CONSTRAINT "teams_coordenadorId_fkey" FOREIGN KEY ("coordenadorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- team_members FKs
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- assignment_audits FKs
ALTER TABLE "assignment_audits" ADD CONSTRAINT "assignment_audits_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "employee_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- protocol_server_assignments FKs
ALTER TABLE "protocol_server_assignments" ADD CONSTRAINT "protocol_server_assignments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "protocol_server_assignments" ADD CONSTRAINT "protocol_server_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "protocol_server_assignments" ADD CONSTRAINT "protocol_server_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "protocol_server_assignments" ADD CONSTRAINT "protocol_server_assignments_employeeAssignmentId_fkey" FOREIGN KEY ("employeeAssignmentId") REFERENCES "employee_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "protocol_server_assignments" ADD CONSTRAINT "protocol_server_assignments_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================
-- COLUNAS FK FALTANTES em tabelas existentes
-- =============================================

-- protocols_simplified: adicionar colunas para sistema unificado
ALTER TABLE "protocols_simplified" ADD COLUMN IF NOT EXISTS "currentAssignedUserId" TEXT;
ALTER TABLE "protocols_simplified" ADD COLUMN IF NOT EXISTS "organizationalUnitId" TEXT;
ALTER TABLE "protocols_simplified" ADD COLUMN IF NOT EXISTS "teamId" TEXT;

-- FKs para protocols_simplified (com DO block para ignorar se já existem)
DO $$ BEGIN
  ALTER TABLE "protocols_simplified" ADD CONSTRAINT "protocols_simplified_currentAssignedUserId_fkey" FOREIGN KEY ("currentAssignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "protocols_simplified" ADD CONSTRAINT "protocols_simplified_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "protocols_simplified" ADD CONSTRAINT "protocols_simplified_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
