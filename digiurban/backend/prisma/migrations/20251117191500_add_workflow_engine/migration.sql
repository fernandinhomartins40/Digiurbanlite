-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ERROR');

-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stages" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "citizenId" TEXT,
    "currentStage" TEXT NOT NULL,
    "status" "WorkflowStatus" NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_history" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "notes" TEXT,
    "attachments" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER,

    CONSTRAINT "workflow_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_definitions_module_isActive_idx" ON "workflow_definitions"("module", "isActive");

-- CreateIndex
CREATE INDEX "workflow_definitions_isActive_idx" ON "workflow_definitions"("isActive");

-- CreateIndex
CREATE INDEX "workflow_instances_entityType_entityId_idx" ON "workflow_instances"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "workflow_instances_citizenId_idx" ON "workflow_instances"("citizenId");

-- CreateIndex
CREATE INDEX "workflow_instances_currentStage_status_idx" ON "workflow_instances"("currentStage", "status");

-- CreateIndex
CREATE INDEX "workflow_instances_definitionId_status_idx" ON "workflow_instances"("definitionId", "status");

-- CreateIndex
CREATE INDEX "workflow_instances_status_priority_idx" ON "workflow_instances"("status", "priority");

-- CreateIndex
CREATE INDEX "workflow_history_instanceId_idx" ON "workflow_history"("instanceId");

-- CreateIndex
CREATE INDEX "workflow_history_timestamp_idx" ON "workflow_history"("timestamp");

-- CreateIndex
CREATE INDEX "workflow_history_userId_idx" ON "workflow_history"("userId");

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "workflow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;
