/*
  Warnings:

  - You are about to drop the `agriculture_attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `anonymous_tips` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `artistic_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `athletes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `attendance_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `benefit_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `building_permits` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `business_licenses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `camera_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `campaign_enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `certificate_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cleaning_schedules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `community_health_agents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `competition_enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `competitions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `critical_points` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cultural_attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cultural_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cultural_manifestations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cultural_project_submissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cultural_projects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cultural_space_reservations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cultural_spaces` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cultural_workshop_enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cultural_workshops` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `disciplinary_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `document_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `drainage_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `drainage_unblock_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `education_attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `email_subscriptions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `emergency_deliveries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `environmental_attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `environmental_complaints` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `environmental_inspections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `environmental_licenses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `environmental_programs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `event_authorizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `family_registrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `farmer_market_registrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `grade_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `health_appointments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `health_attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `health_campaigns` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `health_doctors` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `health_exams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `health_professionals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `health_programs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `health_transport_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `health_transports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `health_units` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `home_cares` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `home_visits` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `housing_applications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `housing_attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `housing_programs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `housing_registrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `housing_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `housing_units` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `illegal_construction_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `infrastructure_problems` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `land_regularizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `local_businesses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lost_and_found` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lot_subdivisions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `medical_appointments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `medical_exams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `medical_specialties` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `medication_dispenses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `medication_dispensing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `medications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `municipal_guards` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `operating_licenses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organic_certifications` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `patients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `patrol_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `police_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_approvals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `property_numbering` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `protected_areas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `public_complaints` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `public_consultations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `public_lighting_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `public_problem_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `public_schools` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `public_service_attendance_phase3` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `public_service_attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `public_service_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `public_work_registrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `public_works` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `public_works_attendance_phase3` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `public_works_attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rent_assistances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `road_repair_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `road_repair_requests_phase3` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rural_producers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rural_program_enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rural_programs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rural_properties` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rural_training_enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `rural_trainings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_calls` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_classes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_documents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_incidents` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_management` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_material_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_meal_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_meals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_transfer_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_transport_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `school_transports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `schools` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `security_alerts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `security_attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `security_occurrences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `security_patrols` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `seed_distributions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_teams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `social_appointments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `social_assistance_attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `social_benefit_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `social_equipments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `social_group_enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `social_home_visits` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `social_program_enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `social_programs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `soil_analyses` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `special_collection_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `special_collections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sports_attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sports_clubs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sports_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sports_infrastructure_reservations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sports_infrastructures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sports_modalities` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sports_school_enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sports_schools` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sports_teams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `street_lightings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_enrollment_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `student_transfers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `students` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `subdivision_registrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `surveillance_systems` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `team_schedules` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `technical_assistances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `technical_inspections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `technical_inspections_phase3` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tourism_attendances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tourism_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tourism_guides` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tourism_infos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tourism_programs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tourism_routes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tourist_attractions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tournament_enrollments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tree_authorizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tree_cutting_authorizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tree_pruning_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tree_pruning_requests_phase3` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `urban_certificates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `urban_cleaning_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `urban_cleanings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `urban_infractions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `urban_maintenance_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `urban_planning_attendance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `urban_projects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `urban_zoning` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vaccination_campaigns` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vaccination_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vaccinations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vulnerable_families` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `weeding_requests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `weeding_requests_phase3` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `work_inspections` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `work_inspections_phase3` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."agriculture_attendances" DROP CONSTRAINT "agriculture_attendances_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."agriculture_attendances" DROP CONSTRAINT "agriculture_attendances_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."anonymous_tips" DROP CONSTRAINT "anonymous_tips_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."artistic_groups" DROP CONSTRAINT "artistic_groups_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."athletes" DROP CONSTRAINT "athletes_modalityId_fkey";

-- DropForeignKey
ALTER TABLE "public"."athletes" DROP CONSTRAINT "athletes_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."attendance_records" DROP CONSTRAINT "attendance_records_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."attendance_records" DROP CONSTRAINT "attendance_records_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."benefit_requests" DROP CONSTRAINT "benefit_requests_familyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."benefit_requests" DROP CONSTRAINT "benefit_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."building_permits" DROP CONSTRAINT "building_permits_projectApprovalId_fkey";

-- DropForeignKey
ALTER TABLE "public"."building_permits" DROP CONSTRAINT "building_permits_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."business_licenses" DROP CONSTRAINT "business_licenses_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."camera_requests" DROP CONSTRAINT "camera_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."campaign_enrollments" DROP CONSTRAINT "campaign_enrollments_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."campaign_enrollments" DROP CONSTRAINT "campaign_enrollments_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."certificate_requests" DROP CONSTRAINT "certificate_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cleaning_schedules" DROP CONSTRAINT "cleaning_schedules_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."community_health_agents" DROP CONSTRAINT "community_health_agents_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."community_health_agents" DROP CONSTRAINT "community_health_agents_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."competition_enrollments" DROP CONSTRAINT "competition_enrollments_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."competitions" DROP CONSTRAINT "competitions_modalityId_fkey";

-- DropForeignKey
ALTER TABLE "public"."competitions" DROP CONSTRAINT "competitions_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."critical_points" DROP CONSTRAINT "critical_points_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cultural_attendances" DROP CONSTRAINT "cultural_attendances_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cultural_events" DROP CONSTRAINT "cultural_events_projectId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cultural_events" DROP CONSTRAINT "cultural_events_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cultural_events" DROP CONSTRAINT "cultural_events_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cultural_manifestations" DROP CONSTRAINT "cultural_manifestations_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cultural_project_submissions" DROP CONSTRAINT "cultural_project_submissions_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cultural_projects" DROP CONSTRAINT "cultural_projects_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cultural_space_reservations" DROP CONSTRAINT "cultural_space_reservations_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cultural_workshop_enrollments" DROP CONSTRAINT "cultural_workshop_enrollments_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cultural_workshop_enrollments" DROP CONSTRAINT "cultural_workshop_enrollments_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."cultural_workshop_enrollments" DROP CONSTRAINT "cultural_workshop_enrollments_workshopId_fkey";

-- DropForeignKey
ALTER TABLE "public"."disciplinary_records" DROP CONSTRAINT "disciplinary_records_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."disciplinary_records" DROP CONSTRAINT "disciplinary_records_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."document_requests" DROP CONSTRAINT "document_requests_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."document_requests" DROP CONSTRAINT "document_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."drainage_requests" DROP CONSTRAINT "drainage_requests_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."drainage_requests" DROP CONSTRAINT "drainage_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."drainage_unblock_requests" DROP CONSTRAINT "drainage_unblock_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."education_attendances" DROP CONSTRAINT "education_attendances_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."education_attendances" DROP CONSTRAINT "education_attendances_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."emergency_deliveries" DROP CONSTRAINT "emergency_deliveries_benefitRequestId_fkey";

-- DropForeignKey
ALTER TABLE "public"."emergency_deliveries" DROP CONSTRAINT "emergency_deliveries_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."emergency_deliveries" DROP CONSTRAINT "emergency_deliveries_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."environmental_attendances" DROP CONSTRAINT "environmental_attendances_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."environmental_attendances" DROP CONSTRAINT "environmental_attendances_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."environmental_complaints" DROP CONSTRAINT "environmental_complaints_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."environmental_inspections" DROP CONSTRAINT "environmental_inspections_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."environmental_licenses" DROP CONSTRAINT "environmental_licenses_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."environmental_programs" DROP CONSTRAINT "environmental_programs_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."family_registrations" DROP CONSTRAINT "family_registrations_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."family_registrations" DROP CONSTRAINT "family_registrations_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."grade_records" DROP CONSTRAINT "grade_records_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."grade_records" DROP CONSTRAINT "grade_records_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."health_appointments" DROP CONSTRAINT "health_appointments_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."health_appointments" DROP CONSTRAINT "health_appointments_doctorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."health_appointments" DROP CONSTRAINT "health_appointments_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."health_attendances" DROP CONSTRAINT "health_attendances_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."health_attendances" DROP CONSTRAINT "health_attendances_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."health_campaigns" DROP CONSTRAINT "health_campaigns_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."health_exams" DROP CONSTRAINT "health_exams_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."health_exams" DROP CONSTRAINT "health_exams_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."health_professionals" DROP CONSTRAINT "health_professionals_specialtyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."health_programs" DROP CONSTRAINT "health_programs_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."health_transport_requests" DROP CONSTRAINT "health_transport_requests_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."health_transport_requests" DROP CONSTRAINT "health_transport_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."health_transports" DROP CONSTRAINT "health_transports_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."health_transports" DROP CONSTRAINT "health_transports_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."home_cares" DROP CONSTRAINT "home_cares_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."home_cares" DROP CONSTRAINT "home_cares_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."home_visits" DROP CONSTRAINT "home_visits_familyId_fkey";

-- DropForeignKey
ALTER TABLE "public"."home_visits" DROP CONSTRAINT "home_visits_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."home_visits" DROP CONSTRAINT "home_visits_socialWorkerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."housing_applications" DROP CONSTRAINT "housing_applications_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."housing_attendances" DROP CONSTRAINT "housing_attendances_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."housing_attendances" DROP CONSTRAINT "housing_attendances_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."housing_registrations" DROP CONSTRAINT "housing_registrations_programId_fkey";

-- DropForeignKey
ALTER TABLE "public"."housing_registrations" DROP CONSTRAINT "housing_registrations_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."housing_units" DROP CONSTRAINT "housing_units_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."illegal_construction_reports" DROP CONSTRAINT "illegal_construction_reports_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."land_regularizations" DROP CONSTRAINT "land_regularizations_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."local_businesses" DROP CONSTRAINT "local_businesses_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."medical_appointments" DROP CONSTRAINT "medical_appointments_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."medical_appointments" DROP CONSTRAINT "medical_appointments_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."medical_exams" DROP CONSTRAINT "medical_exams_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."medical_exams" DROP CONSTRAINT "medical_exams_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."medication_dispenses" DROP CONSTRAINT "medication_dispenses_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."medication_dispenses" DROP CONSTRAINT "medication_dispenses_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."medication_dispensing" DROP CONSTRAINT "medication_dispensing_patientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."municipal_guards" DROP CONSTRAINT "municipal_guards_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."operating_licenses" DROP CONSTRAINT "operating_licenses_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."patients" DROP CONSTRAINT "patients_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."patients" DROP CONSTRAINT "patients_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."patrol_requests" DROP CONSTRAINT "patrol_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."project_approvals" DROP CONSTRAINT "project_approvals_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."protected_areas" DROP CONSTRAINT "protected_areas_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."public_lighting_requests" DROP CONSTRAINT "public_lighting_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."public_problem_reports" DROP CONSTRAINT "public_problem_reports_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."public_problem_reports" DROP CONSTRAINT "public_problem_reports_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."public_service_attendance_phase3" DROP CONSTRAINT "public_service_attendance_phase3_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."public_service_attendances" DROP CONSTRAINT "public_service_attendances_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."public_service_attendances" DROP CONSTRAINT "public_service_attendances_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."public_service_requests" DROP CONSTRAINT "public_service_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."public_work_registrations" DROP CONSTRAINT "public_work_registrations_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."public_works" DROP CONSTRAINT "public_works_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."public_works_attendance_phase3" DROP CONSTRAINT "public_works_attendance_phase3_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."public_works_attendances" DROP CONSTRAINT "public_works_attendances_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rent_assistances" DROP CONSTRAINT "rent_assistances_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."road_repair_requests" DROP CONSTRAINT "road_repair_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."road_repair_requests_phase3" DROP CONSTRAINT "road_repair_requests_phase3_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_producers" DROP CONSTRAINT "rural_producers_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_producers" DROP CONSTRAINT "rural_producers_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_program_enrollments" DROP CONSTRAINT "rural_program_enrollments_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_program_enrollments" DROP CONSTRAINT "rural_program_enrollments_producerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_program_enrollments" DROP CONSTRAINT "rural_program_enrollments_programId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_program_enrollments" DROP CONSTRAINT "rural_program_enrollments_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_programs" DROP CONSTRAINT "rural_programs_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_properties" DROP CONSTRAINT "rural_properties_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_properties" DROP CONSTRAINT "rural_properties_producerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_properties" DROP CONSTRAINT "rural_properties_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_training_enrollments" DROP CONSTRAINT "rural_training_enrollments_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_training_enrollments" DROP CONSTRAINT "rural_training_enrollments_producerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_training_enrollments" DROP CONSTRAINT "rural_training_enrollments_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_training_enrollments" DROP CONSTRAINT "rural_training_enrollments_trainingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."rural_trainings" DROP CONSTRAINT "rural_trainings_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_calls" DROP CONSTRAINT "school_calls_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_classes" DROP CONSTRAINT "school_classes_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_documents" DROP CONSTRAINT "school_documents_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_documents" DROP CONSTRAINT "school_documents_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_events" DROP CONSTRAINT "school_events_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_incidents" DROP CONSTRAINT "school_incidents_classId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_incidents" DROP CONSTRAINT "school_incidents_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_management" DROP CONSTRAINT "school_management_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_management" DROP CONSTRAINT "school_management_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_material_requests" DROP CONSTRAINT "school_material_requests_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_material_requests" DROP CONSTRAINT "school_material_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_meal_requests" DROP CONSTRAINT "school_meal_requests_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_meal_requests" DROP CONSTRAINT "school_meal_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_meals" DROP CONSTRAINT "school_meals_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_meals" DROP CONSTRAINT "school_meals_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_transfer_requests" DROP CONSTRAINT "school_transfer_requests_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_transfer_requests" DROP CONSTRAINT "school_transfer_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_transport_requests" DROP CONSTRAINT "school_transport_requests_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_transport_requests" DROP CONSTRAINT "school_transport_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."school_transports" DROP CONSTRAINT "school_transports_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."security_alerts" DROP CONSTRAINT "security_alerts_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."security_attendances" DROP CONSTRAINT "security_attendances_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."security_occurrences" DROP CONSTRAINT "security_occurrences_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."security_patrols" DROP CONSTRAINT "security_patrols_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."service_teams" DROP CONSTRAINT "service_teams_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_appointments" DROP CONSTRAINT "social_appointments_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_appointments" DROP CONSTRAINT "social_appointments_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_appointments" DROP CONSTRAINT "social_appointments_socialWorkerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_assistance_attendances" DROP CONSTRAINT "social_assistance_attendances_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_assistance_attendances" DROP CONSTRAINT "social_assistance_attendances_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_assistance_attendances" DROP CONSTRAINT "social_assistance_attendances_socialWorkerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_benefit_requests" DROP CONSTRAINT "social_benefit_requests_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_benefit_requests" DROP CONSTRAINT "social_benefit_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_equipments" DROP CONSTRAINT "social_equipments_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_equipments" DROP CONSTRAINT "social_equipments_coordinatorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_equipments" DROP CONSTRAINT "social_equipments_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_group_enrollments" DROP CONSTRAINT "social_group_enrollments_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_group_enrollments" DROP CONSTRAINT "social_group_enrollments_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_home_visits" DROP CONSTRAINT "social_home_visits_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_home_visits" DROP CONSTRAINT "social_home_visits_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_program_enrollments" DROP CONSTRAINT "social_program_enrollments_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."social_program_enrollments" DROP CONSTRAINT "social_program_enrollments_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."special_collection_requests" DROP CONSTRAINT "special_collection_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."special_collections" DROP CONSTRAINT "special_collections_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."special_collections" DROP CONSTRAINT "special_collections_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sports_attendances" DROP CONSTRAINT "sports_attendances_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sports_infrastructure_reservations" DROP CONSTRAINT "sports_infrastructure_reservations_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sports_infrastructures" DROP CONSTRAINT "sports_infrastructures_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sports_modalities" DROP CONSTRAINT "sports_modalities_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sports_school_enrollments" DROP CONSTRAINT "sports_school_enrollments_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sports_schools" DROP CONSTRAINT "sports_schools_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sports_teams" DROP CONSTRAINT "sports_teams_modalityId_fkey";

-- DropForeignKey
ALTER TABLE "public"."sports_teams" DROP CONSTRAINT "sports_teams_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."street_lightings" DROP CONSTRAINT "street_lightings_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_attendances" DROP CONSTRAINT "student_attendances_classId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_attendances" DROP CONSTRAINT "student_attendances_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_enrollment_requests" DROP CONSTRAINT "student_enrollment_requests_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_enrollment_requests" DROP CONSTRAINT "student_enrollment_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_enrollments" DROP CONSTRAINT "student_enrollments_classId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_enrollments" DROP CONSTRAINT "student_enrollments_studentId_fkey";

-- DropForeignKey
ALTER TABLE "public"."student_transfers" DROP CONSTRAINT "student_transfers_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."students" DROP CONSTRAINT "students_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."students" DROP CONSTRAINT "students_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."students" DROP CONSTRAINT "students_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."subdivision_registrations" DROP CONSTRAINT "subdivision_registrations_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."surveillance_systems" DROP CONSTRAINT "surveillance_systems_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."team_schedules" DROP CONSTRAINT "team_schedules_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."technical_assistances" DROP CONSTRAINT "technical_assistances_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."technical_assistances" DROP CONSTRAINT "technical_assistances_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."technical_inspections" DROP CONSTRAINT "technical_inspections_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."technical_inspections_phase3" DROP CONSTRAINT "technical_inspections_phase3_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tourism_attendances" DROP CONSTRAINT "tourism_attendances_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tourism_attendances" DROP CONSTRAINT "tourism_attendances_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tourism_events" DROP CONSTRAINT "tourism_events_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tourism_guides" DROP CONSTRAINT "tourism_guides_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tourism_programs" DROP CONSTRAINT "tourism_programs_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tourism_routes" DROP CONSTRAINT "tourism_routes_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tourist_attractions" DROP CONSTRAINT "tourist_attractions_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tournament_enrollments" DROP CONSTRAINT "tournament_enrollments_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tree_cutting_authorizations" DROP CONSTRAINT "tree_cutting_authorizations_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tree_pruning_requests" DROP CONSTRAINT "tree_pruning_requests_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tree_pruning_requests" DROP CONSTRAINT "tree_pruning_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."tree_pruning_requests_phase3" DROP CONSTRAINT "tree_pruning_requests_phase3_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."urban_cleaning_requests" DROP CONSTRAINT "urban_cleaning_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."urban_cleanings" DROP CONSTRAINT "urban_cleanings_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."urban_infractions" DROP CONSTRAINT "urban_infractions_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."urban_planning_attendance" DROP CONSTRAINT "urban_planning_attendance_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."urban_zoning" DROP CONSTRAINT "urban_zoning_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vaccination_records" DROP CONSTRAINT "vaccination_records_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vaccination_records" DROP CONSTRAINT "vaccination_records_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vaccinations" DROP CONSTRAINT "vaccinations_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vaccinations" DROP CONSTRAINT "vaccinations_patientId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vaccinations" DROP CONSTRAINT "vaccinations_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vulnerable_families" DROP CONSTRAINT "vulnerable_families_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vulnerable_families" DROP CONSTRAINT "vulnerable_families_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."weeding_requests" DROP CONSTRAINT "weeding_requests_citizenId_fkey";

-- DropForeignKey
ALTER TABLE "public"."weeding_requests" DROP CONSTRAINT "weeding_requests_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."weeding_requests_phase3" DROP CONSTRAINT "weeding_requests_phase3_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."work_inspections" DROP CONSTRAINT "work_inspections_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "public"."work_inspections_phase3" DROP CONSTRAINT "work_inspections_phase3_protocolId_fkey";

-- DropTable
DROP TABLE "public"."agriculture_attendances";

-- DropTable
DROP TABLE "public"."anonymous_tips";

-- DropTable
DROP TABLE "public"."artistic_groups";

-- DropTable
DROP TABLE "public"."athletes";

-- DropTable
DROP TABLE "public"."attendance_records";

-- DropTable
DROP TABLE "public"."benefit_requests";

-- DropTable
DROP TABLE "public"."building_permits";

-- DropTable
DROP TABLE "public"."business_licenses";

-- DropTable
DROP TABLE "public"."camera_requests";

-- DropTable
DROP TABLE "public"."campaign_enrollments";

-- DropTable
DROP TABLE "public"."certificate_requests";

-- DropTable
DROP TABLE "public"."cleaning_schedules";

-- DropTable
DROP TABLE "public"."community_health_agents";

-- DropTable
DROP TABLE "public"."competition_enrollments";

-- DropTable
DROP TABLE "public"."competitions";

-- DropTable
DROP TABLE "public"."critical_points";

-- DropTable
DROP TABLE "public"."cultural_attendances";

-- DropTable
DROP TABLE "public"."cultural_events";

-- DropTable
DROP TABLE "public"."cultural_manifestations";

-- DropTable
DROP TABLE "public"."cultural_project_submissions";

-- DropTable
DROP TABLE "public"."cultural_projects";

-- DropTable
DROP TABLE "public"."cultural_space_reservations";

-- DropTable
DROP TABLE "public"."cultural_spaces";

-- DropTable
DROP TABLE "public"."cultural_workshop_enrollments";

-- DropTable
DROP TABLE "public"."cultural_workshops";

-- DropTable
DROP TABLE "public"."disciplinary_records";

-- DropTable
DROP TABLE "public"."document_requests";

-- DropTable
DROP TABLE "public"."drainage_requests";

-- DropTable
DROP TABLE "public"."drainage_unblock_requests";

-- DropTable
DROP TABLE "public"."education_attendances";

-- DropTable
DROP TABLE "public"."email_subscriptions";

-- DropTable
DROP TABLE "public"."emergency_deliveries";

-- DropTable
DROP TABLE "public"."environmental_attendances";

-- DropTable
DROP TABLE "public"."environmental_complaints";

-- DropTable
DROP TABLE "public"."environmental_inspections";

-- DropTable
DROP TABLE "public"."environmental_licenses";

-- DropTable
DROP TABLE "public"."environmental_programs";

-- DropTable
DROP TABLE "public"."event_authorizations";

-- DropTable
DROP TABLE "public"."family_registrations";

-- DropTable
DROP TABLE "public"."farmer_market_registrations";

-- DropTable
DROP TABLE "public"."grade_records";

-- DropTable
DROP TABLE "public"."health_appointments";

-- DropTable
DROP TABLE "public"."health_attendances";

-- DropTable
DROP TABLE "public"."health_campaigns";

-- DropTable
DROP TABLE "public"."health_doctors";

-- DropTable
DROP TABLE "public"."health_exams";

-- DropTable
DROP TABLE "public"."health_professionals";

-- DropTable
DROP TABLE "public"."health_programs";

-- DropTable
DROP TABLE "public"."health_transport_requests";

-- DropTable
DROP TABLE "public"."health_transports";

-- DropTable
DROP TABLE "public"."health_units";

-- DropTable
DROP TABLE "public"."home_cares";

-- DropTable
DROP TABLE "public"."home_visits";

-- DropTable
DROP TABLE "public"."housing_applications";

-- DropTable
DROP TABLE "public"."housing_attendances";

-- DropTable
DROP TABLE "public"."housing_programs";

-- DropTable
DROP TABLE "public"."housing_registrations";

-- DropTable
DROP TABLE "public"."housing_requests";

-- DropTable
DROP TABLE "public"."housing_units";

-- DropTable
DROP TABLE "public"."illegal_construction_reports";

-- DropTable
DROP TABLE "public"."infrastructure_problems";

-- DropTable
DROP TABLE "public"."land_regularizations";

-- DropTable
DROP TABLE "public"."local_businesses";

-- DropTable
DROP TABLE "public"."lost_and_found";

-- DropTable
DROP TABLE "public"."lot_subdivisions";

-- DropTable
DROP TABLE "public"."medical_appointments";

-- DropTable
DROP TABLE "public"."medical_exams";

-- DropTable
DROP TABLE "public"."medical_specialties";

-- DropTable
DROP TABLE "public"."medication_dispenses";

-- DropTable
DROP TABLE "public"."medication_dispensing";

-- DropTable
DROP TABLE "public"."medications";

-- DropTable
DROP TABLE "public"."municipal_guards";

-- DropTable
DROP TABLE "public"."operating_licenses";

-- DropTable
DROP TABLE "public"."organic_certifications";

-- DropTable
DROP TABLE "public"."patients";

-- DropTable
DROP TABLE "public"."patrol_requests";

-- DropTable
DROP TABLE "public"."police_reports";

-- DropTable
DROP TABLE "public"."project_approvals";

-- DropTable
DROP TABLE "public"."property_numbering";

-- DropTable
DROP TABLE "public"."protected_areas";

-- DropTable
DROP TABLE "public"."public_complaints";

-- DropTable
DROP TABLE "public"."public_consultations";

-- DropTable
DROP TABLE "public"."public_lighting_requests";

-- DropTable
DROP TABLE "public"."public_problem_reports";

-- DropTable
DROP TABLE "public"."public_schools";

-- DropTable
DROP TABLE "public"."public_service_attendance_phase3";

-- DropTable
DROP TABLE "public"."public_service_attendances";

-- DropTable
DROP TABLE "public"."public_service_requests";

-- DropTable
DROP TABLE "public"."public_work_registrations";

-- DropTable
DROP TABLE "public"."public_works";

-- DropTable
DROP TABLE "public"."public_works_attendance_phase3";

-- DropTable
DROP TABLE "public"."public_works_attendances";

-- DropTable
DROP TABLE "public"."rent_assistances";

-- DropTable
DROP TABLE "public"."road_repair_requests";

-- DropTable
DROP TABLE "public"."road_repair_requests_phase3";

-- DropTable
DROP TABLE "public"."rural_producers";

-- DropTable
DROP TABLE "public"."rural_program_enrollments";

-- DropTable
DROP TABLE "public"."rural_programs";

-- DropTable
DROP TABLE "public"."rural_properties";

-- DropTable
DROP TABLE "public"."rural_training_enrollments";

-- DropTable
DROP TABLE "public"."rural_trainings";

-- DropTable
DROP TABLE "public"."school_calls";

-- DropTable
DROP TABLE "public"."school_classes";

-- DropTable
DROP TABLE "public"."school_documents";

-- DropTable
DROP TABLE "public"."school_events";

-- DropTable
DROP TABLE "public"."school_incidents";

-- DropTable
DROP TABLE "public"."school_management";

-- DropTable
DROP TABLE "public"."school_material_requests";

-- DropTable
DROP TABLE "public"."school_meal_requests";

-- DropTable
DROP TABLE "public"."school_meals";

-- DropTable
DROP TABLE "public"."school_transfer_requests";

-- DropTable
DROP TABLE "public"."school_transport_requests";

-- DropTable
DROP TABLE "public"."school_transports";

-- DropTable
DROP TABLE "public"."schools";

-- DropTable
DROP TABLE "public"."security_alerts";

-- DropTable
DROP TABLE "public"."security_attendances";

-- DropTable
DROP TABLE "public"."security_occurrences";

-- DropTable
DROP TABLE "public"."security_patrols";

-- DropTable
DROP TABLE "public"."seed_distributions";

-- DropTable
DROP TABLE "public"."service_teams";

-- DropTable
DROP TABLE "public"."social_appointments";

-- DropTable
DROP TABLE "public"."social_assistance_attendances";

-- DropTable
DROP TABLE "public"."social_benefit_requests";

-- DropTable
DROP TABLE "public"."social_equipments";

-- DropTable
DROP TABLE "public"."social_group_enrollments";

-- DropTable
DROP TABLE "public"."social_home_visits";

-- DropTable
DROP TABLE "public"."social_program_enrollments";

-- DropTable
DROP TABLE "public"."social_programs";

-- DropTable
DROP TABLE "public"."soil_analyses";

-- DropTable
DROP TABLE "public"."special_collection_requests";

-- DropTable
DROP TABLE "public"."special_collections";

-- DropTable
DROP TABLE "public"."sports_attendances";

-- DropTable
DROP TABLE "public"."sports_clubs";

-- DropTable
DROP TABLE "public"."sports_events";

-- DropTable
DROP TABLE "public"."sports_infrastructure_reservations";

-- DropTable
DROP TABLE "public"."sports_infrastructures";

-- DropTable
DROP TABLE "public"."sports_modalities";

-- DropTable
DROP TABLE "public"."sports_school_enrollments";

-- DropTable
DROP TABLE "public"."sports_schools";

-- DropTable
DROP TABLE "public"."sports_teams";

-- DropTable
DROP TABLE "public"."street_lightings";

-- DropTable
DROP TABLE "public"."student_attendances";

-- DropTable
DROP TABLE "public"."student_enrollment_requests";

-- DropTable
DROP TABLE "public"."student_enrollments";

-- DropTable
DROP TABLE "public"."student_transfers";

-- DropTable
DROP TABLE "public"."students";

-- DropTable
DROP TABLE "public"."subdivision_registrations";

-- DropTable
DROP TABLE "public"."surveillance_systems";

-- DropTable
DROP TABLE "public"."team_schedules";

-- DropTable
DROP TABLE "public"."technical_assistances";

-- DropTable
DROP TABLE "public"."technical_inspections";

-- DropTable
DROP TABLE "public"."technical_inspections_phase3";

-- DropTable
DROP TABLE "public"."tourism_attendances";

-- DropTable
DROP TABLE "public"."tourism_events";

-- DropTable
DROP TABLE "public"."tourism_guides";

-- DropTable
DROP TABLE "public"."tourism_infos";

-- DropTable
DROP TABLE "public"."tourism_programs";

-- DropTable
DROP TABLE "public"."tourism_routes";

-- DropTable
DROP TABLE "public"."tourist_attractions";

-- DropTable
DROP TABLE "public"."tournament_enrollments";

-- DropTable
DROP TABLE "public"."tree_authorizations";

-- DropTable
DROP TABLE "public"."tree_cutting_authorizations";

-- DropTable
DROP TABLE "public"."tree_pruning_requests";

-- DropTable
DROP TABLE "public"."tree_pruning_requests_phase3";

-- DropTable
DROP TABLE "public"."urban_certificates";

-- DropTable
DROP TABLE "public"."urban_cleaning_requests";

-- DropTable
DROP TABLE "public"."urban_cleanings";

-- DropTable
DROP TABLE "public"."urban_infractions";

-- DropTable
DROP TABLE "public"."urban_maintenance_requests";

-- DropTable
DROP TABLE "public"."urban_planning_attendance";

-- DropTable
DROP TABLE "public"."urban_projects";

-- DropTable
DROP TABLE "public"."urban_zoning";

-- DropTable
DROP TABLE "public"."vaccination_campaigns";

-- DropTable
DROP TABLE "public"."vaccination_records";

-- DropTable
DROP TABLE "public"."vaccinations";

-- DropTable
DROP TABLE "public"."vulnerable_families";

-- DropTable
DROP TABLE "public"."weeding_requests";

-- DropTable
DROP TABLE "public"."weeding_requests_phase3";

-- DropTable
DROP TABLE "public"."work_inspections";

-- DropTable
DROP TABLE "public"."work_inspections_phase3";

-- CreateIndex
CREATE INDEX "protocols_simplified_departmentId_status_idx" ON "public"."protocols_simplified"("departmentId", "status");

-- CreateIndex
CREATE INDEX "protocols_simplified_citizenId_idx" ON "public"."protocols_simplified"("citizenId");
