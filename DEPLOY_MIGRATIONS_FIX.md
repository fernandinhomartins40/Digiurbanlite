# 🔧 FIX: Migrations no Deploy da VPS

## 🔴 PROBLEMA IDENTIFICADO

### Erro no Deploy:
```
src/delivery/HandoverService.ts(110,23): error TS2339: Property 'activeFlowExecution' does not exist
src/delivery/FlowEngineService.ts(174,30): error TS2339: Property 'isPaused' does not exist
src/delivery/FlowEngineService.ts(201,37): error TS2339: Property 'isBotMessage' does not exist
```

### Causa Raiz:

**Ordem de Execução Incorreta:**

```
┌─────────────────────────────────────────────────────────────┐
│ BUILD TIME (Dockerfile)                                      │
├─────────────────────────────────────────────────────────────┤
│ 1. npx prisma generate (linha 44)                           │
│    ↓ Gera Prisma Client baseado no schema.prisma            │
│    ↓ MAS... o PostgreSQL ainda não tem as migrations!       │
│    ↓ Resultado: Client gerado com tipos DESATUALIZADOS      │
│                                                              │
│ 2. npm run build (linha 48)                                 │
│    ↓ TypeScript compila usando o Client DESATUALIZADO       │
│    ↓ ERRO: "Property 'activeFlowExecution' does not exist"  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ RUNTIME (startup.sh)                                         │
├─────────────────────────────────────────────────────────────┤
│ 3. npx prisma migrate deploy (linha 46)                     │
│    ↓ Migrations aplicadas NO BANCO                          │
│    ↓ Agora o banco TEM os campos novos                      │
│                                                              │
│ 4. npx prisma generate (linha 56)                           │
│    ↓ Client re-gerado com tipos CORRETOS                    │
│    ↓ MAS... o TypeScript JÁ FOI COMPILADO com tipos ERRADOS!│
│    ↓ TARDE DEMAIS!                                           │
└─────────────────────────────────────────────────────────────┘
```

### Por que isso acontece?

O **Prisma Client** é gerado em BUILD TIME, mas as **migrations** são aplicadas em RUNTIME. Isso cria um gap temporal onde o TypeScript compila com tipos que não batem com o schema real.

## ✅ SOLUÇÃO

### 1. Entender o Comportamento do `prisma generate`

**Prisma generate NÃO precisa de banco de dados!** Ele lê APENAS o `schema.prisma` e gera os tipos TypeScript baseados nele.

```typescript
// schema.prisma
model FlowExecution {
  isPaused Boolean @default(false)  // ← Prisma lê isso
}

// Gera automaticamente:
type FlowExecution = {
  isPaused: boolean  // ← Tipo gerado
}
```

### 2. Por que os erros ocorreram?

**HIPÓTESE INCORRETA:** Achávamos que `prisma generate` estava lendo schema desatualizado.

**REALIDADE:** O schema.prisma JÁ tem todos os campos novos! O problema é outro:

```bash
# Verificar schema atual:
grep -A 5 "model FlowExecution" digiurban/backend/prisma/schema.prisma
# Resultado: isPaused JÁ EXISTE no schema!

grep -A 5 "model Conversation" digiurban/backend/prisma/schema.prisma
# Resultado: activeFlowExecutionId JÁ EXISTE no schema!
```

### 3. Então qual é o problema REAL?

**O problema está no CACHE do Prisma Client!**

Durante o build Docker, o Prisma Client pode ter sido gerado com uma versão **cacheada** do schema antes do commit das mudanças.

### 4. Solução Final

**Forçar regeneração completa do Prisma Client no build:**

```dockerfile
# Dockerfile - ANTES (linha 44)
RUN npx prisma generate

# Dockerfile - DEPOIS
RUN rm -rf node_modules/.prisma && \
    npx prisma generate
```

Isso garante que o cache antigo seja limpo antes de gerar.

### 5. Garantir que startup.sh também regenere

```bash
# startup.sh - Adicionar limpeza ANTES de generate (linha 56)
echo "🔧 Gerando Prisma Client..."
rm -rf /app/backend/node_modules/.prisma || true
npx prisma generate || {
  echo "❌ Prisma generate falhou"
  exit 1
}
```

## 🧪 VALIDAÇÃO

### Verificar campos no schema:
```bash
cd digiurban/backend
grep "activeFlowExecutionId" prisma/schema.prisma
grep "isPaused" prisma/schema.prisma
grep "isBotMessage" prisma/schema.prisma
```

**Resultado esperado:** Todos os campos DEVEM existir no schema.

### Verificar migration:
```bash
cat prisma/migrations/20260223000000_unify_messages_bot_system/migration.sql | grep -E "(activeFlowExecutionId|isPaused|isBotMessage)"
```

**Resultado esperado:** Migration contém ALTER TABLE para adicionar esses campos.

## 📋 CHECKLIST DE CORREÇÃO

- [x] Schema.prisma TEM os campos novos (activeFlowExecutionId, isPaused, isBotMessage)
- [x] Migration criada com lógica condicional (IF NOT EXISTS)
- [x] Dockerfile atualizado para limpar cache do Prisma antes de generate
- [ ] startup.sh atualizado para limpar cache do Prisma antes de generate
- [ ] Testar build local: `docker build -t digiurban-test .`
- [ ] Testar deploy na VPS

## 🚀 COMANDOS PARA APLICAR A CORREÇÃO

### 1. Atualizar Dockerfile:
```dockerfile
# Linha ~44 do Dockerfile
RUN rm -rf node_modules/.prisma && \
    npx prisma generate
```

### 2. Atualizar startup.sh:
```bash
# Linha ~56 do startup.sh
echo "🔧 Gerando Prisma Client..."
rm -rf /app/backend/node_modules/.prisma || true
npx prisma generate || {
  echo "❌ Prisma generate falhou"
  exit 1
}
```

### 3. Rebuild e redeploy:
```bash
cd /root/Digiurbanlite
git pull
BUILD_TIMESTAMP=$(date +%s) docker compose -f docker-compose.vps.yml up -d --build
```

## 📊 MONITORAMENTO DO DEPLOY

### Logs a observar:
```bash
# Ver logs do build:
docker compose -f docker-compose.vps.yml logs digiurban --tail=200

# Verificar se Prisma Client foi regenerado:
docker exec digiurban-vps ls -la /app/backend/node_modules/.prisma/client/

# Verificar se migrations foram aplicadas:
docker exec digiurban-vps psql $DATABASE_URL -c "\d conversations"
# Deve mostrar coluna activeFlowExecutionId
```

### Sinais de sucesso:
```
✅ Gerando Prisma Client...
✅ Prisma generate concluído
✅ Backend está pronto para iniciar
✅ Supervisord iniciado
```

### Sinais de falha:
```
❌ ERRO: Property 'activeFlowExecution' does not exist
❌ Prisma generate falhou
❌ TypeScript compilation failed
```

## 🎯 RESULTADO ESPERADO

Após aplicar as correções, o build deve:
1. ✅ Limpar cache antigo do Prisma Client
2. ✅ Gerar Prisma Client com todos os campos novos
3. ✅ Compilar TypeScript sem erros
4. ✅ Aplicar migrations no PostgreSQL
5. ✅ Regenerar Prisma Client em runtime (por segurança)
6. ✅ Backend iniciar sem erros

---

**Data:** 2026-02-23
**Autor:** Claude Sonnet 4.5
**Versão:** 1.0
