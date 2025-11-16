# Migração: Adicionar Constraint UNIQUE no moduleType

## Objetivo
Garantir que cada `moduleType` seja único em todo o sistema, evitando duplicatas e garantindo a integridade referencial com workflows.

## O que esta migração faz

### Passo 1: Resolver Duplicatas Existentes
- Identifica todos os `moduleType` duplicados na tabela `services_simplified`
- Mantém o primeiro registro (mais antigo) com o nome original
- Renomeia os duplicados adicionando sufixo `_2`, `_3`, etc.
- Usa `ROW_NUMBER()` para numerar sequencialmente as duplicatas

### Passo 2: Criar Constraint UNIQUE
- Cria índice único na coluna `moduleType`
- Aplica apenas quando `moduleType IS NOT NULL`
- Garante que novas inserções/atualizações não criem duplicatas

## Exemplo de Transformação

**Antes:**
```
| id | moduleType          | createdAt           |
|----|---------------------|---------------------|
| 1  | APROVACAO_PROJETO   | 2025-01-01 10:00:00 |
| 2  | APROVACAO_PROJETO   | 2025-01-02 11:00:00 |
| 3  | INSCRICAO_TORNEIO   | 2025-01-03 12:00:00 |
| 4  | INSCRICAO_TORNEIO   | 2025-01-04 13:00:00 |
```

**Depois:**
```
| id | moduleType            | createdAt           |
|----|-----------------------|---------------------|
| 1  | APROVACAO_PROJETO     | 2025-01-01 10:00:00 | ← Original mantido
| 2  | APROVACAO_PROJETO_2   | 2025-01-02 11:00:00 | ← Renomeado
| 3  | INSCRICAO_TORNEIO     | 2025-01-03 12:00:00 | ← Original mantido
| 4  | INSCRICAO_TORNEIO_2   | 2025-01-04 13:00:00 | ← Renomeado
```

## Reversão

Se necessário reverter esta migração:

```sql
-- Remover constraint UNIQUE
DROP INDEX IF EXISTS "services_simplified_moduleType_key";

-- Reverter renomeações (se souber os nomes originais)
UPDATE "services_simplified"
SET "moduleType" = REGEXP_REPLACE("moduleType", '_\d+$', '')
WHERE "moduleType" ~ '_\d+$';
```

## Notas Importantes

1. **Sem perda de dados**: Nenhum registro é deletado, apenas renomeado
2. **Idempotente**: Pode ser executada múltiplas vezes sem efeitos colaterais
3. **Compatível com produção**: Segura para ambiente de produção
4. **Relacionamentos**: Não afeta workflows existentes (eles já têm seus próprios moduleTypes)

## Validação Pós-Migração

Para verificar se a migração funcionou:

```sql
-- 1. Verificar que não há duplicatas
SELECT "moduleType", COUNT(*) as total
FROM "services_simplified"
WHERE "moduleType" IS NOT NULL
GROUP BY "moduleType"
HAVING COUNT(*) > 1;
-- Deve retornar 0 linhas

-- 2. Verificar que o índice foi criado
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'services_simplified'
  AND indexname = 'services_simplified_moduleType_key';
-- Deve retornar 1 linha

-- 3. Testar constraint (deve falhar)
INSERT INTO "services_simplified" ("moduleType", "name", "departmentId", "isActive")
VALUES ('APROVACAO_PROJETO', 'Teste Duplicado', 'some-dept-id', true);
-- Deve retornar erro: duplicate key value violates unique constraint
```
