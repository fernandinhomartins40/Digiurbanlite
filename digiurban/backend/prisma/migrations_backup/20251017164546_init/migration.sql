-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "domain" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'STARTER',
    "status" TEXT NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" DATETIME,
    "population" INTEGER,
    "billing" JSONB,
    "limits" JSONB,
    "settings" JSONB,
    "metadata" JSONB,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME,
    CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tenantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "departments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresDocuments" BOOLEAN NOT NULL DEFAULT false,
    "requiredDocuments" JSONB,
    "estimatedDays" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT,
    "requirements" JSONB,
    "icon" TEXT,
    "color" TEXT,
    "tenantId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "services_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "password" TEXT,
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
CREATE TABLE "protocols" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VINCULADO',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "documents" JSONB,
    "attachments" TEXT,
    "tenantId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "serviceId" TEXT,
    "departmentId" TEXT,
    "specializedPageId" TEXT,
    "customData" JSONB,
    "latitude" REAL,
    "longitude" REAL,
    "endereco" TEXT,
    "assignedUserId" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "concludedAt" DATETIME,
    CONSTRAINT "protocols_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "protocols_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "protocols_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "protocols_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "protocols_specializedPageId_fkey" FOREIGN KEY ("specializedPageId") REFERENCES "specialized_pages" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "protocols_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "protocols_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "protocol_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "comment" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "protocolId" TEXT NOT NULL,
    CONSTRAINT "protocol_history_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "family_compositions_headId_fkey" FOREIGN KEY ("headId") REFERENCES "citizens" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "family_compositions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "citizens" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "protocol_evaluations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "wouldRecommend" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "protocol_evaluations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    CONSTRAINT "emails_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "email_servers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "emails_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "email_domains" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "email_users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "tenantId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "rural_producers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "rural_producers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rural_properties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "rural_properties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rural_properties_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "rural_producers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "building_permits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantCpfCnpj" TEXT,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
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
    CONSTRAINT "urban_zoning_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "project_approvals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "urban_planning_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "urban_planning_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "urban_planning_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultural_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "artistic_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "foundationDate" DATETIME,
    "responsible" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "members" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "artistic_groups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cultural_manifestations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "currentSituation" TEXT NOT NULL,
    "knowledgeHolders" JSONB,
    "safeguardActions" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
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
CREATE TABLE "cultural_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "budget" REAL,
    "currentStatus" TEXT NOT NULL DEFAULT 'PLANNING',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultural_projects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "school_calls_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_calls_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public_schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sports_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sports_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "medication_dispensing_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "medication_dispensing_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vaccinations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "vaccinations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vaccinations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "vaccination_campaigns" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vaccinations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultural_spaces_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cultural_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultural_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cultural_events_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "cultural_spaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cultural_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "cultural_projects" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "housing_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "housing_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "housing_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    CONSTRAINT "housing_registrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "housing_registrations_programId_fkey" FOREIGN KEY ("programId") REFERENCES "housing_programs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "health_appointments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "health_appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "health_doctors" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    CONSTRAINT "health_professionals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "health_professionals_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "medical_specialties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "vulnerable_families_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vulnerable_families_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "benefit_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "benefit_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "benefit_requests_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "vulnerable_families" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "emergency_deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "emergency_deliveries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "emergency_deliveries_benefitRequestId_fkey" FOREIGN KEY ("benefitRequestId") REFERENCES "benefit_requests" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "emergency_deliveries_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "home_visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "home_visits_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "home_visits_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "vulnerable_families" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "home_visits_socialWorkerId_fkey" FOREIGN KEY ("socialWorkerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_works" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "students_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "school_classes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "student_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school_classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "student_attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_attendances_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school_classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_transports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "vehicle" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "shift" TEXT NOT NULL,
    "stops" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "school_meals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "schoolId" TEXT,
    "date" DATETIME NOT NULL,
    "shift" TEXT NOT NULL,
    "menu" JSONB NOT NULL,
    "studentsServed" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_meals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_meals_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    CONSTRAINT "school_incidents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_incidents_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school_classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "school_events_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "school_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "athletes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "athletes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "athletes_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "sport_modalities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tourist_attractions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "openingHours" TEXT,
    "ticketPrice" REAL,
    "accessibility" JSONB,
    "amenities" JSONB,
    "images" JSONB,
    "rating" REAL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tourist_attractions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_transports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "health_transports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medication_dispenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "medication_dispenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "campaign_enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "campaign_enrollments_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "health_campaigns" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "disciplinary_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "disciplinary_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sports_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sports_teams_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sports_teams_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "sport_modalities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "competitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "competitions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "competitions_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "sport_modalities" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sports_infrastructures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "sports_infrastructures_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sports_schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "sports_schools_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "security_occurrences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "security_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "security_alerts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "security_patrols" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "security_patrols_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "critical_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "critical_points_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "security_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "security_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "local_businesses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessType" TEXT NOT NULL,
    "businessInfo" JSONB,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "local_businesses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tourism_programs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tourism_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tourism_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tourism_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "environmental_licenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantCpf" TEXT NOT NULL,
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
    "expiryDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'UNDER_ANALYSIS',
    "conditions" JSONB,
    "technicalOpinion" TEXT,
    "analyst" TEXT,
    "fee" REAL,
    "documents" JSONB,
    "inspections" JSONB,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "environmental_licenses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "environmental_complaints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "reporterName" TEXT,
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
    "inspectionDate" DATETIME,
    "findings" TEXT,
    "actions" TEXT,
    "resolution" TEXT,
    "penalty" REAL,
    "followUp" BOOLEAN NOT NULL DEFAULT false,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "environmental_complaints_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "protected_areas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "protected_areas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "environmental_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "environmental_programs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "environmental_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "environmental_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "environmental_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "technical_assistances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "producerName" TEXT NOT NULL,
    "producerCpf" TEXT NOT NULL,
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
    "visitDate" DATETIME NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "technical_assistances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rural_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "rural_programs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rural_trainings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "housing_applications_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "housing_units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "housing_units_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "land_regularizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "land_regularizations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "social_assistance_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "social_assistance_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_assistance_attendances_socialWorkerId_fkey" FOREIGN KEY ("socialWorkerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "work_inspections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "work_inspections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_works_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "public_works_attendances_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_service_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "public_service_requests_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cleaning_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "cleaning_schedules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "street_lightings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "street_lightings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "special_collections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "special_collections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "special_collections_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "public_problem_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "public_problem_reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "public_problem_reports_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "team_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
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
    CONSTRAINT "team_schedules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
CREATE TABLE "service_generations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "functions" JSONB,
    "patterns" JSONB,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "generated" JSONB,
    "aiAnalysis" JSONB,
    "confidence" REAL,
    "serviceId" TEXT,
    "generationType" TEXT,
    "templateName" TEXT,
    "parameters" JSONB,
    "inputData" JSONB,
    "outputData" JSONB,
    "generatedBy" TEXT NOT NULL,
    "generationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "fileUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "fileType" TEXT,
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "expiryDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "service_generations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_generations_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "specialized_pages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "service_generations_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    CONSTRAINT "page_metrics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "page_metrics_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "specialized_pages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "page_configurations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "page_configurations_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "specialized_pages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "agenda_events_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "agenda_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ServiceToSpecializedPage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ServiceToSpecializedPage_A_fkey" FOREIGN KEY ("A") REFERENCES "services" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ServiceToSpecializedPage_B_fkey" FOREIGN KEY ("B") REFERENCES "specialized_pages" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_cnpj_key" ON "tenants"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_tenantId_name_key" ON "departments"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "citizens_cpf_key" ON "citizens"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "citizens_tenantId_cpf_key" ON "citizens"("tenantId", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "protocols_number_key" ON "protocols"("number");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE UNIQUE INDEX "family_compositions_tenantId_headId_memberId_key" ON "family_compositions"("tenantId", "headId", "memberId");

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
CREATE INDEX "audit_logs_tenantId_action_idx" ON "audit_logs"("tenantId", "action");

-- CreateIndex
CREATE INDEX "audit_logs_userId_timestamp_idx" ON "audit_logs"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "rural_producers_tenantId_document_key" ON "rural_producers"("tenantId", "document");

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
CREATE UNIQUE INDEX "security_occurrences_protocol_key" ON "security_occurrences"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "security_attendances_protocol_key" ON "security_attendances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "tourism_attendances_protocol_key" ON "tourism_attendances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "environmental_licenses_licenseNumber_key" ON "environmental_licenses"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "environmental_complaints_protocol_key" ON "environmental_complaints"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "environmental_attendances_protocol_key" ON "environmental_attendances"("protocol");

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
CREATE UNIQUE INDEX "social_assistance_attendances_protocol_key" ON "social_assistance_attendances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "work_inspections_protocol_key" ON "work_inspections"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "public_works_attendances_protocol_key" ON "public_works_attendances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "public_service_requests_protocol_key" ON "public_service_requests"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "street_lightings_pointCode_key" ON "street_lightings"("pointCode");

-- CreateIndex
CREATE UNIQUE INDEX "public_problem_reports_protocol_key" ON "public_problem_reports"("protocol");

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
CREATE UNIQUE INDEX "_ServiceToSpecializedPage_AB_unique" ON "_ServiceToSpecializedPage"("A", "B");

-- CreateIndex
CREATE INDEX "_ServiceToSpecializedPage_B_index" ON "_ServiceToSpecializedPage"("B");
