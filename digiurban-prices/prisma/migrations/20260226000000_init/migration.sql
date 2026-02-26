-- ============================================================================
-- DigiUrban Prices — Migration Inicial
-- Cria todas as tabelas do módulo de pesquisa de preços públicos.
-- USA CREATE ... IF NOT EXISTS para ser idempotente e seguro em DB compartilhado.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- ÓRGÃOS PÚBLICOS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "prices_organizations" (
  "id"        TEXT        NOT NULL,
  "cnpj"      TEXT,
  "name"      TEXT        NOT NULL,
  "shortName" TEXT,
  "uf"        TEXT,
  "city"      TEXT,
  "sphere"    TEXT,
  "pncpCode"  TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prices_organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "prices_organizations_cnpj_key"
  ON "prices_organizations"("cnpj");
CREATE UNIQUE INDEX IF NOT EXISTS "prices_organizations_pncpCode_key"
  ON "prices_organizations"("pncpCode");

-- ────────────────────────────────────────────────────────────────────────────
-- FORNECEDORES
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "prices_suppliers" (
  "id"        TEXT        NOT NULL,
  "cnpj"      TEXT,
  "cpf"       TEXT,
  "name"      TEXT        NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prices_suppliers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "prices_suppliers_cnpj_key"
  ON "prices_suppliers"("cnpj");
CREATE UNIQUE INDEX IF NOT EXISTS "prices_suppliers_cpf_key"
  ON "prices_suppliers"("cpf");

-- ────────────────────────────────────────────────────────────────────────────
-- CONTRATOS / PROCESSOS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "prices_contracts" (
  "id"              TEXT        NOT NULL,
  "pncpId"          TEXT,
  "processNumber"   TEXT,
  "year"            INTEGER,
  "modality"        TEXT,
  "modalityCode"    INTEGER,
  "description"     TEXT,
  "totalValue"      DOUBLE PRECISION,
  "contractDate"    TIMESTAMP(3),
  "publicationDate" TIMESTAMP(3),
  "uf"              TEXT,
  "city"            TEXT,
  "status"          TEXT,
  "organizationId"  TEXT        NOT NULL,
  "supplierId"      TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prices_contracts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "prices_contracts_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "prices_organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "prices_contracts_supplierId_fkey"
    FOREIGN KEY ("supplierId")
    REFERENCES "prices_suppliers"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "prices_contracts_pncpId_key"
  ON "prices_contracts"("pncpId");
CREATE INDEX IF NOT EXISTS "prices_contracts_organizationId_idx"
  ON "prices_contracts"("organizationId");
CREATE INDEX IF NOT EXISTS "prices_contracts_supplierId_idx"
  ON "prices_contracts"("supplierId");

-- ────────────────────────────────────────────────────────────────────────────
-- ITENS / SERVIÇOS (coração do sistema)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "prices_line_items" (
  "id"                    TEXT             NOT NULL,
  "pncpId"                TEXT,
  "description"           TEXT             NOT NULL,
  "normalizedDescription" TEXT             NOT NULL,
  "quantity"              DOUBLE PRECISION,
  "unit"                  TEXT,
  "unitPrice"             DOUBLE PRECISION,
  "totalPrice"            DOUBLE PRECISION,
  "calculatedUnitPrice"   DOUBLE PRECISION,
  "catmatCode"            TEXT,
  "catmatDescription"     TEXT,
  "catserCode"            TEXT,
  "itemCategory"          TEXT,
  "source"                TEXT             NOT NULL DEFAULT 'pncp',
  "sourceId"              TEXT,
  "supplierName"          TEXT,
  "supplierCnpj"          TEXT,
  "confidenceScore"       DOUBLE PRECISION DEFAULT 1.0,
  "yearMonth"             TEXT,
  "contractDate"          TIMESTAMP(3),
  "uf"                    TEXT,
  "city"                  TEXT,
  "isValid"               BOOLEAN          NOT NULL DEFAULT true,
  "invalidReason"         TEXT,
  "isOutlier"             BOOLEAN          NOT NULL DEFAULT false,
  "outlierReason"         TEXT,
  "organizationId"        TEXT             NOT NULL,
  "supplierId"            TEXT,
  "contractId"            TEXT,
  "createdAt"             TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prices_line_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "prices_line_items_organizationId_fkey"
    FOREIGN KEY ("organizationId")
    REFERENCES "prices_organizations"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "prices_line_items_supplierId_fkey"
    FOREIGN KEY ("supplierId")
    REFERENCES "prices_suppliers"("id")
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "prices_line_items_contractId_fkey"
    FOREIGN KEY ("contractId")
    REFERENCES "prices_contracts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "prices_line_items_normalizedDescription_idx"
  ON "prices_line_items"("normalizedDescription");
CREATE INDEX IF NOT EXISTS "prices_line_items_catmatCode_idx"
  ON "prices_line_items"("catmatCode");
CREATE INDEX IF NOT EXISTS "prices_line_items_catserCode_idx"
  ON "prices_line_items"("catserCode");
CREATE INDEX IF NOT EXISTS "prices_line_items_contractDate_idx"
  ON "prices_line_items"("contractDate");
CREATE INDEX IF NOT EXISTS "prices_line_items_uf_idx"
  ON "prices_line_items"("uf");
CREATE INDEX IF NOT EXISTS "prices_line_items_source_idx"
  ON "prices_line_items"("source");
CREATE INDEX IF NOT EXISTS "prices_line_items_yearMonth_idx"
  ON "prices_line_items"("yearMonth");
CREATE INDEX IF NOT EXISTS "prices_line_items_isValid_isOutlier_idx"
  ON "prices_line_items"("isValid", "isOutlier");

-- ────────────────────────────────────────────────────────────────────────────
-- CATÁLOGO CATMAT / CATSER (cache local)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "prices_catmat_items" (
  "code"             TEXT        NOT NULL,
  "type"             TEXT        NOT NULL,
  "description"      TEXT        NOT NULL,
  "groupCode"        TEXT,
  "groupDescription" TEXT,
  "classCode"        TEXT,
  "classDescription" TEXT,
  "pdmCode"          TEXT,
  "pdmDescription"   TEXT,
  "isActive"         BOOLEAN     NOT NULL DEFAULT true,
  "syncedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prices_catmat_items_pkey" PRIMARY KEY ("code")
);

CREATE INDEX IF NOT EXISTS "prices_catmat_items_description_idx"
  ON "prices_catmat_items"("description");
CREATE INDEX IF NOT EXISTS "prices_catmat_items_type_idx"
  ON "prices_catmat_items"("type");
CREATE INDEX IF NOT EXISTS "prices_catmat_items_groupCode_idx"
  ON "prices_catmat_items"("groupCode");

-- ────────────────────────────────────────────────────────────────────────────
-- ESTATÍSTICAS POR FORNECEDOR (pré-calculadas)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "prices_supplier_stats" (
  "id"             TEXT             NOT NULL,
  "supplierName"   TEXT             NOT NULL,
  "supplierCnpj"   TEXT,
  "itemNormalized" TEXT             NOT NULL,
  "count"          INTEGER          NOT NULL DEFAULT 0,
  "avgPrice"       DOUBLE PRECISION,
  "minPrice"       DOUBLE PRECISION,
  "maxPrice"       DOUBLE PRECISION,
  "lastSeenAt"     TIMESTAMP(3),
  "sources"        TEXT[]           NOT NULL DEFAULT ARRAY[]::TEXT[],
  "ufs"            TEXT[]           NOT NULL DEFAULT ARRAY[]::TEXT[],
  "updatedAt"      TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prices_supplier_stats_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "prices_supplier_stats_itemNormalized_idx"
  ON "prices_supplier_stats"("itemNormalized");
CREATE INDEX IF NOT EXISTS "prices_supplier_stats_supplierCnpj_idx"
  ON "prices_supplier_stats"("supplierCnpj");

-- ────────────────────────────────────────────────────────────────────────────
-- PAYLOADS BRUTOS (auditoria)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "prices_raw_payloads" (
  "id"          TEXT        NOT NULL,
  "source"      TEXT        NOT NULL,
  "endpoint"    TEXT        NOT NULL,
  "payload"     JSONB       NOT NULL,
  "processedAt" TIMESTAMP(3),
  "ingestRunId" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prices_raw_payloads_pkey" PRIMARY KEY ("id")
);

-- ────────────────────────────────────────────────────────────────────────────
-- EXECUÇÕES DE INGESTÃO
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "prices_ingest_runs" (
  "id"             TEXT        NOT NULL,
  "source"         TEXT        NOT NULL DEFAULT 'pncp',
  "startedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt"     TIMESTAMP(3),
  "status"         TEXT        NOT NULL DEFAULT 'running',
  "itemsIngested"  INTEGER     NOT NULL DEFAULT 0,
  "itemsUpdated"   INTEGER     NOT NULL DEFAULT 0,
  "itemsSkipped"   INTEGER     NOT NULL DEFAULT 0,
  "errors"         INTEGER     NOT NULL DEFAULT 0,
  "errorDetails"   JSONB,
  "triggeredBy"    TEXT,
  "sinceDays"      INTEGER     NOT NULL DEFAULT 365,
  CONSTRAINT "prices_ingest_runs_pkey" PRIMARY KEY ("id")
);

-- ────────────────────────────────────────────────────────────────────────────
-- AUDITORIAS DE CONSULTAS
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "prices_search_audits" (
  "id"               TEXT             NOT NULL,
  "userId"           TEXT,
  "query"            TEXT             NOT NULL,
  "filters"          JSONB,
  "periodFrom"       TIMESTAMP(3),
  "periodTo"         TIMESTAMP(3),
  "resultsCount"     INTEGER          NOT NULL DEFAULT 0,
  "excludedCount"    INTEGER          NOT NULL DEFAULT 0,
  "avgPrice"         DOUBLE PRECISION,
  "medianPrice"      DOUBLE PRECISION,
  "minPrice"         DOUBLE PRECISION,
  "maxPrice"         DOUBLE PRECISION,
  "algorithmVersion" TEXT             NOT NULL DEFAULT '1.0',
  "outlierMethod"    TEXT             NOT NULL DEFAULT 'IQR',
  "outlierK"         DOUBLE PRECISION NOT NULL DEFAULT 1.5,
  "isBatchSearch"    BOOLEAN          NOT NULL DEFAULT false,
  "reportGenerated"  BOOLEAN          NOT NULL DEFAULT false,
  "ipAddress"        TEXT,
  "userAgent"        TEXT,
  "durationMs"       INTEGER,
  "createdAt"        TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "prices_search_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "prices_search_audits_userId_idx"
  ON "prices_search_audits"("userId");
CREATE INDEX IF NOT EXISTS "prices_search_audits_createdAt_idx"
  ON "prices_search_audits"("createdAt");
