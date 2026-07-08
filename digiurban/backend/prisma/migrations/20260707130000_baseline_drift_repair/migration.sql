-- ============================================================================
-- BASELINE DE REPARO DE DRIFT (Fase 0 Multi-Tenant, achado B7 da auditoria)
-- ============================================================================
-- CONTEXTO: dezenas de objetos (tabelas do PEC e-SUS, fila_atendimento,
-- digital_certificates, flow_executions, etc.) existiam APENAS via `prisma db
-- push` em produção -- nenhuma migration os criava. Instalações novas via
-- `migrate deploy` produziam schema incompleto.
--
-- Esta migration foi gerada com:
--   prisma migrate diff --from-migrations prisma/migrations --     --to-schema-datamodel prisma/schema.prisma --script
-- e converge um banco que aplicou toda a cadeia de migrations ao estado exato
-- do schema.prisma.
--
-- ATENCAO -- EM PRODUCAO (banco que já contém esses objetos via db push):
--   NAO executar -- marcar como aplicada ANTES do próximo deploy:
--   npx prisma migrate resolve --applied 20260707130000_baseline_drift_repair
--   (Se executada por engano, o primeiro CREATE TYPE duplicado aborta a
--   transação inteira -- nenhuma alteração parcial é aplicada.)
-- ============================================================================

-- CreateEnum
CREATE TYPE "TipoClassificacao" AS ENUM ('CIAP2', 'CID10');

-- CreateEnum
CREATE TYPE "StatusProblema" AS ENUM ('ATIVO', 'LATENTE', 'RESOLVIDO');

-- CreateEnum
CREATE TYPE "GravidadeProblema" AS ENUM ('LEVE', 'MODERADO', 'GRAVE');

-- CreateEnum
CREATE TYPE "TipoAlergia" AS ENUM ('MEDICAMENTO', 'ALIMENTO', 'AMBIENTAL', 'CONTATO', 'LATEX', 'OUTRA');

-- CreateEnum
CREATE TYPE "GravidadeAlergia" AS ENUM ('LEVE', 'MODERADA', 'GRAVE', 'ANAFILAXIA');

-- CreateEnum
CREATE TYPE "RiscoGestacional" AS ENUM ('HABITUAL', 'ALTO_RISCO');

-- CreateEnum
CREATE TYPE "StatusPreNatal" AS ENUM ('EM_ANDAMENTO', 'FINALIZADO', 'INTERROMPIDO');

-- CreateEnum
CREATE TYPE "TipoDesfecho" AS ENUM ('PARTO_NORMAL', 'CESAREA', 'ABORTO', 'INTERRUPCAO');

-- CreateEnum
CREATE TYPE "TipoExamePreNatal" AS ENUM ('HEMOGRAMA', 'GLICEMIA', 'TIPO_SANGUINEO', 'VDRL', 'HIV', 'TOXOPLASMOSE', 'HEPATITE_B', 'HEPATITE_C', 'URINA_ROTINA', 'UROCULTURA', 'ULTRASSOM', 'OUTRO');

-- CreateEnum
CREATE TYPE "TurnoVisita" AS ENUM ('MANHA', 'TARDE', 'NOITE');

-- CreateEnum
CREATE TYPE "TipoVisita" AS ENUM ('CADASTRAMENTO', 'ACOMPANHAMENTO', 'BUSCA_ATIVA', 'CONTROLE_AMBIENTAL', 'EDUCACAO_SAUDE', 'CONVOCACAO');

-- CreateEnum
CREATE TYPE "CertificateType" AS ENUM ('SERVER', 'CITIZEN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CertStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RevocationReason" AS ENUM ('UNSPECIFIED', 'KEY_COMPROMISE', 'CA_COMPROMISE', 'AFFILIATION_CHANGED', 'SUPERSEDED', 'CESSATION', 'CERTIFICATE_HOLD');

-- CreateEnum
CREATE TYPE "CertificateRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TipoIndisponibilidade" AS ENUM ('FERIAS', 'LICENCA', 'TREINAMENTO', 'REUNIAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoDocumentoAnexo" AS ENUM ('EXAME', 'LAUDO', 'RECEITA', 'ATESTADO', 'ENCAMINHAMENTO', 'IMAGEM', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusTransferencia" AS ENUM ('PENDENTE', 'APROVADA', 'REJEITADA', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "TipoAlertaEstoque" AS ENUM ('ESTOQUE_BAIXO', 'ESTOQUE_CRITICO', 'VENCIMENTO_PROXIMO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "TipoDocumentoTFD" AS ENUM ('LAUDO_MEDICO', 'PEDIDO_MEDICO', 'EXAMES', 'RG', 'CPF', 'CARTAO_SUS', 'COMPROVANTE_RESIDENCIA', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusParecer" AS ENUM ('APROVADO', 'REPROVADO', 'PENDENTE_DOCUMENTACAO');

-- CreateEnum
CREATE TYPE "DecisaoGestao" AS ENUM ('APROVADO', 'REPROVADO', 'APROVADO_PARCIAL');

-- CreateEnum
CREATE TYPE "StatusEmbarque" AS ENUM ('AGUARDANDO', 'EMBARCADO', 'AUSENTE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusPrestacao" AS ENUM ('PENDENTE', 'EM_ANALISE', 'APROVADA', 'REJEITADA');

-- CreateEnum
CREATE TYPE "TipoSala" AS ENUM ('CONSULTORIO', 'ENFERMAGEM', 'CURATIVO', 'VACINA', 'PROCEDIMENTO', 'ODONTOLOGIA', 'PSICOLOGIA', 'NUTRICAO', 'FARMACIA', 'TRIAGEM', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoIntegracaoESUS" AS ENUM ('API_REST', 'LEDI_THRIFT', 'LEDI_XML', 'NENHUMA');

-- CreateEnum
CREATE TYPE "FormatoLEDI" AS ENUM ('THRIFT', 'XML');

-- CreateEnum
CREATE TYPE "TipoFichaESUS" AS ENUM ('CADASTRO_INDIVIDUAL', 'CADASTRO_DOMICILIAR', 'ATENDIMENTO_INDIVIDUAL', 'ATENDIMENTO_ODONTOLOGICO', 'ATENDIMENTO_DOMICILIAR', 'VISITA_DOMICILIAR', 'ATIVIDADE_COLETIVA', 'PROCEDIMENTOS', 'VACINACAO');

-- CreateEnum
CREATE TYPE "StatusTransmissao" AS ENUM ('PENDENTE', 'ENVIANDO', 'SUCESSO', 'ERRO_VALIDACAO', 'ERRO_CONEXAO', 'ERRO_AUTENTICACAO', 'AGUARDANDO_RETRY', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoEquipe" AS ENUM ('eAP', 'eSF', 'eAB', 'NASF', 'eCR', 'eAD');

-- CreateEnum
CREATE TYPE "StatusFila" AS ENUM ('AGUARDANDO', 'EM_CLASSIFICACAO_RISCO', 'AGUARDANDO_ATENDIMENTO', 'EM_ACOLHIMENTO', 'RESOLVIDO_ACOLHIMENTO', 'EM_ESCUTA_INICIAL', 'EM_TRIAGEM', 'AGUARDANDO_MEDICO', 'EM_CONSULTA', 'EM_PROCEDIMENTO', 'EM_VACINACAO', 'FINALIZADO', 'ENCAMINHADO_EXTERNO', 'INTERNADO', 'NAO_AGUARDOU', 'RETORNOU', 'TRANSFERIDO');

-- CreateEnum
CREATE TYPE "PrioridadeFila" AS ENUM ('NORMAL', 'URGENTE', 'MUITO_URGENTE', 'EMERGENCIA');

-- CreateEnum
CREATE TYPE "RiscoEsperado" AS ENUM ('EMERGENCIA', 'MUITO_URGENTE', 'URGENTE', 'POUCO_URGENTE', 'NAO_URGENTE');

-- CreateEnum
CREATE TYPE "VulnerabilidadeSocial" AS ENUM ('ALTA', 'MEDIA', 'BAIXA');

-- CreateEnum
CREATE TYPE "CondutaEscutaInicial" AS ENUM ('RESOLVIDO_NA_ESCUTA', 'ENCAMINHADO_ATENDIMENTO_DIA', 'PROCEDIMENTO_UBS', 'AGENDAMENTO_CONSULTA', 'ENCAMINHAMENTO_EXTERNO');

-- CreateEnum
CREATE TYPE "MomentoGlicemia" AS ENUM ('JEJUM', 'POS_PRANDIAL', 'ALEATORIA');

-- CreateEnum
CREATE TYPE "ClassificacaoManchester" AS ENUM ('EMERGENCIA', 'MUITO_URGENTE', 'URGENTE', 'POUCO_URGENTE', 'NAO_URGENTE');

-- CreateEnum
CREATE TYPE "TipoAtividadeColetiva" AS ENUM ('GRUPO_HIPERTENSOS', 'GRUPO_DIABETICOS', 'GRUPO_GESTANTES', 'GRUPO_IDOSOS', 'GRUPO_CRIANCAS', 'GRUPO_SAUDE_MENTAL', 'EDUCACAO_SAUDE', 'PRATICAS_CORPORAIS', 'PLANEJAMENTO_FAMILIAR', 'GRUPO_TABAGISMO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusAtividade" AS ENUM ('PLANEJADA', 'REALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TurnoAgenda" AS ENUM ('MANHA', 'TARDE', 'NOITE');

-- CreateEnum
CREATE TYPE "TipoIndisponibilidadeProfissional" AS ENUM ('FERIAS', 'LICENCA', 'ATESTADO', 'TREINAMENTO', 'REUNIAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "FaceRecognitionIdentityStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVIEW', 'BLOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "FaceEnrollmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FaceDeviceType" AS ENUM ('CAMERA', 'GATEWAY', 'NVR');

-- CreateEnum
CREATE TYPE "FaceDeviceHealthStatus" AS ENUM ('ONLINE', 'OFFLINE', 'DEGRADED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "FaceZoneDirection" AS ENUM ('ENTRY', 'EXIT', 'BOTH');

-- CreateEnum
CREATE TYPE "FaceEventType" AS ENUM ('DETECTION', 'ENTRY', 'EXIT', 'UNMATCHED', 'REVIEW');

-- CreateEnum
CREATE TYPE "FaceMatchStatus" AS ENUM ('MATCHED', 'REVIEW_REQUIRED', 'UNMATCHED');

-- CreateEnum
CREATE TYPE "GuardianNotificationStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'SENT', 'FAILED');

-- AlterEnum (AJUSTADO manualmente): o rewrite gerado pelo diff referenciava
-- fila_atendimento antes de sua criação nesta própria migration. Encolher o
-- enum é desnecessário — manter o superset (valores legados EMERGENCIA..
-- NAO_URGENTE + cores Manchester) é inofensivo: o Prisma Client usa apenas os
-- valores do schema.prisma.

-- AlterEnum
ALTER TYPE "StatusProfissionalSaude" ADD VALUE 'APOSENTADO';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoAtendimento" ADD VALUE 'RENOVACAO_RECEITA';
ALTER TYPE "TipoAtendimento" ADD VALUE 'VACINACAO';
ALTER TYPE "TipoAtendimento" ADD VALUE 'PROCEDIMENTO';

-- DropForeignKey
ALTER TABLE "citizen_categories" DROP CONSTRAINT "fk_category_parent";

-- DropForeignKey
ALTER TABLE "citizen_category_audit_log" DROP CONSTRAINT "fk_audit_log_assignment";

-- DropForeignKey
ALTER TABLE "citizen_category_audit_log" DROP CONSTRAINT "fk_audit_log_category";

-- DropForeignKey
ALTER TABLE "citizen_category_audit_log" DROP CONSTRAINT "fk_audit_log_citizen";

-- DropForeignKey
ALTER TABLE "citizen_category_badges" DROP CONSTRAINT "fk_badge_category";

-- DropForeignKey
ALTER TABLE "citizen_category_protocol_history" DROP CONSTRAINT "fk_protocol_history_assignment";

-- DropForeignKey
ALTER TABLE "citizen_category_protocol_history" DROP CONSTRAINT "fk_protocol_history_category";

-- DropForeignKey
ALTER TABLE "citizen_category_protocol_history" DROP CONSTRAINT "fk_protocol_history_citizen";

-- DropForeignKey
ALTER TABLE "citizen_category_protocol_history" DROP CONSTRAINT "fk_protocol_history_protocol";

-- DropForeignKey
ALTER TABLE "citizen_category_relationships" DROP CONSTRAINT "fk_relationship_source";

-- DropForeignKey
ALTER TABLE "citizen_category_relationships" DROP CONSTRAINT "fk_relationship_target";

-- DropForeignKey
ALTER TABLE "triagem_enfermagem" DROP CONSTRAINT "triagem_enfermagem_atendimentoId_fkey";

-- DropIndex
DROP INDEX "idx_citizen_categories_trigger_services";

-- DropIndex
DROP INDEX "conversations_activeFlowExecutionId_idx";

-- DropIndex
DROP INDEX "messages_botFlowNodeId_idx";

-- DropIndex
DROP INDEX "messages_botInteractionType_idx";

-- DropIndex
DROP INDEX "messages_botSelectedOption_idx";

-- DropIndex
DROP INDEX "messages_isBotMessage_idx";

-- DropIndex
DROP INDEX "services_simplified_serviceSubtype_idx";

-- DropIndex
DROP INDEX "unidades_saude_fluxoAtendimento_idx";

-- AlterTable
ALTER TABLE "agendas_medicas" ADD COLUMN     "dataFim" TIMESTAMP(3),
ADD COLUMN     "dataInicio" TIMESTAMP(3),
ADD COLUMN     "especialidadeId" TEXT,
ADD COLUMN     "salaId" TEXT,
ADD COLUMN     "turnoId" TEXT;

-- AlterTable
ALTER TABLE "atendimentos_medicos" ADD COLUMN     "filaAtendimentoId" TEXT,
ADD COLUMN     "triagemEnfermagemId" TEXT;

-- AlterTable
ALTER TABLE "citizen_categories" ALTER COLUMN "level" SET NOT NULL,
ALTER COLUMN "hasValidity" SET NOT NULL,
ALTER COLUMN "requiresRenewal" SET NOT NULL,
ALTER COLUMN "renewalReminderDays" SET NOT NULL,
ALTER COLUMN "autoDeactivateOnExpiry" SET NOT NULL,
ALTER COLUMN "hasProgression" SET NOT NULL,
ALTER COLUMN "categoryType" SET NOT NULL,
ALTER COLUMN "priority" SET NOT NULL,
ALTER COLUMN "isPublic" SET NOT NULL,
ALTER COLUMN "requiresApproval" SET NOT NULL;

-- AlterTable
ALTER TABLE "citizen_category_assignments" ALTER COLUMN "isExpired" SET NOT NULL,
ALTER COLUMN "renewalCount" SET NOT NULL,
ALTER COLUMN "level" SET NOT NULL,
ALTER COLUMN "experiencePoints" SET NOT NULL,
ALTER COLUMN "badges" SET NOT NULL,
ALTER COLUMN "achievements" SET NOT NULL,
ALTER COLUMN "protocolCount" SET NOT NULL,
ALTER COLUMN "statistics" SET NOT NULL,
ALTER COLUMN "activationCount" SET NOT NULL,
ALTER COLUMN "deactivationCount" SET NOT NULL;

-- AlterTable
ALTER TABLE "citizen_category_audit_log" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "citizen_category_badges" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "isPublic" SET NOT NULL,
ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "priority" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "citizen_category_protocol_history" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "citizen_category_relationships" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "isRequired" SET NOT NULL,
ALTER COLUMN "autoAssign" SET NOT NULL,
ALTER COLUMN "weight" SET NOT NULL,
ALTER COLUMN "active" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "citizen_documents" ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sourceDocumentId" TEXT,
ADD COLUMN     "sourceType" TEXT,
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- AlterTable
ALTER TABLE "citizens" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "equipeId" TEXT,
ADD COLUMN     "microareaId" TEXT;

-- AlterTable
ALTER TABLE "consultas_agendadas" ADD COLUMN     "filaAtendimentoId" TEXT;

-- AlterTable
ALTER TABLE "consultas_medicas" DROP COLUMN "antecedentesPessoais",
DROP COLUMN "conduta",
DROP COLUMN "diagnosticos",
DROP COLUMN "exameFisico",
DROP COLUMN "historiaDoenca",
DROP COLUMN "historicoFamiliar",
DROP COLUMN "queixaPrincipal",
ADD COLUMN     "antropometria" JSONB,
ADD COLUMN     "condutaTerapeutica" TEXT,
ADD COLUMN     "dataRetorno" TIMESTAMP(3),
ADD COLUMN     "diagnosticoPrincipal" TEXT,
ADD COLUMN     "diagnosticosSecund" JSONB,
ADD COLUMN     "exameFisicoGeral" TEXT,
ADD COLUMN     "exameFisicoSistemas" JSONB,
ADD COLUMN     "historiaAtual" TEXT,
ADD COLUMN     "historiaFamiliar" TEXT,
ADD COLUMN     "historiaPregressa" TEXT,
ADD COLUMN     "historiaSocial" TEXT,
ADD COLUMN     "motivoConsulta" TEXT,
ADD COLUMN     "sinaisVitais" JSONB;

-- AlterTable
ALTER TABLE "especialidades_medicas" ADD COLUMN     "cor" TEXT;

-- AlterTable
ALTER TABLE "family_compositions" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "userId" TEXT,
ALTER COLUMN "citizenId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "solicitacoes_tfd" ADD COLUMN     "especialidadeId" TEXT;

-- AlterTable
ALTER TABLE "unidades_cras" ADD COLUMN     "organizationalUnitId" TEXT;

-- AlterTable
ALTER TABLE "unidades_educacao" ADD COLUMN     "organizationalUnitId" TEXT;

-- AlterTable
ALTER TABLE "unidades_saude" ADD COLUMN     "cep" TEXT,
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "cnes" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "horarioAbertura" TEXT,
ADD COLUMN     "horarioFechamento" TEXT;

-- AlterTable
ALTER TABLE "viagens_tfd" DROP COLUMN "passageiros";

-- DropTable
DROP TABLE "profissionais_saude";

-- DropTable
DROP TABLE "triagem_enfermagem";

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "citizenId" TEXT,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "citizenId" TEXT,
    "webEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "dailyDigest" BOOLEAN NOT NULL DEFAULT false,
    "dailyDigestTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT,
    "userId" TEXT,
    "citizenId" TEXT,
    "type" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problemas_condicoes" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "tipo" "TipoClassificacao" NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" "StatusProblema" NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataResolucao" TIMESTAMP(3),
    "gravidade" "GravidadeProblema",
    "prioridade" INTEGER NOT NULL DEFAULT 0,
    "consultaOrigemId" TEXT,
    "consultaResolucaoId" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "problemas_condicoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alergias_reacoes" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "tipo" "TipoAlergia" NOT NULL,
    "substancia" TEXT NOT NULL,
    "reacao" TEXT NOT NULL,
    "gravidade" "GravidadeAlergia" NOT NULL,
    "dataIdentificacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "registradoPor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alergias_reacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atendimentos_odontologicos" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "dentistaId" TEXT NOT NULL,
    "odontograma" JSONB NOT NULL,
    "queixaPrincipal" TEXT,
    "exameBucal" TEXT,
    "indicesCPOD" JSONB,
    "diagnostico" TEXT,
    "planoTratamento" TEXT,
    "orientacoes" TEXT,
    "observacoes" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "atendimentos_odontologicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procedimentos_odonto" (
    "id" TEXT NOT NULL,
    "atendimentoOdontoId" TEXT NOT NULL,
    "codigoSIGTAP" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dente" TEXT,
    "face" TEXT,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "observacoes" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "procedimentos_odonto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acompanhamento_pre_natal" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "dum" TIMESTAMP(3) NOT NULL,
    "dpp" TIMESTAMP(3) NOT NULL,
    "idadeGestacional" TEXT,
    "gravidez" INTEGER NOT NULL DEFAULT 1,
    "partos" INTEGER NOT NULL DEFAULT 0,
    "abortos" INTEGER NOT NULL DEFAULT 0,
    "cesarianas" INTEGER NOT NULL DEFAULT 0,
    "nascidosVivos" INTEGER NOT NULL DEFAULT 0,
    "nascidosMortos" INTEGER NOT NULL DEFAULT 0,
    "riscoGestacional" "RiscoGestacional" NOT NULL DEFAULT 'HABITUAL',
    "fatoresRisco" JSONB,
    "status" "StatusPreNatal" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "grupoSanguineo" TEXT,
    "fatorRh" TEXT,
    "pesoInicial" DOUBLE PRECISION,
    "alturaInicial" DOUBLE PRECISION,
    "imcInicial" DOUBLE PRECISION,
    "tipoDesfecho" "TipoDesfecho",
    "dataDesfecho" TIMESTAMP(3),
    "observacoesDesfecho" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acompanhamento_pre_natal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consultas_pre_natal" (
    "id" TEXT NOT NULL,
    "preNatalId" TEXT NOT NULL,
    "consultaMedicaId" TEXT,
    "idadeGestacional" TEXT NOT NULL,
    "peso" DOUBLE PRECISION,
    "pressaoArterial" TEXT,
    "alturaUterina" INTEGER,
    "bcf" INTEGER,
    "movimentosFetais" BOOLEAN,
    "edema" TEXT,
    "apresentacaoFetal" TEXT,
    "queixas" TEXT,
    "orientacoes" TEXT,
    "conduta" TEXT,
    "proximaConsulta" TIMESTAMP(3),
    "dataConsulta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profissionalId" TEXT NOT NULL,

    CONSTRAINT "consultas_pre_natal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exames_pre_natal" (
    "id" TEXT NOT NULL,
    "preNatalId" TEXT NOT NULL,
    "tipoExame" "TipoExamePreNatal" NOT NULL,
    "dataRealizacao" TIMESTAMP(3),
    "dataSolicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resultado" TEXT,
    "observacoes" TEXT,
    "anexoUrl" TEXT,

    CONSTRAINT "exames_pre_natal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas_domiciliares" (
    "id" TEXT NOT NULL,
    "acsId" TEXT NOT NULL,
    "citizenId" TEXT,
    "domicilioId" TEXT,
    "dataVisita" TIMESTAMP(3) NOT NULL,
    "turno" "TurnoVisita",
    "tipoVisita" "TipoVisita" NOT NULL,
    "motivoVisita" TEXT NOT NULL,
    "atividadesRealizadas" JSONB NOT NULL,
    "acompanhamentosRealizados" JSONB,
    "encaminhamentoUBS" BOOLEAN NOT NULL DEFAULT false,
    "motivoEncaminhamento" TEXT,
    "desfecho" TEXT,
    "observacoes" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visitas_domiciliares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_certificates" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "citizenId" TEXT,
    "certificateType" "CertificateType" NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "commonName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization" TEXT NOT NULL DEFAULT 'Prefeitura Municipal',
    "department" TEXT,
    "publicKey" TEXT NOT NULL,
    "privateKeyHash" TEXT NOT NULL,
    "encryptedPrivateKey" TEXT NOT NULL,
    "keySize" INTEGER NOT NULL DEFAULT 2048,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" "RevocationReason",
    "status" "CertStatus" NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "issuerCA" TEXT NOT NULL DEFAULT 'CA-MUNICIPAL-001',
    "certificateChain" TEXT NOT NULL,
    "thumbprint" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "signatures" (
    "id" TEXT NOT NULL,
    "documentId" TEXT,
    "externalDocumentId" TEXT,
    "certificateId" TEXT NOT NULL,
    "signatureValue" TEXT NOT NULL,
    "signatureHash" TEXT NOT NULL,
    "signatureAlgo" TEXT NOT NULL DEFAULT 'SHA256withRSA',
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "geolocation" JSONB,
    "visualPosition" JSONB,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "validatedAt" TIMESTAMP(3),
    "validationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_revocation_list" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "certificateId" TEXT,
    "reason" "RevocationReason" NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedBy" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "comments" TEXT,

    CONSTRAINT "certificate_revocation_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "commonName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "certificateType" "CertificateType" NOT NULL,
    "keySize" INTEGER NOT NULL DEFAULT 2048,
    "status" "CertificateRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestReason" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComments" TEXT,
    "certificateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_conversations" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "intent" TEXT,
    "confidence" DOUBLE PRECISION,
    "currentFlow" TEXT,
    "flowStep" INTEGER NOT NULL DEFAULT 0,
    "flowData" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "closedAt" TIMESTAMP(3),
    "rating" INTEGER,
    "ratingComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "metadata" JSONB,
    "intent" TEXT,
    "confidence" DOUBLE PRECISION,
    "wasTransferred" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bot_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_analytics" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "intent" TEXT NOT NULL,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "transferCount" INTEGER NOT NULL DEFAULT 0,
    "avgConfidence" DOUBLE PRECISION,
    "avgResponseTime" DOUBLE PRECISION,
    "uniqueCitizens" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bot_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proactive_notifications" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proactive_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_uploads" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "conversationId" TEXT,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "bot_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flow_definitions" (
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
CREATE TABLE "flow_executions" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "flowId" TEXT NOT NULL,
    "conversationId" TEXT,
    "currentNodeId" TEXT NOT NULL,
    "state" JSONB NOT NULL,
    "history" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "pausedBy" TEXT,
    "pausedAt" TIMESTAMP(3),
    "pauseReason" TEXT,
    "resumedAt" TIMESTAMP(3),
    "resumedBy" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "flow_executions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chamada_painel" (
    "id" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "filaId" TEXT NOT NULL,
    "consultorio" TEXT NOT NULL,
    "nomePaciente" TEXT NOT NULL,
    "mensagem" TEXT,
    "exibidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chamada_painel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indisponibilidade_agenda" (
    "id" TEXT NOT NULL,
    "agendaId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT NOT NULL,
    "tipoIndisponibilidade" "TipoIndisponibilidade" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "indisponibilidade_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alergias_cidadao" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "alergia" TEXT NOT NULL,
    "gravidade" "GravidadeAlergia" NOT NULL,
    "observacoes" TEXT,
    "dataRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioRegistro" TEXT NOT NULL,

    CONSTRAINT "alergias_cidadao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comorbidades_cidadao" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "cid10" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "dataRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioRegistro" TEXT NOT NULL,

    CONSTRAINT "comorbidades_cidadao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexo_prontuario" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "atendimentoId" TEXT,
    "tipoDocumento" "TipoDocumentoAnexo" NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "descricao" TEXT,
    "dataUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioUpload" TEXT NOT NULL,

    CONSTRAINT "anexo_prontuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imunizacao_cidadao" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "vacina" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "lote" TEXT,
    "dataAplicacao" TIMESTAMP(3) NOT NULL,
    "unidadeId" TEXT,
    "profissionalId" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "imunizacao_cidadao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lote_medicamento" (
    "id" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "lote" TEXT NOT NULL,
    "dataFabricacao" TIMESTAMP(3) NOT NULL,
    "dataValidade" TIMESTAMP(3) NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "fornecedor" TEXT,
    "notaFiscal" TEXT,
    "dataEntrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioRegistro" TEXT NOT NULL,

    CONSTRAINT "lote_medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencia_estoque" (
    "id" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "unidadeOrigemId" TEXT NOT NULL,
    "unidadeDestinoId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "motivo" TEXT,
    "status" "StatusTransferencia" NOT NULL DEFAULT 'PENDENTE',
    "dataSolicitacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataConfirmacao" TIMESTAMP(3),
    "usuarioSolicitante" TEXT NOT NULL,
    "usuarioConfirmante" TEXT,

    CONSTRAINT "transferencia_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerta_estoque" (
    "id" TEXT NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "tipoAlerta" "TipoAlertaEstoque" NOT NULL,
    "mensagem" TEXT NOT NULL,
    "quantidadeAtual" INTEGER NOT NULL,
    "quantidadeMinima" INTEGER,
    "dataVencimento" TIMESTAMP(3),
    "visualizado" BOOLEAN NOT NULL DEFAULT false,
    "dataGeracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerta_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento_tfd" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumentoTFD" NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "dataUpload" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioUpload" TEXT NOT NULL,

    CONSTRAINT "documento_tfd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parecer_regulacao_tfd" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "medicoReguladorId" TEXT NOT NULL,
    "parecer" TEXT NOT NULL,
    "status" "StatusParecer" NOT NULL,
    "observacoes" TEXT,
    "dataParecer" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parecer_regulacao_tfd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aprovacao_gestao_tfd" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "gestorId" TEXT NOT NULL,
    "decisao" "DecisaoGestao" NOT NULL,
    "justificativa" TEXT,
    "recursosAprovados" JSONB,
    "dataAprovacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aprovacao_gestao_tfd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamento_externo_tfd" (
    "id" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "hospitalDestino" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "dataHoraConsulta" TIMESTAMP(3) NOT NULL,
    "endereco" TEXT,
    "telefoneContato" TEXT,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "dataAgendamento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioAgendamento" TEXT NOT NULL,

    CONSTRAINT "agendamento_externo_tfd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passageiro_viagem_tfd" (
    "id" TEXT NOT NULL,
    "viagemId" TEXT NOT NULL,
    "solicitacaoId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "acompanhante" BOOLEAN NOT NULL DEFAULT false,
    "nomeAcompanhante" TEXT,
    "cpfAcompanhante" TEXT,
    "statusEmbarque" "StatusEmbarque" NOT NULL DEFAULT 'AGUARDANDO',
    "observacoes" TEXT,

    CONSTRAINT "passageiro_viagem_tfd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestacao_contas_tfd" (
    "id" TEXT NOT NULL,
    "viagemId" TEXT NOT NULL,
    "combustivelLitros" DOUBLE PRECISION NOT NULL,
    "combustivelValor" DOUBLE PRECISION NOT NULL,
    "pedagioQuantidade" INTEGER NOT NULL,
    "pedagioValor" DOUBLE PRECISION NOT NULL,
    "alimentacaoValor" DOUBLE PRECISION,
    "hospedagemDiarias" INTEGER,
    "hospedagemValor" DOUBLE PRECISION,
    "outrosCustos" JSONB,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "comprovantesAnexados" JSONB,
    "status" "StatusPrestacao" NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "dataPrestacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioPrestacao" TEXT NOT NULL,
    "dataAprovacao" TIMESTAMP(3),
    "usuarioAprovacao" TEXT,

    CONSTRAINT "prestacao_contas_tfd_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salas_consultorios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "numero" TEXT,
    "tipo" "TipoSala" NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "andar" TEXT,
    "capacidade" INTEGER,
    "equipamentos" JSONB,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salas_consultorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos_trabalho" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "diasSemana" JSONB,
    "cor" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnos_trabalho_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_atendimento" (
    "id" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "prefixoSenha" TEXT NOT NULL DEFAULT 'A',
    "reiniciarSenhaDiariamente" BOOLEAN NOT NULL DEFAULT true,
    "senhaInicial" INTEGER NOT NULL DEFAULT 1,
    "horaAberturaAtendimento" TEXT NOT NULL DEFAULT '07:00',
    "horaFechamentoAtendimento" TEXT NOT NULL DEFAULT '17:00',
    "diasFuncionamento" JSONB,
    "triagemObrigatoria" BOOLEAN NOT NULL DEFAULT true,
    "tempoMedioTriagem" INTEGER NOT NULL DEFAULT 10,
    "permitirAgendamento" BOOLEAN NOT NULL DEFAULT true,
    "limiteAgendamentoDias" INTEGER NOT NULL DEFAULT 30,
    "permitirCancelamento" BOOLEAN NOT NULL DEFAULT true,
    "limiteCancelamentoHoras" INTEGER NOT NULL DEFAULT 24,
    "tempoMedioConsulta" INTEGER NOT NULL DEFAULT 30,
    "permitirEncaixe" BOOLEAN NOT NULL DEFAULT true,
    "limiteEncaixesDia" INTEGER NOT NULL DEFAULT 5,
    "enviarSMSLembrete" BOOLEAN NOT NULL DEFAULT false,
    "horasAntesLembrete" INTEGER NOT NULL DEFAULT 24,
    "enviarEmailConfirmacao" BOOLEAN NOT NULL DEFAULT false,
    "priorizarIdosos" BOOLEAN NOT NULL DEFAULT true,
    "priorizarGestantes" BOOLEAN NOT NULL DEFAULT true,
    "priorizarDeficientes" BOOLEAN NOT NULL DEFAULT true,
    "idadeMinimaPrioridade" INTEGER NOT NULL DEFAULT 60,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_esus" (
    "id" TEXT NOT NULL,
    "municipioId" TEXT NOT NULL,
    "integracaoAtiva" BOOLEAN NOT NULL DEFAULT false,
    "tipoIntegracao" "TipoIntegracaoESUS" NOT NULL DEFAULT 'NENHUMA',
    "urlPEC" TEXT,
    "usuarioAPI" TEXT,
    "senhaAPI" TEXT,
    "formatoLEDI" "FormatoLEDI",
    "versaoLEDI" TEXT,
    "diretorioExportacao" TEXT,
    "cnesUnidadePrincipal" TEXT,
    "mapeamentoUnidades" JSONB,
    "mapeamentoProfissionais" JSONB,
    "sincronizacaoAutomatica" BOOLEAN NOT NULL DEFAULT false,
    "intervaloSincMinutos" INTEGER NOT NULL DEFAULT 60,
    "ultimaSincronizacao" TIMESTAMP(3),
    "proximaSincronizacao" TIMESTAMP(3),
    "logTransmissoes" BOOLEAN NOT NULL DEFAULT true,
    "retentarEnviosFalhos" BOOLEAN NOT NULL DEFAULT true,
    "maxTentativas" INTEGER NOT NULL DEFAULT 3,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "configuracoes_esus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transmissoes_esus" (
    "id" TEXT NOT NULL,
    "configuracaoId" TEXT NOT NULL,
    "tipo" "TipoFichaESUS" NOT NULL,
    "formato" "FormatoLEDI",
    "fichaId" TEXT NOT NULL,
    "entidadeOrigem" TEXT,
    "nomeArquivo" TEXT,
    "payloadJSON" JSONB,
    "conteudoLEDI" TEXT,
    "status" "StatusTransmissao" NOT NULL DEFAULT 'PENDENTE',
    "dataEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataConfirmacao" TIMESTAMP(3),
    "codigoResposta" INTEGER,
    "mensagemResposta" TEXT,
    "erros" JSONB,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "proximaTentativa" TIMESTAMP(3),
    "ultimaFalha" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transmissoes_esus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipes_saude" (
    "id" TEXT NOT NULL,
    "ine" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoEquipe" NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "teamId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "equipes_saude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profissionais_equipes" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "cbo" TEXT NOT NULL,
    "funcao" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profissionais_equipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "microareas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "descricao" TEXT,
    "equipeId" TEXT NOT NULL,
    "acsId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "microareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fila_atendimento" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "equipeId" TEXT,
    "tipoAtendimento" "TipoAtendimento" NOT NULL,
    "motivoBusca" TEXT NOT NULL,
    "status" "StatusFila" NOT NULL DEFAULT 'AGUARDANDO',
    "prioridade" "PrioridadeFila" NOT NULL DEFAULT 'NORMAL',
    "classificacaoRisco" "ClassificacaoRisco",
    "dataClassificacaoRisco" TIMESTAMP(3),
    "queixaPrincipal" TEXT,
    "sinaisVitais" JSONB,
    "condutaAcolhimento" "CondutaAcolhimento",
    "dataAcolhimento" TIMESTAMP(3),
    "resolvidoAcolhimento" BOOLEAN NOT NULL DEFAULT false,
    "dataHoraChegada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataHoraInicio" TIMESTAMP(3),
    "dataHoraFim" TIMESTAMP(3),
    "vacinacao" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "unidadeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "fila_atendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escutas_iniciais" (
    "id" TEXT NOT NULL,
    "filaAtendimentoId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "equipeId" TEXT,
    "motivoBusca" TEXT NOT NULL,
    "historiaBreve" TEXT,
    "tempoEvolucao" TEXT,
    "tentativasAnteriores" TEXT,
    "pressaoArterial" TEXT,
    "temperatura" DOUBLE PRECISION,
    "frequenciaCardiaca" INTEGER,
    "observacoesVisuais" TEXT,
    "riscoEsperado" "RiscoEsperado" NOT NULL,
    "vulnerabilidadeSocial" "VulnerabilidadeSocial" NOT NULL,
    "condutaDefinida" "CondutaEscutaInicial" NOT NULL,
    "profissionalEncaminhadoId" TEXT,
    "dataAgendamento" TIMESTAMP(3),
    "orientacoes" TEXT,
    "unidadeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escutas_iniciais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "triagens_enfermagem" (
    "id" TEXT NOT NULL,
    "filaAtendimentoId" TEXT NOT NULL,
    "enfermeiroId" TEXT NOT NULL,
    "pressaoArterial" TEXT,
    "temperatura" DOUBLE PRECISION,
    "frequenciaCardiaca" INTEGER,
    "frequenciaRespiratoria" INTEGER,
    "saturacaoO2" DOUBLE PRECISION,
    "dor" INTEGER,
    "peso" DOUBLE PRECISION,
    "altura" DOUBLE PRECISION,
    "imc" DOUBLE PRECISION,
    "perimetroCefalico" DOUBLE PRECISION,
    "circunferenciaAbdominal" DOUBLE PRECISION,
    "glicemiaCapilar" DOUBLE PRECISION,
    "momentoGlicemia" "MomentoGlicemia",
    "queixaPrincipal" TEXT NOT NULL,
    "historiaDoencaAtual" TEXT,
    "alergiasConhecidas" TEXT,
    "medicamentosUso" TEXT,
    "comorbidades" TEXT,
    "classificacaoRisco" "ClassificacaoManchester" NOT NULL,
    "discriminadorUtilizado" TEXT,
    "profissionalEncaminhadoId" TEXT,
    "observacoes" TEXT,
    "unidadeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "triagens_enfermagem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atividades_coletivas" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAtividadeColetiva" NOT NULL,
    "tema" TEXT NOT NULL,
    "descricao" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "duracao" INTEGER,
    "local" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "publicoAlvo" TEXT,
    "faixaEtariaInicio" INTEGER,
    "faixaEtariaFim" INTEGER,
    "numeroParticipantes" INTEGER NOT NULL DEFAULT 0,
    "praticasSaude" TEXT[],
    "status" "StatusAtividade" NOT NULL DEFAULT 'PLANEJADA',
    "avaliacoesRealizadas" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "atividades_coletivas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profissionais_atividades" (
    "id" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "funcao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profissionais_atividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participantes_atividades" (
    "id" TEXT NOT NULL,
    "atividadeId" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "pressaoArterial" TEXT,
    "glicemia" DOUBLE PRECISION,
    "peso" DOUBLE PRECISION,
    "avaliacaoAlterada" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "participantes_atividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_agenda" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "turno" "TurnoAgenda" NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "duracaoConsulta" INTEGER NOT NULL DEFAULT 20,
    "tiposAceitos" "TipoAtendimento"[],
    "vagasTotais" INTEGER NOT NULL,
    "vagasDisponiveis" INTEGER,
    "permiteOnline" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indisponibilidades_profissionais" (
    "id" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "tipo" "TipoIndisponibilidadeProfissional" NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indisponibilidades_profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_recognition_identities" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "citizenId" TEXT,
    "label" TEXT,
    "status" "FaceRecognitionIdentityStatus" NOT NULL DEFAULT 'PENDING',
    "riskFlags" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "face_recognition_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_enrollments" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceLabel" TEXT,
    "imagePath" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "livenessScore" DOUBLE PRECISION,
    "status" "FaceEnrollmentStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "face_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_embeddings" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "modelName" TEXT NOT NULL,
    "modelVersion" TEXT,
    "vector" DOUBLE PRECISION[],
    "qualityScore" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "face_embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_devices" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unidadeEducacaoId" TEXT,
    "type" "FaceDeviceType" NOT NULL DEFAULT 'CAMERA',
    "protocol" TEXT DEFAULT 'RTSP',
    "manufacturer" TEXT,
    "model" TEXT,
    "locationDescription" TEXT,
    "streamUrlEncrypted" TEXT,
    "usernameEncrypted" TEXT,
    "passwordEncrypted" TEXT,
    "healthStatus" "FaceDeviceHealthStatus" NOT NULL DEFAULT 'OFFLINE',
    "lastHeartbeatAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "face_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_zones" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "unidadeEducacaoId" TEXT,
    "name" TEXT NOT NULL,
    "gateName" TEXT,
    "direction" "FaceZoneDirection" NOT NULL DEFAULT 'BOTH',
    "dedupeWindowSecs" INTEGER NOT NULL DEFAULT 180,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "face_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "face_recognition_events" (
    "id" TEXT NOT NULL,
    "identityId" TEXT,
    "deviceId" TEXT NOT NULL,
    "zoneId" TEXT,
    "unidadeEducacaoId" TEXT,
    "studentCitizenId" TEXT,
    "guardianCitizenId" TEXT,
    "type" "FaceEventType" NOT NULL,
    "matchStatus" "FaceMatchStatus" NOT NULL,
    "confidence" DOUBLE PRECISION,
    "provider" TEXT,
    "modelName" TEXT,
    "modelVersion" TEXT,
    "previewPath" TEXT,
    "boundingBox" JSONB,
    "metadata" JSONB,
    "dedupeKey" TEXT,
    "reviewReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notificationStatus" "GuardianNotificationStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "notificationAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastNotificationError" TEXT,
    "recognizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "face_recognition_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_security_configurations" (
    "id" TEXT NOT NULL,
    "unidadeEducacaoId" TEXT NOT NULL,
    "notifyOnEntry" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnExit" BOOLEAN NOT NULL DEFAULT true,
    "preferredChannel" TEXT NOT NULL DEFAULT 'whatsapp',
    "dedupeWindowSecs" INTEGER NOT NULL DEFAULT 180,
    "entryMessageTemplate" TEXT,
    "exitMessageTemplate" TEXT,
    "activeHoursStart" TEXT,
    "activeHoursEnd" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_security_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ConsultaMedicaToProblemaCondicao" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ConsultaMedicaToProblemaCondicao_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

-- CreateIndex
CREATE INDEX "push_subscriptions_citizenId_idx" ON "push_subscriptions"("citizenId");

-- CreateIndex
CREATE INDEX "push_subscriptions_endpoint_idx" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_citizenId_key" ON "notification_preferences"("citizenId");

-- CreateIndex
CREATE INDEX "notification_preferences_userId_idx" ON "notification_preferences"("userId");

-- CreateIndex
CREATE INDEX "notification_preferences_citizenId_idx" ON "notification_preferences"("citizenId");

-- CreateIndex
CREATE INDEX "notification_logs_userId_idx" ON "notification_logs"("userId");

-- CreateIndex
CREATE INDEX "notification_logs_citizenId_idx" ON "notification_logs"("citizenId");

-- CreateIndex
CREATE INDEX "notification_logs_type_idx" ON "notification_logs"("type");

-- CreateIndex
CREATE INDEX "notification_logs_status_idx" ON "notification_logs"("status");

-- CreateIndex
CREATE INDEX "notification_logs_channel_idx" ON "notification_logs"("channel");

-- CreateIndex
CREATE INDEX "notification_logs_createdAt_idx" ON "notification_logs"("createdAt");

-- CreateIndex
CREATE INDEX "problemas_condicoes_citizenId_status_idx" ON "problemas_condicoes"("citizenId", "status");

-- CreateIndex
CREATE INDEX "problemas_condicoes_codigo_idx" ON "problemas_condicoes"("codigo");

-- CreateIndex
CREATE INDEX "problemas_condicoes_tipo_idx" ON "problemas_condicoes"("tipo");

-- CreateIndex
CREATE INDEX "alergias_reacoes_citizenId_ativo_idx" ON "alergias_reacoes"("citizenId", "ativo");

-- CreateIndex
CREATE INDEX "alergias_reacoes_tipo_idx" ON "alergias_reacoes"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "atendimentos_odontologicos_atendimentoId_key" ON "atendimentos_odontologicos"("atendimentoId");

-- CreateIndex
CREATE INDEX "procedimentos_odonto_atendimentoOdontoId_idx" ON "procedimentos_odonto"("atendimentoOdontoId");

-- CreateIndex
CREATE INDEX "procedimentos_odonto_codigoSIGTAP_idx" ON "procedimentos_odonto"("codigoSIGTAP");

-- CreateIndex
CREATE UNIQUE INDEX "acompanhamento_pre_natal_citizenId_key" ON "acompanhamento_pre_natal"("citizenId");

-- CreateIndex
CREATE INDEX "acompanhamento_pre_natal_status_idx" ON "acompanhamento_pre_natal"("status");

-- CreateIndex
CREATE INDEX "acompanhamento_pre_natal_riscoGestacional_idx" ON "acompanhamento_pre_natal"("riscoGestacional");

-- CreateIndex
CREATE UNIQUE INDEX "consultas_pre_natal_consultaMedicaId_key" ON "consultas_pre_natal"("consultaMedicaId");

-- CreateIndex
CREATE INDEX "consultas_pre_natal_preNatalId_idx" ON "consultas_pre_natal"("preNatalId");

-- CreateIndex
CREATE INDEX "exames_pre_natal_preNatalId_idx" ON "exames_pre_natal"("preNatalId");

-- CreateIndex
CREATE INDEX "exames_pre_natal_tipoExame_idx" ON "exames_pre_natal"("tipoExame");

-- CreateIndex
CREATE INDEX "visitas_domiciliares_acsId_dataVisita_idx" ON "visitas_domiciliares"("acsId", "dataVisita");

-- CreateIndex
CREATE INDEX "visitas_domiciliares_citizenId_idx" ON "visitas_domiciliares"("citizenId");

-- CreateIndex
CREATE INDEX "visitas_domiciliares_tipoVisita_idx" ON "visitas_domiciliares"("tipoVisita");

-- CreateIndex
CREATE UNIQUE INDEX "digital_certificates_serialNumber_key" ON "digital_certificates"("serialNumber");

-- CreateIndex
CREATE INDEX "digital_certificates_userId_idx" ON "digital_certificates"("userId");

-- CreateIndex
CREATE INDEX "digital_certificates_citizenId_idx" ON "digital_certificates"("citizenId");

-- CreateIndex
CREATE INDEX "digital_certificates_serialNumber_idx" ON "digital_certificates"("serialNumber");

-- CreateIndex
CREATE INDEX "digital_certificates_status_idx" ON "digital_certificates"("status");

-- CreateIndex
CREATE INDEX "digital_certificates_expiresAt_idx" ON "digital_certificates"("expiresAt");

-- CreateIndex
CREATE INDEX "digital_certificates_thumbprint_idx" ON "digital_certificates"("thumbprint");

-- CreateIndex
CREATE INDEX "signatures_documentId_idx" ON "signatures"("documentId");

-- CreateIndex
CREATE INDEX "signatures_externalDocumentId_idx" ON "signatures"("externalDocumentId");

-- CreateIndex
CREATE INDEX "signatures_certificateId_idx" ON "signatures"("certificateId");

-- CreateIndex
CREATE INDEX "signatures_signedAt_idx" ON "signatures"("signedAt");

-- CreateIndex
CREATE INDEX "signatures_isValid_idx" ON "signatures"("isValid");

-- CreateIndex
CREATE INDEX "certificate_revocation_list_serialNumber_idx" ON "certificate_revocation_list"("serialNumber");

-- CreateIndex
CREATE INDEX "certificate_revocation_list_revokedAt_idx" ON "certificate_revocation_list"("revokedAt");

-- CreateIndex
CREATE INDEX "certificate_revocation_list_publishedAt_idx" ON "certificate_revocation_list"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_requests_certificateId_key" ON "certificate_requests"("certificateId");

-- CreateIndex
CREATE INDEX "certificate_requests_userId_idx" ON "certificate_requests"("userId");

-- CreateIndex
CREATE INDEX "certificate_requests_status_idx" ON "certificate_requests"("status");

-- CreateIndex
CREATE INDEX "certificate_requests_requestedAt_idx" ON "certificate_requests"("requestedAt");

-- CreateIndex
CREATE INDEX "certificate_requests_reviewedBy_idx" ON "certificate_requests"("reviewedBy");

-- CreateIndex
CREATE INDEX "bot_conversations_citizenId_idx" ON "bot_conversations"("citizenId");

-- CreateIndex
CREATE INDEX "bot_conversations_currentFlow_idx" ON "bot_conversations"("currentFlow");

-- CreateIndex
CREATE INDEX "bot_conversations_isActive_idx" ON "bot_conversations"("isActive");

-- CreateIndex
CREATE INDEX "bot_conversations_createdAt_idx" ON "bot_conversations"("createdAt");

-- CreateIndex
CREATE INDEX "bot_messages_conversationId_idx" ON "bot_messages"("conversationId");

-- CreateIndex
CREATE INDEX "bot_messages_role_idx" ON "bot_messages"("role");

-- CreateIndex
CREATE INDEX "bot_messages_intent_idx" ON "bot_messages"("intent");

-- CreateIndex
CREATE INDEX "bot_messages_createdAt_idx" ON "bot_messages"("createdAt");

-- CreateIndex
CREATE INDEX "bot_analytics_date_idx" ON "bot_analytics"("date");

-- CreateIndex
CREATE INDEX "bot_analytics_intent_idx" ON "bot_analytics"("intent");

-- CreateIndex
CREATE UNIQUE INDEX "bot_analytics_date_intent_key" ON "bot_analytics"("date", "intent");

-- CreateIndex
CREATE INDEX "proactive_notifications_citizenId_idx" ON "proactive_notifications"("citizenId");

-- CreateIndex
CREATE INDEX "proactive_notifications_type_idx" ON "proactive_notifications"("type");

-- CreateIndex
CREATE INDEX "proactive_notifications_scheduledFor_idx" ON "proactive_notifications"("scheduledFor");

-- CreateIndex
CREATE INDEX "proactive_notifications_sentAt_idx" ON "proactive_notifications"("sentAt");

-- CreateIndex
CREATE INDEX "bot_uploads_citizenId_idx" ON "bot_uploads"("citizenId");

-- CreateIndex
CREATE INDEX "bot_uploads_conversationId_idx" ON "bot_uploads"("conversationId");

-- CreateIndex
CREATE INDEX "bot_uploads_uploadedAt_idx" ON "bot_uploads"("uploadedAt");

-- CreateIndex
CREATE UNIQUE INDEX "flow_definitions_name_key" ON "flow_definitions"("name");

-- CreateIndex
CREATE INDEX "flow_definitions_municipioId_idx" ON "flow_definitions"("municipioId");

-- CreateIndex
CREATE INDEX "flow_definitions_isActive_idx" ON "flow_definitions"("isActive");

-- CreateIndex
CREATE INDEX "flow_definitions_isDefault_idx" ON "flow_definitions"("isDefault");

-- CreateIndex
CREATE INDEX "flow_executions_citizenId_idx" ON "flow_executions"("citizenId");

-- CreateIndex
CREATE INDEX "flow_executions_flowId_idx" ON "flow_executions"("flowId");

-- CreateIndex
CREATE INDEX "flow_executions_conversationId_idx" ON "flow_executions"("conversationId");

-- CreateIndex
CREATE INDEX "flow_executions_status_idx" ON "flow_executions"("status");

-- CreateIndex
CREATE INDEX "flow_executions_startedAt_idx" ON "flow_executions"("startedAt");

-- CreateIndex
CREATE INDEX "chamada_painel_unidadeId_idx" ON "chamada_painel"("unidadeId");

-- CreateIndex
CREATE INDEX "chamada_painel_exibidoEm_idx" ON "chamada_painel"("exibidoEm");

-- CreateIndex
CREATE INDEX "indisponibilidade_agenda_agendaId_idx" ON "indisponibilidade_agenda"("agendaId");

-- CreateIndex
CREATE INDEX "indisponibilidade_agenda_profissionalId_idx" ON "indisponibilidade_agenda"("profissionalId");

-- CreateIndex
CREATE INDEX "indisponibilidade_agenda_dataInicio_idx" ON "indisponibilidade_agenda"("dataInicio");

-- CreateIndex
CREATE INDEX "alergias_cidadao_citizenId_idx" ON "alergias_cidadao"("citizenId");

-- CreateIndex
CREATE INDEX "comorbidades_cidadao_citizenId_idx" ON "comorbidades_cidadao"("citizenId");

-- CreateIndex
CREATE INDEX "comorbidades_cidadao_ativo_idx" ON "comorbidades_cidadao"("ativo");

-- CreateIndex
CREATE INDEX "anexo_prontuario_citizenId_idx" ON "anexo_prontuario"("citizenId");

-- CreateIndex
CREATE INDEX "anexo_prontuario_atendimentoId_idx" ON "anexo_prontuario"("atendimentoId");

-- CreateIndex
CREATE INDEX "imunizacao_cidadao_citizenId_idx" ON "imunizacao_cidadao"("citizenId");

-- CreateIndex
CREATE INDEX "imunizacao_cidadao_dataAplicacao_idx" ON "imunizacao_cidadao"("dataAplicacao");

-- CreateIndex
CREATE INDEX "lote_medicamento_medicamentoId_idx" ON "lote_medicamento"("medicamentoId");

-- CreateIndex
CREATE INDEX "lote_medicamento_unidadeId_idx" ON "lote_medicamento"("unidadeId");

-- CreateIndex
CREATE INDEX "lote_medicamento_dataValidade_idx" ON "lote_medicamento"("dataValidade");

-- CreateIndex
CREATE INDEX "transferencia_estoque_medicamentoId_idx" ON "transferencia_estoque"("medicamentoId");

-- CreateIndex
CREATE INDEX "transferencia_estoque_unidadeOrigemId_idx" ON "transferencia_estoque"("unidadeOrigemId");

-- CreateIndex
CREATE INDEX "transferencia_estoque_unidadeDestinoId_idx" ON "transferencia_estoque"("unidadeDestinoId");

-- CreateIndex
CREATE INDEX "transferencia_estoque_status_idx" ON "transferencia_estoque"("status");

-- CreateIndex
CREATE INDEX "alerta_estoque_medicamentoId_idx" ON "alerta_estoque"("medicamentoId");

-- CreateIndex
CREATE INDEX "alerta_estoque_unidadeId_idx" ON "alerta_estoque"("unidadeId");

-- CreateIndex
CREATE INDEX "alerta_estoque_tipoAlerta_idx" ON "alerta_estoque"("tipoAlerta");

-- CreateIndex
CREATE INDEX "alerta_estoque_visualizado_idx" ON "alerta_estoque"("visualizado");

-- CreateIndex
CREATE INDEX "documento_tfd_solicitacaoId_idx" ON "documento_tfd"("solicitacaoId");

-- CreateIndex
CREATE INDEX "parecer_regulacao_tfd_solicitacaoId_idx" ON "parecer_regulacao_tfd"("solicitacaoId");

-- CreateIndex
CREATE INDEX "parecer_regulacao_tfd_status_idx" ON "parecer_regulacao_tfd"("status");

-- CreateIndex
CREATE INDEX "aprovacao_gestao_tfd_solicitacaoId_idx" ON "aprovacao_gestao_tfd"("solicitacaoId");

-- CreateIndex
CREATE INDEX "aprovacao_gestao_tfd_decisao_idx" ON "aprovacao_gestao_tfd"("decisao");

-- CreateIndex
CREATE INDEX "agendamento_externo_tfd_solicitacaoId_idx" ON "agendamento_externo_tfd"("solicitacaoId");

-- CreateIndex
CREATE INDEX "agendamento_externo_tfd_dataHoraConsulta_idx" ON "agendamento_externo_tfd"("dataHoraConsulta");

-- CreateIndex
CREATE INDEX "passageiro_viagem_tfd_viagemId_idx" ON "passageiro_viagem_tfd"("viagemId");

-- CreateIndex
CREATE INDEX "passageiro_viagem_tfd_solicitacaoId_idx" ON "passageiro_viagem_tfd"("solicitacaoId");

-- CreateIndex
CREATE INDEX "passageiro_viagem_tfd_citizenId_idx" ON "passageiro_viagem_tfd"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "prestacao_contas_tfd_viagemId_key" ON "prestacao_contas_tfd"("viagemId");

-- CreateIndex
CREATE INDEX "prestacao_contas_tfd_viagemId_idx" ON "prestacao_contas_tfd"("viagemId");

-- CreateIndex
CREATE INDEX "prestacao_contas_tfd_status_idx" ON "prestacao_contas_tfd"("status");

-- CreateIndex
CREATE INDEX "salas_consultorios_unidadeId_ativa_idx" ON "salas_consultorios"("unidadeId", "ativa");

-- CreateIndex
CREATE INDEX "salas_consultorios_tipo_ativa_idx" ON "salas_consultorios"("tipo", "ativa");

-- CreateIndex
CREATE UNIQUE INDEX "turnos_trabalho_nome_key" ON "turnos_trabalho"("nome");

-- CreateIndex
CREATE INDEX "turnos_trabalho_ativo_idx" ON "turnos_trabalho"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_atendimento_unidadeId_key" ON "configuracoes_atendimento"("unidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_esus_municipioId_key" ON "configuracoes_esus"("municipioId");

-- CreateIndex
CREATE INDEX "configuracoes_esus_integracaoAtiva_idx" ON "configuracoes_esus"("integracaoAtiva");

-- CreateIndex
CREATE INDEX "transmissoes_esus_configuracaoId_status_idx" ON "transmissoes_esus"("configuracaoId", "status");

-- CreateIndex
CREATE INDEX "transmissoes_esus_dataEnvio_idx" ON "transmissoes_esus"("dataEnvio");

-- CreateIndex
CREATE INDEX "transmissoes_esus_fichaId_idx" ON "transmissoes_esus"("fichaId");

-- CreateIndex
CREATE INDEX "transmissoes_esus_status_proximaTentativa_idx" ON "transmissoes_esus"("status", "proximaTentativa");

-- CreateIndex
CREATE UNIQUE INDEX "equipes_saude_ine_key" ON "equipes_saude"("ine");

-- CreateIndex
CREATE UNIQUE INDEX "equipes_saude_teamId_key" ON "equipes_saude"("teamId");

-- CreateIndex
CREATE INDEX "equipes_saude_unidadeId_idx" ON "equipes_saude"("unidadeId");

-- CreateIndex
CREATE INDEX "equipes_saude_ativo_idx" ON "equipes_saude"("ativo");

-- CreateIndex
CREATE INDEX "equipes_saude_teamId_idx" ON "equipes_saude"("teamId");

-- CreateIndex
CREATE INDEX "profissionais_equipes_profissionalId_idx" ON "profissionais_equipes"("profissionalId");

-- CreateIndex
CREATE INDEX "profissionais_equipes_equipeId_idx" ON "profissionais_equipes"("equipeId");

-- CreateIndex
CREATE INDEX "profissionais_equipes_ativo_idx" ON "profissionais_equipes"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "profissionais_equipes_profissionalId_equipeId_dataInicio_key" ON "profissionais_equipes"("profissionalId", "equipeId", "dataInicio");

-- CreateIndex
CREATE INDEX "microareas_equipeId_idx" ON "microareas"("equipeId");

-- CreateIndex
CREATE INDEX "microareas_acsId_idx" ON "microareas"("acsId");

-- CreateIndex
CREATE UNIQUE INDEX "microareas_equipeId_numero_key" ON "microareas"("equipeId", "numero");

-- CreateIndex
CREATE INDEX "fila_atendimento_citizenId_idx" ON "fila_atendimento"("citizenId");

-- CreateIndex
CREATE INDEX "fila_atendimento_profissionalId_idx" ON "fila_atendimento"("profissionalId");

-- CreateIndex
CREATE INDEX "fila_atendimento_equipeId_idx" ON "fila_atendimento"("equipeId");

-- CreateIndex
CREATE INDEX "fila_atendimento_unidadeId_idx" ON "fila_atendimento"("unidadeId");

-- CreateIndex
CREATE INDEX "fila_atendimento_status_idx" ON "fila_atendimento"("status");

-- CreateIndex
CREATE INDEX "fila_atendimento_dataHoraChegada_idx" ON "fila_atendimento"("dataHoraChegada");

-- CreateIndex
CREATE INDEX "fila_atendimento_prioridade_idx" ON "fila_atendimento"("prioridade");

-- CreateIndex
CREATE UNIQUE INDEX "escutas_iniciais_filaAtendimentoId_key" ON "escutas_iniciais"("filaAtendimentoId");

-- CreateIndex
CREATE INDEX "escutas_iniciais_filaAtendimentoId_idx" ON "escutas_iniciais"("filaAtendimentoId");

-- CreateIndex
CREATE INDEX "escutas_iniciais_profissionalId_idx" ON "escutas_iniciais"("profissionalId");

-- CreateIndex
CREATE INDEX "escutas_iniciais_unidadeId_idx" ON "escutas_iniciais"("unidadeId");

-- CreateIndex
CREATE INDEX "escutas_iniciais_riscoEsperado_idx" ON "escutas_iniciais"("riscoEsperado");

-- CreateIndex
CREATE INDEX "escutas_iniciais_condutaDefinida_idx" ON "escutas_iniciais"("condutaDefinida");

-- CreateIndex
CREATE UNIQUE INDEX "triagens_enfermagem_filaAtendimentoId_key" ON "triagens_enfermagem"("filaAtendimentoId");

-- CreateIndex
CREATE INDEX "triagens_enfermagem_filaAtendimentoId_idx" ON "triagens_enfermagem"("filaAtendimentoId");

-- CreateIndex
CREATE INDEX "triagens_enfermagem_enfermeiroId_idx" ON "triagens_enfermagem"("enfermeiroId");

-- CreateIndex
CREATE INDEX "triagens_enfermagem_unidadeId_idx" ON "triagens_enfermagem"("unidadeId");

-- CreateIndex
CREATE INDEX "triagens_enfermagem_classificacaoRisco_idx" ON "triagens_enfermagem"("classificacaoRisco");

-- CreateIndex
CREATE INDEX "atividades_coletivas_unidadeId_idx" ON "atividades_coletivas"("unidadeId");

-- CreateIndex
CREATE INDEX "atividades_coletivas_dataHora_idx" ON "atividades_coletivas"("dataHora");

-- CreateIndex
CREATE INDEX "atividades_coletivas_tipo_idx" ON "atividades_coletivas"("tipo");

-- CreateIndex
CREATE INDEX "atividades_coletivas_status_idx" ON "atividades_coletivas"("status");

-- CreateIndex
CREATE INDEX "profissionais_atividades_atividadeId_idx" ON "profissionais_atividades"("atividadeId");

-- CreateIndex
CREATE INDEX "profissionais_atividades_profissionalId_idx" ON "profissionais_atividades"("profissionalId");

-- CreateIndex
CREATE UNIQUE INDEX "profissionais_atividades_atividadeId_profissionalId_key" ON "profissionais_atividades"("atividadeId", "profissionalId");

-- CreateIndex
CREATE INDEX "participantes_atividades_atividadeId_idx" ON "participantes_atividades"("atividadeId");

-- CreateIndex
CREATE INDEX "participantes_atividades_citizenId_idx" ON "participantes_atividades"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "participantes_atividades_atividadeId_citizenId_key" ON "participantes_atividades"("atividadeId", "citizenId");

-- CreateIndex
CREATE INDEX "configuracoes_agenda_profissionalId_idx" ON "configuracoes_agenda"("profissionalId");

-- CreateIndex
CREATE INDEX "configuracoes_agenda_unidadeId_idx" ON "configuracoes_agenda"("unidadeId");

-- CreateIndex
CREATE INDEX "configuracoes_agenda_ativo_idx" ON "configuracoes_agenda"("ativo");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_agenda_profissionalId_unidadeId_diaSemana_tur_key" ON "configuracoes_agenda"("profissionalId", "unidadeId", "diaSemana", "turno");

-- CreateIndex
CREATE INDEX "indisponibilidades_profissionais_profissionalId_idx" ON "indisponibilidades_profissionais"("profissionalId");

-- CreateIndex
CREATE INDEX "indisponibilidades_profissionais_dataInicio_dataFim_idx" ON "indisponibilidades_profissionais"("dataInicio", "dataFim");

-- CreateIndex
CREATE UNIQUE INDEX "face_recognition_identities_personId_key" ON "face_recognition_identities"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "face_recognition_identities_citizenId_key" ON "face_recognition_identities"("citizenId");

-- CreateIndex
CREATE INDEX "face_recognition_identities_status_idx" ON "face_recognition_identities"("status");

-- CreateIndex
CREATE INDEX "face_enrollments_identityId_status_idx" ON "face_enrollments"("identityId", "status");

-- CreateIndex
CREATE INDEX "face_enrollments_approvedById_idx" ON "face_enrollments"("approvedById");

-- CreateIndex
CREATE INDEX "face_embeddings_identityId_isActive_idx" ON "face_embeddings"("identityId", "isActive");

-- CreateIndex
CREATE INDEX "face_embeddings_enrollmentId_idx" ON "face_embeddings"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "face_devices_code_key" ON "face_devices"("code");

-- CreateIndex
CREATE INDEX "face_devices_unidadeEducacaoId_isActive_idx" ON "face_devices"("unidadeEducacaoId", "isActive");

-- CreateIndex
CREATE INDEX "face_devices_healthStatus_idx" ON "face_devices"("healthStatus");

-- CreateIndex
CREATE INDEX "face_zones_deviceId_isActive_idx" ON "face_zones"("deviceId", "isActive");

-- CreateIndex
CREATE INDEX "face_zones_unidadeEducacaoId_idx" ON "face_zones"("unidadeEducacaoId");

-- CreateIndex
CREATE INDEX "face_recognition_events_recognizedAt_idx" ON "face_recognition_events"("recognizedAt");

-- CreateIndex
CREATE INDEX "face_recognition_events_type_matchStatus_idx" ON "face_recognition_events"("type", "matchStatus");

-- CreateIndex
CREATE INDEX "face_recognition_events_deviceId_recognizedAt_idx" ON "face_recognition_events"("deviceId", "recognizedAt");

-- CreateIndex
CREATE INDEX "face_recognition_events_zoneId_recognizedAt_idx" ON "face_recognition_events"("zoneId", "recognizedAt");

-- CreateIndex
CREATE INDEX "face_recognition_events_studentCitizenId_recognizedAt_idx" ON "face_recognition_events"("studentCitizenId", "recognizedAt");

-- CreateIndex
CREATE INDEX "face_recognition_events_guardianCitizenId_notificationStatu_idx" ON "face_recognition_events"("guardianCitizenId", "notificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "school_security_configurations_unidadeEducacaoId_key" ON "school_security_configurations"("unidadeEducacaoId");

-- CreateIndex
CREATE INDEX "school_security_configurations_isActive_idx" ON "school_security_configurations"("isActive");

-- CreateIndex
CREATE INDEX "_ConsultaMedicaToProblemaCondicao_B_index" ON "_ConsultaMedicaToProblemaCondicao"("B");

-- CreateIndex
CREATE INDEX "agendas_medicas_especialidadeId_isActive_idx" ON "agendas_medicas"("especialidadeId", "isActive");

-- CreateIndex
CREATE INDEX "agendas_medicas_salaId_diaSemana_idx" ON "agendas_medicas"("salaId", "diaSemana");

-- CreateIndex
CREATE UNIQUE INDEX "atendimentos_medicos_filaAtendimentoId_key" ON "atendimentos_medicos"("filaAtendimentoId");

-- CreateIndex
CREATE INDEX "atendimentos_medicos_filaAtendimentoId_idx" ON "atendimentos_medicos"("filaAtendimentoId");

-- CreateIndex
CREATE INDEX "citizen_documents_sourceType_idx" ON "citizen_documents"("sourceType");

-- CreateIndex
CREATE INDEX "citizen_documents_sourceDocumentId_idx" ON "citizen_documents"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "citizens_equipeId_idx" ON "citizens"("equipeId");

-- CreateIndex
CREATE INDEX "citizens_microareaId_idx" ON "citizens"("microareaId");

-- CreateIndex
CREATE INDEX "generated_documents_validationCode_idx" ON "generated_documents"("validationCode");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_citizenId_idx" ON "notifications"("citizenId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "solicitacoes_tfd_especialidadeId_idx" ON "solicitacoes_tfd"("especialidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_cras_organizationalUnitId_key" ON "unidades_cras"("organizationalUnitId");

-- CreateIndex
CREATE INDEX "unidades_cras_organizationalUnitId_idx" ON "unidades_cras"("organizationalUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_educacao_organizationalUnitId_key" ON "unidades_educacao"("organizationalUnitId");

-- CreateIndex
CREATE INDEX "unidades_educacao_organizationalUnitId_idx" ON "unidades_educacao"("organizationalUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_saude_organizationalUnitId_key" ON "unidades_saude"("organizationalUnitId");

-- CreateIndex
CREATE INDEX "unidades_saude_cnes_idx" ON "unidades_saude"("cnes");

-- AddForeignKey
ALTER TABLE "citizens" ADD CONSTRAINT "citizens_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes_saude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizens" ADD CONSTRAINT "citizens_microareaId_fkey" FOREIGN KEY ("microareaId") REFERENCES "microareas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades_saude" ADD CONSTRAINT "unidades_saude_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades_educacao" ADD CONSTRAINT "unidades_educacao_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades_cras" ADD CONSTRAINT "unidades_cras_organizationalUnitId_fkey" FOREIGN KEY ("organizationalUnitId") REFERENCES "organizational_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas_medicas" ADD CONSTRAINT "agendas_medicas_especialidadeId_fkey" FOREIGN KEY ("especialidadeId") REFERENCES "especialidades_medicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas_medicas" ADD CONSTRAINT "agendas_medicas_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "salas_consultorios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendas_medicas" ADD CONSTRAINT "agendas_medicas_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "turnos_trabalho"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_agendadas" ADD CONSTRAINT "consultas_agendadas_filaAtendimentoId_fkey" FOREIGN KEY ("filaAtendimentoId") REFERENCES "fila_atendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos_medicos" ADD CONSTRAINT "atendimentos_medicos_triagemEnfermagemId_fkey" FOREIGN KEY ("triagemEnfermagemId") REFERENCES "triagens_enfermagem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos_medicos" ADD CONSTRAINT "atendimentos_medicos_filaAtendimentoId_fkey" FOREIGN KEY ("filaAtendimentoId") REFERENCES "fila_atendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "problemas_condicoes" ADD CONSTRAINT "problemas_condicoes_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alergias_reacoes" ADD CONSTRAINT "alergias_reacoes_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos_odontologicos" ADD CONSTRAINT "atendimentos_odontologicos_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos_medicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atendimentos_odontologicos" ADD CONSTRAINT "atendimentos_odontologicos_dentistaId_fkey" FOREIGN KEY ("dentistaId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procedimentos_odonto" ADD CONSTRAINT "procedimentos_odonto_atendimentoOdontoId_fkey" FOREIGN KEY ("atendimentoOdontoId") REFERENCES "atendimentos_odontologicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acompanhamento_pre_natal" ADD CONSTRAINT "acompanhamento_pre_natal_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_pre_natal" ADD CONSTRAINT "consultas_pre_natal_preNatalId_fkey" FOREIGN KEY ("preNatalId") REFERENCES "acompanhamento_pre_natal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultas_pre_natal" ADD CONSTRAINT "consultas_pre_natal_consultaMedicaId_fkey" FOREIGN KEY ("consultaMedicaId") REFERENCES "consultas_medicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exames_pre_natal" ADD CONSTRAINT "exames_pre_natal_preNatalId_fkey" FOREIGN KEY ("preNatalId") REFERENCES "acompanhamento_pre_natal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas_domiciliares" ADD CONSTRAINT "visitas_domiciliares_acsId_fkey" FOREIGN KEY ("acsId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas_domiciliares" ADD CONSTRAINT "visitas_domiciliares_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitacoes_tfd" ADD CONSTRAINT "solicitacoes_tfd_especialidadeId_fkey" FOREIGN KEY ("especialidadeId") REFERENCES "especialidades_medicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_activeFlowExecutionId_fkey" FOREIGN KEY ("activeFlowExecutionId") REFERENCES "flow_executions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_categories" ADD CONSTRAINT "citizen_categories_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "citizen_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_category_protocol_history" ADD CONSTRAINT "citizen_category_protocol_history_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "citizen_category_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_category_protocol_history" ADD CONSTRAINT "citizen_category_protocol_history_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_category_protocol_history" ADD CONSTRAINT "citizen_category_protocol_history_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_category_protocol_history" ADD CONSTRAINT "citizen_category_protocol_history_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "citizen_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_category_audit_log" ADD CONSTRAINT "citizen_category_audit_log_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "citizen_category_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_category_audit_log" ADD CONSTRAINT "citizen_category_audit_log_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_category_audit_log" ADD CONSTRAINT "citizen_category_audit_log_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "citizen_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_category_relationships" ADD CONSTRAINT "citizen_category_relationships_sourceCategoryId_fkey" FOREIGN KEY ("sourceCategoryId") REFERENCES "citizen_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_category_relationships" ADD CONSTRAINT "citizen_category_relationships_targetCategoryId_fkey" FOREIGN KEY ("targetCategoryId") REFERENCES "citizen_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_category_badges" ADD CONSTRAINT "citizen_category_badges_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "citizen_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_certificates" ADD CONSTRAINT "digital_certificates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_certificates" ADD CONSTRAINT "digital_certificates_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "generated_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_externalDocumentId_fkey" FOREIGN KEY ("externalDocumentId") REFERENCES "external_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "signatures" ADD CONSTRAINT "signatures_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "digital_certificates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_revocation_list" ADD CONSTRAINT "certificate_revocation_list_revokedBy_fkey" FOREIGN KEY ("revokedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_requests" ADD CONSTRAINT "certificate_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_requests" ADD CONSTRAINT "certificate_requests_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_requests" ADD CONSTRAINT "certificate_requests_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "digital_certificates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_conversations" ADD CONSTRAINT "bot_conversations_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_messages" ADD CONSTRAINT "bot_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "bot_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proactive_notifications" ADD CONSTRAINT "proactive_notifications_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bot_uploads" ADD CONSTRAINT "bot_uploads_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_executions" ADD CONSTRAINT "flow_executions_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_executions" ADD CONSTRAINT "flow_executions_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "flow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamada_painel" ADD CONSTRAINT "chamada_painel_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chamada_painel" ADD CONSTRAINT "chamada_painel_filaId_fkey" FOREIGN KEY ("filaId") REFERENCES "fila_atendimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indisponibilidade_agenda" ADD CONSTRAINT "indisponibilidade_agenda_agendaId_fkey" FOREIGN KEY ("agendaId") REFERENCES "agendas_medicas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indisponibilidade_agenda" ADD CONSTRAINT "indisponibilidade_agenda_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alergias_cidadao" ADD CONSTRAINT "alergias_cidadao_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alergias_cidadao" ADD CONSTRAINT "alergias_cidadao_usuarioRegistro_fkey" FOREIGN KEY ("usuarioRegistro") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comorbidades_cidadao" ADD CONSTRAINT "comorbidades_cidadao_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comorbidades_cidadao" ADD CONSTRAINT "comorbidades_cidadao_usuarioRegistro_fkey" FOREIGN KEY ("usuarioRegistro") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo_prontuario" ADD CONSTRAINT "anexo_prontuario_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo_prontuario" ADD CONSTRAINT "anexo_prontuario_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "atendimentos_medicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexo_prontuario" ADD CONSTRAINT "anexo_prontuario_usuarioUpload_fkey" FOREIGN KEY ("usuarioUpload") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imunizacao_cidadao" ADD CONSTRAINT "imunizacao_cidadao_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imunizacao_cidadao" ADD CONSTRAINT "imunizacao_cidadao_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "imunizacao_cidadao" ADD CONSTRAINT "imunizacao_cidadao_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_medicamento" ADD CONSTRAINT "lote_medicamento_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_medicamento" ADD CONSTRAINT "lote_medicamento_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_medicamento" ADD CONSTRAINT "lote_medicamento_usuarioRegistro_fkey" FOREIGN KEY ("usuarioRegistro") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_estoque" ADD CONSTRAINT "transferencia_estoque_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_estoque" ADD CONSTRAINT "transferencia_estoque_unidadeOrigemId_fkey" FOREIGN KEY ("unidadeOrigemId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_estoque" ADD CONSTRAINT "transferencia_estoque_unidadeDestinoId_fkey" FOREIGN KEY ("unidadeDestinoId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_estoque" ADD CONSTRAINT "transferencia_estoque_usuarioSolicitante_fkey" FOREIGN KEY ("usuarioSolicitante") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_estoque" ADD CONSTRAINT "transferencia_estoque_usuarioConfirmante_fkey" FOREIGN KEY ("usuarioConfirmante") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta_estoque" ADD CONSTRAINT "alerta_estoque_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "medicamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta_estoque" ADD CONSTRAINT "alerta_estoque_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_tfd" ADD CONSTRAINT "documento_tfd_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes_tfd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento_tfd" ADD CONSTRAINT "documento_tfd_usuarioUpload_fkey" FOREIGN KEY ("usuarioUpload") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parecer_regulacao_tfd" ADD CONSTRAINT "parecer_regulacao_tfd_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes_tfd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parecer_regulacao_tfd" ADD CONSTRAINT "parecer_regulacao_tfd_medicoReguladorId_fkey" FOREIGN KEY ("medicoReguladorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprovacao_gestao_tfd" ADD CONSTRAINT "aprovacao_gestao_tfd_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes_tfd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aprovacao_gestao_tfd" ADD CONSTRAINT "aprovacao_gestao_tfd_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamento_externo_tfd" ADD CONSTRAINT "agendamento_externo_tfd_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes_tfd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamento_externo_tfd" ADD CONSTRAINT "agendamento_externo_tfd_usuarioAgendamento_fkey" FOREIGN KEY ("usuarioAgendamento") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passageiro_viagem_tfd" ADD CONSTRAINT "passageiro_viagem_tfd_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens_tfd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passageiro_viagem_tfd" ADD CONSTRAINT "passageiro_viagem_tfd_solicitacaoId_fkey" FOREIGN KEY ("solicitacaoId") REFERENCES "solicitacoes_tfd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passageiro_viagem_tfd" ADD CONSTRAINT "passageiro_viagem_tfd_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestacao_contas_tfd" ADD CONSTRAINT "prestacao_contas_tfd_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens_tfd"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestacao_contas_tfd" ADD CONSTRAINT "prestacao_contas_tfd_usuarioPrestacao_fkey" FOREIGN KEY ("usuarioPrestacao") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestacao_contas_tfd" ADD CONSTRAINT "prestacao_contas_tfd_usuarioAprovacao_fkey" FOREIGN KEY ("usuarioAprovacao") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "salas_consultorios" ADD CONSTRAINT "salas_consultorios_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_atendimento" ADD CONSTRAINT "configuracoes_atendimento_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transmissoes_esus" ADD CONSTRAINT "transmissoes_esus_configuracaoId_fkey" FOREIGN KEY ("configuracaoId") REFERENCES "configuracoes_esus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipes_saude" ADD CONSTRAINT "equipes_saude_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipes_saude" ADD CONSTRAINT "equipes_saude_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissionais_equipes" ADD CONSTRAINT "profissionais_equipes_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissionais_equipes" ADD CONSTRAINT "profissionais_equipes_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "microareas" ADD CONSTRAINT "microareas_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "microareas" ADD CONSTRAINT "microareas_acsId_fkey" FOREIGN KEY ("acsId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fila_atendimento" ADD CONSTRAINT "fila_atendimento_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fila_atendimento" ADD CONSTRAINT "fila_atendimento_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fila_atendimento" ADD CONSTRAINT "fila_atendimento_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes_saude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fila_atendimento" ADD CONSTRAINT "fila_atendimento_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escutas_iniciais" ADD CONSTRAINT "escutas_iniciais_filaAtendimentoId_fkey" FOREIGN KEY ("filaAtendimentoId") REFERENCES "fila_atendimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escutas_iniciais" ADD CONSTRAINT "escutas_iniciais_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escutas_iniciais" ADD CONSTRAINT "escutas_iniciais_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "equipes_saude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escutas_iniciais" ADD CONSTRAINT "escutas_iniciais_profissionalEncaminhadoId_fkey" FOREIGN KEY ("profissionalEncaminhadoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escutas_iniciais" ADD CONSTRAINT "escutas_iniciais_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triagens_enfermagem" ADD CONSTRAINT "triagens_enfermagem_filaAtendimentoId_fkey" FOREIGN KEY ("filaAtendimentoId") REFERENCES "fila_atendimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triagens_enfermagem" ADD CONSTRAINT "triagens_enfermagem_enfermeiroId_fkey" FOREIGN KEY ("enfermeiroId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triagens_enfermagem" ADD CONSTRAINT "triagens_enfermagem_profissionalEncaminhadoId_fkey" FOREIGN KEY ("profissionalEncaminhadoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "triagens_enfermagem" ADD CONSTRAINT "triagens_enfermagem_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atividades_coletivas" ADD CONSTRAINT "atividades_coletivas_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissionais_atividades" ADD CONSTRAINT "profissionais_atividades_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "atividades_coletivas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissionais_atividades" ADD CONSTRAINT "profissionais_atividades_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes_atividades" ADD CONSTRAINT "participantes_atividades_atividadeId_fkey" FOREIGN KEY ("atividadeId") REFERENCES "atividades_coletivas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participantes_atividades" ADD CONSTRAINT "participantes_atividades_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_agenda" ADD CONSTRAINT "configuracoes_agenda_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "configuracoes_agenda" ADD CONSTRAINT "configuracoes_agenda_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades_saude"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indisponibilidades_profissionais" ADD CONSTRAINT "indisponibilidades_profissionais_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_recognition_identities" ADD CONSTRAINT "face_recognition_identities_personId_fkey" FOREIGN KEY ("personId") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_recognition_identities" ADD CONSTRAINT "face_recognition_identities_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_enrollments" ADD CONSTRAINT "face_enrollments_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "face_recognition_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_enrollments" ADD CONSTRAINT "face_enrollments_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_embeddings" ADD CONSTRAINT "face_embeddings_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "face_recognition_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_embeddings" ADD CONSTRAINT "face_embeddings_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "face_enrollments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_devices" ADD CONSTRAINT "face_devices_unidadeEducacaoId_fkey" FOREIGN KEY ("unidadeEducacaoId") REFERENCES "unidades_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_zones" ADD CONSTRAINT "face_zones_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "face_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_zones" ADD CONSTRAINT "face_zones_unidadeEducacaoId_fkey" FOREIGN KEY ("unidadeEducacaoId") REFERENCES "unidades_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_recognition_events" ADD CONSTRAINT "face_recognition_events_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "face_recognition_identities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_recognition_events" ADD CONSTRAINT "face_recognition_events_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "face_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_recognition_events" ADD CONSTRAINT "face_recognition_events_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "face_zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_recognition_events" ADD CONSTRAINT "face_recognition_events_unidadeEducacaoId_fkey" FOREIGN KEY ("unidadeEducacaoId") REFERENCES "unidades_educacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_recognition_events" ADD CONSTRAINT "face_recognition_events_studentCitizenId_fkey" FOREIGN KEY ("studentCitizenId") REFERENCES "citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_recognition_events" ADD CONSTRAINT "face_recognition_events_guardianCitizenId_fkey" FOREIGN KEY ("guardianCitizenId") REFERENCES "citizens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "face_recognition_events" ADD CONSTRAINT "face_recognition_events_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_security_configurations" ADD CONSTRAINT "school_security_configurations_unidadeEducacaoId_fkey" FOREIGN KEY ("unidadeEducacaoId") REFERENCES "unidades_educacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConsultaMedicaToProblemaCondicao" ADD CONSTRAINT "_ConsultaMedicaToProblemaCondicao_A_fkey" FOREIGN KEY ("A") REFERENCES "consultas_medicas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConsultaMedicaToProblemaCondicao" ADD CONSTRAINT "_ConsultaMedicaToProblemaCondicao_B_fkey" FOREIGN KEY ("B") REFERENCES "problemas_condicoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "idx_category_has_progression" RENAME TO "citizen_categories_hasProgression_idx";

-- RenameIndex
ALTER INDEX "idx_category_has_validity" RENAME TO "citizen_categories_hasValidity_idx";

-- RenameIndex
ALTER INDEX "idx_category_level" RENAME TO "citizen_categories_level_idx";

-- RenameIndex
ALTER INDEX "idx_category_parent" RENAME TO "citizen_categories_parentCategoryId_idx";

-- RenameIndex
ALTER INDEX "idx_category_type" RENAME TO "citizen_categories_categoryType_idx";

-- RenameIndex
ALTER INDEX "idx_assignment_expires_at" RENAME TO "citizen_category_assignments_expiresAt_idx";

-- RenameIndex
ALTER INDEX "idx_assignment_is_expired" RENAME TO "citizen_category_assignments_isExpired_idx";

-- RenameIndex
ALTER INDEX "idx_assignment_last_protocol" RENAME TO "citizen_category_assignments_lastProtocolDate_idx";

-- RenameIndex
ALTER INDEX "idx_assignment_level" RENAME TO "citizen_category_assignments_level_idx";

-- RenameIndex
ALTER INDEX "idx_audit_log_action" RENAME TO "citizen_category_audit_log_action_idx";

-- RenameIndex
ALTER INDEX "idx_audit_log_action_date" RENAME TO "citizen_category_audit_log_actionDate_idx";

-- RenameIndex
ALTER INDEX "idx_audit_log_assignment" RENAME TO "citizen_category_audit_log_assignmentId_idx";

-- RenameIndex
ALTER INDEX "idx_audit_log_category" RENAME TO "citizen_category_audit_log_categoryId_idx";

-- RenameIndex
ALTER INDEX "idx_audit_log_citizen" RENAME TO "citizen_category_audit_log_citizenId_idx";

-- RenameIndex
ALTER INDEX "idx_badge_active" RENAME TO "citizen_category_badges_active_idx";

-- RenameIndex
ALTER INDEX "idx_badge_category" RENAME TO "citizen_category_badges_categoryId_idx";

-- RenameIndex
ALTER INDEX "idx_protocol_history_assignment" RENAME TO "citizen_category_protocol_history_assignmentId_idx";

-- RenameIndex
ALTER INDEX "idx_protocol_history_category" RENAME TO "citizen_category_protocol_history_categoryId_idx";

-- RenameIndex
ALTER INDEX "idx_protocol_history_citizen" RENAME TO "citizen_category_protocol_history_citizenId_idx";

-- RenameIndex
ALTER INDEX "idx_protocol_history_event_date" RENAME TO "citizen_category_protocol_history_eventDate_idx";

-- RenameIndex
ALTER INDEX "idx_protocol_history_event_type" RENAME TO "citizen_category_protocol_history_eventType_idx";

-- RenameIndex
ALTER INDEX "idx_protocol_history_protocol" RENAME TO "citizen_category_protocol_history_protocolId_idx";

-- RenameIndex
ALTER INDEX "idx_relationship_source" RENAME TO "citizen_category_relationships_sourceCategoryId_idx";

-- RenameIndex
ALTER INDEX "idx_relationship_target" RENAME TO "citizen_category_relationships_targetCategoryId_idx";

-- RenameIndex
ALTER INDEX "idx_relationship_type" RENAME TO "citizen_category_relationships_relationshipType_idx";

-- RenameIndex
ALTER INDEX "unique_category_relationship" RENAME TO "citizen_category_relationships_sourceCategoryId_targetCateg_key";

