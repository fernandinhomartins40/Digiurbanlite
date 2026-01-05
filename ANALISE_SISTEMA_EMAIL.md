# 📧 ANÁLISE COMPLETA - SISTEMA DE EMAIL DIGIURBAN

**Data:** 2026-01-05
**Objetivo:** Consolidar schema, migrations e seeds para reset limpo do banco

---

## 1. ARQUITETURA ATUAL DO SISTEMA DE EMAIL

### 1.1. Modelos Principais (Schema Prisma)

```
EmailServer (servidor SMTP)
├── EmailDomain (domínios permitidos)
│   └── EmailPlanAllowedDomain (relação plano↔domínio)
├── EmailUser (contas de email)
├── EmailSubscription (assinatura do servidor)
│   └── EmailPlanConfig (plano contratado)
├── Email (emails enviados - OUTBOX)
├── ReceivedEmail (emails recebidos - INBOX)
└── EmailStats, EmailLog, EmailAuthAttempt
```

### 1.2. Fonte Única de Verdade para Limites

✅ **CORRETO:** `EmailPlanConfig` é a fonte única
- `maxEmailsPerMonth`
- `maxAccounts`
- `monthlyPrice`
- `features`

❌ **REMOVIDO:** Campos duplicados em:
- `EmailServer.maxEmailsPerMonth` (comentado no schema)
- `EmailSubscription.maxEmailsPerMonth` (comentado no schema)
- `EmailSubscription.maxAccounts` (comentado no schema)

### 1.3. Fluxo de Envio de Email

```
1. Frontend (compose) → POST /api/admin/email-accounts/send
2. Backend cria Email com status=QUEUED
3. EmailSenderService.sendEmailWithRetry(emailId)
4. Nodemailer conecta em ultrazend-smtp:587
5. Email enviado → status=SENT
6. Contador incrementado: EmailUser.sentToday, sentThisMonth
```

### 1.4. Fluxo de Recebimento de Email

```
1. Email externo → MX mail.digiurban.com.br (porta 25)
2. ultrazend-smtp (container separado) recebe
3. SMTPServer.prisma.ts processa e salva em ReceivedEmail
4. Frontend (inbox) → GET /api/admin/email/inbox
5. Backend consulta ReceivedEmail via ReceivedEmailService
```

---

## 2. MIGRATIONS EXISTENTES

### 2.1. Lista de Migrations

```
1. 20251110161900_init_postgresql/          (inicial)
2. 20260101_add_geolocation_fields/         (geolocalização)
3. 20260101163437_add_password_reset_tokens/ (senha)
4. 20260101200000_add_password_reset_tokens/ (duplicado!)
5. 20260105_remove_duplicate_limits/        (remove limites duplicados)
6. 20260105_add_email_plan_config_fields/   (adiciona campos em EmailPlanConfig)
```

### 2.2. Problemas Identificados

❌ **PROBLEMA 1:** Migration 4 é DUPLICATA da 3
❌ **PROBLEMA 2:** Migration 6 foi criada manualmente mas não foi aplicada
❌ **PROBLEMA 3:** Migration 5 remove colunas mas VPS ainda tem dados antigos

### 2.3. Estado do Banco VPS

```sql
-- ATUAL NA VPS (desalinhado)
email_plan_configs:
  - Não tem: monthly_price, max_emails_per_month, max_accounts, updated_at
  - Tem apenas: id, name, code, features, is_active, created_at

email_subscriptions:
  - Ainda tem: max_emails_per_month, max_accounts (deveria ter sido removido)

email_servers:
  - Ainda tem: max_emails_per_month (deveria ter sido removido)
```

---

## 3. SEEDS EXISTENTES

### 3.1. Seed Consolidado (`seed-consolidated.ts`)

```typescript
1. MunicipioConfig (singleton)
2. Usuários (superadmin, admin, etc)
3. Departamentos (14 secretarias)
4. Cidadão de teste
5. Serviços simplificados (114 serviços)
6. seedEmailServer() ← EXECUTA
7. seedEmailPlans() ← EXECUTA
```

### 3.2. Email Server Seed

✅ **BOM:**
- Cria EmailServer com hostname='ultrazend-smtp'
- Cria EmailDomain para 'digiurban.com.br'
- Configura DKIM/SPF/DMARC

❌ **PROBLEMA:**
- Não cria EmailSubscription
- Não vincula com EmailPlanConfig
- Servidor criado mas SEM PLANO ATIVO

### 3.3. Email Plans Seed

✅ **BOM:**
- Cria 4 planos: BASIC, STANDARD, PREMIUM, ENTERPRISE
- Com preços, limites e features corretos

❌ **PROBLEMA:**
- Planos criados mas NENHUM é atribuído ao EmailServer

---

## 4. DESALINHAMENTOS CRÍTICOS

### 4.1. ❌ EmailServer sem Subscription

**Problema:**
Seed cria `EmailServer` mas NÃO cria `EmailSubscription`

**Impacto:**
```typescript
// Backend faz:
emailServer.subscription.planConfig.maxAccounts
// ❌ ERRO: Cannot read property 'planConfig' of null
```

**Onde quebra:**
- `digiurban/backend/src/routes/admin-email-accounts.ts:93-106`
- Ao criar uma nova conta de email

### 4.2. ❌ Schema vs Banco Desalinhados

**Problema:**
Schema espera campos que não existem no banco VPS

**Campos faltantes em `email_plan_configs`:**
- `monthly_price`
- `max_emails_per_month`
- `max_accounts`
- `updated_at`

**Solução:**
- Migration consolidada com ALTER TABLE + defaults

### 4.3. ❌ Campos Duplicados Ainda no Banco

**Problema:**
Migration 5 remove no schema mas VPS ainda tem as colunas

**Colunas que ainda existem:**
- `email_subscriptions.max_emails_per_month`
- `email_subscriptions.max_accounts`
- `email_servers.max_emails_per_month`

**Solução:**
- Migration com DROP COLUMN IF EXISTS

### 4.4. ❌ EmailDraft Não Existe no Banco

**Problema:**
Schema tem `EmailDraft` mas tabela não foi criada

**Impacto:**
- Endpoints de drafts falharão

**Solução:**
- Criar tabela `email_drafts` na migration

---

## 5. SOLUÇÃO PROPOSTA

### 5.1. Migration Consolidada Final

Criar **UMA** migration que:

1. ✅ Adiciona campos faltantes em `email_plan_configs`
2. ✅ Remove campos duplicados de `email_subscriptions`
3. ✅ Remove campos duplicados de `email_servers`
4. ✅ Cria tabela `email_drafts`
5. ✅ Usa defaults para não quebrar dados existentes

### 5.2. Seed de Email Atualizado

Atualizar `email-server.seed.ts` para:

1. ✅ Criar EmailServer
2. ✅ Criar EmailDomain
3. ✅ **NOVO:** Criar EmailSubscription
4. ✅ **NOVO:** Vincular com plano BASIC (padrão)
5. ✅ **NOVO:** Setar currentPeriodStart/End
6. ✅ **NOVO:** Status = ACTIVE

### 5.3. Estratégia de Deploy

**OPÇÃO 1: Reset Completo (RECOMENDADO)**
```bash
# VPS
npm run db:reset        # Drop + create + migrate
npm run db:seed         # Seed consolidado
```

**OPÇÃO 2: Migration Incremental (ARRISCADO)**
```bash
# VPS
npm run db:migrate      # Aplica migrations pendentes
npm run db:seed         # Atualiza seeds
```

**Recomendação:** OPÇÃO 1 (usuário confirmou que não tem dados importantes)

---

## 6. CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Criar Arquivos
- [ ] Migration consolidada limpa
- [ ] Seed de email atualizado (com subscription)
- [ ] Documentação de DNS

### Fase 2: Testar Localmente
- [ ] `npm run db:reset` local
- [ ] `npm run db:seed` local
- [ ] Verificar todas as tabelas criadas
- [ ] Testar criação de conta de email
- [ ] Testar envio de email
- [ ] Testar recebimento de email

### Fase 3: Deploy VPS
- [ ] Backup do banco atual (segurança)
- [ ] `npm run db:reset` na VPS
- [ ] `npm run db:seed` na VPS
- [ ] Testar fluxo completo
- [ ] Criar conta admin@digiurban.com.br
- [ ] Assinar plano de email

---

## 7. COMANDOS PARA EXECUÇÃO

### Local (Testes)
```bash
cd digiurban/backend
npm run db:reset
npm run db:seed
npm run dev
```

### VPS (Produção)
```bash
ssh vps
cd /root/digiurban-vps/digiurban/backend
docker-compose exec digiurban-vps npm run db:reset
docker-compose exec digiurban-vps npm run db:seed
docker-compose restart digiurban-vps
```

---

## 8. RESUMO EXECUTIVO

### ✅ O Que Funciona
1. Schema Prisma está correto e consolidado
2. Backend tem todos os serviços implementados
3. Frontend tem interfaces completas
4. Container ultrazend-smtp está separado (correto!)
5. Emails enviados funcionam via nodemailer
6. Emails recebidos são salvos em ReceivedEmail

### ❌ O Que Precisa Corrigir
1. Migration consolidada para alinhar banco com schema
2. Seed de email precisa criar EmailSubscription
3. Remover migrations duplicadas
4. Criar tabela email_drafts

### 🎯 Resultado Esperado
Após aplicar as correções:
- ✅ EmailServer com subscription ativa
- ✅ Plano BASIC vinculado
- ✅ Limites funcionando (500 emails/dia, 15000/mês)
- ✅ Criação de contas funciona
- ✅ Envio funciona
- ✅ Recebimento funciona
- ✅ Drafts funciona
- ✅ Lixeira funciona
