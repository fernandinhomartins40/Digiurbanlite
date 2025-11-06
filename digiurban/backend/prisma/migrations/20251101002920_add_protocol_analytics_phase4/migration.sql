-- CreateTable
CREATE TABLE "protocol_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodDate" DATETIME NOT NULL,
    "totalProtocols" INTEGER NOT NULL DEFAULT 0,
    "newProtocols" INTEGER NOT NULL DEFAULT 0,
    "closedProtocols" INTEGER NOT NULL DEFAULT 0,
    "cancelledProtocols" INTEGER NOT NULL DEFAULT 0,
    "overdueProtocols" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionTime" REAL,
    "avgFirstResponse" REAL,
    "avgResolutionTime" REAL,
    "approvalRate" REAL,
    "rejectionRate" REAL,
    "satisfactionScore" REAL,
    "slaComplianceRate" REAL,
    "avgSlaDeviation" REAL,
    "totalPendings" INTEGER NOT NULL DEFAULT 0,
    "resolvedPendings" INTEGER NOT NULL DEFAULT 0,
    "avgPendingTime" REAL,
    "totalDocuments" INTEGER NOT NULL DEFAULT 0,
    "approvedDocuments" INTEGER NOT NULL DEFAULT 0,
    "rejectedDocuments" INTEGER NOT NULL DEFAULT 0,
    "documentApprovalRate" REAL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "department_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodDate" DATETIME NOT NULL,
    "totalProtocols" INTEGER NOT NULL DEFAULT 0,
    "activeProtocols" INTEGER NOT NULL DEFAULT 0,
    "completedProtocols" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionTime" REAL,
    "slaComplianceRate" REAL,
    "satisfactionScore" REAL,
    "protocolsPerServer" REAL,
    "avgWorkload" REAL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "service_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodDate" DATETIME NOT NULL,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "completedRequests" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionTime" REAL,
    "approvalRate" REAL,
    "rejectionRate" REAL,
    "satisfactionScore" REAL,
    "complaintRate" REAL,
    "avgDocumentTime" REAL,
    "avgPendingTime" REAL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "server_performance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodDate" DATETIME NOT NULL,
    "protocolsAssigned" INTEGER NOT NULL DEFAULT 0,
    "protocolsCompleted" INTEGER NOT NULL DEFAULT 0,
    "protocolsOnTime" INTEGER NOT NULL DEFAULT 0,
    "protocolsOverdue" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionTime" REAL,
    "avgResponseTime" REAL,
    "totalWorkingHours" REAL,
    "satisfactionScore" REAL,
    "approvalRate" REAL,
    "pendingResolution" REAL,
    "totalInteractions" INTEGER NOT NULL DEFAULT 0,
    "avgInteractionsPerProtocol" REAL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "protocol_bottlenecks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "bottleneckType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodDate" DATETIME NOT NULL,
    "affectedProtocols" INTEGER NOT NULL DEFAULT 0,
    "avgStuckTime" REAL NOT NULL,
    "maxStuckTime" REAL NOT NULL,
    "totalDelayHours" REAL NOT NULL,
    "impactScore" REAL NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "protocol_metrics_tenantId_periodType_periodDate_idx" ON "protocol_metrics"("tenantId", "periodType", "periodDate");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_metrics_tenantId_periodType_periodDate_key" ON "protocol_metrics"("tenantId", "periodType", "periodDate");

-- CreateIndex
CREATE INDEX "department_metrics_tenantId_departmentId_periodType_idx" ON "department_metrics"("tenantId", "departmentId", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "department_metrics_tenantId_departmentId_periodType_periodDate_key" ON "department_metrics"("tenantId", "departmentId", "periodType", "periodDate");

-- CreateIndex
CREATE INDEX "service_metrics_tenantId_serviceId_periodType_idx" ON "service_metrics"("tenantId", "serviceId", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "service_metrics_tenantId_serviceId_periodType_periodDate_key" ON "service_metrics"("tenantId", "serviceId", "periodType", "periodDate");

-- CreateIndex
CREATE INDEX "server_performance_tenantId_userId_periodType_idx" ON "server_performance"("tenantId", "userId", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "server_performance_tenantId_userId_periodType_periodDate_key" ON "server_performance"("tenantId", "userId", "periodType", "periodDate");

-- CreateIndex
CREATE INDEX "protocol_bottlenecks_tenantId_periodType_impactScore_idx" ON "protocol_bottlenecks"("tenantId", "periodType", "impactScore");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_bottlenecks_tenantId_bottleneckType_entityId_periodType_periodDate_key" ON "protocol_bottlenecks"("tenantId", "bottleneckType", "entityId", "periodType", "periodDate");
