-- CreateTable
CREATE TABLE IF NOT EXISTS "flow_definitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "municipioId" TEXT,
    "nodes" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "flow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "flow_executions" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "conversationId" TEXT,
    "currentNodeId" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "history" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "flow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "flow_definitions_name_key" ON "flow_definitions"("name");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "flow_definitions_isActive_isDefault_idx" ON "flow_definitions"("isActive", "isDefault");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "flow_executions_citizenId_status_idx" ON "flow_executions"("citizenId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "flow_executions_flowId_idx" ON "flow_executions"("flowId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "flow_executions_conversationId_idx" ON "flow_executions"("conversationId");

-- AddForeignKey
ALTER TABLE "flow_executions" ADD CONSTRAINT "flow_executions_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_executions" ADD CONSTRAINT "flow_executions_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "flow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
