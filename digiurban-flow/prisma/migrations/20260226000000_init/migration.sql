-- ============================================================================
-- DigiUrban Flow — Migration Inicial
-- Cria todas as tabelas e enums do módulo de processos internos.
-- USA CREATE ... IF NOT EXISTS para ser idempotente e seguro em DB compartilhado.
-- ============================================================================

-- ============================================================================
-- ENUMS (só cria se não existirem)
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "ProcessStatus" AS ENUM (
    'RASCUNHO',
    'ABERTO',
    'EM_TRAMITACAO',
    'PENDENTE',
    'CONCLUIDO',
    'ARQUIVADO',
    'CANCELADO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SigiloLevel" AS ENUM (
    'PUBLICO',
    'RESTRITO',
    'CONFIDENCIAL'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DispatchAction" AS ENUM (
    'ENCAMINHADO',
    'DEVOLVIDO',
    'REDISTRIBUIDO',
    'PARECER',
    'DESPACHO',
    'ASSINATURA',
    'ARQUIVAMENTO',
    'CONCLUSAO',
    'CANCELAMENTO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StepStatus" AS ENUM (
    'PENDENTE',
    'EM_ANDAMENTO',
    'CONCLUIDO',
    'PULADO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "WorkflowStatus" AS ENUM (
    'ATIVO',
    'CONCLUIDO',
    'CANCELADO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SignatureStatus" AS ENUM (
    'PENDENTE',
    'ASSINADO',
    'REJEITADO',
    'EXPIRADO'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABELAS
-- ============================================================================

-- Templates de Workflow (antes de flow_process_types por dependência FK)
CREATE TABLE IF NOT EXISTS "flow_workflow_templates" (
  "id"          TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "description" TEXT,
  "version"     INTEGER NOT NULL DEFAULT 1,
  "isActive"    BOOLEAN NOT NULL DEFAULT true,
  "steps"       JSONB NOT NULL DEFAULT '[]',
  "transitions" JSONB NOT NULL DEFAULT '[]',
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flow_workflow_templates_pkey" PRIMARY KEY ("id")
);

-- Tipos de Processo
CREATE TABLE IF NOT EXISTS "flow_process_types" (
  "id"                        TEXT NOT NULL,
  "name"                      TEXT NOT NULL,
  "prefix"                    TEXT NOT NULL,
  "description"               TEXT,
  "defaultSlaHours"           INTEGER NOT NULL DEFAULT 168,
  "sigiloDefault"             "SigiloLevel" NOT NULL DEFAULT 'PUBLICO',
  "isActive"                  BOOLEAN NOT NULL DEFAULT true,
  "defaultDocumentTemplate"   TEXT,
  "defaultWorkflowTemplateId" TEXT,
  "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flow_process_types_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "flow_process_types_defaultWorkflowTemplateId_fkey"
    FOREIGN KEY ("defaultWorkflowTemplateId")
    REFERENCES "flow_workflow_templates"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "flow_process_types_prefix_key"
  ON "flow_process_types"("prefix");

-- Sequências de Numeração (thread-safe)
CREATE TABLE IF NOT EXISTS "flow_number_sequences" (
  "id"             TEXT NOT NULL,
  "prefix"         TEXT NOT NULL,
  "year"           INTEGER NOT NULL,
  "lastSequential" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "flow_number_sequences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "flow_number_sequences_prefix_year_key"
  ON "flow_number_sequences"("prefix", "year");

-- Processos Internos
CREATE TABLE IF NOT EXISTS "flow_processes" (
  "id"                TEXT NOT NULL,
  "number"            TEXT NOT NULL,
  "typeId"            TEXT NOT NULL,
  "subject"           TEXT NOT NULL,
  "description"       TEXT,
  "bodyContent"       TEXT,
  "sigilo"            "SigiloLevel" NOT NULL DEFAULT 'PUBLICO',
  "status"            "ProcessStatus" NOT NULL DEFAULT 'ABERTO',
  "priority"          INTEGER NOT NULL DEFAULT 0,
  "originSectorId"    TEXT NOT NULL,
  "originSectorName"  TEXT NOT NULL,
  "currentSectorId"   TEXT NOT NULL,
  "currentSectorName" TEXT NOT NULL,
  "createdById"       TEXT NOT NULL,
  "createdByName"     TEXT NOT NULL,
  "currentUserId"     TEXT,
  "currentUserName"   TEXT,
  "citizenProtocolId" TEXT,
  "dueAt"             TIMESTAMP(3),
  "concludedAt"       TIMESTAMP(3),
  "archivedAt"        TIMESTAMP(3),
  "metadata"          JSONB,
  "tags"              TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flow_processes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "flow_processes_typeId_fkey"
    FOREIGN KEY ("typeId")
    REFERENCES "flow_process_types"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "flow_processes_number_key"
  ON "flow_processes"("number");
CREATE INDEX IF NOT EXISTS "flow_processes_status_idx"
  ON "flow_processes"("status");
CREATE INDEX IF NOT EXISTS "flow_processes_currentSectorId_idx"
  ON "flow_processes"("currentSectorId");
CREATE INDEX IF NOT EXISTS "flow_processes_currentUserId_idx"
  ON "flow_processes"("currentUserId");
CREATE INDEX IF NOT EXISTS "flow_processes_typeId_idx"
  ON "flow_processes"("typeId");
CREATE INDEX IF NOT EXISTS "flow_processes_citizenProtocolId_idx"
  ON "flow_processes"("citizenProtocolId");
CREATE INDEX IF NOT EXISTS "flow_processes_createdAt_idx"
  ON "flow_processes"("createdAt");

-- Comentários / Anotações
CREATE TABLE IF NOT EXISTS "flow_comments" (
  "id"         TEXT NOT NULL,
  "processId"  TEXT NOT NULL,
  "userId"     TEXT NOT NULL,
  "userName"   TEXT NOT NULL,
  "content"    TEXT NOT NULL,
  "isInternal" BOOLEAN NOT NULL DEFAULT true,
  "editedAt"   TIMESTAMP(3),
  "isDeleted"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flow_comments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "flow_comments_processId_fkey"
    FOREIGN KEY ("processId")
    REFERENCES "flow_processes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "flow_comments_processId_idx"
  ON "flow_comments"("processId");
CREATE INDEX IF NOT EXISTS "flow_comments_createdAt_idx"
  ON "flow_comments"("createdAt");

-- Assinaturas Digitais
CREATE TABLE IF NOT EXISTS "flow_signatures" (
  "id"              TEXT NOT NULL,
  "processId"       TEXT NOT NULL,
  "documentId"      TEXT,
  "requestedById"   TEXT NOT NULL,
  "requestedByName" TEXT NOT NULL,
  "signerId"        TEXT,
  "signerName"      TEXT,
  "signerEmail"     TEXT,
  "status"          "SignatureStatus" NOT NULL DEFAULT 'PENDENTE',
  "signedAt"        TIMESTAMP(3),
  "rejectedAt"      TIMESTAMP(3),
  "rejectionReason" TEXT,
  "expiresAt"       TIMESTAMP(3),
  "documentHash"    TEXT,
  "signatureHash"   TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flow_signatures_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "flow_signatures_processId_fkey"
    FOREIGN KEY ("processId")
    REFERENCES "flow_processes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "flow_signatures_processId_idx"
  ON "flow_signatures"("processId");
CREATE INDEX IF NOT EXISTS "flow_signatures_status_idx"
  ON "flow_signatures"("status");
CREATE INDEX IF NOT EXISTS "flow_signatures_signerId_idx"
  ON "flow_signatures"("signerId");

-- Histórico de Movimentações
CREATE TABLE IF NOT EXISTS "flow_process_history" (
  "id"             TEXT NOT NULL,
  "processId"      TEXT NOT NULL,
  "action"         "DispatchAction" NOT NULL,
  "description"    TEXT NOT NULL,
  "note"           TEXT,
  "fromSectorId"   TEXT,
  "fromSectorName" TEXT,
  "toSectorId"     TEXT,
  "toSectorName"   TEXT,
  "userId"         TEXT NOT NULL,
  "userName"       TEXT NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flow_process_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "flow_process_history_processId_fkey"
    FOREIGN KEY ("processId")
    REFERENCES "flow_processes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "flow_process_history_processId_idx"
  ON "flow_process_history"("processId");
CREATE INDEX IF NOT EXISTS "flow_process_history_createdAt_idx"
  ON "flow_process_history"("createdAt");

-- Despachos / Tramitação
CREATE TABLE IF NOT EXISTS "flow_dispatches" (
  "id"             TEXT NOT NULL,
  "processId"      TEXT NOT NULL,
  "action"         "DispatchAction" NOT NULL,
  "fromSectorId"   TEXT NOT NULL,
  "fromSectorName" TEXT NOT NULL,
  "toSectorId"     TEXT NOT NULL,
  "toSectorName"   TEXT NOT NULL,
  "fromUserId"     TEXT NOT NULL,
  "fromUserName"   TEXT NOT NULL,
  "toUserId"       TEXT,
  "toUserName"     TEXT,
  "note"           TEXT,
  "isRead"         BOOLEAN NOT NULL DEFAULT false,
  "readAt"         TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flow_dispatches_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "flow_dispatches_processId_fkey"
    FOREIGN KEY ("processId")
    REFERENCES "flow_processes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "flow_dispatches_processId_idx"
  ON "flow_dispatches"("processId");
CREATE INDEX IF NOT EXISTS "flow_dispatches_toSectorId_idx"
  ON "flow_dispatches"("toSectorId");
CREATE INDEX IF NOT EXISTS "flow_dispatches_isRead_idx"
  ON "flow_dispatches"("isRead");

-- Documentos do Processo
CREATE TABLE IF NOT EXISTS "flow_documents" (
  "id"               TEXT NOT NULL,
  "processId"        TEXT NOT NULL,
  "documentType"     TEXT NOT NULL,
  "name"             TEXT NOT NULL,
  "description"      TEXT,
  "fileName"         TEXT NOT NULL,
  "filePath"         TEXT NOT NULL,
  "fileSize"         INTEGER NOT NULL,
  "mimeType"         TEXT NOT NULL,
  "isGenerated"      BOOLEAN NOT NULL DEFAULT false,
  "templateUsed"     TEXT,
  "generatedBy"      TEXT,
  "documentHash"     TEXT,
  "isSigned"         BOOLEAN NOT NULL DEFAULT false,
  "signedAt"         TIMESTAMP(3),
  "signedById"       TEXT,
  "version"          INTEGER NOT NULL DEFAULT 1,
  "parentDocumentId" TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flow_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "flow_documents_processId_fkey"
    FOREIGN KEY ("processId")
    REFERENCES "flow_processes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "flow_documents_processId_idx"
  ON "flow_documents"("processId");
CREATE INDEX IF NOT EXISTS "flow_documents_documentType_idx"
  ON "flow_documents"("documentType");

-- Instâncias de Workflow (por processo)
CREATE TABLE IF NOT EXISTS "flow_workflow_instances" (
  "id"              TEXT NOT NULL,
  "processId"       TEXT NOT NULL,
  "templateId"      TEXT NOT NULL,
  "currentStepId"   TEXT NOT NULL,
  "currentStepName" TEXT NOT NULL,
  "status"          "WorkflowStatus" NOT NULL DEFAULT 'ATIVO',
  "startedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt"     TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "flow_workflow_instances_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "flow_workflow_instances_processId_fkey"
    FOREIGN KEY ("processId")
    REFERENCES "flow_processes"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "flow_workflow_instances_templateId_fkey"
    FOREIGN KEY ("templateId")
    REFERENCES "flow_workflow_templates"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "flow_workflow_instances_processId_key"
  ON "flow_workflow_instances"("processId");
CREATE INDEX IF NOT EXISTS "flow_workflow_instances_status_idx"
  ON "flow_workflow_instances"("status");

-- Histórico de Etapas do Workflow
CREATE TABLE IF NOT EXISTS "flow_workflow_step_history" (
  "id"          TEXT NOT NULL,
  "instanceId"  TEXT NOT NULL,
  "stepId"      TEXT NOT NULL,
  "stepName"    TEXT NOT NULL,
  "action"      TEXT NOT NULL,
  "note"        TEXT,
  "userId"      TEXT NOT NULL,
  "userName"    TEXT NOT NULL,
  "enteredAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "flow_workflow_step_history_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "flow_workflow_step_history_instanceId_fkey"
    FOREIGN KEY ("instanceId")
    REFERENCES "flow_workflow_instances"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "flow_workflow_step_history_instanceId_idx"
  ON "flow_workflow_step_history"("instanceId");

-- ============================================================================
-- SEED INICIAL: Tipos de Processo padrão
-- ============================================================================

INSERT INTO "flow_process_types" ("id", "name", "prefix", "description", "defaultSlaHours", "sigiloDefault", "isActive", "defaultDocumentTemplate", "createdAt", "updatedAt")
VALUES
  ('cltype_mem001', 'Memorando',                  'MEM', 'Comunicação interna entre setores',                     72,  'PUBLICO',      true, 'memorando',  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cltype_ofi002', 'Ofício',                     'OFI', 'Comunicação oficial com entidades externas',            120, 'PUBLICO',      true, 'oficio',     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cltype_pad003', 'Processo Administrativo',    'PAD', 'Processo administrativo formal com múltiplos tramites', 720, 'RESTRITO',     true, 'despacho',   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cltype_req004', 'Requerimento Interno',       'REQ', 'Requerimento de servidor ou setor',                     48,  'PUBLICO',      true, 'memorando',  CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cltype_ctr005', 'Contrato / Convênio',        'CTR', 'Contratos e convênios administrativos',                 240, 'CONFIDENCIAL', true, NULL,         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('cltype_par006', 'Parecer Jurídico',           'PAR', 'Pareceres e opiniões jurídicas',                        168, 'RESTRITO',     true, NULL,         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("prefix") DO NOTHING;
