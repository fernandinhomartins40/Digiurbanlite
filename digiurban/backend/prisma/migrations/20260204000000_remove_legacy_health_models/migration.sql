-- Migration: Remover Modelos Legados de Saúde
-- Data: 2026-02-04
-- Objetivo: Eliminar modelos duplicados/legados que conflitam com Sistema Unificado V2.0
--
-- Modelos Removidos:
-- 1. DadosSaude - Duplica HealthProfessionalData (0 registros)
-- 2. ProfissionalUnidade - Conflita com EmployeeAssignment (0 registros)
-- 3. AuditoriaVinculo - Duplica AssignmentAudit (1 registro de teste)
-- 4. TipoAuditoriaVinculo - Enum usado apenas por AuditoriaVinculo
--
-- Documentação: backend/REMOCAO_MODELOS_LEGADOS.md

-- DropTable (CASCADE para remover dependências automáticamente)
DROP TABLE IF EXISTS "auditoria_vinculo" CASCADE;
DROP TABLE IF EXISTS "profissional_unidade" CASCADE;
DROP TABLE IF EXISTS "dados_saude" CASCADE;

-- DropEnum
DROP TYPE IF EXISTS "TipoAuditoriaVinculo";
