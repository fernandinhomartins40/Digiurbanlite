-- Processo interno (memorando, ofício interno, requisição, parecer, processo
-- administrativo) tramitando entre unidades do organograma. Substitui o
-- serviço separado digiurban-flow, que nunca foi para produção.
CREATE TABLE IF NOT EXISTS "internal_process_types" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "name" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "description" TEXT,
  "defaultDays" INTEGER NOT NULL DEFAULT 5,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "internal_process_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "internal_process_types_tenantId_prefix_key" ON "internal_process_types"("tenantId", "prefix");
CREATE INDEX IF NOT EXISTS "internal_process_types_tenantId_idx" ON "internal_process_types"("tenantId");

CREATE TABLE IF NOT EXISTS "internal_process_sequences" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "prefix" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "last" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "internal_process_sequences_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "internal_process_sequences_tenantId_prefix_year_key" ON "internal_process_sequences"("tenantId", "prefix", "year");

CREATE TABLE IF NOT EXISTS "internal_processes" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "number" TEXT NOT NULL,
  "typeId" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "confidential" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'ABERTO',
  "originUnitId" TEXT NOT NULL,
  "originUnitName" TEXT NOT NULL,
  "originDepartmentId" TEXT,
  "currentUnitId" TEXT NOT NULL,
  "currentUnitName" TEXT NOT NULL,
  "currentDepartmentId" TEXT,
  "currentUserId" TEXT,
  "currentUserName" TEXT,
  "createdById" TEXT NOT NULL,
  "createdByName" TEXT NOT NULL,
  "protocolId" TEXT,
  "parentId" TEXT,
  "dueAt" TIMESTAMP(3),
  "concludedAt" TIMESTAMP(3),
  "conclusion" TEXT,
  "summary" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "internal_processes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "internal_processes_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "internal_process_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "internal_processes_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "internal_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "internal_processes_tenantId_number_key" ON "internal_processes"("tenantId", "number");
CREATE INDEX IF NOT EXISTS "internal_processes_tenantId_idx" ON "internal_processes"("tenantId");
CREATE INDEX IF NOT EXISTS "internal_processes_currentUnitId_status_idx" ON "internal_processes"("currentUnitId", "status");
CREATE INDEX IF NOT EXISTS "internal_processes_originUnitId_idx" ON "internal_processes"("originUnitId");
CREATE INDEX IF NOT EXISTS "internal_processes_currentUserId_idx" ON "internal_processes"("currentUserId");
CREATE INDEX IF NOT EXISTS "internal_processes_protocolId_idx" ON "internal_processes"("protocolId");
CREATE INDEX IF NOT EXISTS "internal_processes_parentId_idx" ON "internal_processes"("parentId");

CREATE TABLE IF NOT EXISTS "internal_process_movements" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT,
  "processId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "note" TEXT,
  "fromUnitId" TEXT,
  "fromUnitName" TEXT,
  "toUnitId" TEXT,
  "toUnitName" TEXT,
  "toUserId" TEXT,
  "toUserName" TEXT,
  "userId" TEXT NOT NULL,
  "userName" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "internal_process_movements_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "internal_process_movements_processId_fkey" FOREIGN KEY ("processId") REFERENCES "internal_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "internal_process_movements_processId_createdAt_idx" ON "internal_process_movements"("processId", "createdAt");
CREATE INDEX IF NOT EXISTS "internal_process_movements_tenantId_idx" ON "internal_process_movements"("tenantId");
CREATE INDEX IF NOT EXISTS "internal_process_movements_toUnitId_readAt_idx" ON "internal_process_movements"("toUnitId", "readAt");
