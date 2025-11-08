-- AlterTable
ALTER TABLE "attendance_records" ADD COLUMN "studentCpf" TEXT;

-- AlterTable
ALTER TABLE "rural_producers" ADD COLUMN "address" TEXT;
ALTER TABLE "rural_producers" ADD COLUMN "document" TEXT;
ALTER TABLE "rural_producers" ADD COLUMN "email" TEXT;
ALTER TABLE "rural_producers" ADD COLUMN "name" TEXT;
ALTER TABLE "rural_producers" ADD COLUMN "phone" TEXT;
ALTER TABLE "rural_producers" ADD COLUMN "producerName" TEXT;

-- AlterTable
ALTER TABLE "rural_properties" ADD COLUMN "owner" TEXT;

-- AlterTable
ALTER TABLE "technical_assistances" ADD COLUMN "applicantCpf" TEXT;
ALTER TABLE "technical_assistances" ADD COLUMN "applicantEmail" TEXT;
ALTER TABLE "technical_assistances" ADD COLUMN "applicantName" TEXT;
ALTER TABLE "technical_assistances" ADD COLUMN "applicantPhone" TEXT;
ALTER TABLE "technical_assistances" ADD COLUMN "producerCpf" TEXT;
ALTER TABLE "technical_assistances" ADD COLUMN "producerName" TEXT;
ALTER TABLE "technical_assistances" ADD COLUMN "producerPhone" TEXT;
