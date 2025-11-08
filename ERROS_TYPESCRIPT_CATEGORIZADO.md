# Categorização de Erros TypeScript

**Total de Erros:** 162  
**Arquivos Afetados:** 13

---

## Categoria 1: Registro de Handlers (20 erros - TS2345)
**Arquivos:** `core/handlers/{education,health,social-assistance}/index.ts`  
**Problema:** Handlers não implementam interface `ModuleHandler` completa  
**Causa:** Falta métodos: `createEntity`, `activateEntity`, `findByProtocolId`, `updateEntity`

### Erros:
- education/index.ts: 5 erros (linhas 38, 44, 62, 86, 92)
- health/index.ts: 8 erros (linhas 28, 34, 40, 46, 52, 58, 64, 70)
- social-assistance/index.ts: 7 erros (linhas 32, 38, 44, 50, 56, 62, 80)

**Solução:** Implementar métodos faltantes ou ajustar interface ModuleHandler

---

## Categoria 2: Imports Ausentes (3 erros - TS2307)
**Arquivo:** `modules/handlers/registry.ts`  
**Problema:** Tentativa de importar índices deletados na limpeza

### Erros:
- Linha 168: `./health/index` (deletado)
- Linha 173: `./education/index` (deletado)
- Linha 178: `./social/index` (deletado)

**Solução:** Remover imports de stubs deletados

---

## Categoria 3: Entity Handlers Legacy (27 erros - TS2353/TS2339)
**Arquivo:** `services/entity-handlers.ts`  
**Problema:** Campos obsoletos duplicados (patientName, citizenName, fullName, etc)

### Subcategorias:
- **Campos obsoletos:** 18 erros (TS2353)
  - Health: patientName, citizenName, fullName (8 ocorrências)
  - Education: name, citizenCpf (2 ocorrências)
  - Social: citizenName, beneficiaryName (3 ocorrências)
  - Agriculture: producerCpf (1 ocorrência)
  - Urban Planning: contactInfo, applicantName (4 ocorrências)
  
- **citizenId ausente:** 9 erros (TS2339)
  - Linhas: 268, 335, 356, 393, 416, 438, 684, 704, 793, 2472, 2517

**Solução:** Marcar arquivo como deprecated ou refatorar completamente

---

## Categoria 4: Routes - Alerts (26 erros)
**Arquivo:** `routes/alerts.ts`

### Subcategorias:
- **tenantMiddleware ausente:** 10 erros (TS2304)
- **tenantId não existe:** 9 erros (TS2339/TS2353)
- **Validação de schema:** 3 erros (TS2345)
- **req.user undefined:** 4 erros (TS18048)

**Solução:** Remover lógica multi-tenant obsoleta

---

## Categoria 5: Routes - Analytics (43 erros)
**Arquivo:** `routes/analytics.ts`

### Subcategorias:
- **tenantMiddleware/tenantId:** 18 erros
- **Validação de argumentos:** 4 erros (TS2554)
- **Prisma model ausente:** 1 erro (protocolEvaluation não existe)
- **Type mismatch:** 15 erros (TS2345, TS2339, TS2322)
- **req.user undefined:** 5 erros (TS18048)

**Solução:** Remover lógica multi-tenant e corrigir types

---

## Categoria 6: Routes - Protocols (2 erros)
**Arquivo:** `routes/protocols-simplified.routes.ts`

- Linha 320: `user` não existe em `ProtocolHistorySimplifiedInclude`
- Linha 328: `createdAt` inválido em `OrderByWithRelationInput`

**Solução:** Ajustar include e orderBy

---

## Categoria 7: Routes - Agricultura (5 erros)
**Arquivo:** `routes/secretarias-agricultura.ts`

- Linha 651: Campo `size` em RuralProperty (usar totalArea)
- Linhas 2118-2121: Campos obsoletos (applicantName, applicantCpf, etc)

**Solução:** Usar citizen.* ao invés de campos redundantes

---

## Categoria 8: Handlers Security/Sports (3 erros)
**Arquivos:** `modules/handlers/security/*`, `sports/*`

- security-alert-handler.ts (linha 13): Type mismatch
- security-occurrence-handler.ts (linha 13): Type mismatch  
- security-patrol-handler.ts (linha 14): Campo `protocol` (usar protocolId)
- sports-tournament-handler.ts (linha 30): Campo `registrationOpen` inválido

**Solução:** Ajustar campos conforme schema Prisma

---

## Categoria 9: Citizen Lookup (6 erros)
**Arquivo:** `routes/admin-citizen-lookup.ts`

- Linhas 188-193: Propriedade `member` não existe (usar memberId)

**Solução:** Incluir relação `member` ou usar ID direto

---

## Categoria 10: Citizen Lookup Service (1 erro)
**Arquivo:** `services/citizen-lookup.service.ts`

- Linha 117: `mode` não existe em `StringFilter`

**Solução:** Remover campo `mode` ou ajustar filtro

---

## Resumo por Prioridade

### 🔴 Crítico (33 erros)
1. Entity handlers legacy (27 erros) - Arquivo já marcado como DEPRECATED
2. Imports ausentes (3 erros) - Quebra compilação
3. Citizen lookup service (1 erro)
4. Agricultura campos obsoletos (2 erros)

### 🟡 Alta (49 erros)
1. Routes alerts - tenant logic (26 erros)
2. Registro de handlers (20 erros)
3. Handlers security/sports (3 erros)

### 🟢 Média (80 erros)
1. Routes analytics - tenant logic (43 erros)
2. Routes protocols (2 erros)
3. Admin citizen lookup (6 erros)
4. Agricultura (3 erros restantes)

---

## Estratégia de Correção

### Fase 1: Erros Bloqueantes (3 erros)
- Remover imports ausentes em registry.ts

### Fase 2: Handlers Core (20 erros)
- Ajustar interface ModuleHandler ou implementar métodos

### Fase 3: Routes Multi-tenant (69 erros)
- Remover lógica tenant em alerts.ts e analytics.ts

### Fase 4: Handlers Específicos (9 erros)
- Corrigir security, sports, agricultura

### Fase 5: Lookups (7 erros)
- Corrigir citizen-lookup e protocols

### Fase 6: Entity Handlers (27 erros)
- Arquivo já marcado como LEGACY - baixa prioridade

**Total Corrigível Imediato:** 108 erros  
**Total Legacy (não prioritário):** 27 erros  
**Tempo Estimado:** 2-3h de correções sistemáticas
