-- CreateTable
CREATE TABLE "module_workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stages" JSONB NOT NULL,
    "defaultSLA" INTEGER,
    "rules" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "protocol_stages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "stageOrder" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "dueDate" DATETIME,
    "assignedTo" TEXT,
    "completedBy" TEXT,
    "result" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    CONSTRAINT "protocol_stages_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "protocol_sla" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "expectedEndDate" DATETIME NOT NULL,
    "actualEndDate" DATETIME,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "pausedAt" DATETIME,
    "pausedReason" TEXT,
    "totalPausedDays" INTEGER NOT NULL DEFAULT 0,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "daysOverdue" INTEGER NOT NULL DEFAULT 0,
    "workingDays" INTEGER NOT NULL,
    "calendarDays" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "protocol_sla_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "module_workflows_moduleType_key" ON "module_workflows"("moduleType");

-- CreateIndex
CREATE INDEX "protocol_stages_protocolId_stageOrder_idx" ON "protocol_stages"("protocolId", "stageOrder");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_sla_protocolId_key" ON "protocol_sla"("protocolId");
