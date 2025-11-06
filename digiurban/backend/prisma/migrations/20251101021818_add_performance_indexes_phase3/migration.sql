-- CreateIndex
CREATE INDEX "athletes_protocolId_idx" ON "athletes"("protocolId");

-- CreateIndex
CREATE INDEX "athletes_tenantId_createdAt_idx" ON "athletes"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "attendance_records_tenantId_status_idx" ON "attendance_records"("tenantId", "status");

-- CreateIndex
CREATE INDEX "attendance_records_tenantId_createdAt_idx" ON "attendance_records"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "attendance_records_tenantId_moduleType_status_idx" ON "attendance_records"("tenantId", "moduleType", "status");

-- CreateIndex
CREATE INDEX "benefit_requests_protocolId_idx" ON "benefit_requests"("protocolId");

-- CreateIndex
CREATE INDEX "benefit_requests_tenantId_status_idx" ON "benefit_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "benefit_requests_tenantId_createdAt_idx" ON "benefit_requests"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "building_permits_protocolId_idx" ON "building_permits"("protocolId");

-- CreateIndex
CREATE INDEX "building_permits_tenantId_status_idx" ON "building_permits"("tenantId", "status");

-- CreateIndex
CREATE INDEX "building_permits_tenantId_createdAt_idx" ON "building_permits"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "competitions_protocolId_idx" ON "competitions"("protocolId");

-- CreateIndex
CREATE INDEX "competitions_tenantId_status_idx" ON "competitions"("tenantId", "status");

-- CreateIndex
CREATE INDEX "competitions_tenantId_createdAt_idx" ON "competitions"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "cultural_attendances_protocolId_idx" ON "cultural_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "cultural_attendances_tenantId_status_idx" ON "cultural_attendances"("tenantId", "status");

-- CreateIndex
CREATE INDEX "cultural_attendances_tenantId_createdAt_idx" ON "cultural_attendances"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "cultural_events_protocolId_idx" ON "cultural_events"("protocolId");

-- CreateIndex
CREATE INDEX "cultural_events_tenantId_createdAt_idx" ON "cultural_events"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "cultural_projects_protocolId_idx" ON "cultural_projects"("protocolId");

-- CreateIndex
CREATE INDEX "cultural_projects_tenantId_status_idx" ON "cultural_projects"("tenantId", "status");

-- CreateIndex
CREATE INDEX "cultural_projects_tenantId_createdAt_idx" ON "cultural_projects"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "environmental_attendances_protocolId_idx" ON "environmental_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "environmental_attendances_tenantId_status_idx" ON "environmental_attendances"("tenantId", "status");

-- CreateIndex
CREATE INDEX "environmental_attendances_tenantId_createdAt_idx" ON "environmental_attendances"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "environmental_complaints_protocolId_idx" ON "environmental_complaints"("protocolId");

-- CreateIndex
CREATE INDEX "environmental_complaints_tenantId_status_idx" ON "environmental_complaints"("tenantId", "status");

-- CreateIndex
CREATE INDEX "environmental_complaints_tenantId_createdAt_idx" ON "environmental_complaints"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "environmental_licenses_protocolId_idx" ON "environmental_licenses"("protocolId");

-- CreateIndex
CREATE INDEX "environmental_licenses_tenantId_status_idx" ON "environmental_licenses"("tenantId", "status");

-- CreateIndex
CREATE INDEX "environmental_licenses_tenantId_createdAt_idx" ON "environmental_licenses"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "grade_records_protocolId_idx" ON "grade_records"("protocolId");

-- CreateIndex
CREATE INDEX "grade_records_tenantId_status_idx" ON "grade_records"("tenantId", "status");

-- CreateIndex
CREATE INDEX "grade_records_tenantId_createdAt_idx" ON "grade_records"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "health_appointments_tenantId_status_idx" ON "health_appointments"("tenantId", "status");

-- CreateIndex
CREATE INDEX "health_appointments_tenantId_createdAt_idx" ON "health_appointments"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "health_appointments_tenantId_moduleType_status_idx" ON "health_appointments"("tenantId", "moduleType", "status");

-- CreateIndex
CREATE INDEX "health_attendances_tenantId_status_idx" ON "health_attendances"("tenantId", "status");

-- CreateIndex
CREATE INDEX "health_attendances_tenantId_createdAt_idx" ON "health_attendances"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "health_attendances_tenantId_moduleType_status_idx" ON "health_attendances"("tenantId", "moduleType", "status");

-- CreateIndex
CREATE INDEX "housing_applications_protocolId_idx" ON "housing_applications"("protocolId");

-- CreateIndex
CREATE INDEX "housing_applications_tenantId_status_idx" ON "housing_applications"("tenantId", "status");

-- CreateIndex
CREATE INDEX "housing_applications_tenantId_createdAt_idx" ON "housing_applications"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "housing_attendances_protocolId_idx" ON "housing_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "housing_attendances_tenantId_status_idx" ON "housing_attendances"("tenantId", "status");

-- CreateIndex
CREATE INDEX "housing_attendances_tenantId_createdAt_idx" ON "housing_attendances"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "housing_units_protocolId_idx" ON "housing_units"("protocolId");

-- CreateIndex
CREATE INDEX "housing_units_tenantId_status_idx" ON "housing_units"("tenantId", "status");

-- CreateIndex
CREATE INDEX "housing_units_tenantId_createdAt_idx" ON "housing_units"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "local_businesses_protocolId_idx" ON "local_businesses"("protocolId");

-- CreateIndex
CREATE INDEX "local_businesses_tenantId_createdAt_idx" ON "local_businesses"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "medication_dispenses_tenantId_status_idx" ON "medication_dispenses"("tenantId", "status");

-- CreateIndex
CREATE INDEX "medication_dispenses_tenantId_createdAt_idx" ON "medication_dispenses"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "medication_dispenses_tenantId_moduleType_status_idx" ON "medication_dispenses"("tenantId", "moduleType", "status");

-- CreateIndex
CREATE INDEX "patients_tenantId_status_idx" ON "patients"("tenantId", "status");

-- CreateIndex
CREATE INDEX "patients_tenantId_createdAt_idx" ON "patients"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "patients_tenantId_moduleType_status_idx" ON "patients"("tenantId", "moduleType", "status");

-- CreateIndex
CREATE INDEX "project_approvals_protocolId_idx" ON "project_approvals"("protocolId");

-- CreateIndex
CREATE INDEX "project_approvals_tenantId_status_idx" ON "project_approvals"("tenantId", "status");

-- CreateIndex
CREATE INDEX "project_approvals_tenantId_createdAt_idx" ON "project_approvals"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "protocol_documents_protocolId_idx" ON "protocol_documents"("protocolId");

-- CreateIndex
CREATE INDEX "protocol_interactions_protocolId_idx" ON "protocol_interactions"("protocolId");

-- CreateIndex
CREATE INDEX "protocol_pendings_protocolId_idx" ON "protocol_pendings"("protocolId");

-- CreateIndex
CREATE INDEX "protocol_stages_protocolId_idx" ON "protocol_stages"("protocolId");

-- CreateIndex
CREATE INDEX "protocols_simplified_tenantId_status_idx" ON "protocols_simplified"("tenantId", "status");

-- CreateIndex
CREATE INDEX "protocols_simplified_tenantId_createdAt_idx" ON "protocols_simplified"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "protocols_simplified_tenantId_moduleType_status_idx" ON "protocols_simplified"("tenantId", "moduleType", "status");

-- CreateIndex
CREATE INDEX "public_service_attendances_protocolId_idx" ON "public_service_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "public_service_attendances_tenantId_status_idx" ON "public_service_attendances"("tenantId", "status");

-- CreateIndex
CREATE INDEX "public_service_attendances_tenantId_createdAt_idx" ON "public_service_attendances"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "public_works_attendances_protocolId_idx" ON "public_works_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "public_works_attendances_tenantId_status_idx" ON "public_works_attendances"("tenantId", "status");

-- CreateIndex
CREATE INDEX "public_works_attendances_tenantId_createdAt_idx" ON "public_works_attendances"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "road_repair_requests_protocolId_idx" ON "road_repair_requests"("protocolId");

-- CreateIndex
CREATE INDEX "road_repair_requests_tenantId_status_idx" ON "road_repair_requests"("tenantId", "status");

-- CreateIndex
CREATE INDEX "road_repair_requests_tenantId_createdAt_idx" ON "road_repair_requests"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "rural_producers_protocolId_idx" ON "rural_producers"("protocolId");

-- CreateIndex
CREATE INDEX "rural_producers_tenantId_status_idx" ON "rural_producers"("tenantId", "status");

-- CreateIndex
CREATE INDEX "rural_producers_tenantId_createdAt_idx" ON "rural_producers"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "rural_properties_protocolId_idx" ON "rural_properties"("protocolId");

-- CreateIndex
CREATE INDEX "rural_properties_tenantId_status_idx" ON "rural_properties"("tenantId", "status");

-- CreateIndex
CREATE INDEX "rural_properties_tenantId_createdAt_idx" ON "rural_properties"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "schools_tenantId_createdAt_idx" ON "schools"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "security_attendances_protocolId_idx" ON "security_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "security_attendances_tenantId_status_idx" ON "security_attendances"("tenantId", "status");

-- CreateIndex
CREATE INDEX "security_attendances_tenantId_createdAt_idx" ON "security_attendances"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "security_occurrences_protocolId_idx" ON "security_occurrences"("protocolId");

-- CreateIndex
CREATE INDEX "security_occurrences_tenantId_status_idx" ON "security_occurrences"("tenantId", "status");

-- CreateIndex
CREATE INDEX "security_occurrences_tenantId_createdAt_idx" ON "security_occurrences"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "social_assistance_attendances_protocolId_idx" ON "social_assistance_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "social_assistance_attendances_tenantId_status_idx" ON "social_assistance_attendances"("tenantId", "status");

-- CreateIndex
CREATE INDEX "social_assistance_attendances_tenantId_createdAt_idx" ON "social_assistance_attendances"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "social_program_enrollments_protocolId_idx" ON "social_program_enrollments"("protocolId");

-- CreateIndex
CREATE INDEX "social_program_enrollments_tenantId_status_idx" ON "social_program_enrollments"("tenantId", "status");

-- CreateIndex
CREATE INDEX "social_program_enrollments_tenantId_createdAt_idx" ON "social_program_enrollments"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "sports_attendances_protocolId_idx" ON "sports_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "sports_attendances_tenantId_status_idx" ON "sports_attendances"("tenantId", "status");

-- CreateIndex
CREATE INDEX "sports_attendances_tenantId_createdAt_idx" ON "sports_attendances"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "sports_school_enrollments_protocolId_idx" ON "sports_school_enrollments"("protocolId");

-- CreateIndex
CREATE INDEX "sports_school_enrollments_tenantId_status_idx" ON "sports_school_enrollments"("tenantId", "status");

-- CreateIndex
CREATE INDEX "sports_school_enrollments_tenantId_createdAt_idx" ON "sports_school_enrollments"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "street_lightings_protocolId_idx" ON "street_lightings"("protocolId");

-- CreateIndex
CREATE INDEX "street_lightings_tenantId_status_idx" ON "street_lightings"("tenantId", "status");

-- CreateIndex
CREATE INDEX "street_lightings_tenantId_createdAt_idx" ON "street_lightings"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "student_enrollments_tenantId_status_idx" ON "student_enrollments"("tenantId", "status");

-- CreateIndex
CREATE INDEX "student_enrollments_tenantId_createdAt_idx" ON "student_enrollments"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "students_tenantId_createdAt_idx" ON "students"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "technical_assistances_protocolId_idx" ON "technical_assistances"("protocolId");

-- CreateIndex
CREATE INDEX "technical_assistances_tenantId_status_idx" ON "technical_assistances"("tenantId", "status");

-- CreateIndex
CREATE INDEX "technical_assistances_tenantId_createdAt_idx" ON "technical_assistances"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "tourism_attendances_protocolId_idx" ON "tourism_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "tourism_attendances_tenantId_status_idx" ON "tourism_attendances"("tenantId", "status");

-- CreateIndex
CREATE INDEX "tourism_attendances_tenantId_createdAt_idx" ON "tourism_attendances"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "tourist_attractions_protocolId_idx" ON "tourist_attractions"("protocolId");

-- CreateIndex
CREATE INDEX "tourist_attractions_tenantId_createdAt_idx" ON "tourist_attractions"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "urban_planning_attendances_protocolId_idx" ON "urban_planning_attendances"("protocolId");

-- CreateIndex
CREATE INDEX "urban_planning_attendances_tenantId_status_idx" ON "urban_planning_attendances"("tenantId", "status");

-- CreateIndex
CREATE INDEX "urban_planning_attendances_tenantId_createdAt_idx" ON "urban_planning_attendances"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "vaccinations_tenantId_createdAt_idx" ON "vaccinations"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "vulnerable_families_protocolId_idx" ON "vulnerable_families"("protocolId");

-- CreateIndex
CREATE INDEX "vulnerable_families_tenantId_status_idx" ON "vulnerable_families"("tenantId", "status");

-- CreateIndex
CREATE INDEX "vulnerable_families_tenantId_createdAt_idx" ON "vulnerable_families"("tenantId", "createdAt");
