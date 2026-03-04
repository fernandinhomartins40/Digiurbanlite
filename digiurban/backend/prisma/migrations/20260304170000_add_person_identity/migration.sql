CREATE TABLE "people" (
    "id" TEXT NOT NULL,
    "cpf" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "rg" TEXT,
    "birthDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "users" ADD COLUMN "personId" TEXT;
ALTER TABLE "citizens" ADD COLUMN "personId" TEXT;

CREATE UNIQUE INDEX "people_cpf_key" ON "people"("cpf");
CREATE INDEX "people_name_idx" ON "people"("name");
CREATE INDEX "people_email_idx" ON "people"("email");
CREATE UNIQUE INDEX "users_personId_key" ON "users"("personId");
CREATE UNIQUE INDEX "citizens_personId_key" ON "citizens"("personId");

ALTER TABLE "users"
ADD CONSTRAINT "users_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "people"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE "citizens"
ADD CONSTRAINT "citizens_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "people"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
