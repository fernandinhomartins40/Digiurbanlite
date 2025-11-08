-- CreateTable
CREATE TABLE "student_enrollment_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentBirthDate" DATETIME NOT NULL,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "student_enrollment_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_enrollment_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_transport_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentCpf" TEXT,
    "studentBirthDate" DATETIME,
    "route" TEXT,
    "shift" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'TRANSPORTE_ESCOLAR_SOLICITACAO',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_transport_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_transport_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_meal_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_meal_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_meal_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_transfer_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_transfer_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_transfer_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_material_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "protocolId" TEXT,
    "protocol" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentCpf" TEXT,
    "grade" TEXT NOT NULL,
    "schoolId" TEXT,
    "items" JSONB NOT NULL DEFAULT [],
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "observations" TEXT,
    "serviceId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'service',
    "createdBy" TEXT NOT NULL,
    "moduleType" TEXT NOT NULL DEFAULT 'MATERIAL_ESCOLAR',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "school_material_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "school_material_requests_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollment_requests_protocol_key" ON "student_enrollment_requests"("protocol");

-- CreateIndex
CREATE INDEX "student_enrollment_requests_citizenId_idx" ON "student_enrollment_requests"("citizenId");

-- CreateIndex
CREATE INDEX "student_enrollment_requests_moduleType_idx" ON "student_enrollment_requests"("moduleType");

-- CreateIndex
CREATE INDEX "student_enrollment_requests_protocolId_idx" ON "student_enrollment_requests"("protocolId");

-- CreateIndex
CREATE INDEX "student_enrollment_requests_status_idx" ON "student_enrollment_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "school_transport_requests_protocol_key" ON "school_transport_requests"("protocol");

-- CreateIndex
CREATE INDEX "school_transport_requests_citizenId_idx" ON "school_transport_requests"("citizenId");

-- CreateIndex
CREATE INDEX "school_transport_requests_moduleType_idx" ON "school_transport_requests"("moduleType");

-- CreateIndex
CREATE INDEX "school_transport_requests_protocolId_idx" ON "school_transport_requests"("protocolId");

-- CreateIndex
CREATE INDEX "school_transport_requests_status_idx" ON "school_transport_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "school_meal_requests_protocol_key" ON "school_meal_requests"("protocol");

-- CreateIndex
CREATE INDEX "school_meal_requests_citizenId_idx" ON "school_meal_requests"("citizenId");

-- CreateIndex
CREATE INDEX "school_meal_requests_moduleType_idx" ON "school_meal_requests"("moduleType");

-- CreateIndex
CREATE INDEX "school_meal_requests_protocolId_idx" ON "school_meal_requests"("protocolId");

-- CreateIndex
CREATE INDEX "school_meal_requests_status_idx" ON "school_meal_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "school_transfer_requests_protocol_key" ON "school_transfer_requests"("protocol");

-- CreateIndex
CREATE INDEX "school_transfer_requests_citizenId_idx" ON "school_transfer_requests"("citizenId");

-- CreateIndex
CREATE INDEX "school_transfer_requests_moduleType_idx" ON "school_transfer_requests"("moduleType");

-- CreateIndex
CREATE INDEX "school_transfer_requests_protocolId_idx" ON "school_transfer_requests"("protocolId");

-- CreateIndex
CREATE INDEX "school_transfer_requests_status_idx" ON "school_transfer_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "school_material_requests_protocol_key" ON "school_material_requests"("protocol");

-- CreateIndex
CREATE INDEX "school_material_requests_citizenId_idx" ON "school_material_requests"("citizenId");

-- CreateIndex
CREATE INDEX "school_material_requests_moduleType_idx" ON "school_material_requests"("moduleType");

-- CreateIndex
CREATE INDEX "school_material_requests_protocolId_idx" ON "school_material_requests"("protocolId");

-- CreateIndex
CREATE INDEX "school_material_requests_status_idx" ON "school_material_requests"("status");
