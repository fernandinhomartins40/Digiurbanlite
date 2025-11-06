# Relatório: Conversão Multitenancy → Single Tenant

## DigiUrban - Análise Técnica

**Contexto:** Ambiente de desenvolvimento (não produção)
**Abordagem:** Migração direta e completa
**Tempo:** 3-5 dias úteis

---

## 1. ARQUITETURA ATUAL

### Stack
- **Backend:** Node.js + TypeScript + Express + Prisma
- **Frontend:** Next.js + React + Axios
- **Database:** SQLite (dev) → PostgreSQL (produção)
- **Deploy:** Docker + Nginx

### Multitenancy
- **150+ tabelas** com campo `tenantId`
- **800+ queries** com filtro `tenantId`
- **JWT** contém: `{ userId, tenantId, role }`
- **Middleware** `tenantMiddleware` extrai e valida tenant
- **Tabela Tenant** relacionada a todas entidades

---

## 2. TRANSFORMAÇÃO

### 2.1 Banco de Dados

**Remover completamente:**
```prisma
// ❌ DELETAR
model Tenant { ... }

// ❌ DELETAR de todos models
tenantId   String
tenant     Tenant @relation(...)
@@unique([tenantId, email])
@@index([tenantId, ...])
```

**Adicionar:**
```prisma
// ✅ NOVO - Configuração única
model MunicipioConfig {
  id              String   @id @default("singleton")
  nome            String
  cnpj            String   @unique
  codigoIbge      String?
  nomeMunicipio   String
  ufMunicipio     String
  brasao          String?
  corPrimaria     String?
}
```

### 2.2 Backend

**Deletar arquivos:**
- `src/middleware/tenant.ts`
- `src/routes/super-admin.ts`
- `src/routes/tenants.ts`

**Modificar em TODAS queries (800+):**
```typescript
// ❌ ANTES
await prisma.user.findMany({
  where: { tenantId: req.tenantId, isActive: true }
})

// ✅ DEPOIS
await prisma.user.findMany({
  where: { isActive: true }
})
```

**JWT simplificado:**
```typescript
// ❌ ANTES
jwt.sign({ userId, tenantId, role })

// ✅ DEPOIS
jwt.sign({ userId, role })
```

### 2.3 Frontend
- Sem alterações significativas (já usa cookies automáticos)
- Remover lógica condicional de tenant (se existir)

---

## 3. ESTIMATIVA

| Tarefa | Tempo |
|--------|-------|
| Schema Prisma (150+ models) | 6h |
| Migrations | 2h |
| Queries backend (800+) | 12h |
| Middlewares | 3h |
| Frontend | 2h |
| Testes | 4h |
| Validação | 3h |
| **TOTAL** | **32h (4 dias)** |

---

## 4. CONCLUSÃO

✅ **Migração direta é viável e recomendada**

**Por quê?**
- Sem dados de produção
- Código mais simples
- Performance melhor
- Pronto em 4 dias

**Próximo:** Executar plano de implementação direta
