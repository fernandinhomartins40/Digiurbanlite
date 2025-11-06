-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'STARTER',
    "status" TEXT NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" DATETIME,
    "population" INTEGER,
    "billing" JSONB,
    "limits" JSONB,
    "settings" JSONB,
    "metadata" JSONB,
    "codigoIbge" TEXT,
    "nomeMunicipio" TEXT,
    "ufMunicipio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "hasEmailService" BOOLEAN NOT NULL DEFAULT false,
    "emailPlanType" TEXT NOT NULL DEFAULT 'NONE'
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "departmentId" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME,
    CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "citizens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cpf" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" DATETIME,
    "address" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedAt" DATETIME,
    "verifiedBy" TEXT,
    "verificationNotes" TEXT,
    "registrationSource" TEXT NOT NULL DEFAULT 'SELF',
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME,
    CONSTRAINT "citizens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "plan" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" DATETIME NOT NULL,
    "paidAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "description" TEXT,
    "paymentUrl" TEXT,
    "metadata" JSONB,
    CONSTRAINT "invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "position" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "tenantId" TEXT,
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "family_compositions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "headId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isDependent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "family_compositions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "citizens" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "family_compositions_headId_fkey" FOREIGN KEY ("headId") REFERENCES "citizens" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "services_simplified" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "moduleType" TEXT,
    "formSchema" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresDocuments" BOOLEAN NOT NULL DEFAULT false,
    "requiredDocuments" JSONB,
    "estimatedDays" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "services_simplified_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "services_simplified_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "protocols_simplified" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VINCULADO',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "citizenId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customData" JSONB,
    "moduleType" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "address" TEXT,
    "documents" JSONB,
    "attachments" TEXT,
    "assignedUserId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "concludedAt" DATETIME,
    CONSTRAINT "protocols_simplified_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "protocols_simplified_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services_simplified" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "protocols_simplified_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "protocols_simplified_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "protocols_simplified_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "protocols_simplified_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "protocol_history_simplified" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "comment" TEXT,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "metadata" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "protocolId" TEXT NOT NULL,
    CONSTRAINT "protocol_history_simplified_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "protocol_evaluations_simplified" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "wouldRecommend" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "protocol_evaluations_simplified_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "protocol_interactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "attachments" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "protocol_interactions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "protocol_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedAt" DATETIME,
    "uploadedBy" TEXT,
    "validatedAt" DATETIME,
    "validatedBy" TEXT,
    "rejectedAt" DATETIME,
    "rejectionReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousDocId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "protocol_documents_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "protocol_pendings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "blocksProgress" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "protocol_pendings_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "channel" TEXT NOT NULL DEFAULT 'WEB',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" DATETIME,
    "readAt" DATETIME,
    "protocolId" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "citizen_transfer_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenId" TEXT NOT NULL,
    "fromTenantId" TEXT NOT NULL,
    "toTenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "documents" JSONB,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "reviewNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "citizen_transfer_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "citizen_transfer_requests_toTenantId_fkey" FOREIGN KEY ("toTenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "citizen_transfer_requests_fromTenantId_fkey" FOREIGN KEY ("fromTenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "citizen_transfer_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "dimension" TEXT,
    "period" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "kpis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "target" REAL,
    "warning" REAL,
    "critical" REAL,
    "currentValue" REAL,
    "lastCalculated" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updateFrequency" TEXT NOT NULL DEFAULT 'daily',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "template" TEXT,
    "schedule" JSONB,
    "accessLevel" INTEGER NOT NULL,
    "departments" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "lastRun" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "report_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportId" TEXT NOT NULL,
    "parameters" JSONB,
    "filters" JSONB,
    "data" JSONB,
    "format" TEXT NOT NULL,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "errorMessage" TEXT,
    "executedBy" TEXT,
    "expiresAt" DATETIME,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "report_executions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dashboards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "layout" JSONB NOT NULL,
    "userLevel" INTEGER NOT NULL,
    "department" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "refreshRate" INTEGER NOT NULL DEFAULT 300,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" REAL NOT NULL,
    "threshold2" REAL,
    "frequency" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "cooldown" INTEGER NOT NULL DEFAULT 3600,
    "recipients" JSONB,
    "channels" JSONB,
    "lastTriggered" DATETIME,
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "alert_triggers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "triggeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "alert_triggers_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "metric_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB,
    "expiresAt" DATETIME NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "benchmarks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metric" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "population" TEXT NOT NULL,
    "p25" REAL,
    "p50" REAL,
    "p75" REAL,
    "average" REAL,
    "sampleSize" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "source" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "prediction" JSONB NOT NULL,
    "confidence" REAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "horizon" TEXT NOT NULL,
    "actualValue" REAL,
    "accuracy" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "email_servers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "mxPort" INTEGER NOT NULL DEFAULT 25,
    "submissionPort" INTEGER NOT NULL DEFAULT 587,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isPremiumService" BOOLEAN NOT NULL DEFAULT true,
    "monthlyPrice" DECIMAL NOT NULL DEFAULT 99.00,
    "maxEmailsPerMonth" INTEGER NOT NULL DEFAULT 10000,
    "tlsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "certPath" TEXT,
    "keyPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "email_servers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_domains" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailServerId" TEXT NOT NULL,
    "domainName" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "dkimEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dkimSelector" TEXT NOT NULL DEFAULT 'default',
    "dkimPrivateKey" TEXT,
    "dkimPublicKey" TEXT,
    "spfEnabled" BOOLEAN NOT NULL DEFAULT true,
    "spfRecord" TEXT,
    "dmarcEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dmarcPolicy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "email_domains_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "email_servers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailServerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "dailyLimit" INTEGER NOT NULL DEFAULT 1000,
    "monthlyLimit" INTEGER NOT NULL DEFAULT 10000,
    "sentToday" INTEGER NOT NULL DEFAULT 0,
    "sentThisMonth" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "email_users_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "email_servers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "emails" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailServerId" TEXT,
    "domainId" TEXT,
    "userId" TEXT,
    "messageId" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "ccEmails" JSONB,
    "bccEmails" JSONB,
    "subject" TEXT NOT NULL,
    "textContent" TEXT,
    "htmlContent" TEXT,
    "headers" JSONB,
    "attachments" JSONB,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "scheduledFor" DATETIME,
    "sentAt" DATETIME,
    "deliveredAt" DATETIME,
    "failedAt" DATETIME,
    "errorMessage" TEXT,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "unsubscribed" BOOLEAN NOT NULL DEFAULT false,
    "complained" BOOLEAN NOT NULL DEFAULT false,
    "bounced" BOOLEAN NOT NULL DEFAULT false,
    "dkimSigned" BOOLEAN NOT NULL DEFAULT false,
    "dkimSignature" TEXT,
    "campaignId" TEXT,
    "tags" JSONB,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "email_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "emails_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "email_domains" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "emails_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "email_servers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_events_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "emails" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailServerId" TEXT,
    "from" TEXT,
    "to" TEXT,
    "subject" TEXT,
    "status" TEXT,
    "type" TEXT,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "data" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_logs_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "email_servers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailServerId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "totalBounced" INTEGER NOT NULL DEFAULT 0,
    "totalComplained" INTEGER NOT NULL DEFAULT 0,
    "totalOpens" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueOpens" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "email_stats_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "email_servers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_auth_attempts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "email_auth_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "email_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "variables" JSONB,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "email_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "credentials" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSync" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "integrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "integration_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "integrationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "request" JSONB,
    "response" JSONB,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "integration_logs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cache_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "citizenId" TEXT,
    "tenantId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "method" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rural_producers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "productionType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mainCrop" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rural_producers_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rural_producers_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rural_producers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rural_properties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "producerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" REAL NOT NULL,
    "location" TEXT NOT NULL,
    "plantedArea" REAL,
    "mainCrops" JSONB,
    "owner" TEXT,
    "totalArea" REAL,
    "cultivatedArea" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rural_properties_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rural_properties_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "rural_producers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rural_properties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "building_permits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "applicantName" TEXT NOT NULL,
    "applicantCpf" TEXT,
    "applicantCpfCnpj" TEXT,
    "applicantPhone" TEXT,
    "propertyAddress" TEXT NOT NULL,
    "property" JSONB,
    "construction" JSONB,
    "permitType" TEXT NOT NULL,
    "requestedBy" TEXT,
    "observations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submissionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalDate" DATETIME,
    "description" TEXT,
    "documents" JSONB,
    "technicalAnalysis" JSONB,
    "permitNumber" TEXT,
    "reviewedBy" TEXT,
    "applicantEmail" TEXT,
    "requirements" JSONB,
    "issuedDate" DATETIME,
    "reviewedAt" DATETIME,
    "constructionType" TEXT,
    "validUntil" DATETIME,
    "propertyNumber" TEXT,
    "approvedBy" TEXT,
    "neighborhood" TEXT,
    "lotNumber" TEXT,
    "blockNumber" TEXT,
    "totalArea" REAL,
    "builtArea" REAL,
    "floors" INTEGER,
    "projectValue" REAL,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "building_permits_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "building_permits_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_complaints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "complainantName" TEXT,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "submissionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolutionDate" DATETIME,
    "assignedTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "public_complaints_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_consultations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "participationCount" INTEGER NOT NULL DEFAULT 0,
    "documents" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "public_consultations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "urban_zoning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT,
    "zoneName" TEXT NOT NULL,
    "code" TEXT,
    "type" TEXT,
    "zoneType" TEXT NOT NULL,
    "description" TEXT,
    "regulations" JSONB,
    "permitedUses" JSONB,
    "restrictions" JSONB,
    "coordinates" JSONB,
    "boundaries" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "urban_zoning_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "urban_zoning_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "projectName" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNDER_REVIEW',
    "submissionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalDate" DATETIME,
    "description" TEXT,
    "documents" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "project_approvals_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "project_approvals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "urban_planning_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "contactInfo" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "attendanceDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedDate" DATETIME,
    "assignedTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "urban_planning_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "urban_planning_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "urban_planning_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "urban_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "budget" REAL,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "urban_projects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "business_licenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "applicantName" TEXT NOT NULL,
    "applicantCpfCnpj" TEXT NOT NULL,
    "applicantPhone" TEXT,
    "applicantEmail" TEXT,
    "businessName" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "businessActivity" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "propertyNumber" TEXT,
    "neighborhood" TEXT,
    "licenseType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submissionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalDate" DATETIME,
    "validUntil" DATETIME,
    "licenseNumber" TEXT,
    "observations" TEXT,
    "documents" JSONB,
    "technicalAnalysis" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "issuedDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "business_licenses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "business_licenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "certificate_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "applicantName" TEXT NOT NULL,
    "applicantCpfCnpj" TEXT NOT NULL,
    "applicantPhone" TEXT,
    "applicantEmail" TEXT,
    "certificateType" TEXT NOT NULL,
    "purpose" TEXT,
    "propertyAddress" TEXT,
    "propertyNumber" TEXT,
    "neighborhood" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submissionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedDate" DATETIME,
    "validUntil" DATETIME,
    "certificateNumber" TEXT,
    "observations" TEXT,
    "documents" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "certificate_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "certificate_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "urban_infractions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "complainantName" TEXT,
    "complainantPhone" TEXT,
    "complainantEmail" TEXT,
    "infractionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "propertyNumber" TEXT,
    "neighborhood" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "photos" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "submissionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectionDate" DATETIME,
    "resolutionDate" DATETIME,
    "assignedTo" TEXT,
    "observations" TEXT,
    "documents" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "urban_infractions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "urban_infractions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "email_subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "subscribedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" DATETIME,
    "preferences" JSONB,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "cultural_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "observations" TEXT,
    "responsible" TEXT,
    "attachments" JSONB,
    "subject" TEXT,
    "category" TEXT,
    "requestedLocation" TEXT,
    "eventDate" DATETIME,
    "estimatedAudience" INTEGER,
    "requestedBudget" REAL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "followUpDate" DATETIME,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultural_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cultural_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "artistic_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "foundationDate" DATETIME,
    "responsible" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "members" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "artistic_groups_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "artistic_groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cultural_manifestations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "currentSituation" TEXT NOT NULL,
    "knowledgeHolders" JSONB,
    "safeguardActions" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultural_manifestations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cultural_manifestations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cultural_workshops" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "schedule" TEXT NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultural_workshops_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cultural_workshop_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "workshopId" TEXT,
    "citizenName" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "birthDate" DATETIME,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "hasExperience" BOOLEAN NOT NULL DEFAULT false,
    "experience" TEXT,
    "motivation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultural_workshop_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cultural_workshop_enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cultural_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "budget" REAL,
    "currentStatus" TEXT NOT NULL DEFAULT 'PLANNING',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "protocol" TEXT,
    "contact" JSONB,
    "funding" JSONB,
    "targetAudience" TEXT,
    "participants" INTEGER,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultural_projects_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cultural_projects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cultural_project_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "projectName" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization" TEXT,
    "budget" REAL NOT NULL,
    "fundingSource" TEXT,
    "targetAudience" TEXT NOT NULL,
    "expectedImpact" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "attachments" JSONB,
    "status" TEXT NOT NULL DEFAULT 'UNDER_REVIEW',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" DATETIME,
    "reviewComments" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultural_project_submissions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cultural_project_submissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "principalName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "email" TEXT,
    "levels" JSONB,
    "capacity" INTEGER NOT NULL,
    "currentStudents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "public_schools_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_calls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "callDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedDate" DATETIME,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_calls_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public_schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_calls_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sports_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "serviceType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "observations" TEXT,
    "responsible" TEXT,
    "referredTo" TEXT,
    "resolution" TEXT,
    "attachments" JSONB,
    "sportType" TEXT,
    "sport" TEXT,
    "eventDate" DATETIME,
    "location" TEXT,
    "expectedParticipants" INTEGER,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sports_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sports_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sports_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT NOT NULL,
    "eventType" TEXT,
    "sport" TEXT,
    "description" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "date" DATETIME,
    "endDate" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT NOT NULL,
    "capacity" INTEGER,
    "targetAudience" TEXT,
    "entryFee" REAL,
    "registrationRequired" BOOLEAN NOT NULL DEFAULT false,
    "organizer" TEXT,
    "contact" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "responsible" TEXT NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "registrationFee" REAL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sports_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sports_clubs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "foundationDate" DATETIME,
    "president" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "members" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sports_clubs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenCPF" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "observations" TEXT,
    "responsible" TEXT,
    "attachments" JSONB,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "medicalUnit" TEXT,
    "appointmentDate" DATETIME,
    "symptoms" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "manager" TEXT NOT NULL,
    "specialties" JSONB,
    "capacity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_units_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vaccination_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vaccine" TEXT NOT NULL,
    "targetGroup" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "locations" JSONB,
    "goal" INTEGER,
    "achieved" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vaccination_campaigns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medication_dispensing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "patientId" TEXT NOT NULL,
    "pharmacistId" TEXT,
    "medication" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dispensedAt" DATETIME NOT NULL,
    "prescription" JSONB,
    "status" TEXT NOT NULL DEFAULT 'dispensed',
    "batchNumber" TEXT,
    "expiryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "medication_dispensing_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "medication_dispensing_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vaccinations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "campaignId" TEXT,
    "patientId" TEXT NOT NULL,
    "vaccine" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "appliedAt" DATETIME NOT NULL,
    "appliedBy" TEXT NOT NULL,
    "lotNumber" TEXT,
    "nextDose" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vaccinations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vaccinations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vaccinations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "vaccination_campaigns" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vaccinations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cultural_spaces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "coordinates" JSONB,
    "neighborhood" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "area" REAL,
    "rooms" JSONB,
    "infrastructure" JSONB,
    "equipment" JSONB,
    "amenities" JSONB,
    "accessibility" BOOLEAN NOT NULL DEFAULT false,
    "manager" TEXT NOT NULL,
    "contact" JSONB NOT NULL,
    "operatingHours" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "available" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hourlyRate" REAL,
    "dailyRate" REAL,
    "freeUse" BOOLEAN NOT NULL DEFAULT false,
    "photos" JSONB,
    "documents" JSONB,
    "observations" TEXT,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultural_spaces_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cultural_space_reservations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "spaceId" TEXT,
    "spaceName" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "eventName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "expectedPeople" INTEGER NOT NULL,
    "needsEquipment" BOOLEAN NOT NULL DEFAULT false,
    "equipment" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultural_space_reservations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cultural_space_reservations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cultural_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "spaceId" TEXT,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "schedule" JSONB NOT NULL,
    "duration" INTEGER,
    "venue" TEXT NOT NULL,
    "address" JSONB,
    "coordinates" JSONB,
    "capacity" INTEGER NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "ageRating" TEXT,
    "ticketPrice" REAL,
    "freeEvent" BOOLEAN NOT NULL DEFAULT true,
    "organizer" JSONB NOT NULL,
    "producer" TEXT,
    "contact" JSONB NOT NULL,
    "performers" JSONB,
    "guests" JSONB,
    "requirements" JSONB,
    "setup" JSONB,
    "technical" JSONB,
    "status" TEXT NOT NULL DEFAULT 'planned',
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "promotion" JSONB,
    "media" JSONB,
    "website" TEXT,
    "socialMedia" JSONB,
    "attendance" INTEGER,
    "revenue" REAL,
    "expenses" REAL,
    "photos" JSONB,
    "videos" JSONB,
    "reviews" JSONB,
    "observations" TEXT,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultural_events_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cultural_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "cultural_projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cultural_events_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "cultural_spaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cultural_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "housing_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "citizenCPF" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "observations" TEXT,
    "responsible" TEXT,
    "attachments" JSONB,
    "program" TEXT,
    "documents" JSONB,
    "propertyAddress" TEXT,
    "familyIncome" REAL,
    "familySize" INTEGER,
    "currentHousing" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "housing_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "housing_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "housing_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "housing_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" JSONB,
    "eligibilityCriteria" JSONB,
    "benefits" JSONB,
    "maxIncome" REAL,
    "targetIncome" TEXT,
    "availableUnits" INTEGER NOT NULL DEFAULT 0,
    "registeredFamilies" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "contact" JSONB,
    "financingOptions" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "housing_programs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "housing_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "programId" TEXT NOT NULL,
    "familyHeadName" TEXT NOT NULL,
    "familyHeadCPF" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "familyIncome" REAL NOT NULL,
    "familySize" INTEGER NOT NULL,
    "score" REAL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "registrationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selectedDate" DATETIME,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "housing_registrations_programId_fkey" FOREIGN KEY ("programId") REFERENCES "housing_programs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "housing_registrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "housing_registrations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientCpf" TEXT NOT NULL,
    "patientBirthDate" DATETIME,
    "patientPhone" TEXT,
    "appointmentDate" DATETIME NOT NULL,
    "appointmentTime" TEXT NOT NULL,
    "doctorId" TEXT,
    "speciality" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "symptoms" TEXT,
    "observations" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "followUpDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_appointments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "health_doctors" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_appointments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_doctors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "crm" TEXT NOT NULL,
    "speciality" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schedule" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_doctors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medical_specialties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "medical_specialties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_professionals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "crm" TEXT,
    "specialtyId" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "schedule" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_professionals_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "medical_specialties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "health_professionals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "activeIngredient" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dosage" TEXT,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minimumStock" INTEGER NOT NULL DEFAULT 10,
    "unitPrice" REAL,
    "supplier" TEXT,
    "expirationDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "medications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vulnerable_families" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "familyCode" TEXT,
    "responsibleName" TEXT,
    "memberCount" INTEGER NOT NULL,
    "monthlyIncome" REAL,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "vulnerabilityType" TEXT NOT NULL,
    "socialWorker" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "observations" TEXT,
    "lastVisitDate" DATETIME,
    "nextVisitDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vulnerable_families_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vulnerable_families_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vulnerable_families_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "benefit_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "familyId" TEXT NOT NULL,
    "benefitType" TEXT NOT NULL,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "reason" TEXT NOT NULL,
    "documentsProvided" JSONB,
    "approvedBy" TEXT,
    "approvedDate" DATETIME,
    "deliveredDate" DATETIME,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "benefit_requests_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "vulnerable_families" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "benefit_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "benefit_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "emergency_deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "benefitRequestId" TEXT,
    "citizenId" TEXT,
    "deliveryType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "deliveryDate" DATETIME NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientSignature" TEXT,
    "deliveredBy" TEXT NOT NULL,
    "urgency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "emergency_deliveries_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "emergency_deliveries_benefitRequestId_fkey" FOREIGN KEY ("benefitRequestId") REFERENCES "benefit_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "emergency_deliveries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "emergency_deliveries_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "home_visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "familyId" TEXT NOT NULL,
    "socialWorkerId" TEXT,
    "visitDate" DATETIME NOT NULL,
    "socialWorker" TEXT NOT NULL,
    "visitType" TEXT NOT NULL DEFAULT 'ROUTINE',
    "visitPurpose" TEXT NOT NULL,
    "purpose" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "nextVisitDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "home_visits_socialWorkerId_fkey" FOREIGN KEY ("socialWorkerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "home_visits_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "vulnerable_families" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "home_visits_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "home_visits_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_works" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "contractor" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "plannedBudget" REAL,
    "actualBudget" REAL,
    "budget" JSONB,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "beneficiaries" INTEGER,
    "photos" JSONB,
    "documents" JSONB,
    "timeline" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "public_works_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "public_works_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "principalName" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "schools_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "parentName" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "parentEmail" TEXT,
    "address" TEXT NOT NULL,
    "medicalInfo" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "schoolId" TEXT NOT NULL,
    CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_classes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "maxStudents" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_classes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "schoolId" TEXT,
    "grade" TEXT,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "enrollmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school_classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "present" BOOLEAN NOT NULL,
    "justification" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_attendances_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school_classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_transports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "route" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "vehicle" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "shift" TEXT NOT NULL,
    "stops" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_transports_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_meals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "schoolId" TEXT,
    "date" DATETIME NOT NULL,
    "shift" TEXT NOT NULL,
    "menu" JSONB NOT NULL,
    "studentsServed" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_meals_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "school_meals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_meals_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_incidents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'media',
    "actionTaken" TEXT,
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_incidents_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school_classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_incidents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "type" TEXT NOT NULL,
    "schoolId" TEXT,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_events_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "education_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT NOT NULL,
    "citizenPhone" TEXT,
    "citizenEmail" TEXT,
    "serviceType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "scheduledDate" DATETIME,
    "completedDate" DATETIME,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "education_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "education_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "observations" TEXT,
    "fileUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_documents_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "student_transfers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "currentSchool" TEXT NOT NULL,
    "targetSchool" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "transferReason" TEXT NOT NULL,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "documents" JSONB,
    "observations" TEXT,
    "approvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_transfers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_transfers_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "schoolId" TEXT,
    "classId" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "presentDays" INTEGER NOT NULL,
    "absentDays" INTEGER NOT NULL,
    "percentage" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "attendance_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "attendance_records_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "grade_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "schoolId" TEXT,
    "classId" TEXT,
    "subject" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "grade" REAL NOT NULL,
    "maxGrade" REAL NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "observations" TEXT,
    "teacherName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "grade_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "grade_records_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_management" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "schoolId" TEXT,
    "schoolName" TEXT NOT NULL,
    "managementType" TEXT NOT NULL,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "assignedTo" TEXT,
    "completedDate" DATETIME,
    "observations" TEXT,
    "documents" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_management_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_management_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "athletes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "birthDate" DATETIME NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "sport" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "team" TEXT,
    "teamId" TEXT,
    "position" TEXT,
    "medicalInfo" JSONB,
    "emergencyContact" JSONB,
    "federationNumber" TEXT,
    "federationExpiry" DATETIME,
    "medicalCertificate" JSONB,
    "modalityId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "athletes_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "sport_modalities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "athletes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "athletes_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tourist_attractions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT,
    "coordinates" JSONB,
    "openingHours" TEXT,
    "ticketPrice" REAL,
    "accessibility" JSONB,
    "amenities" JSONB,
    "images" JSONB,
    "rating" REAL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "freeEntry" BOOLEAN NOT NULL DEFAULT false,
    "protocol" TEXT,
    "city" TEXT,
    "serviceId" TEXT,
    "state" TEXT,
    "facilities" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tourist_attractions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tourist_attractions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_transports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "patientName" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "transportType" TEXT NOT NULL,
    "urgencyLevel" TEXT NOT NULL,
    "scheduledDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "observations" TEXT,
    "responsibleDriver" TEXT,
    "vehicleId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_transports_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_transports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medication_dispenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientCpf" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL DEFAULT '1x ao dia',
    "quantity" INTEGER NOT NULL,
    "dispenseDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prescriptionId" TEXT,
    "pharmacistName" TEXT NOT NULL,
    "dispensedBy" TEXT NOT NULL,
    "unitId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DISPENSED',
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "medication_dispenses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "medication_dispenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "goals" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "coordinatorName" TEXT NOT NULL,
    "budget" REAL,
    "results" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_campaigns_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_campaigns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campaign_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT NOT NULL,
    "patientBirthDate" DATETIME,
    "patientPhone" TEXT,
    "enrollmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enrolledBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "campaign_enrollments_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "health_campaigns" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "campaign_enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "coordinatorName" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "goals" JSONB,
    "participants" INTEGER NOT NULL DEFAULT 0,
    "budget" REAL,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_programs_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_programs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_exams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientCpf" TEXT NOT NULL,
    "patientPhone" TEXT,
    "examType" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" DATETIME,
    "resultDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "requestedBy" TEXT NOT NULL,
    "healthUnit" TEXT,
    "observations" TEXT,
    "result" TEXT,
    "attachments" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_exams_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_exams_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_transport_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientCpf" TEXT NOT NULL,
    "patientPhone" TEXT,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "transportType" TEXT NOT NULL,
    "urgencyLevel" TEXT NOT NULL DEFAULT 'NORMAL',
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "observations" TEXT,
    "responsibleDriver" TEXT,
    "vehicleId" TEXT,
    "departureTime" DATETIME,
    "arrivalTime" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_transport_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_transport_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "fullName" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "birthDate" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodType" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "susCardNumber" TEXT,
    "allergies" TEXT,
    "chronicDiseases" TEXT,
    "medications" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "observations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "registeredBy" TEXT NOT NULL,
    "registrationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "patients_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "patients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "community_health_agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "fullName" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "assignedArea" TEXT NOT NULL,
    "registrationNum" TEXT,
    "hireDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "healthUnit" TEXT,
    "supervisor" TEXT,
    "familiesServed" INTEGER NOT NULL DEFAULT 0,
    "workSchedule" JSONB,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "community_health_agents_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "community_health_agents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "disciplinary_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "studentId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "severity" TEXT,
    "description" TEXT NOT NULL,
    "incidentDate" DATETIME NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time" TEXT,
    "location" TEXT,
    "witnesses" TEXT,
    "actions_taken" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reportedBy" TEXT,
    "measures" TEXT NOT NULL,
    "responsibleTeacher" TEXT NOT NULL,
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "disciplinary_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "disciplinary_records_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sports_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "gender" TEXT,
    "ageGroup" TEXT NOT NULL,
    "coach" TEXT NOT NULL,
    "coachCpf" TEXT,
    "coachPhone" TEXT,
    "foundationDate" DATETIME,
    "trainingSchedule" JSONB,
    "maxPlayers" INTEGER,
    "currentPlayers" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "homeVenue" TEXT,
    "description" TEXT,
    "achievements" JSONB,
    "roster" JSONB,
    "modalityId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sportsModalityId" TEXT,
    CONSTRAINT "sports_teams_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "sport_modalities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sports_teams_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sports_teams_sportsModalityId_fkey" FOREIGN KEY ("sportsModalityId") REFERENCES "sports_modalities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sports_teams_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "competitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "competitionType" TEXT NOT NULL,
    "type" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "maxTeams" INTEGER,
    "registeredTeams" INTEGER,
    "registrationFee" REAL,
    "entryFee" REAL,
    "prizes" JSONB,
    "rules" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "organizer" TEXT NOT NULL,
    "venue" TEXT,
    "location" TEXT,
    "contact" JSONB,
    "results" JSONB,
    "modalityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "sportsModalityId" TEXT,
    CONSTRAINT "competitions_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "sport_modalities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "competitions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "competitions_sportsModalityId_fkey" FOREIGN KEY ("sportsModalityId") REFERENCES "sports_modalities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "competitions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sports_infrastructures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "sports" JSONB NOT NULL,
    "modalities" JSONB,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "capacity" INTEGER,
    "dimensions" TEXT,
    "surface" TEXT,
    "lighting" BOOLEAN NOT NULL DEFAULT false,
    "covered" BOOLEAN NOT NULL DEFAULT false,
    "accessibility" BOOLEAN NOT NULL DEFAULT false,
    "equipment" JSONB,
    "facilities" JSONB,
    "operatingHours" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "maintenanceSchedule" JSONB,
    "lastMaintenance" DATETIME,
    "bookingRules" JSONB,
    "contact" TEXT,
    "manager" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sports_infrastructures_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sports_infrastructures_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sports_schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetAge" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "instructorCpf" TEXT,
    "maxStudents" INTEGER NOT NULL,
    "currentStudents" INTEGER NOT NULL DEFAULT 0,
    "schedule" JSONB NOT NULL,
    "location" TEXT NOT NULL,
    "monthlyFee" REAL,
    "equipment" JSONB,
    "requirements" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sports_schools_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sports_schools_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sports_school_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "sportsSchoolId" TEXT,
    "studentName" TEXT NOT NULL,
    "studentBirthDate" DATETIME NOT NULL,
    "studentCpf" TEXT,
    "studentRg" TEXT,
    "parentName" TEXT,
    "parentCpf" TEXT,
    "parentPhone" TEXT NOT NULL,
    "parentEmail" TEXT,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT,
    "sport" TEXT NOT NULL,
    "level" TEXT,
    "enrollmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "medicalCertificate" JSONB,
    "emergencyContact" JSONB,
    "observations" TEXT,
    "uniforms" JSONB,
    "attendance" JSONB,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sports_school_enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sports_school_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sports_infrastructure_reservations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "infrastructureId" TEXT,
    "infrastructureName" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "organization" TEXT,
    "sport" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "expectedPeople" INTEGER,
    "equipment" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sports_infrastructure_reservations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sports_infrastructure_reservations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "competition_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "competitionId" TEXT,
    "competitionName" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "coachName" TEXT NOT NULL,
    "coachCpf" TEXT,
    "coachPhone" TEXT NOT NULL,
    "coachEmail" TEXT,
    "playersCount" INTEGER NOT NULL,
    "playersList" JSONB NOT NULL,
    "enrollmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentProof" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "competition_enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "competition_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tournament_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "tournamentId" TEXT,
    "tournamentName" TEXT NOT NULL,
    "participantType" TEXT NOT NULL,
    "teamName" TEXT,
    "athleteName" TEXT,
    "athleteCpf" TEXT,
    "sport" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "coachName" TEXT,
    "coachPhone" TEXT,
    "coachEmail" TEXT,
    "playersCount" INTEGER,
    "playersList" JSONB,
    "enrollmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentProof" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectionReason" TEXT,
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tournament_enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tournament_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sport_modalities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "equipment" JSONB,
    "rules" TEXT,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sport_modalities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "security_occurrences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "occurrenceType" TEXT NOT NULL,
    "type" TEXT,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "reportedBy" TEXT,
    "reporterName" TEXT,
    "reporterPhone" TEXT,
    "reporterCpf" TEXT,
    "victimInfo" JSONB,
    "officerName" TEXT,
    "dateTime" DATETIME,
    "occurrenceDate" DATETIME NOT NULL,
    "reportDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "evidence" JSONB,
    "witnesses" JSONB,
    "actions" TEXT,
    "resolution" TEXT,
    "followUp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "security_occurrences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "security_occurrences_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "security_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "title" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "type" TEXT,
    "message" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "targetArea" TEXT,
    "coordinates" JSONB,
    "severity" TEXT NOT NULL,
    "priority" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "expiresAt" DATETIME,
    "validUntil" DATETIME,
    "targetAudience" TEXT,
    "affectedAreas" JSONB,
    "channels" JSONB NOT NULL,
    "acknowledgments" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "security_alerts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "security_alerts_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "security_patrols" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "patrolType" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "guardId" TEXT,
    "guardName" TEXT,
    "officerName" TEXT NOT NULL,
    "officerBadge" TEXT,
    "vehicle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "checkpoints" JSONB,
    "incidents" JSONB,
    "observations" TEXT,
    "gpsTrack" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "security_patrols_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "security_patrols_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "critical_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT,
    "coordinates" JSONB NOT NULL,
    "pointType" TEXT NOT NULL,
    "riskType" JSONB,
    "riskLevel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "recommendations" TEXT NOT NULL,
    "recommendedActions" JSONB,
    "patrolFrequency" TEXT,
    "monitoringLevel" TEXT NOT NULL,
    "lastIncident" DATETIME,
    "lastIncidentDate" DATETIME,
    "incidentCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "critical_points_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "critical_points_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "security_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT,
    "contact" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "attendanceType" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "location" TEXT,
    "evidence" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedOfficer" TEXT,
    "referredTo" TEXT,
    "actions" TEXT,
    "resolution" TEXT,
    "satisfactionRating" INTEGER,
    "followUpDate" DATETIME,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "security_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "security_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "local_businesses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "businessInfo" JSONB,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "coordinates" JSONB,
    "contact" JSONB NOT NULL,
    "openingHours" JSONB NOT NULL,
    "services" JSONB,
    "amenities" JSONB,
    "priceRange" TEXT,
    "rating" REAL,
    "photos" JSONB,
    "owner" TEXT NOT NULL,
    "ownerCpf" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTourismPartner" BOOLEAN NOT NULL DEFAULT false,
    "isPartner" BOOLEAN NOT NULL DEFAULT false,
    "certifications" JSONB,
    "protocol" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "local_businesses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "local_businesses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tourism_infos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "infoType" TEXT NOT NULL,
    "type" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetAudience" TEXT,
    "location" TEXT,
    "coordinates" JSONB,
    "validFrom" DATETIME NOT NULL,
    "validUntil" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "publication" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "images" JSONB,
    "links" JSONB,
    "tags" JSONB,
    "seo" JSONB,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tourism_infos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tourism_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "type" TEXT,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "objectives" JSONB NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "budget" REAL,
    "coordinator" TEXT NOT NULL,
    "activities" JSONB NOT NULL,
    "participants" JSONB,
    "results" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "evaluation" JSONB,
    "photos" JSONB,
    "currentParticipants" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tourism_programs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tourism_programs_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tourism_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT,
    "visitorName" TEXT NOT NULL,
    "visitorEmail" TEXT,
    "visitorPhone" TEXT,
    "origin" TEXT,
    "serviceType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedAgent" TEXT,
    "resolution" TEXT,
    "satisfaction" INTEGER,
    "followUpDate" DATETIME,
    "touristProfile" JSONB,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tourism_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tourism_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tourism_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tourism_guides" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "birthDate" DATETIME,
    "languages" JSONB NOT NULL,
    "specialties" JSONB,
    "certifications" JSONB,
    "licenseNumber" TEXT,
    "licenseExpiry" DATETIME,
    "registrationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "experienceYears" INTEGER,
    "bio" TEXT,
    "photo" TEXT,
    "availableSchedule" JSONB,
    "rating" REAL,
    "totalTours" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emergencyContact" JSONB,
    "bankInfo" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tourism_guides_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tourism_guides_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tourism_routes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "routeType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "distance" REAL,
    "startPoint" TEXT NOT NULL,
    "endPoint" TEXT NOT NULL,
    "waypoints" JSONB,
    "attractions" JSONB NOT NULL,
    "services" JSONB,
    "bestSeason" JSONB,
    "recommendations" TEXT,
    "warnings" TEXT,
    "accessibility" JSONB,
    "photos" JSONB,
    "mapData" JSONB,
    "estimatedCost" REAL,
    "guideRequired" BOOLEAN NOT NULL DEFAULT false,
    "minimumAge" INTEGER,
    "maxGroupSize" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rating" REAL,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tourism_routes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tourism_routes_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tourism_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "duration" TEXT,
    "organizer" TEXT NOT NULL,
    "organizerContact" JSONB NOT NULL,
    "capacity" INTEGER,
    "registeredCount" INTEGER NOT NULL DEFAULT 0,
    "ticketPrice" REAL,
    "freeEntry" BOOLEAN NOT NULL DEFAULT false,
    "ageRestriction" TEXT,
    "accessibility" JSONB,
    "amenities" JSONB,
    "program" JSONB,
    "speakers" JSONB,
    "sponsors" JSONB,
    "photos" JSONB,
    "promotional" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "registrationUrl" TEXT,
    "socialMedia" JSONB,
    "tags" JSONB,
    "requirements" TEXT,
    "cancellationInfo" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tourism_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tourism_events_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "environmental_licenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantCpf" TEXT NOT NULL,
    "applicantPhone" TEXT,
    "applicantDocument" TEXT,
    "businessName" TEXT,
    "licenseType" TEXT NOT NULL,
    "activity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "area" REAL,
    "applicationDate" DATETIME NOT NULL,
    "analysisDate" DATETIME,
    "issueDate" DATETIME,
    "validFrom" DATETIME,
    "expiryDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UNDER_ANALYSIS',
    "conditions" JSONB,
    "technicalOpinion" TEXT,
    "analyst" TEXT,
    "fee" REAL,
    "documents" JSONB,
    "inspections" JSONB,
    "observations" TEXT,
    "applicantEmail" TEXT,
    "validUntil" DATETIME,
    "activityType" TEXT,
    "technicalReport" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "protocolNumber" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "environmental_licenses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "environmental_licenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "environmental_complaints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "reporterName" TEXT,
    "complainantName" TEXT,
    "reporterPhone" TEXT,
    "reporterEmail" TEXT,
    "complaintType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "evidence" JSONB,
    "occurrenceDate" DATETIME NOT NULL,
    "reportDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "inspector" TEXT,
    "assignedTo" TEXT,
    "inspectionDate" DATETIME,
    "findings" TEXT,
    "actions" TEXT,
    "actionsTaken" JSONB,
    "resolution" TEXT,
    "penalty" REAL,
    "followUp" BOOLEAN NOT NULL DEFAULT false,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "complainantPhone" TEXT,
    "complainantEmail" TEXT,
    "investigationDate" DATETIME,
    "investigatorId" TEXT,
    "investigationReport" JSONB,
    "resolvedBy" TEXT,
    "resolvedAt" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "photos" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "environmental_complaints_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "environmental_complaints_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "protected_areas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "areaType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "totalArea" REAL NOT NULL,
    "protectionLevel" TEXT NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "managementPlan" JSONB,
    "biodiversity" JSONB,
    "threats" JSONB,
    "activities" JSONB,
    "restrictions" JSONB,
    "guardian" TEXT,
    "contact" TEXT,
    "visitationRules" JSONB,
    "isPublicAccess" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastInspection" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "protected_areas_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "protected_areas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "environmental_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" JSONB NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "budget" REAL,
    "coordinator" TEXT NOT NULL,
    "activities" JSONB NOT NULL,
    "indicators" JSONB,
    "partnerships" JSONB,
    "beneficiaries" INTEGER,
    "results" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "evaluation" JSONB,
    "reports" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "environmental_programs_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "environmental_programs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "environmental_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT,
    "contact" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "location" TEXT,
    "evidence" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "analyst" TEXT,
    "technicalOpinion" TEXT,
    "recommendation" TEXT,
    "followUpDate" DATETIME,
    "resolution" TEXT,
    "satisfaction" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "environmental_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "environmental_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "environmental_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tree_cutting_authorizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "authorizationNumber" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantCpf" TEXT NOT NULL,
    "applicantPhone" TEXT,
    "applicantEmail" TEXT,
    "propertyAddress" TEXT NOT NULL,
    "coordinates" JSONB,
    "requestType" TEXT NOT NULL,
    "treeSpecies" TEXT NOT NULL,
    "treeQuantity" INTEGER NOT NULL DEFAULT 1,
    "treeHeight" REAL,
    "trunkDiameter" REAL,
    "justification" TEXT NOT NULL,
    "technicalReport" TEXT,
    "photos" JSONB,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectionDate" DATETIME,
    "inspector" TEXT,
    "inspectionReport" TEXT,
    "decision" TEXT,
    "conditions" JSONB,
    "authorizationDate" DATETIME,
    "validUntil" DATETIME,
    "executionDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UNDER_ANALYSIS',
    "fee" REAL,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tree_cutting_authorizations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tree_cutting_authorizations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "environmental_inspections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "inspectionNumber" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "scheduledDate" DATETIME NOT NULL,
    "inspectionDate" DATETIME,
    "inspector" TEXT NOT NULL,
    "inspectorTeam" JSONB,
    "findings" TEXT,
    "photos" JSONB,
    "evidence" JSONB,
    "nonCompliances" JSONB,
    "recommendations" TEXT,
    "reportedViolations" JSONB,
    "penalties" REAL,
    "correctiveActions" JSONB,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "report" TEXT,
    "reportDate" DATETIME,
    "relatedLicenseId" TEXT,
    "relatedComplaintId" TEXT,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "environmental_inspections_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "environmental_inspections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "technical_assistances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "producerName" TEXT NOT NULL,
    "producerCpf" TEXT NOT NULL,
    "producerPhone" TEXT,
    "propertyName" TEXT NOT NULL,
    "propertySize" REAL NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "assistanceType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "crop" TEXT,
    "livestock" TEXT,
    "technician" TEXT NOT NULL,
    "scheduledDate" DATETIME,
    "scheduledVisit" DATETIME,
    "requestDate" DATETIME,
    "visitDate" DATETIME NOT NULL,
    "visitReport" JSONB,
    "findings" TEXT,
    "recommendations" JSONB NOT NULL,
    "followUpPlan" JSONB,
    "materials" JSONB,
    "costs" REAL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "satisfaction" INTEGER,
    "photos" JSONB,
    "nextVisitDate" DATETIME,
    "observations" TEXT,
    "propertyLocation" TEXT,
    "technicianId" TEXT,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "propertyArea" REAL,
    "cropTypes" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "completedBy" TEXT,
    "completedAt" DATETIME,
    "followUpDate" DATETIME,
    "followUpNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "technical_assistances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rural_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" JSONB NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "requirements" JSONB NOT NULL,
    "benefits" JSONB NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "budget" REAL,
    "coordinator" TEXT NOT NULL,
    "maxParticipants" INTEGER,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "applicationPeriod" JSONB,
    "selectionCriteria" JSONB,
    "partners" JSONB,
    "results" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "evaluation" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rural_programs_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rural_programs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rural_trainings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "title" TEXT NOT NULL,
    "trainingType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" JSONB NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "instructorBio" TEXT,
    "content" JSONB NOT NULL,
    "duration" INTEGER NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "schedule" JSONB NOT NULL,
    "location" TEXT NOT NULL,
    "materials" JSONB,
    "certificate" BOOLEAN NOT NULL DEFAULT false,
    "cost" REAL,
    "requirements" TEXT,
    "evaluation" JSONB,
    "feedback" JSONB,
    "photos" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rural_trainings_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rural_trainings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agriculture_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "producerName" TEXT NOT NULL,
    "producerCpf" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "propertyName" TEXT,
    "serviceType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "location" TEXT,
    "propertySize" REAL,
    "crops" JSONB,
    "livestock" JSONB,
    "preferredVisitDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "technician" TEXT,
    "scheduledDate" DATETIME,
    "visitDate" DATETIME,
    "findings" TEXT,
    "recommendations" TEXT,
    "followUpDate" DATETIME,
    "resolution" TEXT,
    "satisfaction" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agriculture_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "housing_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantCpf" TEXT NOT NULL,
    "contact" JSONB NOT NULL,
    "address" TEXT NOT NULL,
    "familyIncome" REAL NOT NULL,
    "familySize" INTEGER NOT NULL,
    "housingType" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "propertyValue" REAL,
    "hasProperty" BOOLEAN NOT NULL DEFAULT false,
    "isFirstHome" BOOLEAN NOT NULL DEFAULT true,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "documents" JSONB NOT NULL,
    "program" TEXT,
    "applicationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submissionDate" DATETIME,
    "analysisDate" DATETIME,
    "approvalDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UNDER_ANALYSIS',
    "analyst" TEXT,
    "observations" TEXT,
    "rejection_reason" TEXT,
    "approvedBenefit" JSONB,
    "disbursementDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "housing_applications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "housing_applications_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "housing_units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "unitCode" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "neighborhood" TEXT NOT NULL,
    "area" REAL NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "constructionYear" INTEGER,
    "propertyValue" REAL,
    "monthlyRent" REAL,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "occupantName" TEXT,
    "occupantCpf" TEXT,
    "occupancyDate" DATETIME,
    "contractType" TEXT,
    "contractEnd" DATETIME,
    "program" TEXT,
    "conditions" JSONB,
    "lastInspection" DATETIME,
    "needsMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceItems" JSONB,
    "photos" JSONB,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "housing_units_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "housing_units_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "land_regularizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantCpf" TEXT NOT NULL,
    "contact" JSONB NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "coordinates" JSONB,
    "propertyArea" REAL NOT NULL,
    "occupationDate" DATETIME,
    "occupationType" TEXT NOT NULL,
    "hasBuilding" BOOLEAN NOT NULL DEFAULT false,
    "buildingArea" REAL,
    "landValue" REAL,
    "neighbors" JSONB,
    "accessRoads" JSONB,
    "utilities" JSONB,
    "legalDocuments" JSONB,
    "technicalSurvey" JSONB,
    "environmentalAnalysis" JSONB,
    "applicationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisStartDate" DATETIME,
    "fieldVisitDate" DATETIME,
    "publicationDate" DATETIME,
    "objectionPeriod" JSONB,
    "approvalDate" DATETIME,
    "titleIssueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UNDER_ANALYSIS',
    "analyst" TEXT,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "land_regularizations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "land_regularizations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rent_assistances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantCpf" TEXT NOT NULL,
    "contact" JSONB NOT NULL,
    "currentAddress" TEXT NOT NULL,
    "monthlyRent" REAL NOT NULL,
    "landlordName" TEXT NOT NULL,
    "landlordContact" JSONB NOT NULL,
    "leaseContract" JSONB,
    "familyIncome" REAL NOT NULL,
    "familySize" INTEGER NOT NULL,
    "hasEmployment" BOOLEAN NOT NULL DEFAULT false,
    "employmentDetails" JSONB,
    "vulnerabilityReason" TEXT NOT NULL,
    "requestedAmount" REAL NOT NULL,
    "requestedPeriod" INTEGER NOT NULL,
    "bankAccount" JSONB,
    "documents" JSONB NOT NULL,
    "socialReport" JSONB,
    "applicationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisDate" DATETIME,
    "approvalDate" DATETIME,
    "firstPaymentDate" DATETIME,
    "lastPaymentDate" DATETIME,
    "totalPaid" REAL NOT NULL DEFAULT 0,
    "paymentsCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UNDER_ANALYSIS',
    "analyst" TEXT,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rent_assistances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rent_assistances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "social_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" JSONB NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "targetGroup" TEXT,
    "requirements" JSONB NOT NULL,
    "benefits" JSONB NOT NULL,
    "benefitValue" REAL,
    "frequency" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "budget" REAL,
    "maxBeneficiaries" INTEGER,
    "maxParticipants" INTEGER,
    "currentBeneficiaries" INTEGER NOT NULL DEFAULT 0,
    "coordinator" TEXT NOT NULL,
    "registrationPeriod" JSONB,
    "selectionCriteria" JSONB,
    "partners" JSONB,
    "results" JSONB,
    "evaluation" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_programs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "social_assistance_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT NOT NULL,
    "contact" JSONB NOT NULL,
    "familyIncome" REAL,
    "familySize" INTEGER,
    "serviceType" TEXT NOT NULL,
    "attendanceType" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vulnerability" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "referredBy" TEXT,
    "socialWorker" TEXT,
    "socialWorkerId" TEXT,
    "assessment" JSONB,
    "interventionPlan" JSONB,
    "referrals" JSONB,
    "followUpPlan" JSONB,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "priority" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "nextVisitDate" DATETIME,
    "satisfaction" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_assistance_attendances_socialWorkerId_fkey" FOREIGN KEY ("socialWorkerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_assistance_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_assistance_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "social_assistance_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "social_group_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "participantName" TEXT NOT NULL,
    "participantCpf" TEXT,
    "groupName" TEXT NOT NULL,
    "groupType" TEXT NOT NULL,
    "enrollmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "frequency" TEXT,
    "observations" TEXT,
    "instructor" TEXT,
    "schedule" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_group_enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "social_group_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_group_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "social_program_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "beneficiaryName" TEXT NOT NULL,
    "beneficiaryCpf" TEXT,
    "programName" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "enrollmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "monthlyIncome" REAL,
    "familySize" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "approvedDate" DATETIME,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "benefits" JSONB,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_program_enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "social_program_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_program_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "social_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT,
    "appointmentType" TEXT NOT NULL,
    "appointmentDate" DATETIME NOT NULL,
    "socialWorker" TEXT,
    "socialWorkerId" TEXT,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "result" TEXT,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_appointments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "social_appointments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_appointments_socialWorkerId_fkey" FOREIGN KEY ("socialWorkerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_appointments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "social_equipments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "equipmentName" TEXT NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "capacity" INTEGER,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "coordinator" TEXT,
    "coordinatorId" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "services" JSONB,
    "schedule" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_equipments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "social_equipments_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_equipments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_inspections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "workName" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "contractor" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "inspectionDate" DATETIME NOT NULL,
    "inspector" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "findings" JSONB NOT NULL,
    "compliance" TEXT NOT NULL,
    "violations" JSONB,
    "recommendations" JSONB,
    "photos" JSONB,
    "documents" JSONB,
    "deadline" DATETIME,
    "followUpDate" DATETIME,
    "nextInspection" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "work_inspections_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "work_inspections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_works_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT,
    "contact" JSONB NOT NULL,
    "serviceType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "workType" TEXT,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "photos" JSONB,
    "estimatedCost" REAL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "feasibility" TEXT,
    "technicalOpinion" TEXT,
    "engineer" TEXT,
    "scheduledDate" DATETIME,
    "completionDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "satisfaction" INTEGER,
    "followUpDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "public_works_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "public_works_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "road_repair_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT,
    "contact" JSONB NOT NULL,
    "roadName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "problemType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "photos" JSONB,
    "affectedArea" REAL,
    "trafficImpact" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "estimatedCost" REAL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assignedTeam" TEXT,
    "scheduledDate" DATETIME,
    "completionDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "materialsUsed" JSONB,
    "workDuration" INTEGER,
    "satisfaction" INTEGER,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "road_repair_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "road_repair_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "technical_inspections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "requestorName" TEXT NOT NULL,
    "requestorCpf" TEXT,
    "contact" JSONB NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "propertyType" TEXT,
    "constructionStage" TEXT,
    "documents" JSONB,
    "photos" JSONB,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "scheduledDate" DATETIME,
    "inspectionDate" DATETIME,
    "inspector" TEXT,
    "findings" JSONB,
    "technicalOpinion" TEXT,
    "approved" BOOLEAN,
    "conditions" JSONB,
    "validUntil" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "followUpDate" DATETIME,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "technical_inspections_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "technical_inspections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_service_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "requestorName" TEXT NOT NULL,
    "requestorCpf" TEXT,
    "contact" JSONB NOT NULL,
    "serviceType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferredDate" DATETIME,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "priority" TEXT,
    "photos" JSONB,
    "assignedTeam" TEXT,
    "scheduledDate" DATETIME,
    "expectedDate" DATETIME,
    "completionDate" DATETIME,
    "materials" JSONB,
    "workDetails" TEXT,
    "cost" REAL,
    "estimatedCost" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "satisfaction" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "public_service_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "public_service_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cleaning_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "area" TEXT NOT NULL,
    "cleaningType" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "startTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "estimatedDuration" INTEGER,
    "teamSize" INTEGER NOT NULL,
    "equipment" JSONB,
    "responsibleTeam" TEXT NOT NULL,
    "team" TEXT,
    "vehicle" TEXT,
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastExecution" DATETIME,
    "nextExecution" DATETIME NOT NULL,
    "executionHistory" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cleaning_schedules_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cleaning_schedules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "street_lightings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "pointCode" TEXT NOT NULL,
    "streetName" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "poleType" TEXT NOT NULL,
    "lampType" TEXT NOT NULL,
    "power" INTEGER NOT NULL,
    "height" REAL NOT NULL,
    "installDate" DATETIME,
    "lastMaintenance" DATETIME,
    "nextMaintenance" DATETIME,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "status" TEXT,
    "issues" JSONB,
    "maintenanceHistory" JSONB,
    "energyConsumption" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "photos" JSONB,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "street_lightings_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "street_lightings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "special_collections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "collectionType" TEXT NOT NULL,
    "requestorName" TEXT NOT NULL,
    "requestorCpf" TEXT,
    "contact" JSONB NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "description" TEXT NOT NULL,
    "estimatedVolume" REAL,
    "quantity" INTEGER,
    "unit" TEXT,
    "photos" JSONB,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferredDate" DATETIME,
    "scheduledDate" DATETIME,
    "timeSlot" TEXT,
    "collectionDate" DATETIME,
    "teamAssigned" TEXT,
    "vehicle" TEXT,
    "actualVolume" REAL,
    "destination" TEXT,
    "cost" REAL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "observations" TEXT,
    "satisfaction" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "special_collections_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "special_collections_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "special_collections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_problem_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "protocol" TEXT NOT NULL,
    "reporterName" TEXT,
    "reporterPhone" TEXT,
    "reporterEmail" TEXT,
    "problemType" TEXT NOT NULL,
    "title" TEXT,
    "severity" TEXT NOT NULL,
    "riskLevel" TEXT,
    "affectedPeople" INTEGER,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "landmark" TEXT,
    "photos" JSONB,
    "reportDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "assignedDepartment" TEXT,
    "assignedTeam" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "estimatedCost" REAL,
    "scheduledDate" DATETIME,
    "completionDate" DATETIME,
    "resolution" TEXT,
    "materials" JSONB,
    "workHours" REAL,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "followUp" BOOLEAN NOT NULL DEFAULT false,
    "satisfaction" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "public_problem_reports_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "public_problem_reports_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "public_problem_reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "teamName" TEXT NOT NULL,
    "teamType" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "shiftStart" TEXT,
    "shiftEnd" TEXT,
    "workDays" JSONB NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakTime" JSONB,
    "teamLead" TEXT NOT NULL,
    "members" JSONB NOT NULL,
    "equipment" JSONB,
    "vehicles" JSONB,
    "workAreas" JSONB NOT NULL,
    "dailyTasks" JSONB NOT NULL,
    "weeklyTasks" JSONB,
    "monthlyTasks" JSONB,
    "productivity" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "team_schedules_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "team_schedules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "weeding_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "requestorName" TEXT NOT NULL,
    "requestorCpf" TEXT,
    "contact" JSONB NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "areaSize" REAL,
    "terrainType" TEXT NOT NULL,
    "accessType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photos" JSONB,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferredDate" DATETIME,
    "scheduledDate" DATETIME,
    "completionDate" DATETIME,
    "assignedTeam" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "workDetails" TEXT,
    "equipmentUsed" JSONB,
    "workHours" REAL,
    "observations" TEXT,
    "satisfaction" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "weeding_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "weeding_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "weeding_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "drainage_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "requestorName" TEXT NOT NULL,
    "requestorCpf" TEXT,
    "contact" JSONB NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "problemType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photos" JSONB,
    "waterLevel" TEXT,
    "affectedArea" REAL,
    "urgency" TEXT NOT NULL DEFAULT 'HIGH',
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferredDate" DATETIME,
    "scheduledDate" DATETIME,
    "completionDate" DATETIME,
    "assignedTeam" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "workDetails" TEXT,
    "equipmentUsed" JSONB,
    "materialsUsed" JSONB,
    "workHours" REAL,
    "observations" TEXT,
    "satisfaction" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "drainage_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "drainage_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "drainage_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tree_pruning_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "requestorName" TEXT NOT NULL,
    "requestorCpf" TEXT,
    "contact" JSONB NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "treeSpecies" TEXT,
    "treeHeight" REAL,
    "trunkDiameter" REAL,
    "pruningType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photos" JSONB,
    "riskLevel" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferredDate" DATETIME,
    "scheduledDate" DATETIME,
    "completionDate" DATETIME,
    "assignedTeam" TEXT,
    "technicalVisit" BOOLEAN NOT NULL DEFAULT false,
    "visitDate" DATETIME,
    "approved" BOOLEAN,
    "approvalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "workDetails" TEXT,
    "equipmentUsed" JSONB,
    "materialRemoved" REAL,
    "workHours" REAL,
    "observations" TEXT,
    "satisfaction" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tree_pruning_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tree_pruning_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tree_pruning_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "urban_cleanings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "serviceType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT,
    "coordinates" JSONB,
    "description" TEXT NOT NULL,
    "areaSize" REAL,
    "cleaningType" TEXT NOT NULL,
    "frequency" TEXT,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" DATETIME,
    "completionDate" DATETIME,
    "assignedTeam" TEXT,
    "teamLeader" TEXT,
    "workers" JSONB,
    "equipmentUsed" JSONB,
    "vehiclesUsed" JSONB,
    "wasteCollected" REAL,
    "wasteType" JSONB,
    "photos" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "cost" REAL,
    "workHours" REAL,
    "observations" TEXT,
    "satisfaction" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "urban_cleanings_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "urban_cleanings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "service_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "teamCode" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "teamType" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "leader" TEXT NOT NULL,
    "leaderContact" JSONB,
    "members" JSONB NOT NULL,
    "totalMembers" INTEGER NOT NULL,
    "specialization" TEXT,
    "workShift" TEXT NOT NULL,
    "shiftStart" TEXT NOT NULL,
    "shiftEnd" TEXT NOT NULL,
    "workDays" JSONB NOT NULL,
    "breakTime" JSONB,
    "equipment" JSONB,
    "vehicles" JSONB,
    "workArea" TEXT,
    "coverage" JSONB,
    "productivity" JSONB,
    "performance" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hireDate" DATETIME,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "service_teams_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "service_teams_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_service_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT,
    "citizenPhone" TEXT,
    "citizenEmail" TEXT,
    "serviceType" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "address" TEXT,
    "coordinates" JSONB,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" DATETIME,
    "completionDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedTeam" TEXT,
    "assignedTo" TEXT,
    "resolution" TEXT,
    "photos" JSONB,
    "documents" JSONB,
    "cost" REAL,
    "satisfaction" INTEGER,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "public_service_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "public_service_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "public_service_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "specialized_pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "pageKey" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "secretaria" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "sections" JSONB NOT NULL,
    "services" JSONB,
    "contacts" JSONB,
    "documents" JSONB,
    "links" JSONB,
    "images" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" TEXT,
    "functions" JSONB,
    "publishDate" DATETIME,
    "lastModified" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "template" TEXT,
    "metadata" JSONB,
    "analytics" JSONB,
    "customCss" TEXT,
    "customJs" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "specialized_pages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "page_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "pageKey" TEXT,
    "date" DATETIME NOT NULL,
    "metricDate" DATETIME NOT NULL,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "averageTime" REAL,
    "bounceRate" REAL,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "formSubmissions" INTEGER NOT NULL DEFAULT 0,
    "clickEvents" JSONB,
    "searchTerms" JSONB,
    "referrers" JSONB,
    "devices" JSONB,
    "browsers" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "page_metrics_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "specialized_pages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "page_metrics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "page_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB,
    "schedule" JSONB,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "createdBy" TEXT NOT NULL,
    "modifiedBy" TEXT,
    "approvedBy" TEXT,
    "approvalDate" DATETIME,
    "rollbackData" JSONB,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "page_configurations_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "specialized_pages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "page_configurations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "agenda_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataHoraInicio" DATETIME NOT NULL,
    "dataHoraFim" DATETIME NOT NULL,
    "local" TEXT,
    "participantes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGENDADO',
    "observacoes" TEXT,
    "anexos" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agenda_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agenda_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "infrastructure_problems" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "photos" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "infrastructure_problems_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "urban_maintenance_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "photos" JSONB,
    "details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "scheduledFor" DATETIME,
    "completedAt" DATETIME,
    "completedBy" TEXT,
    "completionNotes" TEXT,
    "assignedTeam" TEXT,
    "assignedTo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "urban_maintenance_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "housing_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT NOT NULL,
    "citizenRg" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "familySize" INTEGER NOT NULL,
    "monthlyIncome" REAL,
    "familyData" JSONB,
    "currentAddress" TEXT,
    "currentSituation" TEXT,
    "requestDetails" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "analysisNotes" TEXT,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "reviewedAt" DATETIME,
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "documents" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "housing_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sports_modalities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sports_modalities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sports_modalities_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tree_authorizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantCpf" TEXT NOT NULL,
    "applicantPhone" TEXT NOT NULL,
    "authorizationType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "photos" JSONB,
    "treeCount" INTEGER NOT NULL DEFAULT 1,
    "treeSpecies" JSONB,
    "treeData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "inspectionDate" DATETIME,
    "technicalReport" JSONB,
    "inspectorId" TEXT,
    "requiresCompensation" BOOLEAN NOT NULL DEFAULT false,
    "compensationPlan" JSONB,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "executedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "organic_certifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "producerName" TEXT NOT NULL,
    "producerCpf" TEXT NOT NULL,
    "producerPhone" TEXT NOT NULL,
    "producerEmail" TEXT,
    "propertyName" TEXT,
    "propertyLocation" TEXT NOT NULL,
    "propertyArea" REAL NOT NULL,
    "coordinates" JSONB,
    "products" JSONB NOT NULL,
    "productionSystem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "certificationNumber" TEXT,
    "validFrom" DATETIME,
    "validUntil" DATETIME,
    "inspections" JSONB,
    "lastInspectionDate" DATETIME,
    "nextInspectionDate" DATETIME,
    "documents" JSONB,
    "technicalReport" JSONB,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "inspectorId" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "seed_distributions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "producerName" TEXT NOT NULL,
    "producerCpf" TEXT NOT NULL,
    "producerPhone" TEXT NOT NULL,
    "propertyLocation" TEXT NOT NULL,
    "propertyArea" REAL,
    "requestType" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedQuantity" JSONB,
    "approvalNotes" TEXT,
    "deliveryDate" DATETIME,
    "deliveredBy" TEXT,
    "deliveredItems" JSONB,
    "receivedBy" TEXT,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "soil_analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "producerName" TEXT NOT NULL,
    "producerCpf" TEXT NOT NULL,
    "producerPhone" TEXT NOT NULL,
    "propertyLocation" TEXT NOT NULL,
    "propertyArea" REAL,
    "coordinates" JSONB,
    "analysisType" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "cropIntended" TEXT,
    "sampleCount" INTEGER NOT NULL DEFAULT 1,
    "collectionDate" DATETIME,
    "collectedBy" TEXT,
    "sampleLocations" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "labId" TEXT,
    "labSentDate" DATETIME,
    "resultsDate" DATETIME,
    "results" JSONB,
    "recommendations" JSONB,
    "technicalReport" TEXT,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "analyzedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "farmer_market_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "producerName" TEXT NOT NULL,
    "producerCpf" TEXT NOT NULL,
    "producerPhone" TEXT NOT NULL,
    "producerEmail" TEXT,
    "propertyLocation" TEXT NOT NULL,
    "propertyArea" REAL,
    "products" JSONB NOT NULL,
    "productionType" TEXT NOT NULL,
    "hasOrganicCert" BOOLEAN NOT NULL DEFAULT false,
    "certificationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "registrationNumber" TEXT,
    "needsStall" BOOLEAN NOT NULL DEFAULT false,
    "stallPreference" TEXT,
    "documents" JSONB,
    "validFrom" DATETIME,
    "validUntil" DATETIME,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "inspectedBy" TEXT,
    "inspectionDate" DATETIME,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "urban_certificates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantCpf" TEXT NOT NULL,
    "applicantPhone" TEXT NOT NULL,
    "applicantEmail" TEXT,
    "certificateType" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "propertyNumber" TEXT,
    "neighborhood" TEXT NOT NULL,
    "lotNumber" TEXT,
    "blockNumber" TEXT,
    "cadastralNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "certificateNumber" TEXT,
    "zoning" TEXT,
    "landUse" TEXT,
    "restrictions" JSONB,
    "observations" TEXT,
    "issuedDate" DATETIME,
    "validUntil" DATETIME,
    "documents" JSONB,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "issuedBy" TEXT,
    "verifiedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "property_numbering" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantCpf" TEXT NOT NULL,
    "applicantPhone" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" JSONB,
    "numberingType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "currentNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "inspectionDate" DATETIME,
    "inspectorId" TEXT,
    "inspectionReport" JSONB,
    "photos" JSONB,
    "assignedNumber" TEXT,
    "assignmentDate" DATETIME,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "lot_subdivisions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerCpf" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "ownerEmail" TEXT,
    "originalAddress" TEXT NOT NULL,
    "originalLotNumber" TEXT,
    "originalBlockNumber" TEXT,
    "originalArea" REAL NOT NULL,
    "cadastralNumber" TEXT,
    "newLotsCount" INTEGER NOT NULL,
    "newLotsData" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "technicalAnalysis" JSONB,
    "meetsRequirements" BOOLEAN,
    "observations" TEXT,
    "documents" JSONB,
    "surveyPlans" JSONB,
    "surveyorName" TEXT,
    "surveyorCrea" TEXT,
    "approvalNumber" TEXT,
    "approvedDate" DATETIME,
    "registryNumber" TEXT,
    "registryDate" DATETIME,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "approvedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "police_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "occurrenceDate" DATETIME NOT NULL,
    "occurrenceTime" TEXT,
    "reporterName" TEXT,
    "reporterPhone" TEXT,
    "reporterEmail" TEXT,
    "witnessInfo" JSONB,
    "suspectInfo" JSONB,
    "photos" JSONB,
    "videos" JSONB,
    "documents" JSONB,
    "reportNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "category" TEXT,
    "assignedTo" TEXT,
    "assignedAt" DATETIME,
    "investigationNotes" JSONB,
    "resolution" TEXT,
    "resolvedAt" DATETIME,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "metadata" JSONB,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "patrol_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "area" TEXT,
    "requestedDate" DATETIME,
    "requestedTime" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "requesterName" TEXT NOT NULL,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "requesterAddress" TEXT,
    "description" TEXT NOT NULL,
    "concerns" JSONB,
    "additionalInfo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "scheduledDate" DATETIME,
    "scheduledTime" TEXT,
    "assignedUnit" TEXT,
    "assignedOfficers" JSONB,
    "patrolLog" JSONB,
    "observations" TEXT,
    "completedAt" DATETIME,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "patrol_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "patrol_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "camera_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "type" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "area" TEXT,
    "address" TEXT,
    "cameraType" TEXT,
    "quantity" INTEGER DEFAULT 1,
    "justification" TEXT NOT NULL,
    "incidentDate" DATETIME,
    "incidentTime" TEXT,
    "timeRange" JSONB,
    "incidentDescription" TEXT,
    "feasibilityStatus" TEXT,
    "technicalNotes" TEXT,
    "estimatedCost" REAL,
    "requesterName" TEXT NOT NULL,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "requesterDocument" TEXT,
    "requesterType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "scheduledDate" DATETIME,
    "installedDate" DATETIME,
    "installationTeam" TEXT,
    "cameraIds" JSONB,
    "footageDelivered" BOOLEAN DEFAULT false,
    "footageDeliveryDate" DATETIME,
    "footageNotes" TEXT,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "camera_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "camera_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "anonymous_tips" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "coordinates" JSONB,
    "suspectInfo" JSONB,
    "vehicleInfo" JSONB,
    "timeframe" TEXT,
    "frequency" TEXT,
    "hasEvidence" BOOLEAN NOT NULL DEFAULT false,
    "evidenceType" JSONB,
    "evidenceNotes" TEXT,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "dangerLevel" TEXT,
    "tipNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "assignedTo" TEXT,
    "assignedAt" DATETIME,
    "investigationLog" JSONB,
    "actionTaken" TEXT,
    "outcome" TEXT,
    "closedAt" DATETIME,
    "feedbackCode" TEXT,
    "publicUpdates" JSONB,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "anonymityLevel" TEXT NOT NULL DEFAULT 'full',
    "ipHash" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "anonymous_tips_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "anonymous_tips_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "municipal_guards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "birthDate" DATETIME,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "position" TEXT NOT NULL,
    "admissionDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "specialties" JSONB,
    "certifications" JSONB,
    "assignedVehicle" TEXT,
    "assignedRadio" TEXT,
    "assignedBadge" TEXT,
    "equipment" JSONB,
    "shift" TEXT,
    "workSchedule" JSONB,
    "availability" TEXT NOT NULL DEFAULT 'available',
    "patrolsCount" INTEGER NOT NULL DEFAULT 0,
    "incidentsCount" INTEGER NOT NULL DEFAULT 0,
    "commendations" JSONB,
    "disciplinary" JSONB,
    "notes" TEXT,
    "emergencyContact" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "municipal_guards_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "municipal_guards_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "surveillance_systems" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocolId" TEXT,
    "systemName" TEXT NOT NULL,
    "systemCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT,
    "coordinates" JSONB,
    "area" TEXT,
    "zone" TEXT,
    "manufacturer" TEXT,
    "model" TEXT,
    "installationDate" DATETIME,
    "warrantyExpires" DATETIME,
    "cameraType" TEXT,
    "resolution" TEXT,
    "hasNightVision" BOOLEAN NOT NULL DEFAULT false,
    "hasAudio" BOOLEAN NOT NULL DEFAULT false,
    "recordingDays" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'operational',
    "lastMaintenance" DATETIME,
    "nextMaintenance" DATETIME,
    "coverageArea" TEXT,
    "viewAngle" TEXT,
    "range" TEXT,
    "ipAddress" TEXT,
    "connectionType" TEXT,
    "bandwidth" TEXT,
    "isMonitored" BOOLEAN NOT NULL DEFAULT true,
    "monitoringCenter" TEXT,
    "alerts" JSONB,
    "incidentsDetected" INTEGER NOT NULL DEFAULT 0,
    "maintenanceHistory" JSONB,
    "downtimeHours" REAL DEFAULT 0,
    "integratedWith" JSONB,
    "apiAccess" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "technicalSpecs" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "surveillance_systems_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "surveillance_systems_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "event_authorizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "setupDate" DATETIME,
    "setupTime" TEXT,
    "teardownTime" TEXT,
    "location" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "venue" TEXT,
    "isPublicSpace" BOOLEAN NOT NULL DEFAULT true,
    "expectedAttendees" INTEGER,
    "hasAlcohol" BOOLEAN NOT NULL DEFAULT false,
    "hasSound" BOOLEAN NOT NULL DEFAULT false,
    "soundLevel" TEXT,
    "organizerName" TEXT NOT NULL,
    "organizerDocument" TEXT NOT NULL,
    "organizerPhone" TEXT NOT NULL,
    "organizerEmail" TEXT,
    "organizerType" TEXT,
    "securityPlan" TEXT,
    "privateSecurityCount" INTEGER DEFAULT 0,
    "needsPoliceSupport" BOOLEAN NOT NULL DEFAULT false,
    "requestedOfficers" INTEGER DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "analysisNotes" TEXT,
    "requirements" JSONB,
    "conditions" TEXT,
    "assignedOfficers" INTEGER DEFAULT 0,
    "assignedUnits" JSONB,
    "coordinatorOfficer" TEXT,
    "documents" JSONB,
    "insurance" JSONB,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "deniedReason" TEXT,
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "lost_and_found" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "distinctiveMarks" TEXT,
    "location" TEXT NOT NULL,
    "lostFoundDate" DATETIME NOT NULL,
    "lostFoundTime" TEXT,
    "photos" JSONB,
    "personName" TEXT NOT NULL,
    "personDocument" TEXT,
    "personPhone" TEXT NOT NULL,
    "personEmail" TEXT,
    "personAddress" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "matchedWith" TEXT,
    "matchedAt" DATETIME,
    "returnedTo" TEXT,
    "returnedAt" DATETIME,
    "returnNotes" TEXT,
    "storageLocation" TEXT,
    "storedBy" TEXT,
    "storedAt" DATETIME,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "custom_data_tables" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "allowCreate" BOOLEAN NOT NULL DEFAULT true,
    "allowUpdate" BOOLEAN NOT NULL DEFAULT true,
    "allowDelete" BOOLEAN NOT NULL DEFAULT true,
    "moduleType" TEXT,
    "schema" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "custom_data_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tableId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "protocol" TEXT,
    "serviceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    CONSTRAINT "custom_data_records_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "custom_data_tables" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_cnpj_key" ON "tenants"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "citizens_tenantId_cpf_key" ON "citizens"("tenantId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE UNIQUE INDEX "family_compositions_tenantId_headId_memberId_key" ON "family_compositions"("tenantId", "headId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "protocols_simplified_number_key" ON "protocols_simplified"("number");

-- CreateIndex
CREATE INDEX "protocol_interactions_protocolId_createdAt_idx" ON "protocol_interactions"("protocolId", "createdAt");

-- CreateIndex
CREATE INDEX "protocol_documents_protocolId_documentType_idx" ON "protocol_documents"("protocolId", "documentType");

-- CreateIndex
CREATE INDEX "protocol_pendings_protocolId_status_idx" ON "protocol_pendings"("protocolId", "status");

-- CreateIndex
CREATE INDEX "analytics_tenantId_type_metric_period_idx" ON "analytics"("tenantId", "type", "metric", "period");

-- CreateIndex
CREATE INDEX "analytics_tenantId_entityId_metric_idx" ON "analytics"("tenantId", "entityId", "metric");

-- CreateIndex
CREATE INDEX "analytics_tenantId_periodType_createdAt_idx" ON "analytics"("tenantId", "periodType", "createdAt");

-- CreateIndex
CREATE INDEX "kpis_tenantId_category_isActive_idx" ON "kpis"("tenantId", "category", "isActive");

-- CreateIndex
CREATE INDEX "kpis_tenantId_updateFrequency_idx" ON "kpis"("tenantId", "updateFrequency");

-- CreateIndex
CREATE INDEX "reports_tenantId_type_isActive_idx" ON "reports"("tenantId", "type", "isActive");

-- CreateIndex
CREATE INDEX "reports_tenantId_createdBy_idx" ON "reports"("tenantId", "createdBy");

-- CreateIndex
CREATE INDEX "report_executions_reportId_status_idx" ON "report_executions"("reportId", "status");

-- CreateIndex
CREATE INDEX "report_executions_executedBy_startedAt_idx" ON "report_executions"("executedBy", "startedAt");

-- CreateIndex
CREATE INDEX "dashboards_tenantId_userLevel_isActive_idx" ON "dashboards"("tenantId", "userLevel", "isActive");

-- CreateIndex
CREATE INDEX "dashboards_tenantId_createdBy_idx" ON "dashboards"("tenantId", "createdBy");

-- CreateIndex
CREATE INDEX "alerts_tenantId_type_isActive_idx" ON "alerts"("tenantId", "type", "isActive");

-- CreateIndex
CREATE INDEX "alerts_tenantId_metric_isActive_idx" ON "alerts"("tenantId", "metric", "isActive");

-- CreateIndex
CREATE INDEX "alert_triggers_alertId_triggeredAt_idx" ON "alert_triggers"("alertId", "triggeredAt");

-- CreateIndex
CREATE INDEX "alert_triggers_isResolved_triggeredAt_idx" ON "alert_triggers"("isResolved", "triggeredAt");

-- CreateIndex
CREATE INDEX "metric_cache_tenantId_expiresAt_idx" ON "metric_cache"("tenantId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "metric_cache_tenantId_cacheKey_key" ON "metric_cache"("tenantId", "cacheKey");

-- CreateIndex
CREATE INDEX "benchmarks_metric_region_population_idx" ON "benchmarks"("metric", "region", "population");

-- CreateIndex
CREATE INDEX "benchmarks_category_year_idx" ON "benchmarks"("category", "year");

-- CreateIndex
CREATE INDEX "predictions_tenantId_model_entityType_idx" ON "predictions"("tenantId", "model", "entityType");

-- CreateIndex
CREATE INDEX "predictions_tenantId_createdAt_idx" ON "predictions"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_servers_tenantId_key" ON "email_servers"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "email_domains_emailServerId_domainName_key" ON "email_domains"("emailServerId", "domainName");

-- CreateIndex
CREATE UNIQUE INDEX "email_users_emailServerId_email_key" ON "email_users"("emailServerId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "emails_messageId_key" ON "emails"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "email_stats_emailServerId_date_key" ON "email_stats"("emailServerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_tenantId_name_key" ON "email_templates"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_tenantId_provider_key" ON "integrations"("tenantId", "provider");

-- CreateIndex
CREATE INDEX "integration_logs_integrationId_status_idx" ON "integration_logs"("integrationId", "status");

-- CreateIndex
CREATE INDEX "integration_logs_entityType_entityId_idx" ON "integration_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "cache_entries_key_key" ON "cache_entries"("key");

-- CreateIndex
CREATE INDEX "cache_entries_expiresAt_idx" ON "cache_entries"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_idx" ON "audit_logs"("tenantId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_citizenId_idx" ON "audit_logs"("citizenId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "rural_producers_citizenId_idx" ON "rural_producers"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "rural_producers_tenantId_document_key" ON "rural_producers"("tenantId", "document");

-- CreateIndex
CREATE UNIQUE INDEX "rural_producers_tenantId_citizenId_key" ON "rural_producers"("tenantId", "citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "email_subscriptions_email_key" ON "email_subscriptions"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cultural_attendances_protocol_key" ON "cultural_attendances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "public_schools_code_key" ON "public_schools"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sports_attendances_protocol_key" ON "sports_attendances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "health_attendances_protocol_key" ON "health_attendances"("protocol");

-- CreateIndex
CREATE INDEX "medication_dispensing_tenantId_patientId_idx" ON "medication_dispensing"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "medication_dispensing_tenantId_dispensedAt_idx" ON "medication_dispensing"("tenantId", "dispensedAt");

-- CreateIndex
CREATE INDEX "medication_dispensing_tenantId_medication_idx" ON "medication_dispensing"("tenantId", "medication");

-- CreateIndex
CREATE INDEX "vaccinations_tenantId_patientId_idx" ON "vaccinations"("tenantId", "patientId");

-- CreateIndex
CREATE INDEX "vaccinations_tenantId_appliedAt_idx" ON "vaccinations"("tenantId", "appliedAt");

-- CreateIndex
CREATE INDEX "vaccinations_tenantId_vaccine_idx" ON "vaccinations"("tenantId", "vaccine");

-- CreateIndex
CREATE INDEX "cultural_spaces_tenantId_type_idx" ON "cultural_spaces"("tenantId", "type");

-- CreateIndex
CREATE INDEX "cultural_spaces_tenantId_status_idx" ON "cultural_spaces"("tenantId", "status");

-- CreateIndex
CREATE INDEX "cultural_spaces_tenantId_available_idx" ON "cultural_spaces"("tenantId", "available");

-- CreateIndex
CREATE INDEX "cultural_spaces_tenantId_neighborhood_idx" ON "cultural_spaces"("tenantId", "neighborhood");

-- CreateIndex
CREATE UNIQUE INDEX "cultural_spaces_tenantId_code_key" ON "cultural_spaces"("tenantId", "code");

-- CreateIndex
CREATE INDEX "cultural_events_tenantId_category_idx" ON "cultural_events"("tenantId", "category");

-- CreateIndex
CREATE INDEX "cultural_events_tenantId_status_idx" ON "cultural_events"("tenantId", "status");

-- CreateIndex
CREATE INDEX "cultural_events_tenantId_startDate_idx" ON "cultural_events"("tenantId", "startDate");

-- CreateIndex
CREATE INDEX "cultural_events_tenantId_spaceId_idx" ON "cultural_events"("tenantId", "spaceId");

-- CreateIndex
CREATE INDEX "cultural_events_tenantId_freeEvent_idx" ON "cultural_events"("tenantId", "freeEvent");

-- CreateIndex
CREATE UNIQUE INDEX "housing_attendances_protocol_key" ON "housing_attendances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "health_doctors_tenantId_crm_key" ON "health_doctors"("tenantId", "crm");

-- CreateIndex
CREATE UNIQUE INDEX "medical_specialties_tenantId_code_key" ON "medical_specialties"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "health_professionals_tenantId_crm_key" ON "health_professionals"("tenantId", "crm");

-- CreateIndex
CREATE UNIQUE INDEX "vulnerable_families_citizenId_key" ON "vulnerable_families"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "schools_tenantId_code_key" ON "schools"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "students_tenantId_cpf_key" ON "students"("tenantId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollments_studentId_classId_year_key" ON "student_enrollments"("studentId", "classId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "student_attendances_studentId_classId_date_key" ON "student_attendances"("studentId", "classId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "athletes_tenantId_cpf_key" ON "athletes"("tenantId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "patients_tenantId_cpf_key" ON "patients"("tenantId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "community_health_agents_tenantId_cpf_key" ON "community_health_agents"("tenantId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "security_occurrences_protocol_key" ON "security_occurrences"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "security_attendances_protocol_key" ON "security_attendances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "tourism_attendances_protocol_key" ON "tourism_attendances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "tourism_guides_tenantId_cpf_key" ON "tourism_guides"("tenantId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "environmental_licenses_licenseNumber_key" ON "environmental_licenses"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "environmental_complaints_protocol_key" ON "environmental_complaints"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "environmental_attendances_protocol_key" ON "environmental_attendances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "tree_cutting_authorizations_authorizationNumber_key" ON "tree_cutting_authorizations"("authorizationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "environmental_inspections_inspectionNumber_key" ON "environmental_inspections"("inspectionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "technical_assistances_protocol_key" ON "technical_assistances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "agriculture_attendances_protocol_key" ON "agriculture_attendances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "housing_applications_protocol_key" ON "housing_applications"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "housing_units_unitCode_key" ON "housing_units"("unitCode");

-- CreateIndex
CREATE UNIQUE INDEX "land_regularizations_protocol_key" ON "land_regularizations"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "rent_assistances_protocol_key" ON "rent_assistances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "social_assistance_attendances_protocol_key" ON "social_assistance_attendances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "work_inspections_protocol_key" ON "work_inspections"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "public_works_attendances_protocol_key" ON "public_works_attendances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "road_repair_requests_protocol_key" ON "road_repair_requests"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "technical_inspections_protocol_key" ON "technical_inspections"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "public_service_requests_protocol_key" ON "public_service_requests"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "street_lightings_pointCode_key" ON "street_lightings"("pointCode");

-- CreateIndex
CREATE UNIQUE INDEX "public_problem_reports_protocol_key" ON "public_problem_reports"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "service_teams_teamCode_key" ON "service_teams"("teamCode");

-- CreateIndex
CREATE UNIQUE INDEX "specialized_pages_tenantId_pageKey_key" ON "specialized_pages"("tenantId", "pageKey");

-- CreateIndex
CREATE UNIQUE INDEX "specialized_pages_tenantId_code_key" ON "specialized_pages"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "page_metrics_tenantId_pageId_date_key" ON "page_metrics"("tenantId", "pageId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "page_configurations_tenantId_pageId_key_key" ON "page_configurations"("tenantId", "pageId", "key");

-- CreateIndex
CREATE INDEX "agenda_events_tenantId_idx" ON "agenda_events"("tenantId");

-- CreateIndex
CREATE INDEX "agenda_events_dataHoraInicio_idx" ON "agenda_events"("dataHoraInicio");

-- CreateIndex
CREATE INDEX "agenda_events_status_idx" ON "agenda_events"("status");

-- CreateIndex
CREATE INDEX "infrastructure_problems_tenantId_idx" ON "infrastructure_problems"("tenantId");

-- CreateIndex
CREATE INDEX "infrastructure_problems_type_idx" ON "infrastructure_problems"("type");

-- CreateIndex
CREATE INDEX "infrastructure_problems_status_idx" ON "infrastructure_problems"("status");

-- CreateIndex
CREATE INDEX "urban_maintenance_requests_tenantId_idx" ON "urban_maintenance_requests"("tenantId");

-- CreateIndex
CREATE INDEX "urban_maintenance_requests_type_idx" ON "urban_maintenance_requests"("type");

-- CreateIndex
CREATE INDEX "urban_maintenance_requests_status_idx" ON "urban_maintenance_requests"("status");

-- CreateIndex
CREATE INDEX "housing_requests_tenantId_idx" ON "housing_requests"("tenantId");

-- CreateIndex
CREATE INDEX "housing_requests_type_idx" ON "housing_requests"("type");

-- CreateIndex
CREATE INDEX "housing_requests_status_idx" ON "housing_requests"("status");

-- CreateIndex
CREATE INDEX "housing_requests_citizenCpf_idx" ON "housing_requests"("citizenCpf");

-- CreateIndex
CREATE INDEX "sports_modalities_tenantId_idx" ON "sports_modalities"("tenantId");

-- CreateIndex
CREATE INDEX "tree_authorizations_tenantId_idx" ON "tree_authorizations"("tenantId");

-- CreateIndex
CREATE INDEX "tree_authorizations_protocol_idx" ON "tree_authorizations"("protocol");

-- CreateIndex
CREATE INDEX "tree_authorizations_status_idx" ON "tree_authorizations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "organic_certifications_certificationNumber_key" ON "organic_certifications"("certificationNumber");

-- CreateIndex
CREATE INDEX "organic_certifications_tenantId_idx" ON "organic_certifications"("tenantId");

-- CreateIndex
CREATE INDEX "organic_certifications_protocol_idx" ON "organic_certifications"("protocol");

-- CreateIndex
CREATE INDEX "organic_certifications_status_idx" ON "organic_certifications"("status");

-- CreateIndex
CREATE INDEX "seed_distributions_tenantId_idx" ON "seed_distributions"("tenantId");

-- CreateIndex
CREATE INDEX "seed_distributions_protocol_idx" ON "seed_distributions"("protocol");

-- CreateIndex
CREATE INDEX "seed_distributions_status_idx" ON "seed_distributions"("status");

-- CreateIndex
CREATE INDEX "soil_analyses_tenantId_idx" ON "soil_analyses"("tenantId");

-- CreateIndex
CREATE INDEX "soil_analyses_protocol_idx" ON "soil_analyses"("protocol");

-- CreateIndex
CREATE INDEX "soil_analyses_status_idx" ON "soil_analyses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "farmer_market_registrations_registrationNumber_key" ON "farmer_market_registrations"("registrationNumber");

-- CreateIndex
CREATE INDEX "farmer_market_registrations_tenantId_idx" ON "farmer_market_registrations"("tenantId");

-- CreateIndex
CREATE INDEX "farmer_market_registrations_protocol_idx" ON "farmer_market_registrations"("protocol");

-- CreateIndex
CREATE INDEX "farmer_market_registrations_status_idx" ON "farmer_market_registrations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "urban_certificates_certificateNumber_key" ON "urban_certificates"("certificateNumber");

-- CreateIndex
CREATE INDEX "urban_certificates_tenantId_idx" ON "urban_certificates"("tenantId");

-- CreateIndex
CREATE INDEX "urban_certificates_protocol_idx" ON "urban_certificates"("protocol");

-- CreateIndex
CREATE INDEX "urban_certificates_status_idx" ON "urban_certificates"("status");

-- CreateIndex
CREATE INDEX "urban_certificates_certificateType_idx" ON "urban_certificates"("certificateType");

-- CreateIndex
CREATE INDEX "property_numbering_tenantId_idx" ON "property_numbering"("tenantId");

-- CreateIndex
CREATE INDEX "property_numbering_protocol_idx" ON "property_numbering"("protocol");

-- CreateIndex
CREATE INDEX "property_numbering_status_idx" ON "property_numbering"("status");

-- CreateIndex
CREATE INDEX "lot_subdivisions_tenantId_idx" ON "lot_subdivisions"("tenantId");

-- CreateIndex
CREATE INDEX "lot_subdivisions_protocol_idx" ON "lot_subdivisions"("protocol");

-- CreateIndex
CREATE INDEX "lot_subdivisions_status_idx" ON "lot_subdivisions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "police_reports_reportNumber_key" ON "police_reports"("reportNumber");

-- CreateIndex
CREATE INDEX "police_reports_tenantId_idx" ON "police_reports"("tenantId");

-- CreateIndex
CREATE INDEX "police_reports_status_idx" ON "police_reports"("status");

-- CreateIndex
CREATE INDEX "police_reports_type_idx" ON "police_reports"("type");

-- CreateIndex
CREATE INDEX "police_reports_reportNumber_idx" ON "police_reports"("reportNumber");

-- CreateIndex
CREATE INDEX "police_reports_occurrenceDate_idx" ON "police_reports"("occurrenceDate");

-- CreateIndex
CREATE INDEX "patrol_requests_tenantId_idx" ON "patrol_requests"("tenantId");

-- CreateIndex
CREATE INDEX "patrol_requests_status_idx" ON "patrol_requests"("status");

-- CreateIndex
CREATE INDEX "patrol_requests_type_idx" ON "patrol_requests"("type");

-- CreateIndex
CREATE INDEX "patrol_requests_requestedDate_idx" ON "patrol_requests"("requestedDate");

-- CreateIndex
CREATE INDEX "camera_requests_tenantId_idx" ON "camera_requests"("tenantId");

-- CreateIndex
CREATE INDEX "camera_requests_status_idx" ON "camera_requests"("status");

-- CreateIndex
CREATE INDEX "camera_requests_type_idx" ON "camera_requests"("type");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_tips_tipNumber_key" ON "anonymous_tips"("tipNumber");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_tips_feedbackCode_key" ON "anonymous_tips"("feedbackCode");

-- CreateIndex
CREATE INDEX "anonymous_tips_tenantId_idx" ON "anonymous_tips"("tenantId");

-- CreateIndex
CREATE INDEX "anonymous_tips_status_idx" ON "anonymous_tips"("status");

-- CreateIndex
CREATE INDEX "anonymous_tips_type_idx" ON "anonymous_tips"("type");

-- CreateIndex
CREATE INDEX "anonymous_tips_tipNumber_idx" ON "anonymous_tips"("tipNumber");

-- CreateIndex
CREATE INDEX "anonymous_tips_feedbackCode_idx" ON "anonymous_tips"("feedbackCode");

-- CreateIndex
CREATE UNIQUE INDEX "municipal_guards_badge_key" ON "municipal_guards"("badge");

-- CreateIndex
CREATE INDEX "municipal_guards_tenantId_idx" ON "municipal_guards"("tenantId");

-- CreateIndex
CREATE INDEX "municipal_guards_status_idx" ON "municipal_guards"("status");

-- CreateIndex
CREATE INDEX "municipal_guards_badge_idx" ON "municipal_guards"("badge");

-- CreateIndex
CREATE UNIQUE INDEX "surveillance_systems_systemCode_key" ON "surveillance_systems"("systemCode");

-- CreateIndex
CREATE INDEX "surveillance_systems_tenantId_idx" ON "surveillance_systems"("tenantId");

-- CreateIndex
CREATE INDEX "surveillance_systems_status_idx" ON "surveillance_systems"("status");

-- CreateIndex
CREATE INDEX "surveillance_systems_type_idx" ON "surveillance_systems"("type");

-- CreateIndex
CREATE INDEX "surveillance_systems_systemCode_idx" ON "surveillance_systems"("systemCode");

-- CreateIndex
CREATE INDEX "event_authorizations_tenantId_idx" ON "event_authorizations"("tenantId");

-- CreateIndex
CREATE INDEX "event_authorizations_status_idx" ON "event_authorizations"("status");

-- CreateIndex
CREATE INDEX "event_authorizations_eventDate_idx" ON "event_authorizations"("eventDate");

-- CreateIndex
CREATE INDEX "lost_and_found_tenantId_idx" ON "lost_and_found"("tenantId");

-- CreateIndex
CREATE INDEX "lost_and_found_type_idx" ON "lost_and_found"("type");

-- CreateIndex
CREATE INDEX "lost_and_found_status_idx" ON "lost_and_found"("status");

-- CreateIndex
CREATE INDEX "lost_and_found_itemType_idx" ON "lost_and_found"("itemType");

-- CreateIndex
CREATE INDEX "lost_and_found_lostFoundDate_idx" ON "lost_and_found"("lostFoundDate");

-- CreateIndex
CREATE UNIQUE INDEX "custom_data_tables_tenantId_tableName_key" ON "custom_data_tables"("tenantId", "tableName");

-- CreateIndex
CREATE INDEX "custom_data_records_tableId_idx" ON "custom_data_records"("tableId");

-- CreateIndex
CREATE INDEX "custom_data_records_protocol_idx" ON "custom_data_records"("protocol");

-- CreateIndex
CREATE INDEX "custom_data_records_serviceId_idx" ON "custom_data_records"("serviceId");
