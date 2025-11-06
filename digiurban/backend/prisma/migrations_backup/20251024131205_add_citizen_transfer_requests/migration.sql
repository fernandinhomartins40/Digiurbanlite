-- CreateTable
CREATE TABLE "citizen_transfer_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenId" TEXT NOT NULL,
    "fromTenantId" TEXT NOT NULL,
    "toTenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "documents" JSONB,
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "reviewNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "citizen_transfer_requests_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "citizens" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "citizen_transfer_requests_fromTenantId_fkey" FOREIGN KEY ("fromTenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "citizen_transfer_requests_toTenantId_fkey" FOREIGN KEY ("toTenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "citizen_transfer_requests_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
