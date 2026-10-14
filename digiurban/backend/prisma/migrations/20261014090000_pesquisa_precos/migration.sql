-- Pesquisa de preços (2026-10-14): pesquisa por município ligada ao processo interno + catálogo, BPS e cache das fontes (plataforma)

-- CreateTable
CREATE TABLE "price_researches" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "title" TEXT NOT NULL,
    "processId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RASCUNHO',
    "method" TEXT NOT NULL DEFAULT 'MEDIANA',
    "applyIpca" BOOLEAN NOT NULL DEFAULT true,
    "uf" TEXT,
    "nationwide" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "documentId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_researches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_research_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "researchId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'MATERIAL',
    "catalogCode" INTEGER,
    "catalogName" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "baseUnit" TEXT,
    "unitCapacity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "justification" TEXT,
    "searchStatus" TEXT NOT NULL DEFAULT 'NOVO',
    "searchMessage" TEXT,
    "searchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_research_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_quotes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "itemId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceRef" TEXT,
    "sourceUrl" TEXT,
    "description" TEXT NOT NULL,
    "buyer" TEXT,
    "buyerCity" TEXT,
    "buyerUf" TEXT,
    "sphere" TEXT,
    "supplier" TEXT,
    "supplierDoc" TEXT,
    "brand" TEXT,
    "date" TIMESTAMP(3),
    "quantity" DOUBLE PRECISION,
    "unitLabel" TEXT,
    "capacity" DOUBLE PRECISION,
    "measureUnit" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "baseUnit" TEXT,
    "basePrice" DOUBLE PRECISION,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "excludedReason" TEXT,
    "autoFlag" TEXT,
    "manual" BOOLEAN NOT NULL DEFAULT false,
    "decidedById" TEXT,
    "decidedByName" TEXT,
    "attachmentPath" TEXT,
    "attachmentName" TEXT,
    "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_catalog" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "code" INTEGER NOT NULL,
    "pdmCode" INTEGER,
    "name" TEXT NOT NULL,
    "className" TEXT,
    "searchText" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_bps" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "catmat" INTEGER,
    "pdmCode" INTEGER,
    "description" TEXT NOT NULL,
    "uf" TEXT,
    "sphere" TEXT,
    "institution" TEXT,
    "city" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "supplyUnit" TEXT,
    "capacity" DOUBLE PRECISION,
    "measureUnit" TEXT,
    "quantity" DOUBLE PRECISION,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "supplier" TEXT,
    "modality" TEXT,

    CONSTRAINT "price_bps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_source_cache" (
    "key" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_source_cache_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "price_researches_tenantId_idx" ON "price_researches"("tenantId");

-- CreateIndex
CREATE INDEX "price_researches_processId_idx" ON "price_researches"("processId");

-- CreateIndex
CREATE INDEX "price_researches_createdById_idx" ON "price_researches"("createdById");

-- CreateIndex
CREATE INDEX "price_research_items_tenantId_idx" ON "price_research_items"("tenantId");

-- CreateIndex
CREATE INDEX "price_research_items_researchId_idx" ON "price_research_items"("researchId");

-- CreateIndex
CREATE INDEX "price_quotes_tenantId_idx" ON "price_quotes"("tenantId");

-- CreateIndex
CREATE INDEX "price_quotes_itemId_idx" ON "price_quotes"("itemId");

-- CreateIndex
CREATE INDEX "price_catalog_kind_idx" ON "price_catalog"("kind");

-- CreateIndex
CREATE INDEX "price_catalog_pdmCode_idx" ON "price_catalog"("pdmCode");

-- CreateIndex
CREATE UNIQUE INDEX "price_catalog_kind_code_key" ON "price_catalog"("kind", "code");

-- CreateIndex
CREATE INDEX "price_bps_catmat_idx" ON "price_bps"("catmat");

-- CreateIndex
CREATE INDEX "price_bps_year_idx" ON "price_bps"("year");

-- CreateIndex
CREATE INDEX "price_source_cache_expiresAt_idx" ON "price_source_cache"("expiresAt");

-- AddForeignKey
ALTER TABLE "price_research_items" ADD CONSTRAINT "price_research_items_researchId_fkey" FOREIGN KEY ("researchId") REFERENCES "price_researches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_quotes" ADD CONSTRAINT "price_quotes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "price_research_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- RLS (mesma política permissiva das demais tabelas multi-tenant). Tolerante.
-- price_catalog, price_bps e price_source_cache são da plataforma (dados públicos, sem tenantId).
DO $OUTER$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['price_researches', 'price_research_items', 'price_quotes'] LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
      EXECUTE format($f$CREATE POLICY tenant_isolation ON %I USING (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id()) WITH CHECK (current_tenant_id() IS NULL OR current_tenant_id() = '__platform__' OR "tenantId" IS NULL OR "tenantId" = current_tenant_id())$f$, t);
    EXCEPTION
      WHEN insufficient_privilege THEN RAISE WARNING 'RLS não aplicado em % (sem privilégio)', t;
      WHEN undefined_function THEN RAISE WARNING 'current_tenant_id() ausente ao proteger %', t;
    END;
  END LOOP;
END $OUTER$;
