-- CreateEnum
CREATE TYPE "public"."InteractionType" AS ENUM ('MESSAGE', 'DOCUMENT_REQUEST', 'DOCUMENT_UPLOAD', 'PENDING_CREATED', 'PENDING_RESOLVED', 'STATUS_CHANGED', 'ASSIGNED', 'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED', 'APPROVAL', 'REJECTION', 'CANCELLATION', 'NOTE');

-- CreateEnum
CREATE TYPE "public"."DocumentStatus" AS ENUM ('PENDING', 'UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PendingType" AS ENUM ('DOCUMENT', 'INFORMATION', 'CORRECTION', 'VALIDATION', 'PAYMENT', 'INSPECTION', 'APPROVAL', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PendingStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."StageStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('GUEST', 'USER', 'COORDINATOR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "public"."ProtocolStatus" AS ENUM ('VINCULADO', 'PROGRESSO', 'ATUALIZACAO', 'CONCLUIDO', 'PENDENCIA', 'CANCELADO');

-- CreateEnum
CREATE TYPE "public"."ServiceType" AS ENUM ('INFORMATIVO', 'COM_DADOS', 'SEM_DADOS');

-- CreateEnum
CREATE TYPE "public"."TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."Plan" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."LeadSource" AS ENUM ('DEMO_REQUEST', 'TRIAL_SIGNUP', 'NEWSLETTER', 'CONTACT_FORM');

-- CreateEnum
CREATE TYPE "public"."ReportType" AS ENUM ('OPERATIONAL', 'MANAGERIAL', 'EXECUTIVE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."ReportExecutionStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."ReportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV', 'JSON');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('DEADLINE_OVERDUE', 'LOW_PERFORMANCE', 'HIGH_DEMAND', 'LOW_SATISFACTION', 'SYSTEM_OVERLOAD', 'BUDGET_ALERT');

-- CreateEnum
CREATE TYPE "public"."AlertFrequency" AS ENUM ('REALTIME', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "public"."EmailStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'COMPLAINED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "public"."EmailEventType" AS ENUM ('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'COMPLAINED', 'UNSUBSCRIBED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "public"."EmailPlan" AS ENUM ('NONE', 'BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'GOLD', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."CulturalAttendanceType" AS ENUM ('AUTHORIZATION_EVENT', 'ARTIST_REGISTRATION', 'PUBLIC_NOTICE_REGISTRATION', 'CULTURAL_SPACE_USE', 'PROJECT_SUPPORT', 'ARTISTIC_SUPPORT', 'INFORMATION', 'GENERAL_INFORMATION', 'OTHERS', 'inscricao_projeto', 'reserva_espaco', 'informacoes', 'cadastro_grupo', 'apoio_cultural', 'denuncia', 'inscricao_oficina');

-- CreateEnum
CREATE TYPE "public"."CulturalAttendanceStatus" AS ENUM ('PENDING', 'UNDER_ANALYSIS', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED', 'OPEN');

-- CreateEnum
CREATE TYPE "public"."SportsAttendanceType" AS ENUM ('EVENT_AUTHORIZATION', 'CLUB_REGISTRATION', 'ATHLETE_REGISTRATION', 'FACILITY_USE', 'PROJECT_SUPPORT', 'EQUIPMENT_REQUEST', 'TOURNAMENT_REQUEST', 'GENERAL_INFORMATION', 'OTHERS');

-- CreateEnum
CREATE TYPE "public"."SportsAttendanceStatus" AS ENUM ('PENDING', 'UNDER_ANALYSIS', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."HealthAttendanceType" AS ENUM ('APPOINTMENT_REQUEST', 'EXAM_REQUEST', 'MEDICATION_REQUEST', 'HOME_VISIT', 'VACCINATION', 'HEALTH_CERTIFICATE', 'COMPLAINT', 'GENERAL_INFORMATION', 'OTHERS');

-- CreateEnum
CREATE TYPE "public"."HealthAttendanceStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFERRED');

-- CreateEnum
CREATE TYPE "public"."HousingAttendanceType" AS ENUM ('PROGRAM_REGISTRATION', 'LOT_REQUEST', 'HOUSING_REFORM', 'DOCUMENTATION', 'COMPLAINT', 'CONSULTATION', 'GENERAL_INFORMATION', 'OTHERS');

-- CreateEnum
CREATE TYPE "public"."HousingAttendanceStatus" AS ENUM ('PENDING', 'UNDER_ANALYSIS', 'APPROVED', 'REJECTED', 'COMPLETED', 'WAITING_DOCUMENTATION');

-- CreateTable
CREATE TABLE "public"."municipio_config" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "codigoIbge" TEXT,
    "nomeMunicipio" TEXT NOT NULL,
    "ufMunicipio" TEXT NOT NULL,
    "brasao" TEXT,
    "corPrimaria" TEXT,
    "configuracoes" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    "suspensionReason" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'active',
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'basic',
    "subscriptionEnds" TIMESTAMP(3),
    "maxUsers" INTEGER NOT NULL DEFAULT 10,
    "maxCitizens" INTEGER NOT NULL DEFAULT 10000,
    "features" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "municipio_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."citizens" (
    "id" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" TIMESTAMP(3),
    "address" JSONB,
    "municipioId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "verificationStatus" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationNotes" TEXT,
    "registrationSource" TEXT NOT NULL DEFAULT 'SELF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),
    "rg" TEXT,
    "phoneSecondary" TEXT,
    "motherName" TEXT,
    "maritalStatus" TEXT,
    "occupation" TEXT,
    "familyIncome" TEXT,

    CONSTRAINT "citizens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."invoices" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "plan" "public"."Plan" NOT NULL,
    "period" TEXT NOT NULL,
    "status" "public"."InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "paymentUrl" TEXT,
    "metadata" JSONB,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "position" TEXT,
    "source" "public"."LeadSource" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."family_compositions" (
    "id" TEXT NOT NULL,
    "headId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isDependent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_compositions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services_simplified" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT NOT NULL,
    "serviceType" "public"."ServiceType" NOT NULL,
    "moduleType" TEXT,
    "formSchema" JSONB,
    "formFieldsConfig" JSONB,
    "enabledFields" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "requiresDocuments" BOOLEAN NOT NULL DEFAULT false,
    "requiredDocuments" JSONB,
    "estimatedDays" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "category" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_simplified_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."protocols_simplified" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."ProtocolStatus" NOT NULL DEFAULT 'VINCULADO',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "citizenId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "customData" JSONB,
    "moduleType" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address" TEXT,
    "documents" JSONB,
    "attachments" TEXT,
    "assignedUserId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "concludedAt" TIMESTAMP(3),

    CONSTRAINT "protocols_simplified_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."protocol_history_simplified" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "comment" TEXT,
    "oldStatus" TEXT,
    "newStatus" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "protocolId" TEXT NOT NULL,

    CONSTRAINT "protocol_history_simplified_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."protocol_evaluations_simplified" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "wouldRecommend" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_evaluations_simplified_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."protocol_interactions" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "type" "public"."InteractionType" NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "message" TEXT,
    "metadata" JSONB,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."protocol_documents" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL,
    "status" "public"."DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "uploadedAt" TIMESTAMP(3),
    "uploadedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "validatedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousDocId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."protocol_pendings" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "type" "public"."PendingType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "public"."PendingStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "blocksProgress" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_pendings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."module_workflows" (
    "id" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stages" JSONB NOT NULL,
    "defaultSLA" INTEGER,
    "rules" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_workflows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."protocol_stages" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "stageOrder" INTEGER NOT NULL,
    "status" "public"."StageStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "completedBy" TEXT,
    "result" TEXT,
    "notes" TEXT,
    "metadata" JSONB,

    CONSTRAINT "protocol_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."protocol_sla" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedEndDate" TIMESTAMP(3) NOT NULL,
    "actualEndDate" TIMESTAMP(3),
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "pausedAt" TIMESTAMP(3),
    "pausedReason" TEXT,
    "totalPausedDays" INTEGER NOT NULL DEFAULT 0,
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "daysOverdue" INTEGER NOT NULL DEFAULT 0,
    "workingDays" INTEGER NOT NULL,
    "calendarDays" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_sla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "channel" TEXT NOT NULL DEFAULT 'WEB',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "protocolId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."citizen_transfer_requests" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "documents" JSONB,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_transfer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analytics" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "dimension" TEXT,
    "period" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."protocol_metrics" (
    "id" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "totalProtocols" INTEGER NOT NULL DEFAULT 0,
    "newProtocols" INTEGER NOT NULL DEFAULT 0,
    "closedProtocols" INTEGER NOT NULL DEFAULT 0,
    "cancelledProtocols" INTEGER NOT NULL DEFAULT 0,
    "overdueProtocols" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionTime" DOUBLE PRECISION,
    "avgFirstResponse" DOUBLE PRECISION,
    "avgResolutionTime" DOUBLE PRECISION,
    "approvalRate" DOUBLE PRECISION,
    "rejectionRate" DOUBLE PRECISION,
    "satisfactionScore" DOUBLE PRECISION,
    "slaComplianceRate" DOUBLE PRECISION,
    "avgSlaDeviation" DOUBLE PRECISION,
    "totalPendings" INTEGER NOT NULL DEFAULT 0,
    "resolvedPendings" INTEGER NOT NULL DEFAULT 0,
    "avgPendingTime" DOUBLE PRECISION,
    "totalDocuments" INTEGER NOT NULL DEFAULT 0,
    "approvedDocuments" INTEGER NOT NULL DEFAULT 0,
    "rejectedDocuments" INTEGER NOT NULL DEFAULT 0,
    "documentApprovalRate" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."department_metrics" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "totalProtocols" INTEGER NOT NULL DEFAULT 0,
    "activeProtocols" INTEGER NOT NULL DEFAULT 0,
    "completedProtocols" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionTime" DOUBLE PRECISION,
    "slaComplianceRate" DOUBLE PRECISION,
    "satisfactionScore" DOUBLE PRECISION,
    "protocolsPerServer" DOUBLE PRECISION,
    "avgWorkload" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "department_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_metrics" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "completedRequests" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionTime" DOUBLE PRECISION,
    "approvalRate" DOUBLE PRECISION,
    "rejectionRate" DOUBLE PRECISION,
    "satisfactionScore" DOUBLE PRECISION,
    "complaintRate" DOUBLE PRECISION,
    "avgDocumentTime" DOUBLE PRECISION,
    "avgPendingTime" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."server_performance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "protocolsAssigned" INTEGER NOT NULL DEFAULT 0,
    "protocolsCompleted" INTEGER NOT NULL DEFAULT 0,
    "protocolsOnTime" INTEGER NOT NULL DEFAULT 0,
    "protocolsOverdue" INTEGER NOT NULL DEFAULT 0,
    "avgCompletionTime" DOUBLE PRECISION,
    "avgResponseTime" DOUBLE PRECISION,
    "totalWorkingHours" DOUBLE PRECISION,
    "satisfactionScore" DOUBLE PRECISION,
    "approvalRate" DOUBLE PRECISION,
    "pendingResolution" DOUBLE PRECISION,
    "totalInteractions" INTEGER NOT NULL DEFAULT 0,
    "avgInteractionsPerProtocol" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "server_performance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."protocol_bottlenecks" (
    "id" TEXT NOT NULL,
    "bottleneckType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityName" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodDate" TIMESTAMP(3) NOT NULL,
    "affectedProtocols" INTEGER NOT NULL DEFAULT 0,
    "avgStuckTime" DOUBLE PRECISION NOT NULL,
    "maxStuckTime" DOUBLE PRECISION NOT NULL,
    "totalDelayHours" DOUBLE PRECISION NOT NULL,
    "impactScore" DOUBLE PRECISION NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_bottlenecks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."kpis" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "formula" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "target" DOUBLE PRECISION,
    "warning" DOUBLE PRECISION,
    "critical" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "lastCalculated" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updateFrequency" TEXT NOT NULL DEFAULT 'daily',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."ReportType" NOT NULL,
    "category" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "template" TEXT,
    "schedule" JSONB,
    "accessLevel" INTEGER NOT NULL,
    "departments" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "lastRun" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."report_executions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "parameters" JSONB,
    "filters" JSONB,
    "data" JSONB,
    "format" "public"."ReportFormat" NOT NULL,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "status" "public"."ReportExecutionStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "executedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."dashboards" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "layout" JSONB NOT NULL,
    "userLevel" INTEGER NOT NULL,
    "department" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "refreshRate" INTEGER NOT NULL DEFAULT 300,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alerts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."AlertType" NOT NULL,
    "metric" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "threshold2" DOUBLE PRECISION,
    "frequency" "public"."AlertFrequency" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "cooldown" INTEGER NOT NULL DEFAULT 3600,
    "recipients" JSONB,
    "channels" JSONB,
    "lastTriggered" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alert_triggers" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_triggers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."metric_cache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metric_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."benchmarks" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "population" TEXT NOT NULL,
    "p25" DOUBLE PRECISION,
    "p50" DOUBLE PRECISION,
    "p75" DOUBLE PRECISION,
    "average" DOUBLE PRECISION,
    "sampleSize" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "source" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benchmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."predictions" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "prediction" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "horizon" TEXT NOT NULL,
    "actualValue" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedAt" TIMESTAMP(3),

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_servers" (
    "id" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "mxPort" INTEGER NOT NULL DEFAULT 25,
    "submissionPort" INTEGER NOT NULL DEFAULT 587,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isPremiumService" BOOLEAN NOT NULL DEFAULT true,
    "monthlyPrice" DECIMAL(65,30) NOT NULL DEFAULT 99.00,
    "maxEmailsPerMonth" INTEGER NOT NULL DEFAULT 10000,
    "tlsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "certPath" TEXT,
    "keyPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_domains" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_users" (
    "id" TEXT NOT NULL,
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
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emails" (
    "id" TEXT NOT NULL,
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
    "status" "public"."EmailStatus" NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_events" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "type" "public"."EmailEventType" NOT NULL,
    "data" JSONB,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_logs" (
    "id" TEXT NOT NULL,
    "emailServerId" TEXT,
    "from" TEXT,
    "to" TEXT,
    "subject" TEXT,
    "status" TEXT,
    "type" TEXT,
    "level" "public"."LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "data" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_stats" (
    "id" TEXT NOT NULL,
    "emailServerId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalSent" INTEGER NOT NULL DEFAULT 0,
    "totalDelivered" INTEGER NOT NULL DEFAULT 0,
    "totalFailed" INTEGER NOT NULL DEFAULT 0,
    "totalBounced" INTEGER NOT NULL DEFAULT 0,
    "totalComplained" INTEGER NOT NULL DEFAULT 0,
    "totalOpens" INTEGER NOT NULL DEFAULT 0,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "uniqueOpens" INTEGER NOT NULL DEFAULT 0,
    "uniqueClicks" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "email_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_auth_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_auth_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "variables" JSONB,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."integrations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "credentials" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."integration_logs" (
    "id" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "request" JSONB,
    "response" JSONB,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cache_entries" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cache_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "citizenId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT,
    "method" TEXT,
    "details" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rural_producers" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT,
    "producerName" TEXT,
    "document" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "productionType" TEXT,
    "mainCrop" TEXT,
    "dap" TEXT,
    "totalAreaHectares" DOUBLE PRECISION,
    "mainProductions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rural_producers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rural_properties" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "protocolId" TEXT,
    "producerId" TEXT,
    "owner" TEXT,
    "name" TEXT NOT NULL,
    "size" DOUBLE PRECISION NOT NULL,
    "totalArea" DOUBLE PRECISION,
    "cultivatedArea" DOUBLE PRECISION,
    "plantedArea" DOUBLE PRECISION,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "mainCrops" JSONB,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rural_properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_complaints" (
    "id" TEXT NOT NULL,
    "complainantName" TEXT,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT,
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolutionDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_consultations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "participationCount" INTEGER NOT NULL DEFAULT 0,
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."urban_zoning" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "urban_zoning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."urban_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "urban_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."business_licenses" (
    "id" TEXT NOT NULL,
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
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalDate" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "licenseNumber" TEXT,
    "observations" TEXT,
    "documents" JSONB,
    "technicalAnalysis" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "issuedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."urban_infractions" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "complainantName" TEXT,
    "complainantPhone" TEXT,
    "complainantEmail" TEXT,
    "infractionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "propertyNumber" TEXT,
    "neighborhood" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "photos" JSONB,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "submissionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectionDate" TIMESTAMP(3),
    "resolutionDate" TIMESTAMP(3),
    "assignedTo" TEXT,
    "observations" TEXT,
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "urban_infractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."email_subscriptions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "preferences" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cultural_attendances" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "type" "public"."CulturalAttendanceType" NOT NULL,
    "status" "public"."CulturalAttendanceStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "observations" TEXT,
    "responsible" TEXT,
    "attachments" JSONB,
    "subject" TEXT,
    "category" TEXT,
    "requestedLocation" TEXT,
    "eventDate" TIMESTAMP(3),
    "estimatedAudience" INTEGER,
    "requestedBudget" DOUBLE PRECISION,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "followUpDate" TIMESTAMP(3),
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cultural_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."artistic_groups" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "foundationDate" TIMESTAMP(3),
    "responsible" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "members" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artistic_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cultural_manifestations" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "currentSituation" TEXT NOT NULL,
    "knowledgeHolders" JSONB,
    "safeguardActions" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cultural_manifestations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cultural_workshops" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "instructor" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "schedule" TEXT NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "isFree" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "customFields" JSONB,
    "requiredDocuments" JSONB,
    "enrollmentSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cultural_workshops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cultural_workshop_enrollments" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "workshopId" TEXT NOT NULL,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "hasExperience" BOOLEAN NOT NULL DEFAULT false,
    "experience" TEXT,
    "motivation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "customData" JSONB,
    "documents" JSONB,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'INSCRICAO_OFICINA_CULTURAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cultural_workshop_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cultural_projects" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "currentStatus" TEXT NOT NULL DEFAULT 'PLANNING',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "protocol" TEXT,
    "contact" JSONB,
    "funding" JSONB,
    "targetAudience" TEXT,
    "participants" INTEGER,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cultural_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cultural_project_submissions" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "projectName" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsible" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization" TEXT,
    "budget" DOUBLE PRECISION NOT NULL,
    "fundingSource" TEXT,
    "targetAudience" TEXT NOT NULL,
    "expectedImpact" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "attachments" JSONB,
    "status" TEXT NOT NULL DEFAULT 'UNDER_REVIEW',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewComments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cultural_project_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_schools" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."school_calls" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "callDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedDate" TIMESTAMP(3),
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sports_attendances" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "type" "public"."SportsAttendanceType" NOT NULL,
    "serviceType" TEXT,
    "status" "public"."SportsAttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "observations" TEXT,
    "responsible" TEXT,
    "referredTo" TEXT,
    "resolution" TEXT,
    "attachments" JSONB,
    "sportType" TEXT,
    "sport" TEXT,
    "eventDate" TIMESTAMP(3),
    "location" TEXT,
    "expectedParticipants" INTEGER,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sports_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "type" TEXT NOT NULL,
    "eventType" TEXT,
    "sport" TEXT,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3),
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "location" TEXT NOT NULL,
    "capacity" INTEGER,
    "targetAudience" TEXT,
    "entryFee" DOUBLE PRECISION,
    "registrationRequired" BOOLEAN NOT NULL DEFAULT false,
    "organizer" TEXT,
    "contact" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "responsible" TEXT NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "registrationFee" DOUBLE PRECISION DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sports_clubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "foundationDate" TIMESTAMP(3),
    "president" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "members" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_attendances" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "citizenName" TEXT,
    "citizenCPF" TEXT,
    "contact" TEXT,
    "type" "public"."HealthAttendanceType" NOT NULL,
    "status" "public"."HealthAttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "observations" TEXT,
    "responsible" TEXT,
    "attachments" JSONB,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "medicalUnit" TEXT,
    "appointmentDate" TIMESTAMP(3),
    "symptoms" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "moduleType" TEXT NOT NULL DEFAULT 'ATENDIMENTOS_SAUDE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medical_appointments" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "healthUnit" TEXT,
    "preferredDate" TIMESTAMP(3),
    "preferredShift" TEXT,
    "appointmentDate" TIMESTAMP(3),
    "appointmentTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "cancellationReason" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'AGENDAMENTOS_MEDICOS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_units" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "manager" TEXT NOT NULL,
    "specialties" JSONB,
    "capacity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vaccination_campaigns" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vaccine" TEXT NOT NULL,
    "targetGroup" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "locations" JSONB,
    "goal" INTEGER,
    "achieved" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccination_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."campaign_enrollments" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "citizenName" TEXT,
    "citizenCpf" TEXT,
    "patientBirthDate" TIMESTAMP(3),
    "patientPhone" TEXT,
    "enrollmentDate" TIMESTAMP(3),
    "enrolledBy" TEXT,
    "campaignId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'enrolled',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'PROGRAMAS_SAUDE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."home_cares" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "careType" TEXT NOT NULL,
    "frequency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'ATENDIMENTO_DOMICILIAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_cares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medication_dispensing" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "patientId" TEXT NOT NULL,
    "pharmacistId" TEXT,
    "medication" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dispensedAt" TIMESTAMP(3) NOT NULL,
    "prescription" JSONB,
    "status" TEXT NOT NULL DEFAULT 'dispensed',
    "batchNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_dispensing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medication_dispenses" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "patientName" TEXT,
    "patientCpf" TEXT,
    "dispenseDate" TIMESTAMP(3),
    "pharmacistName" TEXT,
    "dispensedBy" TEXT,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "prescriptionId" TEXT,
    "unitId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'CONTROLE_MEDICAMENTOS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medication_dispenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vaccinations" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "campaignId" TEXT,
    "patientId" TEXT NOT NULL,
    "vaccine" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "appliedAt" TIMESTAMP(3) NOT NULL,
    "appliedBy" TEXT NOT NULL,
    "lotNumber" TEXT,
    "nextDose" TIMESTAMP(3),
    "moduleType" TEXT NOT NULL DEFAULT 'VACINACAO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vaccination_records" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "vaccine" TEXT NOT NULL,
    "dose" TEXT,
    "healthUnit" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "scheduledTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "cancellationReason" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'VACINACAO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vaccination_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cultural_spaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "coordinates" JSONB,
    "neighborhood" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "area" DOUBLE PRECISION,
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
    "hourlyRate" DOUBLE PRECISION,
    "dailyRate" DOUBLE PRECISION,
    "freeUse" BOOLEAN NOT NULL DEFAULT false,
    "photos" JSONB,
    "documents" JSONB,
    "observations" TEXT,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cultural_spaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cultural_space_reservations" (
    "id" TEXT NOT NULL,
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
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "expectedPeople" INTEGER NOT NULL,
    "needsEquipment" BOOLEAN NOT NULL DEFAULT false,
    "equipment" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cultural_space_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cultural_events" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "spaceId" TEXT,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "schedule" JSONB NOT NULL,
    "duration" INTEGER,
    "venue" TEXT NOT NULL,
    "address" JSONB,
    "coordinates" JSONB,
    "capacity" INTEGER NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "ageRating" TEXT,
    "ticketPrice" DOUBLE PRECISION,
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
    "approvedAt" TIMESTAMP(3),
    "promotion" JSONB,
    "media" JSONB,
    "website" TEXT,
    "socialMedia" JSONB,
    "attendance" INTEGER,
    "revenue" DOUBLE PRECISION,
    "expenses" DOUBLE PRECISION,
    "photos" JSONB,
    "videos" JSONB,
    "reviews" JSONB,
    "observations" TEXT,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cultural_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."housing_attendances" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "citizenCPF" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "type" "public"."HousingAttendanceType" NOT NULL,
    "status" "public"."HousingAttendanceStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "observations" TEXT,
    "responsible" TEXT,
    "attachments" JSONB,
    "program" TEXT,
    "documents" JSONB,
    "propertyAddress" TEXT,
    "familyIncome" DOUBLE PRECISION,
    "familySize" INTEGER,
    "currentHousing" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housing_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."housing_programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" JSONB,
    "eligibilityCriteria" JSONB,
    "benefits" JSONB,
    "maxIncome" DOUBLE PRECISION,
    "targetIncome" TEXT,
    "availableUnits" INTEGER NOT NULL DEFAULT 0,
    "registeredFamilies" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "contact" JSONB,
    "financingOptions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housing_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."housing_registrations" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "programId" TEXT NOT NULL,
    "familyHeadName" TEXT NOT NULL,
    "familyHeadCPF" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "familyIncome" DOUBLE PRECISION NOT NULL,
    "familySize" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "selectedDate" TIMESTAMP(3),
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housing_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_appointments" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "patientName" TEXT,
    "patientCpf" TEXT,
    "patientBirthDate" TIMESTAMP(3),
    "patientPhone" TEXT,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "appointmentTime" TEXT NOT NULL,
    "doctorId" TEXT,
    "speciality" TEXT NOT NULL DEFAULT 'GENERAL',
    "healthUnitId" TEXT,
    "healthUnitName" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "confirmedAt" TIMESTAMP(3),
    "symptoms" TEXT,
    "observations" TEXT,
    "diagnosis" TEXT,
    "treatment" TEXT,
    "followUpDate" TIMESTAMP(3),
    "prescriptions" JSONB,
    "examRequests" JSONB,
    "moduleType" TEXT NOT NULL DEFAULT 'AGENDAMENTOS_MEDICOS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_doctors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "crm" TEXT NOT NULL,
    "speciality" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schedule" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_doctors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medical_specialties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_professionals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "crm" TEXT,
    "specialtyId" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "schedule" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "activeIngredient" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "dosage" TEXT,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "minimumStock" INTEGER NOT NULL DEFAULT 10,
    "unitPrice" DOUBLE PRECISION,
    "supplier" TEXT,
    "expirationDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vulnerable_families" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "familyCode" TEXT,
    "responsibleName" TEXT,
    "memberCount" INTEGER NOT NULL,
    "monthlyIncome" DOUBLE PRECISION,
    "riskLevel" TEXT NOT NULL DEFAULT 'LOW',
    "vulnerabilityType" TEXT NOT NULL,
    "socialWorker" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "observations" TEXT,
    "lastVisitDate" TIMESTAMP(3),
    "nextVisitDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vulnerable_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."benefit_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "familyId" TEXT NOT NULL,
    "benefitType" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "reason" TEXT NOT NULL,
    "documentsProvided" JSONB,
    "approvedBy" TEXT,
    "approvedDate" TIMESTAMP(3),
    "deliveredDate" TIMESTAMP(3),
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benefit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emergency_deliveries" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "benefitRequestId" TEXT,
    "citizenId" TEXT,
    "deliveryType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientSignature" TEXT,
    "deliveredBy" TEXT NOT NULL,
    "urgency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emergency_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."home_visits" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "familyId" TEXT NOT NULL,
    "socialWorkerId" TEXT,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "socialWorker" TEXT NOT NULL,
    "visitType" TEXT NOT NULL DEFAULT 'ROUTINE',
    "visitPurpose" TEXT NOT NULL,
    "purpose" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "nextVisitDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_works" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "contractor" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "plannedBudget" DOUBLE PRECISION,
    "actualBudget" DOUBLE PRECISION,
    "budget" JSONB,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "beneficiaries" INTEGER,
    "photos" JSONB,
    "documents" JSONB,
    "timeline" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_works_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."schools" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."students" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "studentName" TEXT,
    "studentBirthDate" TIMESTAMP(3),
    "studentCpf" TEXT,
    "parentName" TEXT,
    "parentPhone" TEXT,
    "parentEmail" TEXT,
    "schoolId" TEXT NOT NULL,
    "medicalInfo" JSONB,
    "specialNeeds" TEXT,
    "bloodType" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "moduleType" TEXT NOT NULL DEFAULT 'MATRICULA_ALUNO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."school_classes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "maxStudents" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "schoolId" TEXT,
    "grade" TEXT,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ativo',
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_enrollment_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentBirthDate" TIMESTAMP(3) NOT NULL,
    "studentCpf" TEXT,
    "schoolId" TEXT,
    "schoolName" TEXT,
    "grade" TEXT NOT NULL,
    "shift" TEXT,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'MATRICULA_ALUNO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_enrollment_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."school_transport_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentCpf" TEXT,
    "studentBirthDate" TIMESTAMP(3),
    "route" TEXT,
    "shift" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'TRANSPORTE_ESCOLAR_SOLICITACAO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_transport_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."school_meal_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentCpf" TEXT,
    "shift" TEXT NOT NULL,
    "dietType" TEXT NOT NULL,
    "restrictions" TEXT,
    "medicalCert" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'MERENDA_DIETA_ESPECIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_meal_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."school_transfer_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentCpf" TEXT,
    "currentSchool" TEXT,
    "targetSchool" TEXT,
    "targetSchoolName" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "documents" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'TRANSFERENCIA_ESCOLAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_transfer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."school_material_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentCpf" TEXT,
    "grade" TEXT NOT NULL,
    "schoolId" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'MATERIAL_ESCOLAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_material_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_attendances" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "present" BOOLEAN NOT NULL,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."school_transports" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "route" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "vehicle" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "shift" TEXT NOT NULL,
    "stops" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "moduleType" TEXT NOT NULL DEFAULT 'TRANSPORTE_ESCOLAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_transports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."school_meals" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "schoolId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "shift" TEXT NOT NULL,
    "menu" JSONB NOT NULL,
    "studentsServed" INTEGER NOT NULL DEFAULT 0,
    "cost" DOUBLE PRECISION,
    "moduleType" TEXT NOT NULL DEFAULT 'GESTAO_MERENDA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."school_incidents" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'media',
    "actionTaken" TEXT,
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."school_events" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "type" TEXT NOT NULL,
    "schoolId" TEXT,
    "isHoliday" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."education_attendances" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "attendanceType" TEXT,
    "category" TEXT,
    "serviceType" TEXT NOT NULL,
    "studentName" TEXT,
    "studentCpf" TEXT,
    "studentBirthDate" TIMESTAMP(3),
    "studentRelationship" TEXT,
    "schoolId" TEXT,
    "schoolName" TEXT,
    "grade" TEXT,
    "shift" TEXT,
    "subject" TEXT,
    "description" TEXT NOT NULL,
    "requestedServices" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "urgency" TEXT,
    "hasDocuments" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'ATENDIMENTOS_EDUCACAO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."school_documents" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "requestorName" TEXT,
    "requestorCpf" TEXT,
    "requestorPhone" TEXT,
    "requestorEmail" TEXT,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "studentCpf" TEXT,
    "studentBirthDate" TIMESTAMP(3),
    "relationshipToStudent" TEXT,
    "schoolId" TEXT,
    "schoolName" TEXT,
    "lastGrade" TEXT,
    "lastYear" INTEGER,
    "documentType" TEXT NOT NULL,
    "documentSubtype" TEXT,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "purpose" TEXT,
    "purposeDetails" TEXT,
    "requestedYears" JSONB,
    "requestedPeriods" JSONB,
    "deliveryMethod" TEXT,
    "deliveryAddress" TEXT,
    "pickupPersonName" TEXT,
    "pickupPersonCpf" TEXT,
    "pickupPersonRelationship" TEXT,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "urgencyReason" TEXT,
    "expectedDeliveryDate" TIMESTAMP(3),
    "hasFee" BOOLEAN NOT NULL DEFAULT false,
    "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feeStatus" TEXT,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "fileUrl" TEXT,
    "observations" TEXT,
    "internalNotes" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."student_transfers" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "currentSchool" TEXT NOT NULL,
    "targetSchool" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "transferReason" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transferDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "documents" JSONB,
    "observations" TEXT,
    "approvedBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'TRANSFERENCIA_ESCOLAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."attendance_records" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "studentCpf" TEXT,
    "schoolId" TEXT,
    "schoolName" TEXT,
    "classId" TEXT,
    "className" TEXT,
    "grade" TEXT,
    "shift" TEXT,
    "periodType" TEXT,
    "referenceMonth" INTEGER,
    "referenceYear" INTEGER,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "totalDays" INTEGER NOT NULL,
    "presentDays" INTEGER NOT NULL,
    "absentDays" INTEGER NOT NULL,
    "justifiedAbsences" INTEGER NOT NULL DEFAULT 0,
    "unjustifiedAbsences" INTEGER NOT NULL DEFAULT 0,
    "percentage" DOUBLE PRECISION NOT NULL,
    "attendancePercentage" DOUBLE PRECISION,
    "absenceDetails" JSONB,
    "hasLowAttendance" BOOLEAN NOT NULL DEFAULT false,
    "lowAttendanceThreshold" DOUBLE PRECISION,
    "requiresIntervention" BOOLEAN NOT NULL DEFAULT false,
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,
    "parentNotificationDate" TIMESTAMP(3),
    "interventionPlan" TEXT,
    "requestedById" TEXT,
    "requestedByName" TEXT,
    "requestedByRole" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "observations" TEXT,
    "teacherNotes" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'CONSULTA_FREQUENCIA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."grade_records" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "studentCpf" TEXT,
    "schoolId" TEXT,
    "schoolName" TEXT,
    "classId" TEXT,
    "className" TEXT,
    "gradeLevel" TEXT,
    "shift" TEXT,
    "periodType" TEXT,
    "periodNumber" INTEGER,
    "academicYear" INTEGER,
    "period" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "grade" DOUBLE PRECISION NOT NULL,
    "maxGrade" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "subjects" JSONB,
    "totalSubjects" INTEGER NOT NULL DEFAULT 0,
    "averageGrade" DOUBLE PRECISION,
    "passedSubjects" INTEGER NOT NULL DEFAULT 0,
    "failedSubjects" INTEGER NOT NULL DEFAULT 0,
    "passingGrade" DOUBLE PRECISION NOT NULL DEFAULT 6.0,
    "studentStatus" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "hasRecovery" BOOLEAN NOT NULL DEFAULT false,
    "recoverySubjects" JSONB,
    "overallAttendancePercentage" DOUBLE PRECISION,
    "teacherComments" TEXT,
    "councilComments" TEXT,
    "teacherName" TEXT,
    "requestedById" TEXT,
    "requestedByName" TEXT,
    "requestedByRole" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "observations" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."school_management" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "requestType" TEXT,
    "category" TEXT,
    "managementType" TEXT NOT NULL,
    "schoolId" TEXT,
    "schoolName" TEXT NOT NULL,
    "schoolType" TEXT,
    "subject" TEXT,
    "description" TEXT NOT NULL,
    "managementArea" TEXT,
    "affectedPeople" INTEGER NOT NULL DEFAULT 0,
    "affectedClasses" INTEGER NOT NULL DEFAULT 0,
    "estimatedBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proposedSolution" TEXT,
    "requiresEquipment" BOOLEAN NOT NULL DEFAULT false,
    "requiredEquipment" JSONB,
    "requiresStaff" BOOLEAN NOT NULL DEFAULT false,
    "requiredStaffType" TEXT,
    "requiresInfrastructure" BOOLEAN NOT NULL DEFAULT false,
    "infrastructureDetails" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "urgencyLevel" TEXT,
    "expectedImplementationDate" TIMESTAMP(3),
    "justification" TEXT,
    "requiresSecretaryApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresBudgetApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresCouncilApproval" BOOLEAN NOT NULL DEFAULT false,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "documents" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "assignedTo" TEXT,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedDate" TIMESTAMP(3),
    "observations" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_management_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."athletes" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
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
    "federationExpiry" TIMESTAMP(3),
    "medicalCertificate" JSONB,
    "modalityId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "athletes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tourist_attractions" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT,
    "coordinates" JSONB,
    "openingHours" TEXT,
    "ticketPrice" DOUBLE PRECISION,
    "accessibility" JSONB,
    "amenities" JSONB,
    "images" JSONB,
    "rating" DOUBLE PRECISION,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "freeEntry" BOOLEAN NOT NULL DEFAULT false,
    "protocol" TEXT,
    "city" TEXT,
    "serviceId" TEXT,
    "state" TEXT,
    "facilities" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tourist_attractions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_transports" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "transportType" TEXT NOT NULL,
    "transportDate" TIMESTAMP(3),
    "transportTime" TEXT,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "origin" TEXT NOT NULL,
    "originAddress" TEXT,
    "originNeighborhood" TEXT,
    "originReference" TEXT,
    "destination" TEXT NOT NULL,
    "destinationType" TEXT,
    "destinationAddress" TEXT,
    "destinationName" TEXT,
    "destinationCity" TEXT,
    "reason" TEXT,
    "urgencyLevel" TEXT NOT NULL,
    "medicalCondition" TEXT,
    "requiresOxygen" BOOLEAN NOT NULL DEFAULT false,
    "requiresStretcher" BOOLEAN NOT NULL DEFAULT false,
    "requiresWheelchair" BOOLEAN NOT NULL DEFAULT false,
    "hasCompanion" BOOLEAN NOT NULL DEFAULT false,
    "companionName" TEXT,
    "companionPhone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "confirmedAt" TIMESTAMP(3),
    "observations" TEXT,
    "specialInstructions" TEXT,
    "responsibleDriver" TEXT,
    "vehicleId" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'TRANSPORTE_PACIENTES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_transports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_campaigns" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "campaignType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "goals" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "coordinatorName" TEXT NOT NULL,
    "budget" DOUBLE PRECISION,
    "results" JSONB,
    "moduleType" TEXT NOT NULL DEFAULT 'CAMPANHAS_SAUDE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_programs" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "coordinatorName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "goals" JSONB,
    "participants" INTEGER NOT NULL DEFAULT 0,
    "budget" DOUBLE PRECISION,
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'PROGRAMAS_SAUDE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_exams" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" TIMESTAMP(3),
    "resultDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "requestedBy" TEXT NOT NULL,
    "requestedById" TEXT,
    "healthUnit" TEXT,
    "healthUnitId" TEXT,
    "laboratory" TEXT,
    "observations" TEXT,
    "result" TEXT,
    "resultValue" TEXT,
    "resultUnit" TEXT,
    "referenceValue" TEXT,
    "attachments" JSONB,
    "files" JSONB,
    "moduleType" TEXT NOT NULL DEFAULT 'EXAMES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."medical_exams" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "healthUnit" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'EXAMES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_transport_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "requestType" TEXT,
    "specialty" TEXT,
    "referringDoctor" TEXT,
    "referringUnit" TEXT,
    "destinationCity" TEXT,
    "destinationState" TEXT,
    "destinationHospital" TEXT,
    "diagnosis" TEXT,
    "medicalJustification" TEXT,
    "urgencyLevel" TEXT NOT NULL DEFAULT 'NORMAL',
    "hasMedicalReport" BOOLEAN NOT NULL DEFAULT false,
    "hasExams" BOOLEAN NOT NULL DEFAULT false,
    "hasReferral" BOOLEAN NOT NULL DEFAULT true,
    "needsCompanion" BOOLEAN NOT NULL DEFAULT false,
    "companionName" TEXT,
    "companionCpf" TEXT,
    "companionRelationship" TEXT,
    "expectedDate" TIMESTAMP(3),
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "transportType" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "responsibleDriver" TEXT,
    "vehicleId" TEXT,
    "departureTime" TIMESTAMP(3),
    "arrivalTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'ENCAMINHAMENTOS_TFD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "health_transport_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patients" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "bloodType" TEXT,
    "susCardNumber" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelationship" TEXT,
    "allergies" TEXT,
    "chronicDiseases" TEXT,
    "currentMedications" TEXT,
    "previousSurgeries" TEXT,
    "preferredHealthUnitId" TEXT,
    "isPregnant" BOOLEAN NOT NULL DEFAULT false,
    "isDiabetic" BOOLEAN NOT NULL DEFAULT false,
    "isHypertensive" BOOLEAN NOT NULL DEFAULT false,
    "hasHeartDisease" BOOLEAN NOT NULL DEFAULT false,
    "hasRespiratoryDisease" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "observations" TEXT,
    "registeredBy" TEXT NOT NULL,
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moduleType" TEXT NOT NULL DEFAULT 'CADASTRO_PACIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."community_health_agents" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "hireDate" TIMESTAMP(3) NOT NULL,
    "contractType" TEXT,
    "healthUnitId" TEXT,
    "healthUnitName" TEXT,
    "assignedArea" TEXT NOT NULL,
    "neighborhoods" JSONB,
    "microarea" TEXT,
    "estimatedFamilies" INTEGER NOT NULL DEFAULT 0,
    "estimatedPeople" INTEGER NOT NULL DEFAULT 0,
    "education" TEXT,
    "hasCourseCompletion" BOOLEAN NOT NULL DEFAULT false,
    "courseCompletionDate" TIMESTAMP(3),
    "additionalTraining" TEXT,
    "workSchedule" JSONB,
    "weeklyHours" INTEGER NOT NULL DEFAULT 40,
    "workDays" TEXT,
    "hasTablet" BOOLEAN NOT NULL DEFAULT false,
    "hasUniform" BOOLEAN NOT NULL DEFAULT false,
    "hasBag" BOOLEAN NOT NULL DEFAULT false,
    "hasIdentificationCard" BOOLEAN NOT NULL DEFAULT false,
    "supervisorId" TEXT,
    "supervisorName" TEXT,
    "familiesServed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "terminationDate" TIMESTAMP(3),
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'GESTAO_ACS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_health_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."disciplinary_records" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT,
    "studentCpf" TEXT,
    "studentGrade" TEXT,
    "schoolId" TEXT NOT NULL,
    "schoolName" TEXT,
    "incidentType" TEXT NOT NULL,
    "severity" TEXT,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "incidentTime" TEXT,
    "time" TEXT,
    "incidentLocation" TEXT,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "witnesses" TEXT,
    "involvedStudents" JSONB,
    "involvedStaff" JSONB,
    "actionTaken" TEXT,
    "actions_taken" TEXT,
    "counselingProvided" BOOLEAN NOT NULL DEFAULT false,
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,
    "parentNotificationDate" TIMESTAMP(3),
    "disciplinaryAction" TEXT,
    "measures" TEXT NOT NULL,
    "suspensionDays" INTEGER NOT NULL DEFAULT 0,
    "suspensionStartDate" TIMESTAMP(3),
    "suspensionEndDate" TIMESTAMP(3),
    "requiresFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "followUpResponsible" TEXT,
    "reportedById" TEXT,
    "reportedByName" TEXT,
    "reportedByRole" TEXT,
    "reportedBy" TEXT,
    "responsibleTeacher" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "observations" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disciplinary_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sports_teams" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "gender" TEXT,
    "ageGroup" TEXT NOT NULL,
    "coach" TEXT NOT NULL,
    "coachCpf" TEXT,
    "coachPhone" TEXT,
    "foundationDate" TIMESTAMP(3),
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."competitions" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "competitionType" TEXT NOT NULL,
    "type" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "ageGroup" TEXT NOT NULL,
    "maxTeams" INTEGER,
    "registeredTeams" INTEGER,
    "registrationFee" DOUBLE PRECISION,
    "entryFee" DOUBLE PRECISION,
    "prizes" JSONB,
    "rules" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "organizer" TEXT NOT NULL,
    "venue" TEXT,
    "location" TEXT,
    "contact" JSONB,
    "results" JSONB,
    "modalityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sports_infrastructures" (
    "id" TEXT NOT NULL,
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
    "lastMaintenance" TIMESTAMP(3),
    "bookingRules" JSONB,
    "contact" TEXT,
    "manager" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_infrastructures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sports_schools" (
    "id" TEXT NOT NULL,
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
    "monthlyFee" DOUBLE PRECISION,
    "equipment" JSONB,
    "requirements" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sports_school_enrollments" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "sportsSchoolId" TEXT,
    "studentName" TEXT NOT NULL,
    "studentBirthDate" TIMESTAMP(3) NOT NULL,
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
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "medicalCertificate" JSONB,
    "emergencyContact" JSONB,
    "observations" TEXT,
    "uniforms" JSONB,
    "attendance" JSONB,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_school_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sports_infrastructure_reservations" (
    "id" TEXT NOT NULL,
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
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "expectedPeople" INTEGER,
    "equipment" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_infrastructure_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."competition_enrollments" (
    "id" TEXT NOT NULL,
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
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentProof" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "competition_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tournament_enrollments" (
    "id" TEXT NOT NULL,
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
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentProof" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tournament_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."security_occurrences" (
    "id" TEXT NOT NULL,
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
    "dateTime" TIMESTAMP(3),
    "occurrenceDate" TIMESTAMP(3) NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "evidence" JSONB,
    "witnesses" JSONB,
    "actions" TEXT,
    "resolution" TEXT,
    "followUp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."security_alerts" (
    "id" TEXT NOT NULL,
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
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "targetAudience" TEXT,
    "affectedAreas" JSONB,
    "channels" JSONB NOT NULL,
    "acknowledgments" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."security_patrols" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "patrolType" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_patrols_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."critical_points" (
    "id" TEXT NOT NULL,
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
    "lastIncident" TIMESTAMP(3),
    "lastIncidentDate" TIMESTAMP(3),
    "incidentCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "critical_points_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."security_attendances" (
    "id" TEXT NOT NULL,
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
    "followUpDate" TIMESTAMP(3),
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."local_businesses" (
    "id" TEXT NOT NULL,
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
    "rating" DOUBLE PRECISION,
    "photos" JSONB,
    "owner" TEXT NOT NULL,
    "ownerCpf" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isTourismPartner" BOOLEAN NOT NULL DEFAULT false,
    "isPartner" BOOLEAN NOT NULL DEFAULT false,
    "certifications" JSONB,
    "protocol" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "local_businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tourism_infos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "infoType" TEXT NOT NULL,
    "type" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetAudience" TEXT,
    "location" TEXT,
    "coordinates" JSONB,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tourism_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tourism_programs" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "type" TEXT,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "objectives" JSONB NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "budget" DOUBLE PRECISION,
    "coordinator" TEXT NOT NULL,
    "activities" JSONB NOT NULL,
    "participants" JSONB,
    "results" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "evaluation" JSONB,
    "photos" JSONB,
    "currentParticipants" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tourism_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tourism_attendances" (
    "id" TEXT NOT NULL,
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
    "followUpDate" TIMESTAMP(3),
    "touristProfile" JSONB,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tourism_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tourism_guides" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "birthDate" TIMESTAMP(3),
    "languages" JSONB NOT NULL,
    "specialties" JSONB,
    "certifications" JSONB,
    "licenseNumber" TEXT,
    "licenseExpiry" TIMESTAMP(3),
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "experienceYears" INTEGER,
    "bio" TEXT,
    "photo" TEXT,
    "availableSchedule" JSONB,
    "rating" DOUBLE PRECISION,
    "totalTours" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emergencyContact" JSONB,
    "bankInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tourism_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tourism_routes" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "routeType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "distance" DOUBLE PRECISION,
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
    "estimatedCost" DOUBLE PRECISION,
    "guideRequired" BOOLEAN NOT NULL DEFAULT false,
    "minimumAge" INTEGER,
    "maxGroupSize" INTEGER,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rating" DOUBLE PRECISION,
    "totalViews" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tourism_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tourism_events" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "venue" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "duration" TEXT,
    "organizer" TEXT NOT NULL,
    "organizerContact" JSONB NOT NULL,
    "capacity" INTEGER,
    "registeredCount" INTEGER NOT NULL DEFAULT 0,
    "ticketPrice" DOUBLE PRECISION,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tourism_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."environmental_licenses" (
    "id" TEXT NOT NULL,
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
    "area" DOUBLE PRECISION,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "analysisDate" TIMESTAMP(3),
    "issueDate" TIMESTAMP(3),
    "validFrom" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'UNDER_ANALYSIS',
    "conditions" JSONB,
    "technicalOpinion" TEXT,
    "analyst" TEXT,
    "fee" DOUBLE PRECISION,
    "documents" JSONB,
    "inspections" JSONB,
    "observations" TEXT,
    "applicantEmail" TEXT,
    "validUntil" TIMESTAMP(3),
    "activityType" TEXT,
    "technicalReport" JSONB,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "protocolNumber" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environmental_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."environmental_complaints" (
    "id" TEXT NOT NULL,
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
    "occurrenceDate" TIMESTAMP(3) NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "inspector" TEXT,
    "assignedTo" TEXT,
    "inspectionDate" TIMESTAMP(3),
    "findings" TEXT,
    "actions" TEXT,
    "actionsTaken" JSONB,
    "resolution" TEXT,
    "penalty" DOUBLE PRECISION,
    "followUp" BOOLEAN NOT NULL DEFAULT false,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "complainantPhone" TEXT,
    "complainantEmail" TEXT,
    "investigationDate" TIMESTAMP(3),
    "investigatorId" TEXT,
    "investigationReport" JSONB,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "photos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environmental_complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."protected_areas" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "areaType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "totalArea" DOUBLE PRECISION NOT NULL,
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
    "lastInspection" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protected_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."environmental_programs" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" JSONB NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environmental_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."environmental_attendances" (
    "id" TEXT NOT NULL,
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
    "followUpDate" TIMESTAMP(3),
    "resolution" TEXT,
    "satisfaction" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environmental_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tree_cutting_authorizations" (
    "id" TEXT NOT NULL,
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
    "treeHeight" DOUBLE PRECISION,
    "trunkDiameter" DOUBLE PRECISION,
    "justification" TEXT NOT NULL,
    "technicalReport" TEXT,
    "photos" JSONB,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inspectionDate" TIMESTAMP(3),
    "inspector" TEXT,
    "inspectionReport" TEXT,
    "decision" TEXT,
    "conditions" JSONB,
    "authorizationDate" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "executionDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'UNDER_ANALYSIS',
    "fee" DOUBLE PRECISION,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tree_cutting_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."environmental_inspections" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "inspectionNumber" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "inspectionDate" TIMESTAMP(3),
    "inspector" TEXT NOT NULL,
    "inspectorTeam" JSONB,
    "findings" TEXT,
    "photos" JSONB,
    "evidence" JSONB,
    "nonCompliances" JSONB,
    "recommendations" TEXT,
    "reportedViolations" JSONB,
    "penalties" DOUBLE PRECISION,
    "correctiveActions" JSONB,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "report" TEXT,
    "reportDate" TIMESTAMP(3),
    "relatedLicenseId" TEXT,
    "relatedComplaintId" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environmental_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."technical_assistances" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "protocolId" TEXT,
    "producerId" TEXT,
    "propertyId" TEXT,
    "applicantName" TEXT,
    "applicantCpf" TEXT,
    "applicantEmail" TEXT,
    "applicantPhone" TEXT,
    "producerName" TEXT,
    "producerCpf" TEXT,
    "producerPhone" TEXT,
    "assistanceType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "propertyName" TEXT,
    "propertySize" DOUBLE PRECISION,
    "propertyArea" DOUBLE PRECISION,
    "location" TEXT,
    "coordinates" JSONB,
    "crop" TEXT,
    "cropTypes" JSONB,
    "livestock" TEXT,
    "mainCrops" JSONB,
    "requestDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "preferredDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "scheduledVisit" TIMESTAMP(3),
    "visitDate" TIMESTAMP(3),
    "technician" TEXT,
    "technicianId" TEXT,
    "findings" TEXT,
    "recommendations" JSONB,
    "visitReport" JSONB,
    "followUpPlan" JSONB,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "followUpNotes" TEXT,
    "nextVisitDate" TIMESTAMP(3),
    "materials" JSONB,
    "costs" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "satisfaction" INTEGER,
    "photos" JSONB,
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "completedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "propertyLocation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technical_assistances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rural_programs" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" JSONB NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "requirements" JSONB NOT NULL,
    "benefits" JSONB NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "coordinator" TEXT NOT NULL,
    "maxParticipants" INTEGER,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "applicationPeriod" JSONB,
    "selectionCriteria" JSONB,
    "partners" JSONB,
    "results" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "evaluation" JSONB,
    "customFields" JSONB,
    "requiredDocuments" JSONB,
    "enrollmentSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rural_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rural_program_enrollments" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "protocolId" TEXT,
    "programId" TEXT NOT NULL,
    "producerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedDate" TIMESTAMP(3),
    "rejectedDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "customData" JSONB,
    "documents" JSONB,
    "observations" TEXT,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'INSCRICAO_PROGRAMA_RURAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rural_program_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rural_trainings" (
    "id" TEXT NOT NULL,
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
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "schedule" JSONB NOT NULL,
    "location" TEXT NOT NULL,
    "materials" JSONB,
    "certificate" BOOLEAN NOT NULL DEFAULT false,
    "cost" DOUBLE PRECISION,
    "requirements" TEXT,
    "evaluation" JSONB,
    "feedback" JSONB,
    "photos" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "customFields" JSONB,
    "requiredDocuments" JSONB,
    "enrollmentSettings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rural_trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rural_training_enrollments" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "protocolId" TEXT,
    "trainingId" TEXT NOT NULL,
    "producerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedDate" TIMESTAMP(3),
    "rejectedDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "customData" JSONB,
    "documents" JSONB,
    "observations" TEXT,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'INSCRICAO_CURSO_RURAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rural_training_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agriculture_attendances" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "protocolId" TEXT,
    "producerId" TEXT,
    "serviceType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "propertyName" TEXT,
    "propertySize" DOUBLE PRECISION,
    "location" TEXT,
    "crops" JSONB,
    "livestock" JSONB,
    "preferredVisitDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "visitDate" TIMESTAMP(3),
    "technician" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "resolution" TEXT,
    "followUpDate" TIMESTAMP(3),
    "satisfaction" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agriculture_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."housing_applications" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantCpf" TEXT NOT NULL,
    "contact" JSONB NOT NULL,
    "address" TEXT NOT NULL,
    "familyIncome" DOUBLE PRECISION NOT NULL,
    "familySize" INTEGER NOT NULL,
    "housingType" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "propertyValue" DOUBLE PRECISION,
    "hasProperty" BOOLEAN NOT NULL DEFAULT false,
    "isFirstHome" BOOLEAN NOT NULL DEFAULT true,
    "priorityScore" INTEGER NOT NULL DEFAULT 0,
    "documents" JSONB NOT NULL,
    "program" TEXT,
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submissionDate" TIMESTAMP(3),
    "analysisDate" TIMESTAMP(3),
    "approvalDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'UNDER_ANALYSIS',
    "analyst" TEXT,
    "observations" TEXT,
    "rejection_reason" TEXT,
    "approvedBenefit" JSONB,
    "disbursementDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housing_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."housing_units" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "unitCode" TEXT NOT NULL,
    "unitType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "neighborhood" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "constructionYear" INTEGER,
    "propertyValue" DOUBLE PRECISION,
    "monthlyRent" DOUBLE PRECISION,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "occupantName" TEXT,
    "occupantCpf" TEXT,
    "occupancyDate" TIMESTAMP(3),
    "contractType" TEXT,
    "contractEnd" TIMESTAMP(3),
    "program" TEXT,
    "conditions" JSONB,
    "lastInspection" TIMESTAMP(3),
    "needsMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceItems" JSONB,
    "photos" JSONB,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housing_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."land_regularizations" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantCpf" TEXT NOT NULL,
    "contact" JSONB NOT NULL,
    "propertyAddress" TEXT NOT NULL,
    "coordinates" JSONB,
    "propertyArea" DOUBLE PRECISION NOT NULL,
    "occupationDate" TIMESTAMP(3),
    "occupationType" TEXT NOT NULL,
    "hasBuilding" BOOLEAN NOT NULL DEFAULT false,
    "buildingArea" DOUBLE PRECISION,
    "landValue" DOUBLE PRECISION,
    "neighbors" JSONB,
    "accessRoads" JSONB,
    "utilities" JSONB,
    "legalDocuments" JSONB,
    "technicalSurvey" JSONB,
    "environmentalAnalysis" JSONB,
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisStartDate" TIMESTAMP(3),
    "fieldVisitDate" TIMESTAMP(3),
    "publicationDate" TIMESTAMP(3),
    "objectionPeriod" JSONB,
    "approvalDate" TIMESTAMP(3),
    "titleIssueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'UNDER_ANALYSIS',
    "analyst" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "land_regularizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."rent_assistances" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "applicantCpf" TEXT NOT NULL,
    "contact" JSONB NOT NULL,
    "currentAddress" TEXT NOT NULL,
    "monthlyRent" DOUBLE PRECISION NOT NULL,
    "landlordName" TEXT NOT NULL,
    "landlordContact" JSONB NOT NULL,
    "leaseContract" JSONB,
    "familyIncome" DOUBLE PRECISION NOT NULL,
    "familySize" INTEGER NOT NULL,
    "hasEmployment" BOOLEAN NOT NULL DEFAULT false,
    "employmentDetails" JSONB,
    "vulnerabilityReason" TEXT NOT NULL,
    "requestedAmount" DOUBLE PRECISION NOT NULL,
    "requestedPeriod" INTEGER NOT NULL,
    "bankAccount" JSONB,
    "documents" JSONB NOT NULL,
    "socialReport" JSONB,
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisDate" TIMESTAMP(3),
    "approvalDate" TIMESTAMP(3),
    "firstPaymentDate" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paymentsCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UNDER_ANALYSIS',
    "analyst" TEXT,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rent_assistances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "programType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" JSONB NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "targetGroup" TEXT,
    "requirements" JSONB NOT NULL,
    "benefits" JSONB NOT NULL,
    "benefitValue" DOUBLE PRECISION,
    "frequency" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_assistance_attendances" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "serviceType" TEXT NOT NULL,
    "attendanceType" TEXT,
    "category" TEXT,
    "socialDemand" TEXT,
    "socialIssue" JSONB,
    "vulnerabilityLevel" TEXT,
    "vulnerability" TEXT,
    "familySize" INTEGER,
    "dependents" INTEGER NOT NULL DEFAULT 0,
    "minors" INTEGER NOT NULL DEFAULT 0,
    "elderly" INTEGER NOT NULL DEFAULT 0,
    "disabledMembers" INTEGER NOT NULL DEFAULT 0,
    "familyIncome" DOUBLE PRECISION,
    "monthlyIncome" DOUBLE PRECISION,
    "unemployed" BOOLEAN NOT NULL DEFAULT false,
    "informalWork" BOOLEAN NOT NULL DEFAULT false,
    "housingSituation" TEXT,
    "hasNIS" BOOLEAN NOT NULL DEFAULT false,
    "nisNumber" TEXT,
    "hasCadUnico" BOOLEAN NOT NULL DEFAULT false,
    "cadUnicoNumber" TEXT,
    "hasBolsaFamilia" BOOLEAN NOT NULL DEFAULT false,
    "otherBenefits" JSONB,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requestedServices" JSONB,
    "requestedBenefits" JSONB,
    "needsReferral" BOOLEAN NOT NULL DEFAULT false,
    "referralType" TEXT,
    "referralDestination" TEXT,
    "referredBy" TEXT,
    "referrals" JSONB,
    "crasId" TEXT,
    "crasName" TEXT,
    "creasId" TEXT,
    "creasName" TEXT,
    "socialWorker" TEXT,
    "socialWorkerId" TEXT,
    "socialWorkerName" TEXT,
    "assessment" JSONB,
    "interventionPlan" JSONB,
    "socialWorkerNotes" TEXT,
    "actionPlan" TEXT,
    "followUpPlan" JSONB,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "priority" TEXT,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "urgencyReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "nextVisitDate" TIMESTAMP(3),
    "satisfaction" INTEGER,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_assistance_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_group_enrollments" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "participantName" TEXT NOT NULL,
    "participantCpf" TEXT,
    "groupName" TEXT NOT NULL,
    "groupType" TEXT NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "frequency" TEXT,
    "observations" TEXT,
    "instructor" TEXT,
    "schedule" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_group_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_program_enrollments" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "programId" TEXT,
    "programName" TEXT,
    "programType" TEXT,
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "familyIncome" DOUBLE PRECISION,
    "familySize" INTEGER,
    "vulnerability" TEXT,
    "documents" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "approvedDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "benefits" JSONB,
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'PROGRAMA_SOCIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_program_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_benefit_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "benefitType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "familyIncome" DOUBLE PRECISION,
    "familySize" INTEGER,
    "justification" TEXT,
    "documents" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'BENEFICIO_SOCIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_benefit_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."document_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'DOCUMENTO_SOCIAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."family_registrations" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "familyMembers" JSONB NOT NULL DEFAULT '[]',
    "familyIncome" DOUBLE PRECISION,
    "housingType" TEXT,
    "vulnerability" TEXT,
    "needsAssessment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'CADASTRO_FAMILIAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_home_visits" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "visitReason" TEXT NOT NULL,
    "visitType" TEXT NOT NULL DEFAULT 'avaliacao',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'VISITA_DOMICILIAR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_home_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_appointments" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "appointmentType" TEXT NOT NULL,
    "serviceType" TEXT,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "appointmentTime" TEXT,
    "estimatedDuration" INTEGER NOT NULL DEFAULT 60,
    "equipmentType" TEXT,
    "equipmentId" TEXT,
    "equipmentName" TEXT,
    "roomNumber" TEXT,
    "socialWorkerId" TEXT,
    "socialWorkerName" TEXT,
    "reason" TEXT,
    "purpose" TEXT NOT NULL,
    "description" TEXT,
    "referredBy" TEXT,
    "referralReason" TEXT,
    "priority" TEXT,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "urgencyJustification" TEXT,
    "isFirstTime" BOOLEAN NOT NULL DEFAULT false,
    "previousAttendances" INTEGER NOT NULL DEFAULT 0,
    "hasCadUnico" BOOLEAN NOT NULL DEFAULT false,
    "vulnerabilityLevel" TEXT,
    "requiredDocuments" JSONB,
    "hasAllDocuments" BOOLEAN NOT NULL DEFAULT false,
    "hasCompanion" BOOLEAN NOT NULL DEFAULT false,
    "companionName" TEXT,
    "companionRelationship" TEXT,
    "needsAccessibility" BOOLEAN NOT NULL DEFAULT false,
    "accessibilityNeeds" JSONB,
    "needsInterpreter" BOOLEAN NOT NULL DEFAULT false,
    "interpreterLanguage" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmationMethod" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "notes" TEXT,
    "result" TEXT,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" TIMESTAMP(3),
    "observations" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."social_equipments" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "equipmentName" TEXT NOT NULL,
    "code" TEXT,
    "cnpj" TEXT,
    "address" TEXT NOT NULL,
    "addressNumber" TEXT,
    "addressComplement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "coordinates" JSONB,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "operatingHours" JSONB,
    "operatingDays" TEXT,
    "schedule" JSONB,
    "capacity" INTEGER,
    "currentOccupancy" INTEGER NOT NULL DEFAULT 0,
    "maxMonthlyAttendances" INTEGER,
    "coverageArea" JSONB,
    "coveragePopulation" INTEGER,
    "referenceFamilies" INTEGER,
    "coordinator" TEXT,
    "coordinatorId" TEXT,
    "coordinatorName" TEXT,
    "coordinatorPhone" TEXT,
    "coordinatorEmail" TEXT,
    "socialWorkers" INTEGER NOT NULL DEFAULT 0,
    "psychologists" INTEGER NOT NULL DEFAULT 0,
    "educators" INTEGER NOT NULL DEFAULT 0,
    "supportStaff" INTEGER NOT NULL DEFAULT 0,
    "totalStaff" INTEGER NOT NULL DEFAULT 0,
    "services" JSONB,
    "offeredServices" JSONB,
    "programs" JSONB,
    "groups" JSONB,
    "hasAccessibility" BOOLEAN NOT NULL DEFAULT false,
    "accessibilityFeatures" JSONB,
    "rooms" INTEGER NOT NULL DEFAULT 0,
    "computerLab" BOOLEAN NOT NULL DEFAULT false,
    "kitchen" BOOLEAN NOT NULL DEFAULT false,
    "playground" BOOLEAN NOT NULL DEFAULT false,
    "sportsArea" BOOLEAN NOT NULL DEFAULT false,
    "hasVehicle" BOOLEAN NOT NULL DEFAULT false,
    "vehicleType" TEXT,
    "vehiclePlate" TEXT,
    "municipalDecree" TEXT,
    "creationDate" TIMESTAMP(3),
    "lastInspectionDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "operationStatus" TEXT,
    "approvedAt" TIMESTAMP(3),
    "observations" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_inspections" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "workName" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "contractor" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "inspector" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "findings" JSONB NOT NULL,
    "compliance" TEXT NOT NULL,
    "violations" JSONB,
    "recommendations" JSONB,
    "photos" JSONB,
    "documents" JSONB,
    "deadline" TIMESTAMP(3),
    "followUpDate" TIMESTAMP(3),
    "nextInspection" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_works_attendances" (
    "id" TEXT NOT NULL,
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
    "estimatedCost" DOUBLE PRECISION,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "feasibility" TEXT,
    "technicalOpinion" TEXT,
    "engineer" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "satisfaction" INTEGER,
    "followUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_works_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."road_repair_requests" (
    "id" TEXT NOT NULL,
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
    "affectedArea" DOUBLE PRECISION,
    "trafficImpact" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "estimatedCost" DOUBLE PRECISION,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assignedTeam" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "materialsUsed" JSONB,
    "workDuration" INTEGER,
    "satisfaction" INTEGER,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "road_repair_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."technical_inspections" (
    "id" TEXT NOT NULL,
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
    "scheduledDate" TIMESTAMP(3),
    "inspectionDate" TIMESTAMP(3),
    "inspector" TEXT,
    "findings" JSONB,
    "technicalOpinion" TEXT,
    "approved" BOOLEAN,
    "conditions" JSONB,
    "validUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "followUpDate" TIMESTAMP(3),
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technical_inspections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_service_requests" (
    "id" TEXT NOT NULL,
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
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferredDate" TIMESTAMP(3),
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "priority" TEXT,
    "photos" JSONB,
    "assignedTeam" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "expectedDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "materials" JSONB,
    "workDetails" TEXT,
    "cost" DOUBLE PRECISION,
    "estimatedCost" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "satisfaction" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."cleaning_schedules" (
    "id" TEXT NOT NULL,
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
    "lastExecution" TIMESTAMP(3),
    "nextExecution" TIMESTAMP(3) NOT NULL,
    "executionHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleaning_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."street_lightings" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "pointCode" TEXT NOT NULL,
    "streetName" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "poleType" TEXT NOT NULL,
    "lampType" TEXT NOT NULL,
    "power" INTEGER NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "installDate" TIMESTAMP(3),
    "lastMaintenance" TIMESTAMP(3),
    "nextMaintenance" TIMESTAMP(3),
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "status" TEXT,
    "issues" JSONB,
    "maintenanceHistory" JSONB,
    "energyConsumption" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "photos" JSONB,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "street_lightings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."special_collections" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "collectionType" TEXT NOT NULL,
    "requestorName" TEXT NOT NULL,
    "requestorCpf" TEXT,
    "contact" JSONB NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "description" TEXT NOT NULL,
    "estimatedVolume" DOUBLE PRECISION,
    "quantity" INTEGER,
    "unit" TEXT,
    "photos" JSONB,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferredDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "timeSlot" TEXT,
    "collectionDate" TIMESTAMP(3),
    "teamAssigned" TEXT,
    "vehicle" TEXT,
    "actualVolume" DOUBLE PRECISION,
    "destination" TEXT,
    "cost" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "observations" TEXT,
    "satisfaction" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "special_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_problem_reports" (
    "id" TEXT NOT NULL,
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
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'REPORTED',
    "assignedDepartment" TEXT,
    "assignedTeam" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "estimatedCost" DOUBLE PRECISION,
    "scheduledDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "resolution" TEXT,
    "materials" JSONB,
    "workHours" DOUBLE PRECISION,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "followUp" BOOLEAN NOT NULL DEFAULT false,
    "satisfaction" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_problem_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."team_schedules" (
    "id" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."weeding_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "requestorName" TEXT NOT NULL,
    "requestorCpf" TEXT,
    "contact" JSONB NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "areaSize" DOUBLE PRECISION,
    "terrainType" TEXT NOT NULL,
    "accessType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photos" JSONB,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferredDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "assignedTeam" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "workDetails" TEXT,
    "equipmentUsed" JSONB,
    "workHours" DOUBLE PRECISION,
    "observations" TEXT,
    "satisfaction" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weeding_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."drainage_requests" (
    "id" TEXT NOT NULL,
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
    "affectedArea" DOUBLE PRECISION,
    "urgency" TEXT NOT NULL DEFAULT 'HIGH',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferredDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "assignedTeam" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "workDetails" TEXT,
    "equipmentUsed" JSONB,
    "materialsUsed" JSONB,
    "workHours" DOUBLE PRECISION,
    "observations" TEXT,
    "satisfaction" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drainage_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tree_pruning_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "requestorName" TEXT NOT NULL,
    "requestorCpf" TEXT,
    "contact" JSONB NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" JSONB,
    "treeSpecies" TEXT,
    "treeHeight" DOUBLE PRECISION,
    "trunkDiameter" DOUBLE PRECISION,
    "pruningType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photos" JSONB,
    "riskLevel" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferredDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "assignedTeam" TEXT,
    "technicalVisit" BOOLEAN NOT NULL DEFAULT false,
    "visitDate" TIMESTAMP(3),
    "approved" BOOLEAN,
    "approvalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "workDetails" TEXT,
    "equipmentUsed" JSONB,
    "materialRemoved" DOUBLE PRECISION,
    "workHours" DOUBLE PRECISION,
    "observations" TEXT,
    "satisfaction" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tree_pruning_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."urban_cleanings" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "serviceType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT,
    "coordinates" JSONB,
    "description" TEXT NOT NULL,
    "areaSize" DOUBLE PRECISION,
    "cleaningType" TEXT NOT NULL,
    "frequency" TEXT,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "assignedTeam" TEXT,
    "teamLeader" TEXT,
    "workers" JSONB,
    "equipmentUsed" JSONB,
    "vehiclesUsed" JSONB,
    "wasteCollected" DOUBLE PRECISION,
    "wasteType" JSONB,
    "photos" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "cost" DOUBLE PRECISION,
    "workHours" DOUBLE PRECISION,
    "observations" TEXT,
    "satisfaction" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "urban_cleanings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_teams" (
    "id" TEXT NOT NULL,
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
    "hireDate" TIMESTAMP(3),
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_service_attendances" (
    "id" TEXT NOT NULL,
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
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedTeam" TEXT,
    "assignedTo" TEXT,
    "resolution" TEXT,
    "photos" JSONB,
    "documents" JSONB,
    "cost" DOUBLE PRECISION,
    "satisfaction" INTEGER,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_service_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."specialized_pages" (
    "id" TEXT NOT NULL,
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
    "publishDate" TIMESTAMP(3),
    "lastModified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedBy" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "template" TEXT,
    "metadata" JSONB,
    "analytics" JSONB,
    "customCss" TEXT,
    "customJs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "specialized_pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."page_metrics" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "pageKey" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "metricDate" TIMESTAMP(3) NOT NULL,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "averageTime" DOUBLE PRECISION,
    "bounceRate" DOUBLE PRECISION,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "formSubmissions" INTEGER NOT NULL DEFAULT 0,
    "clickEvents" JSONB,
    "searchTerms" JSONB,
    "referrers" JSONB,
    "devices" JSONB,
    "browsers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."page_configurations" (
    "id" TEXT NOT NULL,
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
    "approvalDate" TIMESTAMP(3),
    "rollbackData" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."agenda_events" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataHoraInicio" TIMESTAMP(3) NOT NULL,
    "dataHoraFim" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "participantes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGENDADO',
    "observacoes" TEXT,
    "anexos" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."infrastructure_problems" (
    "id" TEXT NOT NULL,
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
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "infrastructure_problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."urban_maintenance_requests" (
    "id" TEXT NOT NULL,
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
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "completionNotes" TEXT,
    "assignedTeam" TEXT,
    "assignedTo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "urban_maintenance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."housing_requests" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT NOT NULL,
    "citizenRg" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "familySize" INTEGER NOT NULL,
    "monthlyIncome" DOUBLE PRECISION,
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
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "housing_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sports_modalities" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "equipment" JSONB,
    "rules" TEXT,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sports_modalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tree_authorizations" (
    "id" TEXT NOT NULL,
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
    "inspectionDate" TIMESTAMP(3),
    "technicalReport" JSONB,
    "inspectorId" TEXT,
    "requiresCompensation" BOOLEAN NOT NULL DEFAULT false,
    "compensationPlan" JSONB,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tree_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."organic_certifications" (
    "id" TEXT NOT NULL,
    "producerName" TEXT NOT NULL,
    "producerCpf" TEXT NOT NULL,
    "producerPhone" TEXT NOT NULL,
    "producerEmail" TEXT,
    "propertyName" TEXT,
    "propertyLocation" TEXT NOT NULL,
    "propertyArea" DOUBLE PRECISION NOT NULL,
    "coordinates" JSONB,
    "products" JSONB NOT NULL,
    "productionSystem" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "certificationNumber" TEXT,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "inspections" JSONB,
    "lastInspectionDate" TIMESTAMP(3),
    "nextInspectionDate" TIMESTAMP(3),
    "documents" JSONB,
    "technicalReport" JSONB,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "inspectorId" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organic_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."seed_distributions" (
    "id" TEXT NOT NULL,
    "producerName" TEXT NOT NULL,
    "producerCpf" TEXT NOT NULL,
    "producerPhone" TEXT NOT NULL,
    "propertyLocation" TEXT NOT NULL,
    "propertyArea" DOUBLE PRECISION,
    "requestType" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedQuantity" JSONB,
    "approvalNotes" TEXT,
    "deliveryDate" TIMESTAMP(3),
    "deliveredBy" TEXT,
    "deliveredItems" JSONB,
    "receivedBy" TEXT,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seed_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."soil_analyses" (
    "id" TEXT NOT NULL,
    "producerName" TEXT NOT NULL,
    "producerCpf" TEXT NOT NULL,
    "producerPhone" TEXT NOT NULL,
    "propertyLocation" TEXT NOT NULL,
    "propertyArea" DOUBLE PRECISION,
    "coordinates" JSONB,
    "analysisType" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "cropIntended" TEXT,
    "sampleCount" INTEGER NOT NULL DEFAULT 1,
    "collectionDate" TIMESTAMP(3),
    "collectedBy" TEXT,
    "sampleLocations" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "labId" TEXT,
    "labSentDate" TIMESTAMP(3),
    "resultsDate" TIMESTAMP(3),
    "results" JSONB,
    "recommendations" JSONB,
    "technicalReport" TEXT,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "analyzedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "soil_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."farmer_market_registrations" (
    "id" TEXT NOT NULL,
    "producerName" TEXT NOT NULL,
    "producerCpf" TEXT NOT NULL,
    "producerPhone" TEXT NOT NULL,
    "producerEmail" TEXT,
    "propertyLocation" TEXT NOT NULL,
    "propertyArea" DOUBLE PRECISION,
    "products" JSONB NOT NULL,
    "productionType" TEXT NOT NULL,
    "hasOrganicCert" BOOLEAN NOT NULL DEFAULT false,
    "certificationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "registrationNumber" TEXT,
    "needsStall" BOOLEAN NOT NULL DEFAULT false,
    "stallPreference" TEXT,
    "documents" JSONB,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "inspectedBy" TEXT,
    "inspectionDate" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmer_market_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."urban_certificates" (
    "id" TEXT NOT NULL,
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
    "issuedDate" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "documents" JSONB,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "issuedBy" TEXT,
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "urban_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."property_numbering" (
    "id" TEXT NOT NULL,
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
    "inspectionDate" TIMESTAMP(3),
    "inspectorId" TEXT,
    "inspectionReport" JSONB,
    "photos" JSONB,
    "assignedNumber" TEXT,
    "assignmentDate" TIMESTAMP(3),
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_numbering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lot_subdivisions" (
    "id" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerCpf" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "ownerEmail" TEXT,
    "originalAddress" TEXT NOT NULL,
    "originalLotNumber" TEXT,
    "originalBlockNumber" TEXT,
    "originalArea" DOUBLE PRECISION NOT NULL,
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
    "approvedDate" TIMESTAMP(3),
    "registryNumber" TEXT,
    "registryDate" TIMESTAMP(3),
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lot_subdivisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."police_reports" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "occurrenceDate" TIMESTAMP(3) NOT NULL,
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
    "assignedAt" TIMESTAMP(3),
    "investigationNotes" JSONB,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "metadata" JSONB,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "police_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patrol_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "area" TEXT,
    "requestedDate" TIMESTAMP(3),
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
    "scheduledDate" TIMESTAMP(3),
    "scheduledTime" TEXT,
    "assignedUnit" TEXT,
    "assignedOfficers" JSONB,
    "patrolLog" JSONB,
    "observations" TEXT,
    "completedAt" TIMESTAMP(3),
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patrol_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."camera_requests" (
    "id" TEXT NOT NULL,
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
    "incidentDate" TIMESTAMP(3),
    "incidentTime" TEXT,
    "timeRange" JSONB,
    "incidentDescription" TEXT,
    "feasibilityStatus" TEXT,
    "technicalNotes" TEXT,
    "estimatedCost" DOUBLE PRECISION,
    "requesterName" TEXT NOT NULL,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "requesterDocument" TEXT,
    "requesterType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "scheduledDate" TIMESTAMP(3),
    "installedDate" TIMESTAMP(3),
    "installationTeam" TEXT,
    "cameraIds" JSONB,
    "footageDelivered" BOOLEAN DEFAULT false,
    "footageDeliveryDate" TIMESTAMP(3),
    "footageNotes" TEXT,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "camera_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."anonymous_tips" (
    "id" TEXT NOT NULL,
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
    "assignedAt" TIMESTAMP(3),
    "investigationLog" JSONB,
    "actionTaken" TEXT,
    "outcome" TEXT,
    "closedAt" TIMESTAMP(3),
    "feedbackCode" TEXT,
    "publicUpdates" JSONB,
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "anonymityLevel" TEXT NOT NULL DEFAULT 'full',
    "ipHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anonymous_tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."municipal_guards" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "cpf" TEXT,
    "rg" TEXT,
    "birthDate" TIMESTAMP(3),
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "position" TEXT NOT NULL,
    "admissionDate" TIMESTAMP(3) NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "municipal_guards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."surveillance_systems" (
    "id" TEXT NOT NULL,
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
    "installationDate" TIMESTAMP(3),
    "warrantyExpires" TIMESTAMP(3),
    "cameraType" TEXT,
    "resolution" TEXT,
    "hasNightVision" BOOLEAN NOT NULL DEFAULT false,
    "hasAudio" BOOLEAN NOT NULL DEFAULT false,
    "recordingDays" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'operational',
    "lastMaintenance" TIMESTAMP(3),
    "nextMaintenance" TIMESTAMP(3),
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
    "downtimeHours" DOUBLE PRECISION DEFAULT 0,
    "integratedWith" JSONB,
    "apiAccess" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "technicalSpecs" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveillance_systems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."event_authorizations" (
    "id" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "setupDate" TIMESTAMP(3),
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
    "approvedAt" TIMESTAMP(3),
    "deniedReason" TEXT,
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lost_and_found" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "distinctiveMarks" TEXT,
    "location" TEXT NOT NULL,
    "lostFoundDate" TIMESTAMP(3) NOT NULL,
    "lostFoundTime" TEXT,
    "photos" JSONB,
    "personName" TEXT NOT NULL,
    "personDocument" TEXT,
    "personPhone" TEXT NOT NULL,
    "personEmail" TEXT,
    "personAddress" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "matchedWith" TEXT,
    "matchedAt" TIMESTAMP(3),
    "returnedTo" TEXT,
    "returnedAt" TIMESTAMP(3),
    "returnNotes" TEXT,
    "storageLocation" TEXT,
    "storedBy" TEXT,
    "storedAt" TIMESTAMP(3),
    "protocol" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "metadata" JSONB,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lost_and_found_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."custom_data_tables" (
    "id" TEXT NOT NULL,
    "tableName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "allowCreate" BOOLEAN NOT NULL DEFAULT true,
    "allowUpdate" BOOLEAN NOT NULL DEFAULT true,
    "allowDelete" BOOLEAN NOT NULL DEFAULT true,
    "moduleType" TEXT,
    "schema" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_data_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."custom_data_records" (
    "id" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "protocol" TEXT,
    "serviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "custom_data_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."urban_planning_attendance" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT NOT NULL,
    "citizenPhone" TEXT NOT NULL,
    "citizenEmail" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attendanceType" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "urban_planning_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_approvals" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerCpf" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "ownerEmail" TEXT,
    "propertyAddress" TEXT NOT NULL,
    "propertyNumber" TEXT,
    "neighborhood" TEXT NOT NULL,
    "lotNumber" TEXT,
    "block" TEXT,
    "subdivision" TEXT,
    "registryNumber" TEXT,
    "projectType" TEXT NOT NULL,
    "projectCategory" TEXT NOT NULL,
    "constructionArea" DOUBLE PRECISION NOT NULL,
    "totalArea" DOUBLE PRECISION NOT NULL,
    "floors" INTEGER NOT NULL,
    "units" INTEGER,
    "architectName" TEXT NOT NULL,
    "architectCau" TEXT NOT NULL,
    "architectPhone" TEXT NOT NULL,
    "rrtNumber" TEXT,
    "technicalOpinion" TEXT,
    "observations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ANALYSIS',
    "analysisStartedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."building_permits" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerCpf" TEXT NOT NULL,
    "ownerPhone" TEXT NOT NULL,
    "ownerEmail" TEXT,
    "propertyAddress" TEXT NOT NULL,
    "propertyNumber" TEXT,
    "neighborhood" TEXT NOT NULL,
    "lotNumber" TEXT,
    "block" TEXT,
    "subdivision" TEXT,
    "registryNumber" TEXT,
    "projectType" TEXT NOT NULL,
    "constructionArea" DOUBLE PRECISION NOT NULL,
    "totalArea" DOUBLE PRECISION NOT NULL,
    "floors" INTEGER NOT NULL,
    "rooms" INTEGER,
    "parking" INTEGER,
    "engineerName" TEXT NOT NULL,
    "engineerCrea" TEXT NOT NULL,
    "engineerPhone" TEXT NOT NULL,
    "artNumber" TEXT,
    "projectApprovalId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ANALYSIS',
    "analysisStartedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "observations" TEXT,
    "rejectionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "building_permits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."operating_licenses" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "tradeName" TEXT,
    "cnpj" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerCpf" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "number" TEXT,
    "neighborhood" TEXT NOT NULL,
    "complement" TEXT,
    "zipCode" TEXT,
    "activityType" TEXT NOT NULL,
    "cnae" TEXT,
    "businessArea" DOUBLE PRECISION,
    "employees" INTEGER,
    "operatingHours" TEXT,
    "hasFireSafety" BOOLEAN NOT NULL DEFAULT false,
    "hasSanitaryLicense" BOOLEAN NOT NULL DEFAULT false,
    "hasEnvironmentalLic" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ANALYSIS',
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "renewalDate" TIMESTAMP(3),
    "observations" TEXT,
    "rejectionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operating_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."certificate_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT NOT NULL,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "certificateType" TEXT NOT NULL,
    "purpose" TEXT,
    "propertyAddress" TEXT,
    "propertyRegistration" TEXT,
    "lotNumber" TEXT,
    "block" TEXT,
    "urgency" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "issuedAt" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "certificateNumber" TEXT,
    "observations" TEXT,
    "rejectionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."illegal_construction_reports" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "reporterName" TEXT,
    "reporterCpf" TEXT,
    "reporterPhone" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT NOT NULL,
    "number" TEXT,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" TEXT,
    "violationType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "inspectionScheduled" TIMESTAMP(3),
    "inspectedAt" TIMESTAMP(3),
    "inspectorNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RECEIVED',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "illegal_construction_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subdivision_registrations" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "subdivisionName" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "ownerCpf" TEXT,
    "ownerCnpj" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "location" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "totalArea" DOUBLE PRECISION NOT NULL,
    "totalLots" INTEGER NOT NULL,
    "publicAreaPercent" DOUBLE PRECISION,
    "greenAreaPercent" DOUBLE PRECISION,
    "hasInfrastructure" BOOLEAN NOT NULL DEFAULT false,
    "hasPavement" BOOLEAN NOT NULL DEFAULT false,
    "hasWater" BOOLEAN NOT NULL DEFAULT false,
    "hasSewage" BOOLEAN NOT NULL DEFAULT false,
    "hasElectricity" BOOLEAN NOT NULL DEFAULT false,
    "engineerName" TEXT NOT NULL,
    "engineerCrea" TEXT NOT NULL,
    "artNumber" TEXT,
    "approvalDate" TIMESTAMP(3),
    "registrationNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ANALYSIS',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subdivision_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_works_attendance_phase3" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT NOT NULL,
    "citizenPhone" TEXT NOT NULL,
    "citizenEmail" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attendanceType" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "location" TEXT,
    "neighborhood" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_works_attendance_phase3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."road_repair_requests_phase3" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "address" TEXT NOT NULL,
    "number" TEXT,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" TEXT,
    "problemType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affectedArea" DOUBLE PRECISION,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "inspectionDate" TIMESTAMP(3),
    "repairScheduled" TIMESTAMP(3),
    "repairedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "road_repair_requests_phase3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."technical_inspections_phase3" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterCnpj" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "inspectionType" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "preferredDate" TIMESTAMP(3),
    "urgency" BOOLEAN NOT NULL DEFAULT false,
    "inspectionDate" TIMESTAMP(3),
    "inspectorName" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "reportIssued" BOOLEAN NOT NULL DEFAULT false,
    "reportUrl" TEXT,
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technical_inspections_phase3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_work_registrations" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "workName" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "address" TEXT,
    "budget" DOUBLE PRECISION,
    "contractedCompany" TEXT,
    "cnpj" TEXT,
    "contractNumber" TEXT,
    "startDate" TIMESTAMP(3),
    "expectedEndDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "engineerName" TEXT,
    "engineerCrea" TEXT,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_work_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_inspections_phase3" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "workName" TEXT NOT NULL,
    "workLocation" TEXT NOT NULL,
    "contractNumber" TEXT,
    "inspectionDate" TIMESTAMP(3) NOT NULL,
    "inspectorName" TEXT NOT NULL,
    "inspectorRole" TEXT,
    "progressPercent" DOUBLE PRECISION NOT NULL,
    "qualityRating" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "nonCompliances" JSONB,
    "recommendations" TEXT,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "requiresAction" BOOLEAN NOT NULL DEFAULT false,
    "actionDeadline" TIMESTAMP(3),
    "nextInspection" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_inspections_phase3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_service_attendance_phase3" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT NOT NULL,
    "citizenPhone" TEXT NOT NULL,
    "citizenEmail" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "attendanceType" TEXT NOT NULL,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "location" TEXT,
    "neighborhood" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_service_attendance_phase3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."public_lighting_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "requestType" TEXT NOT NULL,
    "problemType" TEXT,
    "address" TEXT NOT NULL,
    "number" TEXT,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" TEXT,
    "description" TEXT NOT NULL,
    "urgency" BOOLEAN NOT NULL DEFAULT false,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "inspectionDate" TIMESTAMP(3),
    "repairScheduled" TIMESTAMP(3),
    "repairedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_lighting_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."urban_cleaning_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "cleaningType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" TEXT,
    "description" TEXT NOT NULL,
    "estimatedArea" DOUBLE PRECISION,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "scheduledDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "urban_cleaning_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."special_collection_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "collectionType" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "number" TEXT,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "itemDescription" TEXT NOT NULL,
    "estimatedVolume" TEXT,
    "itemQuantity" INTEGER,
    "preferredDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "collectedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "special_collection_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."weeding_requests_phase3" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" TEXT,
    "areaType" TEXT NOT NULL,
    "estimatedArea" DOUBLE PRECISION,
    "description" TEXT NOT NULL,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "scheduledDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weeding_requests_phase3_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."drainage_unblock_requests" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" TEXT,
    "obstructionType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "causingFlooding" BOOLEAN NOT NULL DEFAULT false,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "inspectionDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drainage_unblock_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tree_pruning_requests_phase3" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterCpf" TEXT,
    "requesterPhone" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "address" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "reference" TEXT,
    "coordinates" TEXT,
    "treeType" TEXT,
    "treeHeight" TEXT,
    "pruningReason" TEXT NOT NULL,
    "urgency" BOOLEAN NOT NULL DEFAULT false,
    "nearPowerLines" BOOLEAN NOT NULL DEFAULT false,
    "hasPhotos" BOOLEAN NOT NULL DEFAULT false,
    "photoUrls" JSONB,
    "inspectionDate" TIMESTAMP(3),
    "scheduledDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "observations" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tree_pruning_requests_phase3_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "municipio_config_cnpj_key" ON "public"."municipio_config"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "public"."departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "public"."departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "citizens_cpf_key" ON "public"."citizens"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "public"."invoices"("number");

-- CreateIndex
CREATE UNIQUE INDEX "family_compositions_headId_memberId_key" ON "public"."family_compositions"("headId", "memberId");

-- CreateIndex
CREATE UNIQUE INDEX "protocols_simplified_number_key" ON "public"."protocols_simplified"("number");

-- CreateIndex
CREATE INDEX "protocols_simplified_status_idx" ON "public"."protocols_simplified"("status");

-- CreateIndex
CREATE INDEX "protocols_simplified_createdAt_idx" ON "public"."protocols_simplified"("createdAt");

-- CreateIndex
CREATE INDEX "protocols_simplified_moduleType_status_idx" ON "public"."protocols_simplified"("moduleType", "status");

-- CreateIndex
CREATE INDEX "protocol_interactions_protocolId_createdAt_idx" ON "public"."protocol_interactions"("protocolId", "createdAt");

-- CreateIndex
CREATE INDEX "protocol_interactions_protocolId_idx" ON "public"."protocol_interactions"("protocolId");

-- CreateIndex
CREATE INDEX "protocol_documents_protocolId_documentType_idx" ON "public"."protocol_documents"("protocolId", "documentType");

-- CreateIndex
CREATE INDEX "protocol_documents_protocolId_idx" ON "public"."protocol_documents"("protocolId");

-- CreateIndex
CREATE INDEX "protocol_pendings_protocolId_status_idx" ON "public"."protocol_pendings"("protocolId", "status");

-- CreateIndex
CREATE INDEX "protocol_pendings_protocolId_idx" ON "public"."protocol_pendings"("protocolId");

-- CreateIndex
CREATE UNIQUE INDEX "module_workflows_moduleType_key" ON "public"."module_workflows"("moduleType");

-- CreateIndex
CREATE INDEX "protocol_stages_protocolId_stageOrder_idx" ON "public"."protocol_stages"("protocolId", "stageOrder");

-- CreateIndex
CREATE INDEX "protocol_stages_protocolId_idx" ON "public"."protocol_stages"("protocolId");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_sla_protocolId_key" ON "public"."protocol_sla"("protocolId");

-- CreateIndex
CREATE INDEX "analytics_type_metric_period_idx" ON "public"."analytics"("type", "metric", "period");

-- CreateIndex
CREATE INDEX "analytics_entityId_metric_idx" ON "public"."analytics"("entityId", "metric");

-- CreateIndex
CREATE INDEX "analytics_periodType_createdAt_idx" ON "public"."analytics"("periodType", "createdAt");

-- CreateIndex
CREATE INDEX "protocol_metrics_periodType_periodDate_idx" ON "public"."protocol_metrics"("periodType", "periodDate");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_metrics_periodType_periodDate_key" ON "public"."protocol_metrics"("periodType", "periodDate");

-- CreateIndex
CREATE INDEX "department_metrics_departmentId_periodType_idx" ON "public"."department_metrics"("departmentId", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "department_metrics_departmentId_periodType_periodDate_key" ON "public"."department_metrics"("departmentId", "periodType", "periodDate");

-- CreateIndex
CREATE INDEX "service_metrics_serviceId_periodType_idx" ON "public"."service_metrics"("serviceId", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "service_metrics_serviceId_periodType_periodDate_key" ON "public"."service_metrics"("serviceId", "periodType", "periodDate");

-- CreateIndex
CREATE INDEX "server_performance_userId_periodType_idx" ON "public"."server_performance"("userId", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "server_performance_userId_periodType_periodDate_key" ON "public"."server_performance"("userId", "periodType", "periodDate");

-- CreateIndex
CREATE INDEX "protocol_bottlenecks_periodType_impactScore_idx" ON "public"."protocol_bottlenecks"("periodType", "impactScore");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_bottlenecks_bottleneckType_entityId_periodType_per_key" ON "public"."protocol_bottlenecks"("bottleneckType", "entityId", "periodType", "periodDate");

-- CreateIndex
CREATE INDEX "kpis_category_isActive_idx" ON "public"."kpis"("category", "isActive");

-- CreateIndex
CREATE INDEX "kpis_updateFrequency_idx" ON "public"."kpis"("updateFrequency");

-- CreateIndex
CREATE INDEX "reports_type_isActive_idx" ON "public"."reports"("type", "isActive");

-- CreateIndex
CREATE INDEX "reports_createdBy_idx" ON "public"."reports"("createdBy");

-- CreateIndex
CREATE INDEX "report_executions_reportId_status_idx" ON "public"."report_executions"("reportId", "status");

-- CreateIndex
CREATE INDEX "report_executions_executedBy_startedAt_idx" ON "public"."report_executions"("executedBy", "startedAt");

-- CreateIndex
CREATE INDEX "dashboards_userLevel_isActive_idx" ON "public"."dashboards"("userLevel", "isActive");

-- CreateIndex
CREATE INDEX "dashboards_createdBy_idx" ON "public"."dashboards"("createdBy");

-- CreateIndex
CREATE INDEX "alerts_type_isActive_idx" ON "public"."alerts"("type", "isActive");

-- CreateIndex
CREATE INDEX "alerts_metric_isActive_idx" ON "public"."alerts"("metric", "isActive");

-- CreateIndex
CREATE INDEX "alert_triggers_alertId_triggeredAt_idx" ON "public"."alert_triggers"("alertId", "triggeredAt");

-- CreateIndex
CREATE INDEX "alert_triggers_isResolved_triggeredAt_idx" ON "public"."alert_triggers"("isResolved", "triggeredAt");

-- CreateIndex
CREATE INDEX "metric_cache_expiresAt_idx" ON "public"."metric_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "metric_cache_cacheKey_key" ON "public"."metric_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "benchmarks_metric_region_population_idx" ON "public"."benchmarks"("metric", "region", "population");

-- CreateIndex
CREATE INDEX "benchmarks_category_year_idx" ON "public"."benchmarks"("category", "year");

-- CreateIndex
CREATE INDEX "predictions_model_entityType_idx" ON "public"."predictions"("model", "entityType");

-- CreateIndex
CREATE INDEX "predictions_createdAt_idx" ON "public"."predictions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_domains_emailServerId_domainName_key" ON "public"."email_domains"("emailServerId", "domainName");

-- CreateIndex
CREATE UNIQUE INDEX "email_users_emailServerId_email_key" ON "public"."email_users"("emailServerId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "emails_messageId_key" ON "public"."emails"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "email_stats_emailServerId_date_key" ON "public"."email_stats"("emailServerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_name_key" ON "public"."email_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_provider_key" ON "public"."integrations"("provider");

-- CreateIndex
CREATE INDEX "integration_logs_integrationId_status_idx" ON "public"."integration_logs"("integrationId", "status");

-- CreateIndex
CREATE INDEX "integration_logs_entityType_entityId_idx" ON "public"."integration_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "cache_entries_key_key" ON "public"."cache_entries"("key");

-- CreateIndex
CREATE INDEX "cache_entries_expiresAt_idx" ON "public"."cache_entries"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "public"."audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_citizenId_idx" ON "public"."audit_logs"("citizenId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "public"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "public"."audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "rural_producers_citizenId_idx" ON "public"."rural_producers"("citizenId");

-- CreateIndex
CREATE INDEX "rural_producers_protocolId_idx" ON "public"."rural_producers"("protocolId");

-- CreateIndex
CREATE INDEX "rural_producers_status_idx" ON "public"."rural_producers"("status");

-- CreateIndex
CREATE INDEX "rural_producers_createdAt_idx" ON "public"."rural_producers"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "rural_producers_citizenId_key" ON "public"."rural_producers"("citizenId");

-- CreateIndex
CREATE INDEX "rural_properties_citizenId_idx" ON "public"."rural_properties"("citizenId");

-- CreateIndex
CREATE INDEX "rural_properties_producerId_idx" ON "public"."rural_properties"("producerId");

-- CreateIndex
CREATE INDEX "rural_properties_protocolId_idx" ON "public"."rural_properties"("protocolId");

-- CreateIndex
CREATE INDEX "rural_properties_status_idx" ON "public"."rural_properties"("status");

-- CreateIndex
CREATE INDEX "rural_properties_createdAt_idx" ON "public"."rural_properties"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_subscriptions_email_key" ON "public"."email_subscriptions"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cultural_attendances_protocol_key" ON "public"."cultural_attendances"("protocol");

-- CreateIndex
CREATE INDEX "cultural_attendances_protocolId_idx" ON "public"."cultural_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "cultural_attendances_status_idx" ON "public"."cultural_attendances"("status");

-- CreateIndex
CREATE INDEX "cultural_attendances_createdAt_idx" ON "public"."cultural_attendances"("createdAt");

-- CreateIndex
CREATE INDEX "cultural_workshop_enrollments_workshopId_idx" ON "public"."cultural_workshop_enrollments"("workshopId");

-- CreateIndex
CREATE INDEX "cultural_workshop_enrollments_status_idx" ON "public"."cultural_workshop_enrollments"("status");

-- CreateIndex
CREATE INDEX "cultural_workshop_enrollments_moduleType_idx" ON "public"."cultural_workshop_enrollments"("moduleType");

-- CreateIndex
CREATE INDEX "cultural_workshop_enrollments_protocolId_idx" ON "public"."cultural_workshop_enrollments"("protocolId");

-- CreateIndex
CREATE INDEX "cultural_workshop_enrollments_createdAt_idx" ON "public"."cultural_workshop_enrollments"("createdAt");

-- CreateIndex
CREATE INDEX "cultural_projects_protocolId_idx" ON "public"."cultural_projects"("protocolId");

-- CreateIndex
CREATE INDEX "cultural_projects_status_idx" ON "public"."cultural_projects"("status");

-- CreateIndex
CREATE INDEX "cultural_projects_createdAt_idx" ON "public"."cultural_projects"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "public_schools_code_key" ON "public"."public_schools"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sports_attendances_protocol_key" ON "public"."sports_attendances"("protocol");

-- CreateIndex
CREATE INDEX "sports_attendances_protocolId_idx" ON "public"."sports_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "sports_attendances_status_idx" ON "public"."sports_attendances"("status");

-- CreateIndex
CREATE INDEX "sports_attendances_createdAt_idx" ON "public"."sports_attendances"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "health_attendances_protocol_key" ON "public"."health_attendances"("protocol");

-- CreateIndex
CREATE INDEX "health_attendances_citizenId_idx" ON "public"."health_attendances"("citizenId");

-- CreateIndex
CREATE INDEX "health_attendances_moduleType_idx" ON "public"."health_attendances"("moduleType");

-- CreateIndex
CREATE INDEX "health_attendances_protocolId_idx" ON "public"."health_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "health_attendances_status_idx" ON "public"."health_attendances"("status");

-- CreateIndex
CREATE INDEX "health_attendances_createdAt_idx" ON "public"."health_attendances"("createdAt");

-- CreateIndex
CREATE INDEX "health_attendances_moduleType_status_idx" ON "public"."health_attendances"("moduleType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "medical_appointments_protocol_key" ON "public"."medical_appointments"("protocol");

-- CreateIndex
CREATE INDEX "medical_appointments_citizenId_idx" ON "public"."medical_appointments"("citizenId");

-- CreateIndex
CREATE INDEX "medical_appointments_moduleType_idx" ON "public"."medical_appointments"("moduleType");

-- CreateIndex
CREATE INDEX "medical_appointments_protocolId_idx" ON "public"."medical_appointments"("protocolId");

-- CreateIndex
CREATE INDEX "medical_appointments_status_idx" ON "public"."medical_appointments"("status");

-- CreateIndex
CREATE INDEX "medical_appointments_createdAt_idx" ON "public"."medical_appointments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_enrollments_protocol_key" ON "public"."campaign_enrollments"("protocol");

-- CreateIndex
CREATE INDEX "campaign_enrollments_citizenId_idx" ON "public"."campaign_enrollments"("citizenId");

-- CreateIndex
CREATE INDEX "campaign_enrollments_moduleType_idx" ON "public"."campaign_enrollments"("moduleType");

-- CreateIndex
CREATE INDEX "campaign_enrollments_protocolId_idx" ON "public"."campaign_enrollments"("protocolId");

-- CreateIndex
CREATE INDEX "campaign_enrollments_status_idx" ON "public"."campaign_enrollments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "home_cares_protocol_key" ON "public"."home_cares"("protocol");

-- CreateIndex
CREATE INDEX "home_cares_citizenId_idx" ON "public"."home_cares"("citizenId");

-- CreateIndex
CREATE INDEX "home_cares_moduleType_idx" ON "public"."home_cares"("moduleType");

-- CreateIndex
CREATE INDEX "home_cares_protocolId_idx" ON "public"."home_cares"("protocolId");

-- CreateIndex
CREATE INDEX "home_cares_status_idx" ON "public"."home_cares"("status");

-- CreateIndex
CREATE INDEX "medication_dispensing_patientId_idx" ON "public"."medication_dispensing"("patientId");

-- CreateIndex
CREATE INDEX "medication_dispensing_dispensedAt_idx" ON "public"."medication_dispensing"("dispensedAt");

-- CreateIndex
CREATE INDEX "medication_dispensing_medication_idx" ON "public"."medication_dispensing"("medication");

-- CreateIndex
CREATE UNIQUE INDEX "medication_dispenses_protocol_key" ON "public"."medication_dispenses"("protocol");

-- CreateIndex
CREATE INDEX "medication_dispenses_citizenId_idx" ON "public"."medication_dispenses"("citizenId");

-- CreateIndex
CREATE INDEX "medication_dispenses_moduleType_idx" ON "public"."medication_dispenses"("moduleType");

-- CreateIndex
CREATE INDEX "medication_dispenses_protocolId_idx" ON "public"."medication_dispenses"("protocolId");

-- CreateIndex
CREATE INDEX "medication_dispenses_status_idx" ON "public"."medication_dispenses"("status");

-- CreateIndex
CREATE INDEX "vaccinations_patientId_idx" ON "public"."vaccinations"("patientId");

-- CreateIndex
CREATE INDEX "vaccinations_appliedAt_idx" ON "public"."vaccinations"("appliedAt");

-- CreateIndex
CREATE INDEX "vaccinations_vaccine_idx" ON "public"."vaccinations"("vaccine");

-- CreateIndex
CREATE INDEX "vaccinations_moduleType_idx" ON "public"."vaccinations"("moduleType");

-- CreateIndex
CREATE INDEX "vaccinations_protocolId_idx" ON "public"."vaccinations"("protocolId");

-- CreateIndex
CREATE INDEX "vaccinations_createdAt_idx" ON "public"."vaccinations"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "vaccination_records_protocol_key" ON "public"."vaccination_records"("protocol");

-- CreateIndex
CREATE INDEX "vaccination_records_citizenId_idx" ON "public"."vaccination_records"("citizenId");

-- CreateIndex
CREATE INDEX "vaccination_records_moduleType_idx" ON "public"."vaccination_records"("moduleType");

-- CreateIndex
CREATE INDEX "vaccination_records_protocolId_idx" ON "public"."vaccination_records"("protocolId");

-- CreateIndex
CREATE INDEX "vaccination_records_status_idx" ON "public"."vaccination_records"("status");

-- CreateIndex
CREATE INDEX "vaccination_records_createdAt_idx" ON "public"."vaccination_records"("createdAt");

-- CreateIndex
CREATE INDEX "cultural_spaces_type_idx" ON "public"."cultural_spaces"("type");

-- CreateIndex
CREATE INDEX "cultural_spaces_status_idx" ON "public"."cultural_spaces"("status");

-- CreateIndex
CREATE INDEX "cultural_spaces_available_idx" ON "public"."cultural_spaces"("available");

-- CreateIndex
CREATE INDEX "cultural_spaces_neighborhood_idx" ON "public"."cultural_spaces"("neighborhood");

-- CreateIndex
CREATE UNIQUE INDEX "cultural_spaces_code_key" ON "public"."cultural_spaces"("code");

-- CreateIndex
CREATE INDEX "cultural_events_category_idx" ON "public"."cultural_events"("category");

-- CreateIndex
CREATE INDEX "cultural_events_status_idx" ON "public"."cultural_events"("status");

-- CreateIndex
CREATE INDEX "cultural_events_startDate_idx" ON "public"."cultural_events"("startDate");

-- CreateIndex
CREATE INDEX "cultural_events_spaceId_idx" ON "public"."cultural_events"("spaceId");

-- CreateIndex
CREATE INDEX "cultural_events_freeEvent_idx" ON "public"."cultural_events"("freeEvent");

-- CreateIndex
CREATE INDEX "cultural_events_protocolId_idx" ON "public"."cultural_events"("protocolId");

-- CreateIndex
CREATE INDEX "cultural_events_createdAt_idx" ON "public"."cultural_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "housing_attendances_protocol_key" ON "public"."housing_attendances"("protocol");

-- CreateIndex
CREATE INDEX "housing_attendances_protocolId_idx" ON "public"."housing_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "housing_attendances_status_idx" ON "public"."housing_attendances"("status");

-- CreateIndex
CREATE INDEX "housing_attendances_createdAt_idx" ON "public"."housing_attendances"("createdAt");

-- CreateIndex
CREATE INDEX "health_appointments_citizenId_idx" ON "public"."health_appointments"("citizenId");

-- CreateIndex
CREATE INDEX "health_appointments_moduleType_idx" ON "public"."health_appointments"("moduleType");

-- CreateIndex
CREATE INDEX "health_appointments_protocolId_idx" ON "public"."health_appointments"("protocolId");

-- CreateIndex
CREATE INDEX "health_appointments_status_idx" ON "public"."health_appointments"("status");

-- CreateIndex
CREATE INDEX "health_appointments_createdAt_idx" ON "public"."health_appointments"("createdAt");

-- CreateIndex
CREATE INDEX "health_appointments_moduleType_status_idx" ON "public"."health_appointments"("moduleType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "health_doctors_crm_key" ON "public"."health_doctors"("crm");

-- CreateIndex
CREATE UNIQUE INDEX "medical_specialties_code_key" ON "public"."medical_specialties"("code");

-- CreateIndex
CREATE UNIQUE INDEX "health_professionals_crm_key" ON "public"."health_professionals"("crm");

-- CreateIndex
CREATE UNIQUE INDEX "vulnerable_families_citizenId_key" ON "public"."vulnerable_families"("citizenId");

-- CreateIndex
CREATE INDEX "vulnerable_families_protocolId_idx" ON "public"."vulnerable_families"("protocolId");

-- CreateIndex
CREATE INDEX "vulnerable_families_status_idx" ON "public"."vulnerable_families"("status");

-- CreateIndex
CREATE INDEX "vulnerable_families_createdAt_idx" ON "public"."vulnerable_families"("createdAt");

-- CreateIndex
CREATE INDEX "benefit_requests_protocolId_idx" ON "public"."benefit_requests"("protocolId");

-- CreateIndex
CREATE INDEX "benefit_requests_status_idx" ON "public"."benefit_requests"("status");

-- CreateIndex
CREATE INDEX "benefit_requests_createdAt_idx" ON "public"."benefit_requests"("createdAt");

-- CreateIndex
CREATE INDEX "schools_createdAt_idx" ON "public"."schools"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "schools_code_key" ON "public"."schools"("code");

-- CreateIndex
CREATE INDEX "students_citizenId_idx" ON "public"."students"("citizenId");

-- CreateIndex
CREATE INDEX "students_moduleType_idx" ON "public"."students"("moduleType");

-- CreateIndex
CREATE INDEX "students_protocolId_idx" ON "public"."students"("protocolId");

-- CreateIndex
CREATE INDEX "students_createdAt_idx" ON "public"."students"("createdAt");

-- CreateIndex
CREATE INDEX "student_enrollments_status_idx" ON "public"."student_enrollments"("status");

-- CreateIndex
CREATE INDEX "student_enrollments_createdAt_idx" ON "public"."student_enrollments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollments_studentId_classId_year_key" ON "public"."student_enrollments"("studentId", "classId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollment_requests_protocol_key" ON "public"."student_enrollment_requests"("protocol");

-- CreateIndex
CREATE INDEX "student_enrollment_requests_citizenId_idx" ON "public"."student_enrollment_requests"("citizenId");

-- CreateIndex
CREATE INDEX "student_enrollment_requests_moduleType_idx" ON "public"."student_enrollment_requests"("moduleType");

-- CreateIndex
CREATE INDEX "student_enrollment_requests_protocolId_idx" ON "public"."student_enrollment_requests"("protocolId");

-- CreateIndex
CREATE INDEX "student_enrollment_requests_status_idx" ON "public"."student_enrollment_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "school_transport_requests_protocol_key" ON "public"."school_transport_requests"("protocol");

-- CreateIndex
CREATE INDEX "school_transport_requests_citizenId_idx" ON "public"."school_transport_requests"("citizenId");

-- CreateIndex
CREATE INDEX "school_transport_requests_moduleType_idx" ON "public"."school_transport_requests"("moduleType");

-- CreateIndex
CREATE INDEX "school_transport_requests_protocolId_idx" ON "public"."school_transport_requests"("protocolId");

-- CreateIndex
CREATE INDEX "school_transport_requests_status_idx" ON "public"."school_transport_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "school_meal_requests_protocol_key" ON "public"."school_meal_requests"("protocol");

-- CreateIndex
CREATE INDEX "school_meal_requests_citizenId_idx" ON "public"."school_meal_requests"("citizenId");

-- CreateIndex
CREATE INDEX "school_meal_requests_moduleType_idx" ON "public"."school_meal_requests"("moduleType");

-- CreateIndex
CREATE INDEX "school_meal_requests_protocolId_idx" ON "public"."school_meal_requests"("protocolId");

-- CreateIndex
CREATE INDEX "school_meal_requests_status_idx" ON "public"."school_meal_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "school_transfer_requests_protocol_key" ON "public"."school_transfer_requests"("protocol");

-- CreateIndex
CREATE INDEX "school_transfer_requests_citizenId_idx" ON "public"."school_transfer_requests"("citizenId");

-- CreateIndex
CREATE INDEX "school_transfer_requests_moduleType_idx" ON "public"."school_transfer_requests"("moduleType");

-- CreateIndex
CREATE INDEX "school_transfer_requests_protocolId_idx" ON "public"."school_transfer_requests"("protocolId");

-- CreateIndex
CREATE INDEX "school_transfer_requests_status_idx" ON "public"."school_transfer_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "school_material_requests_protocol_key" ON "public"."school_material_requests"("protocol");

-- CreateIndex
CREATE INDEX "school_material_requests_citizenId_idx" ON "public"."school_material_requests"("citizenId");

-- CreateIndex
CREATE INDEX "school_material_requests_moduleType_idx" ON "public"."school_material_requests"("moduleType");

-- CreateIndex
CREATE INDEX "school_material_requests_protocolId_idx" ON "public"."school_material_requests"("protocolId");

-- CreateIndex
CREATE INDEX "school_material_requests_status_idx" ON "public"."school_material_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "student_attendances_studentId_classId_date_key" ON "public"."student_attendances"("studentId", "classId", "date");

-- CreateIndex
CREATE INDEX "school_transports_moduleType_idx" ON "public"."school_transports"("moduleType");

-- CreateIndex
CREATE INDEX "school_transports_protocolId_idx" ON "public"."school_transports"("protocolId");

-- CreateIndex
CREATE INDEX "school_meals_moduleType_idx" ON "public"."school_meals"("moduleType");

-- CreateIndex
CREATE INDEX "school_meals_protocolId_idx" ON "public"."school_meals"("protocolId");

-- CreateIndex
CREATE INDEX "education_attendances_moduleType_idx" ON "public"."education_attendances"("moduleType");

-- CreateIndex
CREATE INDEX "education_attendances_protocolId_idx" ON "public"."education_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "education_attendances_citizenId_idx" ON "public"."education_attendances"("citizenId");

-- CreateIndex
CREATE INDEX "school_documents_moduleType_idx" ON "public"."school_documents"("moduleType");

-- CreateIndex
CREATE INDEX "school_documents_protocolId_idx" ON "public"."school_documents"("protocolId");

-- CreateIndex
CREATE INDEX "school_documents_citizenId_idx" ON "public"."school_documents"("citizenId");

-- CreateIndex
CREATE INDEX "student_transfers_moduleType_idx" ON "public"."student_transfers"("moduleType");

-- CreateIndex
CREATE INDEX "student_transfers_protocolId_idx" ON "public"."student_transfers"("protocolId");

-- CreateIndex
CREATE INDEX "attendance_records_moduleType_idx" ON "public"."attendance_records"("moduleType");

-- CreateIndex
CREATE INDEX "attendance_records_protocolId_idx" ON "public"."attendance_records"("protocolId");

-- CreateIndex
CREATE INDEX "attendance_records_citizenId_idx" ON "public"."attendance_records"("citizenId");

-- CreateIndex
CREATE INDEX "attendance_records_status_idx" ON "public"."attendance_records"("status");

-- CreateIndex
CREATE INDEX "attendance_records_createdAt_idx" ON "public"."attendance_records"("createdAt");

-- CreateIndex
CREATE INDEX "attendance_records_moduleType_status_idx" ON "public"."attendance_records"("moduleType", "status");

-- CreateIndex
CREATE INDEX "grade_records_protocolId_idx" ON "public"."grade_records"("protocolId");

-- CreateIndex
CREATE INDEX "grade_records_citizenId_idx" ON "public"."grade_records"("citizenId");

-- CreateIndex
CREATE INDEX "grade_records_status_idx" ON "public"."grade_records"("status");

-- CreateIndex
CREATE INDEX "grade_records_createdAt_idx" ON "public"."grade_records"("createdAt");

-- CreateIndex
CREATE INDEX "school_management_citizenId_idx" ON "public"."school_management"("citizenId");

-- CreateIndex
CREATE INDEX "athletes_protocolId_idx" ON "public"."athletes"("protocolId");

-- CreateIndex
CREATE INDEX "athletes_createdAt_idx" ON "public"."athletes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "athletes_cpf_key" ON "public"."athletes"("cpf");

-- CreateIndex
CREATE INDEX "tourist_attractions_protocolId_idx" ON "public"."tourist_attractions"("protocolId");

-- CreateIndex
CREATE INDEX "tourist_attractions_createdAt_idx" ON "public"."tourist_attractions"("createdAt");

-- CreateIndex
CREATE INDEX "health_transports_moduleType_idx" ON "public"."health_transports"("moduleType");

-- CreateIndex
CREATE INDEX "health_transports_protocolId_idx" ON "public"."health_transports"("protocolId");

-- CreateIndex
CREATE INDEX "health_transports_citizenId_idx" ON "public"."health_transports"("citizenId");

-- CreateIndex
CREATE INDEX "health_campaigns_moduleType_idx" ON "public"."health_campaigns"("moduleType");

-- CreateIndex
CREATE INDEX "health_campaigns_protocolId_idx" ON "public"."health_campaigns"("protocolId");

-- CreateIndex
CREATE INDEX "health_programs_moduleType_idx" ON "public"."health_programs"("moduleType");

-- CreateIndex
CREATE INDEX "health_programs_protocolId_idx" ON "public"."health_programs"("protocolId");

-- CreateIndex
CREATE INDEX "health_exams_citizenId_idx" ON "public"."health_exams"("citizenId");

-- CreateIndex
CREATE INDEX "health_exams_moduleType_idx" ON "public"."health_exams"("moduleType");

-- CreateIndex
CREATE INDEX "health_exams_protocolId_idx" ON "public"."health_exams"("protocolId");

-- CreateIndex
CREATE INDEX "health_exams_status_idx" ON "public"."health_exams"("status");

-- CreateIndex
CREATE UNIQUE INDEX "medical_exams_protocol_key" ON "public"."medical_exams"("protocol");

-- CreateIndex
CREATE INDEX "medical_exams_citizenId_idx" ON "public"."medical_exams"("citizenId");

-- CreateIndex
CREATE INDEX "medical_exams_moduleType_idx" ON "public"."medical_exams"("moduleType");

-- CreateIndex
CREATE INDEX "medical_exams_protocolId_idx" ON "public"."medical_exams"("protocolId");

-- CreateIndex
CREATE INDEX "medical_exams_status_idx" ON "public"."medical_exams"("status");

-- CreateIndex
CREATE INDEX "health_transport_requests_moduleType_idx" ON "public"."health_transport_requests"("moduleType");

-- CreateIndex
CREATE INDEX "health_transport_requests_protocolId_idx" ON "public"."health_transport_requests"("protocolId");

-- CreateIndex
CREATE INDEX "health_transport_requests_citizenId_idx" ON "public"."health_transport_requests"("citizenId");

-- CreateIndex
CREATE INDEX "patients_moduleType_idx" ON "public"."patients"("moduleType");

-- CreateIndex
CREATE INDEX "patients_protocolId_idx" ON "public"."patients"("protocolId");

-- CreateIndex
CREATE INDEX "patients_citizenId_idx" ON "public"."patients"("citizenId");

-- CreateIndex
CREATE INDEX "patients_status_idx" ON "public"."patients"("status");

-- CreateIndex
CREATE INDEX "patients_createdAt_idx" ON "public"."patients"("createdAt");

-- CreateIndex
CREATE INDEX "patients_moduleType_status_idx" ON "public"."patients"("moduleType", "status");

-- CreateIndex
CREATE INDEX "community_health_agents_moduleType_idx" ON "public"."community_health_agents"("moduleType");

-- CreateIndex
CREATE INDEX "community_health_agents_protocolId_idx" ON "public"."community_health_agents"("protocolId");

-- CreateIndex
CREATE INDEX "community_health_agents_citizenId_idx" ON "public"."community_health_agents"("citizenId");

-- CreateIndex
CREATE INDEX "disciplinary_records_citizenId_idx" ON "public"."disciplinary_records"("citizenId");

-- CreateIndex
CREATE INDEX "competitions_protocolId_idx" ON "public"."competitions"("protocolId");

-- CreateIndex
CREATE INDEX "competitions_status_idx" ON "public"."competitions"("status");

-- CreateIndex
CREATE INDEX "competitions_createdAt_idx" ON "public"."competitions"("createdAt");

-- CreateIndex
CREATE INDEX "sports_school_enrollments_protocolId_idx" ON "public"."sports_school_enrollments"("protocolId");

-- CreateIndex
CREATE INDEX "sports_school_enrollments_status_idx" ON "public"."sports_school_enrollments"("status");

-- CreateIndex
CREATE INDEX "sports_school_enrollments_createdAt_idx" ON "public"."sports_school_enrollments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "security_occurrences_protocol_key" ON "public"."security_occurrences"("protocol");

-- CreateIndex
CREATE INDEX "security_occurrences_protocolId_idx" ON "public"."security_occurrences"("protocolId");

-- CreateIndex
CREATE INDEX "security_occurrences_status_idx" ON "public"."security_occurrences"("status");

-- CreateIndex
CREATE INDEX "security_occurrences_createdAt_idx" ON "public"."security_occurrences"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "security_attendances_protocol_key" ON "public"."security_attendances"("protocol");

-- CreateIndex
CREATE INDEX "security_attendances_protocolId_idx" ON "public"."security_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "security_attendances_status_idx" ON "public"."security_attendances"("status");

-- CreateIndex
CREATE INDEX "security_attendances_createdAt_idx" ON "public"."security_attendances"("createdAt");

-- CreateIndex
CREATE INDEX "local_businesses_protocolId_idx" ON "public"."local_businesses"("protocolId");

-- CreateIndex
CREATE INDEX "local_businesses_createdAt_idx" ON "public"."local_businesses"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tourism_attendances_protocol_key" ON "public"."tourism_attendances"("protocol");

-- CreateIndex
CREATE INDEX "tourism_attendances_protocolId_idx" ON "public"."tourism_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "tourism_attendances_status_idx" ON "public"."tourism_attendances"("status");

-- CreateIndex
CREATE INDEX "tourism_attendances_createdAt_idx" ON "public"."tourism_attendances"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tourism_guides_cpf_key" ON "public"."tourism_guides"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "environmental_licenses_licenseNumber_key" ON "public"."environmental_licenses"("licenseNumber");

-- CreateIndex
CREATE INDEX "environmental_licenses_protocolId_idx" ON "public"."environmental_licenses"("protocolId");

-- CreateIndex
CREATE INDEX "environmental_licenses_status_idx" ON "public"."environmental_licenses"("status");

-- CreateIndex
CREATE INDEX "environmental_licenses_createdAt_idx" ON "public"."environmental_licenses"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "environmental_complaints_protocol_key" ON "public"."environmental_complaints"("protocol");

-- CreateIndex
CREATE INDEX "environmental_complaints_protocolId_idx" ON "public"."environmental_complaints"("protocolId");

-- CreateIndex
CREATE INDEX "environmental_complaints_status_idx" ON "public"."environmental_complaints"("status");

-- CreateIndex
CREATE INDEX "environmental_complaints_createdAt_idx" ON "public"."environmental_complaints"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "environmental_attendances_protocol_key" ON "public"."environmental_attendances"("protocol");

-- CreateIndex
CREATE INDEX "environmental_attendances_protocolId_idx" ON "public"."environmental_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "environmental_attendances_status_idx" ON "public"."environmental_attendances"("status");

-- CreateIndex
CREATE INDEX "environmental_attendances_createdAt_idx" ON "public"."environmental_attendances"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tree_cutting_authorizations_authorizationNumber_key" ON "public"."tree_cutting_authorizations"("authorizationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "environmental_inspections_inspectionNumber_key" ON "public"."environmental_inspections"("inspectionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "technical_assistances_protocolId_key" ON "public"."technical_assistances"("protocolId");

-- CreateIndex
CREATE INDEX "technical_assistances_citizenId_idx" ON "public"."technical_assistances"("citizenId");

-- CreateIndex
CREATE INDEX "technical_assistances_producerId_idx" ON "public"."technical_assistances"("producerId");

-- CreateIndex
CREATE INDEX "technical_assistances_protocolId_idx" ON "public"."technical_assistances"("protocolId");

-- CreateIndex
CREATE INDEX "technical_assistances_status_idx" ON "public"."technical_assistances"("status");

-- CreateIndex
CREATE INDEX "technical_assistances_scheduledDate_idx" ON "public"."technical_assistances"("scheduledDate");

-- CreateIndex
CREATE INDEX "technical_assistances_createdAt_idx" ON "public"."technical_assistances"("createdAt");

-- CreateIndex
CREATE INDEX "rural_program_enrollments_citizenId_idx" ON "public"."rural_program_enrollments"("citizenId");

-- CreateIndex
CREATE INDEX "rural_program_enrollments_programId_idx" ON "public"."rural_program_enrollments"("programId");

-- CreateIndex
CREATE INDEX "rural_program_enrollments_status_idx" ON "public"."rural_program_enrollments"("status");

-- CreateIndex
CREATE INDEX "rural_program_enrollments_moduleType_idx" ON "public"."rural_program_enrollments"("moduleType");

-- CreateIndex
CREATE INDEX "rural_program_enrollments_protocolId_idx" ON "public"."rural_program_enrollments"("protocolId");

-- CreateIndex
CREATE INDEX "rural_program_enrollments_createdAt_idx" ON "public"."rural_program_enrollments"("createdAt");

-- CreateIndex
CREATE INDEX "rural_training_enrollments_citizenId_idx" ON "public"."rural_training_enrollments"("citizenId");

-- CreateIndex
CREATE INDEX "rural_training_enrollments_trainingId_idx" ON "public"."rural_training_enrollments"("trainingId");

-- CreateIndex
CREATE INDEX "rural_training_enrollments_status_idx" ON "public"."rural_training_enrollments"("status");

-- CreateIndex
CREATE INDEX "rural_training_enrollments_moduleType_idx" ON "public"."rural_training_enrollments"("moduleType");

-- CreateIndex
CREATE INDEX "rural_training_enrollments_protocolId_idx" ON "public"."rural_training_enrollments"("protocolId");

-- CreateIndex
CREATE INDEX "rural_training_enrollments_createdAt_idx" ON "public"."rural_training_enrollments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "agriculture_attendances_protocolId_key" ON "public"."agriculture_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "agriculture_attendances_citizenId_idx" ON "public"."agriculture_attendances"("citizenId");

-- CreateIndex
CREATE INDEX "agriculture_attendances_producerId_idx" ON "public"."agriculture_attendances"("producerId");

-- CreateIndex
CREATE INDEX "agriculture_attendances_protocolId_idx" ON "public"."agriculture_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "agriculture_attendances_status_idx" ON "public"."agriculture_attendances"("status");

-- CreateIndex
CREATE INDEX "agriculture_attendances_scheduledDate_idx" ON "public"."agriculture_attendances"("scheduledDate");

-- CreateIndex
CREATE INDEX "agriculture_attendances_createdAt_idx" ON "public"."agriculture_attendances"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "housing_applications_protocol_key" ON "public"."housing_applications"("protocol");

-- CreateIndex
CREATE INDEX "housing_applications_protocolId_idx" ON "public"."housing_applications"("protocolId");

-- CreateIndex
CREATE INDEX "housing_applications_status_idx" ON "public"."housing_applications"("status");

-- CreateIndex
CREATE INDEX "housing_applications_createdAt_idx" ON "public"."housing_applications"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "housing_units_unitCode_key" ON "public"."housing_units"("unitCode");

-- CreateIndex
CREATE INDEX "housing_units_protocolId_idx" ON "public"."housing_units"("protocolId");

-- CreateIndex
CREATE INDEX "housing_units_status_idx" ON "public"."housing_units"("status");

-- CreateIndex
CREATE INDEX "housing_units_createdAt_idx" ON "public"."housing_units"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "land_regularizations_protocol_key" ON "public"."land_regularizations"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "rent_assistances_protocol_key" ON "public"."rent_assistances"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "social_assistance_attendances_protocol_key" ON "public"."social_assistance_attendances"("protocol");

-- CreateIndex
CREATE INDEX "social_assistance_attendances_protocolId_idx" ON "public"."social_assistance_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "social_assistance_attendances_status_idx" ON "public"."social_assistance_attendances"("status");

-- CreateIndex
CREATE INDEX "social_assistance_attendances_createdAt_idx" ON "public"."social_assistance_attendances"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "social_program_enrollments_protocol_key" ON "public"."social_program_enrollments"("protocol");

-- CreateIndex
CREATE INDEX "social_program_enrollments_citizenId_idx" ON "public"."social_program_enrollments"("citizenId");

-- CreateIndex
CREATE INDEX "social_program_enrollments_protocolId_idx" ON "public"."social_program_enrollments"("protocolId");

-- CreateIndex
CREATE INDEX "social_program_enrollments_status_idx" ON "public"."social_program_enrollments"("status");

-- CreateIndex
CREATE INDEX "social_program_enrollments_createdAt_idx" ON "public"."social_program_enrollments"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "social_benefit_requests_protocol_key" ON "public"."social_benefit_requests"("protocol");

-- CreateIndex
CREATE INDEX "social_benefit_requests_citizenId_idx" ON "public"."social_benefit_requests"("citizenId");

-- CreateIndex
CREATE INDEX "social_benefit_requests_protocolId_idx" ON "public"."social_benefit_requests"("protocolId");

-- CreateIndex
CREATE INDEX "social_benefit_requests_status_idx" ON "public"."social_benefit_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "document_requests_protocol_key" ON "public"."document_requests"("protocol");

-- CreateIndex
CREATE INDEX "document_requests_citizenId_idx" ON "public"."document_requests"("citizenId");

-- CreateIndex
CREATE INDEX "document_requests_protocolId_idx" ON "public"."document_requests"("protocolId");

-- CreateIndex
CREATE INDEX "document_requests_status_idx" ON "public"."document_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "family_registrations_protocol_key" ON "public"."family_registrations"("protocol");

-- CreateIndex
CREATE INDEX "family_registrations_citizenId_idx" ON "public"."family_registrations"("citizenId");

-- CreateIndex
CREATE INDEX "family_registrations_protocolId_idx" ON "public"."family_registrations"("protocolId");

-- CreateIndex
CREATE INDEX "family_registrations_status_idx" ON "public"."family_registrations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "social_home_visits_protocol_key" ON "public"."social_home_visits"("protocol");

-- CreateIndex
CREATE INDEX "social_home_visits_citizenId_idx" ON "public"."social_home_visits"("citizenId");

-- CreateIndex
CREATE INDEX "social_home_visits_protocolId_idx" ON "public"."social_home_visits"("protocolId");

-- CreateIndex
CREATE INDEX "social_home_visits_status_idx" ON "public"."social_home_visits"("status");

-- CreateIndex
CREATE UNIQUE INDEX "work_inspections_protocol_key" ON "public"."work_inspections"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "public_works_attendances_protocol_key" ON "public"."public_works_attendances"("protocol");

-- CreateIndex
CREATE INDEX "public_works_attendances_protocolId_idx" ON "public"."public_works_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "public_works_attendances_status_idx" ON "public"."public_works_attendances"("status");

-- CreateIndex
CREATE INDEX "public_works_attendances_createdAt_idx" ON "public"."public_works_attendances"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "road_repair_requests_protocol_key" ON "public"."road_repair_requests"("protocol");

-- CreateIndex
CREATE INDEX "road_repair_requests_protocolId_idx" ON "public"."road_repair_requests"("protocolId");

-- CreateIndex
CREATE INDEX "road_repair_requests_status_idx" ON "public"."road_repair_requests"("status");

-- CreateIndex
CREATE INDEX "road_repair_requests_createdAt_idx" ON "public"."road_repair_requests"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "technical_inspections_protocol_key" ON "public"."technical_inspections"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "public_service_requests_protocol_key" ON "public"."public_service_requests"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "street_lightings_pointCode_key" ON "public"."street_lightings"("pointCode");

-- CreateIndex
CREATE INDEX "street_lightings_protocolId_idx" ON "public"."street_lightings"("protocolId");

-- CreateIndex
CREATE INDEX "street_lightings_status_idx" ON "public"."street_lightings"("status");

-- CreateIndex
CREATE INDEX "street_lightings_createdAt_idx" ON "public"."street_lightings"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "public_problem_reports_protocol_key" ON "public"."public_problem_reports"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "service_teams_teamCode_key" ON "public"."service_teams"("teamCode");

-- CreateIndex
CREATE INDEX "public_service_attendances_protocolId_idx" ON "public"."public_service_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "public_service_attendances_status_idx" ON "public"."public_service_attendances"("status");

-- CreateIndex
CREATE INDEX "public_service_attendances_createdAt_idx" ON "public"."public_service_attendances"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "specialized_pages_pageKey_key" ON "public"."specialized_pages"("pageKey");

-- CreateIndex
CREATE UNIQUE INDEX "specialized_pages_code_key" ON "public"."specialized_pages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "page_metrics_pageId_date_key" ON "public"."page_metrics"("pageId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "page_configurations_pageId_key_key" ON "public"."page_configurations"("pageId", "key");

-- CreateIndex
CREATE INDEX "agenda_events_dataHoraInicio_idx" ON "public"."agenda_events"("dataHoraInicio");

-- CreateIndex
CREATE INDEX "agenda_events_status_idx" ON "public"."agenda_events"("status");

-- CreateIndex
CREATE INDEX "infrastructure_problems_type_idx" ON "public"."infrastructure_problems"("type");

-- CreateIndex
CREATE INDEX "infrastructure_problems_status_idx" ON "public"."infrastructure_problems"("status");

-- CreateIndex
CREATE INDEX "urban_maintenance_requests_type_idx" ON "public"."urban_maintenance_requests"("type");

-- CreateIndex
CREATE INDEX "urban_maintenance_requests_status_idx" ON "public"."urban_maintenance_requests"("status");

-- CreateIndex
CREATE INDEX "housing_requests_type_idx" ON "public"."housing_requests"("type");

-- CreateIndex
CREATE INDEX "housing_requests_status_idx" ON "public"."housing_requests"("status");

-- CreateIndex
CREATE INDEX "housing_requests_citizenCpf_idx" ON "public"."housing_requests"("citizenCpf");

-- CreateIndex
CREATE INDEX "tree_authorizations_protocol_idx" ON "public"."tree_authorizations"("protocol");

-- CreateIndex
CREATE INDEX "tree_authorizations_status_idx" ON "public"."tree_authorizations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "organic_certifications_certificationNumber_key" ON "public"."organic_certifications"("certificationNumber");

-- CreateIndex
CREATE INDEX "organic_certifications_protocol_idx" ON "public"."organic_certifications"("protocol");

-- CreateIndex
CREATE INDEX "organic_certifications_status_idx" ON "public"."organic_certifications"("status");

-- CreateIndex
CREATE INDEX "seed_distributions_protocol_idx" ON "public"."seed_distributions"("protocol");

-- CreateIndex
CREATE INDEX "seed_distributions_status_idx" ON "public"."seed_distributions"("status");

-- CreateIndex
CREATE INDEX "soil_analyses_protocol_idx" ON "public"."soil_analyses"("protocol");

-- CreateIndex
CREATE INDEX "soil_analyses_status_idx" ON "public"."soil_analyses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "farmer_market_registrations_registrationNumber_key" ON "public"."farmer_market_registrations"("registrationNumber");

-- CreateIndex
CREATE INDEX "farmer_market_registrations_protocol_idx" ON "public"."farmer_market_registrations"("protocol");

-- CreateIndex
CREATE INDEX "farmer_market_registrations_status_idx" ON "public"."farmer_market_registrations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "urban_certificates_certificateNumber_key" ON "public"."urban_certificates"("certificateNumber");

-- CreateIndex
CREATE INDEX "urban_certificates_protocol_idx" ON "public"."urban_certificates"("protocol");

-- CreateIndex
CREATE INDEX "urban_certificates_status_idx" ON "public"."urban_certificates"("status");

-- CreateIndex
CREATE INDEX "urban_certificates_certificateType_idx" ON "public"."urban_certificates"("certificateType");

-- CreateIndex
CREATE INDEX "property_numbering_protocol_idx" ON "public"."property_numbering"("protocol");

-- CreateIndex
CREATE INDEX "property_numbering_status_idx" ON "public"."property_numbering"("status");

-- CreateIndex
CREATE INDEX "lot_subdivisions_protocol_idx" ON "public"."lot_subdivisions"("protocol");

-- CreateIndex
CREATE INDEX "lot_subdivisions_status_idx" ON "public"."lot_subdivisions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "police_reports_reportNumber_key" ON "public"."police_reports"("reportNumber");

-- CreateIndex
CREATE INDEX "police_reports_status_idx" ON "public"."police_reports"("status");

-- CreateIndex
CREATE INDEX "police_reports_type_idx" ON "public"."police_reports"("type");

-- CreateIndex
CREATE INDEX "police_reports_reportNumber_idx" ON "public"."police_reports"("reportNumber");

-- CreateIndex
CREATE INDEX "police_reports_occurrenceDate_idx" ON "public"."police_reports"("occurrenceDate");

-- CreateIndex
CREATE INDEX "patrol_requests_status_idx" ON "public"."patrol_requests"("status");

-- CreateIndex
CREATE INDEX "patrol_requests_type_idx" ON "public"."patrol_requests"("type");

-- CreateIndex
CREATE INDEX "patrol_requests_requestedDate_idx" ON "public"."patrol_requests"("requestedDate");

-- CreateIndex
CREATE INDEX "camera_requests_status_idx" ON "public"."camera_requests"("status");

-- CreateIndex
CREATE INDEX "camera_requests_type_idx" ON "public"."camera_requests"("type");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_tips_tipNumber_key" ON "public"."anonymous_tips"("tipNumber");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_tips_feedbackCode_key" ON "public"."anonymous_tips"("feedbackCode");

-- CreateIndex
CREATE INDEX "anonymous_tips_status_idx" ON "public"."anonymous_tips"("status");

-- CreateIndex
CREATE INDEX "anonymous_tips_type_idx" ON "public"."anonymous_tips"("type");

-- CreateIndex
CREATE INDEX "anonymous_tips_tipNumber_idx" ON "public"."anonymous_tips"("tipNumber");

-- CreateIndex
CREATE INDEX "anonymous_tips_feedbackCode_idx" ON "public"."anonymous_tips"("feedbackCode");

-- CreateIndex
CREATE UNIQUE INDEX "municipal_guards_badge_key" ON "public"."municipal_guards"("badge");

-- CreateIndex
CREATE INDEX "municipal_guards_status_idx" ON "public"."municipal_guards"("status");

-- CreateIndex
CREATE INDEX "municipal_guards_badge_idx" ON "public"."municipal_guards"("badge");

-- CreateIndex
CREATE UNIQUE INDEX "surveillance_systems_systemCode_key" ON "public"."surveillance_systems"("systemCode");

-- CreateIndex
CREATE INDEX "surveillance_systems_status_idx" ON "public"."surveillance_systems"("status");

-- CreateIndex
CREATE INDEX "surveillance_systems_type_idx" ON "public"."surveillance_systems"("type");

-- CreateIndex
CREATE INDEX "surveillance_systems_systemCode_idx" ON "public"."surveillance_systems"("systemCode");

-- CreateIndex
CREATE INDEX "event_authorizations_status_idx" ON "public"."event_authorizations"("status");

-- CreateIndex
CREATE INDEX "event_authorizations_eventDate_idx" ON "public"."event_authorizations"("eventDate");

-- CreateIndex
CREATE INDEX "lost_and_found_type_idx" ON "public"."lost_and_found"("type");

-- CreateIndex
CREATE INDEX "lost_and_found_status_idx" ON "public"."lost_and_found"("status");

-- CreateIndex
CREATE INDEX "lost_and_found_itemType_idx" ON "public"."lost_and_found"("itemType");

-- CreateIndex
CREATE INDEX "lost_and_found_lostFoundDate_idx" ON "public"."lost_and_found"("lostFoundDate");

-- CreateIndex
CREATE UNIQUE INDEX "custom_data_tables_tableName_key" ON "public"."custom_data_tables"("tableName");

-- CreateIndex
CREATE INDEX "custom_data_records_tableId_idx" ON "public"."custom_data_records"("tableId");

-- CreateIndex
CREATE INDEX "custom_data_records_protocol_idx" ON "public"."custom_data_records"("protocol");

-- CreateIndex
CREATE INDEX "custom_data_records_serviceId_idx" ON "public"."custom_data_records"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "urban_planning_attendance_protocolId_key" ON "public"."urban_planning_attendance"("protocolId");

-- CreateIndex
CREATE INDEX "urban_planning_attendance_citizenCpf_idx" ON "public"."urban_planning_attendance"("citizenCpf");

-- CreateIndex
CREATE INDEX "urban_planning_attendance_status_idx" ON "public"."urban_planning_attendance"("status");

-- CreateIndex
CREATE INDEX "urban_planning_attendance_attendanceType_idx" ON "public"."urban_planning_attendance"("attendanceType");

-- CreateIndex
CREATE UNIQUE INDEX "project_approvals_protocolId_key" ON "public"."project_approvals"("protocolId");

-- CreateIndex
CREATE INDEX "project_approvals_ownerCpf_idx" ON "public"."project_approvals"("ownerCpf");

-- CreateIndex
CREATE INDEX "project_approvals_status_idx" ON "public"."project_approvals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "building_permits_protocolId_key" ON "public"."building_permits"("protocolId");

-- CreateIndex
CREATE INDEX "building_permits_ownerCpf_idx" ON "public"."building_permits"("ownerCpf");

-- CreateIndex
CREATE INDEX "building_permits_status_idx" ON "public"."building_permits"("status");

-- CreateIndex
CREATE INDEX "building_permits_expiresAt_idx" ON "public"."building_permits"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "operating_licenses_protocolId_key" ON "public"."operating_licenses"("protocolId");

-- CreateIndex
CREATE INDEX "operating_licenses_cnpj_idx" ON "public"."operating_licenses"("cnpj");

-- CreateIndex
CREATE INDEX "operating_licenses_ownerCpf_idx" ON "public"."operating_licenses"("ownerCpf");

-- CreateIndex
CREATE INDEX "operating_licenses_status_idx" ON "public"."operating_licenses"("status");

-- CreateIndex
CREATE INDEX "operating_licenses_expiresAt_idx" ON "public"."operating_licenses"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_requests_protocolId_key" ON "public"."certificate_requests"("protocolId");

-- CreateIndex
CREATE INDEX "certificate_requests_requesterCpf_idx" ON "public"."certificate_requests"("requesterCpf");

-- CreateIndex
CREATE INDEX "certificate_requests_status_idx" ON "public"."certificate_requests"("status");

-- CreateIndex
CREATE INDEX "certificate_requests_certificateType_idx" ON "public"."certificate_requests"("certificateType");

-- CreateIndex
CREATE UNIQUE INDEX "illegal_construction_reports_protocolId_key" ON "public"."illegal_construction_reports"("protocolId");

-- CreateIndex
CREATE INDEX "illegal_construction_reports_status_idx" ON "public"."illegal_construction_reports"("status");

-- CreateIndex
CREATE INDEX "illegal_construction_reports_neighborhood_idx" ON "public"."illegal_construction_reports"("neighborhood");

-- CreateIndex
CREATE UNIQUE INDEX "subdivision_registrations_protocolId_key" ON "public"."subdivision_registrations"("protocolId");

-- CreateIndex
CREATE INDEX "subdivision_registrations_status_idx" ON "public"."subdivision_registrations"("status");

-- CreateIndex
CREATE INDEX "subdivision_registrations_subdivisionName_idx" ON "public"."subdivision_registrations"("subdivisionName");

-- CreateIndex
CREATE UNIQUE INDEX "public_works_attendance_phase3_protocolId_key" ON "public"."public_works_attendance_phase3"("protocolId");

-- CreateIndex
CREATE INDEX "public_works_attendance_phase3_citizenCpf_idx" ON "public"."public_works_attendance_phase3"("citizenCpf");

-- CreateIndex
CREATE INDEX "public_works_attendance_phase3_status_idx" ON "public"."public_works_attendance_phase3"("status");

-- CreateIndex
CREATE UNIQUE INDEX "road_repair_requests_phase3_protocolId_key" ON "public"."road_repair_requests_phase3"("protocolId");

-- CreateIndex
CREATE INDEX "road_repair_requests_phase3_status_idx" ON "public"."road_repair_requests_phase3"("status");

-- CreateIndex
CREATE INDEX "road_repair_requests_phase3_neighborhood_idx" ON "public"."road_repair_requests_phase3"("neighborhood");

-- CreateIndex
CREATE INDEX "road_repair_requests_phase3_problemType_idx" ON "public"."road_repair_requests_phase3"("problemType");

-- CreateIndex
CREATE UNIQUE INDEX "technical_inspections_phase3_protocolId_key" ON "public"."technical_inspections_phase3"("protocolId");

-- CreateIndex
CREATE INDEX "technical_inspections_phase3_status_idx" ON "public"."technical_inspections_phase3"("status");

-- CreateIndex
CREATE INDEX "technical_inspections_phase3_inspectionType_idx" ON "public"."technical_inspections_phase3"("inspectionType");

-- CreateIndex
CREATE UNIQUE INDEX "public_work_registrations_protocolId_key" ON "public"."public_work_registrations"("protocolId");

-- CreateIndex
CREATE INDEX "public_work_registrations_status_idx" ON "public"."public_work_registrations"("status");

-- CreateIndex
CREATE INDEX "public_work_registrations_workType_idx" ON "public"."public_work_registrations"("workType");

-- CreateIndex
CREATE INDEX "public_work_registrations_neighborhood_idx" ON "public"."public_work_registrations"("neighborhood");

-- CreateIndex
CREATE UNIQUE INDEX "work_inspections_phase3_protocolId_key" ON "public"."work_inspections_phase3"("protocolId");

-- CreateIndex
CREATE INDEX "work_inspections_phase3_workName_idx" ON "public"."work_inspections_phase3"("workName");

-- CreateIndex
CREATE INDEX "work_inspections_phase3_inspectionDate_idx" ON "public"."work_inspections_phase3"("inspectionDate");

-- CreateIndex
CREATE UNIQUE INDEX "public_service_attendance_phase3_protocolId_key" ON "public"."public_service_attendance_phase3"("protocolId");

-- CreateIndex
CREATE INDEX "public_service_attendance_phase3_citizenCpf_idx" ON "public"."public_service_attendance_phase3"("citizenCpf");

-- CreateIndex
CREATE INDEX "public_service_attendance_phase3_status_idx" ON "public"."public_service_attendance_phase3"("status");

-- CreateIndex
CREATE UNIQUE INDEX "public_lighting_requests_protocolId_key" ON "public"."public_lighting_requests"("protocolId");

-- CreateIndex
CREATE INDEX "public_lighting_requests_status_idx" ON "public"."public_lighting_requests"("status");

-- CreateIndex
CREATE INDEX "public_lighting_requests_neighborhood_idx" ON "public"."public_lighting_requests"("neighborhood");

-- CreateIndex
CREATE INDEX "public_lighting_requests_requestType_idx" ON "public"."public_lighting_requests"("requestType");

-- CreateIndex
CREATE UNIQUE INDEX "urban_cleaning_requests_protocolId_key" ON "public"."urban_cleaning_requests"("protocolId");

-- CreateIndex
CREATE INDEX "urban_cleaning_requests_status_idx" ON "public"."urban_cleaning_requests"("status");

-- CreateIndex
CREATE INDEX "urban_cleaning_requests_neighborhood_idx" ON "public"."urban_cleaning_requests"("neighborhood");

-- CreateIndex
CREATE INDEX "urban_cleaning_requests_cleaningType_idx" ON "public"."urban_cleaning_requests"("cleaningType");

-- CreateIndex
CREATE UNIQUE INDEX "special_collection_requests_protocolId_key" ON "public"."special_collection_requests"("protocolId");

-- CreateIndex
CREATE INDEX "special_collection_requests_status_idx" ON "public"."special_collection_requests"("status");

-- CreateIndex
CREATE INDEX "special_collection_requests_neighborhood_idx" ON "public"."special_collection_requests"("neighborhood");

-- CreateIndex
CREATE INDEX "special_collection_requests_collectionType_idx" ON "public"."special_collection_requests"("collectionType");

-- CreateIndex
CREATE UNIQUE INDEX "weeding_requests_phase3_protocolId_key" ON "public"."weeding_requests_phase3"("protocolId");

-- CreateIndex
CREATE INDEX "weeding_requests_phase3_status_idx" ON "public"."weeding_requests_phase3"("status");

-- CreateIndex
CREATE INDEX "weeding_requests_phase3_neighborhood_idx" ON "public"."weeding_requests_phase3"("neighborhood");

-- CreateIndex
CREATE UNIQUE INDEX "drainage_unblock_requests_protocolId_key" ON "public"."drainage_unblock_requests"("protocolId");

-- CreateIndex
CREATE INDEX "drainage_unblock_requests_status_idx" ON "public"."drainage_unblock_requests"("status");

-- CreateIndex
CREATE INDEX "drainage_unblock_requests_neighborhood_idx" ON "public"."drainage_unblock_requests"("neighborhood");

-- CreateIndex
CREATE INDEX "drainage_unblock_requests_causingFlooding_idx" ON "public"."drainage_unblock_requests"("causingFlooding");

-- CreateIndex
CREATE UNIQUE INDEX "tree_pruning_requests_phase3_protocolId_key" ON "public"."tree_pruning_requests_phase3"("protocolId");

-- CreateIndex
CREATE INDEX "tree_pruning_requests_phase3_status_idx" ON "public"."tree_pruning_requests_phase3"("status");

-- CreateIndex
CREATE INDEX "tree_pruning_requests_phase3_neighborhood_idx" ON "public"."tree_pruning_requests_phase3"("neighborhood");

-- CreateIndex
CREATE INDEX "tree_pruning_requests_phase3_urgency_idx" ON "public"."tree_pruning_requests_phase3"("urgency");

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_compositions" ADD CONSTRAINT "family_compositions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "public"."citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_compositions" ADD CONSTRAINT "family_compositions_headId_fkey" FOREIGN KEY ("headId") REFERENCES "public"."citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services_simplified" ADD CONSTRAINT "services_simplified_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."protocols_simplified" ADD CONSTRAINT "protocols_simplified_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."protocols_simplified" ADD CONSTRAINT "protocols_simplified_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."protocols_simplified" ADD CONSTRAINT "protocols_simplified_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."protocols_simplified" ADD CONSTRAINT "protocols_simplified_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."protocols_simplified" ADD CONSTRAINT "protocols_simplified_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."protocol_history_simplified" ADD CONSTRAINT "protocol_history_simplified_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."protocol_evaluations_simplified" ADD CONSTRAINT "protocol_evaluations_simplified_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."protocol_interactions" ADD CONSTRAINT "protocol_interactions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."protocol_documents" ADD CONSTRAINT "protocol_documents_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."protocol_pendings" ADD CONSTRAINT "protocol_pendings_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."protocol_stages" ADD CONSTRAINT "protocol_stages_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."protocol_sla" ADD CONSTRAINT "protocol_sla_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."citizen_transfer_requests" ADD CONSTRAINT "citizen_transfer_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."citizen_transfer_requests" ADD CONSTRAINT "citizen_transfer_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."report_executions" ADD CONSTRAINT "report_executions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "public"."reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alert_triggers" ADD CONSTRAINT "alert_triggers_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "public"."alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_domains" ADD CONSTRAINT "email_domains_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "public"."email_servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_users" ADD CONSTRAINT "email_users_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "public"."email_servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emails" ADD CONSTRAINT "emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."email_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emails" ADD CONSTRAINT "emails_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "public"."email_domains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emails" ADD CONSTRAINT "emails_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "public"."email_servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_events" ADD CONSTRAINT "email_events_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "public"."emails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_logs" ADD CONSTRAINT "email_logs_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "public"."email_servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_stats" ADD CONSTRAINT "email_stats_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "public"."email_servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."email_auth_attempts" ADD CONSTRAINT "email_auth_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."email_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."integration_logs" ADD CONSTRAINT "integration_logs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "public"."integrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_producers" ADD CONSTRAINT "rural_producers_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_producers" ADD CONSTRAINT "rural_producers_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_properties" ADD CONSTRAINT "rural_properties_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_properties" ADD CONSTRAINT "rural_properties_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_properties" ADD CONSTRAINT "rural_properties_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "public"."rural_producers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."urban_zoning" ADD CONSTRAINT "urban_zoning_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."business_licenses" ADD CONSTRAINT "business_licenses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."urban_infractions" ADD CONSTRAINT "urban_infractions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cultural_attendances" ADD CONSTRAINT "cultural_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."artistic_groups" ADD CONSTRAINT "artistic_groups_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cultural_manifestations" ADD CONSTRAINT "cultural_manifestations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cultural_workshop_enrollments" ADD CONSTRAINT "cultural_workshop_enrollments_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "public"."cultural_workshops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cultural_workshop_enrollments" ADD CONSTRAINT "cultural_workshop_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cultural_workshop_enrollments" ADD CONSTRAINT "cultural_workshop_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cultural_projects" ADD CONSTRAINT "cultural_projects_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cultural_project_submissions" ADD CONSTRAINT "cultural_project_submissions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_calls" ADD CONSTRAINT "school_calls_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."public_schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sports_attendances" ADD CONSTRAINT "sports_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_attendances" ADD CONSTRAINT "health_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_attendances" ADD CONSTRAINT "health_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_appointments" ADD CONSTRAINT "medical_appointments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_appointments" ADD CONSTRAINT "medical_appointments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_enrollments" ADD CONSTRAINT "campaign_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."campaign_enrollments" ADD CONSTRAINT "campaign_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."home_cares" ADD CONSTRAINT "home_cares_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."home_cares" ADD CONSTRAINT "home_cares_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_dispensing" ADD CONSTRAINT "medication_dispensing_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_dispenses" ADD CONSTRAINT "medication_dispenses_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medication_dispenses" ADD CONSTRAINT "medication_dispenses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vaccinations" ADD CONSTRAINT "vaccinations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vaccinations" ADD CONSTRAINT "vaccinations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vaccinations" ADD CONSTRAINT "vaccinations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "public"."vaccination_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vaccination_records" ADD CONSTRAINT "vaccination_records_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vaccination_records" ADD CONSTRAINT "vaccination_records_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cultural_space_reservations" ADD CONSTRAINT "cultural_space_reservations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cultural_events" ADD CONSTRAINT "cultural_events_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cultural_events" ADD CONSTRAINT "cultural_events_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."cultural_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cultural_events" ADD CONSTRAINT "cultural_events_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "public"."cultural_spaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."housing_attendances" ADD CONSTRAINT "housing_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."housing_attendances" ADD CONSTRAINT "housing_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."housing_registrations" ADD CONSTRAINT "housing_registrations_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."housing_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."housing_registrations" ADD CONSTRAINT "housing_registrations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_appointments" ADD CONSTRAINT "health_appointments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_appointments" ADD CONSTRAINT "health_appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."health_doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_appointments" ADD CONSTRAINT "health_appointments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_professionals" ADD CONSTRAINT "health_professionals_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."medical_specialties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vulnerable_families" ADD CONSTRAINT "vulnerable_families_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vulnerable_families" ADD CONSTRAINT "vulnerable_families_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."benefit_requests" ADD CONSTRAINT "benefit_requests_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."vulnerable_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."benefit_requests" ADD CONSTRAINT "benefit_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergency_deliveries" ADD CONSTRAINT "emergency_deliveries_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergency_deliveries" ADD CONSTRAINT "emergency_deliveries_benefitRequestId_fkey" FOREIGN KEY ("benefitRequestId") REFERENCES "public"."benefit_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergency_deliveries" ADD CONSTRAINT "emergency_deliveries_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."home_visits" ADD CONSTRAINT "home_visits_socialWorkerId_fkey" FOREIGN KEY ("socialWorkerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."home_visits" ADD CONSTRAINT "home_visits_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "public"."vulnerable_families"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."home_visits" ADD CONSTRAINT "home_visits_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."public_works" ADD CONSTRAINT "public_works_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."students" ADD CONSTRAINT "students_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_classes" ADD CONSTRAINT "school_classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_enrollments" ADD CONSTRAINT "student_enrollments_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."school_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_enrollments" ADD CONSTRAINT "student_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_enrollment_requests" ADD CONSTRAINT "student_enrollment_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_enrollment_requests" ADD CONSTRAINT "student_enrollment_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_transport_requests" ADD CONSTRAINT "school_transport_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_transport_requests" ADD CONSTRAINT "school_transport_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_meal_requests" ADD CONSTRAINT "school_meal_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_meal_requests" ADD CONSTRAINT "school_meal_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_transfer_requests" ADD CONSTRAINT "school_transfer_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_transfer_requests" ADD CONSTRAINT "school_transfer_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_material_requests" ADD CONSTRAINT "school_material_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_material_requests" ADD CONSTRAINT "school_material_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_attendances" ADD CONSTRAINT "student_attendances_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."school_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_attendances" ADD CONSTRAINT "student_attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_transports" ADD CONSTRAINT "school_transports_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_meals" ADD CONSTRAINT "school_meals_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_meals" ADD CONSTRAINT "school_meals_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_incidents" ADD CONSTRAINT "school_incidents_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."school_classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_incidents" ADD CONSTRAINT "school_incidents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_events" ADD CONSTRAINT "school_events_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."education_attendances" ADD CONSTRAINT "education_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."education_attendances" ADD CONSTRAINT "education_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_documents" ADD CONSTRAINT "school_documents_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_documents" ADD CONSTRAINT "school_documents_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."student_transfers" ADD CONSTRAINT "student_transfers_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."attendance_records" ADD CONSTRAINT "attendance_records_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grade_records" ADD CONSTRAINT "grade_records_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."grade_records" ADD CONSTRAINT "grade_records_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_management" ADD CONSTRAINT "school_management_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."school_management" ADD CONSTRAINT "school_management_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."athletes" ADD CONSTRAINT "athletes_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "public"."sports_modalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."athletes" ADD CONSTRAINT "athletes_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tourist_attractions" ADD CONSTRAINT "tourist_attractions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_transports" ADD CONSTRAINT "health_transports_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_transports" ADD CONSTRAINT "health_transports_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_campaigns" ADD CONSTRAINT "health_campaigns_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_programs" ADD CONSTRAINT "health_programs_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_exams" ADD CONSTRAINT "health_exams_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_exams" ADD CONSTRAINT "health_exams_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_exams" ADD CONSTRAINT "medical_exams_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."medical_exams" ADD CONSTRAINT "medical_exams_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_transport_requests" ADD CONSTRAINT "health_transport_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_transport_requests" ADD CONSTRAINT "health_transport_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patients" ADD CONSTRAINT "patients_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."community_health_agents" ADD CONSTRAINT "community_health_agents_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."community_health_agents" ADD CONSTRAINT "community_health_agents_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."disciplinary_records" ADD CONSTRAINT "disciplinary_records_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."disciplinary_records" ADD CONSTRAINT "disciplinary_records_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sports_teams" ADD CONSTRAINT "sports_teams_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "public"."sports_modalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sports_teams" ADD CONSTRAINT "sports_teams_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."competitions" ADD CONSTRAINT "competitions_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "public"."sports_modalities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."competitions" ADD CONSTRAINT "competitions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sports_infrastructures" ADD CONSTRAINT "sports_infrastructures_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sports_schools" ADD CONSTRAINT "sports_schools_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sports_school_enrollments" ADD CONSTRAINT "sports_school_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sports_infrastructure_reservations" ADD CONSTRAINT "sports_infrastructure_reservations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."competition_enrollments" ADD CONSTRAINT "competition_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tournament_enrollments" ADD CONSTRAINT "tournament_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."security_occurrences" ADD CONSTRAINT "security_occurrences_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."security_alerts" ADD CONSTRAINT "security_alerts_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."security_patrols" ADD CONSTRAINT "security_patrols_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."critical_points" ADD CONSTRAINT "critical_points_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."security_attendances" ADD CONSTRAINT "security_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."local_businesses" ADD CONSTRAINT "local_businesses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tourism_programs" ADD CONSTRAINT "tourism_programs_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tourism_attendances" ADD CONSTRAINT "tourism_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tourism_attendances" ADD CONSTRAINT "tourism_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tourism_guides" ADD CONSTRAINT "tourism_guides_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tourism_routes" ADD CONSTRAINT "tourism_routes_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tourism_events" ADD CONSTRAINT "tourism_events_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."environmental_licenses" ADD CONSTRAINT "environmental_licenses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."environmental_complaints" ADD CONSTRAINT "environmental_complaints_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."protected_areas" ADD CONSTRAINT "protected_areas_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."environmental_programs" ADD CONSTRAINT "environmental_programs_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."environmental_attendances" ADD CONSTRAINT "environmental_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."environmental_attendances" ADD CONSTRAINT "environmental_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tree_cutting_authorizations" ADD CONSTRAINT "tree_cutting_authorizations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."environmental_inspections" ADD CONSTRAINT "environmental_inspections_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."technical_assistances" ADD CONSTRAINT "technical_assistances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."technical_assistances" ADD CONSTRAINT "technical_assistances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_programs" ADD CONSTRAINT "rural_programs_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_program_enrollments" ADD CONSTRAINT "rural_program_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_program_enrollments" ADD CONSTRAINT "rural_program_enrollments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."rural_programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_program_enrollments" ADD CONSTRAINT "rural_program_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_program_enrollments" ADD CONSTRAINT "rural_program_enrollments_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "public"."rural_producers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_trainings" ADD CONSTRAINT "rural_trainings_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_training_enrollments" ADD CONSTRAINT "rural_training_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_training_enrollments" ADD CONSTRAINT "rural_training_enrollments_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "public"."rural_trainings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_training_enrollments" ADD CONSTRAINT "rural_training_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rural_training_enrollments" ADD CONSTRAINT "rural_training_enrollments_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "public"."rural_producers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agriculture_attendances" ADD CONSTRAINT "agriculture_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agriculture_attendances" ADD CONSTRAINT "agriculture_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."housing_applications" ADD CONSTRAINT "housing_applications_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."housing_units" ADD CONSTRAINT "housing_units_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."land_regularizations" ADD CONSTRAINT "land_regularizations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."rent_assistances" ADD CONSTRAINT "rent_assistances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_assistance_attendances" ADD CONSTRAINT "social_assistance_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_assistance_attendances" ADD CONSTRAINT "social_assistance_attendances_socialWorkerId_fkey" FOREIGN KEY ("socialWorkerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_assistance_attendances" ADD CONSTRAINT "social_assistance_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_group_enrollments" ADD CONSTRAINT "social_group_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_group_enrollments" ADD CONSTRAINT "social_group_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_program_enrollments" ADD CONSTRAINT "social_program_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_program_enrollments" ADD CONSTRAINT "social_program_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_benefit_requests" ADD CONSTRAINT "social_benefit_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_benefit_requests" ADD CONSTRAINT "social_benefit_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_requests" ADD CONSTRAINT "document_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."document_requests" ADD CONSTRAINT "document_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_registrations" ADD CONSTRAINT "family_registrations_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."family_registrations" ADD CONSTRAINT "family_registrations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_home_visits" ADD CONSTRAINT "social_home_visits_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_home_visits" ADD CONSTRAINT "social_home_visits_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_appointments" ADD CONSTRAINT "social_appointments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_appointments" ADD CONSTRAINT "social_appointments_socialWorkerId_fkey" FOREIGN KEY ("socialWorkerId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_appointments" ADD CONSTRAINT "social_appointments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_equipments" ADD CONSTRAINT "social_equipments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_equipments" ADD CONSTRAINT "social_equipments_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."social_equipments" ADD CONSTRAINT "social_equipments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_inspections" ADD CONSTRAINT "work_inspections_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."public_works_attendances" ADD CONSTRAINT "public_works_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."road_repair_requests" ADD CONSTRAINT "road_repair_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."technical_inspections" ADD CONSTRAINT "technical_inspections_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."public_service_requests" ADD CONSTRAINT "public_service_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cleaning_schedules" ADD CONSTRAINT "cleaning_schedules_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."street_lightings" ADD CONSTRAINT "street_lightings_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."special_collections" ADD CONSTRAINT "special_collections_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."special_collections" ADD CONSTRAINT "special_collections_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."public_problem_reports" ADD CONSTRAINT "public_problem_reports_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."public_problem_reports" ADD CONSTRAINT "public_problem_reports_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."team_schedules" ADD CONSTRAINT "team_schedules_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."weeding_requests" ADD CONSTRAINT "weeding_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."weeding_requests" ADD CONSTRAINT "weeding_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."drainage_requests" ADD CONSTRAINT "drainage_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."drainage_requests" ADD CONSTRAINT "drainage_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tree_pruning_requests" ADD CONSTRAINT "tree_pruning_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tree_pruning_requests" ADD CONSTRAINT "tree_pruning_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."urban_cleanings" ADD CONSTRAINT "urban_cleanings_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_teams" ADD CONSTRAINT "service_teams_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."public_service_attendances" ADD CONSTRAINT "public_service_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."public_service_attendances" ADD CONSTRAINT "public_service_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "public"."citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."page_metrics" ADD CONSTRAINT "page_metrics_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."specialized_pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."page_configurations" ADD CONSTRAINT "page_configurations_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "public"."specialized_pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."agenda_events" ADD CONSTRAINT "agenda_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sports_modalities" ADD CONSTRAINT "sports_modalities_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patrol_requests" ADD CONSTRAINT "patrol_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."camera_requests" ADD CONSTRAINT "camera_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."anonymous_tips" ADD CONSTRAINT "anonymous_tips_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."municipal_guards" ADD CONSTRAINT "municipal_guards_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."surveillance_systems" ADD CONSTRAINT "surveillance_systems_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custom_data_records" ADD CONSTRAINT "custom_data_records_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "public"."custom_data_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."urban_planning_attendance" ADD CONSTRAINT "urban_planning_attendance_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_approvals" ADD CONSTRAINT "project_approvals_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."building_permits" ADD CONSTRAINT "building_permits_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."building_permits" ADD CONSTRAINT "building_permits_projectApprovalId_fkey" FOREIGN KEY ("projectApprovalId") REFERENCES "public"."project_approvals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."operating_licenses" ADD CONSTRAINT "operating_licenses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."certificate_requests" ADD CONSTRAINT "certificate_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."illegal_construction_reports" ADD CONSTRAINT "illegal_construction_reports_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subdivision_registrations" ADD CONSTRAINT "subdivision_registrations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."public_works_attendance_phase3" ADD CONSTRAINT "public_works_attendance_phase3_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."road_repair_requests_phase3" ADD CONSTRAINT "road_repair_requests_phase3_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."technical_inspections_phase3" ADD CONSTRAINT "technical_inspections_phase3_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."public_work_registrations" ADD CONSTRAINT "public_work_registrations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_inspections_phase3" ADD CONSTRAINT "work_inspections_phase3_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."public_service_attendance_phase3" ADD CONSTRAINT "public_service_attendance_phase3_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."public_lighting_requests" ADD CONSTRAINT "public_lighting_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."urban_cleaning_requests" ADD CONSTRAINT "urban_cleaning_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."special_collection_requests" ADD CONSTRAINT "special_collection_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."weeding_requests_phase3" ADD CONSTRAINT "weeding_requests_phase3_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."drainage_unblock_requests" ADD CONSTRAINT "drainage_unblock_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tree_pruning_requests_phase3" ADD CONSTRAINT "tree_pruning_requests_phase3_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "public"."protocols_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
