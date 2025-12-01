-- ============================================
-- TABELAS APP TFD (Tratamento Fora do Domicílio)
-- ============================================

-- ESPECIALIDADES TFD
CREATE TABLE IF NOT EXISTS "especialidades_tfd" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "especialidades_tfd_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "especialidades_tfd_nome_key" ON "especialidades_tfd"("nome");
CREATE INDEX IF NOT EXISTS "especialidades_tfd_ativo_idx" ON "especialidades_tfd"("ativo");
CREATE INDEX IF NOT EXISTS "especialidades_tfd_ordem_idx" ON "especialidades_tfd"("ordem");

-- DESTINOS TFD
CREATE TABLE IF NOT EXISTS "destinos_tfd" (
    "id" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "hospital" TEXT,
    "especialidades" JSONB,
    "distanciaKm" INTEGER,
    "tempoViagem" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "destinos_tfd_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "destinos_tfd_cidade_estado_hospital_key" ON "destinos_tfd"("cidade", "estado", "hospital");
CREATE INDEX IF NOT EXISTS "destinos_tfd_ativo_idx" ON "destinos_tfd"("ativo");
CREATE INDEX IF NOT EXISTS "destinos_tfd_cidade_idx" ON "destinos_tfd"("cidade");
