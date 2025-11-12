-- Script para adicionar campos customizáveis e modelos de inscrição
-- Este arquivo documenta as mudanças necessárias no schema.prisma

-- ============================================================================
-- PADRÃO PARA TODOS OS MODELOS DE CURSOS/PROGRAMAS
-- ============================================================================

-- 1. Adicionar aos modelos principais (Workshop, Program, Training, etc):
/*
  customFields        Json?               // Array de campos adicionais
  requiredDocuments   Json?               // Array de documentos necessários
  enrollmentSettings  Json?               // Configurações de inscrição
  enrollments         [Tipo]Enrollment[]  // Relação com inscrições
*/

-- 2. Criar modelo *Enrollment correspondente:
/*
model [Tipo]Enrollment {
  id              String              @id @default(cuid())
  tenantId        String
  protocolId      String?
  [tipo]Id        String              // Ex: workshopId, programId
  citizenId       String?

  // Dados do inscrito
  applicantName   String
  applicantCpf    String?
  applicantEmail  String?
  applicantPhone  String?
  applicantAddress String?

  // Status
  status          String              @default("PENDING")
  enrollmentDate  DateTime            @default(now())
  approvedDate    DateTime?
  rejectedDate    DateTime?
  startDate       DateTime?
  endDate         DateTime?

  // Dados customizados
  customData      Json?
  documents       Json?

  // Observações
  observations    String?
  adminNotes      String?
  rejectionReason String?

  // Metadados
  moduleType      String              @default("INSCRICAO_...")
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  // Relacionamentos
  tenant          Tenant              @relation(fields: [tenantId], references: [id])
  [tipo]          [Tipo]              @relation(fields: [[tipo]Id], references: [id])
  protocol        ProtocolSimplified? @relation("[Tipo]EnrollmentProtocol", fields: [protocolId], references: [id])
  citizen         Citizen?            @relation("[Tipo]EnrollmentCitizen", fields: [citizenId], references: [id])

  @@index([tenantId, [tipo]Id])
  @@index([tenantId, status])
  @@index([tenantId, moduleType])
  @@index([protocolId])
  @@index([tenantId, createdAt])
  @@map("[tipo]_enrollments")
}
*/

-- ============================================================================
-- LISTA DE MODELOS A SEREM CRIADOS:
-- ============================================================================

-- ✅ AGRICULTURA
-- RuralProgramEnrollment (JÁ CRIADO)
-- RuralTrainingEnrollment (JÁ CRIADO)

-- CULTURA
-- CulturalWorkshopEnrollment (JÁ EXISTE - verificar se tem campos customizáveis)

-- ESPORTES
-- SportsSchoolEnrollment (JÁ EXISTE - verificar)
-- CompetitionEnrollment (JÁ EXISTE - verificar)
-- TournamentEnrollment (JÁ EXISTE - mas Tournament não existe como modelo principal)

-- ASSISTÊNCIA SOCIAL
-- SocialProgramEnrollment (JÁ EXISTE - verificar)
-- SocialGroupEnrollment (JÁ EXISTE - verificar)

-- HABITAÇÃO
-- HousingApplicationEnrollment (HousingApplication já é a inscrição)
-- HousingRegistrationEnrollment (HousingRegistration já é a inscrição)

-- TURISMO
-- TourismProgramEnrollment (precisa criar)
