-- ============================================================================
-- MIGRAÇÕES SQL - Sistema de Serviços DigiUrban
-- ============================================================================
-- Data: 27 de Outubro de 2025
-- Versão: 1.0
-- Database: PostgreSQL 14+
--
-- IMPORTANTE:
-- - Executar migrações em ORDEM SEQUENCIAL
-- - Fazer BACKUP completo antes de executar em produção
-- - Testar em ambiente de staging primeiro
-- - Cada migração tem script de ROLLBACK correspondente
-- ============================================================================

-- ============================================================================
-- MIGRAÇÃO 1: Adicionar Campo serviceType
-- ============================================================================
-- Objetivo: Classificar serviços em REQUEST, REGISTRATION, CONSULTATION, BOTH
-- Impacto: Tabela Service
-- Risco: Baixo (adiciona campo nullable inicialmente)
-- Tempo Estimado: 5 segundos
-- ============================================================================

-- STEP 1.1: Criar ENUM ServiceType
DO $$ BEGIN
  CREATE TYPE "ServiceType" AS ENUM ('REQUEST', 'REGISTRATION', 'CONSULTATION', 'BOTH');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- STEP 1.2: Adicionar coluna serviceType (nullable inicialmente)
ALTER TABLE "Service"
ADD COLUMN IF NOT EXISTS "serviceType" "ServiceType";

-- STEP 1.3: Popular campo com valor padrão REQUEST para serviços existentes
UPDATE "Service"
SET "serviceType" = 'REQUEST'
WHERE "serviceType" IS NULL;

-- STEP 1.4: Tornar campo obrigatório
ALTER TABLE "Service"
ALTER COLUMN "serviceType" SET DEFAULT 'REQUEST',
ALTER COLUMN "serviceType" SET NOT NULL;

-- STEP 1.5: Criar índice para performance
CREATE INDEX IF NOT EXISTS "Service_serviceType_idx"
ON "Service"("serviceType");

-- VALIDAÇÃO: Verificar que todos serviços têm tipo
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM "Service" WHERE "serviceType" IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migração 1 falhou: % serviços sem serviceType', null_count;
  END IF;
  RAISE NOTICE 'Migração 1 OK: Todos serviços têm serviceType';
END $$;

-- ============================================================================
-- ROLLBACK MIGRAÇÃO 1
-- ============================================================================
/*
-- Remover índice
DROP INDEX IF EXISTS "Service_serviceType_idx";

-- Remover coluna
ALTER TABLE "Service" DROP COLUMN IF EXISTS "serviceType";

-- Remover ENUM
DROP TYPE IF EXISTS "ServiceType";
*/

-- ============================================================================
-- MIGRAÇÃO 2: Adicionar Campos de SLA
-- ============================================================================
-- Objetivo: Rastrear SLA (prazo de conclusão) dos serviços
-- Impacto: Tabela Service
-- Risco: Baixo (campos opcionais)
-- Tempo Estimado: 3 segundos
-- ============================================================================

-- STEP 2.1: Criar ENUM SLAType
DO $$ BEGIN
  CREATE TYPE "SLAType" AS ENUM ('BUSINESS_DAYS', 'CALENDAR_DAYS', 'HOURS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- STEP 2.2: Adicionar colunas de SLA
ALTER TABLE "Service"
ADD COLUMN IF NOT EXISTS "slaHours" INTEGER,
ADD COLUMN IF NOT EXISTS "slaDays" INTEGER,
ADD COLUMN IF NOT EXISTS "slaType" "SLAType" DEFAULT 'BUSINESS_DAYS';

-- STEP 2.3: Popular valores padrão para serviços existentes
-- (Exemplo: todos serviços têm SLA de 5 dias úteis)
UPDATE "Service"
SET "slaDays" = 5, "slaType" = 'BUSINESS_DAYS'
WHERE "slaDays" IS NULL;

-- STEP 2.4: Adicionar constraints de validação
ALTER TABLE "Service"
ADD CONSTRAINT "Service_sla_check"
CHECK (
  ("slaHours" IS NOT NULL AND "slaDays" IS NULL) OR
  ("slaHours" IS NULL AND "slaDays" IS NOT NULL) OR
  ("slaHours" IS NULL AND "slaDays" IS NULL)
);
-- Garante que apenas UM dos campos (slaHours OU slaDays) seja preenchido

-- VALIDAÇÃO
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "Service"
    WHERE "slaHours" IS NOT NULL AND "slaDays" IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Migração 2 falhou: Serviços com slaHours E slaDays preenchidos';
  END IF;
  RAISE NOTICE 'Migração 2 OK: Campos de SLA adicionados';
END $$;

-- ============================================================================
-- ROLLBACK MIGRAÇÃO 2
-- ============================================================================
/*
-- Remover constraint
ALTER TABLE "Service" DROP CONSTRAINT IF EXISTS "Service_sla_check";

-- Remover colunas
ALTER TABLE "Service"
DROP COLUMN IF EXISTS "slaHours",
DROP COLUMN IF EXISTS "slaDays",
DROP COLUMN IF EXISTS "slaType";

-- Remover ENUM
DROP TYPE IF EXISTS "SLAType";
*/

-- ============================================================================
-- MIGRAÇÃO 3: Adicionar protocolId FK nos Attendance Models
-- ============================================================================
-- Objetivo: Vincular cada Attendance a um Protocol via FK
-- Impacto: 10 tabelas (AttendanceHealth, AttendanceEducation, etc.)
-- Risco: MÉDIO (migração de dados + FK)
-- Tempo Estimado: 30 segundos (depende do volume de dados)
-- ============================================================================

-- IMPORTANTE: Fazer backup antes de executar!
-- pg_dump -U postgres -d digiurban -t "AttendanceHealth" -t "AttendanceEducation" ... > backup_attendances.sql

-- ============================================================================
-- STEP 3.1: AttendanceHealth
-- ============================================================================

-- Adicionar coluna protocolId (nullable inicialmente)
ALTER TABLE "AttendanceHealth"
ADD COLUMN IF NOT EXISTS "protocolId" INTEGER;

-- Migrar dados: tentar vincular registros existentes
-- (Se campo 'protocol' String existir com número de protocolo)
UPDATE "AttendanceHealth" ah
SET "protocolId" = p.id
FROM "Protocol" p
WHERE ah."protocol" IS NOT NULL
  AND p."protocolNumber" = ah."protocol";

-- Adicionar FK constraint
ALTER TABLE "AttendanceHealth"
ADD CONSTRAINT "AttendanceHealth_protocolId_fkey"
FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id")
ON DELETE CASCADE;

-- Criar índice
CREATE INDEX IF NOT EXISTS "AttendanceHealth_protocolId_idx"
ON "AttendanceHealth"("protocolId");

-- Remover coluna antiga 'protocol' String (após validação)
-- ALTER TABLE "AttendanceHealth" DROP COLUMN IF EXISTS "protocol";

-- ============================================================================
-- STEP 3.2: AttendanceEducation
-- ============================================================================

ALTER TABLE "AttendanceEducation"
ADD COLUMN IF NOT EXISTS "protocolId" INTEGER;

UPDATE "AttendanceEducation" ae
SET "protocolId" = p.id
FROM "Protocol" p
WHERE ae."protocol" IS NOT NULL
  AND p."protocolNumber" = ae."protocol";

ALTER TABLE "AttendanceEducation"
ADD CONSTRAINT "AttendanceEducation_protocolId_fkey"
FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id")
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "AttendanceEducation_protocolId_idx"
ON "AttendanceEducation"("protocolId");

-- ============================================================================
-- STEP 3.3: AttendanceHousing
-- ============================================================================

ALTER TABLE "AttendanceHousing"
ADD COLUMN IF NOT EXISTS "protocolId" INTEGER;

UPDATE "AttendanceHousing" ah
SET "protocolId" = p.id
FROM "Protocol" p
WHERE ah."protocol" IS NOT NULL
  AND p."protocolNumber" = ah."protocol";

ALTER TABLE "AttendanceHousing"
ADD CONSTRAINT "AttendanceHousing_protocolId_fkey"
FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id")
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "AttendanceHousing_protocolId_idx"
ON "AttendanceHousing"("protocolId");

-- ============================================================================
-- STEP 3.4: AttendanceSocialAssistance
-- ============================================================================

ALTER TABLE "AttendanceSocialAssistance"
ADD COLUMN IF NOT EXISTS "protocolId" INTEGER;

UPDATE "AttendanceSocialAssistance" asa
SET "protocolId" = p.id
FROM "Protocol" p
WHERE asa."protocol" IS NOT NULL
  AND p."protocolNumber" = asa."protocol";

ALTER TABLE "AttendanceSocialAssistance"
ADD CONSTRAINT "AttendanceSocialAssistance_protocolId_fkey"
FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id")
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "AttendanceSocialAssistance_protocolId_idx"
ON "AttendanceSocialAssistance"("protocolId");

-- ============================================================================
-- STEP 3.5: AttendanceCulture
-- ============================================================================

ALTER TABLE "AttendanceCulture"
ADD COLUMN IF NOT EXISTS "protocolId" INTEGER;

UPDATE "AttendanceCulture" ac
SET "protocolId" = p.id
FROM "Protocol" p
WHERE ac."protocol" IS NOT NULL
  AND p."protocolNumber" = ac."protocol";

ALTER TABLE "AttendanceCulture"
ADD CONSTRAINT "AttendanceCulture_protocolId_fkey"
FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id")
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "AttendanceCulture_protocolId_idx"
ON "AttendanceCulture"("protocolId");

-- ============================================================================
-- STEP 3.6: AttendanceSports
-- ============================================================================

ALTER TABLE "AttendanceSports"
ADD COLUMN IF NOT EXISTS "protocolId" INTEGER;

UPDATE "AttendanceSports" asp
SET "protocolId" = p.id
FROM "Protocol" p
WHERE asp."protocol" IS NOT NULL
  AND p."protocolNumber" = asp."protocol";

ALTER TABLE "AttendanceSports"
ADD CONSTRAINT "AttendanceSports_protocolId_fkey"
FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id")
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "AttendanceSports_protocolId_idx"
ON "AttendanceSports"("protocolId");

-- ============================================================================
-- STEP 3.7: AttendanceTourism
-- ============================================================================

ALTER TABLE "AttendanceTourism"
ADD COLUMN IF NOT EXISTS "protocolId" INTEGER;

UPDATE "AttendanceTourism" at
SET "protocolId" = p.id
FROM "Protocol" p
WHERE at."protocol" IS NOT NULL
  AND p."protocolNumber" = at."protocol";

ALTER TABLE "AttendanceTourism"
ADD CONSTRAINT "AttendanceTourism_protocolId_fkey"
FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id")
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "AttendanceTourism_protocolId_idx"
ON "AttendanceTourism"("protocolId");

-- ============================================================================
-- STEP 3.8: AttendanceEnvironment
-- ============================================================================

ALTER TABLE "AttendanceEnvironment"
ADD COLUMN IF NOT EXISTS "protocolId" INTEGER;

UPDATE "AttendanceEnvironment" ae
SET "protocolId" = p.id
FROM "Protocol" p
WHERE ae."protocol" IS NOT NULL
  AND p."protocolNumber" = ae."protocol";

ALTER TABLE "AttendanceEnvironment"
ADD CONSTRAINT "AttendanceEnvironment_protocolId_fkey"
FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id")
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "AttendanceEnvironment_protocolId_idx"
ON "AttendanceEnvironment"("protocolId");

-- ============================================================================
-- STEP 3.9: AttendancePublicWorks
-- ============================================================================

ALTER TABLE "AttendancePublicWorks"
ADD COLUMN IF NOT EXISTS "protocolId" INTEGER;

UPDATE "AttendancePublicWorks" apw
SET "protocolId" = p.id
FROM "Protocol" p
WHERE apw."protocol" IS NOT NULL
  AND p."protocolNumber" = apw."protocol";

ALTER TABLE "AttendancePublicWorks"
ADD CONSTRAINT "AttendancePublicWorks_protocolId_fkey"
FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id")
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "AttendancePublicWorks_protocolId_idx"
ON "AttendancePublicWorks"("protocolId");

-- ============================================================================
-- STEP 3.10: AttendanceTraffic
-- ============================================================================

ALTER TABLE "AttendanceTraffic"
ADD COLUMN IF NOT EXISTS "protocolId" INTEGER;

UPDATE "AttendanceTraffic" at
SET "protocolId" = p.id
FROM "Protocol" p
WHERE at."protocol" IS NOT NULL
  AND p."protocolNumber" = at."protocol";

ALTER TABLE "AttendanceTraffic"
ADD CONSTRAINT "AttendanceTraffic_protocolId_fkey"
FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id")
ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "AttendanceTraffic_protocolId_idx"
ON "AttendanceTraffic"("protocolId");

-- ============================================================================
-- VALIDAÇÃO MIGRAÇÃO 3
-- ============================================================================

DO $$
DECLARE
  health_count INTEGER;
  education_count INTEGER;
  housing_count INTEGER;
  social_count INTEGER;
  culture_count INTEGER;
  sports_count INTEGER;
  tourism_count INTEGER;
  environment_count INTEGER;
  works_count INTEGER;
  traffic_count INTEGER;
BEGIN
  -- Contar registros órfãos (sem protocolId)
  SELECT COUNT(*) INTO health_count FROM "AttendanceHealth" WHERE "protocolId" IS NULL;
  SELECT COUNT(*) INTO education_count FROM "AttendanceEducation" WHERE "protocolId" IS NULL;
  SELECT COUNT(*) INTO housing_count FROM "AttendanceHousing" WHERE "protocolId" IS NULL;
  SELECT COUNT(*) INTO social_count FROM "AttendanceSocialAssistance" WHERE "protocolId" IS NULL;
  SELECT COUNT(*) INTO culture_count FROM "AttendanceCulture" WHERE "protocolId" IS NULL;
  SELECT COUNT(*) INTO sports_count FROM "AttendanceSports" WHERE "protocolId" IS NULL;
  SELECT COUNT(*) INTO tourism_count FROM "AttendanceTourism" WHERE "protocolId" IS NULL;
  SELECT COUNT(*) INTO environment_count FROM "AttendanceEnvironment" WHERE "protocolId" IS NULL;
  SELECT COUNT(*) INTO works_count FROM "AttendancePublicWorks" WHERE "protocolId" IS NULL;
  SELECT COUNT(*) INTO traffic_count FROM "AttendanceTraffic" WHERE "protocolId" IS NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migração 3 - Relatório de Órfãos:';
  RAISE NOTICE 'AttendanceHealth: % registros sem protocolId', health_count;
  RAISE NOTICE 'AttendanceEducation: % registros sem protocolId', education_count;
  RAISE NOTICE 'AttendanceHousing: % registros sem protocolId', housing_count;
  RAISE NOTICE 'AttendanceSocialAssistance: % registros sem protocolId', social_count;
  RAISE NOTICE 'AttendanceCulture: % registros sem protocolId', culture_count;
  RAISE NOTICE 'AttendanceSports: % registros sem protocolId', sports_count;
  RAISE NOTICE 'AttendanceTourism: % registros sem protocolId', tourism_count;
  RAISE NOTICE 'AttendanceEnvironment: % registros sem protocolId', environment_count;
  RAISE NOTICE 'AttendancePublicWorks: % registros sem protocolId', works_count;
  RAISE NOTICE 'AttendanceTraffic: % registros sem protocolId', traffic_count;
  RAISE NOTICE '========================================';

  -- Se houver órfãos, avisar (não falhar, pois podem ser dados legados)
  IF (health_count + education_count + housing_count + social_count + culture_count +
      sports_count + tourism_count + environment_count + works_count + traffic_count) > 0 THEN
    RAISE WARNING 'Migração 3: Existem registros órfãos (dados legados). Revisar manualmente.';
  ELSE
    RAISE NOTICE 'Migração 3 OK: Todos Attendances vinculados a Protocols';
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK MIGRAÇÃO 3
-- ============================================================================
/*
-- Remover constraints e índices
ALTER TABLE "AttendanceHealth" DROP CONSTRAINT IF EXISTS "AttendanceHealth_protocolId_fkey";
DROP INDEX IF EXISTS "AttendanceHealth_protocolId_idx";
ALTER TABLE "AttendanceHealth" DROP COLUMN IF EXISTS "protocolId";

ALTER TABLE "AttendanceEducation" DROP CONSTRAINT IF EXISTS "AttendanceEducation_protocolId_fkey";
DROP INDEX IF EXISTS "AttendanceEducation_protocolId_idx";
ALTER TABLE "AttendanceEducation" DROP COLUMN IF EXISTS "protocolId";

ALTER TABLE "AttendanceHousing" DROP CONSTRAINT IF EXISTS "AttendanceHousing_protocolId_fkey";
DROP INDEX IF EXISTS "AttendanceHousing_protocolId_idx";
ALTER TABLE "AttendanceHousing" DROP COLUMN IF EXISTS "protocolId";

ALTER TABLE "AttendanceSocialAssistance" DROP CONSTRAINT IF EXISTS "AttendanceSocialAssistance_protocolId_fkey";
DROP INDEX IF EXISTS "AttendanceSocialAssistance_protocolId_idx";
ALTER TABLE "AttendanceSocialAssistance" DROP COLUMN IF EXISTS "protocolId";

ALTER TABLE "AttendanceCulture" DROP CONSTRAINT IF EXISTS "AttendanceCulture_protocolId_fkey";
DROP INDEX IF EXISTS "AttendanceCulture_protocolId_idx";
ALTER TABLE "AttendanceCulture" DROP COLUMN IF EXISTS "protocolId";

ALTER TABLE "AttendanceSports" DROP CONSTRAINT IF EXISTS "AttendanceSports_protocolId_fkey";
DROP INDEX IF EXISTS "AttendanceSports_protocolId_idx";
ALTER TABLE "AttendanceSports" DROP COLUMN IF EXISTS "protocolId";

ALTER TABLE "AttendanceTourism" DROP CONSTRAINT IF EXISTS "AttendanceTourism_protocolId_fkey";
DROP INDEX IF EXISTS "AttendanceTourism_protocolId_idx";
ALTER TABLE "AttendanceTourism" DROP COLUMN IF EXISTS "protocolId";

ALTER TABLE "AttendanceEnvironment" DROP CONSTRAINT IF EXISTS "AttendanceEnvironment_protocolId_fkey";
DROP INDEX IF EXISTS "AttendanceEnvironment_protocolId_idx";
ALTER TABLE "AttendanceEnvironment" DROP COLUMN IF EXISTS "protocolId";

ALTER TABLE "AttendancePublicWorks" DROP CONSTRAINT IF EXISTS "AttendancePublicWorks_protocolId_fkey";
DROP INDEX IF EXISTS "AttendancePublicWorks_protocolId_idx";
ALTER TABLE "AttendancePublicWorks" DROP COLUMN IF EXISTS "protocolId";

ALTER TABLE "AttendanceTraffic" DROP CONSTRAINT IF EXISTS "AttendanceTraffic_protocolId_fkey";
DROP INDEX IF EXISTS "AttendanceTraffic_protocolId_idx";
ALTER TABLE "AttendanceTraffic" DROP COLUMN IF EXISTS "protocolId";

-- Restaurar backup se necessário
-- psql -U postgres -d digiurban < backup_attendances.sql
*/

-- ============================================================================
-- MIGRAÇÃO 4: Adicionar Campos de Origem no Protocol
-- ============================================================================
-- Objetivo: Rastrear de onde veio o protocolo (serviço web, app, presencial)
-- Impacto: Tabela Protocol
-- Risco: Baixo (campos opcionais)
-- Tempo Estimado: 5 segundos
-- ============================================================================

-- STEP 4.1: Criar ENUM ProtocolOrigin
DO $$ BEGIN
  CREATE TYPE "ProtocolOrigin" AS ENUM ('WEB_CITIZEN', 'WEB_ADMIN', 'MOBILE_APP', 'IN_PERSON', 'PHONE', 'EMAIL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- STEP 4.2: Adicionar colunas
ALTER TABLE "Protocol"
ADD COLUMN IF NOT EXISTS "origin" "ProtocolOrigin" DEFAULT 'WEB_CITIZEN',
ADD COLUMN IF NOT EXISTS "originDetails" TEXT,
ADD COLUMN IF NOT EXISTS "ipAddress" VARCHAR(45); -- Suporta IPv6

-- STEP 4.3: Popular dados legados
UPDATE "Protocol"
SET "origin" = 'WEB_CITIZEN'
WHERE "origin" IS NULL AND "citizenId" IS NOT NULL;

UPDATE "Protocol"
SET "origin" = 'WEB_ADMIN'
WHERE "origin" IS NULL AND "citizenId" IS NULL;

-- STEP 4.4: Criar índice
CREATE INDEX IF NOT EXISTS "Protocol_origin_idx"
ON "Protocol"("origin");

-- VALIDAÇÃO
DO $$
BEGIN
  RAISE NOTICE 'Migração 4 OK: Campos de origem adicionados';
END $$;

-- ============================================================================
-- ROLLBACK MIGRAÇÃO 4
-- ============================================================================
/*
-- Remover índice
DROP INDEX IF EXISTS "Protocol_origin_idx";

-- Remover colunas
ALTER TABLE "Protocol"
DROP COLUMN IF EXISTS "origin",
DROP COLUMN IF EXISTS "originDetails",
DROP COLUMN IF EXISTS "ipAddress";

-- Remover ENUM
DROP TYPE IF EXISTS "ProtocolOrigin";
*/

-- ============================================================================
-- MIGRAÇÃO 5: Otimizações de Performance
-- ============================================================================
-- Objetivo: Adicionar índices para queries frequentes
-- Impacto: Tabelas Protocol, Service, Attendance*
-- Risco: Baixo (apenas índices)
-- Tempo Estimado: 20 segundos
-- ============================================================================

-- Índices em Protocol
CREATE INDEX IF NOT EXISTS "Protocol_status_idx" ON "Protocol"("status");
CREATE INDEX IF NOT EXISTS "Protocol_tenantId_status_idx" ON "Protocol"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "Protocol_createdAt_idx" ON "Protocol"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Protocol_concludedAt_idx" ON "Protocol"("concludedAt" DESC) WHERE "concludedAt" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Protocol_citizenId_idx" ON "Protocol"("citizenId") WHERE "citizenId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "Protocol_serviceId_idx" ON "Protocol"("serviceId") WHERE "serviceId" IS NOT NULL;

-- Índices em Service
CREATE INDEX IF NOT EXISTS "Service_tenantId_isActive_idx" ON "Service"("tenantId", "isActive");
CREATE INDEX IF NOT EXISTS "Service_category_idx" ON "Service"("category");
CREATE INDEX IF NOT EXISTS "Service_department_idx" ON "Service"("department");

-- Índices compostos para busca
CREATE INDEX IF NOT EXISTS "Service_name_trgm_idx" ON "Service" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Service_description_trgm_idx" ON "Service" USING gin ("description" gin_trgm_ops);
-- Requer extensão pg_trgm: CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índices em ServiceForm
CREATE INDEX IF NOT EXISTS "ServiceForm_serviceId_idx" ON "ServiceForm"("serviceId");

-- Índices em ServiceLocation
CREATE INDEX IF NOT EXISTS "ServiceLocation_serviceId_idx" ON "ServiceLocation"("serviceId");

-- VALIDAÇÃO
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename IN ('Protocol', 'Service', 'ServiceForm', 'ServiceLocation');

  RAISE NOTICE 'Migração 5 OK: % índices criados/verificados', index_count;
END $$;

-- ============================================================================
-- ROLLBACK MIGRAÇÃO 5
-- ============================================================================
/*
-- Remover índices
DROP INDEX IF EXISTS "Protocol_status_idx";
DROP INDEX IF EXISTS "Protocol_tenantId_status_idx";
DROP INDEX IF EXISTS "Protocol_createdAt_idx";
DROP INDEX IF EXISTS "Protocol_concludedAt_idx";
DROP INDEX IF EXISTS "Protocol_citizenId_idx";
DROP INDEX IF EXISTS "Protocol_serviceId_idx";
DROP INDEX IF EXISTS "Service_tenantId_isActive_idx";
DROP INDEX IF EXISTS "Service_category_idx";
DROP INDEX IF EXISTS "Service_department_idx";
DROP INDEX IF EXISTS "Service_name_trgm_idx";
DROP INDEX IF EXISTS "Service_description_trgm_idx";
DROP INDEX IF EXISTS "ServiceForm_serviceId_idx";
DROP INDEX IF EXISTS "ServiceLocation_serviceId_idx";
*/

-- ============================================================================
-- SCRIPT DE VALIDAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  service_count INTEGER;
  protocol_count INTEGER;
  attendance_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO service_count FROM "Service";
  SELECT COUNT(*) INTO protocol_count FROM "Protocol";
  SELECT COUNT(*) INTO attendance_count FROM "AttendanceHealth"; -- exemplo

  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO FINAL DE MIGRAÇÕES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de Serviços: %', service_count;
  RAISE NOTICE 'Total de Protocolos: %', protocol_count;
  RAISE NOTICE 'Total de AttendanceHealth: %', attendance_count;
  RAISE NOTICE '========================================';

  -- Verificar integridade
  IF EXISTS (SELECT 1 FROM "Service" WHERE "serviceType" IS NULL) THEN
    RAISE EXCEPTION 'ERRO: Serviços sem serviceType encontrados!';
  END IF;

  IF EXISTS (SELECT 1 FROM "AttendanceHealth" WHERE "protocolId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Protocol" WHERE id = "AttendanceHealth"."protocolId")) THEN
    RAISE EXCEPTION 'ERRO: AttendanceHealth com protocolId inválido!';
  END IF;

  RAISE NOTICE 'Todas migrações aplicadas com sucesso! ✓';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- INSTRUÇÕES DE USO
-- ============================================================================
/*

## Como Executar em Produção:

1. BACKUP COMPLETO:
```bash
pg_dump -U postgres -d digiurban_prod -F c -b -v -f backup_pre_migration_$(date +%Y%m%d).backup
```

2. TESTAR EM STAGING:
```bash
psql -U postgres -d digiurban_staging < MIGRATIONS.sql
```

3. VALIDAR STAGING:
- Executar testes E2E
- Verificar criação de serviços
- Verificar criação de protocolos
- Validar queries de listagem

4. EXECUTAR EM PRODUÇÃO (janela de manutenção):
```bash
psql -U postgres -d digiurban_prod < MIGRATIONS.sql
```

5. MONITORAR LOGS:
```bash
tail -f /var/log/postgresql/postgresql.log
```

## Como Fazer Rollback:

1. PARAR APLICAÇÃO:
```bash
pm2 stop digiurban-backend
```

2. EXECUTAR ROLLBACKS (ordem inversa):
```sql
-- Descomentar seções de ROLLBACK e executar
-- Migração 5 → 4 → 3 → 2 → 1
```

3. OU RESTAURAR BACKUP COMPLETO:
```bash
pg_restore -U postgres -d digiurban_prod -c backup_pre_migration_*.backup
```

4. REINICIAR APLICAÇÃO:
```bash
pm2 start digiurban-backend
```

## Monitoramento Pós-Migração:

```sql
-- Verificar uso de índices
SELECT
  schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Verificar tamanho das tabelas
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Verificar queries lentas
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;
```

*/

-- ============================================================================
-- FIM DAS MIGRAÇÕES
-- ============================================================================
