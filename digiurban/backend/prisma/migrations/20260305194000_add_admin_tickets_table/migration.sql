DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'TicketStatus'
  ) THEN
    CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'ACCEPTED', 'PROTOCOL_CREATED', 'REJECTED', 'CANCELLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "admin_tickets" (
  "id" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 3,
  "requestedById" TEXT NOT NULL,
  "citizenId" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "departmentId" TEXT NOT NULL,
  "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
  "protocolId" TEXT,
  "assignedUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "protocolCreatedAt" TIMESTAMP(3),
  "observations" TEXT,
  "rejectionReason" TEXT,
  "acceptedBy" TEXT,
  "rejectedBy" TEXT,
  CONSTRAINT "admin_tickets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "admin_tickets_number_key" ON "admin_tickets"("number");
CREATE UNIQUE INDEX IF NOT EXISTS "admin_tickets_protocolId_key" ON "admin_tickets"("protocolId");
CREATE INDEX IF NOT EXISTS "admin_tickets_status_idx" ON "admin_tickets"("status");
CREATE INDEX IF NOT EXISTS "admin_tickets_departmentId_status_idx" ON "admin_tickets"("departmentId", "status");
CREATE INDEX IF NOT EXISTS "admin_tickets_createdAt_idx" ON "admin_tickets"("createdAt");
CREATE INDEX IF NOT EXISTS "admin_tickets_requestedById_idx" ON "admin_tickets"("requestedById");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_tickets_requestedById_fkey'
  ) THEN
    ALTER TABLE "admin_tickets"
      ADD CONSTRAINT "admin_tickets_requestedById_fkey"
      FOREIGN KEY ("requestedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_tickets_citizenId_fkey'
  ) THEN
    ALTER TABLE "admin_tickets"
      ADD CONSTRAINT "admin_tickets_citizenId_fkey"
      FOREIGN KEY ("citizenId") REFERENCES "citizens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_tickets_serviceId_fkey'
  ) THEN
    ALTER TABLE "admin_tickets"
      ADD CONSTRAINT "admin_tickets_serviceId_fkey"
      FOREIGN KEY ("serviceId") REFERENCES "services_simplified"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_tickets_departmentId_fkey'
  ) THEN
    ALTER TABLE "admin_tickets"
      ADD CONSTRAINT "admin_tickets_departmentId_fkey"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_tickets_protocolId_fkey'
  ) THEN
    ALTER TABLE "admin_tickets"
      ADD CONSTRAINT "admin_tickets_protocolId_fkey"
      FOREIGN KEY ("protocolId") REFERENCES "protocols_simplified"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_tickets_assignedUserId_fkey'
  ) THEN
    ALTER TABLE "admin_tickets"
      ADD CONSTRAINT "admin_tickets_assignedUserId_fkey"
      FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
