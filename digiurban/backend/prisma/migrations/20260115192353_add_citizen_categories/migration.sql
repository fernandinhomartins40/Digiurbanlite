-- CreateTable
CREATE TABLE "citizen_categories" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "department" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "triggerServices" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_category_assignments" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "protocolId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deactivatedAt" TIMESTAMP(3),
    "deactivatedBy" TEXT,
    "deactivationReason" TEXT,
    "metadata" JSONB,

    CONSTRAINT "citizen_category_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "citizen_categories_code_key" ON "citizen_categories"("code");

-- CreateIndex
CREATE INDEX "citizen_categories_code_idx" ON "citizen_categories"("code");

-- CreateIndex
CREATE INDEX "citizen_categories_active_idx" ON "citizen_categories"("active");

-- CreateIndex
CREATE INDEX "citizen_category_assignments_citizenId_idx" ON "citizen_category_assignments"("citizenId");

-- CreateIndex
CREATE INDEX "citizen_category_assignments_categoryId_idx" ON "citizen_category_assignments"("categoryId");

-- CreateIndex
CREATE INDEX "citizen_category_assignments_protocolId_idx" ON "citizen_category_assignments"("protocolId");

-- CreateIndex
CREATE INDEX "citizen_category_assignments_active_idx" ON "citizen_category_assignments"("active");

-- CreateIndex
CREATE UNIQUE INDEX "citizen_category_assignments_citizenId_categoryId_key" ON "citizen_category_assignments"("citizenId", "categoryId");

-- AddForeignKey
ALTER TABLE "citizen_category_assignments" ADD CONSTRAINT "citizen_category_assignments_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_category_assignments" ADD CONSTRAINT "citizen_category_assignments_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "citizen_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_category_assignments" ADD CONSTRAINT "citizen_category_assignments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_category_assignments" ADD CONSTRAINT "citizen_category_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
