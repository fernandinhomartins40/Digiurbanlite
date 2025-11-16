# 🚨 Fix para Deploy - Migração moduleType UNIQUE

## Problema Identificado

O deploy falhou com o erro:
```
migrate found failed migrations in the target database
The `20251116_add_unique_module_type` migration failed
There might be data loss when applying the changes:
• A unique constraint covering the columns [moduleType] on the table services_simplified will be added.
  If there are existing duplicate values, this will fail.
```

## Causa Raiz

A migração tentou criar um constraint UNIQUE na coluna `moduleType`, mas o banco de produção contém valores duplicados que impedem a criação do constraint.

## Solução Implementada

A migração foi **corrigida** para resolver duplicatas automaticamente antes de aplicar o constraint:

### Arquivo: `backend/prisma/migrations/20251116_add_unique_module_type/migration.sql`

```sql
-- PASSO 1: Resolver duplicatas existentes
WITH duplicates AS (
  SELECT
    id,
    "moduleType",
    ROW_NUMBER() OVER (PARTITION BY "moduleType" ORDER BY "createdAt" ASC) as rn
  FROM "services_simplified"
  WHERE "moduleType" IS NOT NULL
)
UPDATE "services_simplified" ss
SET "moduleType" = d."moduleType" || '_' || d.rn
FROM duplicates d
WHERE ss.id = d.id
  AND d.rn > 1;

-- PASSO 2: Criar índice único
CREATE UNIQUE INDEX IF NOT EXISTS "services_simplified_moduleType_key"
ON "services_simplified"("moduleType")
WHERE "moduleType" IS NOT NULL;
```

## Passo a Passo para Deploy

### Opção 1: Resetar Status da Migração (RECOMENDADO)

Execute este comando no banco de produção ANTES do próximo deploy:

```bash
# Conectar ao banco de produção
psql -U postgres -d digiurban

# Executar dentro do psql:
DELETE FROM "_prisma_migrations" WHERE migration_name = '20251116_add_unique_module_type';

# Verificar
SELECT migration_name, finished_at, success FROM "_prisma_migrations" WHERE migration_name = '20251116_add_unique_module_type';
# Deve retornar 0 linhas
```

Ou use o script pronto:
```bash
psql -U postgres -d digiurban -f backend/prisma/reset-migration-status.sql
```

### Opção 2: Executar Migração Manualmente

Se preferir executar a migração manualmente antes do deploy:

```bash
# 1. Conectar ao banco
psql -U postgres -d digiurban

# 2. Executar a migração corrigida
\i backend/prisma/migrations/20251116_add_unique_module_type/migration.sql

# 3. Marcar como aplicada
INSERT INTO "_prisma_migrations" (
  id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
) VALUES (
  gen_random_uuid(),
  'corrigido_manualmente',
  NOW(),
  '20251116_add_unique_module_type',
  NULL,
  NULL,
  NOW(),
  1
);
```

## Validação Pós-Deploy

Após o deploy bem-sucedido, validar:

```sql
-- 1. Verificar que não há duplicatas
SELECT "moduleType", COUNT(*) as total
FROM "services_simplified"
WHERE "moduleType" IS NOT NULL
GROUP BY "moduleType"
HAVING COUNT(*) > 1;
-- ✅ Deve retornar 0 linhas

-- 2. Verificar que o índice único existe
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'services_simplified'
  AND indexname = 'services_simplified_moduleType_key';
-- ✅ Deve retornar 1 linha

-- 3. Testar constraint (deve falhar propositalmente)
INSERT INTO "services_simplified" ("moduleType", "name", "departmentId", "isActive")
VALUES ('TESTE_DUPLICADO', 'Teste 1', (SELECT id FROM departments LIMIT 1), true);

INSERT INTO "services_simplified" ("moduleType", "name", "departmentId", "isActive")
VALUES ('TESTE_DUPLICADO', 'Teste 2', (SELECT id FROM departments LIMIT 1), true);
-- ✅ Segunda inserção deve FALHAR com: duplicate key value violates unique constraint

-- 4. Limpar testes
DELETE FROM "services_simplified" WHERE "moduleType" = 'TESTE_DUPLICADO';
```

## Impacto nos Dados

### ✅ Seguro
- Nenhum dado é deletado
- Apenas `moduleType` duplicados são renomeados com sufixo (`_2`, `_3`, etc.)
- Registro mais antigo mantém o nome original

### Exemplo de Transformação

**Antes:**
- Serviço A: `moduleType = "APROVACAO_PROJETO"` (criado em 2025-01-01)
- Serviço B: `moduleType = "APROVACAO_PROJETO"` (criado em 2025-01-02) ← duplicata

**Depois:**
- Serviço A: `moduleType = "APROVACAO_PROJETO"` (mantido)
- Serviço B: `moduleType = "APROVACAO_PROJETO_2"` (renomeado)

## Logs Esperados no Próximo Deploy

```
✅ Gerando Prisma Client...
✅ Executando migrations do Prisma...
   → Aplicando migração 20251116_add_unique_module_type
   → Resolvendo duplicatas...
   → Criando constraint UNIQUE...
   → Migração aplicada com sucesso
✅ Build completado com sucesso
```

## Rollback (se necessário)

Se algo der errado e for necessário reverter:

```sql
-- Remover constraint
DROP INDEX IF EXISTS "services_simplified_moduleType_key";

-- Reverter renomeações (se necessário)
UPDATE "services_simplified"
SET "moduleType" = REGEXP_REPLACE("moduleType", '_\d+$', '')
WHERE "moduleType" ~ '_\d+$';
```

## Próximos Commits

Este fix será commitado com a mensagem:
```
fix(migration): Resolver duplicatas de moduleType antes de aplicar UNIQUE constraint

- Adicionar lógica para renomear moduleTypes duplicados na migração
- Manter registro mais antigo com nome original
- Adicionar sufixo numérico (_2, _3) nas duplicatas
- Criar README da migração com documentação completa
- Criar script para resetar status da migração falhada
- Documentar processo de deploy e validação

Resolves: Erro de deploy "duplicate key value violates unique constraint"
```

## Contatos para Suporte

Se tiver dúvidas ou problemas durante o deploy, consulte:
- Documentação da migração: `backend/prisma/migrations/20251116_add_unique_module_type/README.md`
- Script de reset: `backend/prisma/reset-migration-status.sql`
- Proposta completa: `PROPOSTA_WORKFLOW_AUTOMATICO.md`
