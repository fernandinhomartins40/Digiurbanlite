-- ============================================================================
-- REGISTRY F7 — Full-text / busca por texto livre (aditivo)
-- ----------------------------------------------------------------------------
-- O motor de query já busca por `valueText ILIKE '%termo%'` nos campos
-- searchable (projetados em record_indexes na F3). Um ILIKE '%...%' não usa
-- índice B-tree (seq scan). Aqui adicionamos:
--   1) extensão pg_trgm;
--   2) índice GIN trigram sobre record_indexes.valueText → torna o ILIKE
--      indexado (busca por texto livre rápida), sem manter coluna tsvector.
--
-- ADITIVO e tolerante: se faltar privilégio para CREATE EXTENSION (banco sem a
-- credencial owner), emite aviso e segue — a busca continua funcionando (só
-- sem o índice acelerador). Não altera comportamento, só performance.
-- ============================================================================

DO $OUTER$
BEGIN
  BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE WARNING 'pg_trgm não criado (sem privilégio); busca textual funciona sem índice acelerador';
    WHEN OTHERS THEN
      RAISE WARNING 'pg_trgm indisponível: %; busca textual funciona sem índice acelerador', SQLERRM;
  END;

  -- Só cria o índice se a extensão existir (gin_trgm_ops depende dela).
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    BEGIN
      CREATE INDEX IF NOT EXISTS "idx_record_indexes_valueText_trgm"
        ON "record_indexes" USING GIN ("valueText" gin_trgm_ops);
    EXCEPTION
      WHEN insufficient_privilege THEN
        RAISE WARNING 'índice trigram não criado (sem privilégio)';
    END;
  END IF;
END $OUTER$;
