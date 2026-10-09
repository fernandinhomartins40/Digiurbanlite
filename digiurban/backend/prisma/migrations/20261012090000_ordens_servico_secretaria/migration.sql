-- Ordens de Serviço passam a atender várias secretarias (Obras, Trânsito,
-- Mobilidade, Meio Ambiente além de Serviços Públicos). As OS existentes
-- ficam com Serviços Públicos.
ALTER TABLE "ordens_servico" ADD COLUMN "departmentCode" TEXT DEFAULT 'SERVICOS_PUBLICOS';
UPDATE "ordens_servico" SET "departmentCode" = 'SERVICOS_PUBLICOS' WHERE "departmentCode" IS NULL;
CREATE INDEX "ordens_servico_departmentCode_idx" ON "ordens_servico"("departmentCode");
