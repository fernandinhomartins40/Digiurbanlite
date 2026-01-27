-- ============================================================================
-- MIGRATION: SIMPLIFICAR SISTEMA DE CATEGORIZAÇÃO
-- ============================================================================
--
-- Remove toda a complexidade de IA/ML e usa apenas triggerServices
-- que já existe e funciona perfeitamente.
--
-- ANTES: Sistema complexo com views, triggers, background jobs, IA
-- DEPOIS: Simples array triggerServices[] que mapeia moduleType → categoria
--
-- ============================================================================

-- 1. REMOVER VIEWS E TRIGGERS OBSOLETOS
-- ============================================================================

DROP VIEW IF EXISTS "service_category_matches" CASCADE;
DROP TRIGGER IF EXISTS trigger_analyze_service ON "services_simplified";
DROP FUNCTION IF EXISTS analyze_service_for_categories();

-- 2. REMOVER TABELAS OBSOLETAS (de trás para frente por FK)
-- ============================================================================

-- Tags de serviços (não necessário)
DROP TABLE IF EXISTS "service_tags" CASCADE;

-- Sugestões e learning data (não tem FK)
DROP TABLE IF EXISTS "citizen_category_match_suggestions" CASCADE;
DROP TABLE IF EXISTS "citizen_category_learning_data" CASCADE;

-- Service assignments
DROP TABLE IF EXISTS "service_category_assignments" CASCADE;

-- Match rules
DROP TABLE IF EXISTS "citizen_category_match_rules" CASCADE;

-- Background jobs (se ainda existir da migration anterior)
DROP TABLE IF EXISTS "background_jobs" CASCADE;

-- 3. LIMPAR CAMPOS OBSOLETOS DE citizen_categories
-- ============================================================================

ALTER TABLE "citizen_categories"
DROP COLUMN IF EXISTS "matchingEnabled",
DROP COLUMN IF EXISTS "autoAssignThreshold",
DROP COLUMN IF EXISTS "suggestThreshold",
DROP COLUMN IF EXISTS "exactPatterns",
DROP COLUMN IF EXISTS "regexPatterns",
DROP COLUMN IF EXISTS "semanticRules";

-- 4. ADICIONAR CAMPO triggerServices (se não existir)
-- ============================================================================

-- Adicionar coluna triggerServices se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'citizen_categories'
    AND column_name = 'triggerServices'
  ) THEN
    ALTER TABLE "citizen_categories"
    ADD COLUMN "triggerServices" TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Criar índice para busca rápida por moduleType
CREATE INDEX IF NOT EXISTS "idx_citizen_categories_trigger_services"
ON "citizen_categories" USING GIN ("triggerServices");

-- 5. COMENTÁRIOS EXPLICATIVOS
-- ============================================================================

COMMENT ON COLUMN "citizen_categories"."triggerServices" IS
'Array de moduleTypes que ativam automaticamente esta categoria quando protocolo é aprovado. Ex: [''CADASTRO_PRODUTOR'', ''RENOVACAO_PRODUTOR'']';

-- 6. POPULAR triggerServices DAS CATEGORIAS EXISTENTES (se vazios)
-- ============================================================================

-- Produtor Rural
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['CADASTRO_PRODUTOR']::TEXT[]
WHERE code = 'PRODUTOR_RURAL'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Proprietário Rural
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['CADASTRO_PROPRIEDADE_RURAL']::TEXT[]
WHERE code = 'PROPRIETARIO_RURAL'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Beneficiário de Programa Rural
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['INSCRICAO_PROGRAMA_RURAL']::TEXT[]
WHERE code = 'BENEFICIARIO_PROGRAMA_RURAL'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Artista Local
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['CADASTRO_ARTISTA']::TEXT[]
WHERE code = 'ARTISTA_LOCAL'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Membro de Grupo Artístico
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['CADASTRO_GRUPO_ARTISTICO']::TEXT[]
WHERE code = 'MEMBRO_GRUPO_ARTISTICO'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Participante de Oficina Cultural
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['INSCRICAO_OFICINA_CULTURAL']::TEXT[]
WHERE code = 'PARTICIPANTE_OFICINA_CULTURAL'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Atleta
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['CADASTRO_ATLETA']::TEXT[]
WHERE code = 'ATLETA'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Participante de Modalidade Esportiva
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['INSCRICAO_MODALIDADE']::TEXT[]
WHERE code = 'PARTICIPANTE_MODALIDADE_ESPORTIVA'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Beneficiário de Programas Sociais
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['INSCRICAO_PROGRAMA_SOCIAL', 'CADASTRO_BENEFICIARIO']::TEXT[]
WHERE code = 'BENEFICIARIO_PROGRAMA_SOCIAL'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Família Vulnerável
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['CADASTRO_FAMILIA_VULNERAVEL']::TEXT[]
WHERE code = 'FAMILIA_VULNERAVEL'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Aluno da Rede Municipal
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['MATRICULA_ALUNO', 'REMATRICULA_ALUNO']::TEXT[]
WHERE code = 'ALUNO_REDE_MUNICIPAL'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Responsável de Aluno
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['MATRICULA_ALUNO', 'REMATRICULA_ALUNO']::TEXT[]
WHERE code = 'RESPONSAVEL_ALUNO'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Microempreendedor
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['CADASTRO_MEI', 'RENOVACAO_ALVARA']::TEXT[]
WHERE code = 'MICROEMPREENDEDOR'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Proprietário de Imóvel
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['CADASTRO_IMOVEL', 'ATUALIZACAO_IPTU']::TEXT[]
WHERE code = 'PROPRIETARIO_IMOVEL'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Permissionário de Comércio
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['LICENCA_COMERCIO_AMBULANTE', 'RENOVACAO_PERMISSAO']::TEXT[]
WHERE code = 'PERMISSIONARIO_COMERCIO'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Motorista de Transporte Público
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['CADASTRO_MOTORISTA_TRANSPORTE']::TEXT[]
WHERE code = 'MOTORISTA_TRANSPORTE_PUBLICO'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Beneficiário TFD
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['SOLICITACAO_TFD']::TEXT[]
WHERE code = 'BENEFICIARIO_TFD'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- Paciente Crônico
UPDATE "citizen_categories"
SET "triggerServices" = ARRAY['CADASTRO_DOENCA_CRONICA', 'PROGRAMA_HIPERTENSO']::TEXT[]
WHERE code = 'PACIENTE_CRONICO'
  AND ("triggerServices" IS NULL OR "triggerServices" = '{}');

-- 7. REMOVER RELACIONAMENTOS OBSOLETOS DO SCHEMA
-- ============================================================================

-- Remover FK de ServiceSimplified
ALTER TABLE "services_simplified"
DROP COLUMN IF EXISTS "tags";

-- ============================================================================
-- FIM DA MIGRATION - SISTEMA SIMPLIFICADO E FUNCIONAL
-- ============================================================================

COMMENT ON TABLE "citizen_categories" IS
'Categorias de cidadãos atribuídas automaticamente quando protocolo com moduleType em triggerServices é aprovado';
