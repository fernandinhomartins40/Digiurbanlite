/*
  Warnings:

  - You are about to drop the `tenants` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `tenantId` on the `agenda_events` table. All the data in the column will be lost.
  - You are about to drop the column `contact` on the `agriculture_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `producerCpf` on the `agriculture_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `producerName` on the `agriculture_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `agriculture_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `alerts` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `analytics` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `anonymous_tips` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `artistic_groups` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `athletes` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `attendance_records` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `benefit_requests` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `building_permits` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `business_licenses` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `camera_requests` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `campaign_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `certificate_requests` table. All the data in the column will be lost.
  - You are about to drop the column `fromTenantId` on the `citizen_transfer_requests` table. All the data in the column will be lost.
  - You are about to drop the column `toTenantId` on the `citizen_transfer_requests` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `citizens` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `cleaning_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `community_health_agents` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `competition_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `competitions` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `critical_points` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `cultural_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `cultural_events` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `cultural_manifestations` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `cultural_project_submissions` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `cultural_projects` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `cultural_space_reservations` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `cultural_spaces` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `cultural_workshop_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `cultural_workshops` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `custom_data_tables` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `dashboards` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `department_metrics` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `disciplinary_records` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `drainage_requests` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `education_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `email_servers` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `email_templates` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `emergency_deliveries` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `environmental_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `environmental_complaints` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `environmental_inspections` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `environmental_licenses` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `environmental_programs` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `event_authorizations` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `family_compositions` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `farmer_market_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `grade_records` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `health_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `health_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `health_campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `health_doctors` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `health_exams` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `health_professionals` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `health_programs` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `health_transport_requests` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `health_transports` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `health_units` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `home_visits` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `housing_applications` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `housing_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `housing_programs` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `housing_registrations` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `housing_requests` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `housing_units` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `infrastructure_problems` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `integrations` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `kpis` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `land_regularizations` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `leads` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `local_businesses` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `lost_and_found` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `lot_subdivisions` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `medical_specialties` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `medication_dispenses` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `medication_dispensing` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `medications` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `metric_cache` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `municipal_guards` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `notifications` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `organic_certifications` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `page_configurations` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `page_metrics` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `patients` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `patrol_requests` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `police_reports` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `predictions` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `project_approvals` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `property_numbering` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `protected_areas` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `protocol_bottlenecks` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `protocol_metrics` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `protocols_simplified` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `public_complaints` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `public_consultations` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `public_problem_reports` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `public_schools` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `public_service_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `public_service_requests` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `public_works` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `public_works_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `rent_assistances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `road_repair_requests` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `rural_producers` table. All the data in the column will be lost.
  - You are about to drop the column `document` on the `rural_producers` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `rural_producers` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `rural_producers` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `rural_producers` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `rural_producers` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `rural_programs` table. All the data in the column will be lost.
  - You are about to drop the column `owner` on the `rural_properties` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `rural_properties` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `rural_trainings` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `school_calls` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `school_classes` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `school_documents` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `school_events` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `school_incidents` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `school_management` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `school_meals` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `school_transports` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `schools` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `security_alerts` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `security_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `security_occurrences` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `security_patrols` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `seed_distributions` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `server_performance` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `service_metrics` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `service_teams` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `services_simplified` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `social_appointments` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `social_assistance_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `social_equipments` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `social_group_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `social_program_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `social_programs` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `soil_analyses` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `special_collections` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `specialized_pages` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `sports_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `sports_clubs` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `sports_events` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `sports_infrastructure_reservations` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `sports_infrastructures` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `sports_modalities` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `sports_school_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `sports_schools` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `sports_teams` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `street_lightings` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `student_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `student_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `student_transfers` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `surveillance_systems` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `team_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `producerCpf` on the `technical_assistances` table. All the data in the column will be lost.
  - You are about to drop the column `producerName` on the `technical_assistances` table. All the data in the column will be lost.
  - You are about to drop the column `producerPhone` on the `technical_assistances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `technical_assistances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `technical_inspections` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `tourism_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `tourism_events` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `tourism_guides` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `tourism_infos` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `tourism_programs` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `tourism_routes` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `tourist_attractions` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `tournament_enrollments` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `tree_authorizations` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `tree_cutting_authorizations` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `tree_pruning_requests` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `urban_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `urban_cleanings` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `urban_infractions` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `urban_maintenance_requests` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `urban_planning_attendances` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `urban_projects` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `urban_zoning` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `vaccination_campaigns` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `vaccinations` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `vulnerable_families` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `weeding_requests` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `work_inspections` table. All the data in the column will be lost.
  - Added the required column `citizenId` to the `agriculture_attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `citizenId` to the `attendance_records` table without a default value. This is not possible if the table is not empty.
  - Made the column `workshopId` on table `cultural_workshop_enrollments` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `citizenId` to the `disciplinary_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `citizenId` to the `education_attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `citizenId` to the `grade_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `citizenId` to the `rural_properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `citizenId` to the `school_documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `citizenId` to the `school_management` table without a default value. This is not possible if the table is not empty.
  - Added the required column `citizenId` to the `technical_assistances` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "tenants_cnpj_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "tenants";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "municipio_config" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
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
    "subscriptionEnds" DATETIME,
    "maxUsers" INTEGER NOT NULL DEFAULT 10,
    "maxCitizens" INTEGER NOT NULL DEFAULT 10000,
    "features" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "rural_program_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenId" TEXT NOT NULL,
    "protocolId" TEXT,
    "programId" TEXT NOT NULL,
    "producerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "enrollmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedDate" DATETIME,
    "rejectedDate" DATETIME,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "customData" JSONB,
    "documents" JSONB,
    "observations" TEXT,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'INSCRICAO_PROGRAMA_RURAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rural_program_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rural_program_enrollments_programId_fkey" FOREIGN KEY ("programId") REFERENCES "rural_programs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rural_program_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rural_program_enrollments_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "rural_producers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rural_training_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenId" TEXT NOT NULL,
    "protocolId" TEXT,
    "trainingId" TEXT NOT NULL,
    "producerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "enrollmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedDate" DATETIME,
    "rejectedDate" DATETIME,
    "completionDate" DATETIME,
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "customData" JSONB,
    "documents" JSONB,
    "observations" TEXT,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'INSCRICAO_CURSO_RURAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rural_training_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rural_training_enrollments_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "rural_trainings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rural_training_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rural_training_enrollments_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "rural_producers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_agenda_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "agenda_events_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_agenda_events" ("anexos", "createdAt", "createdById", "dataHoraFim", "dataHoraInicio", "descricao", "id", "local", "observacoes", "participantes", "status", "tipo", "titulo", "updatedAt") SELECT "anexos", "createdAt", "createdById", "dataHoraFim", "dataHoraInicio", "descricao", "id", "local", "observacoes", "participantes", "status", "tipo", "titulo", "updatedAt" FROM "agenda_events";
DROP TABLE "agenda_events";
ALTER TABLE "new_agenda_events" RENAME TO "agenda_events";
CREATE INDEX "agenda_events_dataHoraInicio_idx" ON "agenda_events"("dataHoraInicio");
CREATE INDEX "agenda_events_status_idx" ON "agenda_events"("status");
CREATE TABLE "new_agriculture_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenId" TEXT NOT NULL,
    "protocolId" TEXT,
    "producerId" TEXT,
    "serviceType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "propertyName" TEXT,
    "propertySize" REAL,
    "location" TEXT,
    "crops" JSONB,
    "livestock" JSONB,
    "preferredVisitDate" DATETIME,
    "scheduledDate" DATETIME,
    "visitDate" DATETIME,
    "technician" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "resolution" TEXT,
    "followUpDate" DATETIME,
    "satisfaction" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "agriculture_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "agriculture_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_agriculture_attendances" ("category", "createdAt", "crops", "description", "findings", "followUpDate", "id", "livestock", "location", "preferredVisitDate", "propertyName", "propertySize", "protocolId", "recommendations", "resolution", "satisfaction", "scheduledDate", "serviceType", "status", "subject", "technician", "updatedAt", "urgency", "visitDate") SELECT "category", "createdAt", "crops", "description", "findings", "followUpDate", "id", "livestock", "location", "preferredVisitDate", "propertyName", "propertySize", "protocolId", "recommendations", "resolution", "satisfaction", "scheduledDate", "serviceType", "status", "subject", "technician", "updatedAt", "urgency", "visitDate" FROM "agriculture_attendances";
DROP TABLE "agriculture_attendances";
ALTER TABLE "new_agriculture_attendances" RENAME TO "agriculture_attendances";
CREATE UNIQUE INDEX "agriculture_attendances_protocolId_key" ON "agriculture_attendances"("protocolId");
CREATE INDEX "agriculture_attendances_citizenId_idx" ON "agriculture_attendances"("citizenId");
CREATE INDEX "agriculture_attendances_producerId_idx" ON "agriculture_attendances"("producerId");
CREATE INDEX "agriculture_attendances_protocolId_idx" ON "agriculture_attendances"("protocolId");
CREATE INDEX "agriculture_attendances_status_idx" ON "agriculture_attendances"("status");
CREATE INDEX "agriculture_attendances_scheduledDate_idx" ON "agriculture_attendances"("scheduledDate");
CREATE INDEX "agriculture_attendances_createdAt_idx" ON "agriculture_attendances"("createdAt");
CREATE TABLE "new_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_alerts" ("channels", "condition", "cooldown", "createdAt", "createdBy", "description", "frequency", "id", "isActive", "lastTriggered", "metric", "name", "recipients", "threshold", "threshold2", "triggerCount", "type", "updatedAt") SELECT "channels", "condition", "cooldown", "createdAt", "createdBy", "description", "frequency", "id", "isActive", "lastTriggered", "metric", "name", "recipients", "threshold", "threshold2", "triggerCount", "type", "updatedAt" FROM "alerts";
DROP TABLE "alerts";
ALTER TABLE "new_alerts" RENAME TO "alerts";
CREATE INDEX "alerts_type_isActive_idx" ON "alerts"("type", "isActive");
CREATE INDEX "alerts_metric_isActive_idx" ON "alerts"("metric", "isActive");
CREATE TABLE "new_analytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_analytics" ("createdAt", "dimension", "entityId", "id", "metadata", "metric", "period", "periodType", "type", "updatedAt", "value") SELECT "createdAt", "dimension", "entityId", "id", "metadata", "metric", "period", "periodType", "type", "updatedAt", "value" FROM "analytics";
DROP TABLE "analytics";
ALTER TABLE "new_analytics" RENAME TO "analytics";
CREATE INDEX "analytics_type_metric_period_idx" ON "analytics"("type", "metric", "period");
CREATE INDEX "analytics_entityId_metric_idx" ON "analytics"("entityId", "metric");
CREATE INDEX "analytics_periodType_createdAt_idx" ON "analytics"("periodType", "createdAt");
CREATE TABLE "new_anonymous_tips" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "anonymous_tips_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_anonymous_tips" ("actionTaken", "anonymityLevel", "assignedAt", "assignedTo", "category", "closedAt", "coordinates", "createdAt", "dangerLevel", "description", "evidenceNotes", "evidenceType", "feedbackCode", "frequency", "hasEvidence", "id", "investigationLog", "ipHash", "isAnonymous", "isUrgent", "location", "metadata", "outcome", "priority", "protocol", "protocolId", "publicUpdates", "serviceId", "source", "status", "suspectInfo", "timeframe", "tipNumber", "type", "updatedAt", "vehicleInfo") SELECT "actionTaken", "anonymityLevel", "assignedAt", "assignedTo", "category", "closedAt", "coordinates", "createdAt", "dangerLevel", "description", "evidenceNotes", "evidenceType", "feedbackCode", "frequency", "hasEvidence", "id", "investigationLog", "ipHash", "isAnonymous", "isUrgent", "location", "metadata", "outcome", "priority", "protocol", "protocolId", "publicUpdates", "serviceId", "source", "status", "suspectInfo", "timeframe", "tipNumber", "type", "updatedAt", "vehicleInfo" FROM "anonymous_tips";
DROP TABLE "anonymous_tips";
ALTER TABLE "new_anonymous_tips" RENAME TO "anonymous_tips";
CREATE UNIQUE INDEX "anonymous_tips_tipNumber_key" ON "anonymous_tips"("tipNumber");
CREATE UNIQUE INDEX "anonymous_tips_feedbackCode_key" ON "anonymous_tips"("feedbackCode");
CREATE INDEX "anonymous_tips_status_idx" ON "anonymous_tips"("status");
CREATE INDEX "anonymous_tips_type_idx" ON "anonymous_tips"("type");
CREATE INDEX "anonymous_tips_tipNumber_idx" ON "anonymous_tips"("tipNumber");
CREATE INDEX "anonymous_tips_feedbackCode_idx" ON "anonymous_tips"("feedbackCode");
CREATE TABLE "new_artistic_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "artistic_groups_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_artistic_groups" ("category", "contact", "createdAt", "foundationDate", "id", "members", "name", "protocolId", "responsible", "status", "updatedAt") SELECT "category", "contact", "createdAt", "foundationDate", "id", "members", "name", "protocolId", "responsible", "status", "updatedAt" FROM "artistic_groups";
DROP TABLE "artistic_groups";
ALTER TABLE "new_artistic_groups" RENAME TO "artistic_groups";
CREATE TABLE "new_athletes" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "athletes_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "sports_modalities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "athletes_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_athletes" ("address", "birthDate", "category", "cpf", "createdAt", "email", "emergencyContact", "federationExpiry", "federationNumber", "id", "isActive", "medicalCertificate", "medicalInfo", "modalityId", "name", "phone", "position", "protocol", "protocolId", "rg", "serviceId", "source", "sport", "team", "teamId", "updatedAt") SELECT "address", "birthDate", "category", "cpf", "createdAt", "email", "emergencyContact", "federationExpiry", "federationNumber", "id", "isActive", "medicalCertificate", "medicalInfo", "modalityId", "name", "phone", "position", "protocol", "protocolId", "rg", "serviceId", "source", "sport", "team", "teamId", "updatedAt" FROM "athletes";
DROP TABLE "athletes";
ALTER TABLE "new_athletes" RENAME TO "athletes";
CREATE INDEX "athletes_protocolId_idx" ON "athletes"("protocolId");
CREATE INDEX "athletes_createdAt_idx" ON "athletes"("createdAt");
CREATE UNIQUE INDEX "athletes_cpf_key" ON "athletes"("cpf");
CREATE TABLE "new_attendance_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
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
    "startDate" DATETIME,
    "endDate" DATETIME,
    "totalDays" INTEGER NOT NULL,
    "presentDays" INTEGER NOT NULL,
    "absentDays" INTEGER NOT NULL,
    "justifiedAbsences" INTEGER NOT NULL DEFAULT 0,
    "unjustifiedAbsences" INTEGER NOT NULL DEFAULT 0,
    "percentage" REAL NOT NULL,
    "attendancePercentage" REAL,
    "absenceDetails" JSONB,
    "hasLowAttendance" BOOLEAN NOT NULL DEFAULT false,
    "lowAttendanceThreshold" REAL,
    "requiresIntervention" BOOLEAN NOT NULL DEFAULT false,
    "parentNotified" BOOLEAN NOT NULL DEFAULT false,
    "parentNotificationDate" DATETIME,
    "interventionPlan" TEXT,
    "requestedById" TEXT,
    "requestedByName" TEXT,
    "requestedByRole" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" DATETIME,
    "observations" TEXT,
    "teacherNotes" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'CONSULTA_FREQUENCIA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "attendance_records_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "attendance_records_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_attendance_records" ("absentDays", "classId", "createdAt", "id", "moduleType", "month", "observations", "percentage", "presentDays", "protocolId", "schoolId", "status", "studentId", "studentName", "totalDays", "updatedAt", "year") SELECT "absentDays", "classId", "createdAt", "id", "moduleType", "month", "observations", "percentage", "presentDays", "protocolId", "schoolId", "status", "studentId", "studentName", "totalDays", "updatedAt", "year" FROM "attendance_records";
DROP TABLE "attendance_records";
ALTER TABLE "new_attendance_records" RENAME TO "attendance_records";
CREATE INDEX "attendance_records_moduleType_idx" ON "attendance_records"("moduleType");
CREATE INDEX "attendance_records_protocolId_idx" ON "attendance_records"("protocolId");
CREATE INDEX "attendance_records_citizenId_idx" ON "attendance_records"("citizenId");
CREATE INDEX "attendance_records_status_idx" ON "attendance_records"("status");
CREATE INDEX "attendance_records_createdAt_idx" ON "attendance_records"("createdAt");
CREATE INDEX "attendance_records_moduleType_status_idx" ON "attendance_records"("moduleType", "status");
CREATE TABLE "new_audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_audit_logs" ("action", "citizenId", "createdAt", "details", "errorMessage", "id", "ip", "method", "resource", "success", "userAgent", "userId") SELECT "action", "citizenId", "createdAt", "details", "errorMessage", "id", "ip", "method", "resource", "success", "userAgent", "userId" FROM "audit_logs";
DROP TABLE "audit_logs";
ALTER TABLE "new_audit_logs" RENAME TO "audit_logs";
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_citizenId_idx" ON "audit_logs"("citizenId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE TABLE "new_benefit_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "benefit_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_benefit_requests" ("approvedBy", "approvedDate", "benefitType", "createdAt", "deliveredDate", "documentsProvided", "familyId", "id", "observations", "protocolId", "reason", "requestDate", "status", "updatedAt", "urgency") SELECT "approvedBy", "approvedDate", "benefitType", "createdAt", "deliveredDate", "documentsProvided", "familyId", "id", "observations", "protocolId", "reason", "requestDate", "status", "updatedAt", "urgency" FROM "benefit_requests";
DROP TABLE "benefit_requests";
ALTER TABLE "new_benefit_requests" RENAME TO "benefit_requests";
CREATE INDEX "benefit_requests_protocolId_idx" ON "benefit_requests"("protocolId");
CREATE INDEX "benefit_requests_status_idx" ON "benefit_requests"("status");
CREATE INDEX "benefit_requests_createdAt_idx" ON "benefit_requests"("createdAt");
CREATE TABLE "new_building_permits" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "building_permits_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_building_permits" ("applicantCpf", "applicantCpfCnpj", "applicantEmail", "applicantName", "applicantPhone", "approvalDate", "approvedAt", "approvedBy", "blockNumber", "builtArea", "construction", "constructionType", "createdAt", "description", "documents", "floors", "id", "issuedDate", "lotNumber", "neighborhood", "observations", "permitNumber", "permitType", "projectValue", "property", "propertyAddress", "propertyNumber", "protocolId", "requestedBy", "requirements", "reviewedAt", "reviewedBy", "status", "submissionDate", "technicalAnalysis", "totalArea", "updatedAt", "validUntil") SELECT "applicantCpf", "applicantCpfCnpj", "applicantEmail", "applicantName", "applicantPhone", "approvalDate", "approvedAt", "approvedBy", "blockNumber", "builtArea", "construction", "constructionType", "createdAt", "description", "documents", "floors", "id", "issuedDate", "lotNumber", "neighborhood", "observations", "permitNumber", "permitType", "projectValue", "property", "propertyAddress", "propertyNumber", "protocolId", "requestedBy", "requirements", "reviewedAt", "reviewedBy", "status", "submissionDate", "technicalAnalysis", "totalArea", "updatedAt", "validUntil" FROM "building_permits";
DROP TABLE "building_permits";
ALTER TABLE "new_building_permits" RENAME TO "building_permits";
CREATE INDEX "building_permits_protocolId_idx" ON "building_permits"("protocolId");
CREATE INDEX "building_permits_status_idx" ON "building_permits"("status");
CREATE INDEX "building_permits_createdAt_idx" ON "building_permits"("createdAt");
CREATE TABLE "new_business_licenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "business_licenses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_business_licenses" ("applicantCpfCnpj", "applicantEmail", "applicantName", "applicantPhone", "approvalDate", "businessActivity", "businessName", "businessType", "createdAt", "documents", "id", "issuedDate", "licenseNumber", "licenseType", "neighborhood", "observations", "propertyAddress", "propertyNumber", "protocolId", "reviewedAt", "reviewedBy", "status", "submissionDate", "technicalAnalysis", "updatedAt", "validUntil") SELECT "applicantCpfCnpj", "applicantEmail", "applicantName", "applicantPhone", "approvalDate", "businessActivity", "businessName", "businessType", "createdAt", "documents", "id", "issuedDate", "licenseNumber", "licenseType", "neighborhood", "observations", "propertyAddress", "propertyNumber", "protocolId", "reviewedAt", "reviewedBy", "status", "submissionDate", "technicalAnalysis", "updatedAt", "validUntil" FROM "business_licenses";
DROP TABLE "business_licenses";
ALTER TABLE "new_business_licenses" RENAME TO "business_licenses";
CREATE TABLE "new_camera_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "camera_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_camera_requests" ("address", "area", "cameraIds", "cameraType", "coordinates", "createdAt", "createdBy", "estimatedCost", "feasibilityStatus", "footageDelivered", "footageDeliveryDate", "footageNotes", "id", "incidentDate", "incidentDescription", "incidentTime", "installationTeam", "installedDate", "justification", "location", "metadata", "priority", "protocol", "protocolId", "purpose", "quantity", "requesterDocument", "requesterEmail", "requesterName", "requesterPhone", "requesterType", "scheduledDate", "serviceId", "source", "status", "technicalNotes", "timeRange", "type", "updatedAt") SELECT "address", "area", "cameraIds", "cameraType", "coordinates", "createdAt", "createdBy", "estimatedCost", "feasibilityStatus", "footageDelivered", "footageDeliveryDate", "footageNotes", "id", "incidentDate", "incidentDescription", "incidentTime", "installationTeam", "installedDate", "justification", "location", "metadata", "priority", "protocol", "protocolId", "purpose", "quantity", "requesterDocument", "requesterEmail", "requesterName", "requesterPhone", "requesterType", "scheduledDate", "serviceId", "source", "status", "technicalNotes", "timeRange", "type", "updatedAt" FROM "camera_requests";
DROP TABLE "camera_requests";
ALTER TABLE "new_camera_requests" RENAME TO "camera_requests";
CREATE INDEX "camera_requests_status_idx" ON "camera_requests"("status");
CREATE INDEX "camera_requests_type_idx" ON "camera_requests"("type");
CREATE TABLE "new_campaign_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "campaign_enrollments_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "health_campaigns" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_campaign_enrollments" ("campaignId", "citizenCpf", "citizenName", "createdAt", "enrolledBy", "enrollmentDate", "id", "observations", "patientBirthDate", "patientPhone", "status", "updatedAt") SELECT "campaignId", "citizenCpf", "citizenName", "createdAt", "enrolledBy", "enrollmentDate", "id", "observations", "patientBirthDate", "patientPhone", "status", "updatedAt" FROM "campaign_enrollments";
DROP TABLE "campaign_enrollments";
ALTER TABLE "new_campaign_enrollments" RENAME TO "campaign_enrollments";
CREATE TABLE "new_certificate_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "certificate_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_certificate_requests" ("applicantCpfCnpj", "applicantEmail", "applicantName", "applicantPhone", "certificateNumber", "certificateType", "createdAt", "documents", "id", "issuedDate", "neighborhood", "observations", "propertyAddress", "propertyNumber", "protocolId", "purpose", "reviewedAt", "reviewedBy", "status", "submissionDate", "updatedAt", "validUntil") SELECT "applicantCpfCnpj", "applicantEmail", "applicantName", "applicantPhone", "certificateNumber", "certificateType", "createdAt", "documents", "id", "issuedDate", "neighborhood", "observations", "propertyAddress", "propertyNumber", "protocolId", "purpose", "reviewedAt", "reviewedBy", "status", "submissionDate", "updatedAt", "validUntil" FROM "certificate_requests";
DROP TABLE "certificate_requests";
ALTER TABLE "new_certificate_requests" RENAME TO "certificate_requests";
CREATE TABLE "new_citizen_transfer_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "documents" JSONB,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "reviewNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "citizen_transfer_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "citizen_transfer_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_citizen_transfer_requests" ("citizenId", "createdAt", "documents", "id", "reason", "reviewNotes", "reviewedAt", "reviewedById", "status", "updatedAt") SELECT "citizenId", "createdAt", "documents", "id", "reason", "reviewNotes", "reviewedAt", "reviewedById", "status", "updatedAt" FROM "citizen_transfer_requests";
DROP TABLE "citizen_transfer_requests";
ALTER TABLE "new_citizen_transfer_requests" RENAME TO "citizen_transfer_requests";
CREATE TABLE "new_citizens" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cpf" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "birthDate" DATETIME,
    "address" JSONB,
    "municipioId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "password" TEXT NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedAt" DATETIME,
    "verifiedBy" TEXT,
    "verificationNotes" TEXT,
    "registrationSource" TEXT NOT NULL DEFAULT 'SELF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME
);
INSERT INTO "new_citizens" ("address", "birthDate", "cpf", "createdAt", "email", "failedLoginAttempts", "id", "isActive", "lastLogin", "lockedUntil", "name", "password", "phone", "registrationSource", "updatedAt", "verificationNotes", "verificationStatus", "verifiedAt", "verifiedBy") SELECT "address", "birthDate", "cpf", "createdAt", "email", "failedLoginAttempts", "id", "isActive", "lastLogin", "lockedUntil", "name", "password", "phone", "registrationSource", "updatedAt", "verificationNotes", "verificationStatus", "verifiedAt", "verifiedBy" FROM "citizens";
DROP TABLE "citizens";
ALTER TABLE "new_citizens" RENAME TO "citizens";
CREATE UNIQUE INDEX "citizens_cpf_key" ON "citizens"("cpf");
CREATE TABLE "new_cleaning_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "cleaning_schedules_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_cleaning_schedules" ("area", "cleaningType", "createdAt", "dayOfMonth", "dayOfWeek", "duration", "equipment", "estimatedDuration", "executionHistory", "frequency", "id", "isActive", "lastExecution", "nextExecution", "observations", "protocolId", "responsibleTeam", "startTime", "team", "teamSize", "updatedAt", "vehicle") SELECT "area", "cleaningType", "createdAt", "dayOfMonth", "dayOfWeek", "duration", "equipment", "estimatedDuration", "executionHistory", "frequency", "id", "isActive", "lastExecution", "nextExecution", "observations", "protocolId", "responsibleTeam", "startTime", "team", "teamSize", "updatedAt", "vehicle" FROM "cleaning_schedules";
DROP TABLE "cleaning_schedules";
ALTER TABLE "new_cleaning_schedules" RENAME TO "cleaning_schedules";
CREATE TABLE "new_community_health_agents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "fullName" TEXT NOT NULL,
    "agentName" TEXT,
    "cpf" TEXT NOT NULL,
    "agentCpf" TEXT,
    "phone" TEXT NOT NULL,
    "agentPhone" TEXT,
    "email" TEXT,
    "agentEmail" TEXT,
    "address" TEXT,
    "registrationNum" TEXT,
    "registrationNumber" TEXT,
    "hireDate" DATETIME NOT NULL,
    "hiringDate" DATETIME,
    "contractType" TEXT,
    "healthUnit" TEXT,
    "healthUnitId" TEXT,
    "healthUnitName" TEXT,
    "assignedArea" TEXT NOT NULL,
    "coverageArea" TEXT,
    "neighborhoods" JSONB,
    "microarea" TEXT,
    "estimatedFamilies" INTEGER NOT NULL DEFAULT 0,
    "estimatedPeople" INTEGER NOT NULL DEFAULT 0,
    "education" TEXT,
    "hasCourseCompletion" BOOLEAN NOT NULL DEFAULT false,
    "courseCompletionDate" DATETIME,
    "additionalTraining" TEXT,
    "workSchedule" JSONB,
    "weeklyHours" INTEGER NOT NULL DEFAULT 40,
    "workDays" TEXT,
    "hasTablet" BOOLEAN NOT NULL DEFAULT false,
    "hasUniform" BOOLEAN NOT NULL DEFAULT false,
    "hasBag" BOOLEAN NOT NULL DEFAULT false,
    "hasIdentificationCard" BOOLEAN NOT NULL DEFAULT false,
    "supervisor" TEXT,
    "supervisorId" TEXT,
    "supervisorName" TEXT,
    "familiesServed" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "terminationDate" DATETIME,
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'GESTAO_ACS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "community_health_agents_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_community_health_agents" ("address", "assignedArea", "cpf", "createdAt", "email", "familiesServed", "fullName", "healthUnit", "hireDate", "id", "moduleType", "observations", "phone", "protocolId", "registrationNum", "status", "supervisor", "updatedAt", "workSchedule") SELECT "address", "assignedArea", "cpf", "createdAt", "email", "familiesServed", "fullName", "healthUnit", "hireDate", "id", "moduleType", "observations", "phone", "protocolId", "registrationNum", "status", "supervisor", "updatedAt", "workSchedule" FROM "community_health_agents";
DROP TABLE "community_health_agents";
ALTER TABLE "new_community_health_agents" RENAME TO "community_health_agents";
CREATE INDEX "community_health_agents_moduleType_idx" ON "community_health_agents"("moduleType");
CREATE INDEX "community_health_agents_protocolId_idx" ON "community_health_agents"("protocolId");
CREATE INDEX "community_health_agents_citizenId_idx" ON "community_health_agents"("citizenId");
CREATE UNIQUE INDEX "community_health_agents_cpf_key" ON "community_health_agents"("cpf");
CREATE TABLE "new_competition_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "competition_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_competition_enrollments" ("ageGroup", "approvedAt", "approvedBy", "category", "coachCpf", "coachEmail", "coachName", "coachPhone", "competitionId", "competitionName", "createdAt", "enrollmentDate", "id", "observations", "paymentProof", "paymentStatus", "playersCount", "playersList", "protocolId", "rejectionReason", "serviceId", "source", "sport", "status", "teamName", "updatedAt") SELECT "ageGroup", "approvedAt", "approvedBy", "category", "coachCpf", "coachEmail", "coachName", "coachPhone", "competitionId", "competitionName", "createdAt", "enrollmentDate", "id", "observations", "paymentProof", "paymentStatus", "playersCount", "playersList", "protocolId", "rejectionReason", "serviceId", "source", "sport", "status", "teamName", "updatedAt" FROM "competition_enrollments";
DROP TABLE "competition_enrollments";
ALTER TABLE "new_competition_enrollments" RENAME TO "competition_enrollments";
CREATE TABLE "new_competitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "competitions_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "sports_modalities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "competitions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_competitions" ("ageGroup", "category", "competitionType", "contact", "createdAt", "endDate", "entryFee", "id", "location", "maxTeams", "modalityId", "name", "organizer", "prizes", "protocolId", "registeredTeams", "registrationFee", "results", "rules", "sport", "startDate", "status", "type", "updatedAt", "venue") SELECT "ageGroup", "category", "competitionType", "contact", "createdAt", "endDate", "entryFee", "id", "location", "maxTeams", "modalityId", "name", "organizer", "prizes", "protocolId", "registeredTeams", "registrationFee", "results", "rules", "sport", "startDate", "status", "type", "updatedAt", "venue" FROM "competitions";
DROP TABLE "competitions";
ALTER TABLE "new_competitions" RENAME TO "competitions";
CREATE INDEX "competitions_protocolId_idx" ON "competitions"("protocolId");
CREATE INDEX "competitions_status_idx" ON "competitions"("status");
CREATE INDEX "competitions_createdAt_idx" ON "competitions"("createdAt");
CREATE TABLE "new_critical_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "critical_points_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_critical_points" ("address", "coordinates", "createdAt", "description", "id", "incidentCount", "isActive", "lastIncident", "lastIncidentDate", "location", "monitoringLevel", "name", "observations", "patrolFrequency", "pointType", "protocolId", "recommendations", "recommendedActions", "riskLevel", "riskType", "updatedAt") SELECT "address", "coordinates", "createdAt", "description", "id", "incidentCount", "isActive", "lastIncident", "lastIncidentDate", "location", "monitoringLevel", "name", "observations", "patrolFrequency", "pointType", "protocolId", "recommendations", "recommendedActions", "riskLevel", "riskType", "updatedAt" FROM "critical_points";
DROP TABLE "critical_points";
ALTER TABLE "new_critical_points" RENAME TO "critical_points";
CREATE TABLE "new_cultural_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "cultural_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_cultural_attendances" ("attachments", "category", "citizenId", "citizenName", "contact", "createdAt", "description", "email", "estimatedAudience", "eventDate", "followUpDate", "id", "observations", "phone", "priority", "protocol", "protocolId", "requestedBudget", "requestedLocation", "responsible", "serviceId", "source", "status", "subject", "type", "updatedAt") SELECT "attachments", "category", "citizenId", "citizenName", "contact", "createdAt", "description", "email", "estimatedAudience", "eventDate", "followUpDate", "id", "observations", "phone", "priority", "protocol", "protocolId", "requestedBudget", "requestedLocation", "responsible", "serviceId", "source", "status", "subject", "type", "updatedAt" FROM "cultural_attendances";
DROP TABLE "cultural_attendances";
ALTER TABLE "new_cultural_attendances" RENAME TO "cultural_attendances";
CREATE UNIQUE INDEX "cultural_attendances_protocol_key" ON "cultural_attendances"("protocol");
CREATE INDEX "cultural_attendances_protocolId_idx" ON "cultural_attendances"("protocolId");
CREATE INDEX "cultural_attendances_status_idx" ON "cultural_attendances"("status");
CREATE INDEX "cultural_attendances_createdAt_idx" ON "cultural_attendances"("createdAt");
CREATE TABLE "new_cultural_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "cultural_events_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "cultural_spaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_cultural_events" ("address", "ageRating", "approved", "approvedAt", "approvedBy", "attendance", "capacity", "category", "contact", "coordinates", "createdAt", "description", "duration", "endDate", "expenses", "freeEvent", "guests", "id", "media", "observations", "organizer", "performers", "photos", "producer", "projectId", "promotion", "protocol", "protocolId", "requirements", "revenue", "reviews", "schedule", "serviceId", "setup", "socialMedia", "source", "spaceId", "startDate", "status", "targetAudience", "technical", "ticketPrice", "title", "type", "updatedAt", "venue", "videos", "website") SELECT "address", "ageRating", "approved", "approvedAt", "approvedBy", "attendance", "capacity", "category", "contact", "coordinates", "createdAt", "description", "duration", "endDate", "expenses", "freeEvent", "guests", "id", "media", "observations", "organizer", "performers", "photos", "producer", "projectId", "promotion", "protocol", "protocolId", "requirements", "revenue", "reviews", "schedule", "serviceId", "setup", "socialMedia", "source", "spaceId", "startDate", "status", "targetAudience", "technical", "ticketPrice", "title", "type", "updatedAt", "venue", "videos", "website" FROM "cultural_events";
DROP TABLE "cultural_events";
ALTER TABLE "new_cultural_events" RENAME TO "cultural_events";
CREATE INDEX "cultural_events_category_idx" ON "cultural_events"("category");
CREATE INDEX "cultural_events_status_idx" ON "cultural_events"("status");
CREATE INDEX "cultural_events_startDate_idx" ON "cultural_events"("startDate");
CREATE INDEX "cultural_events_spaceId_idx" ON "cultural_events"("spaceId");
CREATE INDEX "cultural_events_freeEvent_idx" ON "cultural_events"("freeEvent");
CREATE INDEX "cultural_events_protocolId_idx" ON "cultural_events"("protocolId");
CREATE INDEX "cultural_events_createdAt_idx" ON "cultural_events"("createdAt");
CREATE TABLE "new_cultural_manifestations" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "cultural_manifestations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_cultural_manifestations" ("createdAt", "currentSituation", "description", "id", "knowledgeHolders", "name", "protocolId", "safeguardActions", "status", "type", "updatedAt") SELECT "createdAt", "currentSituation", "description", "id", "knowledgeHolders", "name", "protocolId", "safeguardActions", "status", "type", "updatedAt" FROM "cultural_manifestations";
DROP TABLE "cultural_manifestations";
ALTER TABLE "new_cultural_manifestations" RENAME TO "cultural_manifestations";
CREATE TABLE "new_cultural_project_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "cultural_project_submissions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_cultural_project_submissions" ("attachments", "budget", "cpf", "createdAt", "description", "email", "endDate", "expectedImpact", "fundingSource", "id", "organization", "phone", "projectName", "projectType", "protocolId", "responsible", "reviewComments", "reviewedAt", "startDate", "status", "submittedAt", "targetAudience", "updatedAt") SELECT "attachments", "budget", "cpf", "createdAt", "description", "email", "endDate", "expectedImpact", "fundingSource", "id", "organization", "phone", "projectName", "projectType", "protocolId", "responsible", "reviewComments", "reviewedAt", "startDate", "status", "submittedAt", "targetAudience", "updatedAt" FROM "cultural_project_submissions";
DROP TABLE "cultural_project_submissions";
ALTER TABLE "new_cultural_project_submissions" RENAME TO "cultural_project_submissions";
CREATE TABLE "new_cultural_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "cultural_projects_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_cultural_projects" ("budget", "contact", "createdAt", "currentStatus", "description", "endDate", "funding", "id", "name", "participants", "protocol", "protocolId", "responsible", "serviceId", "source", "startDate", "status", "targetAudience", "type", "updatedAt") SELECT "budget", "contact", "createdAt", "currentStatus", "description", "endDate", "funding", "id", "name", "participants", "protocol", "protocolId", "responsible", "serviceId", "source", "startDate", "status", "targetAudience", "type", "updatedAt" FROM "cultural_projects";
DROP TABLE "cultural_projects";
ALTER TABLE "new_cultural_projects" RENAME TO "cultural_projects";
CREATE INDEX "cultural_projects_protocolId_idx" ON "cultural_projects"("protocolId");
CREATE INDEX "cultural_projects_status_idx" ON "cultural_projects"("status");
CREATE INDEX "cultural_projects_createdAt_idx" ON "cultural_projects"("createdAt");
CREATE TABLE "new_cultural_space_reservations" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "cultural_space_reservations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_cultural_space_reservations" ("approvedAt", "cpf", "createdAt", "description", "email", "endDate", "endTime", "equipment", "eventName", "eventType", "expectedPeople", "id", "needsEquipment", "observations", "phone", "protocolId", "requestedAt", "requesterName", "spaceId", "spaceName", "startDate", "startTime", "status", "updatedAt") SELECT "approvedAt", "cpf", "createdAt", "description", "email", "endDate", "endTime", "equipment", "eventName", "eventType", "expectedPeople", "id", "needsEquipment", "observations", "phone", "protocolId", "requestedAt", "requesterName", "spaceId", "spaceName", "startDate", "startTime", "status", "updatedAt" FROM "cultural_space_reservations";
DROP TABLE "cultural_space_reservations";
ALTER TABLE "new_cultural_space_reservations" RENAME TO "cultural_space_reservations";
CREATE TABLE "new_cultural_spaces" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_cultural_spaces" ("accessibility", "address", "amenities", "area", "available", "capacity", "code", "contact", "coordinates", "createdAt", "dailyRate", "description", "documents", "equipment", "freeUse", "hourlyRate", "id", "infrastructure", "isActive", "manager", "name", "neighborhood", "observations", "operatingHours", "photos", "protocol", "rooms", "serviceId", "source", "status", "type", "updatedAt", "zipCode") SELECT "accessibility", "address", "amenities", "area", "available", "capacity", "code", "contact", "coordinates", "createdAt", "dailyRate", "description", "documents", "equipment", "freeUse", "hourlyRate", "id", "infrastructure", "isActive", "manager", "name", "neighborhood", "observations", "operatingHours", "photos", "protocol", "rooms", "serviceId", "source", "status", "type", "updatedAt", "zipCode" FROM "cultural_spaces";
DROP TABLE "cultural_spaces";
ALTER TABLE "new_cultural_spaces" RENAME TO "cultural_spaces";
CREATE INDEX "cultural_spaces_type_idx" ON "cultural_spaces"("type");
CREATE INDEX "cultural_spaces_status_idx" ON "cultural_spaces"("status");
CREATE INDEX "cultural_spaces_available_idx" ON "cultural_spaces"("available");
CREATE INDEX "cultural_spaces_neighborhood_idx" ON "cultural_spaces"("neighborhood");
CREATE UNIQUE INDEX "cultural_spaces_code_key" ON "cultural_spaces"("code");
CREATE TABLE "new_cultural_workshop_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "workshopId" TEXT NOT NULL,
    "citizenId" TEXT,
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
    "customData" JSONB,
    "documents" JSONB,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'INSCRICAO_OFICINA_CULTURAL',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cultural_workshop_enrollments_workshopId_fkey" FOREIGN KEY ("workshopId") REFERENCES "cultural_workshops" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cultural_workshop_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cultural_workshop_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_cultural_workshop_enrollments" ("address", "approvedAt", "birthDate", "citizenName", "cpf", "createdAt", "email", "enrolledAt", "experience", "hasExperience", "id", "motivation", "phone", "protocolId", "status", "updatedAt", "workshopId") SELECT "address", "approvedAt", "birthDate", "citizenName", "cpf", "createdAt", "email", "enrolledAt", "experience", "hasExperience", "id", "motivation", "phone", "protocolId", "status", "updatedAt", "workshopId" FROM "cultural_workshop_enrollments";
DROP TABLE "cultural_workshop_enrollments";
ALTER TABLE "new_cultural_workshop_enrollments" RENAME TO "cultural_workshop_enrollments";
CREATE INDEX "cultural_workshop_enrollments_workshopId_idx" ON "cultural_workshop_enrollments"("workshopId");
CREATE INDEX "cultural_workshop_enrollments_status_idx" ON "cultural_workshop_enrollments"("status");
CREATE INDEX "cultural_workshop_enrollments_moduleType_idx" ON "cultural_workshop_enrollments"("moduleType");
CREATE INDEX "cultural_workshop_enrollments_protocolId_idx" ON "cultural_workshop_enrollments"("protocolId");
CREATE INDEX "cultural_workshop_enrollments_createdAt_idx" ON "cultural_workshop_enrollments"("createdAt");
CREATE TABLE "new_cultural_workshops" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "customFields" JSONB,
    "requiredDocuments" JSONB,
    "enrollmentSettings" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_cultural_workshops" ("category", "createdAt", "currentParticipants", "description", "endDate", "id", "instructor", "isFree", "maxParticipants", "name", "schedule", "startDate", "status", "updatedAt") SELECT "category", "createdAt", "currentParticipants", "description", "endDate", "id", "instructor", "isFree", "maxParticipants", "name", "schedule", "startDate", "status", "updatedAt" FROM "cultural_workshops";
DROP TABLE "cultural_workshops";
ALTER TABLE "new_cultural_workshops" RENAME TO "cultural_workshops";
CREATE TABLE "new_custom_data_tables" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_custom_data_tables" ("allowCreate", "allowDelete", "allowUpdate", "createdAt", "description", "displayName", "fields", "id", "moduleType", "schema", "tableName", "updatedAt") SELECT "allowCreate", "allowDelete", "allowUpdate", "createdAt", "description", "displayName", "fields", "id", "moduleType", "schema", "tableName", "updatedAt" FROM "custom_data_tables";
DROP TABLE "custom_data_tables";
ALTER TABLE "new_custom_data_tables" RENAME TO "custom_data_tables";
CREATE UNIQUE INDEX "custom_data_tables_tableName_key" ON "custom_data_tables"("tableName");
CREATE TABLE "new_dashboards" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_dashboards" ("createdAt", "createdBy", "department", "description", "id", "isActive", "isDefault", "layout", "name", "refreshRate", "updatedAt", "userLevel") SELECT "createdAt", "createdBy", "department", "description", "id", "isActive", "isDefault", "layout", "name", "refreshRate", "updatedAt", "userLevel" FROM "dashboards";
DROP TABLE "dashboards";
ALTER TABLE "new_dashboards" RENAME TO "dashboards";
CREATE INDEX "dashboards_userLevel_isActive_idx" ON "dashboards"("userLevel", "isActive");
CREATE INDEX "dashboards_createdBy_idx" ON "dashboards"("createdBy");
CREATE TABLE "new_department_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_department_metrics" ("activeProtocols", "avgCompletionTime", "avgWorkload", "completedProtocols", "createdAt", "departmentId", "id", "metadata", "periodDate", "periodType", "protocolsPerServer", "satisfactionScore", "slaComplianceRate", "totalProtocols", "updatedAt") SELECT "activeProtocols", "avgCompletionTime", "avgWorkload", "completedProtocols", "createdAt", "departmentId", "id", "metadata", "periodDate", "periodType", "protocolsPerServer", "satisfactionScore", "slaComplianceRate", "totalProtocols", "updatedAt" FROM "department_metrics";
DROP TABLE "department_metrics";
ALTER TABLE "new_department_metrics" RENAME TO "department_metrics";
CREATE INDEX "department_metrics_departmentId_periodType_idx" ON "department_metrics"("departmentId", "periodType");
CREATE UNIQUE INDEX "department_metrics_departmentId_periodType_periodDate_key" ON "department_metrics"("departmentId", "periodType", "periodDate");
CREATE TABLE "new_disciplinary_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "incidentDate" DATETIME NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
    "parentNotificationDate" DATETIME,
    "disciplinaryAction" TEXT,
    "measures" TEXT NOT NULL,
    "suspensionDays" INTEGER NOT NULL DEFAULT 0,
    "suspensionStartDate" DATETIME,
    "suspensionEndDate" DATETIME,
    "requiresFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "followUpResponsible" TEXT,
    "reportedById" TEXT,
    "reportedByName" TEXT,
    "reportedByRole" TEXT,
    "reportedBy" TEXT,
    "responsibleTeacher" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" DATETIME,
    "observations" TEXT,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "disciplinary_records_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "disciplinary_records_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_disciplinary_records" ("actions_taken", "createdAt", "date", "description", "id", "incidentDate", "incidentType", "location", "measures", "observations", "parentNotified", "protocolId", "reportedBy", "resolved", "responsibleTeacher", "schoolId", "severity", "status", "studentId", "time", "updatedAt", "witnesses") SELECT "actions_taken", "createdAt", "date", "description", "id", "incidentDate", "incidentType", "location", "measures", "observations", "parentNotified", "protocolId", "reportedBy", "resolved", "responsibleTeacher", "schoolId", "severity", "status", "studentId", "time", "updatedAt", "witnesses" FROM "disciplinary_records";
DROP TABLE "disciplinary_records";
ALTER TABLE "new_disciplinary_records" RENAME TO "disciplinary_records";
CREATE INDEX "disciplinary_records_citizenId_idx" ON "disciplinary_records"("citizenId");
CREATE TABLE "new_drainage_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "drainage_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_drainage_requests" ("address", "affectedArea", "assignedTeam", "citizenId", "completionDate", "contact", "coordinates", "createdAt", "description", "equipmentUsed", "id", "location", "materialsUsed", "observations", "photos", "preferredDate", "problemType", "protocolId", "requestDate", "requestorCpf", "requestorName", "satisfaction", "scheduledDate", "severity", "status", "updatedAt", "urgency", "waterLevel", "workDetails", "workHours") SELECT "address", "affectedArea", "assignedTeam", "citizenId", "completionDate", "contact", "coordinates", "createdAt", "description", "equipmentUsed", "id", "location", "materialsUsed", "observations", "photos", "preferredDate", "problemType", "protocolId", "requestDate", "requestorCpf", "requestorName", "satisfaction", "scheduledDate", "severity", "status", "updatedAt", "urgency", "waterLevel", "workDetails", "workHours" FROM "drainage_requests";
DROP TABLE "drainage_requests";
ALTER TABLE "new_drainage_requests" RENAME TO "drainage_requests";
CREATE TABLE "new_education_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT NOT NULL,
    "citizenPhone" TEXT,
    "citizenEmail" TEXT,
    "attendanceType" TEXT,
    "category" TEXT,
    "serviceType" TEXT NOT NULL,
    "studentName" TEXT,
    "studentCpf" TEXT,
    "studentBirthDate" DATETIME,
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
    "scheduledDate" DATETIME,
    "completedDate" DATETIME,
    "startedAt" DATETIME,
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'ATENDIMENTOS_EDUCACAO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "education_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "education_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_education_attendances" ("citizenCpf", "citizenEmail", "citizenName", "citizenPhone", "completedDate", "createdAt", "description", "id", "moduleType", "observations", "priority", "protocolId", "scheduledDate", "serviceType", "status", "updatedAt") SELECT "citizenCpf", "citizenEmail", "citizenName", "citizenPhone", "completedDate", "createdAt", "description", "id", "moduleType", "observations", "priority", "protocolId", "scheduledDate", "serviceType", "status", "updatedAt" FROM "education_attendances";
DROP TABLE "education_attendances";
ALTER TABLE "new_education_attendances" RENAME TO "education_attendances";
CREATE INDEX "education_attendances_moduleType_idx" ON "education_attendances"("moduleType");
CREATE INDEX "education_attendances_protocolId_idx" ON "education_attendances"("protocolId");
CREATE INDEX "education_attendances_citizenId_idx" ON "education_attendances"("citizenId");
CREATE TABLE "new_email_servers" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_email_servers" ("certPath", "createdAt", "hostname", "id", "isActive", "isPremiumService", "keyPath", "maxEmailsPerMonth", "monthlyPrice", "mxPort", "submissionPort", "tlsEnabled", "updatedAt") SELECT "certPath", "createdAt", "hostname", "id", "isActive", "isPremiumService", "keyPath", "maxEmailsPerMonth", "monthlyPrice", "mxPort", "submissionPort", "tlsEnabled", "updatedAt" FROM "email_servers";
DROP TABLE "email_servers";
ALTER TABLE "new_email_servers" RENAME TO "email_servers";
CREATE TABLE "new_email_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "textContent" TEXT,
    "variables" JSONB,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_email_templates" ("category", "createdAt", "htmlContent", "id", "isActive", "name", "subject", "textContent", "updatedAt", "variables") SELECT "category", "createdAt", "htmlContent", "id", "isActive", "name", "subject", "textContent", "updatedAt", "variables" FROM "email_templates";
DROP TABLE "email_templates";
ALTER TABLE "new_email_templates" RENAME TO "email_templates";
CREATE UNIQUE INDEX "email_templates_name_key" ON "email_templates"("name");
CREATE TABLE "new_emergency_deliveries" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "emergency_deliveries_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_emergency_deliveries" ("benefitRequestId", "citizenId", "createdAt", "deliveredBy", "deliveryDate", "deliveryType", "id", "observations", "protocolId", "quantity", "recipientName", "recipientSignature", "status", "updatedAt", "urgency") SELECT "benefitRequestId", "citizenId", "createdAt", "deliveredBy", "deliveryDate", "deliveryType", "id", "observations", "protocolId", "quantity", "recipientName", "recipientSignature", "status", "updatedAt", "urgency" FROM "emergency_deliveries";
DROP TABLE "emergency_deliveries";
ALTER TABLE "new_emergency_deliveries" RENAME TO "emergency_deliveries";
CREATE TABLE "new_environmental_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "environmental_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_environmental_attendances" ("analyst", "category", "citizenCpf", "citizenId", "citizenName", "contact", "createdAt", "description", "evidence", "followUpDate", "id", "location", "protocol", "protocolId", "recommendation", "resolution", "satisfaction", "serviceType", "status", "subject", "technicalOpinion", "updatedAt", "urgency") SELECT "analyst", "category", "citizenCpf", "citizenId", "citizenName", "contact", "createdAt", "description", "evidence", "followUpDate", "id", "location", "protocol", "protocolId", "recommendation", "resolution", "satisfaction", "serviceType", "status", "subject", "technicalOpinion", "updatedAt", "urgency" FROM "environmental_attendances";
DROP TABLE "environmental_attendances";
ALTER TABLE "new_environmental_attendances" RENAME TO "environmental_attendances";
CREATE UNIQUE INDEX "environmental_attendances_protocol_key" ON "environmental_attendances"("protocol");
CREATE INDEX "environmental_attendances_protocolId_idx" ON "environmental_attendances"("protocolId");
CREATE INDEX "environmental_attendances_status_idx" ON "environmental_attendances"("status");
CREATE INDEX "environmental_attendances_createdAt_idx" ON "environmental_attendances"("createdAt");
CREATE TABLE "new_environmental_complaints" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "environmental_complaints_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_environmental_complaints" ("actions", "actionsTaken", "assignedTo", "complainantEmail", "complainantName", "complainantPhone", "complaintType", "coordinates", "createdAt", "description", "evidence", "findings", "followUp", "id", "inspectionDate", "inspector", "investigationDate", "investigationReport", "investigatorId", "isAnonymous", "location", "occurrenceDate", "penalty", "photos", "priority", "protocol", "protocolId", "reportDate", "reporterEmail", "reporterName", "reporterPhone", "resolution", "resolvedAt", "resolvedBy", "serviceId", "severity", "source", "status", "updatedAt") SELECT "actions", "actionsTaken", "assignedTo", "complainantEmail", "complainantName", "complainantPhone", "complaintType", "coordinates", "createdAt", "description", "evidence", "findings", "followUp", "id", "inspectionDate", "inspector", "investigationDate", "investigationReport", "investigatorId", "isAnonymous", "location", "occurrenceDate", "penalty", "photos", "priority", "protocol", "protocolId", "reportDate", "reporterEmail", "reporterName", "reporterPhone", "resolution", "resolvedAt", "resolvedBy", "serviceId", "severity", "source", "status", "updatedAt" FROM "environmental_complaints";
DROP TABLE "environmental_complaints";
ALTER TABLE "new_environmental_complaints" RENAME TO "environmental_complaints";
CREATE UNIQUE INDEX "environmental_complaints_protocol_key" ON "environmental_complaints"("protocol");
CREATE INDEX "environmental_complaints_protocolId_idx" ON "environmental_complaints"("protocolId");
CREATE INDEX "environmental_complaints_status_idx" ON "environmental_complaints"("status");
CREATE INDEX "environmental_complaints_createdAt_idx" ON "environmental_complaints"("createdAt");
CREATE TABLE "new_environmental_inspections" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "environmental_inspections_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_environmental_inspections" ("coordinates", "correctiveActions", "createdAt", "evidence", "findings", "followUpDate", "followUpRequired", "id", "inspectionDate", "inspectionNumber", "inspectionType", "inspector", "inspectorTeam", "location", "nonCompliances", "observations", "penalties", "photos", "priority", "protocolId", "recommendations", "relatedComplaintId", "relatedLicenseId", "report", "reportDate", "reportedViolations", "scheduledDate", "status", "subject", "updatedAt") SELECT "coordinates", "correctiveActions", "createdAt", "evidence", "findings", "followUpDate", "followUpRequired", "id", "inspectionDate", "inspectionNumber", "inspectionType", "inspector", "inspectorTeam", "location", "nonCompliances", "observations", "penalties", "photos", "priority", "protocolId", "recommendations", "relatedComplaintId", "relatedLicenseId", "report", "reportDate", "reportedViolations", "scheduledDate", "status", "subject", "updatedAt" FROM "environmental_inspections";
DROP TABLE "environmental_inspections";
ALTER TABLE "new_environmental_inspections" RENAME TO "environmental_inspections";
CREATE UNIQUE INDEX "environmental_inspections_inspectionNumber_key" ON "environmental_inspections"("inspectionNumber");
CREATE TABLE "new_environmental_licenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "environmental_licenses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_environmental_licenses" ("activity", "activityType", "analysisDate", "analyst", "applicantCpf", "applicantDocument", "applicantEmail", "applicantName", "applicantPhone", "applicationDate", "approvedAt", "approvedBy", "area", "businessName", "conditions", "coordinates", "createdAt", "description", "documents", "expiryDate", "fee", "id", "inspections", "issueDate", "licenseNumber", "licenseType", "location", "observations", "protocolId", "protocolNumber", "reviewedAt", "reviewedBy", "serviceId", "source", "status", "technicalOpinion", "technicalReport", "updatedAt", "validFrom", "validUntil") SELECT "activity", "activityType", "analysisDate", "analyst", "applicantCpf", "applicantDocument", "applicantEmail", "applicantName", "applicantPhone", "applicationDate", "approvedAt", "approvedBy", "area", "businessName", "conditions", "coordinates", "createdAt", "description", "documents", "expiryDate", "fee", "id", "inspections", "issueDate", "licenseNumber", "licenseType", "location", "observations", "protocolId", "protocolNumber", "reviewedAt", "reviewedBy", "serviceId", "source", "status", "technicalOpinion", "technicalReport", "updatedAt", "validFrom", "validUntil" FROM "environmental_licenses";
DROP TABLE "environmental_licenses";
ALTER TABLE "new_environmental_licenses" RENAME TO "environmental_licenses";
CREATE UNIQUE INDEX "environmental_licenses_licenseNumber_key" ON "environmental_licenses"("licenseNumber");
CREATE INDEX "environmental_licenses_protocolId_idx" ON "environmental_licenses"("protocolId");
CREATE INDEX "environmental_licenses_status_idx" ON "environmental_licenses"("status");
CREATE INDEX "environmental_licenses_createdAt_idx" ON "environmental_licenses"("createdAt");
CREATE TABLE "new_environmental_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "environmental_programs_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_environmental_programs" ("activities", "beneficiaries", "budget", "coordinator", "createdAt", "description", "endDate", "evaluation", "id", "indicators", "isActive", "name", "objectives", "partnerships", "programType", "protocolId", "reports", "results", "startDate", "status", "targetAudience", "updatedAt") SELECT "activities", "beneficiaries", "budget", "coordinator", "createdAt", "description", "endDate", "evaluation", "id", "indicators", "isActive", "name", "objectives", "partnerships", "programType", "protocolId", "reports", "results", "startDate", "status", "targetAudience", "updatedAt" FROM "environmental_programs";
DROP TABLE "environmental_programs";
ALTER TABLE "new_environmental_programs" RENAME TO "environmental_programs";
CREATE TABLE "new_event_authorizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_event_authorizations" ("address", "analysisNotes", "approvedAt", "approvedBy", "assignedOfficers", "assignedUnits", "conditions", "coordinates", "coordinatorOfficer", "createdAt", "createdBy", "deniedReason", "description", "documents", "endTime", "eventDate", "eventName", "eventType", "expectedAttendees", "hasAlcohol", "hasSound", "id", "insurance", "isPublicSpace", "location", "metadata", "needsPoliceSupport", "organizerDocument", "organizerEmail", "organizerName", "organizerPhone", "organizerType", "privateSecurityCount", "protocol", "requestedOfficers", "requirements", "securityPlan", "serviceId", "setupDate", "setupTime", "soundLevel", "source", "startTime", "status", "teardownTime", "updatedAt", "venue") SELECT "address", "analysisNotes", "approvedAt", "approvedBy", "assignedOfficers", "assignedUnits", "conditions", "coordinates", "coordinatorOfficer", "createdAt", "createdBy", "deniedReason", "description", "documents", "endTime", "eventDate", "eventName", "eventType", "expectedAttendees", "hasAlcohol", "hasSound", "id", "insurance", "isPublicSpace", "location", "metadata", "needsPoliceSupport", "organizerDocument", "organizerEmail", "organizerName", "organizerPhone", "organizerType", "privateSecurityCount", "protocol", "requestedOfficers", "requirements", "securityPlan", "serviceId", "setupDate", "setupTime", "soundLevel", "source", "startTime", "status", "teardownTime", "updatedAt", "venue" FROM "event_authorizations";
DROP TABLE "event_authorizations";
ALTER TABLE "new_event_authorizations" RENAME TO "event_authorizations";
CREATE INDEX "event_authorizations_status_idx" ON "event_authorizations"("status");
CREATE INDEX "event_authorizations_eventDate_idx" ON "event_authorizations"("eventDate");
CREATE TABLE "new_family_compositions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "headId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "isDependent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "family_compositions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "citizens" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "family_compositions_headId_fkey" FOREIGN KEY ("headId") REFERENCES "citizens" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_family_compositions" ("createdAt", "headId", "id", "isDependent", "memberId", "relationship", "updatedAt") SELECT "createdAt", "headId", "id", "isDependent", "memberId", "relationship", "updatedAt" FROM "family_compositions";
DROP TABLE "family_compositions";
ALTER TABLE "new_family_compositions" RENAME TO "family_compositions";
CREATE UNIQUE INDEX "family_compositions_headId_memberId_key" ON "family_compositions"("headId", "memberId");
CREATE TABLE "new_farmer_market_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_farmer_market_registrations" ("approvedAt", "approvedBy", "certificationId", "createdAt", "documents", "hasOrganicCert", "id", "inspectedBy", "inspectionDate", "needsStall", "producerCpf", "producerEmail", "producerName", "producerPhone", "productionType", "products", "propertyArea", "propertyLocation", "protocol", "registrationNumber", "serviceId", "source", "stallPreference", "status", "updatedAt", "validFrom", "validUntil") SELECT "approvedAt", "approvedBy", "certificationId", "createdAt", "documents", "hasOrganicCert", "id", "inspectedBy", "inspectionDate", "needsStall", "producerCpf", "producerEmail", "producerName", "producerPhone", "productionType", "products", "propertyArea", "propertyLocation", "protocol", "registrationNumber", "serviceId", "source", "stallPreference", "status", "updatedAt", "validFrom", "validUntil" FROM "farmer_market_registrations";
DROP TABLE "farmer_market_registrations";
ALTER TABLE "new_farmer_market_registrations" RENAME TO "farmer_market_registrations";
CREATE UNIQUE INDEX "farmer_market_registrations_registrationNumber_key" ON "farmer_market_registrations"("registrationNumber");
CREATE INDEX "farmer_market_registrations_protocol_idx" ON "farmer_market_registrations"("protocol");
CREATE INDEX "farmer_market_registrations_status_idx" ON "farmer_market_registrations"("status");
CREATE TABLE "new_grade_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "grade" REAL NOT NULL,
    "maxGrade" REAL NOT NULL DEFAULT 10,
    "subjects" JSONB,
    "totalSubjects" INTEGER NOT NULL DEFAULT 0,
    "averageGrade" REAL,
    "passedSubjects" INTEGER NOT NULL DEFAULT 0,
    "failedSubjects" INTEGER NOT NULL DEFAULT 0,
    "passingGrade" REAL NOT NULL DEFAULT 6.0,
    "studentStatus" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "hasRecovery" BOOLEAN NOT NULL DEFAULT false,
    "recoverySubjects" JSONB,
    "overallAttendancePercentage" REAL,
    "teacherComments" TEXT,
    "councilComments" TEXT,
    "teacherName" TEXT,
    "requestedById" TEXT,
    "requestedByName" TEXT,
    "requestedByRole" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" DATETIME,
    "observations" TEXT,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "grade_records_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "grade_records_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_grade_records" ("classId", "createdAt", "grade", "id", "maxGrade", "observations", "period", "protocolId", "schoolId", "status", "studentId", "studentName", "subject", "teacherName", "updatedAt") SELECT "classId", "createdAt", "grade", "id", "maxGrade", "observations", "period", "protocolId", "schoolId", "status", "studentId", "studentName", "subject", "teacherName", "updatedAt" FROM "grade_records";
DROP TABLE "grade_records";
ALTER TABLE "new_grade_records" RENAME TO "grade_records";
CREATE INDEX "grade_records_protocolId_idx" ON "grade_records"("protocolId");
CREATE INDEX "grade_records_citizenId_idx" ON "grade_records"("citizenId");
CREATE INDEX "grade_records_status_idx" ON "grade_records"("status");
CREATE INDEX "grade_records_createdAt_idx" ON "grade_records"("createdAt");
CREATE TABLE "new_health_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "moduleType" TEXT NOT NULL DEFAULT 'AGENDAMENTOS_MEDICOS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_appointments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "health_appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "health_doctors" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_health_appointments" ("appointmentDate", "appointmentTime", "createdAt", "diagnosis", "doctorId", "followUpDate", "id", "moduleType", "observations", "patientBirthDate", "patientCpf", "patientName", "patientPhone", "priority", "protocolId", "speciality", "status", "symptoms", "treatment", "updatedAt") SELECT "appointmentDate", "appointmentTime", "createdAt", "diagnosis", "doctorId", "followUpDate", "id", "moduleType", "observations", "patientBirthDate", "patientCpf", "patientName", "patientPhone", "priority", "protocolId", "speciality", "status", "symptoms", "treatment", "updatedAt" FROM "health_appointments";
DROP TABLE "health_appointments";
ALTER TABLE "new_health_appointments" RENAME TO "health_appointments";
CREATE INDEX "health_appointments_moduleType_idx" ON "health_appointments"("moduleType");
CREATE INDEX "health_appointments_protocolId_idx" ON "health_appointments"("protocolId");
CREATE INDEX "health_appointments_status_idx" ON "health_appointments"("status");
CREATE INDEX "health_appointments_createdAt_idx" ON "health_appointments"("createdAt");
CREATE INDEX "health_appointments_moduleType_status_idx" ON "health_appointments"("moduleType", "status");
CREATE TABLE "new_health_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "moduleType" TEXT NOT NULL DEFAULT 'ATENDIMENTOS_SAUDE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_health_attendances" ("appointmentDate", "attachments", "citizenCPF", "citizenName", "contact", "createdAt", "description", "id", "medicalUnit", "moduleType", "observations", "priority", "protocol", "protocolId", "responsible", "status", "symptoms", "type", "updatedAt", "urgency") SELECT "appointmentDate", "attachments", "citizenCPF", "citizenName", "contact", "createdAt", "description", "id", "medicalUnit", "moduleType", "observations", "priority", "protocol", "protocolId", "responsible", "status", "symptoms", "type", "updatedAt", "urgency" FROM "health_attendances";
DROP TABLE "health_attendances";
ALTER TABLE "new_health_attendances" RENAME TO "health_attendances";
CREATE UNIQUE INDEX "health_attendances_protocol_key" ON "health_attendances"("protocol");
CREATE INDEX "health_attendances_moduleType_idx" ON "health_attendances"("moduleType");
CREATE INDEX "health_attendances_protocolId_idx" ON "health_attendances"("protocolId");
CREATE INDEX "health_attendances_status_idx" ON "health_attendances"("status");
CREATE INDEX "health_attendances_createdAt_idx" ON "health_attendances"("createdAt");
CREATE INDEX "health_attendances_moduleType_status_idx" ON "health_attendances"("moduleType", "status");
CREATE TABLE "new_health_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "moduleType" TEXT NOT NULL DEFAULT 'CAMPANHAS_SAUDE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_campaigns_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_health_campaigns" ("budget", "campaignType", "coordinatorName", "createdAt", "description", "endDate", "goals", "id", "isActive", "moduleType", "name", "protocolId", "results", "startDate", "status", "targetAudience", "updatedAt") SELECT "budget", "campaignType", "coordinatorName", "createdAt", "description", "endDate", "goals", "id", "isActive", "moduleType", "name", "protocolId", "results", "startDate", "status", "targetAudience", "updatedAt" FROM "health_campaigns";
DROP TABLE "health_campaigns";
ALTER TABLE "new_health_campaigns" RENAME TO "health_campaigns";
CREATE INDEX "health_campaigns_moduleType_idx" ON "health_campaigns"("moduleType");
CREATE INDEX "health_campaigns_protocolId_idx" ON "health_campaigns"("protocolId");
CREATE TABLE "new_health_doctors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "crm" TEXT NOT NULL,
    "speciality" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "schedule" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_health_doctors" ("createdAt", "crm", "email", "id", "isActive", "name", "phone", "schedule", "speciality", "updatedAt") SELECT "createdAt", "crm", "email", "id", "isActive", "name", "phone", "schedule", "speciality", "updatedAt" FROM "health_doctors";
DROP TABLE "health_doctors";
ALTER TABLE "new_health_doctors" RENAME TO "health_doctors";
CREATE UNIQUE INDEX "health_doctors_crm_key" ON "health_doctors"("crm");
CREATE TABLE "new_health_exams" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "moduleType" TEXT NOT NULL DEFAULT 'EXAMES',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_exams_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_health_exams" ("attachments", "createdAt", "examName", "examType", "healthUnit", "id", "moduleType", "observations", "patientCpf", "patientName", "patientPhone", "priority", "protocolId", "requestDate", "requestedBy", "result", "resultDate", "scheduledDate", "status", "updatedAt") SELECT "attachments", "createdAt", "examName", "examType", "healthUnit", "id", "moduleType", "observations", "patientCpf", "patientName", "patientPhone", "priority", "protocolId", "requestDate", "requestedBy", "result", "resultDate", "scheduledDate", "status", "updatedAt" FROM "health_exams";
DROP TABLE "health_exams";
ALTER TABLE "new_health_exams" RENAME TO "health_exams";
CREATE INDEX "health_exams_moduleType_idx" ON "health_exams"("moduleType");
CREATE INDEX "health_exams_protocolId_idx" ON "health_exams"("protocolId");
CREATE TABLE "new_health_professionals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "crm" TEXT,
    "specialtyId" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "schedule" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_professionals_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "medical_specialties" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_health_professionals" ("createdAt", "crm", "email", "id", "isActive", "name", "phone", "schedule", "specialtyId", "updatedAt") SELECT "createdAt", "crm", "email", "id", "isActive", "name", "phone", "schedule", "specialtyId", "updatedAt" FROM "health_professionals";
DROP TABLE "health_professionals";
ALTER TABLE "new_health_professionals" RENAME TO "health_professionals";
CREATE UNIQUE INDEX "health_professionals_crm_key" ON "health_professionals"("crm");
CREATE TABLE "new_health_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "moduleType" TEXT NOT NULL DEFAULT 'PROGRAMAS_SAUDE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_programs_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_health_programs" ("budget", "coordinatorName", "createdAt", "description", "endDate", "goals", "id", "moduleType", "name", "observations", "participants", "programType", "protocolId", "startDate", "status", "targetAudience", "updatedAt") SELECT "budget", "coordinatorName", "createdAt", "description", "endDate", "goals", "id", "moduleType", "name", "observations", "participants", "programType", "protocolId", "startDate", "status", "targetAudience", "updatedAt" FROM "health_programs";
DROP TABLE "health_programs";
ALTER TABLE "new_health_programs" RENAME TO "health_programs";
CREATE INDEX "health_programs_moduleType_idx" ON "health_programs"("moduleType");
CREATE INDEX "health_programs_protocolId_idx" ON "health_programs"("protocolId");
CREATE TABLE "new_health_transport_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientCpf" TEXT NOT NULL,
    "patientPhone" TEXT,
    "patientBirthDate" DATETIME,
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
    "expectedDate" DATETIME,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "transportType" TEXT NOT NULL,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledDate" DATETIME,
    "reason" TEXT NOT NULL,
    "responsibleDriver" TEXT,
    "vehicleId" TEXT,
    "departureTime" DATETIME,
    "arrivalTime" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "observations" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'ENCAMINHAMENTOS_TFD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_transport_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_health_transport_requests" ("arrivalTime", "createdAt", "departureTime", "destination", "id", "moduleType", "observations", "origin", "patientCpf", "patientName", "patientPhone", "protocolId", "reason", "requestDate", "responsibleDriver", "scheduledDate", "status", "transportType", "updatedAt", "urgencyLevel", "vehicleId") SELECT "arrivalTime", "createdAt", "departureTime", "destination", "id", "moduleType", "observations", "origin", "patientCpf", "patientName", "patientPhone", "protocolId", "reason", "requestDate", "responsibleDriver", "scheduledDate", "status", "transportType", "updatedAt", "urgencyLevel", "vehicleId" FROM "health_transport_requests";
DROP TABLE "health_transport_requests";
ALTER TABLE "new_health_transport_requests" RENAME TO "health_transport_requests";
CREATE INDEX "health_transport_requests_moduleType_idx" ON "health_transport_requests"("moduleType");
CREATE INDEX "health_transport_requests_protocolId_idx" ON "health_transport_requests"("protocolId");
CREATE INDEX "health_transport_requests_citizenId_idx" ON "health_transport_requests"("citizenId");
CREATE TABLE "new_health_transports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "patientName" TEXT NOT NULL,
    "patientCpf" TEXT,
    "patientPhone" TEXT,
    "transportType" TEXT NOT NULL,
    "transportDate" DATETIME,
    "transportTime" TEXT,
    "scheduledDate" DATETIME NOT NULL,
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
    "confirmedAt" DATETIME,
    "observations" TEXT,
    "specialInstructions" TEXT,
    "responsibleDriver" TEXT,
    "vehicleId" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'TRANSPORTE_PACIENTES',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_transports_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_health_transports" ("createdAt", "destination", "id", "moduleType", "observations", "origin", "patientName", "protocolId", "responsibleDriver", "scheduledDate", "status", "transportType", "updatedAt", "urgencyLevel", "vehicleId") SELECT "createdAt", "destination", "id", "moduleType", "observations", "origin", "patientName", "protocolId", "responsibleDriver", "scheduledDate", "status", "transportType", "updatedAt", "urgencyLevel", "vehicleId" FROM "health_transports";
DROP TABLE "health_transports";
ALTER TABLE "new_health_transports" RENAME TO "health_transports";
CREATE INDEX "health_transports_moduleType_idx" ON "health_transports"("moduleType");
CREATE INDEX "health_transports_protocolId_idx" ON "health_transports"("protocolId");
CREATE INDEX "health_transports_citizenId_idx" ON "health_transports"("citizenId");
CREATE TABLE "new_health_units" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "manager" TEXT NOT NULL,
    "specialties" JSONB,
    "capacity" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_health_units" ("address", "capacity", "contact", "createdAt", "id", "manager", "name", "specialties", "status", "type", "updatedAt") SELECT "address", "capacity", "contact", "createdAt", "id", "manager", "name", "specialties", "status", "type", "updatedAt" FROM "health_units";
DROP TABLE "health_units";
ALTER TABLE "new_health_units" RENAME TO "health_units";
CREATE TABLE "new_home_visits" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "home_visits_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_home_visits" ("createdAt", "familyId", "findings", "id", "nextVisitDate", "protocolId", "purpose", "recommendations", "socialWorker", "socialWorkerId", "status", "updatedAt", "visitDate", "visitPurpose", "visitType") SELECT "createdAt", "familyId", "findings", "id", "nextVisitDate", "protocolId", "purpose", "recommendations", "socialWorker", "socialWorkerId", "status", "updatedAt", "visitDate", "visitPurpose", "visitType" FROM "home_visits";
DROP TABLE "home_visits";
ALTER TABLE "new_home_visits" RENAME TO "home_visits";
CREATE TABLE "new_housing_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "housing_applications_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_housing_applications" ("address", "analysisDate", "analyst", "applicantCpf", "applicantName", "applicationDate", "approvalDate", "approvedBenefit", "contact", "createdAt", "disbursementDate", "documents", "familyIncome", "familySize", "hasProperty", "housingType", "id", "isFirstHome", "observations", "priorityScore", "program", "programType", "propertyValue", "protocol", "protocolId", "rejection_reason", "status", "submissionDate", "updatedAt") SELECT "address", "analysisDate", "analyst", "applicantCpf", "applicantName", "applicationDate", "approvalDate", "approvedBenefit", "contact", "createdAt", "disbursementDate", "documents", "familyIncome", "familySize", "hasProperty", "housingType", "id", "isFirstHome", "observations", "priorityScore", "program", "programType", "propertyValue", "protocol", "protocolId", "rejection_reason", "status", "submissionDate", "updatedAt" FROM "housing_applications";
DROP TABLE "housing_applications";
ALTER TABLE "new_housing_applications" RENAME TO "housing_applications";
CREATE UNIQUE INDEX "housing_applications_protocol_key" ON "housing_applications"("protocol");
CREATE INDEX "housing_applications_protocolId_idx" ON "housing_applications"("protocolId");
CREATE INDEX "housing_applications_status_idx" ON "housing_applications"("status");
CREATE INDEX "housing_applications_createdAt_idx" ON "housing_applications"("createdAt");
CREATE TABLE "new_housing_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "housing_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_housing_attendances" ("attachments", "citizenCPF", "citizenId", "citizenName", "contact", "createdAt", "currentHousing", "description", "documents", "familyIncome", "familySize", "id", "observations", "priority", "program", "propertyAddress", "protocol", "protocolId", "responsible", "status", "type", "updatedAt") SELECT "attachments", "citizenCPF", "citizenId", "citizenName", "contact", "createdAt", "currentHousing", "description", "documents", "familyIncome", "familySize", "id", "observations", "priority", "program", "propertyAddress", "protocol", "protocolId", "responsible", "status", "type", "updatedAt" FROM "housing_attendances";
DROP TABLE "housing_attendances";
ALTER TABLE "new_housing_attendances" RENAME TO "housing_attendances";
CREATE UNIQUE INDEX "housing_attendances_protocol_key" ON "housing_attendances"("protocol");
CREATE INDEX "housing_attendances_protocolId_idx" ON "housing_attendances"("protocolId");
CREATE INDEX "housing_attendances_status_idx" ON "housing_attendances"("status");
CREATE INDEX "housing_attendances_createdAt_idx" ON "housing_attendances"("createdAt");
CREATE TABLE "new_housing_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_housing_programs" ("availableUnits", "benefits", "contact", "createdAt", "description", "eligibilityCriteria", "endDate", "financingOptions", "id", "isActive", "maxIncome", "name", "registeredFamilies", "requirements", "startDate", "status", "targetIncome", "type", "updatedAt") SELECT "availableUnits", "benefits", "contact", "createdAt", "description", "eligibilityCriteria", "endDate", "financingOptions", "id", "isActive", "maxIncome", "name", "registeredFamilies", "requirements", "startDate", "status", "targetIncome", "type", "updatedAt" FROM "housing_programs";
DROP TABLE "housing_programs";
ALTER TABLE "new_housing_programs" RENAME TO "housing_programs";
CREATE TABLE "new_housing_registrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "housing_registrations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_housing_registrations" ("address", "contact", "createdAt", "familyHeadCPF", "familyHeadName", "familyIncome", "familySize", "id", "observations", "programId", "protocolId", "registrationDate", "score", "selectedDate", "status", "updatedAt") SELECT "address", "contact", "createdAt", "familyHeadCPF", "familyHeadName", "familyIncome", "familySize", "id", "observations", "programId", "protocolId", "registrationDate", "score", "selectedDate", "status", "updatedAt" FROM "housing_registrations";
DROP TABLE "housing_registrations";
ALTER TABLE "new_housing_registrations" RENAME TO "housing_registrations";
CREATE TABLE "new_housing_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_housing_requests" ("analysisNotes", "citizenCpf", "citizenName", "citizenRg", "createdAt", "currentAddress", "currentSituation", "documents", "email", "familyData", "familySize", "id", "monthlyIncome", "phone", "priority", "protocol", "rejectionReason", "requestDetails", "reviewedAt", "reviewedBy", "serviceId", "source", "status", "type", "updatedAt") SELECT "analysisNotes", "citizenCpf", "citizenName", "citizenRg", "createdAt", "currentAddress", "currentSituation", "documents", "email", "familyData", "familySize", "id", "monthlyIncome", "phone", "priority", "protocol", "rejectionReason", "requestDetails", "reviewedAt", "reviewedBy", "serviceId", "source", "status", "type", "updatedAt" FROM "housing_requests";
DROP TABLE "housing_requests";
ALTER TABLE "new_housing_requests" RENAME TO "housing_requests";
CREATE INDEX "housing_requests_type_idx" ON "housing_requests"("type");
CREATE INDEX "housing_requests_status_idx" ON "housing_requests"("status");
CREATE INDEX "housing_requests_citizenCpf_idx" ON "housing_requests"("citizenCpf");
CREATE TABLE "new_housing_units" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "housing_units_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_housing_units" ("address", "area", "bathrooms", "bedrooms", "conditions", "constructionYear", "contractEnd", "contractType", "coordinates", "createdAt", "id", "isOccupied", "lastInspection", "maintenanceItems", "monthlyRent", "needsMaintenance", "neighborhood", "occupancyDate", "occupantCpf", "occupantName", "photos", "program", "propertyValue", "protocolId", "status", "unitCode", "unitType", "updatedAt") SELECT "address", "area", "bathrooms", "bedrooms", "conditions", "constructionYear", "contractEnd", "contractType", "coordinates", "createdAt", "id", "isOccupied", "lastInspection", "maintenanceItems", "monthlyRent", "needsMaintenance", "neighborhood", "occupancyDate", "occupantCpf", "occupantName", "photos", "program", "propertyValue", "protocolId", "status", "unitCode", "unitType", "updatedAt" FROM "housing_units";
DROP TABLE "housing_units";
ALTER TABLE "new_housing_units" RENAME TO "housing_units";
CREATE UNIQUE INDEX "housing_units_unitCode_key" ON "housing_units"("unitCode");
CREATE INDEX "housing_units_protocolId_idx" ON "housing_units"("protocolId");
CREATE INDEX "housing_units_status_idx" ON "housing_units"("status");
CREATE INDEX "housing_units_createdAt_idx" ON "housing_units"("createdAt");
CREATE TABLE "new_infrastructure_problems" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_infrastructure_problems" ("coordinates", "createdAt", "description", "id", "location", "metadata", "photos", "priority", "protocol", "resolutionNotes", "resolvedAt", "resolvedBy", "serviceId", "source", "status", "type", "updatedAt") SELECT "coordinates", "createdAt", "description", "id", "location", "metadata", "photos", "priority", "protocol", "resolutionNotes", "resolvedAt", "resolvedBy", "serviceId", "source", "status", "type", "updatedAt" FROM "infrastructure_problems";
DROP TABLE "infrastructure_problems";
ALTER TABLE "new_infrastructure_problems" RENAME TO "infrastructure_problems";
CREATE INDEX "infrastructure_problems_type_idx" ON "infrastructure_problems"("type");
CREATE INDEX "infrastructure_problems_status_idx" ON "infrastructure_problems"("status");
CREATE TABLE "new_integrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "credentials" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastSync" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_integrations" ("config", "createdAt", "credentials", "id", "isActive", "lastSync", "name", "provider", "status", "type") SELECT "config", "createdAt", "credentials", "id", "isActive", "lastSync", "name", "provider", "status", "type" FROM "integrations";
DROP TABLE "integrations";
ALTER TABLE "new_integrations" RENAME TO "integrations";
CREATE UNIQUE INDEX "integrations_provider_key" ON "integrations"("provider");
CREATE TABLE "new_invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
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
    "metadata" JSONB
);
INSERT INTO "new_invoices" ("amount", "createdAt", "description", "dueDate", "id", "metadata", "number", "paidAt", "paymentUrl", "period", "plan", "status", "updatedAt") SELECT "amount", "createdAt", "description", "dueDate", "id", "metadata", "number", "paidAt", "paymentUrl", "period", "plan", "status", "updatedAt" FROM "invoices";
DROP TABLE "invoices";
ALTER TABLE "new_invoices" RENAME TO "invoices";
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");
CREATE TABLE "new_kpis" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_kpis" ("category", "createdAt", "createdBy", "critical", "currentValue", "description", "formula", "id", "isActive", "lastCalculated", "name", "target", "unit", "updateFrequency", "updatedAt", "warning") SELECT "category", "createdAt", "createdBy", "critical", "currentValue", "description", "formula", "id", "isActive", "lastCalculated", "name", "target", "unit", "updateFrequency", "updatedAt", "warning" FROM "kpis";
DROP TABLE "kpis";
ALTER TABLE "new_kpis" RENAME TO "kpis";
CREATE INDEX "kpis_category_isActive_idx" ON "kpis"("category", "isActive");
CREATE INDEX "kpis_updateFrequency_idx" ON "kpis"("updateFrequency");
CREATE TABLE "new_land_regularizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "land_regularizations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_land_regularizations" ("accessRoads", "analysisStartDate", "analyst", "applicantCpf", "applicantName", "applicationDate", "approvalDate", "buildingArea", "contact", "coordinates", "createdAt", "environmentalAnalysis", "fieldVisitDate", "hasBuilding", "id", "landValue", "legalDocuments", "neighbors", "objectionPeriod", "observations", "occupationDate", "occupationType", "propertyAddress", "propertyArea", "protocol", "protocolId", "publicationDate", "status", "technicalSurvey", "titleIssueDate", "updatedAt", "utilities") SELECT "accessRoads", "analysisStartDate", "analyst", "applicantCpf", "applicantName", "applicationDate", "approvalDate", "buildingArea", "contact", "coordinates", "createdAt", "environmentalAnalysis", "fieldVisitDate", "hasBuilding", "id", "landValue", "legalDocuments", "neighbors", "objectionPeriod", "observations", "occupationDate", "occupationType", "propertyAddress", "propertyArea", "protocol", "protocolId", "publicationDate", "status", "technicalSurvey", "titleIssueDate", "updatedAt", "utilities" FROM "land_regularizations";
DROP TABLE "land_regularizations";
ALTER TABLE "new_land_regularizations" RENAME TO "land_regularizations";
CREATE UNIQUE INDEX "land_regularizations_protocol_key" ON "land_regularizations"("protocol");
CREATE TABLE "new_leads" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "position" TEXT,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "message" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_leads" ("company", "createdAt", "email", "id", "message", "metadata", "name", "phone", "position", "source", "status", "updatedAt") SELECT "company", "createdAt", "email", "id", "message", "metadata", "name", "phone", "position", "source", "status", "updatedAt" FROM "leads";
DROP TABLE "leads";
ALTER TABLE "new_leads" RENAME TO "leads";
CREATE TABLE "new_local_businesses" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "local_businesses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_local_businesses" ("address", "amenities", "businessInfo", "businessType", "category", "certifications", "city", "contact", "coordinates", "createdAt", "description", "id", "isActive", "isPartner", "isTourismPartner", "name", "neighborhood", "openingHours", "owner", "ownerCpf", "photos", "priceRange", "protocol", "protocolId", "rating", "services", "state", "updatedAt") SELECT "address", "amenities", "businessInfo", "businessType", "category", "certifications", "city", "contact", "coordinates", "createdAt", "description", "id", "isActive", "isPartner", "isTourismPartner", "name", "neighborhood", "openingHours", "owner", "ownerCpf", "photos", "priceRange", "protocol", "protocolId", "rating", "services", "state", "updatedAt" FROM "local_businesses";
DROP TABLE "local_businesses";
ALTER TABLE "new_local_businesses" RENAME TO "local_businesses";
CREATE INDEX "local_businesses_protocolId_idx" ON "local_businesses"("protocolId");
CREATE INDEX "local_businesses_createdAt_idx" ON "local_businesses"("createdAt");
CREATE TABLE "new_lost_and_found" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_lost_and_found" ("brand", "color", "createdAt", "createdBy", "distinctiveMarks", "id", "itemDescription", "itemType", "location", "lostFoundDate", "lostFoundTime", "matchedAt", "matchedWith", "metadata", "model", "personAddress", "personDocument", "personEmail", "personName", "personPhone", "photos", "protocol", "returnNotes", "returnedAt", "returnedTo", "serviceId", "source", "status", "storageLocation", "storedAt", "storedBy", "type", "updatedAt") SELECT "brand", "color", "createdAt", "createdBy", "distinctiveMarks", "id", "itemDescription", "itemType", "location", "lostFoundDate", "lostFoundTime", "matchedAt", "matchedWith", "metadata", "model", "personAddress", "personDocument", "personEmail", "personName", "personPhone", "photos", "protocol", "returnNotes", "returnedAt", "returnedTo", "serviceId", "source", "status", "storageLocation", "storedAt", "storedBy", "type", "updatedAt" FROM "lost_and_found";
DROP TABLE "lost_and_found";
ALTER TABLE "new_lost_and_found" RENAME TO "lost_and_found";
CREATE INDEX "lost_and_found_type_idx" ON "lost_and_found"("type");
CREATE INDEX "lost_and_found_status_idx" ON "lost_and_found"("status");
CREATE INDEX "lost_and_found_itemType_idx" ON "lost_and_found"("itemType");
CREATE INDEX "lost_and_found_lostFoundDate_idx" ON "lost_and_found"("lostFoundDate");
CREATE TABLE "new_lot_subdivisions" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_lot_subdivisions" ("approvalNumber", "approvedBy", "approvedDate", "cadastralNumber", "createdAt", "documents", "id", "meetsRequirements", "newLotsCount", "newLotsData", "observations", "originalAddress", "originalArea", "originalBlockNumber", "originalLotNumber", "ownerCpf", "ownerEmail", "ownerName", "ownerPhone", "protocol", "registryDate", "registryNumber", "reviewedAt", "reviewedBy", "serviceId", "source", "status", "surveyPlans", "surveyorCrea", "surveyorName", "technicalAnalysis", "updatedAt") SELECT "approvalNumber", "approvedBy", "approvedDate", "cadastralNumber", "createdAt", "documents", "id", "meetsRequirements", "newLotsCount", "newLotsData", "observations", "originalAddress", "originalArea", "originalBlockNumber", "originalLotNumber", "ownerCpf", "ownerEmail", "ownerName", "ownerPhone", "protocol", "registryDate", "registryNumber", "reviewedAt", "reviewedBy", "serviceId", "source", "status", "surveyPlans", "surveyorCrea", "surveyorName", "technicalAnalysis", "updatedAt" FROM "lot_subdivisions";
DROP TABLE "lot_subdivisions";
ALTER TABLE "new_lot_subdivisions" RENAME TO "lot_subdivisions";
CREATE INDEX "lot_subdivisions_protocol_idx" ON "lot_subdivisions"("protocol");
CREATE INDEX "lot_subdivisions_status_idx" ON "lot_subdivisions"("status");
CREATE TABLE "new_medical_specialties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_medical_specialties" ("code", "createdAt", "description", "id", "isActive", "name", "updatedAt") SELECT "code", "createdAt", "description", "id", "isActive", "name", "updatedAt" FROM "medical_specialties";
DROP TABLE "medical_specialties";
ALTER TABLE "new_medical_specialties" RENAME TO "medical_specialties";
CREATE UNIQUE INDEX "medical_specialties_code_key" ON "medical_specialties"("code");
CREATE TABLE "new_medication_dispenses" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "moduleType" TEXT NOT NULL DEFAULT 'CONTROLE_MEDICAMENTOS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "medication_dispenses_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_medication_dispenses" ("createdAt", "dispenseDate", "dispensedBy", "dosage", "id", "medicationName", "moduleType", "observations", "patientCpf", "patientName", "pharmacistName", "prescriptionId", "protocolId", "quantity", "status", "unitId", "updatedAt") SELECT "createdAt", "dispenseDate", "dispensedBy", "dosage", "id", "medicationName", "moduleType", "observations", "patientCpf", "patientName", "pharmacistName", "prescriptionId", "protocolId", "quantity", "status", "unitId", "updatedAt" FROM "medication_dispenses";
DROP TABLE "medication_dispenses";
ALTER TABLE "new_medication_dispenses" RENAME TO "medication_dispenses";
CREATE INDEX "medication_dispenses_moduleType_idx" ON "medication_dispenses"("moduleType");
CREATE INDEX "medication_dispenses_protocolId_idx" ON "medication_dispenses"("protocolId");
CREATE INDEX "medication_dispenses_status_idx" ON "medication_dispenses"("status");
CREATE INDEX "medication_dispenses_createdAt_idx" ON "medication_dispenses"("createdAt");
CREATE INDEX "medication_dispenses_moduleType_status_idx" ON "medication_dispenses"("moduleType", "status");
CREATE TABLE "new_medication_dispensing" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "medication_dispensing_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_medication_dispensing" ("batchNumber", "createdAt", "dispensedAt", "dosage", "expiryDate", "id", "medication", "patientId", "pharmacistId", "prescription", "protocolId", "quantity", "status", "updatedAt") SELECT "batchNumber", "createdAt", "dispensedAt", "dosage", "expiryDate", "id", "medication", "patientId", "pharmacistId", "prescription", "protocolId", "quantity", "status", "updatedAt" FROM "medication_dispensing";
DROP TABLE "medication_dispensing";
ALTER TABLE "new_medication_dispensing" RENAME TO "medication_dispensing";
CREATE INDEX "medication_dispensing_patientId_idx" ON "medication_dispensing"("patientId");
CREATE INDEX "medication_dispensing_dispensedAt_idx" ON "medication_dispensing"("dispensedAt");
CREATE INDEX "medication_dispensing_medication_idx" ON "medication_dispensing"("medication");
CREATE TABLE "new_medications" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_medications" ("activeIngredient", "category", "createdAt", "currentStock", "dosage", "expirationDate", "id", "isActive", "minimumStock", "name", "supplier", "unitPrice", "updatedAt") SELECT "activeIngredient", "category", "createdAt", "currentStock", "dosage", "expirationDate", "id", "isActive", "minimumStock", "name", "supplier", "unitPrice", "updatedAt" FROM "medications";
DROP TABLE "medications";
ALTER TABLE "new_medications" RENAME TO "medications";
CREATE TABLE "new_metric_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cacheKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "metadata" JSONB,
    "expiresAt" DATETIME NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_metric_cache" ("cacheKey", "createdAt", "data", "expiresAt", "hitCount", "id", "metadata", "updatedAt") SELECT "cacheKey", "createdAt", "data", "expiresAt", "hitCount", "id", "metadata", "updatedAt" FROM "metric_cache";
DROP TABLE "metric_cache";
ALTER TABLE "new_metric_cache" RENAME TO "metric_cache";
CREATE INDEX "metric_cache_expiresAt_idx" ON "metric_cache"("expiresAt");
CREATE UNIQUE INDEX "metric_cache_cacheKey_key" ON "metric_cache"("cacheKey");
CREATE TABLE "new_municipal_guards" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "municipal_guards_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_municipal_guards" ("address", "admissionDate", "assignedBadge", "assignedRadio", "assignedVehicle", "availability", "badge", "birthDate", "certifications", "commendations", "cpf", "createdAt", "disciplinary", "email", "emergencyContact", "equipment", "id", "incidentsCount", "isActive", "name", "notes", "patrolsCount", "phone", "position", "protocolId", "rg", "shift", "specialties", "status", "updatedAt", "workSchedule") SELECT "address", "admissionDate", "assignedBadge", "assignedRadio", "assignedVehicle", "availability", "badge", "birthDate", "certifications", "commendations", "cpf", "createdAt", "disciplinary", "email", "emergencyContact", "equipment", "id", "incidentsCount", "isActive", "name", "notes", "patrolsCount", "phone", "position", "protocolId", "rg", "shift", "specialties", "status", "updatedAt", "workSchedule" FROM "municipal_guards";
DROP TABLE "municipal_guards";
ALTER TABLE "new_municipal_guards" RENAME TO "municipal_guards";
CREATE UNIQUE INDEX "municipal_guards_badge_key" ON "municipal_guards"("badge");
CREATE INDEX "municipal_guards_status_idx" ON "municipal_guards"("status");
CREATE INDEX "municipal_guards_badge_idx" ON "municipal_guards"("badge");
CREATE TABLE "new_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_notifications" ("channel", "citizenId", "createdAt", "id", "isRead", "message", "metadata", "protocolId", "readAt", "sentAt", "title", "type") SELECT "channel", "citizenId", "createdAt", "id", "isRead", "message", "metadata", "protocolId", "readAt", "sentAt", "title", "type" FROM "notifications";
DROP TABLE "notifications";
ALTER TABLE "new_notifications" RENAME TO "notifications";
CREATE TABLE "new_organic_certifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_organic_certifications" ("approvedAt", "approvedBy", "certificationNumber", "coordinates", "createdAt", "documents", "id", "inspections", "inspectorId", "lastInspectionDate", "nextInspectionDate", "producerCpf", "producerEmail", "producerName", "producerPhone", "productionSystem", "products", "propertyArea", "propertyLocation", "propertyName", "protocol", "serviceId", "source", "status", "technicalReport", "updatedAt", "validFrom", "validUntil") SELECT "approvedAt", "approvedBy", "certificationNumber", "coordinates", "createdAt", "documents", "id", "inspections", "inspectorId", "lastInspectionDate", "nextInspectionDate", "producerCpf", "producerEmail", "producerName", "producerPhone", "productionSystem", "products", "propertyArea", "propertyLocation", "propertyName", "protocol", "serviceId", "source", "status", "technicalReport", "updatedAt", "validFrom", "validUntil" FROM "organic_certifications";
DROP TABLE "organic_certifications";
ALTER TABLE "new_organic_certifications" RENAME TO "organic_certifications";
CREATE UNIQUE INDEX "organic_certifications_certificationNumber_key" ON "organic_certifications"("certificationNumber");
CREATE INDEX "organic_certifications_protocol_idx" ON "organic_certifications"("protocol");
CREATE INDEX "organic_certifications_status_idx" ON "organic_certifications"("status");
CREATE TABLE "new_page_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "page_configurations_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "specialized_pages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_page_configurations" ("approvalDate", "approvedBy", "category", "conditions", "createdAt", "createdBy", "description", "id", "isActive", "isRequired", "key", "modifiedBy", "notes", "pageId", "priority", "rollbackData", "schedule", "type", "updatedAt", "value", "version") SELECT "approvalDate", "approvedBy", "category", "conditions", "createdAt", "createdBy", "description", "id", "isActive", "isRequired", "key", "modifiedBy", "notes", "pageId", "priority", "rollbackData", "schedule", "type", "updatedAt", "value", "version" FROM "page_configurations";
DROP TABLE "page_configurations";
ALTER TABLE "new_page_configurations" RENAME TO "page_configurations";
CREATE UNIQUE INDEX "page_configurations_pageId_key_key" ON "page_configurations"("pageId", "key");
CREATE TABLE "new_page_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "page_metrics_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "specialized_pages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_page_metrics" ("averageTime", "bounceRate", "browsers", "clickEvents", "createdAt", "date", "devices", "downloads", "formSubmissions", "id", "metricDate", "pageId", "pageKey", "pageViews", "referrers", "searchTerms", "uniqueVisitors", "updatedAt") SELECT "averageTime", "bounceRate", "browsers", "clickEvents", "createdAt", "date", "devices", "downloads", "formSubmissions", "id", "metricDate", "pageId", "pageKey", "pageViews", "referrers", "searchTerms", "uniqueVisitors", "updatedAt" FROM "page_metrics";
DROP TABLE "page_metrics";
ALTER TABLE "new_page_metrics" RENAME TO "page_metrics";
CREATE UNIQUE INDEX "page_metrics_pageId_date_key" ON "page_metrics"("pageId", "date");
CREATE TABLE "new_patients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "fullName" TEXT NOT NULL,
    "patientName" TEXT,
    "cpf" TEXT NOT NULL,
    "patientCpf" TEXT,
    "rg" TEXT,
    "birthDate" DATETIME NOT NULL,
    "patientBirthDate" DATETIME,
    "gender" TEXT NOT NULL,
    "bloodType" TEXT,
    "phone" TEXT,
    "patientPhone" TEXT,
    "email" TEXT,
    "patientEmail" TEXT,
    "motherName" TEXT,
    "fatherName" TEXT,
    "maritalStatus" TEXT,
    "occupation" TEXT,
    "address" TEXT,
    "addressNumber" TEXT,
    "addressComplement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" TEXT,
    "susCardNumber" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelationship" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "allergies" TEXT,
    "chronicDiseases" TEXT,
    "currentMedications" TEXT,
    "medications" TEXT,
    "previousSurgeries" TEXT,
    "preferredHealthUnitId" TEXT,
    "isPregnant" BOOLEAN NOT NULL DEFAULT false,
    "isDiabetic" BOOLEAN NOT NULL DEFAULT false,
    "isHypertensive" BOOLEAN NOT NULL DEFAULT false,
    "hasHeartDisease" BOOLEAN NOT NULL DEFAULT false,
    "hasRespiratoryDisease" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "observations" TEXT,
    "registeredBy" TEXT NOT NULL,
    "registrationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moduleType" TEXT NOT NULL DEFAULT 'CADASTRO_PACIENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "patients_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_patients" ("address", "allergies", "birthDate", "bloodType", "chronicDiseases", "city", "cpf", "createdAt", "email", "emergencyContact", "emergencyPhone", "fullName", "gender", "id", "medications", "moduleType", "observations", "phone", "protocolId", "registeredBy", "registrationDate", "rg", "state", "status", "susCardNumber", "updatedAt", "zipCode") SELECT "address", "allergies", "birthDate", "bloodType", "chronicDiseases", "city", "cpf", "createdAt", "email", "emergencyContact", "emergencyPhone", "fullName", "gender", "id", "medications", "moduleType", "observations", "phone", "protocolId", "registeredBy", "registrationDate", "rg", "state", "status", "susCardNumber", "updatedAt", "zipCode" FROM "patients";
DROP TABLE "patients";
ALTER TABLE "new_patients" RENAME TO "patients";
CREATE INDEX "patients_moduleType_idx" ON "patients"("moduleType");
CREATE INDEX "patients_protocolId_idx" ON "patients"("protocolId");
CREATE INDEX "patients_citizenId_idx" ON "patients"("citizenId");
CREATE INDEX "patients_status_idx" ON "patients"("status");
CREATE INDEX "patients_createdAt_idx" ON "patients"("createdAt");
CREATE INDEX "patients_moduleType_status_idx" ON "patients"("moduleType", "status");
CREATE UNIQUE INDEX "patients_cpf_key" ON "patients"("cpf");
CREATE TABLE "new_patrol_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "patrol_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_patrol_requests" ("additionalInfo", "area", "assignedOfficers", "assignedUnit", "completedAt", "concerns", "coordinates", "createdAt", "createdBy", "description", "duration", "frequency", "id", "location", "metadata", "observations", "patrolLog", "priority", "protocol", "protocolId", "reason", "requestedDate", "requestedTime", "requesterAddress", "requesterEmail", "requesterName", "requesterPhone", "scheduledDate", "scheduledTime", "serviceId", "source", "status", "type", "updatedAt") SELECT "additionalInfo", "area", "assignedOfficers", "assignedUnit", "completedAt", "concerns", "coordinates", "createdAt", "createdBy", "description", "duration", "frequency", "id", "location", "metadata", "observations", "patrolLog", "priority", "protocol", "protocolId", "reason", "requestedDate", "requestedTime", "requesterAddress", "requesterEmail", "requesterName", "requesterPhone", "scheduledDate", "scheduledTime", "serviceId", "source", "status", "type", "updatedAt" FROM "patrol_requests";
DROP TABLE "patrol_requests";
ALTER TABLE "new_patrol_requests" RENAME TO "patrol_requests";
CREATE INDEX "patrol_requests_status_idx" ON "patrol_requests"("status");
CREATE INDEX "patrol_requests_type_idx" ON "patrol_requests"("type");
CREATE INDEX "patrol_requests_requestedDate_idx" ON "patrol_requests"("requestedDate");
CREATE TABLE "new_police_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_police_reports" ("assignedAt", "assignedTo", "category", "coordinates", "createdAt", "createdBy", "description", "documents", "id", "investigationNotes", "isAnonymous", "location", "metadata", "occurrenceDate", "occurrenceTime", "photos", "priority", "protocol", "reportNumber", "reporterEmail", "reporterName", "reporterPhone", "resolution", "resolvedAt", "serviceId", "source", "status", "suspectInfo", "type", "updatedAt", "videos", "witnessInfo") SELECT "assignedAt", "assignedTo", "category", "coordinates", "createdAt", "createdBy", "description", "documents", "id", "investigationNotes", "isAnonymous", "location", "metadata", "occurrenceDate", "occurrenceTime", "photos", "priority", "protocol", "reportNumber", "reporterEmail", "reporterName", "reporterPhone", "resolution", "resolvedAt", "serviceId", "source", "status", "suspectInfo", "type", "updatedAt", "videos", "witnessInfo" FROM "police_reports";
DROP TABLE "police_reports";
ALTER TABLE "new_police_reports" RENAME TO "police_reports";
CREATE UNIQUE INDEX "police_reports_reportNumber_key" ON "police_reports"("reportNumber");
CREATE INDEX "police_reports_status_idx" ON "police_reports"("status");
CREATE INDEX "police_reports_type_idx" ON "police_reports"("type");
CREATE INDEX "police_reports_reportNumber_idx" ON "police_reports"("reportNumber");
CREATE INDEX "police_reports_occurrenceDate_idx" ON "police_reports"("occurrenceDate");
CREATE TABLE "new_predictions" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_predictions" ("accuracy", "actualValue", "algorithm", "confidence", "createdAt", "entityId", "entityType", "horizon", "id", "input", "model", "prediction", "validatedAt", "version") SELECT "accuracy", "actualValue", "algorithm", "confidence", "createdAt", "entityId", "entityType", "horizon", "id", "input", "model", "prediction", "validatedAt", "version" FROM "predictions";
DROP TABLE "predictions";
ALTER TABLE "new_predictions" RENAME TO "predictions";
CREATE INDEX "predictions_model_entityType_idx" ON "predictions"("model", "entityType");
CREATE INDEX "predictions_createdAt_idx" ON "predictions"("createdAt");
CREATE TABLE "new_project_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "project_approvals_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_project_approvals" ("applicantName", "approvalDate", "createdAt", "description", "documents", "id", "projectName", "projectType", "protocolId", "status", "submissionDate", "updatedAt") SELECT "applicantName", "approvalDate", "createdAt", "description", "documents", "id", "projectName", "projectType", "protocolId", "status", "submissionDate", "updatedAt" FROM "project_approvals";
DROP TABLE "project_approvals";
ALTER TABLE "new_project_approvals" RENAME TO "project_approvals";
CREATE INDEX "project_approvals_protocolId_idx" ON "project_approvals"("protocolId");
CREATE INDEX "project_approvals_status_idx" ON "project_approvals"("status");
CREATE INDEX "project_approvals_createdAt_idx" ON "project_approvals"("createdAt");
CREATE TABLE "new_property_numbering" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_property_numbering" ("applicantCpf", "applicantName", "applicantPhone", "approvedAt", "approvedBy", "assignedNumber", "assignmentDate", "coordinates", "createdAt", "currentNumber", "id", "inspectionDate", "inspectionReport", "inspectorId", "neighborhood", "numberingType", "photos", "propertyAddress", "protocol", "reason", "reference", "serviceId", "source", "status", "updatedAt") SELECT "applicantCpf", "applicantName", "applicantPhone", "approvedAt", "approvedBy", "assignedNumber", "assignmentDate", "coordinates", "createdAt", "currentNumber", "id", "inspectionDate", "inspectionReport", "inspectorId", "neighborhood", "numberingType", "photos", "propertyAddress", "protocol", "reason", "reference", "serviceId", "source", "status", "updatedAt" FROM "property_numbering";
DROP TABLE "property_numbering";
ALTER TABLE "new_property_numbering" RENAME TO "property_numbering";
CREATE INDEX "property_numbering_protocol_idx" ON "property_numbering"("protocol");
CREATE INDEX "property_numbering_status_idx" ON "property_numbering"("status");
CREATE TABLE "new_protected_areas" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "protected_areas_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_protected_areas" ("activities", "areaType", "biodiversity", "contact", "coordinates", "createdAt", "description", "guardian", "id", "isPublicAccess", "lastInspection", "legalBasis", "location", "managementPlan", "name", "protectionLevel", "protocolId", "restrictions", "status", "threats", "totalArea", "updatedAt", "visitationRules") SELECT "activities", "areaType", "biodiversity", "contact", "coordinates", "createdAt", "description", "guardian", "id", "isPublicAccess", "lastInspection", "legalBasis", "location", "managementPlan", "name", "protectionLevel", "protocolId", "restrictions", "status", "threats", "totalArea", "updatedAt", "visitationRules" FROM "protected_areas";
DROP TABLE "protected_areas";
ALTER TABLE "new_protected_areas" RENAME TO "protected_areas";
CREATE TABLE "new_protocol_bottlenecks" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_protocol_bottlenecks" ("affectedProtocols", "avgStuckTime", "bottleneckType", "createdAt", "entityId", "entityName", "id", "impactScore", "maxStuckTime", "metadata", "periodDate", "periodType", "priority", "totalDelayHours", "updatedAt") SELECT "affectedProtocols", "avgStuckTime", "bottleneckType", "createdAt", "entityId", "entityName", "id", "impactScore", "maxStuckTime", "metadata", "periodDate", "periodType", "priority", "totalDelayHours", "updatedAt" FROM "protocol_bottlenecks";
DROP TABLE "protocol_bottlenecks";
ALTER TABLE "new_protocol_bottlenecks" RENAME TO "protocol_bottlenecks";
CREATE INDEX "protocol_bottlenecks_periodType_impactScore_idx" ON "protocol_bottlenecks"("periodType", "impactScore");
CREATE UNIQUE INDEX "protocol_bottlenecks_bottleneckType_entityId_periodType_periodDate_key" ON "protocol_bottlenecks"("bottleneckType", "entityId", "periodType", "periodDate");
CREATE TABLE "new_protocol_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_protocol_metrics" ("approvalRate", "approvedDocuments", "avgCompletionTime", "avgFirstResponse", "avgPendingTime", "avgResolutionTime", "avgSlaDeviation", "cancelledProtocols", "closedProtocols", "createdAt", "documentApprovalRate", "id", "metadata", "newProtocols", "overdueProtocols", "periodDate", "periodType", "rejectedDocuments", "rejectionRate", "resolvedPendings", "satisfactionScore", "slaComplianceRate", "totalDocuments", "totalPendings", "totalProtocols", "updatedAt") SELECT "approvalRate", "approvedDocuments", "avgCompletionTime", "avgFirstResponse", "avgPendingTime", "avgResolutionTime", "avgSlaDeviation", "cancelledProtocols", "closedProtocols", "createdAt", "documentApprovalRate", "id", "metadata", "newProtocols", "overdueProtocols", "periodDate", "periodType", "rejectedDocuments", "rejectionRate", "resolvedPendings", "satisfactionScore", "slaComplianceRate", "totalDocuments", "totalPendings", "totalProtocols", "updatedAt" FROM "protocol_metrics";
DROP TABLE "protocol_metrics";
ALTER TABLE "new_protocol_metrics" RENAME TO "protocol_metrics";
CREATE INDEX "protocol_metrics_periodType_periodDate_idx" ON "protocol_metrics"("periodType", "periodDate");
CREATE UNIQUE INDEX "protocol_metrics_periodType_periodDate_key" ON "protocol_metrics"("periodType", "periodDate");
CREATE TABLE "new_protocols_simplified" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VINCULADO',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "citizenId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
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
    CONSTRAINT "protocols_simplified_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "protocols_simplified_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_protocols_simplified" ("address", "assignedUserId", "attachments", "citizenId", "concludedAt", "createdAt", "createdById", "customData", "departmentId", "description", "documents", "dueDate", "id", "latitude", "longitude", "moduleType", "number", "priority", "serviceId", "status", "title", "updatedAt") SELECT "address", "assignedUserId", "attachments", "citizenId", "concludedAt", "createdAt", "createdById", "customData", "departmentId", "description", "documents", "dueDate", "id", "latitude", "longitude", "moduleType", "number", "priority", "serviceId", "status", "title", "updatedAt" FROM "protocols_simplified";
DROP TABLE "protocols_simplified";
ALTER TABLE "new_protocols_simplified" RENAME TO "protocols_simplified";
CREATE UNIQUE INDEX "protocols_simplified_number_key" ON "protocols_simplified"("number");
CREATE INDEX "protocols_simplified_status_idx" ON "protocols_simplified"("status");
CREATE INDEX "protocols_simplified_createdAt_idx" ON "protocols_simplified"("createdAt");
CREATE INDEX "protocols_simplified_moduleType_status_idx" ON "protocols_simplified"("moduleType", "status");
CREATE TABLE "new_public_complaints" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_public_complaints" ("assignedTo", "category", "complainantName", "createdAt", "description", "id", "location", "priority", "resolutionDate", "status", "submissionDate", "updatedAt") SELECT "assignedTo", "category", "complainantName", "createdAt", "description", "id", "location", "priority", "resolutionDate", "status", "submissionDate", "updatedAt" FROM "public_complaints";
DROP TABLE "public_complaints";
ALTER TABLE "new_public_complaints" RENAME TO "public_complaints";
CREATE TABLE "new_public_consultations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "participationCount" INTEGER NOT NULL DEFAULT 0,
    "documents" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_public_consultations" ("createdAt", "description", "documents", "endDate", "id", "participationCount", "startDate", "status", "title", "updatedAt") SELECT "createdAt", "description", "documents", "endDate", "id", "participationCount", "startDate", "status", "title", "updatedAt" FROM "public_consultations";
DROP TABLE "public_consultations";
ALTER TABLE "new_public_consultations" RENAME TO "public_consultations";
CREATE TABLE "new_public_problem_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "public_problem_reports_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_public_problem_reports" ("affectedPeople", "assignedDepartment", "assignedTeam", "citizenId", "completionDate", "coordinates", "createdAt", "description", "estimatedCost", "followUp", "id", "isAnonymous", "landmark", "location", "materials", "photos", "priority", "problemType", "protocol", "protocolId", "reportDate", "reporterEmail", "reporterName", "reporterPhone", "resolution", "riskLevel", "satisfaction", "scheduledDate", "severity", "status", "title", "updatedAt", "workHours") SELECT "affectedPeople", "assignedDepartment", "assignedTeam", "citizenId", "completionDate", "coordinates", "createdAt", "description", "estimatedCost", "followUp", "id", "isAnonymous", "landmark", "location", "materials", "photos", "priority", "problemType", "protocol", "protocolId", "reportDate", "reporterEmail", "reporterName", "reporterPhone", "resolution", "riskLevel", "satisfaction", "scheduledDate", "severity", "status", "title", "updatedAt", "workHours" FROM "public_problem_reports";
DROP TABLE "public_problem_reports";
ALTER TABLE "new_public_problem_reports" RENAME TO "public_problem_reports";
CREATE UNIQUE INDEX "public_problem_reports_protocol_key" ON "public_problem_reports"("protocol");
CREATE TABLE "new_public_schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_public_schools" ("address", "capacity", "code", "contact", "createdAt", "currentStudents", "email", "id", "levels", "name", "principalName", "status", "updatedAt") SELECT "address", "capacity", "code", "contact", "createdAt", "currentStudents", "email", "id", "levels", "name", "principalName", "status", "updatedAt" FROM "public_schools";
DROP TABLE "public_schools";
ALTER TABLE "new_public_schools" RENAME TO "public_schools";
CREATE UNIQUE INDEX "public_schools_code_key" ON "public_schools"("code");
CREATE TABLE "new_public_service_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "public_service_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_public_service_attendances" ("address", "assignedTeam", "assignedTo", "citizenCpf", "citizenEmail", "citizenId", "citizenName", "citizenPhone", "completionDate", "coordinates", "cost", "createdAt", "description", "documents", "id", "location", "observations", "photos", "priority", "protocolId", "requestDate", "requestType", "resolution", "satisfaction", "scheduledDate", "serviceType", "status", "updatedAt", "urgency") SELECT "address", "assignedTeam", "assignedTo", "citizenCpf", "citizenEmail", "citizenId", "citizenName", "citizenPhone", "completionDate", "coordinates", "cost", "createdAt", "description", "documents", "id", "location", "observations", "photos", "priority", "protocolId", "requestDate", "requestType", "resolution", "satisfaction", "scheduledDate", "serviceType", "status", "updatedAt", "urgency" FROM "public_service_attendances";
DROP TABLE "public_service_attendances";
ALTER TABLE "new_public_service_attendances" RENAME TO "public_service_attendances";
CREATE INDEX "public_service_attendances_protocolId_idx" ON "public_service_attendances"("protocolId");
CREATE INDEX "public_service_attendances_status_idx" ON "public_service_attendances"("status");
CREATE INDEX "public_service_attendances_createdAt_idx" ON "public_service_attendances"("createdAt");
CREATE TABLE "new_public_service_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "public_service_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_public_service_requests" ("assignedTeam", "category", "completionDate", "contact", "coordinates", "cost", "createdAt", "description", "estimatedCost", "expectedDate", "id", "location", "materials", "photos", "preferredDate", "priority", "protocol", "protocolId", "requestDate", "requestorCpf", "requestorName", "resolution", "satisfaction", "scheduledDate", "serviceType", "status", "updatedAt", "urgency", "workDetails") SELECT "assignedTeam", "category", "completionDate", "contact", "coordinates", "cost", "createdAt", "description", "estimatedCost", "expectedDate", "id", "location", "materials", "photos", "preferredDate", "priority", "protocol", "protocolId", "requestDate", "requestorCpf", "requestorName", "resolution", "satisfaction", "scheduledDate", "serviceType", "status", "updatedAt", "urgency", "workDetails" FROM "public_service_requests";
DROP TABLE "public_service_requests";
ALTER TABLE "new_public_service_requests" RENAME TO "public_service_requests";
CREATE UNIQUE INDEX "public_service_requests_protocol_key" ON "public_service_requests"("protocol");
CREATE TABLE "new_public_works" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "public_works_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_public_works" ("actualBudget", "beneficiaries", "budget", "contractor", "coordinates", "createdAt", "description", "documents", "endDate", "id", "location", "photos", "plannedBudget", "priority", "progressPercent", "protocolId", "startDate", "status", "timeline", "title", "updatedAt", "workType") SELECT "actualBudget", "beneficiaries", "budget", "contractor", "coordinates", "createdAt", "description", "documents", "endDate", "id", "location", "photos", "plannedBudget", "priority", "progressPercent", "protocolId", "startDate", "status", "timeline", "title", "updatedAt", "workType" FROM "public_works";
DROP TABLE "public_works";
ALTER TABLE "new_public_works" RENAME TO "public_works";
CREATE TABLE "new_public_works_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "public_works_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_public_works_attendances" ("citizenCpf", "citizenName", "completionDate", "contact", "coordinates", "createdAt", "description", "engineer", "estimatedCost", "feasibility", "followUpDate", "id", "location", "photos", "priority", "protocol", "protocolId", "resolution", "satisfaction", "scheduledDate", "serviceType", "status", "subject", "technicalOpinion", "updatedAt", "urgency", "workType") SELECT "citizenCpf", "citizenName", "completionDate", "contact", "coordinates", "createdAt", "description", "engineer", "estimatedCost", "feasibility", "followUpDate", "id", "location", "photos", "priority", "protocol", "protocolId", "resolution", "satisfaction", "scheduledDate", "serviceType", "status", "subject", "technicalOpinion", "updatedAt", "urgency", "workType" FROM "public_works_attendances";
DROP TABLE "public_works_attendances";
ALTER TABLE "new_public_works_attendances" RENAME TO "public_works_attendances";
CREATE UNIQUE INDEX "public_works_attendances_protocol_key" ON "public_works_attendances"("protocol");
CREATE INDEX "public_works_attendances_protocolId_idx" ON "public_works_attendances"("protocolId");
CREATE INDEX "public_works_attendances_status_idx" ON "public_works_attendances"("status");
CREATE INDEX "public_works_attendances_createdAt_idx" ON "public_works_attendances"("createdAt");
CREATE TABLE "new_rent_assistances" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "rent_assistances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_rent_assistances" ("analysisDate", "analyst", "applicantCpf", "applicantName", "applicationDate", "approvalDate", "bankAccount", "contact", "createdAt", "currentAddress", "documents", "employmentDetails", "familyIncome", "familySize", "firstPaymentDate", "hasEmployment", "id", "landlordContact", "landlordName", "lastPaymentDate", "leaseContract", "monthlyRent", "observations", "paymentsCount", "protocol", "protocolId", "requestedAmount", "requestedPeriod", "socialReport", "status", "totalPaid", "updatedAt", "vulnerabilityReason") SELECT "analysisDate", "analyst", "applicantCpf", "applicantName", "applicationDate", "approvalDate", "bankAccount", "contact", "createdAt", "currentAddress", "documents", "employmentDetails", "familyIncome", "familySize", "firstPaymentDate", "hasEmployment", "id", "landlordContact", "landlordName", "lastPaymentDate", "leaseContract", "monthlyRent", "observations", "paymentsCount", "protocol", "protocolId", "requestedAmount", "requestedPeriod", "socialReport", "status", "totalPaid", "updatedAt", "vulnerabilityReason" FROM "rent_assistances";
DROP TABLE "rent_assistances";
ALTER TABLE "new_rent_assistances" RENAME TO "rent_assistances";
CREATE UNIQUE INDEX "rent_assistances_protocol_key" ON "rent_assistances"("protocol");
CREATE TABLE "new_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_reports" ("accessLevel", "category", "config", "createdAt", "createdBy", "departments", "description", "id", "isActive", "isPublic", "lastRun", "name", "schedule", "template", "type", "updatedAt") SELECT "accessLevel", "category", "config", "createdAt", "createdBy", "departments", "description", "id", "isActive", "isPublic", "lastRun", "name", "schedule", "template", "type", "updatedAt" FROM "reports";
DROP TABLE "reports";
ALTER TABLE "new_reports" RENAME TO "reports";
CREATE INDEX "reports_type_isActive_idx" ON "reports"("type", "isActive");
CREATE INDEX "reports_createdBy_idx" ON "reports"("createdBy");
CREATE TABLE "new_road_repair_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "road_repair_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_road_repair_requests" ("affectedArea", "assignedTeam", "citizenCpf", "citizenName", "completionDate", "contact", "coordinates", "createdAt", "description", "estimatedCost", "id", "location", "materialsUsed", "observations", "photos", "priority", "problemType", "protocol", "protocolId", "resolution", "roadName", "satisfaction", "scheduledDate", "severity", "status", "trafficImpact", "updatedAt", "urgency", "workDuration") SELECT "affectedArea", "assignedTeam", "citizenCpf", "citizenName", "completionDate", "contact", "coordinates", "createdAt", "description", "estimatedCost", "id", "location", "materialsUsed", "observations", "photos", "priority", "problemType", "protocol", "protocolId", "resolution", "roadName", "satisfaction", "scheduledDate", "severity", "status", "trafficImpact", "updatedAt", "urgency", "workDuration" FROM "road_repair_requests";
DROP TABLE "road_repair_requests";
ALTER TABLE "new_road_repair_requests" RENAME TO "road_repair_requests";
CREATE UNIQUE INDEX "road_repair_requests_protocol_key" ON "road_repair_requests"("protocol");
CREATE INDEX "road_repair_requests_protocolId_idx" ON "road_repair_requests"("protocolId");
CREATE INDEX "road_repair_requests_status_idx" ON "road_repair_requests"("status");
CREATE INDEX "road_repair_requests_createdAt_idx" ON "road_repair_requests"("createdAt");
CREATE TABLE "new_rural_producers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenId" TEXT NOT NULL,
    "protocolId" TEXT,
    "productionType" TEXT,
    "mainCrop" TEXT,
    "dap" TEXT,
    "totalAreaHectares" REAL,
    "mainProductions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rural_producers_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rural_producers_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_rural_producers" ("citizenId", "createdAt", "id", "isActive", "mainCrop", "productionType", "protocolId", "status", "updatedAt") SELECT "citizenId", "createdAt", "id", "isActive", "mainCrop", "productionType", "protocolId", "status", "updatedAt" FROM "rural_producers";
DROP TABLE "rural_producers";
ALTER TABLE "new_rural_producers" RENAME TO "rural_producers";
CREATE INDEX "rural_producers_citizenId_idx" ON "rural_producers"("citizenId");
CREATE INDEX "rural_producers_protocolId_idx" ON "rural_producers"("protocolId");
CREATE INDEX "rural_producers_status_idx" ON "rural_producers"("status");
CREATE INDEX "rural_producers_createdAt_idx" ON "rural_producers"("createdAt");
CREATE UNIQUE INDEX "rural_producers_citizenId_key" ON "rural_producers"("citizenId");
CREATE TABLE "new_rural_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "customFields" JSONB,
    "requiredDocuments" JSONB,
    "enrollmentSettings" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rural_programs_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_rural_programs" ("applicationPeriod", "benefits", "budget", "coordinator", "createdAt", "currentParticipants", "description", "endDate", "evaluation", "id", "maxParticipants", "name", "objectives", "partners", "programType", "protocolId", "requirements", "results", "selectionCriteria", "startDate", "status", "targetAudience", "updatedAt") SELECT "applicationPeriod", "benefits", "budget", "coordinator", "createdAt", "currentParticipants", "description", "endDate", "evaluation", "id", "maxParticipants", "name", "objectives", "partners", "programType", "protocolId", "requirements", "results", "selectionCriteria", "startDate", "status", "targetAudience", "updatedAt" FROM "rural_programs";
DROP TABLE "rural_programs";
ALTER TABLE "new_rural_programs" RENAME TO "rural_programs";
CREATE TABLE "new_rural_properties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenId" TEXT NOT NULL,
    "protocolId" TEXT,
    "producerId" TEXT,
    "name" TEXT NOT NULL,
    "size" REAL NOT NULL,
    "totalArea" REAL,
    "cultivatedArea" REAL,
    "plantedArea" REAL,
    "location" TEXT NOT NULL,
    "coordinates" JSONB,
    "mainCrops" JSONB,
    "documentType" TEXT,
    "documentNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rural_properties_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rural_properties_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "rural_properties_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "rural_producers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_rural_properties" ("createdAt", "cultivatedArea", "id", "location", "mainCrops", "name", "plantedArea", "producerId", "protocolId", "size", "status", "totalArea", "updatedAt") SELECT "createdAt", "cultivatedArea", "id", "location", "mainCrops", "name", "plantedArea", "producerId", "protocolId", "size", "status", "totalArea", "updatedAt" FROM "rural_properties";
DROP TABLE "rural_properties";
ALTER TABLE "new_rural_properties" RENAME TO "rural_properties";
CREATE INDEX "rural_properties_citizenId_idx" ON "rural_properties"("citizenId");
CREATE INDEX "rural_properties_producerId_idx" ON "rural_properties"("producerId");
CREATE INDEX "rural_properties_protocolId_idx" ON "rural_properties"("protocolId");
CREATE INDEX "rural_properties_status_idx" ON "rural_properties"("status");
CREATE INDEX "rural_properties_createdAt_idx" ON "rural_properties"("createdAt");
CREATE TABLE "new_rural_trainings" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "customFields" JSONB,
    "requiredDocuments" JSONB,
    "enrollmentSettings" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rural_trainings_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_rural_trainings" ("certificate", "content", "cost", "createdAt", "currentParticipants", "description", "duration", "endDate", "evaluation", "feedback", "id", "instructor", "instructorBio", "location", "materials", "maxParticipants", "objectives", "photos", "protocolId", "requirements", "schedule", "startDate", "status", "targetAudience", "title", "trainingType", "updatedAt") SELECT "certificate", "content", "cost", "createdAt", "currentParticipants", "description", "duration", "endDate", "evaluation", "feedback", "id", "instructor", "instructorBio", "location", "materials", "maxParticipants", "objectives", "photos", "protocolId", "requirements", "schedule", "startDate", "status", "targetAudience", "title", "trainingType", "updatedAt" FROM "rural_trainings";
DROP TABLE "rural_trainings";
ALTER TABLE "new_rural_trainings" RENAME TO "rural_trainings";
CREATE TABLE "new_school_calls" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "school_calls_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public_schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_school_calls" ("callDate", "contact", "createdAt", "id", "level", "observations", "parentName", "reason", "resolvedDate", "schoolId", "status", "studentName", "updatedAt") SELECT "callDate", "contact", "createdAt", "id", "level", "observations", "parentName", "reason", "resolvedDate", "schoolId", "status", "studentName", "updatedAt" FROM "school_calls";
DROP TABLE "school_calls";
ALTER TABLE "new_school_calls" RENAME TO "school_calls";
CREATE TABLE "new_school_classes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "maxStudents" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_school_classes" ("createdAt", "grade", "id", "isActive", "maxStudents", "name", "schoolId", "shift", "updatedAt", "year") SELECT "createdAt", "grade", "id", "isActive", "maxStudents", "name", "schoolId", "shift", "updatedAt", "year" FROM "school_classes";
DROP TABLE "school_classes";
ALTER TABLE "new_school_classes" RENAME TO "school_classes";
CREATE TABLE "new_school_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "requestorName" TEXT,
    "requestorCpf" TEXT,
    "requestorPhone" TEXT,
    "requestorEmail" TEXT,
    "studentId" TEXT,
    "studentName" TEXT NOT NULL,
    "studentCpf" TEXT,
    "studentBirthDate" DATETIME,
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
    "expectedDeliveryDate" DATETIME,
    "hasFee" BOOLEAN NOT NULL DEFAULT false,
    "feeAmount" REAL NOT NULL DEFAULT 0,
    "feeStatus" TEXT,
    "issueDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" DATETIME,
    "approvedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "fileUrl" TEXT,
    "observations" TEXT,
    "internalNotes" TEXT,
    "moduleType" TEXT NOT NULL DEFAULT 'SOLICITACAO_DOCUMENTO_ESCOLAR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_documents_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "school_documents_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_school_documents" ("createdAt", "documentType", "fileUrl", "id", "issueDate", "moduleType", "observations", "protocolId", "status", "studentId", "studentName", "updatedAt", "validUntil") SELECT "createdAt", "documentType", "fileUrl", "id", "issueDate", "moduleType", "observations", "protocolId", "status", "studentId", "studentName", "updatedAt", "validUntil" FROM "school_documents";
DROP TABLE "school_documents";
ALTER TABLE "new_school_documents" RENAME TO "school_documents";
CREATE INDEX "school_documents_moduleType_idx" ON "school_documents"("moduleType");
CREATE INDEX "school_documents_protocolId_idx" ON "school_documents"("protocolId");
CREATE INDEX "school_documents_citizenId_idx" ON "school_documents"("citizenId");
CREATE TABLE "new_school_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "school_events_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_school_events" ("createdAt", "date", "description", "endTime", "id", "isHoliday", "name", "schoolId", "startTime", "title", "type", "updatedAt") SELECT "createdAt", "date", "description", "endTime", "id", "isHoliday", "name", "schoolId", "startTime", "title", "type", "updatedAt" FROM "school_events";
DROP TABLE "school_events";
ALTER TABLE "new_school_events" RENAME TO "school_events";
CREATE TABLE "new_school_incidents" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_school_incidents" ("actionTaken", "classId", "createdAt", "description", "id", "parentNotified", "severity", "studentId", "type", "updatedAt") SELECT "actionTaken", "classId", "createdAt", "description", "id", "parentNotified", "severity", "studentId", "type", "updatedAt" FROM "school_incidents";
DROP TABLE "school_incidents";
ALTER TABLE "new_school_incidents" RENAME TO "school_incidents";
CREATE TABLE "new_school_management" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT NOT NULL,
    "managerName" TEXT,
    "managerCpf" TEXT,
    "managerPhone" TEXT,
    "managerEmail" TEXT,
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
    "estimatedBudget" REAL NOT NULL DEFAULT 0,
    "proposedSolution" TEXT,
    "requiresEquipment" BOOLEAN NOT NULL DEFAULT false,
    "requiredEquipment" JSONB,
    "requiresStaff" BOOLEAN NOT NULL DEFAULT false,
    "requiredStaffType" TEXT,
    "requiresInfrastructure" BOOLEAN NOT NULL DEFAULT false,
    "infrastructureDetails" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "urgencyLevel" TEXT,
    "expectedImplementationDate" DATETIME,
    "justification" TEXT,
    "requiresSecretaryApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresBudgetApproval" BOOLEAN NOT NULL DEFAULT false,
    "requiresCouncilApproval" BOOLEAN NOT NULL DEFAULT false,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "documents" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" DATETIME,
    "assignedToId" TEXT,
    "assignedToName" TEXT,
    "assignedTo" TEXT,
    "requestDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedDate" DATETIME,
    "observations" TEXT,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_management_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "school_management_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_school_management" ("assignedTo", "completedDate", "createdAt", "description", "documents", "id", "managementType", "observations", "priority", "protocolId", "requestDate", "schoolId", "schoolName", "status", "updatedAt") SELECT "assignedTo", "completedDate", "createdAt", "description", "documents", "id", "managementType", "observations", "priority", "protocolId", "requestDate", "schoolId", "schoolName", "status", "updatedAt" FROM "school_management";
DROP TABLE "school_management";
ALTER TABLE "new_school_management" RENAME TO "school_management";
CREATE INDEX "school_management_citizenId_idx" ON "school_management"("citizenId");
CREATE TABLE "new_school_meals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "schoolId" TEXT,
    "date" DATETIME NOT NULL,
    "shift" TEXT NOT NULL,
    "menu" JSONB NOT NULL,
    "studentsServed" INTEGER NOT NULL DEFAULT 0,
    "cost" REAL,
    "moduleType" TEXT NOT NULL DEFAULT 'GESTAO_MERENDA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_meals_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "school_meals_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_school_meals" ("cost", "createdAt", "date", "id", "menu", "moduleType", "protocolId", "schoolId", "shift", "studentsServed", "updatedAt") SELECT "cost", "createdAt", "date", "id", "menu", "moduleType", "protocolId", "schoolId", "shift", "studentsServed", "updatedAt" FROM "school_meals";
DROP TABLE "school_meals";
ALTER TABLE "new_school_meals" RENAME TO "school_meals";
CREATE INDEX "school_meals_moduleType_idx" ON "school_meals"("moduleType");
CREATE INDEX "school_meals_protocolId_idx" ON "school_meals"("protocolId");
CREATE TABLE "new_school_transports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "route" TEXT NOT NULL,
    "driver" TEXT NOT NULL,
    "vehicle" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "shift" TEXT NOT NULL,
    "stops" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "moduleType" TEXT NOT NULL DEFAULT 'TRANSPORTE_ESCOLAR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_transports_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_school_transports" ("capacity", "createdAt", "driver", "id", "isActive", "moduleType", "protocolId", "route", "shift", "stops", "updatedAt", "vehicle") SELECT "capacity", "createdAt", "driver", "id", "isActive", "moduleType", "protocolId", "route", "shift", "stops", "updatedAt", "vehicle" FROM "school_transports";
DROP TABLE "school_transports";
ALTER TABLE "new_school_transports" RENAME TO "school_transports";
CREATE INDEX "school_transports_moduleType_idx" ON "school_transports"("moduleType");
CREATE INDEX "school_transports_protocolId_idx" ON "school_transports"("protocolId");
CREATE TABLE "new_schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_schools" ("address", "capacity", "code", "createdAt", "email", "id", "isActive", "name", "phone", "principalName", "shift", "type", "updatedAt") SELECT "address", "capacity", "code", "createdAt", "email", "id", "isActive", "name", "phone", "principalName", "shift", "type", "updatedAt" FROM "schools";
DROP TABLE "schools";
ALTER TABLE "new_schools" RENAME TO "schools";
CREATE INDEX "schools_createdAt_idx" ON "schools"("createdAt");
CREATE UNIQUE INDEX "schools_code_key" ON "schools"("code");
CREATE TABLE "new_security_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "security_alerts_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_security_alerts" ("acknowledgments", "affectedAreas", "alertType", "channels", "coordinates", "createdAt", "createdBy", "description", "endDate", "expiresAt", "id", "isActive", "location", "message", "priority", "protocolId", "severity", "startDate", "status", "targetArea", "targetAudience", "title", "type", "updatedAt", "validUntil") SELECT "acknowledgments", "affectedAreas", "alertType", "channels", "coordinates", "createdAt", "createdBy", "description", "endDate", "expiresAt", "id", "isActive", "location", "message", "priority", "protocolId", "severity", "startDate", "status", "targetArea", "targetAudience", "title", "type", "updatedAt", "validUntil" FROM "security_alerts";
DROP TABLE "security_alerts";
ALTER TABLE "new_security_alerts" RENAME TO "security_alerts";
CREATE TABLE "new_security_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "security_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_security_attendances" ("actions", "assignedOfficer", "attendanceType", "citizenCpf", "citizenId", "citizenName", "contact", "createdAt", "description", "evidence", "followUpDate", "followUpNeeded", "id", "location", "protocol", "protocolId", "referredTo", "resolution", "satisfactionRating", "serviceType", "status", "subject", "updatedAt", "urgency") SELECT "actions", "assignedOfficer", "attendanceType", "citizenCpf", "citizenId", "citizenName", "contact", "createdAt", "description", "evidence", "followUpDate", "followUpNeeded", "id", "location", "protocol", "protocolId", "referredTo", "resolution", "satisfactionRating", "serviceType", "status", "subject", "updatedAt", "urgency" FROM "security_attendances";
DROP TABLE "security_attendances";
ALTER TABLE "new_security_attendances" RENAME TO "security_attendances";
CREATE UNIQUE INDEX "security_attendances_protocol_key" ON "security_attendances"("protocol");
CREATE INDEX "security_attendances_protocolId_idx" ON "security_attendances"("protocolId");
CREATE INDEX "security_attendances_status_idx" ON "security_attendances"("status");
CREATE INDEX "security_attendances_createdAt_idx" ON "security_attendances"("createdAt");
CREATE TABLE "new_security_occurrences" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "security_occurrences_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_security_occurrences" ("actions", "coordinates", "createdAt", "dateTime", "description", "evidence", "followUp", "id", "location", "occurrenceDate", "occurrenceType", "officerName", "protocol", "protocolId", "reportDate", "reportedBy", "reporterCpf", "reporterName", "reporterPhone", "resolution", "severity", "status", "type", "updatedAt", "victimInfo", "witnesses") SELECT "actions", "coordinates", "createdAt", "dateTime", "description", "evidence", "followUp", "id", "location", "occurrenceDate", "occurrenceType", "officerName", "protocol", "protocolId", "reportDate", "reportedBy", "reporterCpf", "reporterName", "reporterPhone", "resolution", "severity", "status", "type", "updatedAt", "victimInfo", "witnesses" FROM "security_occurrences";
DROP TABLE "security_occurrences";
ALTER TABLE "new_security_occurrences" RENAME TO "security_occurrences";
CREATE UNIQUE INDEX "security_occurrences_protocol_key" ON "security_occurrences"("protocol");
CREATE INDEX "security_occurrences_protocolId_idx" ON "security_occurrences"("protocolId");
CREATE INDEX "security_occurrences_status_idx" ON "security_occurrences"("status");
CREATE INDEX "security_occurrences_createdAt_idx" ON "security_occurrences"("createdAt");
CREATE TABLE "new_security_patrols" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "security_patrols_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_security_patrols" ("checkpoints", "createdAt", "endTime", "gpsTrack", "guardId", "guardName", "id", "incidents", "observations", "officerBadge", "officerName", "patrolType", "protocolId", "route", "startTime", "status", "updatedAt", "vehicle") SELECT "checkpoints", "createdAt", "endTime", "gpsTrack", "guardId", "guardName", "id", "incidents", "observations", "officerBadge", "officerName", "patrolType", "protocolId", "route", "startTime", "status", "updatedAt", "vehicle" FROM "security_patrols";
DROP TABLE "security_patrols";
ALTER TABLE "new_security_patrols" RENAME TO "security_patrols";
CREATE TABLE "new_seed_distributions" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_seed_distributions" ("approvalNotes", "approvedAt", "approvedBy", "approvedQuantity", "createdAt", "deliveredBy", "deliveredItems", "deliveryDate", "id", "items", "producerCpf", "producerName", "producerPhone", "propertyArea", "propertyLocation", "protocol", "purpose", "receivedBy", "requestType", "serviceId", "source", "status", "updatedAt") SELECT "approvalNotes", "approvedAt", "approvedBy", "approvedQuantity", "createdAt", "deliveredBy", "deliveredItems", "deliveryDate", "id", "items", "producerCpf", "producerName", "producerPhone", "propertyArea", "propertyLocation", "protocol", "purpose", "receivedBy", "requestType", "serviceId", "source", "status", "updatedAt" FROM "seed_distributions";
DROP TABLE "seed_distributions";
ALTER TABLE "new_seed_distributions" RENAME TO "seed_distributions";
CREATE INDEX "seed_distributions_protocol_idx" ON "seed_distributions"("protocol");
CREATE INDEX "seed_distributions_status_idx" ON "seed_distributions"("status");
CREATE TABLE "new_server_performance" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_server_performance" ("approvalRate", "avgCompletionTime", "avgInteractionsPerProtocol", "avgResponseTime", "createdAt", "id", "metadata", "pendingResolution", "periodDate", "periodType", "protocolsAssigned", "protocolsCompleted", "protocolsOnTime", "protocolsOverdue", "satisfactionScore", "totalInteractions", "totalWorkingHours", "updatedAt", "userId") SELECT "approvalRate", "avgCompletionTime", "avgInteractionsPerProtocol", "avgResponseTime", "createdAt", "id", "metadata", "pendingResolution", "periodDate", "periodType", "protocolsAssigned", "protocolsCompleted", "protocolsOnTime", "protocolsOverdue", "satisfactionScore", "totalInteractions", "totalWorkingHours", "updatedAt", "userId" FROM "server_performance";
DROP TABLE "server_performance";
ALTER TABLE "new_server_performance" RENAME TO "server_performance";
CREATE INDEX "server_performance_userId_periodType_idx" ON "server_performance"("userId", "periodType");
CREATE UNIQUE INDEX "server_performance_userId_periodType_periodDate_key" ON "server_performance"("userId", "periodType", "periodDate");
CREATE TABLE "new_service_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_service_metrics" ("approvalRate", "avgCompletionTime", "avgDocumentTime", "avgPendingTime", "complaintRate", "completedRequests", "createdAt", "id", "metadata", "periodDate", "periodType", "rejectionRate", "satisfactionScore", "serviceId", "totalRequests", "updatedAt") SELECT "approvalRate", "avgCompletionTime", "avgDocumentTime", "avgPendingTime", "complaintRate", "completedRequests", "createdAt", "id", "metadata", "periodDate", "periodType", "rejectionRate", "satisfactionScore", "serviceId", "totalRequests", "updatedAt" FROM "service_metrics";
DROP TABLE "service_metrics";
ALTER TABLE "new_service_metrics" RENAME TO "service_metrics";
CREATE INDEX "service_metrics_serviceId_periodType_idx" ON "service_metrics"("serviceId", "periodType");
CREATE UNIQUE INDEX "service_metrics_serviceId_periodType_periodDate_key" ON "service_metrics"("serviceId", "periodType", "periodDate");
CREATE TABLE "new_service_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "service_teams_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_service_teams" ("breakTime", "coverage", "createdAt", "department", "equipment", "hireDate", "id", "isActive", "leader", "leaderContact", "members", "observations", "performance", "productivity", "protocolId", "shiftEnd", "shiftStart", "specialization", "status", "teamCode", "teamName", "teamType", "totalMembers", "updatedAt", "vehicles", "workArea", "workDays", "workShift") SELECT "breakTime", "coverage", "createdAt", "department", "equipment", "hireDate", "id", "isActive", "leader", "leaderContact", "members", "observations", "performance", "productivity", "protocolId", "shiftEnd", "shiftStart", "specialization", "status", "teamCode", "teamName", "teamType", "totalMembers", "updatedAt", "vehicles", "workArea", "workDays", "workShift" FROM "service_teams";
DROP TABLE "service_teams";
ALTER TABLE "new_service_teams" RENAME TO "service_teams";
CREATE UNIQUE INDEX "service_teams_teamCode_key" ON "service_teams"("teamCode");
CREATE TABLE "new_services_simplified" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "services_simplified_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_services_simplified" ("category", "color", "createdAt", "departmentId", "description", "estimatedDays", "formSchema", "icon", "id", "isActive", "moduleType", "name", "priority", "requiredDocuments", "requiresDocuments", "serviceType", "updatedAt") SELECT "category", "color", "createdAt", "departmentId", "description", "estimatedDays", "formSchema", "icon", "id", "isActive", "moduleType", "name", "priority", "requiredDocuments", "requiresDocuments", "serviceType", "updatedAt" FROM "services_simplified";
DROP TABLE "services_simplified";
ALTER TABLE "new_services_simplified" RENAME TO "services_simplified";
CREATE TABLE "new_social_appointments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT,
    "citizenPhone" TEXT,
    "citizenEmail" TEXT,
    "appointmentType" TEXT NOT NULL,
    "serviceType" TEXT,
    "appointmentDate" DATETIME NOT NULL,
    "appointmentTime" TEXT,
    "estimatedDuration" INTEGER NOT NULL DEFAULT 60,
    "equipmentType" TEXT,
    "equipmentId" TEXT,
    "equipmentName" TEXT,
    "roomNumber" TEXT,
    "socialWorker" TEXT,
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
    "confirmedAt" DATETIME,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "reminderDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" DATETIME,
    "notes" TEXT,
    "result" TEXT,
    "followUpNeeded" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "observations" TEXT,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_appointments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_appointments_socialWorkerId_fkey" FOREIGN KEY ("socialWorkerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_appointments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_social_appointments" ("appointmentDate", "appointmentType", "citizenCpf", "citizenId", "citizenName", "createdAt", "followUpDate", "followUpNeeded", "id", "notes", "protocolId", "purpose", "result", "socialWorker", "socialWorkerId", "status", "updatedAt") SELECT "appointmentDate", "appointmentType", "citizenCpf", "citizenId", "citizenName", "createdAt", "followUpDate", "followUpNeeded", "id", "notes", "protocolId", "purpose", "result", "socialWorker", "socialWorkerId", "status", "updatedAt" FROM "social_appointments";
DROP TABLE "social_appointments";
ALTER TABLE "new_social_appointments" RENAME TO "social_appointments";
CREATE TABLE "new_social_assistance_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT,
    "citizenName" TEXT NOT NULL,
    "citizenCpf" TEXT NOT NULL,
    "citizenPhone" TEXT,
    "citizenEmail" TEXT,
    "contact" JSONB NOT NULL,
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
    "familyIncome" REAL,
    "monthlyIncome" REAL,
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
    "followUpDate" DATETIME,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "priority" TEXT,
    "isUrgent" BOOLEAN NOT NULL DEFAULT false,
    "urgencyReason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" DATETIME,
    "resolution" TEXT,
    "nextVisitDate" DATETIME,
    "satisfaction" INTEGER,
    "observations" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_assistance_attendances_socialWorkerId_fkey" FOREIGN KEY ("socialWorkerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_assistance_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_assistance_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_social_assistance_attendances" ("assessment", "attendanceType", "citizenCpf", "citizenId", "citizenName", "contact", "createdAt", "description", "familyIncome", "familySize", "followUpDate", "followUpNeeded", "followUpPlan", "id", "interventionPlan", "nextVisitDate", "priority", "protocol", "protocolId", "referrals", "referredBy", "resolution", "satisfaction", "serviceType", "socialWorker", "socialWorkerId", "status", "subject", "updatedAt", "urgency", "vulnerability") SELECT "assessment", "attendanceType", "citizenCpf", "citizenId", "citizenName", "contact", "createdAt", "description", "familyIncome", "familySize", "followUpDate", "followUpNeeded", "followUpPlan", "id", "interventionPlan", "nextVisitDate", "priority", "protocol", "protocolId", "referrals", "referredBy", "resolution", "satisfaction", "serviceType", "socialWorker", "socialWorkerId", "status", "subject", "updatedAt", "urgency", "vulnerability" FROM "social_assistance_attendances";
DROP TABLE "social_assistance_attendances";
ALTER TABLE "new_social_assistance_attendances" RENAME TO "social_assistance_attendances";
CREATE UNIQUE INDEX "social_assistance_attendances_protocol_key" ON "social_assistance_attendances"("protocol");
CREATE INDEX "social_assistance_attendances_protocolId_idx" ON "social_assistance_attendances"("protocolId");
CREATE INDEX "social_assistance_attendances_status_idx" ON "social_assistance_attendances"("status");
CREATE INDEX "social_assistance_attendances_createdAt_idx" ON "social_assistance_attendances"("createdAt");
CREATE TABLE "new_social_equipments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "citizenId" TEXT,
    "equipmentType" TEXT NOT NULL,
    "name" TEXT,
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
    "creationDate" DATETIME,
    "lastInspectionDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "operationStatus" TEXT,
    "approvedAt" DATETIME,
    "observations" TEXT,
    "internalNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "social_equipments_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_equipments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_social_equipments" ("address", "capacity", "coordinates", "coordinator", "coordinatorId", "createdAt", "currentOccupancy", "email", "equipmentName", "equipmentType", "id", "isActive", "observations", "phone", "protocolId", "schedule", "services", "status", "updatedAt") SELECT "address", "capacity", "coordinates", "coordinator", "coordinatorId", "createdAt", "currentOccupancy", "email", "equipmentName", "equipmentType", "id", "isActive", "observations", "phone", "protocolId", "schedule", "services", "status", "updatedAt" FROM "social_equipments";
DROP TABLE "social_equipments";
ALTER TABLE "new_social_equipments" RENAME TO "social_equipments";
CREATE TABLE "new_social_group_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "social_group_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_group_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_social_group_enrollments" ("citizenId", "createdAt", "enrollmentDate", "frequency", "groupName", "groupType", "id", "instructor", "observations", "participantCpf", "participantName", "protocolId", "schedule", "status", "updatedAt") SELECT "citizenId", "createdAt", "enrollmentDate", "frequency", "groupName", "groupType", "id", "instructor", "observations", "participantCpf", "participantName", "protocolId", "schedule", "status", "updatedAt" FROM "social_group_enrollments";
DROP TABLE "social_group_enrollments";
ALTER TABLE "new_social_group_enrollments" RENAME TO "social_group_enrollments";
CREATE TABLE "new_social_program_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "social_program_enrollments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "social_program_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_social_program_enrollments" ("approvedDate", "beneficiaryCpf", "beneficiaryName", "benefits", "citizenId", "createdAt", "endDate", "enrollmentDate", "familySize", "id", "monthlyIncome", "observations", "priority", "programName", "programType", "protocolId", "startDate", "status", "updatedAt") SELECT "approvedDate", "beneficiaryCpf", "beneficiaryName", "benefits", "citizenId", "createdAt", "endDate", "enrollmentDate", "familySize", "id", "monthlyIncome", "observations", "priority", "programName", "programType", "protocolId", "startDate", "status", "updatedAt" FROM "social_program_enrollments";
DROP TABLE "social_program_enrollments";
ALTER TABLE "new_social_program_enrollments" RENAME TO "social_program_enrollments";
CREATE INDEX "social_program_enrollments_protocolId_idx" ON "social_program_enrollments"("protocolId");
CREATE INDEX "social_program_enrollments_status_idx" ON "social_program_enrollments"("status");
CREATE INDEX "social_program_enrollments_createdAt_idx" ON "social_program_enrollments"("createdAt");
CREATE TABLE "new_social_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_social_programs" ("benefitValue", "benefits", "budget", "coordinator", "createdAt", "currentBeneficiaries", "description", "endDate", "evaluation", "frequency", "id", "isActive", "maxBeneficiaries", "maxParticipants", "name", "objectives", "partners", "programType", "registrationPeriod", "requirements", "results", "selectionCriteria", "startDate", "status", "targetAudience", "targetGroup", "updatedAt") SELECT "benefitValue", "benefits", "budget", "coordinator", "createdAt", "currentBeneficiaries", "description", "endDate", "evaluation", "frequency", "id", "isActive", "maxBeneficiaries", "maxParticipants", "name", "objectives", "partners", "programType", "registrationPeriod", "requirements", "results", "selectionCriteria", "startDate", "status", "targetAudience", "targetGroup", "updatedAt" FROM "social_programs";
DROP TABLE "social_programs";
ALTER TABLE "new_social_programs" RENAME TO "social_programs";
CREATE TABLE "new_soil_analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_soil_analyses" ("analysisType", "analyzedBy", "collectedBy", "collectionDate", "coordinates", "createdAt", "cropIntended", "id", "labId", "labSentDate", "producerCpf", "producerName", "producerPhone", "propertyArea", "propertyLocation", "protocol", "purpose", "recommendations", "results", "resultsDate", "sampleCount", "sampleLocations", "serviceId", "source", "status", "technicalReport", "updatedAt") SELECT "analysisType", "analyzedBy", "collectedBy", "collectionDate", "coordinates", "createdAt", "cropIntended", "id", "labId", "labSentDate", "producerCpf", "producerName", "producerPhone", "propertyArea", "propertyLocation", "protocol", "purpose", "recommendations", "results", "resultsDate", "sampleCount", "sampleLocations", "serviceId", "source", "status", "technicalReport", "updatedAt" FROM "soil_analyses";
DROP TABLE "soil_analyses";
ALTER TABLE "new_soil_analyses" RENAME TO "soil_analyses";
CREATE INDEX "soil_analyses_protocol_idx" ON "soil_analyses"("protocol");
CREATE INDEX "soil_analyses_status_idx" ON "soil_analyses"("status");
CREATE TABLE "new_special_collections" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "special_collections_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_special_collections" ("actualVolume", "address", "citizenId", "collectionDate", "collectionType", "contact", "coordinates", "cost", "createdAt", "description", "destination", "estimatedVolume", "id", "observations", "photos", "preferredDate", "protocolId", "quantity", "requestDate", "requestorCpf", "requestorName", "satisfaction", "scheduledDate", "status", "teamAssigned", "timeSlot", "unit", "updatedAt", "vehicle") SELECT "actualVolume", "address", "citizenId", "collectionDate", "collectionType", "contact", "coordinates", "cost", "createdAt", "description", "destination", "estimatedVolume", "id", "observations", "photos", "preferredDate", "protocolId", "quantity", "requestDate", "requestorCpf", "requestorName", "satisfaction", "scheduledDate", "status", "teamAssigned", "timeSlot", "unit", "updatedAt", "vehicle" FROM "special_collections";
DROP TABLE "special_collections";
ALTER TABLE "new_special_collections" RENAME TO "special_collections";
CREATE TABLE "new_specialized_pages" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_specialized_pages" ("analytics", "code", "contacts", "content", "createdAt", "customCss", "customJs", "departmentId", "description", "documents", "functions", "id", "images", "isActive", "isPublished", "lastModified", "links", "metadata", "modifiedBy", "name", "pageKey", "pageType", "publishDate", "secretaria", "sections", "services", "template", "title", "updatedAt", "version") SELECT "analytics", "code", "contacts", "content", "createdAt", "customCss", "customJs", "departmentId", "description", "documents", "functions", "id", "images", "isActive", "isPublished", "lastModified", "links", "metadata", "modifiedBy", "name", "pageKey", "pageType", "publishDate", "secretaria", "sections", "services", "template", "title", "updatedAt", "version" FROM "specialized_pages";
DROP TABLE "specialized_pages";
ALTER TABLE "new_specialized_pages" RENAME TO "specialized_pages";
CREATE UNIQUE INDEX "specialized_pages_pageKey_key" ON "specialized_pages"("pageKey");
CREATE UNIQUE INDEX "specialized_pages_code_key" ON "specialized_pages"("code");
CREATE TABLE "new_sports_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "sports_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sports_attendances" ("attachments", "citizenId", "citizenName", "contact", "createdAt", "description", "eventDate", "expectedParticipants", "followUpDate", "followUpNeeded", "id", "location", "observations", "priority", "protocol", "protocolId", "referredTo", "resolution", "responsible", "serviceId", "serviceType", "source", "sport", "sportType", "status", "type", "updatedAt") SELECT "attachments", "citizenId", "citizenName", "contact", "createdAt", "description", "eventDate", "expectedParticipants", "followUpDate", "followUpNeeded", "id", "location", "observations", "priority", "protocol", "protocolId", "referredTo", "resolution", "responsible", "serviceId", "serviceType", "source", "sport", "sportType", "status", "type", "updatedAt" FROM "sports_attendances";
DROP TABLE "sports_attendances";
ALTER TABLE "new_sports_attendances" RENAME TO "sports_attendances";
CREATE UNIQUE INDEX "sports_attendances_protocol_key" ON "sports_attendances"("protocol");
CREATE INDEX "sports_attendances_protocolId_idx" ON "sports_attendances"("protocolId");
CREATE INDEX "sports_attendances_status_idx" ON "sports_attendances"("status");
CREATE INDEX "sports_attendances_createdAt_idx" ON "sports_attendances"("createdAt");
CREATE TABLE "new_sports_clubs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "foundationDate" DATETIME,
    "president" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "members" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_sports_clubs" ("address", "contact", "createdAt", "foundationDate", "id", "members", "name", "president", "sport", "status", "updatedAt") SELECT "address", "contact", "createdAt", "foundationDate", "id", "members", "name", "president", "sport", "status", "updatedAt" FROM "sports_clubs";
DROP TABLE "sports_clubs";
ALTER TABLE "new_sports_clubs" RENAME TO "sports_clubs";
CREATE TABLE "new_sports_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_sports_events" ("capacity", "contact", "createdAt", "currentParticipants", "date", "description", "endDate", "endTime", "entryFee", "eventType", "id", "isPublic", "location", "maxParticipants", "name", "organizer", "registrationFee", "registrationRequired", "responsible", "sport", "startDate", "startTime", "status", "targetAudience", "title", "type", "updatedAt") SELECT "capacity", "contact", "createdAt", "currentParticipants", "date", "description", "endDate", "endTime", "entryFee", "eventType", "id", "isPublic", "location", "maxParticipants", "name", "organizer", "registrationFee", "registrationRequired", "responsible", "sport", "startDate", "startTime", "status", "targetAudience", "title", "type", "updatedAt" FROM "sports_events";
DROP TABLE "sports_events";
ALTER TABLE "new_sports_events" RENAME TO "sports_events";
CREATE TABLE "new_sports_infrastructure_reservations" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "sports_infrastructure_reservations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sports_infrastructure_reservations" ("approvedAt", "approvedBy", "createdAt", "date", "endTime", "equipment", "expectedPeople", "id", "infrastructureId", "infrastructureName", "observations", "organization", "protocolId", "purpose", "rejectionReason", "requesterCpf", "requesterEmail", "requesterName", "requesterPhone", "serviceId", "source", "sport", "startTime", "status", "updatedAt") SELECT "approvedAt", "approvedBy", "createdAt", "date", "endTime", "equipment", "expectedPeople", "id", "infrastructureId", "infrastructureName", "observations", "organization", "protocolId", "purpose", "rejectionReason", "requesterCpf", "requesterEmail", "requesterName", "requesterPhone", "serviceId", "source", "sport", "startTime", "status", "updatedAt" FROM "sports_infrastructure_reservations";
DROP TABLE "sports_infrastructure_reservations";
ALTER TABLE "new_sports_infrastructure_reservations" RENAME TO "sports_infrastructure_reservations";
CREATE TABLE "new_sports_infrastructures" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "sports_infrastructures_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sports_infrastructures" ("accessibility", "address", "bookingRules", "capacity", "contact", "coordinates", "covered", "createdAt", "dimensions", "equipment", "facilities", "id", "isPublic", "lastMaintenance", "lighting", "maintenanceSchedule", "manager", "modalities", "name", "operatingHours", "protocolId", "sports", "status", "surface", "type", "updatedAt") SELECT "accessibility", "address", "bookingRules", "capacity", "contact", "coordinates", "covered", "createdAt", "dimensions", "equipment", "facilities", "id", "isPublic", "lastMaintenance", "lighting", "maintenanceSchedule", "manager", "modalities", "name", "operatingHours", "protocolId", "sports", "status", "surface", "type", "updatedAt" FROM "sports_infrastructures";
DROP TABLE "sports_infrastructures";
ALTER TABLE "new_sports_infrastructures" RENAME TO "sports_infrastructures";
CREATE TABLE "new_sports_modalities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "equipment" JSONB,
    "rules" TEXT,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sports_modalities_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sports_modalities" ("category", "createdAt", "description", "equipment", "id", "isActive", "maxAge", "minAge", "name", "protocolId", "rules", "updatedAt") SELECT "category", "createdAt", "description", "equipment", "id", "isActive", "maxAge", "minAge", "name", "protocolId", "rules", "updatedAt" FROM "sports_modalities";
DROP TABLE "sports_modalities";
ALTER TABLE "new_sports_modalities" RENAME TO "sports_modalities";
CREATE TABLE "new_sports_school_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "sports_school_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sports_school_enrollments" ("address", "attendance", "createdAt", "emergencyContact", "enrollmentDate", "id", "level", "medicalCertificate", "neighborhood", "observations", "parentCpf", "parentEmail", "parentName", "parentPhone", "protocolId", "serviceId", "source", "sport", "sportsSchoolId", "status", "studentBirthDate", "studentCpf", "studentName", "studentRg", "uniforms", "updatedAt") SELECT "address", "attendance", "createdAt", "emergencyContact", "enrollmentDate", "id", "level", "medicalCertificate", "neighborhood", "observations", "parentCpf", "parentEmail", "parentName", "parentPhone", "protocolId", "serviceId", "source", "sport", "sportsSchoolId", "status", "studentBirthDate", "studentCpf", "studentName", "studentRg", "uniforms", "updatedAt" FROM "sports_school_enrollments";
DROP TABLE "sports_school_enrollments";
ALTER TABLE "new_sports_school_enrollments" RENAME TO "sports_school_enrollments";
CREATE INDEX "sports_school_enrollments_protocolId_idx" ON "sports_school_enrollments"("protocolId");
CREATE INDEX "sports_school_enrollments_status_idx" ON "sports_school_enrollments"("status");
CREATE INDEX "sports_school_enrollments_createdAt_idx" ON "sports_school_enrollments"("createdAt");
CREATE TABLE "new_sports_schools" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "sports_schools_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sports_schools" ("createdAt", "currentStudents", "description", "endDate", "equipment", "id", "instructor", "instructorCpf", "isActive", "location", "maxStudents", "monthlyFee", "name", "protocolId", "requirements", "schedule", "sport", "startDate", "status", "targetAge", "updatedAt") SELECT "createdAt", "currentStudents", "description", "endDate", "equipment", "id", "instructor", "instructorCpf", "isActive", "location", "maxStudents", "monthlyFee", "name", "protocolId", "requirements", "schedule", "sport", "startDate", "status", "targetAge", "updatedAt" FROM "sports_schools";
DROP TABLE "sports_schools";
ALTER TABLE "new_sports_schools" RENAME TO "sports_schools";
CREATE TABLE "new_sports_teams" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "sports_teams_modalityId_fkey" FOREIGN KEY ("modalityId") REFERENCES "sports_modalities" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sports_teams_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sports_teams" ("achievements", "ageGroup", "category", "coach", "coachCpf", "coachPhone", "createdAt", "currentPlayers", "description", "foundationDate", "gender", "homeVenue", "id", "isActive", "maxPlayers", "modalityId", "name", "protocol", "protocolId", "roster", "serviceId", "source", "sport", "status", "trainingSchedule", "updatedAt") SELECT "achievements", "ageGroup", "category", "coach", "coachCpf", "coachPhone", "createdAt", "currentPlayers", "description", "foundationDate", "gender", "homeVenue", "id", "isActive", "maxPlayers", "modalityId", "name", "protocol", "protocolId", "roster", "serviceId", "source", "sport", "status", "trainingSchedule", "updatedAt" FROM "sports_teams";
DROP TABLE "sports_teams";
ALTER TABLE "new_sports_teams" RENAME TO "sports_teams";
CREATE TABLE "new_street_lightings" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "street_lightings_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_street_lightings" ("condition", "coordinates", "createdAt", "energyConsumption", "height", "id", "installDate", "isActive", "issues", "lampType", "lastMaintenance", "maintenanceHistory", "neighborhood", "nextMaintenance", "observations", "photos", "pointCode", "poleType", "power", "protocolId", "status", "streetName", "updatedAt") SELECT "condition", "coordinates", "createdAt", "energyConsumption", "height", "id", "installDate", "isActive", "issues", "lampType", "lastMaintenance", "maintenanceHistory", "neighborhood", "nextMaintenance", "observations", "photos", "pointCode", "poleType", "power", "protocolId", "status", "streetName", "updatedAt" FROM "street_lightings";
DROP TABLE "street_lightings";
ALTER TABLE "new_street_lightings" RENAME TO "street_lightings";
CREATE UNIQUE INDEX "street_lightings_pointCode_key" ON "street_lightings"("pointCode");
CREATE INDEX "street_lightings_protocolId_idx" ON "street_lightings"("protocolId");
CREATE INDEX "street_lightings_status_idx" ON "street_lightings"("status");
CREATE INDEX "street_lightings_createdAt_idx" ON "street_lightings"("createdAt");
CREATE TABLE "new_student_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "present" BOOLEAN NOT NULL,
    "justification" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_attendances_classId_fkey" FOREIGN KEY ("classId") REFERENCES "school_classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_student_attendances" ("classId", "createdAt", "date", "id", "justification", "present", "studentId") SELECT "classId", "createdAt", "date", "id", "justification", "present", "studentId" FROM "student_attendances";
DROP TABLE "student_attendances";
ALTER TABLE "new_student_attendances" RENAME TO "student_attendances";
CREATE UNIQUE INDEX "student_attendances_studentId_classId_date_key" ON "student_attendances"("studentId", "classId", "date");
CREATE TABLE "new_student_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_student_enrollments" ("classId", "createdAt", "enrollmentDate", "grade", "id", "schoolId", "status", "studentId", "updatedAt", "year") SELECT "classId", "createdAt", "enrollmentDate", "grade", "id", "schoolId", "status", "studentId", "updatedAt", "year" FROM "student_enrollments";
DROP TABLE "student_enrollments";
ALTER TABLE "new_student_enrollments" RENAME TO "student_enrollments";
CREATE INDEX "student_enrollments_status_idx" ON "student_enrollments"("status");
CREATE INDEX "student_enrollments_createdAt_idx" ON "student_enrollments"("createdAt");
CREATE UNIQUE INDEX "student_enrollments_studentId_classId_year_key" ON "student_enrollments"("studentId", "classId", "year");
CREATE TABLE "new_student_transfers" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "moduleType" TEXT NOT NULL DEFAULT 'TRANSFERENCIA_ESCOLAR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_transfers_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_student_transfers" ("approvedBy", "createdAt", "currentSchool", "documents", "grade", "id", "moduleType", "observations", "protocolId", "requestDate", "status", "studentId", "studentName", "targetSchool", "transferDate", "transferReason", "updatedAt") SELECT "approvedBy", "createdAt", "currentSchool", "documents", "grade", "id", "moduleType", "observations", "protocolId", "requestDate", "status", "studentId", "studentName", "targetSchool", "transferDate", "transferReason", "updatedAt" FROM "student_transfers";
DROP TABLE "student_transfers";
ALTER TABLE "new_student_transfers" RENAME TO "student_transfers";
CREATE INDEX "student_transfers_moduleType_idx" ON "student_transfers"("moduleType");
CREATE INDEX "student_transfers_protocolId_idx" ON "student_transfers"("protocolId");
CREATE TABLE "new_students" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "moduleType" TEXT NOT NULL DEFAULT 'MATRICULA_ALUNO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "schoolId" TEXT NOT NULL,
    CONSTRAINT "students_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "students_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_students" ("address", "birthDate", "cpf", "createdAt", "id", "isActive", "medicalInfo", "moduleType", "name", "parentEmail", "parentName", "parentPhone", "protocolId", "rg", "schoolId", "updatedAt") SELECT "address", "birthDate", "cpf", "createdAt", "id", "isActive", "medicalInfo", "moduleType", "name", "parentEmail", "parentName", "parentPhone", "protocolId", "rg", "schoolId", "updatedAt" FROM "students";
DROP TABLE "students";
ALTER TABLE "new_students" RENAME TO "students";
CREATE INDEX "students_moduleType_idx" ON "students"("moduleType");
CREATE INDEX "students_protocolId_idx" ON "students"("protocolId");
CREATE INDEX "students_createdAt_idx" ON "students"("createdAt");
CREATE UNIQUE INDEX "students_cpf_key" ON "students"("cpf");
CREATE TABLE "new_surveillance_systems" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "surveillance_systems_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_surveillance_systems" ("address", "alerts", "apiAccess", "area", "bandwidth", "cameraType", "connectionType", "coordinates", "coverageArea", "createdAt", "createdBy", "downtimeHours", "hasAudio", "hasNightVision", "id", "incidentsDetected", "installationDate", "integratedWith", "ipAddress", "isActive", "isMonitored", "lastMaintenance", "location", "maintenanceHistory", "manufacturer", "model", "monitoringCenter", "nextMaintenance", "notes", "protocolId", "range", "recordingDays", "resolution", "status", "systemCode", "systemName", "technicalSpecs", "type", "updatedAt", "viewAngle", "warrantyExpires", "zone") SELECT "address", "alerts", "apiAccess", "area", "bandwidth", "cameraType", "connectionType", "coordinates", "coverageArea", "createdAt", "createdBy", "downtimeHours", "hasAudio", "hasNightVision", "id", "incidentsDetected", "installationDate", "integratedWith", "ipAddress", "isActive", "isMonitored", "lastMaintenance", "location", "maintenanceHistory", "manufacturer", "model", "monitoringCenter", "nextMaintenance", "notes", "protocolId", "range", "recordingDays", "resolution", "status", "systemCode", "systemName", "technicalSpecs", "type", "updatedAt", "viewAngle", "warrantyExpires", "zone" FROM "surveillance_systems";
DROP TABLE "surveillance_systems";
ALTER TABLE "new_surveillance_systems" RENAME TO "surveillance_systems";
CREATE UNIQUE INDEX "surveillance_systems_systemCode_key" ON "surveillance_systems"("systemCode");
CREATE INDEX "surveillance_systems_status_idx" ON "surveillance_systems"("status");
CREATE INDEX "surveillance_systems_type_idx" ON "surveillance_systems"("type");
CREATE INDEX "surveillance_systems_systemCode_idx" ON "surveillance_systems"("systemCode");
CREATE TABLE "new_team_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "team_schedules_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_team_schedules" ("breakTime", "createdAt", "dailyTasks", "endTime", "equipment", "id", "isActive", "members", "monthlyTasks", "observations", "productivity", "protocolId", "shift", "shiftEnd", "shiftStart", "startTime", "teamLead", "teamName", "teamType", "updatedAt", "vehicles", "weeklyTasks", "workAreas", "workDays") SELECT "breakTime", "createdAt", "dailyTasks", "endTime", "equipment", "id", "isActive", "members", "monthlyTasks", "observations", "productivity", "protocolId", "shift", "shiftEnd", "shiftStart", "startTime", "teamLead", "teamName", "teamType", "updatedAt", "vehicles", "weeklyTasks", "workAreas", "workDays" FROM "team_schedules";
DROP TABLE "team_schedules";
ALTER TABLE "new_team_schedules" RENAME TO "team_schedules";
CREATE TABLE "new_technical_assistances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenId" TEXT NOT NULL,
    "protocolId" TEXT,
    "producerId" TEXT,
    "propertyId" TEXT,
    "assistanceType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "propertyName" TEXT,
    "propertySize" REAL,
    "propertyArea" REAL,
    "location" TEXT,
    "coordinates" JSONB,
    "crop" TEXT,
    "cropTypes" JSONB,
    "livestock" TEXT,
    "mainCrops" JSONB,
    "requestDate" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "preferredDate" DATETIME,
    "scheduledDate" DATETIME,
    "scheduledVisit" DATETIME,
    "visitDate" DATETIME,
    "technician" TEXT,
    "technicianId" TEXT,
    "findings" TEXT,
    "recommendations" JSONB,
    "visitReport" JSONB,
    "followUpPlan" JSONB,
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpDate" DATETIME,
    "followUpNotes" TEXT,
    "nextVisitDate" DATETIME,
    "materials" JSONB,
    "costs" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "satisfaction" INTEGER,
    "photos" JSONB,
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "completedBy" TEXT,
    "completedAt" DATETIME,
    "propertyLocation" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "technical_assistances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "technical_assistances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_technical_assistances" ("assistanceType", "completedAt", "completedBy", "coordinates", "costs", "createdAt", "crop", "cropTypes", "description", "findings", "followUpDate", "followUpNotes", "followUpPlan", "followUpRequired", "id", "livestock", "location", "materials", "nextVisitDate", "observations", "photos", "priority", "propertyArea", "propertyLocation", "propertyName", "propertySize", "protocolId", "recommendations", "requestDate", "satisfaction", "scheduledDate", "scheduledVisit", "serviceId", "source", "status", "subject", "technician", "technicianId", "updatedAt", "visitDate", "visitReport") SELECT "assistanceType", "completedAt", "completedBy", "coordinates", "costs", "createdAt", "crop", "cropTypes", "description", "findings", "followUpDate", "followUpNotes", "followUpPlan", "followUpRequired", "id", "livestock", "location", "materials", "nextVisitDate", "observations", "photos", "priority", "propertyArea", "propertyLocation", "propertyName", "propertySize", "protocolId", "recommendations", "requestDate", "satisfaction", "scheduledDate", "scheduledVisit", "serviceId", "source", "status", "subject", "technician", "technicianId", "updatedAt", "visitDate", "visitReport" FROM "technical_assistances";
DROP TABLE "technical_assistances";
ALTER TABLE "new_technical_assistances" RENAME TO "technical_assistances";
CREATE UNIQUE INDEX "technical_assistances_protocolId_key" ON "technical_assistances"("protocolId");
CREATE INDEX "technical_assistances_citizenId_idx" ON "technical_assistances"("citizenId");
CREATE INDEX "technical_assistances_producerId_idx" ON "technical_assistances"("producerId");
CREATE INDEX "technical_assistances_protocolId_idx" ON "technical_assistances"("protocolId");
CREATE INDEX "technical_assistances_status_idx" ON "technical_assistances"("status");
CREATE INDEX "technical_assistances_scheduledDate_idx" ON "technical_assistances"("scheduledDate");
CREATE INDEX "technical_assistances_createdAt_idx" ON "technical_assistances"("createdAt");
CREATE TABLE "new_technical_inspections" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "technical_inspections_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_technical_inspections" ("approved", "conditions", "constructionStage", "contact", "coordinates", "createdAt", "description", "documents", "findings", "followUpDate", "id", "inspectionDate", "inspectionType", "inspector", "location", "observations", "photos", "propertyType", "protocol", "protocolId", "requestorCpf", "requestorName", "resolution", "scheduledDate", "status", "subject", "technicalOpinion", "updatedAt", "urgency", "validUntil") SELECT "approved", "conditions", "constructionStage", "contact", "coordinates", "createdAt", "description", "documents", "findings", "followUpDate", "id", "inspectionDate", "inspectionType", "inspector", "location", "observations", "photos", "propertyType", "protocol", "protocolId", "requestorCpf", "requestorName", "resolution", "scheduledDate", "status", "subject", "technicalOpinion", "updatedAt", "urgency", "validUntil" FROM "technical_inspections";
DROP TABLE "technical_inspections";
ALTER TABLE "new_technical_inspections" RENAME TO "technical_inspections";
CREATE UNIQUE INDEX "technical_inspections_protocol_key" ON "technical_inspections"("protocol");
CREATE TABLE "new_tourism_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "tourism_attendances_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tourism_attendances" ("assignedAgent", "category", "citizenId", "createdAt", "description", "followUpDate", "id", "origin", "protocol", "protocolId", "resolution", "satisfaction", "serviceId", "serviceType", "source", "status", "subject", "touristProfile", "updatedAt", "urgency", "visitorEmail", "visitorName", "visitorPhone") SELECT "assignedAgent", "category", "citizenId", "createdAt", "description", "followUpDate", "id", "origin", "protocol", "protocolId", "resolution", "satisfaction", "serviceId", "serviceType", "source", "status", "subject", "touristProfile", "updatedAt", "urgency", "visitorEmail", "visitorName", "visitorPhone" FROM "tourism_attendances";
DROP TABLE "tourism_attendances";
ALTER TABLE "new_tourism_attendances" RENAME TO "tourism_attendances";
CREATE UNIQUE INDEX "tourism_attendances_protocol_key" ON "tourism_attendances"("protocol");
CREATE INDEX "tourism_attendances_protocolId_idx" ON "tourism_attendances"("protocolId");
CREATE INDEX "tourism_attendances_status_idx" ON "tourism_attendances"("status");
CREATE INDEX "tourism_attendances_createdAt_idx" ON "tourism_attendances"("createdAt");
CREATE TABLE "new_tourism_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "tourism_events_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tourism_events" ("accessibility", "address", "ageRestriction", "amenities", "cancellationInfo", "capacity", "category", "coordinates", "createdAt", "createdBy", "description", "duration", "endDate", "endTime", "eventType", "featured", "freeEntry", "id", "isPublic", "name", "organizer", "organizerContact", "photos", "program", "promotional", "protocolId", "registeredCount", "registrationUrl", "requirements", "socialMedia", "speakers", "sponsors", "startDate", "startTime", "status", "tags", "ticketPrice", "updatedAt", "venue") SELECT "accessibility", "address", "ageRestriction", "amenities", "cancellationInfo", "capacity", "category", "coordinates", "createdAt", "createdBy", "description", "duration", "endDate", "endTime", "eventType", "featured", "freeEntry", "id", "isPublic", "name", "organizer", "organizerContact", "photos", "program", "promotional", "protocolId", "registeredCount", "registrationUrl", "requirements", "socialMedia", "speakers", "sponsors", "startDate", "startTime", "status", "tags", "ticketPrice", "updatedAt", "venue" FROM "tourism_events";
DROP TABLE "tourism_events";
ALTER TABLE "new_tourism_events" RENAME TO "tourism_events";
CREATE TABLE "new_tourism_guides" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "tourism_guides_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tourism_guides" ("address", "availableSchedule", "bankInfo", "bio", "birthDate", "certifications", "cpf", "createdAt", "email", "emergencyContact", "experienceYears", "id", "isActive", "languages", "licenseExpiry", "licenseNumber", "name", "phone", "photo", "protocolId", "rating", "registrationDate", "rg", "specialties", "status", "totalTours", "updatedAt") SELECT "address", "availableSchedule", "bankInfo", "bio", "birthDate", "certifications", "cpf", "createdAt", "email", "emergencyContact", "experienceYears", "id", "isActive", "languages", "licenseExpiry", "licenseNumber", "name", "phone", "photo", "protocolId", "rating", "registrationDate", "rg", "specialties", "status", "totalTours", "updatedAt" FROM "tourism_guides";
DROP TABLE "tourism_guides";
ALTER TABLE "new_tourism_guides" RENAME TO "tourism_guides";
CREATE UNIQUE INDEX "tourism_guides_cpf_key" ON "tourism_guides"("cpf");
CREATE TABLE "new_tourism_infos" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_tourism_infos" ("category", "content", "coordinates", "createdAt", "createdBy", "id", "images", "infoType", "isActive", "likes", "links", "location", "priority", "publication", "seo", "tags", "targetAudience", "title", "type", "updatedAt", "validFrom", "validUntil", "views") SELECT "category", "content", "coordinates", "createdAt", "createdBy", "id", "images", "infoType", "isActive", "likes", "links", "location", "priority", "publication", "seo", "tags", "targetAudience", "title", "type", "updatedAt", "validFrom", "validUntil", "views" FROM "tourism_infos";
DROP TABLE "tourism_infos";
ALTER TABLE "new_tourism_infos" RENAME TO "tourism_infos";
CREATE TABLE "new_tourism_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "tourism_programs_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tourism_programs" ("activities", "budget", "category", "coordinator", "createdAt", "currentParticipants", "description", "endDate", "evaluation", "id", "isActive", "name", "objectives", "participants", "photos", "programType", "protocolId", "results", "startDate", "status", "targetAudience", "type", "updatedAt") SELECT "activities", "budget", "category", "coordinator", "createdAt", "currentParticipants", "description", "endDate", "evaluation", "id", "isActive", "name", "objectives", "participants", "photos", "programType", "protocolId", "results", "startDate", "status", "targetAudience", "type", "updatedAt" FROM "tourism_programs";
DROP TABLE "tourism_programs";
ALTER TABLE "new_tourism_programs" RENAME TO "tourism_programs";
CREATE TABLE "new_tourism_routes" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "tourism_routes_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tourism_routes" ("accessibility", "attractions", "bestSeason", "createdAt", "createdBy", "description", "difficulty", "distance", "duration", "endPoint", "estimatedCost", "featured", "guideRequired", "id", "isActive", "mapData", "maxGroupSize", "minimumAge", "name", "photos", "protocolId", "rating", "recommendations", "routeType", "services", "startPoint", "totalViews", "updatedAt", "warnings", "waypoints") SELECT "accessibility", "attractions", "bestSeason", "createdAt", "createdBy", "description", "difficulty", "distance", "duration", "endPoint", "estimatedCost", "featured", "guideRequired", "id", "isActive", "mapData", "maxGroupSize", "minimumAge", "name", "photos", "protocolId", "rating", "recommendations", "routeType", "services", "startPoint", "totalViews", "updatedAt", "warnings", "waypoints" FROM "tourism_routes";
DROP TABLE "tourism_routes";
ALTER TABLE "new_tourism_routes" RENAME TO "tourism_routes";
CREATE TABLE "new_tourist_attractions" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "tourist_attractions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tourist_attractions" ("accessibility", "address", "amenities", "category", "city", "coordinates", "createdAt", "description", "facilities", "featured", "freeEntry", "id", "images", "isActive", "name", "neighborhood", "openingHours", "protocol", "protocolId", "rating", "serviceId", "state", "ticketPrice", "type", "updatedAt") SELECT "accessibility", "address", "amenities", "category", "city", "coordinates", "createdAt", "description", "facilities", "featured", "freeEntry", "id", "images", "isActive", "name", "neighborhood", "openingHours", "protocol", "protocolId", "rating", "serviceId", "state", "ticketPrice", "type", "updatedAt" FROM "tourist_attractions";
DROP TABLE "tourist_attractions";
ALTER TABLE "new_tourist_attractions" RENAME TO "tourist_attractions";
CREATE INDEX "tourist_attractions_protocolId_idx" ON "tourist_attractions"("protocolId");
CREATE INDEX "tourist_attractions_createdAt_idx" ON "tourist_attractions"("createdAt");
CREATE TABLE "new_tournament_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "tournament_enrollments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tournament_enrollments" ("ageGroup", "approvedAt", "approvedBy", "athleteCpf", "athleteName", "category", "coachEmail", "coachName", "coachPhone", "createdAt", "enrollmentDate", "id", "observations", "participantType", "paymentProof", "paymentStatus", "playersCount", "playersList", "protocolId", "rejectionReason", "serviceId", "source", "sport", "status", "teamName", "tournamentId", "tournamentName", "updatedAt") SELECT "ageGroup", "approvedAt", "approvedBy", "athleteCpf", "athleteName", "category", "coachEmail", "coachName", "coachPhone", "createdAt", "enrollmentDate", "id", "observations", "participantType", "paymentProof", "paymentStatus", "playersCount", "playersList", "protocolId", "rejectionReason", "serviceId", "source", "sport", "status", "teamName", "tournamentId", "tournamentName", "updatedAt" FROM "tournament_enrollments";
DROP TABLE "tournament_enrollments";
ALTER TABLE "new_tournament_enrollments" RENAME TO "tournament_enrollments";
CREATE TABLE "new_tree_authorizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_tree_authorizations" ("applicantCpf", "applicantName", "applicantPhone", "approvedAt", "approvedBy", "authorizationType", "compensationPlan", "coordinates", "createdAt", "executedAt", "id", "inspectionDate", "inspectorId", "location", "photos", "protocol", "reason", "requiresCompensation", "serviceId", "source", "status", "technicalReport", "treeCount", "treeData", "treeSpecies", "updatedAt") SELECT "applicantCpf", "applicantName", "applicantPhone", "approvedAt", "approvedBy", "authorizationType", "compensationPlan", "coordinates", "createdAt", "executedAt", "id", "inspectionDate", "inspectorId", "location", "photos", "protocol", "reason", "requiresCompensation", "serviceId", "source", "status", "technicalReport", "treeCount", "treeData", "treeSpecies", "updatedAt" FROM "tree_authorizations";
DROP TABLE "tree_authorizations";
ALTER TABLE "new_tree_authorizations" RENAME TO "tree_authorizations";
CREATE INDEX "tree_authorizations_protocol_idx" ON "tree_authorizations"("protocol");
CREATE INDEX "tree_authorizations_status_idx" ON "tree_authorizations"("status");
CREATE TABLE "new_tree_cutting_authorizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "tree_cutting_authorizations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tree_cutting_authorizations" ("applicantCpf", "applicantEmail", "applicantName", "applicantPhone", "authorizationDate", "authorizationNumber", "conditions", "coordinates", "createdAt", "decision", "executionDate", "fee", "id", "inspectionDate", "inspectionReport", "inspector", "justification", "observations", "photos", "propertyAddress", "protocolId", "requestDate", "requestType", "status", "technicalReport", "treeHeight", "treeQuantity", "treeSpecies", "trunkDiameter", "updatedAt", "validUntil") SELECT "applicantCpf", "applicantEmail", "applicantName", "applicantPhone", "authorizationDate", "authorizationNumber", "conditions", "coordinates", "createdAt", "decision", "executionDate", "fee", "id", "inspectionDate", "inspectionReport", "inspector", "justification", "observations", "photos", "propertyAddress", "protocolId", "requestDate", "requestType", "status", "technicalReport", "treeHeight", "treeQuantity", "treeSpecies", "trunkDiameter", "updatedAt", "validUntil" FROM "tree_cutting_authorizations";
DROP TABLE "tree_cutting_authorizations";
ALTER TABLE "new_tree_cutting_authorizations" RENAME TO "tree_cutting_authorizations";
CREATE UNIQUE INDEX "tree_cutting_authorizations_authorizationNumber_key" ON "tree_cutting_authorizations"("authorizationNumber");
CREATE TABLE "new_tree_pruning_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "tree_pruning_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_tree_pruning_requests" ("address", "approvalNotes", "approved", "assignedTeam", "citizenId", "completionDate", "contact", "coordinates", "createdAt", "description", "equipmentUsed", "id", "location", "materialRemoved", "observations", "photos", "preferredDate", "protocolId", "pruningType", "reason", "requestDate", "requestorCpf", "requestorName", "riskLevel", "satisfaction", "scheduledDate", "status", "technicalVisit", "treeHeight", "treeSpecies", "trunkDiameter", "updatedAt", "urgency", "visitDate", "workDetails", "workHours") SELECT "address", "approvalNotes", "approved", "assignedTeam", "citizenId", "completionDate", "contact", "coordinates", "createdAt", "description", "equipmentUsed", "id", "location", "materialRemoved", "observations", "photos", "preferredDate", "protocolId", "pruningType", "reason", "requestDate", "requestorCpf", "requestorName", "riskLevel", "satisfaction", "scheduledDate", "status", "technicalVisit", "treeHeight", "treeSpecies", "trunkDiameter", "updatedAt", "urgency", "visitDate", "workDetails", "workHours" FROM "tree_pruning_requests";
DROP TABLE "tree_pruning_requests";
ALTER TABLE "new_tree_pruning_requests" RENAME TO "tree_pruning_requests";
CREATE TABLE "new_urban_certificates" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
INSERT INTO "new_urban_certificates" ("applicantCpf", "applicantEmail", "applicantName", "applicantPhone", "blockNumber", "cadastralNumber", "certificateNumber", "certificateType", "createdAt", "documents", "id", "issuedBy", "issuedDate", "landUse", "lotNumber", "neighborhood", "observations", "propertyAddress", "propertyNumber", "protocol", "purpose", "restrictions", "serviceId", "source", "status", "updatedAt", "validUntil", "verifiedBy", "zoning") SELECT "applicantCpf", "applicantEmail", "applicantName", "applicantPhone", "blockNumber", "cadastralNumber", "certificateNumber", "certificateType", "createdAt", "documents", "id", "issuedBy", "issuedDate", "landUse", "lotNumber", "neighborhood", "observations", "propertyAddress", "propertyNumber", "protocol", "purpose", "restrictions", "serviceId", "source", "status", "updatedAt", "validUntil", "verifiedBy", "zoning" FROM "urban_certificates";
DROP TABLE "urban_certificates";
ALTER TABLE "new_urban_certificates" RENAME TO "urban_certificates";
CREATE UNIQUE INDEX "urban_certificates_certificateNumber_key" ON "urban_certificates"("certificateNumber");
CREATE INDEX "urban_certificates_protocol_idx" ON "urban_certificates"("protocol");
CREATE INDEX "urban_certificates_status_idx" ON "urban_certificates"("status");
CREATE INDEX "urban_certificates_certificateType_idx" ON "urban_certificates"("certificateType");
CREATE TABLE "new_urban_cleanings" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "urban_cleanings_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_urban_cleanings" ("address", "areaSize", "assignedTeam", "cleaningType", "completionDate", "coordinates", "cost", "createdAt", "description", "equipmentUsed", "frequency", "id", "location", "neighborhood", "observations", "photos", "priority", "protocolId", "requestDate", "satisfaction", "scheduledDate", "serviceType", "status", "teamLeader", "updatedAt", "vehiclesUsed", "wasteCollected", "wasteType", "workHours", "workers") SELECT "address", "areaSize", "assignedTeam", "cleaningType", "completionDate", "coordinates", "cost", "createdAt", "description", "equipmentUsed", "frequency", "id", "location", "neighborhood", "observations", "photos", "priority", "protocolId", "requestDate", "satisfaction", "scheduledDate", "serviceType", "status", "teamLeader", "updatedAt", "vehiclesUsed", "wasteCollected", "wasteType", "workHours", "workers" FROM "urban_cleanings";
DROP TABLE "urban_cleanings";
ALTER TABLE "new_urban_cleanings" RENAME TO "urban_cleanings";
CREATE TABLE "new_urban_infractions" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "urban_infractions_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_urban_infractions" ("assignedTo", "complainantEmail", "complainantName", "complainantPhone", "createdAt", "description", "documents", "id", "infractionType", "inspectionDate", "latitude", "longitude", "neighborhood", "observations", "photos", "priority", "propertyAddress", "propertyNumber", "protocolId", "resolutionDate", "status", "submissionDate", "updatedAt") SELECT "assignedTo", "complainantEmail", "complainantName", "complainantPhone", "createdAt", "description", "documents", "id", "infractionType", "inspectionDate", "latitude", "longitude", "neighborhood", "observations", "photos", "priority", "propertyAddress", "propertyNumber", "protocolId", "resolutionDate", "status", "submissionDate", "updatedAt" FROM "urban_infractions";
DROP TABLE "urban_infractions";
ALTER TABLE "new_urban_infractions" RENAME TO "urban_infractions";
CREATE TABLE "new_urban_maintenance_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_urban_maintenance_requests" ("assignedTeam", "assignedTo", "completedAt", "completedBy", "completionNotes", "coordinates", "createdAt", "description", "details", "id", "location", "photos", "priority", "protocol", "scheduledFor", "serviceId", "source", "status", "type", "updatedAt") SELECT "assignedTeam", "assignedTo", "completedAt", "completedBy", "completionNotes", "coordinates", "createdAt", "description", "details", "id", "location", "photos", "priority", "protocol", "scheduledFor", "serviceId", "source", "status", "type", "updatedAt" FROM "urban_maintenance_requests";
DROP TABLE "urban_maintenance_requests";
ALTER TABLE "new_urban_maintenance_requests" RENAME TO "urban_maintenance_requests";
CREATE INDEX "urban_maintenance_requests_type_idx" ON "urban_maintenance_requests"("type");
CREATE INDEX "urban_maintenance_requests_status_idx" ON "urban_maintenance_requests"("status");
CREATE TABLE "new_urban_planning_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "urban_planning_attendances_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_urban_planning_attendances" ("assignedTo", "attendanceDate", "citizenId", "citizenName", "contactInfo", "createdAt", "description", "id", "protocolId", "resolvedDate", "status", "subject", "updatedAt") SELECT "assignedTo", "attendanceDate", "citizenId", "citizenName", "contactInfo", "createdAt", "description", "id", "protocolId", "resolvedDate", "status", "subject", "updatedAt" FROM "urban_planning_attendances";
DROP TABLE "urban_planning_attendances";
ALTER TABLE "new_urban_planning_attendances" RENAME TO "urban_planning_attendances";
CREATE INDEX "urban_planning_attendances_protocolId_idx" ON "urban_planning_attendances"("protocolId");
CREATE INDEX "urban_planning_attendances_status_idx" ON "urban_planning_attendances"("status");
CREATE INDEX "urban_planning_attendances_createdAt_idx" ON "urban_planning_attendances"("createdAt");
CREATE TABLE "new_urban_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_urban_projects" ("budget", "createdAt", "description", "endDate", "id", "location", "name", "projectType", "startDate", "status", "type", "updatedAt") SELECT "budget", "createdAt", "description", "endDate", "id", "location", "name", "projectType", "startDate", "status", "type", "updatedAt" FROM "urban_projects";
DROP TABLE "urban_projects";
ALTER TABLE "new_urban_projects" RENAME TO "urban_projects";
CREATE TABLE "new_urban_zoning" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "urban_zoning_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_urban_zoning" ("boundaries", "code", "coordinates", "createdAt", "description", "id", "isActive", "name", "permitedUses", "protocolId", "regulations", "restrictions", "type", "updatedAt", "zoneName", "zoneType") SELECT "boundaries", "code", "coordinates", "createdAt", "description", "id", "isActive", "name", "permitedUses", "protocolId", "regulations", "restrictions", "type", "updatedAt", "zoneName", "zoneType" FROM "urban_zoning";
DROP TABLE "urban_zoning";
ALTER TABLE "new_urban_zoning" RENAME TO "urban_zoning";
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "departmentId" TEXT,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME,
    CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "departmentId", "email", "failedLoginAttempts", "id", "isActive", "lastLogin", "lockedUntil", "mustChangePassword", "name", "password", "role", "updatedAt") SELECT "createdAt", "departmentId", "email", "failedLoginAttempts", "id", "isActive", "lastLogin", "lockedUntil", "mustChangePassword", "name", "password", "role", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE TABLE "new_vaccination_campaigns" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_vaccination_campaigns" ("achieved", "createdAt", "endDate", "goal", "id", "locations", "name", "startDate", "status", "targetAudience", "targetGroup", "updatedAt", "vaccine") SELECT "achieved", "createdAt", "endDate", "goal", "id", "locations", "name", "startDate", "status", "targetAudience", "targetGroup", "updatedAt", "vaccine" FROM "vaccination_campaigns";
DROP TABLE "vaccination_campaigns";
ALTER TABLE "new_vaccination_campaigns" RENAME TO "vaccination_campaigns";
CREATE TABLE "new_vaccinations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "campaignId" TEXT,
    "patientId" TEXT NOT NULL,
    "vaccine" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "appliedAt" DATETIME NOT NULL,
    "appliedBy" TEXT NOT NULL,
    "lotNumber" TEXT,
    "nextDose" DATETIME,
    "moduleType" TEXT NOT NULL DEFAULT 'VACINACAO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vaccinations_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vaccinations_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "vaccinations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "vaccination_campaigns" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_vaccinations" ("appliedAt", "appliedBy", "campaignId", "createdAt", "dose", "id", "lotNumber", "moduleType", "nextDose", "patientId", "protocolId", "updatedAt", "vaccine") SELECT "appliedAt", "appliedBy", "campaignId", "createdAt", "dose", "id", "lotNumber", "moduleType", "nextDose", "patientId", "protocolId", "updatedAt", "vaccine" FROM "vaccinations";
DROP TABLE "vaccinations";
ALTER TABLE "new_vaccinations" RENAME TO "vaccinations";
CREATE INDEX "vaccinations_patientId_idx" ON "vaccinations"("patientId");
CREATE INDEX "vaccinations_appliedAt_idx" ON "vaccinations"("appliedAt");
CREATE INDEX "vaccinations_vaccine_idx" ON "vaccinations"("vaccine");
CREATE INDEX "vaccinations_moduleType_idx" ON "vaccinations"("moduleType");
CREATE INDEX "vaccinations_protocolId_idx" ON "vaccinations"("protocolId");
CREATE INDEX "vaccinations_createdAt_idx" ON "vaccinations"("createdAt");
CREATE TABLE "new_vulnerable_families" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "vulnerable_families_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vulnerable_families_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_vulnerable_families" ("citizenId", "createdAt", "familyCode", "id", "lastVisitDate", "memberCount", "monthlyIncome", "nextVisitDate", "observations", "protocolId", "responsibleName", "riskLevel", "socialWorker", "status", "updatedAt", "vulnerabilityType") SELECT "citizenId", "createdAt", "familyCode", "id", "lastVisitDate", "memberCount", "monthlyIncome", "nextVisitDate", "observations", "protocolId", "responsibleName", "riskLevel", "socialWorker", "status", "updatedAt", "vulnerabilityType" FROM "vulnerable_families";
DROP TABLE "vulnerable_families";
ALTER TABLE "new_vulnerable_families" RENAME TO "vulnerable_families";
CREATE UNIQUE INDEX "vulnerable_families_citizenId_key" ON "vulnerable_families"("citizenId");
CREATE INDEX "vulnerable_families_protocolId_idx" ON "vulnerable_families"("protocolId");
CREATE INDEX "vulnerable_families_status_idx" ON "vulnerable_families"("status");
CREATE INDEX "vulnerable_families_createdAt_idx" ON "vulnerable_families"("createdAt");
CREATE TABLE "new_weeding_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "weeding_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_weeding_requests" ("accessType", "address", "areaSize", "assignedTeam", "citizenId", "completionDate", "contact", "coordinates", "createdAt", "description", "equipmentUsed", "id", "location", "observations", "photos", "preferredDate", "protocolId", "requestDate", "requestorCpf", "requestorName", "satisfaction", "scheduledDate", "status", "terrainType", "updatedAt", "urgency", "workDetails", "workHours") SELECT "accessType", "address", "areaSize", "assignedTeam", "citizenId", "completionDate", "contact", "coordinates", "createdAt", "description", "equipmentUsed", "id", "location", "observations", "photos", "preferredDate", "protocolId", "requestDate", "requestorCpf", "requestorName", "satisfaction", "scheduledDate", "status", "terrainType", "updatedAt", "urgency", "workDetails", "workHours" FROM "weeding_requests";
DROP TABLE "weeding_requests";
ALTER TABLE "new_weeding_requests" RENAME TO "weeding_requests";
CREATE TABLE "new_work_inspections" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "work_inspections_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_work_inspections" ("compliance", "contractor", "coordinates", "createdAt", "deadline", "documents", "findings", "followUpDate", "id", "inspectionDate", "inspectionType", "inspector", "location", "nextInspection", "observations", "photos", "protocol", "protocolId", "recommendations", "status", "updatedAt", "violations", "workName", "workType") SELECT "compliance", "contractor", "coordinates", "createdAt", "deadline", "documents", "findings", "followUpDate", "id", "inspectionDate", "inspectionType", "inspector", "location", "nextInspection", "observations", "photos", "protocol", "protocolId", "recommendations", "status", "updatedAt", "violations", "workName", "workType" FROM "work_inspections";
DROP TABLE "work_inspections";
ALTER TABLE "new_work_inspections" RENAME TO "work_inspections";
CREATE UNIQUE INDEX "work_inspections_protocol_key" ON "work_inspections"("protocol");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "municipio_config_cnpj_key" ON "municipio_config"("cnpj");

-- CreateIndex
CREATE INDEX "rural_program_enrollments_citizenId_idx" ON "rural_program_enrollments"("citizenId");

-- CreateIndex
CREATE INDEX "rural_program_enrollments_programId_idx" ON "rural_program_enrollments"("programId");

-- CreateIndex
CREATE INDEX "rural_program_enrollments_status_idx" ON "rural_program_enrollments"("status");

-- CreateIndex
CREATE INDEX "rural_program_enrollments_moduleType_idx" ON "rural_program_enrollments"("moduleType");

-- CreateIndex
CREATE INDEX "rural_program_enrollments_protocolId_idx" ON "rural_program_enrollments"("protocolId");

-- CreateIndex
CREATE INDEX "rural_program_enrollments_createdAt_idx" ON "rural_program_enrollments"("createdAt");

-- CreateIndex
CREATE INDEX "rural_training_enrollments_citizenId_idx" ON "rural_training_enrollments"("citizenId");

-- CreateIndex
CREATE INDEX "rural_training_enrollments_trainingId_idx" ON "rural_training_enrollments"("trainingId");

-- CreateIndex
CREATE INDEX "rural_training_enrollments_status_idx" ON "rural_training_enrollments"("status");

-- CreateIndex
CREATE INDEX "rural_training_enrollments_moduleType_idx" ON "rural_training_enrollments"("moduleType");

-- CreateIndex
CREATE INDEX "rural_training_enrollments_protocolId_idx" ON "rural_training_enrollments"("protocolId");

-- CreateIndex
CREATE INDEX "rural_training_enrollments_createdAt_idx" ON "rural_training_enrollments"("createdAt");
