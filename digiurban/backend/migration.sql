-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('MESSAGE', 'DOCUMENT_REQUEST', 'DOCUMENT_UPLOAD', 'PENDING_CREATED', 'PENDING_RESOLVED', 'STATUS_CHANGED', 'ASSIGNED', 'INSPECTION_SCHEDULED', 'INSPECTION_COMPLETED', 'APPROVAL', 'REJECTION', 'CANCELLATION', 'NOTE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'UPLOADED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PendingType" AS ENUM ('DOCUMENT', 'INFORMATION', 'CORRECTION', 'VALIDATION', 'PAYMENT', 'INSPECTION', 'APPROVAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PendingStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StageStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'FAILED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('GUEST', 'USER', 'COORDINATOR', 'MANAGER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "ProtocolStatus" AS ENUM ('VINCULADO', 'PROGRESSO', 'ATUALIZACAO', 'CONCLUIDO', 'PENDENCIA', 'CANCELADO');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('COM_DADOS', 'SEM_DADOS');

-- CreateEnum
CREATE TYPE "CitizenLinkType" AS ENUM ('STUDENT', 'GUARDIAN', 'PATIENT', 'COMPANION', 'DEPENDENT', 'FAMILY_MEMBER', 'AUTHORIZED_PERSON', 'BENEFICIARY', 'WITNESS', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceRole" AS ENUM ('BENEFICIARY', 'RESPONSIBLE', 'AUTHORIZED', 'COMPANION', 'WITNESS', 'OTHER');

-- CreateEnum
CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('DEMO_REQUEST', 'TRIAL_SIGNUP', 'NEWSLETTER', 'CONTACT_FORM');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('OPERATIONAL', 'MANAGERIAL', 'EXECUTIVE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportExecutionStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'EXCEL', 'CSV', 'JSON');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('DEADLINE_OVERDUE', 'LOW_PERFORMANCE', 'HIGH_DEMAND', 'LOW_SATISFACTION', 'SYSTEM_OVERLOAD', 'BUDGET_ALERT');

-- CreateEnum
CREATE TYPE "AlertFrequency" AS ENUM ('REALTIME', 'DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED', 'COMPLAINED', 'UNSUBSCRIBED');

-- CreateEnum
CREATE TYPE "EmailEventType" AS ENUM ('SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'COMPLAINED', 'UNSUBSCRIBED', 'FAILED');

-- CreateEnum
CREATE TYPE "LogLevel" AS ENUM ('DEBUG', 'INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "EmailPlan" AS ENUM ('NONE', 'BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'GOLD', 'REJECTED');

-- CreateEnum
CREATE TYPE "FamilyRelationship" AS ENUM ('SPOUSE', 'SON', 'DAUGHTER', 'FATHER', 'MOTHER', 'BROTHER', 'SISTER', 'GRANDFATHER', 'GRANDMOTHER', 'GRANDSON', 'GRANDDAUGHTER', 'OTHER');

-- CreateEnum
CREATE TYPE "CulturalAttendanceType" AS ENUM ('AUTHORIZATION_EVENT', 'ARTIST_REGISTRATION', 'PUBLIC_NOTICE_REGISTRATION', 'CULTURAL_SPACE_USE', 'PROJECT_SUPPORT', 'ARTISTIC_SUPPORT', 'INFORMATION', 'GENERAL_INFORMATION', 'OTHERS', 'inscricao_projeto', 'reserva_espaco', 'informacoes', 'cadastro_grupo', 'apoio_cultural', 'denuncia', 'inscricao_oficina');

-- CreateEnum
CREATE TYPE "CulturalAttendanceStatus" AS ENUM ('PENDING', 'UNDER_ANALYSIS', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED', 'OPEN');

-- CreateEnum
CREATE TYPE "SportsAttendanceType" AS ENUM ('EVENT_AUTHORIZATION', 'CLUB_REGISTRATION', 'ATHLETE_REGISTRATION', 'FACILITY_USE', 'PROJECT_SUPPORT', 'EQUIPMENT_REQUEST', 'TOURNAMENT_REQUEST', 'GENERAL_INFORMATION', 'OTHERS');

-- CreateEnum
CREATE TYPE "SportsAttendanceStatus" AS ENUM ('PENDING', 'UNDER_ANALYSIS', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HealthAttendanceType" AS ENUM ('APPOINTMENT_REQUEST', 'EXAM_REQUEST', 'MEDICATION_REQUEST', 'HOME_VISIT', 'VACCINATION', 'HEALTH_CERTIFICATE', 'COMPLAINT', 'GENERAL_INFORMATION', 'OTHERS');

-- CreateEnum
CREATE TYPE "HealthAttendanceStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFERRED');

-- CreateEnum
CREATE TYPE "HousingAttendanceType" AS ENUM ('PROGRAM_REGISTRATION', 'LOT_REQUEST', 'HOUSING_REFORM', 'DOCUMENTATION', 'COMPLAINT', 'CONSULTATION', 'GENERAL_INFORMATION', 'OTHERS');

-- CreateEnum
CREATE TYPE "HousingAttendanceStatus" AS ENUM ('PENDING', 'UNDER_ANALYSIS', 'APPROVED', 'REJECTED', 'COMPLETED', 'WAITING_DOCUMENTATION');

-- CreateEnum
CREATE TYPE "WorkflowStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'ERROR');

-- CreateEnum
CREATE TYPE "ConsultaStatus" AS ENUM ('AGENDADA', 'CONFIRMADA', 'REALIZADA', 'FALTOU', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoAtendimento" AS ENUM ('AGENDADO', 'DEMANDA_ESPONTANEA', 'URGENCIA', 'RETORNO');

-- CreateEnum
CREATE TYPE "AtendimentoStatus" AS ENUM ('AGUARDANDO_CHECKIN', 'CHECKIN_REALIZADO', 'AGUARDANDO_TRIAGEM', 'EM_TRIAGEM', 'TRIAGEM_CONCLUIDA', 'AGUARDANDO_MEDICO', 'EM_CONSULTA', 'CONSULTA_CONCLUIDA', 'AGUARDANDO_FARMACIA', 'EM_FARMACIA', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "ClassificacaoRisco" AS ENUM ('EMERGENCIA', 'MUITO_URGENTE', 'URGENTE', 'POUCO_URGENTE', 'NAO_URGENTE');

-- CreateEnum
CREATE TYPE "PrioridadeExame" AS ENUM ('ROTINA', 'URGENTE', 'EMERGENCIA');

-- CreateEnum
CREATE TYPE "StatusExame" AS ENUM ('SOLICITADO', 'AGENDADO', 'COLETADO', 'PROCESSANDO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoAtestado" AS ENUM ('MEDICO', 'COMPARECIMENTO', 'ACOMPANHANTE');

-- CreateEnum
CREATE TYPE "PrioridadeEncaminhamento" AS ENUM ('ROTINA', 'PRIORIDADE', 'URGENCIA');

-- CreateEnum
CREATE TYPE "StatusEncaminhamento" AS ENUM ('PENDENTE', 'AGENDADO', 'REALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "PrioridadeTFD" AS ENUM ('EMERGENCIA', 'ALTA', 'MEDIA', 'ROTINA');

-- CreateEnum
CREATE TYPE "TFDStatus" AS ENUM ('AGUARDANDO_ANALISE_DOCUMENTAL', 'DOCUMENTACAO_PENDENTE', 'AGUARDANDO_REGULACAO_MEDICA', 'AGUARDANDO_COMPLEMENTACAO', 'INDEFERIDO', 'APROVADO_REGULACAO', 'AGUARDANDO_APROVACAO_GESTAO', 'SUSPENSO', 'APROVADO_PARA_AGENDAMENTO', 'AGENDANDO', 'AGENDADO', 'AGUARDANDO_VIAGEM', 'EM_VIAGEM', 'REALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoViagemTFD" AS ENUM ('IDA', 'RETORNO', 'IDA_E_VOLTA');

-- CreateEnum
CREATE TYPE "StatusViagemTFD" AS ENUM ('PLANEJADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusVeiculoTFD" AS ENUM ('DISPONIVEL', 'EM_VIAGEM', 'MANUTENCAO', 'INATIVO');

-- CreateEnum
CREATE TYPE "StatusMotoristaTFD" AS ENUM ('DISPONIVEL', 'EM_VIAGEM', 'FOLGA', 'INATIVO');

-- CreateEnum
CREATE TYPE "TurnoPreferencia" AS ENUM ('MATUTINO', 'VESPERTINO', 'INTEGRAL', 'INDIFERENTE');

-- CreateEnum
CREATE TYPE "MatriculaStatus" AS ENUM ('INSCRITO_AGUARDANDO_VALIDACAO', 'DOCUMENTACAO_PENDENTE', 'DOCUMENTOS_VALIDADOS', 'AGUARDANDO_DISTRIBUICAO', 'VAGA_ATRIBUIDA', 'LISTA_ESPERA', 'CONFIRMADA', 'RECUSADA', 'EXPIRADA', 'MATRICULADO', 'INDEFERIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "SituacaoMatricula" AS ENUM ('ATIVA', 'TRANSFERIDA', 'CANCELADA', 'CONCLUIDA');

-- CreateEnum
CREATE TYPE "Turno" AS ENUM ('MATUTINO', 'VESPERTINO', 'INTEGRAL', 'NOTURNO');

-- CreateEnum
CREATE TYPE "VeiculoStatus" AS ENUM ('DISPONIVEL', 'EM_USO', 'MANUTENCAO', 'INATIVO');

-- CreateEnum
CREATE TYPE "TipoMoradia" AS ENUM ('CASA', 'APARTAMENTO', 'COMODO', 'BARRACO', 'OUTRO');

-- CreateEnum
CREATE TYPE "SituacaoMoradia" AS ENUM ('PROPRIA_QUITADA', 'PROPRIA_FINANCIADA', 'ALUGADA', 'CEDIDA', 'OCUPACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "CadUnicoStatus" AS ENUM ('AGENDADO', 'AGUARDANDO_ENTREVISTA', 'EM_ENTREVISTA', 'ENTREVISTA_CONCLUIDA', 'DOCUMENTACAO_PENDENTE', 'DOCUMENTOS_VALIDADOS', 'AGUARDANDO_ANALISE', 'AGUARDANDO_COMPLEMENTACAO', 'APROVADO', 'INDEFERIDO', 'CADASTRADO', 'ATIVO', 'DESATUALIZADO', 'SUSPENSO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "Parentesco" AS ENUM ('RESPONSAVEL_FAMILIAR', 'CONJUGE_COMPANHEIRO', 'FILHO_ENTEADO', 'PAI_MAE', 'SOGRO_SOGRA', 'NETO_BISNETO', 'IRMAO_IRMA', 'GENRO_NORA', 'OUTRO');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO');

-- CreateEnum
CREATE TYPE "Raca" AS ENUM ('BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDIGENA');

-- CreateEnum
CREATE TYPE "Escolaridade" AS ENUM ('SEM_INSTRUCAO', 'FUNDAMENTAL_INCOMPLETO', 'FUNDAMENTAL_COMPLETO', 'MEDIO_INCOMPLETO', 'MEDIO_COMPLETO', 'SUPERIOR_INCOMPLETO', 'SUPERIOR_COMPLETO');

-- CreateEnum
CREATE TYPE "ProgramaSocialStatus" AS ENUM ('INSCRITO', 'VERIFICACAO_CADUNICO', 'NAO_ELEGIVEL', 'VERIFICACAO_APROVADA', 'AGUARDANDO_ANALISE', 'AGUARDANDO_VISITA', 'PARECER_FAVORAVEL', 'PARECER_DESFAVORAVEL', 'AGUARDANDO_PARECER_PSICOLOGICO', 'PARECER_PSICOLOGICO_CONCLUIDO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'INDEFERIDO', 'CONCEDIDO', 'ATIVO', 'SUSPENSO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoAcompanhamento" AS ENUM ('VISITA_DOMICILIAR', 'ATENDIMENTO_PSICOSSOCIAL', 'VERIFICACAO_CONDICIONALIDADES', 'RENOVACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PROCESSANDO', 'PAGO', 'FALHA', 'ESTORNADO');

-- CreateEnum
CREATE TYPE "FinalidadeUsoMaquina" AS ENUM ('PREPARO_SOLO', 'PLANTIO', 'PULVERIZACAO', 'COLHEITA', 'TRANSPORTE', 'OUTRO');

-- CreateEnum
CREATE TYPE "EmprestimoMaquinaStatus" AS ENUM ('SOLICITADO', 'CADASTRO_PENDENTE', 'CADASTRO_VALIDADO', 'AGUARDANDO_APROVACAO', 'INDEFERIDO', 'APROVADO', 'AGENDADO', 'AGUARDANDO_RETIRADA', 'EMPRESTIMO_ATIVO', 'ATRASADO', 'AGUARDANDO_DEVOLUCAO', 'DEVOLVIDO', 'DEVOLVIDO_COM_PENDENCIA', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusPagamentoMaquina" AS ENUM ('NAO_APLICAVEL', 'PENDENTE', 'PAGO', 'ISENTO');

-- CreateEnum
CREATE TYPE "TipoMaquinaAgricola" AS ENUM ('TRATOR', 'GRADE_ARADORA', 'PLANTADEIRA', 'PULVERIZADOR', 'COLHEITADEIRA', 'CARRETA', 'ROCADEIRA', 'DISTRIBUIDOR_CALCARIO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusMaquina" AS ENUM ('DISPONIVEL', 'EMPRESTADA', 'MANUTENCAO', 'QUEBRADA', 'INATIVA');

-- CreateEnum
CREATE TYPE "TipoExameSolicitacao" AS ENUM ('LABORATORIAL', 'IMAGEM', 'CARDIOLOGICO', 'ULTRASSOM', 'ENDOSCOPIA', 'OUTROS');

-- CreateEnum
CREATE TYPE "StatusSolicitacaoExame" AS ENUM ('AGUARDANDO_AGENDAMENTO', 'AGENDADO', 'CONFIRMADO', 'EM_REALIZACAO', 'REALIZADO', 'LAUDADO', 'RESULTADO_ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusAgendamentoExame" AS ENUM ('AGENDADO', 'CONFIRMADO', 'REMARCADO', 'REALIZADO', 'FALTOU', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusBeneficio" AS ENUM ('AGUARDANDO_ANALISE', 'EM_ANALISE', 'DOCUMENTACAO_PENDENTE', 'DEFERIDO', 'INDEFERIDO', 'ENTREGUE', 'CANCELADO');

-- CreateTable
CREATE TABLE "municipio_config" (
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
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
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
CREATE TABLE "user_departments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
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
CREATE TABLE "citizens" (
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
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE TABLE "citizen_documents" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "plan" "Plan" NOT NULL,
    "period" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "position" TEXT,
    "source" "LeadSource" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_compositions" (
    "id" TEXT NOT NULL,
    "headId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "relationship" "FamilyRelationship" NOT NULL,
    "isDependent" BOOLEAN NOT NULL DEFAULT false,
    "monthlyIncome" DECIMAL(65,30),
    "occupation" TEXT,
    "education" TEXT,
    "hasDisability" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_compositions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_citizen_links" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "linkedCitizenId" TEXT NOT NULL,
    "linkType" "CitizenLinkType" NOT NULL,
    "relationship" TEXT,
    "role" "ServiceRole" NOT NULL,
    "contextData" JSONB,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "protocol_citizen_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services_simplified" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "moduleType" TEXT,
    "formSchema" JSONB,
    "linkedCitizensConfig" JSONB,
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
CREATE TABLE "protocols_simplified" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProtocolStatus" NOT NULL DEFAULT 'VINCULADO',
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
CREATE TABLE "protocol_history_simplified" (
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
CREATE TABLE "protocol_evaluations_simplified" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "wouldRecommend" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_evaluations_simplified_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "protocol_interactions" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "type" "InteractionType" NOT NULL,
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
CREATE TABLE "protocol_documents" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE TABLE "protocol_pendings" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "type" "PendingType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "PendingStatus" NOT NULL DEFAULT 'OPEN',
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
CREATE TABLE "module_workflows" (
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
CREATE TABLE "protocol_stages" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "stageName" TEXT NOT NULL,
    "stageOrder" INTEGER NOT NULL,
    "status" "StageStatus" NOT NULL DEFAULT 'PENDING',
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
CREATE TABLE "protocol_sla" (
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
CREATE TABLE "notifications" (
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
CREATE TABLE "citizen_transfer_requests" (
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
CREATE TABLE "analytics" (
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
CREATE TABLE "protocol_metrics" (
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
CREATE TABLE "department_metrics" (
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
CREATE TABLE "service_metrics" (
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
CREATE TABLE "server_performance" (
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
CREATE TABLE "protocol_bottlenecks" (
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
CREATE TABLE "kpis" (
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
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "ReportType" NOT NULL,
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
CREATE TABLE "report_executions" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "parameters" JSONB,
    "filters" JSONB,
    "data" JSONB,
    "format" "ReportFormat" NOT NULL,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "status" "ReportExecutionStatus" NOT NULL,
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
CREATE TABLE "dashboards" (
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
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "AlertType" NOT NULL,
    "metric" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "threshold2" DOUBLE PRECISION,
    "frequency" "AlertFrequency" NOT NULL,
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
CREATE TABLE "alert_triggers" (
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
CREATE TABLE "metric_cache" (
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
CREATE TABLE "benchmarks" (
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
CREATE TABLE "predictions" (
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
CREATE TABLE "email_servers" (
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
CREATE TABLE "email_domains" (
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
CREATE TABLE "email_users" (
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
CREATE TABLE "emails" (
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
    "status" "EmailStatus" NOT NULL DEFAULT 'QUEUED',
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
CREATE TABLE "email_events" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "type" "EmailEventType" NOT NULL,
    "data" JSONB,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "emailServerId" TEXT,
    "from" TEXT,
    "to" TEXT,
    "subject" TEXT,
    "status" TEXT,
    "type" TEXT,
    "level" "LogLevel" NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "data" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_stats" (
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
CREATE TABLE "email_auth_attempts" (
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
CREATE TABLE "email_templates" (
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
CREATE TABLE "integrations" (
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
CREATE TABLE "integration_logs" (
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
CREATE TABLE "cache_entries" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cache_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
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
CREATE TABLE "specialized_pages" (
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
CREATE TABLE "page_metrics" (
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
CREATE TABLE "page_configurations" (
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
CREATE TABLE "agenda_events" (
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
CREATE TABLE "custom_data_tables" (
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
CREATE TABLE "custom_data_records" (
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
CREATE TABLE "unidades_saude" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "endereco" TEXT,
    "bairro" TEXT,
    "telefone" TEXT,
    "horario" TEXT,
    "especialidades" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_saude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_educacao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "endereco" TEXT,
    "bairro" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "niveisEnsino" JSONB,
    "turnos" JSONB,
    "vagas" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_educacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_cras" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "endereco" TEXT,
    "bairro" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "horario" TEXT,
    "programas" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_cras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espacos_publicos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT,
    "endereco" TEXT,
    "bairro" TEXT,
    "telefone" TEXT,
    "capacidade" INTEGER,
    "comodidades" JSONB,
    "horario" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "espacos_publicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conjuntos_habitacionais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "bairro" TEXT,
    "totalUnidades" INTEGER,
    "unidadesOcupadas" INTEGER NOT NULL DEFAULT 0,
    "unidadesDisponiveis" INTEGER NOT NULL DEFAULT 0,
    "tipologias" JSONB,
    "programaOrigem" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "infraestrutura" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conjuntos_habitacionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viaturas_seguranca" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "placa" TEXT,
    "modelo" TEXT,
    "ano" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'Ativa',
    "equipamentos" JSONB,
    "baseOperacional" TEXT,
    "horasUso" INTEGER NOT NULL DEFAULT 0,
    "kmRodados" INTEGER NOT NULL DEFAULT 0,
    "proximaManutencao" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viaturas_seguranca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parques_pracas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "endereco" TEXT,
    "bairro" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "area" DOUBLE PRECISION,
    "equipamentos" JSONB,
    "horarioFuncionamento" TEXT,
    "permiteEventos" BOOLEAN NOT NULL DEFAULT true,
    "capacidadeEventos" INTEGER,
    "ultimaManutencao" TIMESTAMP(3),
    "proximaManutencao" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parques_pracas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estabelecimentos_turisticos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "endereco" TEXT,
    "bairro" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "site" TEXT,
    "categoria" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "capacidade" INTEGER,
    "servicos" JSONB,
    "horario" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estabelecimentos_turisticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programas_sociais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT,
    "criteriosElegibilidade" JSONB,
    "valorBeneficio" DOUBLE PRECISION,
    "periodicidade" TEXT,
    "documentosNecessarios" JSONB,
    "orgaoResponsavel" TEXT,
    "legislacao" TEXT,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programas_sociais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_obra_servico" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT,
    "tempoMedioExecucao" INTEGER,
    "requisitosPrevios" JSONB,
    "equipamentosNecessarios" JSONB,
    "materiaisComuns" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_obra_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "especialidades_medicas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "area" TEXT,
    "tempoMedioConsulta" INTEGER,
    "requisitosPaciente" TEXT,
    "examesComuns" JSONB,
    "unidadesQueOferecem" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "especialidades_medicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_producao_agricola" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "sazonalidade" JSONB,
    "assistenciaTecnicaDisponivel" BOOLEAN NOT NULL DEFAULT false,
    "programasApoio" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_producao_agricola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maquinas_agricolas" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "modelo" TEXT,
    "identificacao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Disponível',
    "capacidade" TEXT,
    "potencia" TEXT,
    "horasUso" INTEGER NOT NULL DEFAULT 0,
    "ultimaManutencao" TIMESTAMP(3),
    "proximaManutencao" TIMESTAMP(3),
    "valorHoraUso" DOUBLE PRECISION,
    "documentosNecessarios" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maquinas_agricolas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "especies_arvore" (
    "id" TEXT NOT NULL,
    "nomeComum" TEXT NOT NULL,
    "nomeCientifico" TEXT,
    "familia" TEXT,
    "origem" TEXT,
    "porte" TEXT,
    "tipoRaiz" TEXT,
    "crescimento" TEXT,
    "adequadaCalcada" BOOLEAN NOT NULL DEFAULT false,
    "adequadaParque" BOOLEAN NOT NULL DEFAULT true,
    "flores" TEXT,
    "frutificacao" TEXT,
    "cuidadosEspeciais" TEXT,
    "disponibilidadeMudas" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "especies_arvore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_estabelecimento_turistico" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "requisitosLegais" JSONB,
    "documentosNecessarios" JSONB,
    "classificacao" TEXT,
    "inspectionRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_estabelecimento_turistico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modalidades_esportivas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "tipo" TEXT,
    "faixasEtarias" JSONB,
    "equipamentosNecessarios" JSONB,
    "profissionaisNecessarios" JSONB,
    "espacosDisponiveis" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "modalidades_esportivas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_atividade_cultural" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "materialNecessario" JSONB,
    "faixasEtarias" JSONB,
    "duracaoMedia" INTEGER,
    "espacosAdequados" JSONB,
    "profissionaisNecessarios" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_atividade_cultural_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_ocorrencia" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "gravidade" INTEGER NOT NULL DEFAULT 3,
    "requererBoletimOcorrencia" BOOLEAN NOT NULL DEFAULT false,
    "tempoRespostaPadrao" INTEGER,
    "equipesCompetentes" JSONB,
    "procedimentosPadrao" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_ocorrencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos_profissionalizantes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "area" TEXT,
    "cargaHoraria" INTEGER,
    "duracao" INTEGER,
    "requisitos" TEXT,
    "certificacao" TEXT,
    "conteudoProgramatico" JSONB,
    "vagas" INTEGER NOT NULL DEFAULT 0,
    "vagasOcupadas" INTEGER NOT NULL DEFAULT 0,
    "instrutorId" TEXT,
    "localCurso" TEXT,
    "horario" TEXT,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cursos_profissionalizantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programas_habitacionais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT NOT NULL,
    "criteriosElegibilidade" JSONB,
    "rendaMaxima" DOUBLE PRECISION,
    "rendaMinima" DOUBLE PRECISION,
    "documentosNecessarios" JSONB,
    "beneficiosOferecidos" TEXT,
    "prazoAtendimento" INTEGER,
    "orgaoGestor" TEXT,
    "legislacao" TEXT,
    "dataInicioInscricoes" TIMESTAMP(3),
    "dataFimInscricoes" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programas_habitacionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programas_ambientais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT,
    "objetivos" TEXT,
    "metasAnuais" JSONB,
    "publicoAlvo" TEXT,
    "parcerias" JSONB,
    "recursosNecessarios" TEXT,
    "indicadoresMonitoramento" JSONB,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programas_ambientais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profissionais_saude" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "registroProfissional" TEXT NOT NULL,
    "especialidade" TEXT,
    "categoria" TEXT NOT NULL,
    "unidadesAtendimento" JSONB,
    "horarioAtendimento" JSONB,
    "diasSemana" JSONB,
    "tempoMedioConsulta" INTEGER,
    "aceitaAgendamento" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profissionais_saude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "formacao" TEXT,
    "especializacoes" JSONB,
    "areasAtuacao" JSONB,
    "vinculo" TEXT,
    "cargaHoraria" INTEGER,
    "disponibilidade" JSONB,
    "avaliacaoMedia" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guias_turisticos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cadastur" TEXT,
    "idiomas" JSONB,
    "especialidades" JSONB,
    "certificacoes" JSONB,
    "disponibilidade" JSONB,
    "valorDiaria" DOUBLE PRECISION,
    "avaliacaoMedia" DOUBLE PRECISION,
    "totalTours" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guias_turisticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_documento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "formatosAceitos" JSONB,
    "tamanhoMaximo" INTEGER,
    "requisitosPadrao" TEXT,
    "validadeDocumento" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_documento_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "agendas_medicas" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "tempoPorConsulta" INTEGER NOT NULL,
    "vagasDisponiveis" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendas_medicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas_agendadas" (
    "id" TEXT NOT NULL,
    "agendaId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "status" "ConsultaStatus" NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultas_agendadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimentos_medicos" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "protocolId" TEXT,
    "consultaAgendadaId" TEXT,
    "citizenId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "dataAtendimento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoAtendimento" NOT NULL,
    "status" "AtendimentoStatus" NOT NULL,
    "prioridade" INTEGER NOT NULL DEFAULT 0,
    "recepcaoId" TEXT,
    "horarioCheckin" TIMESTAMP(3),
    "triagemId" TEXT,
    "horarioTriagem" TIMESTAMP(3),
    "consultaId" TEXT,
    "profissionalId" TEXT,
    "horarioConsulta" TIMESTAMP(3),
    "farmaciaId" TEXT,
    "horarioFarmacia" TIMESTAMP(3),
    "tempoTotalMinutos" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atendimentos_medicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triagem_enfermagem" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "enfermeiroId" TEXT NOT NULL,
    "pressaoArterial" TEXT,
    "temperatura" DOUBLE PRECISION,
    "frequenciaCardiaca" INTEGER,
    "frequenciaRespiratoria" INTEGER,
    "saturacaoO2" INTEGER,
    "peso" DOUBLE PRECISION,
    "altura" DOUBLE PRECISION,
    "glicemia" DOUBLE PRECISION,
    "classificacaoRisco" "ClassificacaoRisco" NOT NULL,
    "corProtocolo" TEXT NOT NULL,
    "queixaPrincipal" TEXT NOT NULL,
    "historiaAtual" TEXT,
    "alergias" TEXT,
    "medicamentosUso" TEXT,
    "comorbidades" TEXT,
    "observacoes" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "triagem_enfermagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas_medicas" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "medicoId" TEXT NOT NULL,
    "profissionalSaudeId" TEXT,
    "queixaPrincipal" TEXT NOT NULL,
    "historiaDoenca" TEXT,
    "historicoFamiliar" TEXT,
    "antecedentesPessoais" TEXT,
    "exameFisico" TEXT,
    "hipoteseDiagnostica" TEXT,
    "diagnosticos" JSONB NOT NULL,
    "conduta" TEXT,
    "orientacoes" TEXT,
    "retornoNecessario" BOOLEAN NOT NULL DEFAULT false,
    "prazoRetornoDias" INTEGER,
    "observacoes" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consultas_medicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescricoes" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "medicamentos" JSONB NOT NULL,
    "observacoes" TEXT,
    "validade" TIMESTAMP(3) NOT NULL,
    "dispensada" BOOLEAN NOT NULL DEFAULT false,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescricoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exames_solicitados" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "tipoExame" TEXT NOT NULL,
    "justificativa" TEXT,
    "prioridade" "PrioridadeExame" NOT NULL,
    "status" "StatusExame" NOT NULL,
    "resultado" TEXT,
    "dataResultado" TIMESTAMP(3),
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exames_solicitados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atestados" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "tipo" "TipoAtestado" NOT NULL,
    "cid10" TEXT,
    "diasAfastamento" INTEGER NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atestados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encaminhamentos" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "prioridade" "PrioridadeEncaminhamento" NOT NULL,
    "status" "StatusEncaminhamento" NOT NULL,
    "dataAgendamento" TIMESTAMP(3),
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encaminhamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medicamentos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "principioAtivo" TEXT NOT NULL,
    "apresentacao" TEXT NOT NULL,
    "catmat" TEXT,
    "isRename" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque_medicamentos" (
    "id" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "lote" TEXT NOT NULL,
    "validade" TIMESTAMP(3) NOT NULL,
    "estoqueMinimo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estoque_medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispensacao_medicamentos" (
    "id" TEXT NOT NULL,
    "prescricaoId" TEXT,
    "medicamentoId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispensadoPor" TEXT NOT NULL,
    "observacoes" TEXT,

    CONSTRAINT "dispensacao_medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_tfd" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "acompanhanteId" TEXT,
    "especialidade" TEXT NOT NULL,
    "procedimento" TEXT NOT NULL,
    "cid10" TEXT,
    "justificativa" TEXT NOT NULL,
    "encaminhamentoMedicoUrl" TEXT NOT NULL,
    "examesUrls" JSONB,
    "prioridade" "PrioridadeTFD" NOT NULL,
    "classificacaoRisco" TEXT,
    "prazoMaximoDias" INTEGER,
    "cidadeDestino" TEXT NOT NULL,
    "estadoDestino" TEXT NOT NULL,
    "hospitalDestino" TEXT,
    "status" "TFDStatus" NOT NULL,
    "posicaoFila" INTEGER,
    "analisadoPor" TEXT,
    "dataAnalise" TIMESTAMP(3),
    "motivoRecusa" TEXT,
    "reguladoPor" TEXT,
    "dataRegulacao" TIMESTAMP(3),
    "parecerRegulador" TEXT,
    "aprovadoPor" TEXT,
    "dataAprovacao" TIMESTAMP(3),
    "valorEstimado" DOUBLE PRECISION,
    "agendadoPor" TEXT,
    "dataConsulta" TIMESTAMP(3),
    "horarioConsulta" TEXT,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_tfd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viagens_tfd" (
    "id" TEXT NOT NULL,
    "solicitacaoTFDId" TEXT NOT NULL,
    "tipo" "TipoViagemTFD" NOT NULL,
    "dataViagem" TIMESTAMP(3) NOT NULL,
    "horarioSaida" TEXT NOT NULL,
    "horarioChegada" TEXT,
    "veiculoId" TEXT,
    "motoristaId" TEXT,
    "passageiros" JSONB NOT NULL,
    "kmInicial" INTEGER,
    "kmFinal" INTEGER,
    "kmTotal" INTEGER,
    "combustivel" DOUBLE PRECISION,
    "pedagios" DOUBLE PRECISION,
    "hospedagem" DOUBLE PRECISION,
    "alimentacao" DOUBLE PRECISION,
    "outros" DOUBLE PRECISION,
    "totalGasto" DOUBLE PRECISION,
    "comprovantes" JSONB,
    "status" "StatusViagemTFD" NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viagens_tfd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculos_tfd" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "acessibilidade" BOOLEAN NOT NULL DEFAULT false,
    "status" "StatusVeiculoTFD" NOT NULL,
    "km" INTEGER NOT NULL DEFAULT 0,
    "ultimaRevisao" TIMESTAMP(3),
    "proximaRevisao" TIMESTAMP(3),
    "observacoes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veiculos_tfd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "motoristas_tfd" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "cnh" TEXT NOT NULL,
    "categoriaCNH" TEXT NOT NULL,
    "validadeCNH" TIMESTAMP(3) NOT NULL,
    "telefone" TEXT NOT NULL,
    "status" "StatusMotoristaTFD" NOT NULL,
    "observacoes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "motoristas_tfd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricoes_matricula" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "serie" TEXT NOT NULL,
    "turno" "TurnoPreferencia" NOT NULL,
    "endereco" JSONB NOT NULL,
    "escolaPreferencia1" TEXT,
    "escolaPreferencia2" TEXT,
    "escolaPreferencia3" TEXT,
    "documentos" JSONB NOT NULL,
    "necessidadeEspecial" BOOLEAN NOT NULL DEFAULT false,
    "descricaoNecessidade" TEXT,
    "isTransferencia" BOOLEAN NOT NULL DEFAULT false,
    "escolaOrigem" TEXT,
    "motivoTransferencia" TEXT,
    "validadoPor" TEXT,
    "dataValidacao" TIMESTAMP(3),
    "motivoRecusa" TEXT,
    "escolaAtribuida" TEXT,
    "turmaAtribuida" TEXT,
    "dataDistribuicao" TIMESTAMP(3),
    "criterioDesempate" TEXT,
    "confirmadoEm" TIMESTAMP(3),
    "recusadoEm" TIMESTAMP(3),
    "motivoRecusaResponsavel" TEXT,
    "status" "MatriculaStatus" NOT NULL,
    "posicaoFilaEspera" INTEGER,
    "matriculaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscricoes_matricula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matriculas" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "unidadeEducacaoId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "anoLetivo" INTEGER NOT NULL,
    "numeroMatricula" TEXT NOT NULL,
    "dataMatricula" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "situacao" "SituacaoMatricula" NOT NULL,
    "dataTransferencia" TIMESTAMP(3),
    "motivoTransferencia" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matriculas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turmas" (
    "id" TEXT NOT NULL,
    "unidadeEducacaoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "turno" "Turno" NOT NULL,
    "ano" INTEGER NOT NULL,
    "professorId" TEXT,
    "sala" TEXT,
    "capacidade" INTEGER NOT NULL,
    "vagasOcupadas" INTEGER NOT NULL DEFAULT 0,
    "vagasDisponiveis" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculos_escolares" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "acessibilidade" BOOLEAN NOT NULL DEFAULT false,
    "status" "VeiculoStatus" NOT NULL,
    "km" INTEGER NOT NULL DEFAULT 0,
    "ultimaRevisao" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veiculos_escolares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotas_escolares" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "veiculoId" TEXT NOT NULL,
    "motoristaId" TEXT NOT NULL,
    "turno" "Turno" NOT NULL,
    "horarioSaida" TEXT NOT NULL,
    "horarioRetorno" TEXT NOT NULL,
    "pontos" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rotas_escolares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alunos_rotas" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "rotaId" TEXT NOT NULL,
    "pontoEmbarque" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alunos_rotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadunico_familias" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "responsavelFamiliarId" TEXT NOT NULL,
    "nisResponsavel" TEXT,
    "crasId" TEXT,
    "dataAgendamento" TIMESTAMP(3),
    "horarioAgendamento" TEXT,
    "agendadoPor" TEXT,
    "entrevistadoPor" TEXT,
    "dataEntrevista" TIMESTAMP(3),
    "localEntrevista" TEXT,
    "rendaTotalFamiliar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rendaPerCapita" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fontesRenda" JSONB,
    "despesaMoradia" DOUBLE PRECISION,
    "despesaAlimentacao" DOUBLE PRECISION,
    "despesaSaude" DOUBLE PRECISION,
    "despesaEducacao" DOUBLE PRECISION,
    "despesaOutros" DOUBLE PRECISION,
    "tipoMoradia" "TipoMoradia" NOT NULL,
    "situacaoMoradia" "SituacaoMoradia" NOT NULL,
    "aguaEncanada" BOOLEAN NOT NULL DEFAULT false,
    "energiaEletrica" BOOLEAN NOT NULL DEFAULT false,
    "esgoto" BOOLEAN NOT NULL DEFAULT false,
    "coletaLixo" BOOLEAN NOT NULL DEFAULT false,
    "documentos" JSONB NOT NULL,
    "validadoPor" TEXT,
    "dataValidacao" TIMESTAMP(3),
    "analisadoPor" TEXT,
    "dataAnalise" TIMESTAMP(3),
    "parecerSocial" TEXT,
    "motivoIndeferimento" TEXT,
    "nisFamilia" TEXT,
    "dataCadastro" TIMESTAMP(3),
    "dataUltimaAtualizacao" TIMESTAMP(3),
    "proximaAtualizacao" TIMESTAMP(3),
    "status" "CadUnicoStatus" NOT NULL,
    "programasVinculados" JSONB,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cadunico_familias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_familia" (
    "id" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "citizenId" TEXT,
    "nome" TEXT NOT NULL,
    "cpf" TEXT,
    "dataNascimento" TIMESTAMP(3) NOT NULL,
    "parentesco" "Parentesco" NOT NULL,
    "sexo" "Sexo" NOT NULL,
    "raca" "Raca" NOT NULL,
    "escolaridade" "Escolaridade" NOT NULL,
    "trabalha" BOOLEAN NOT NULL DEFAULT false,
    "rendaMensal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fonteRenda" TEXT,
    "deficiencia" BOOLEAN NOT NULL DEFAULT false,
    "tipoDeficiencia" TEXT,
    "frequentaEscola" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membros_familia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricoes_programas_sociais" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "programaId" TEXT NOT NULL,
    "familiaId" TEXT NOT NULL,
    "beneficiarioId" TEXT NOT NULL,
    "cadUnicoValidado" BOOLEAN NOT NULL DEFAULT false,
    "rendaPerCapita" DOUBLE PRECISION,
    "atendeCriterios" BOOLEAN NOT NULL DEFAULT false,
    "motivoNaoElegibilidade" TEXT,
    "analisadoPor" TEXT,
    "dataAnalise" TIMESTAMP(3),
    "parecerSocial" TEXT,
    "visitaDomiciliar" BOOLEAN NOT NULL DEFAULT false,
    "dataVisita" TIMESTAMP(3),
    "relatorioVisita" TEXT,
    "psicologoId" TEXT,
    "dataParecer" TIMESTAMP(3),
    "parecerPsicologico" TEXT,
    "aprovadoPor" TEXT,
    "dataAprovacao" TIMESTAMP(3),
    "motivoIndeferimento" TEXT,
    "dataConcessao" TIMESTAMP(3),
    "numeroBeneficio" TEXT,
    "valorMensal" DOUBLE PRECISION,
    "diaVencimento" INTEGER,
    "contaBancaria" JSONB,
    "status" "ProgramaSocialStatus" NOT NULL,
    "dataUltimaRenovacao" TIMESTAMP(3),
    "proximaRenovacao" TIMESTAMP(3),
    "suspenso" BOOLEAN NOT NULL DEFAULT false,
    "motivoSuspensao" TEXT,
    "dataSuspensao" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscricoes_programas_sociais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acompanhamentos_beneficio" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "tipo" "TipoAcompanhamento" NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT NOT NULL,
    "observacoes" TEXT,
    "proximoAcompanhamento" TIMESTAMP(3),

    CONSTRAINT "acompanhamentos_beneficio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos_beneficio" (
    "id" TEXT NOT NULL,
    "inscricaoId" TEXT NOT NULL,
    "competencia" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" "StatusPagamento" NOT NULL,
    "comprovante" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "pagamentos_beneficio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_emprestimo_maquina" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "produtorRuralId" TEXT NOT NULL,
    "maquinaId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "diasSolicitados" INTEGER NOT NULL,
    "horasEstimadas" INTEGER,
    "finalidade" "FinalidadeUsoMaquina" NOT NULL,
    "areaUtilizacao" TEXT NOT NULL,
    "tamanhoArea" DOUBLE PRECISION,
    "justificativa" TEXT NOT NULL,
    "validadoPor" TEXT,
    "dataValidacao" TIMESTAMP(3),
    "motivoPendencia" TEXT,
    "aprovadoPor" TEXT,
    "dataAprovacao" TIMESTAMP(3),
    "parecerTecnico" TEXT,
    "maquinaAlternativaSugerida" TEXT,
    "motivoIndeferimento" TEXT,
    "dataRetirada" TIMESTAMP(3),
    "horarioRetirada" TEXT,
    "vistoriadoPor" TEXT,
    "dataVistoriaRetirada" TIMESTAMP(3),
    "checklistRetirada" JSONB,
    "fotosRetirada" JSONB,
    "odometroInicial" INTEGER,
    "horimetroInicial" INTEGER,
    "nivelCombustivelInicial" TEXT,
    "termoAssinado" BOOLEAN NOT NULL DEFAULT false,
    "dataInicioReal" TIMESTAMP(3),
    "dataDevolucao" TIMESTAMP(3),
    "vistoriaDevolucaoPor" TEXT,
    "checklistDevolucao" JSONB,
    "fotosDevolucao" JSONB,
    "odometroFinal" INTEGER,
    "horimetroFinal" INTEGER,
    "horasUsadas" INTEGER,
    "nivelCombustivelFinal" TEXT,
    "danosDetectados" BOOLEAN NOT NULL DEFAULT false,
    "descricaoDanos" TEXT,
    "valorBase" DOUBLE PRECISION,
    "valorHoraExtra" DOUBLE PRECISION,
    "multaAtraso" DOUBLE PRECISION,
    "multaDanos" DOUBLE PRECISION,
    "totalCobrado" DOUBLE PRECISION,
    "statusPagamento" "StatusPagamentoMaquina" NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" "EmprestimoMaquinaStatus" NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_emprestimo_maquina_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maquinas_agricolas_ms" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMaquinaAgricola" NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "ano" INTEGER,
    "placa" TEXT,
    "patrimonio" TEXT NOT NULL,
    "capacidade" TEXT,
    "odometro" INTEGER NOT NULL DEFAULT 0,
    "horimetro" INTEGER NOT NULL DEFAULT 0,
    "ultimaManutencao" TIMESTAMP(3),
    "proximaManutencao" TIMESTAMP(3),
    "historicoManutencao" JSONB,
    "status" "StatusMaquina" NOT NULL,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "motivoIndisponibilidade" TEXT,
    "valorHora" DOUBLE PRECISION,
    "valorDiaria" DOUBLE PRECISION,
    "certificados" JSONB,
    "observacoes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maquinas_agricolas_ms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtores_rurais" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nomePropriedade" TEXT,
    "endereco" JSONB NOT NULL,
    "areaTotal" DOUBLE PRECISION,
    "georreferenciamento" JSONB,
    "tiposProducao" JSONB,
    "car" TEXT,
    "dap" TEXT,
    "emprestimosRealizados" INTEGER NOT NULL DEFAULT 0,
    "pendencias" BOOLEAN NOT NULL DEFAULT false,
    "motivoPendencia" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtores_rurais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_exame" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "medicoSolicitante" TEXT NOT NULL,
    "unidadeSaude" TEXT NOT NULL,
    "tipoExame" "TipoExameSolicitacao" NOT NULL,
    "exameEspecifico" TEXT NOT NULL,
    "justificativa" TEXT NOT NULL,
    "prioridade" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusSolicitacaoExame" NOT NULL DEFAULT 'AGUARDANDO_AGENDAMENTO',
    "documentosAnexados" JSONB,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_exame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos_exame" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "laboratorioId" TEXT,
    "dataAgendada" TIMESTAMP(3) NOT NULL,
    "horario" TEXT NOT NULL,
    "status" "StatusAgendamentoExame" NOT NULL DEFAULT 'AGENDADO',
    "localRealizacao" TEXT NOT NULL,
    "preparoNecessario" TEXT,
    "dataRealizacao" TIMESTAMP(3),
    "resultadoDisponivel" BOOLEAN NOT NULL DEFAULT false,
    "dataResultado" TIMESTAMP(3),
    "laudoUrl" TEXT,
    "medicoLaudador" TEXT,
    "observacoesResultado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_exame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cardapio_merenda" (
    "id" TEXT NOT NULL,
    "unidadeEducacaoId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "turno" TEXT NOT NULL,
    "refeicao" TEXT NOT NULL,
    "alimentos" JSONB NOT NULL,
    "valorNutricional" JSONB,
    "alergenicos" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cardapio_merenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoque_alimentos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "unidade" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "validade" TIMESTAMP(3) NOT NULL,
    "lote" TEXT,
    "fornecedor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estoque_alimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumo_merenda" (
    "id" TEXT NOT NULL,
    "unidadeEducacaoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "turno" TEXT NOT NULL,
    "refeicao" TEXT NOT NULL,
    "alunosAtendidos" INTEGER NOT NULL,
    "alimentosUsados" JSONB NOT NULL,
    "observacoes" TEXT,
    "registradoPor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumo_merenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diario_classe" (
    "id" TEXT NOT NULL,
    "unidadeEducacaoId" TEXT NOT NULL,
    "turmaId" TEXT NOT NULL,
    "professorId" TEXT NOT NULL,
    "disciplina" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "semestre" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diario_classe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aulas" (
    "id" TEXT NOT NULL,
    "diarioId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "conteudo" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "frequencias" (
    "id" TEXT NOT NULL,
    "aulaId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT true,
    "justificado" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,

    CONSTRAINT "frequencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" TEXT NOT NULL,
    "aulaId" TEXT,
    "diarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "peso" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas" (
    "id" TEXT NOT NULL,
    "avaliacaoId" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "nota" DOUBLE PRECISION NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_beneficio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT NOT NULL,
    "valor" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_beneficio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_beneficio" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "tipoBeneficioId" TEXT NOT NULL,
    "unidadeCRASId" TEXT,
    "justificativa" TEXT NOT NULL,
    "documentosAnexos" JSONB,
    "status" "StatusBeneficio" NOT NULL DEFAULT 'AGUARDANDO_ANALISE',
    "analisadoPor" TEXT,
    "dataAnalise" TIMESTAMP(3),
    "motivoIndeferimento" TEXT,
    "dataEntrega" TIMESTAMP(3),
    "valorConcedido" DOUBLE PRECISION,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_beneficio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_atendimento_psicossocial" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "unidadeCRASId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipoAtendimento" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivoAtendimento" TEXT NOT NULL,
    "relatoSituacao" TEXT NOT NULL,
    "encaminhamentos" JSONB,
    "proximoAtendimento" TIMESTAMP(3),
    "statusCaso" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fichas_atendimento_psicossocial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acompanhamentos_psicossociais" (
    "id" TEXT NOT NULL,
    "fichaId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "anexos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "acompanhamentos_psicossociais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas_tecnicas" (
    "id" TEXT NOT NULL,
    "produtorId" TEXT NOT NULL,
    "tecnicoId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT NOT NULL,
    "assunto" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "recomendacoes" TEXT,
    "proximaVisita" TIMESTAMP(3),
    "anexos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitas_tecnicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_producao" (
    "id" TEXT NOT NULL,
    "produtorId" TEXT NOT NULL,
    "safra" TEXT NOT NULL,
    "produto" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "quantidadeKg" DOUBLE PRECISION NOT NULL,
    "dataColheita" TIMESTAMP(3) NOT NULL,
    "destinacao" TEXT NOT NULL,
    "valorVenda" DOUBLE PRECISION,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registros_producao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feiras" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "endereco" TEXT,
    "diaSemana" INTEGER NOT NULL,
    "horarioInicio" TEXT NOT NULL,
    "horarioFim" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feiras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boxes_feira" (
    "id" TEXT NOT NULL,
    "feiraId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "produtorId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boxes_feira_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boletins_aluno" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "diarioId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "semestre" INTEGER NOT NULL,
    "mediaFinal" DOUBLE PRECISION NOT NULL,
    "frequenciaPercentual" DOUBLE PRECISION NOT NULL,
    "situacao" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boletins_aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espacos_culturais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "recursos" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "espacos_culturais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_espaco_cultural" (
    "id" TEXT NOT NULL,
    "espacoId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "solicitanteId" TEXT,
    "dataReserva" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "evento" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_espaco_cultural_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artistas" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "nomeArtistico" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "portfolio" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_culturais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "local" TEXT NOT NULL,
    "descricao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AGENDADO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_culturais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "editais_culturais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataAbertura" TIMESTAMP(3) NOT NULL,
    "dataFechamento" TIMESTAMP(3) NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dataPublicacao" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "editais_culturais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "livros_biblioteca" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "autor" TEXT NOT NULL,
    "isbn" TEXT,
    "categoria" TEXT NOT NULL,
    "editora" TEXT,
    "anoPublicacao" INTEGER,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "livros_biblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emprestimos_biblioteca" (
    "id" TEXT NOT NULL,
    "livroId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "dataEmprestimo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataPrevistaDevolucao" TIMESTAMP(3) NOT NULL,
    "dataDevolucao" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emprestimos_biblioteca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patrimonios_culturais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "descricao" TEXT,
    "statusConservacao" TEXT NOT NULL,
    "anoTombamento" INTEGER,
    "visitantes" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patrimonios_culturais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocorrencias_aluno" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descricao" TEXT NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocorrencias_aluno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atletas" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "equipe" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atletas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campeonatos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campeonatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escolinhas_esporte" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "modalidade" TEXT NOT NULL,
    "faixaEtaria" TEXT NOT NULL,
    "vagasTotal" INTEGER NOT NULL,
    "vagasOcupadas" INTEGER NOT NULL DEFAULT 0,
    "alunos" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escolinhas_esporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos_esportivos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipamentos_esportivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscricoes_habitacao" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "rendaFamiliar" DOUBLE PRECISION NOT NULL,
    "composicaoFamiliar" INTEGER NOT NULL,
    "pontuacao" INTEGER,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscricoes_habitacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obras_habitacionais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "conjuntoId" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataPrevisao" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obras_habitacionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arvores_urbanas" (
    "id" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "coordenadas" JSONB,
    "status" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arvores_urbanas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos_coleta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "tipoMaterial" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pontos_coleta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licencas_ambientais" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "tipoAtividade" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licencas_ambientais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_obra" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tipos_obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_obra" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "tipoObraId" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "obras_publicas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipoObraId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataPrevisao" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "obras_publicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos_iluminacao" (
    "id" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pontos_iluminacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viaturas" (
    "id" TEXT NOT NULL,
    "placa" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ocorrencias" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ocorrencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotas_patrulha" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "turno" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rotas_patrulha_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cameras" (
    "id" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cameras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pontos_turisticos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "descricao" TEXT,
    "coordenadas" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pontos_turisticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos_turisticos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "local" TEXT NOT NULL,
    "descricao" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eventos_turisticos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas_urbanas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "area" DOUBLE PRECISION,
    "regras" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zonas_urbanas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licencas_obra" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "solicitanteId" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "tipoObra" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licencas_obra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imoveis_urbanos" (
    "id" TEXT NOT NULL,
    "inscricao" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "proprietario" TEXT NOT NULL,
    "area" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "imoveis_urbanos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loteamentos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "totalLotes" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loteamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rotas_coleta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "bairros" JSONB NOT NULL,
    "diasSemana" JSONB NOT NULL,
    "tipo" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rotas_coleta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_manutencao" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_manutencao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solicitacoes_poda" (
    "id" TEXT NOT NULL,
    "localizacao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "urgencia" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitacoes_poda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cemiterios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "capacidadeTotal" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cemiterios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sepulturas" (
    "id" TEXT NOT NULL,
    "cemiterioId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "quadra" TEXT,
    "ocupada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sepulturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feiras_livres" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "local" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horarioInicio" TEXT NOT NULL,
    "horarioFim" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feiras_livres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "municipio_config_cnpj_key" ON "municipio_config"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "user_departments_userId_idx" ON "user_departments"("userId");

-- CreateIndex
CREATE INDEX "user_departments_departmentId_idx" ON "user_departments"("departmentId");

-- CreateIndex
CREATE INDEX "user_departments_userId_isPrimary_idx" ON "user_departments"("userId", "isPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "user_departments_userId_departmentId_key" ON "user_departments"("userId", "departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "citizens_cpf_key" ON "citizens"("cpf");

-- CreateIndex
CREATE INDEX "citizen_documents_citizenId_idx" ON "citizen_documents"("citizenId");

-- CreateIndex
CREATE INDEX "citizen_documents_status_idx" ON "citizen_documents"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE UNIQUE INDEX "family_compositions_headId_memberId_key" ON "family_compositions"("headId", "memberId");

-- CreateIndex
CREATE INDEX "protocol_citizen_links_protocolId_idx" ON "protocol_citizen_links"("protocolId");

-- CreateIndex
CREATE INDEX "protocol_citizen_links_linkedCitizenId_idx" ON "protocol_citizen_links"("linkedCitizenId");

-- CreateIndex
CREATE INDEX "protocol_citizen_links_linkType_idx" ON "protocol_citizen_links"("linkType");

-- CreateIndex
CREATE INDEX "protocol_citizen_links_protocolId_linkType_idx" ON "protocol_citizen_links"("protocolId", "linkType");

-- CreateIndex
CREATE INDEX "protocol_citizen_links_linkedCitizenId_isVerified_idx" ON "protocol_citizen_links"("linkedCitizenId", "isVerified");

-- CreateIndex
CREATE INDEX "protocol_citizen_links_protocolId_isVerified_idx" ON "protocol_citizen_links"("protocolId", "isVerified");

-- CreateIndex
CREATE INDEX "protocol_citizen_links_isVerified_verifiedAt_idx" ON "protocol_citizen_links"("isVerified", "verifiedAt");

-- CreateIndex
CREATE UNIQUE INDEX "services_simplified_moduleType_key" ON "services_simplified"("moduleType");

-- CreateIndex
CREATE UNIQUE INDEX "protocols_simplified_number_key" ON "protocols_simplified"("number");

-- CreateIndex
CREATE INDEX "protocols_simplified_status_idx" ON "protocols_simplified"("status");

-- CreateIndex
CREATE INDEX "protocols_simplified_createdAt_idx" ON "protocols_simplified"("createdAt");

-- CreateIndex
CREATE INDEX "protocols_simplified_moduleType_status_idx" ON "protocols_simplified"("moduleType", "status");

-- CreateIndex
CREATE INDEX "protocols_simplified_departmentId_status_idx" ON "protocols_simplified"("departmentId", "status");

-- CreateIndex
CREATE INDEX "protocols_simplified_citizenId_idx" ON "protocols_simplified"("citizenId");

-- CreateIndex
CREATE INDEX "protocol_interactions_protocolId_createdAt_idx" ON "protocol_interactions"("protocolId", "createdAt");

-- CreateIndex
CREATE INDEX "protocol_interactions_protocolId_idx" ON "protocol_interactions"("protocolId");

-- CreateIndex
CREATE INDEX "protocol_documents_protocolId_documentType_idx" ON "protocol_documents"("protocolId", "documentType");

-- CreateIndex
CREATE INDEX "protocol_documents_protocolId_idx" ON "protocol_documents"("protocolId");

-- CreateIndex
CREATE INDEX "protocol_pendings_protocolId_status_idx" ON "protocol_pendings"("protocolId", "status");

-- CreateIndex
CREATE INDEX "protocol_pendings_protocolId_idx" ON "protocol_pendings"("protocolId");

-- CreateIndex
CREATE UNIQUE INDEX "module_workflows_moduleType_key" ON "module_workflows"("moduleType");

-- CreateIndex
CREATE INDEX "protocol_stages_protocolId_stageOrder_idx" ON "protocol_stages"("protocolId", "stageOrder");

-- CreateIndex
CREATE INDEX "protocol_stages_protocolId_idx" ON "protocol_stages"("protocolId");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_sla_protocolId_key" ON "protocol_sla"("protocolId");

-- CreateIndex
CREATE INDEX "analytics_type_metric_period_idx" ON "analytics"("type", "metric", "period");

-- CreateIndex
CREATE INDEX "analytics_entityId_metric_idx" ON "analytics"("entityId", "metric");

-- CreateIndex
CREATE INDEX "analytics_periodType_createdAt_idx" ON "analytics"("periodType", "createdAt");

-- CreateIndex
CREATE INDEX "protocol_metrics_periodType_periodDate_idx" ON "protocol_metrics"("periodType", "periodDate");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_metrics_periodType_periodDate_key" ON "protocol_metrics"("periodType", "periodDate");

-- CreateIndex
CREATE INDEX "department_metrics_departmentId_periodType_idx" ON "department_metrics"("departmentId", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "department_metrics_departmentId_periodType_periodDate_key" ON "department_metrics"("departmentId", "periodType", "periodDate");

-- CreateIndex
CREATE INDEX "service_metrics_serviceId_periodType_idx" ON "service_metrics"("serviceId", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "service_metrics_serviceId_periodType_periodDate_key" ON "service_metrics"("serviceId", "periodType", "periodDate");

-- CreateIndex
CREATE INDEX "server_performance_userId_periodType_idx" ON "server_performance"("userId", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "server_performance_userId_periodType_periodDate_key" ON "server_performance"("userId", "periodType", "periodDate");

-- CreateIndex
CREATE INDEX "protocol_bottlenecks_periodType_impactScore_idx" ON "protocol_bottlenecks"("periodType", "impactScore");

-- CreateIndex
CREATE UNIQUE INDEX "protocol_bottlenecks_bottleneckType_entityId_periodType_per_key" ON "protocol_bottlenecks"("bottleneckType", "entityId", "periodType", "periodDate");

-- CreateIndex
CREATE INDEX "kpis_category_isActive_idx" ON "kpis"("category", "isActive");

-- CreateIndex
CREATE INDEX "kpis_updateFrequency_idx" ON "kpis"("updateFrequency");

-- CreateIndex
CREATE INDEX "reports_type_isActive_idx" ON "reports"("type", "isActive");

-- CreateIndex
CREATE INDEX "reports_createdBy_idx" ON "reports"("createdBy");

-- CreateIndex
CREATE INDEX "report_executions_reportId_status_idx" ON "report_executions"("reportId", "status");

-- CreateIndex
CREATE INDEX "report_executions_executedBy_startedAt_idx" ON "report_executions"("executedBy", "startedAt");

-- CreateIndex
CREATE INDEX "dashboards_userLevel_isActive_idx" ON "dashboards"("userLevel", "isActive");

-- CreateIndex
CREATE INDEX "dashboards_createdBy_idx" ON "dashboards"("createdBy");

-- CreateIndex
CREATE INDEX "alerts_type_isActive_idx" ON "alerts"("type", "isActive");

-- CreateIndex
CREATE INDEX "alerts_metric_isActive_idx" ON "alerts"("metric", "isActive");

-- CreateIndex
CREATE INDEX "alert_triggers_alertId_triggeredAt_idx" ON "alert_triggers"("alertId", "triggeredAt");

-- CreateIndex
CREATE INDEX "alert_triggers_isResolved_triggeredAt_idx" ON "alert_triggers"("isResolved", "triggeredAt");

-- CreateIndex
CREATE INDEX "metric_cache_expiresAt_idx" ON "metric_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "metric_cache_cacheKey_key" ON "metric_cache"("cacheKey");

-- CreateIndex
CREATE INDEX "benchmarks_metric_region_population_idx" ON "benchmarks"("metric", "region", "population");

-- CreateIndex
CREATE INDEX "benchmarks_category_year_idx" ON "benchmarks"("category", "year");

-- CreateIndex
CREATE INDEX "predictions_model_entityType_idx" ON "predictions"("model", "entityType");

-- CreateIndex
CREATE INDEX "predictions_createdAt_idx" ON "predictions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_domains_emailServerId_domainName_key" ON "email_domains"("emailServerId", "domainName");

-- CreateIndex
CREATE UNIQUE INDEX "email_users_emailServerId_email_key" ON "email_users"("emailServerId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "emails_messageId_key" ON "emails"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "email_stats_emailServerId_date_key" ON "email_stats"("emailServerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_name_key" ON "email_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "integrations_provider_key" ON "integrations"("provider");

-- CreateIndex
CREATE INDEX "integration_logs_integrationId_status_idx" ON "integration_logs"("integrationId", "status");

-- CreateIndex
CREATE INDEX "integration_logs_entityType_entityId_idx" ON "integration_logs"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "cache_entries_key_key" ON "cache_entries"("key");

-- CreateIndex
CREATE INDEX "cache_entries_expiresAt_idx" ON "cache_entries"("expiresAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_citizenId_idx" ON "audit_logs"("citizenId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "specialized_pages_pageKey_key" ON "specialized_pages"("pageKey");

-- CreateIndex
CREATE UNIQUE INDEX "specialized_pages_code_key" ON "specialized_pages"("code");

-- CreateIndex
CREATE UNIQUE INDEX "page_metrics_pageId_date_key" ON "page_metrics"("pageId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "page_configurations_pageId_key_key" ON "page_configurations"("pageId", "key");

-- CreateIndex
CREATE INDEX "agenda_events_dataHoraInicio_idx" ON "agenda_events"("dataHoraInicio");

-- CreateIndex
CREATE INDEX "agenda_events_status_idx" ON "agenda_events"("status");

-- CreateIndex
CREATE UNIQUE INDEX "custom_data_tables_tableName_key" ON "custom_data_tables"("tableName");

-- CreateIndex
CREATE INDEX "custom_data_records_tableId_idx" ON "custom_data_records"("tableId");

-- CreateIndex
CREATE INDEX "custom_data_records_protocol_idx" ON "custom_data_records"("protocol");

-- CreateIndex
CREATE INDEX "custom_data_records_serviceId_idx" ON "custom_data_records"("serviceId");

-- CreateIndex
CREATE INDEX "unidades_saude_tipo_isActive_idx" ON "unidades_saude"("tipo", "isActive");

-- CreateIndex
CREATE INDEX "unidades_saude_isActive_idx" ON "unidades_saude"("isActive");

-- CreateIndex
CREATE INDEX "unidades_educacao_tipo_isActive_idx" ON "unidades_educacao"("tipo", "isActive");

-- CreateIndex
CREATE INDEX "unidades_educacao_isActive_idx" ON "unidades_educacao"("isActive");

-- CreateIndex
CREATE INDEX "unidades_cras_tipo_isActive_idx" ON "unidades_cras"("tipo", "isActive");

-- CreateIndex
CREATE INDEX "unidades_cras_isActive_idx" ON "unidades_cras"("isActive");

-- CreateIndex
CREATE INDEX "espacos_publicos_tipo_isActive_idx" ON "espacos_publicos"("tipo", "isActive");

-- CreateIndex
CREATE INDEX "espacos_publicos_categoria_isActive_idx" ON "espacos_publicos"("categoria", "isActive");

-- CreateIndex
CREATE INDEX "espacos_publicos_isActive_idx" ON "espacos_publicos"("isActive");

-- CreateIndex
CREATE INDEX "conjuntos_habitacionais_isActive_idx" ON "conjuntos_habitacionais"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "viaturas_seguranca_codigo_key" ON "viaturas_seguranca"("codigo");

-- CreateIndex
CREATE INDEX "viaturas_seguranca_status_isActive_idx" ON "viaturas_seguranca"("status", "isActive");

-- CreateIndex
CREATE INDEX "viaturas_seguranca_isActive_idx" ON "viaturas_seguranca"("isActive");

-- CreateIndex
CREATE INDEX "parques_pracas_tipo_isActive_idx" ON "parques_pracas"("tipo", "isActive");

-- CreateIndex
CREATE INDEX "parques_pracas_isActive_idx" ON "parques_pracas"("isActive");

-- CreateIndex
CREATE INDEX "estabelecimentos_turisticos_tipo_isActive_idx" ON "estabelecimentos_turisticos"("tipo", "isActive");

-- CreateIndex
CREATE INDEX "estabelecimentos_turisticos_isActive_idx" ON "estabelecimentos_turisticos"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "programas_sociais_nome_key" ON "programas_sociais"("nome");

-- CreateIndex
CREATE INDEX "programas_sociais_tipo_isActive_idx" ON "programas_sociais"("tipo", "isActive");

-- CreateIndex
CREATE INDEX "programas_sociais_isActive_idx" ON "programas_sociais"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_obra_servico_nome_key" ON "tipos_obra_servico"("nome");

-- CreateIndex
CREATE INDEX "tipos_obra_servico_categoria_isActive_idx" ON "tipos_obra_servico"("categoria", "isActive");

-- CreateIndex
CREATE INDEX "tipos_obra_servico_isActive_idx" ON "tipos_obra_servico"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "especialidades_medicas_nome_key" ON "especialidades_medicas"("nome");

-- CreateIndex
CREATE INDEX "especialidades_medicas_area_isActive_idx" ON "especialidades_medicas"("area", "isActive");

-- CreateIndex
CREATE INDEX "especialidades_medicas_isActive_idx" ON "especialidades_medicas"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_producao_agricola_nome_key" ON "tipos_producao_agricola"("nome");

-- CreateIndex
CREATE INDEX "tipos_producao_agricola_categoria_isActive_idx" ON "tipos_producao_agricola"("categoria", "isActive");

-- CreateIndex
CREATE INDEX "tipos_producao_agricola_isActive_idx" ON "tipos_producao_agricola"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "maquinas_agricolas_identificacao_key" ON "maquinas_agricolas"("identificacao");

-- CreateIndex
CREATE INDEX "maquinas_agricolas_status_isActive_idx" ON "maquinas_agricolas"("status", "isActive");

-- CreateIndex
CREATE INDEX "maquinas_agricolas_isActive_idx" ON "maquinas_agricolas"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "especies_arvore_nomeComum_key" ON "especies_arvore"("nomeComum");

-- CreateIndex
CREATE INDEX "especies_arvore_origem_isActive_idx" ON "especies_arvore"("origem", "isActive");

-- CreateIndex
CREATE INDEX "especies_arvore_isActive_idx" ON "especies_arvore"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_estabelecimento_turistico_nome_key" ON "tipos_estabelecimento_turistico"("nome");

-- CreateIndex
CREATE INDEX "tipos_estabelecimento_turistico_categoria_isActive_idx" ON "tipos_estabelecimento_turistico"("categoria", "isActive");

-- CreateIndex
CREATE INDEX "tipos_estabelecimento_turistico_isActive_idx" ON "tipos_estabelecimento_turistico"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "modalidades_esportivas_nome_key" ON "modalidades_esportivas"("nome");

-- CreateIndex
CREATE INDEX "modalidades_esportivas_categoria_isActive_idx" ON "modalidades_esportivas"("categoria", "isActive");

-- CreateIndex
CREATE INDEX "modalidades_esportivas_isActive_idx" ON "modalidades_esportivas"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_atividade_cultural_nome_key" ON "tipos_atividade_cultural"("nome");

-- CreateIndex
CREATE INDEX "tipos_atividade_cultural_categoria_isActive_idx" ON "tipos_atividade_cultural"("categoria", "isActive");

-- CreateIndex
CREATE INDEX "tipos_atividade_cultural_isActive_idx" ON "tipos_atividade_cultural"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_ocorrencia_nome_key" ON "tipos_ocorrencia"("nome");

-- CreateIndex
CREATE INDEX "tipos_ocorrencia_categoria_gravidade_isActive_idx" ON "tipos_ocorrencia"("categoria", "gravidade", "isActive");

-- CreateIndex
CREATE INDEX "tipos_ocorrencia_isActive_idx" ON "tipos_ocorrencia"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "cursos_profissionalizantes_nome_key" ON "cursos_profissionalizantes"("nome");

-- CreateIndex
CREATE INDEX "cursos_profissionalizantes_categoria_isActive_idx" ON "cursos_profissionalizantes"("categoria", "isActive");

-- CreateIndex
CREATE INDEX "cursos_profissionalizantes_isActive_idx" ON "cursos_profissionalizantes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "programas_habitacionais_nome_key" ON "programas_habitacionais"("nome");

-- CreateIndex
CREATE INDEX "programas_habitacionais_tipo_isActive_idx" ON "programas_habitacionais"("tipo", "isActive");

-- CreateIndex
CREATE INDEX "programas_habitacionais_isActive_idx" ON "programas_habitacionais"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "programas_ambientais_nome_key" ON "programas_ambientais"("nome");

-- CreateIndex
CREATE INDEX "programas_ambientais_tipo_isActive_idx" ON "programas_ambientais"("tipo", "isActive");

-- CreateIndex
CREATE INDEX "programas_ambientais_isActive_idx" ON "programas_ambientais"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "profissionais_saude_cpf_key" ON "profissionais_saude"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "profissionais_saude_registroProfissional_key" ON "profissionais_saude"("registroProfissional");

-- CreateIndex
CREATE INDEX "profissionais_saude_categoria_isActive_idx" ON "profissionais_saude"("categoria", "isActive");

-- CreateIndex
CREATE INDEX "profissionais_saude_especialidade_isActive_idx" ON "profissionais_saude"("especialidade", "isActive");

-- CreateIndex
CREATE INDEX "profissionais_saude_isActive_idx" ON "profissionais_saude"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "professores_cpf_key" ON "professores"("cpf");

-- CreateIndex
CREATE INDEX "professores_vinculo_isActive_idx" ON "professores"("vinculo", "isActive");

-- CreateIndex
CREATE INDEX "professores_isActive_idx" ON "professores"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "guias_turisticos_cpf_key" ON "guias_turisticos"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "guias_turisticos_cadastur_key" ON "guias_turisticos"("cadastur");

-- CreateIndex
CREATE INDEX "guias_turisticos_isActive_idx" ON "guias_turisticos"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_documento_nome_key" ON "tipos_documento"("nome");

-- CreateIndex
CREATE INDEX "tipos_documento_categoria_isActive_idx" ON "tipos_documento"("categoria", "isActive");

-- CreateIndex
CREATE INDEX "tipos_documento_isActive_idx" ON "tipos_documento"("isActive");

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

-- CreateIndex
CREATE INDEX "agendas_medicas_profissionalId_diaSemana_idx" ON "agendas_medicas"("profissionalId", "diaSemana");

-- CreateIndex
CREATE INDEX "agendas_medicas_unidadeId_isActive_idx" ON "agendas_medicas"("unidadeId", "isActive");

-- CreateIndex
CREATE INDEX "consultas_agendadas_agendaId_dataHora_idx" ON "consultas_agendadas"("agendaId", "dataHora");

-- CreateIndex
CREATE INDEX "consultas_agendadas_citizenId_idx" ON "consultas_agendadas"("citizenId");

-- CreateIndex
CREATE INDEX "consultas_agendadas_status_idx" ON "consultas_agendadas"("status");

-- CreateIndex
CREATE UNIQUE INDEX "atendimentos_medicos_workflowId_key" ON "atendimentos_medicos"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "atendimentos_medicos_protocolId_key" ON "atendimentos_medicos"("protocolId");

-- CreateIndex
CREATE UNIQUE INDEX "atendimentos_medicos_consultaAgendadaId_key" ON "atendimentos_medicos"("consultaAgendadaId");

-- CreateIndex
CREATE INDEX "atendimentos_medicos_citizenId_idx" ON "atendimentos_medicos"("citizenId");

-- CreateIndex
CREATE INDEX "atendimentos_medicos_unidadeId_dataAtendimento_idx" ON "atendimentos_medicos"("unidadeId", "dataAtendimento");

-- CreateIndex
CREATE INDEX "atendimentos_medicos_status_idx" ON "atendimentos_medicos"("status");

-- CreateIndex
CREATE INDEX "atendimentos_medicos_workflowId_idx" ON "atendimentos_medicos"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "triagem_enfermagem_atendimentoId_key" ON "triagem_enfermagem"("atendimentoId");

-- CreateIndex
CREATE UNIQUE INDEX "consultas_medicas_atendimentoId_key" ON "consultas_medicas"("atendimentoId");

-- CreateIndex
CREATE INDEX "prescricoes_consultaId_idx" ON "prescricoes"("consultaId");

-- CreateIndex
CREATE INDEX "exames_solicitados_consultaId_idx" ON "exames_solicitados"("consultaId");

-- CreateIndex
CREATE INDEX "atestados_consultaId_idx" ON "atestados"("consultaId");

-- CreateIndex
CREATE INDEX "encaminhamentos_consultaId_idx" ON "encaminhamentos"("consultaId");

-- CreateIndex
CREATE INDEX "medicamentos_nome_idx" ON "medicamentos"("nome");

-- CreateIndex
CREATE INDEX "medicamentos_isRename_idx" ON "medicamentos"("isRename");

-- CreateIndex
CREATE INDEX "estoque_medicamentos_medicamentoId_unidadeId_idx" ON "estoque_medicamentos"("medicamentoId", "unidadeId");

-- CreateIndex
CREATE INDEX "estoque_medicamentos_validade_idx" ON "estoque_medicamentos"("validade");

-- CreateIndex
CREATE INDEX "dispensacao_medicamentos_citizenId_idx" ON "dispensacao_medicamentos"("citizenId");

-- CreateIndex
CREATE INDEX "dispensacao_medicamentos_data_idx" ON "dispensacao_medicamentos"("data");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_tfd_workflowId_key" ON "solicitacoes_tfd"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_tfd_protocolId_key" ON "solicitacoes_tfd"("protocolId");

-- CreateIndex
CREATE INDEX "solicitacoes_tfd_citizenId_idx" ON "solicitacoes_tfd"("citizenId");

-- CreateIndex
CREATE INDEX "solicitacoes_tfd_status_idx" ON "solicitacoes_tfd"("status");

-- CreateIndex
CREATE INDEX "solicitacoes_tfd_workflowId_idx" ON "solicitacoes_tfd"("workflowId");

-- CreateIndex
CREATE INDEX "viagens_tfd_solicitacaoTFDId_idx" ON "viagens_tfd"("solicitacaoTFDId");

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_tfd_placa_key" ON "veiculos_tfd"("placa");

-- CreateIndex
CREATE INDEX "veiculos_tfd_status_idx" ON "veiculos_tfd"("status");

-- CreateIndex
CREATE UNIQUE INDEX "motoristas_tfd_userId_key" ON "motoristas_tfd"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "motoristas_tfd_cpf_key" ON "motoristas_tfd"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "motoristas_tfd_cnh_key" ON "motoristas_tfd"("cnh");

-- CreateIndex
CREATE INDEX "motoristas_tfd_status_idx" ON "motoristas_tfd"("status");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_matricula_workflowId_key" ON "inscricoes_matricula"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_matricula_matriculaId_key" ON "inscricoes_matricula"("matriculaId");

-- CreateIndex
CREATE INDEX "inscricoes_matricula_serie_turno_status_idx" ON "inscricoes_matricula"("serie", "turno", "status");

-- CreateIndex
CREATE INDEX "inscricoes_matricula_escolaAtribuida_status_idx" ON "inscricoes_matricula"("escolaAtribuida", "status");

-- CreateIndex
CREATE INDEX "inscricoes_matricula_workflowId_idx" ON "inscricoes_matricula"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_inscricaoId_key" ON "matriculas"("inscricaoId");

-- CreateIndex
CREATE UNIQUE INDEX "matriculas_numeroMatricula_key" ON "matriculas"("numeroMatricula");

-- CreateIndex
CREATE INDEX "matriculas_alunoId_anoLetivo_idx" ON "matriculas"("alunoId", "anoLetivo");

-- CreateIndex
CREATE INDEX "matriculas_turmaId_situacao_idx" ON "matriculas"("turmaId", "situacao");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_codigo_key" ON "turmas"("codigo");

-- CreateIndex
CREATE INDEX "turmas_unidadeEducacaoId_serie_turno_ano_idx" ON "turmas"("unidadeEducacaoId", "serie", "turno", "ano");

-- CreateIndex
CREATE UNIQUE INDEX "veiculos_escolares_placa_key" ON "veiculos_escolares"("placa");

-- CreateIndex
CREATE INDEX "veiculos_escolares_status_idx" ON "veiculos_escolares"("status");

-- CreateIndex
CREATE INDEX "rotas_escolares_turno_idx" ON "rotas_escolares"("turno");

-- CreateIndex
CREATE UNIQUE INDEX "alunos_rotas_alunoId_rotaId_key" ON "alunos_rotas"("alunoId", "rotaId");

-- CreateIndex
CREATE UNIQUE INDEX "cadunico_familias_workflowId_key" ON "cadunico_familias"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "cadunico_familias_nisResponsavel_key" ON "cadunico_familias"("nisResponsavel");

-- CreateIndex
CREATE UNIQUE INDEX "cadunico_familias_nisFamilia_key" ON "cadunico_familias"("nisFamilia");

-- CreateIndex
CREATE INDEX "cadunico_familias_responsavelFamiliarId_idx" ON "cadunico_familias"("responsavelFamiliarId");

-- CreateIndex
CREATE INDEX "cadunico_familias_nisFamilia_idx" ON "cadunico_familias"("nisFamilia");

-- CreateIndex
CREATE INDEX "cadunico_familias_status_idx" ON "cadunico_familias"("status");

-- CreateIndex
CREATE INDEX "cadunico_familias_proximaAtualizacao_idx" ON "cadunico_familias"("proximaAtualizacao");

-- CreateIndex
CREATE INDEX "cadunico_familias_workflowId_idx" ON "cadunico_familias"("workflowId");

-- CreateIndex
CREATE INDEX "membros_familia_familiaId_idx" ON "membros_familia"("familiaId");

-- CreateIndex
CREATE INDEX "membros_familia_cpf_idx" ON "membros_familia"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_programas_sociais_workflowId_key" ON "inscricoes_programas_sociais"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_programas_sociais_numeroBeneficio_key" ON "inscricoes_programas_sociais"("numeroBeneficio");

-- CreateIndex
CREATE INDEX "inscricoes_programas_sociais_programaId_status_idx" ON "inscricoes_programas_sociais"("programaId", "status");

-- CreateIndex
CREATE INDEX "inscricoes_programas_sociais_beneficiarioId_idx" ON "inscricoes_programas_sociais"("beneficiarioId");

-- CreateIndex
CREATE INDEX "inscricoes_programas_sociais_numeroBeneficio_idx" ON "inscricoes_programas_sociais"("numeroBeneficio");

-- CreateIndex
CREATE INDEX "inscricoes_programas_sociais_workflowId_idx" ON "inscricoes_programas_sociais"("workflowId");

-- CreateIndex
CREATE INDEX "acompanhamentos_beneficio_inscricaoId_idx" ON "acompanhamentos_beneficio"("inscricaoId");

-- CreateIndex
CREATE INDEX "pagamentos_beneficio_inscricaoId_competencia_idx" ON "pagamentos_beneficio"("inscricaoId", "competencia");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_emprestimo_maquina_workflowId_key" ON "solicitacoes_emprestimo_maquina"("workflowId");

-- CreateIndex
CREATE INDEX "solicitacoes_emprestimo_maquina_produtorRuralId_status_idx" ON "solicitacoes_emprestimo_maquina"("produtorRuralId", "status");

-- CreateIndex
CREATE INDEX "solicitacoes_emprestimo_maquina_maquinaId_dataInicio_dataFi_idx" ON "solicitacoes_emprestimo_maquina"("maquinaId", "dataInicio", "dataFim");

-- CreateIndex
CREATE INDEX "solicitacoes_emprestimo_maquina_workflowId_idx" ON "solicitacoes_emprestimo_maquina"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "maquinas_agricolas_ms_placa_key" ON "maquinas_agricolas_ms"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "maquinas_agricolas_ms_patrimonio_key" ON "maquinas_agricolas_ms"("patrimonio");

-- CreateIndex
CREATE INDEX "maquinas_agricolas_ms_tipo_status_idx" ON "maquinas_agricolas_ms"("tipo", "status");

-- CreateIndex
CREATE UNIQUE INDEX "produtores_rurais_citizenId_key" ON "produtores_rurais"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "produtores_rurais_cpf_key" ON "produtores_rurais"("cpf");

-- CreateIndex
CREATE INDEX "produtores_rurais_cpf_idx" ON "produtores_rurais"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_exame_workflowId_key" ON "solicitacoes_exame"("workflowId");

-- CreateIndex
CREATE INDEX "solicitacoes_exame_citizenId_idx" ON "solicitacoes_exame"("citizenId");

-- CreateIndex
CREATE INDEX "solicitacoes_exame_status_idx" ON "solicitacoes_exame"("status");

-- CreateIndex
CREATE INDEX "solicitacoes_exame_tipoExame_idx" ON "solicitacoes_exame"("tipoExame");

-- CreateIndex
CREATE INDEX "solicitacoes_exame_workflowId_idx" ON "solicitacoes_exame"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "agendamentos_exame_solicitacaoId_key" ON "agendamentos_exame"("solicitacaoId");

-- CreateIndex
CREATE INDEX "agendamentos_exame_dataAgendada_idx" ON "agendamentos_exame"("dataAgendada");

-- CreateIndex
CREATE INDEX "agendamentos_exame_status_idx" ON "agendamentos_exame"("status");

-- CreateIndex
CREATE INDEX "cardapio_merenda_unidadeEducacaoId_diaSemana_idx" ON "cardapio_merenda"("unidadeEducacaoId", "diaSemana");

-- CreateIndex
CREATE INDEX "cardapio_merenda_isActive_idx" ON "cardapio_merenda"("isActive");

-- CreateIndex
CREATE INDEX "estoque_alimentos_nome_idx" ON "estoque_alimentos"("nome");

-- CreateIndex
CREATE INDEX "estoque_alimentos_validade_idx" ON "estoque_alimentos"("validade");

-- CreateIndex
CREATE INDEX "estoque_alimentos_isActive_idx" ON "estoque_alimentos"("isActive");

-- CreateIndex
CREATE INDEX "consumo_merenda_unidadeEducacaoId_data_idx" ON "consumo_merenda"("unidadeEducacaoId", "data");

-- CreateIndex
CREATE INDEX "diario_classe_professorId_turmaId_idx" ON "diario_classe"("professorId", "turmaId");

-- CreateIndex
CREATE INDEX "diario_classe_unidadeEducacaoId_idx" ON "diario_classe"("unidadeEducacaoId");

-- CreateIndex
CREATE INDEX "aulas_diarioId_data_idx" ON "aulas"("diarioId", "data");

-- CreateIndex
CREATE INDEX "frequencias_aulaId_idx" ON "frequencias"("aulaId");

-- CreateIndex
CREATE INDEX "frequencias_alunoId_idx" ON "frequencias"("alunoId");

-- CreateIndex
CREATE INDEX "avaliacoes_diarioId_idx" ON "avaliacoes"("diarioId");

-- CreateIndex
CREATE INDEX "notas_avaliacaoId_idx" ON "notas"("avaliacaoId");

-- CreateIndex
CREATE INDEX "notas_alunoId_idx" ON "notas"("alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_beneficio_nome_key" ON "tipos_beneficio"("nome");

-- CreateIndex
CREATE INDEX "tipos_beneficio_isActive_idx" ON "tipos_beneficio"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_beneficio_protocolId_key" ON "solicitacoes_beneficio"("protocolId");

-- CreateIndex
CREATE INDEX "solicitacoes_beneficio_citizenId_idx" ON "solicitacoes_beneficio"("citizenId");

-- CreateIndex
CREATE INDEX "solicitacoes_beneficio_status_idx" ON "solicitacoes_beneficio"("status");

-- CreateIndex
CREATE INDEX "solicitacoes_beneficio_tipoBeneficioId_idx" ON "solicitacoes_beneficio"("tipoBeneficioId");

-- CreateIndex
CREATE INDEX "fichas_atendimento_psicossocial_citizenId_idx" ON "fichas_atendimento_psicossocial"("citizenId");

-- CreateIndex
CREATE INDEX "fichas_atendimento_psicossocial_profissionalId_idx" ON "fichas_atendimento_psicossocial"("profissionalId");

-- CreateIndex
CREATE INDEX "fichas_atendimento_psicossocial_unidadeCRASId_idx" ON "fichas_atendimento_psicossocial"("unidadeCRASId");

-- CreateIndex
CREATE INDEX "fichas_atendimento_psicossocial_statusCaso_idx" ON "fichas_atendimento_psicossocial"("statusCaso");

-- CreateIndex
CREATE INDEX "acompanhamentos_psicossociais_fichaId_idx" ON "acompanhamentos_psicossociais"("fichaId");

-- CreateIndex
CREATE INDEX "visitas_tecnicas_produtorId_idx" ON "visitas_tecnicas"("produtorId");

-- CreateIndex
CREATE INDEX "visitas_tecnicas_tecnicoId_idx" ON "visitas_tecnicas"("tecnicoId");

-- CreateIndex
CREATE INDEX "visitas_tecnicas_data_idx" ON "visitas_tecnicas"("data");

-- CreateIndex
CREATE INDEX "registros_producao_produtorId_idx" ON "registros_producao"("produtorId");

-- CreateIndex
CREATE INDEX "registros_producao_safra_idx" ON "registros_producao"("safra");

-- CreateIndex
CREATE INDEX "registros_producao_produto_idx" ON "registros_producao"("produto");

-- CreateIndex
CREATE INDEX "feiras_isActive_idx" ON "feiras"("isActive");

-- CreateIndex
CREATE INDEX "boxes_feira_feiraId_idx" ON "boxes_feira"("feiraId");

-- CreateIndex
CREATE INDEX "boxes_feira_produtorId_idx" ON "boxes_feira"("produtorId");

-- CreateIndex
CREATE UNIQUE INDEX "boxes_feira_feiraId_numero_key" ON "boxes_feira"("feiraId", "numero");

-- CreateIndex
CREATE INDEX "boletins_aluno_alunoId_idx" ON "boletins_aluno"("alunoId");

-- CreateIndex
CREATE INDEX "reservas_espaco_cultural_espacoId_idx" ON "reservas_espaco_cultural"("espacoId");

-- CreateIndex
CREATE INDEX "reservas_espaco_cultural_citizenId_idx" ON "reservas_espaco_cultural"("citizenId");

-- CreateIndex
CREATE INDEX "emprestimos_biblioteca_livroId_idx" ON "emprestimos_biblioteca"("livroId");

-- CreateIndex
CREATE INDEX "emprestimos_biblioteca_citizenId_idx" ON "emprestimos_biblioteca"("citizenId");

-- CreateIndex
CREATE INDEX "ocorrencias_aluno_alunoId_idx" ON "ocorrencias_aluno"("alunoId");

-- CreateIndex
CREATE UNIQUE INDEX "inscricoes_habitacao_workflowId_key" ON "inscricoes_habitacao"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "licencas_ambientais_workflowId_key" ON "licencas_ambientais"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "solicitacoes_obra_workflowId_key" ON "solicitacoes_obra"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "viaturas_placa_key" ON "viaturas"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "ocorrencias_workflowId_key" ON "ocorrencias"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "licencas_obra_workflowId_key" ON "licencas_obra"("workflowId");

-- CreateIndex
CREATE UNIQUE INDEX "imoveis_urbanos_inscricao_key" ON "imoveis_urbanos"("inscricao");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_departments" ADD CONSTRAINT "user_departments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_departments" ADD CONSTRAINT "user_departments_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_documents" ADD CONSTRAINT "citizen_documents_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_compositions" ADD CONSTRAINT "family_compositions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_compositions" ADD CONSTRAINT "family_compositions_headId_fkey" FOREIGN KEY ("headId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_citizen_links" ADD CONSTRAINT "protocol_citizen_links_linkedCitizenId_fkey" FOREIGN KEY ("linkedCitizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_citizen_links" ADD CONSTRAINT "protocol_citizen_links_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services_simplified" ADD CONSTRAINT "services_simplified_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols_simplified" ADD CONSTRAINT "protocols_simplified_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols_simplified" ADD CONSTRAINT "protocols_simplified_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols_simplified" ADD CONSTRAINT "protocols_simplified_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols_simplified" ADD CONSTRAINT "protocols_simplified_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocols_simplified" ADD CONSTRAINT "protocols_simplified_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_history_simplified" ADD CONSTRAINT "protocol_history_simplified_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_evaluations_simplified" ADD CONSTRAINT "protocol_evaluations_simplified_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_interactions" ADD CONSTRAINT "protocol_interactions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_documents" ADD CONSTRAINT "protocol_documents_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_pendings" ADD CONSTRAINT "protocol_pendings_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_stages" ADD CONSTRAINT "protocol_stages_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "protocol_sla" ADD CONSTRAINT "protocol_sla_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_transfer_requests" ADD CONSTRAINT "citizen_transfer_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_transfer_requests" ADD CONSTRAINT "citizen_transfer_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_executions" ADD CONSTRAINT "report_executions_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_triggers" ADD CONSTRAINT "alert_triggers_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "alerts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_domains" ADD CONSTRAINT "email_domains_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "email_servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_users" ADD CONSTRAINT "email_users_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "email_servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "email_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_domainId_fkey" FOREIGN KEY ("domainId") REFERENCES "email_domains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emails" ADD CONSTRAINT "emails_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "email_servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_events" ADD CONSTRAINT "email_events_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "emails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "email_servers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_stats" ADD CONSTRAINT "email_stats_emailServerId_fkey" FOREIGN KEY ("emailServerId") REFERENCES "email_servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_auth_attempts" ADD CONSTRAINT "email_auth_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "email_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "integrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_metrics" ADD CONSTRAINT "page_metrics_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "specialized_pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_configurations" ADD CONSTRAINT "page_configurations_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "specialized_pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agenda_events" ADD CONSTRAINT "agenda_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_data_records" ADD CONSTRAINT "custom_data_records_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "custom_data_tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "workflow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_agendadas" ADD CONSTRAINT "consultas_agendadas_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "agendas_medicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triagem_enfermagem" ADD CONSTRAINT "triagem_enfermagem_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos_medicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_medicas" ADD CONSTRAINT "consultas_medicas_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos_medicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescricoes" ADD CONSTRAINT "prescricoes_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consultas_medicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exames_solicitados" ADD CONSTRAINT "exames_solicitados_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consultas_medicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atestados" ADD CONSTRAINT "atestados_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consultas_medicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encaminhamentos" ADD CONSTRAINT "encaminhamentos_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "consultas_medicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoque_medicamentos" ADD CONSTRAINT "estoque_medicamentos_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "viagens_tfd" ADD CONSTRAINT "viagens_tfd_solicitacaoTFDId_fkey" FOREIGN KEY ("solicitacaoTFDId") REFERENCES "solicitacoes_tfd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "inscricoes_matricula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_familia" ADD CONSTRAINT "membros_familia_familiaId_fkey" FOREIGN KEY ("familiaId") REFERENCES "cadunico_familias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamentos_beneficio" ADD CONSTRAINT "acompanhamentos_beneficio_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "inscricoes_programas_sociais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos_beneficio" ADD CONSTRAINT "pagamentos_beneficio_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "inscricoes_programas_sociais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos_exame" ADD CONSTRAINT "agendamentos_exame_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes_exame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aulas" ADD CONSTRAINT "aulas_diarioId_fkey" FOREIGN KEY ("diarioId") REFERENCES "diario_classe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "frequencias" ADD CONSTRAINT "frequencias_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "aulas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_aulaId_fkey" FOREIGN KEY ("aulaId") REFERENCES "aulas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas" ADD CONSTRAINT "notas_avaliacaoId_fkey" FOREIGN KEY ("avaliacaoId") REFERENCES "avaliacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_beneficio" ADD CONSTRAINT "solicitacoes_beneficio_tipoBeneficioId_fkey" FOREIGN KEY ("tipoBeneficioId") REFERENCES "tipos_beneficio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamentos_psicossociais" ADD CONSTRAINT "acompanhamentos_psicossociais_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "fichas_atendimento_psicossocial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boxes_feira" ADD CONSTRAINT "boxes_feira_feiraId_fkey" FOREIGN KEY ("feiraId") REFERENCES "feiras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_espaco_cultural" ADD CONSTRAINT "reservas_espaco_cultural_espacoId_fkey" FOREIGN KEY ("espacoId") REFERENCES "espacos_culturais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprestimos_biblioteca" ADD CONSTRAINT "emprestimos_biblioteca_livroId_fkey" FOREIGN KEY ("livroId") REFERENCES "livros_biblioteca"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

