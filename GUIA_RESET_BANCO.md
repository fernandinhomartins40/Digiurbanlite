# 🔄 GUIA DE RESET DO BANCO DE DADOS - SISTEMA DE EMAIL

**Data:** 2026-01-05
**Objetivo:** Reset completo do banco para aplicar migration consolidada

---

## ⚠️ IMPORTANTE

Este guia executa um **RESET COMPLETO** do banco de dados PostgreSQL.
**TODOS OS DADOS SERÃO PERDIDOS!**

Usuário confirmou que não há dados importantes na VPS ainda.

---

## 📋 PRÉ-REQUISITOS

### Arquivos Criados/Atualizados

✅ **Migration Consolidada:**
```
digiurban/backend/prisma/migrations/20260105_consolidated_email_schema/migration.sql
```

✅ **Seed Atualizado:**
```
digiurban/backend/prisma/seeds/email-server.seed.ts (com subscription)
digiurban/backend/prisma/seeds/email-plans.seed.ts (4 planos)
digiurban/backend/prisma/seed-consolidated.ts (ordem correta)
```

✅ **Serviços Backend:**
```
digiurban/backend/src/services/EmailSenderService.ts
digiurban/backend/src/services/ReceivedEmailService.ts
```

✅ **Rotas Backend:**
```
digiurban/backend/src/routes/admin-email.ts (inbox, drafts, trash)
digiurban/backend/src/routes/admin-email-accounts.ts (envio real)
```

---

## 🧪 TESTE LOCAL (WINDOWS)

### 1. Backup Opcional (Segurança)

```bash
cd c:\Projetos Cursor\Digiurbanlite\digiurban\backend
pg_dump -h localhost -U postgres -d digiurban > backup_antes_reset.sql
```

### 2. Reset do Banco

```bash
cd c:\Projetos Cursor\Digiurbanlite\digiurban\backend

# Opção 1: Reset completo (recomendado)
npm run db:reset

# Opção 2: Comandos separados (debug)
npx prisma migrate reset --force --skip-seed
npx prisma db push
npm run db:seed
```

### 3. Verificar Resultado

```bash
# Conectar no PostgreSQL
psql -h localhost -U postgres -d digiurban

-- Verificar tabelas criadas
\dt

-- Verificar planos de email
SELECT code, name, max_emails_per_month, max_accounts, monthly_price
FROM email_plan_configs;

-- Verificar servidor de email
SELECT id, hostname, is_active
FROM email_servers;

-- Verificar subscription
SELECT s.id, s.plan, s.status, p.name, p.max_emails_per_month
FROM email_subscriptions s
JOIN email_plan_configs p ON s.plan_config_id = p.id;

-- Verificar drafts table
\d email_drafts

-- Verificar received_emails table
\d received_emails

-- Sair
\q
```

### 4. Testar Backend

```bash
# Terminal 1: Backend
cd digiurban/backend
npm run dev

# Terminal 2: Testar endpoint
curl http://localhost:3333/api/admin/email-accounts \
  -H "Authorization: Bearer SEU_TOKEN"
```

### 5. Testar Frontend

```bash
# Terminal 3: Frontend
cd digiurban/frontend
npm run dev

# Acessar: http://localhost:3000/admin/email-accounts
# Tentar criar uma conta de email
```

---

## 🚀 DEPLOY VPS (PRODUÇÃO)

### 1. Conectar na VPS

```bash
ssh root@189.126.111.209
```

### 2. Parar Containers

```bash
cd /root/digiurban-vps
docker-compose down
```

### 3. Backup do Banco (Segurança)

```bash
# Subir apenas PostgreSQL
docker-compose up -d postgres

# Aguardar PostgreSQL iniciar
sleep 10

# Fazer backup
docker-compose exec postgres pg_dump -U digiurban digiurban > backup_antes_reset_$(date +%Y%m%d_%H%M%S).sql

# Confirmar backup criado
ls -lh backup_*.sql
```

### 4. Reset do Banco na VPS

```bash
# Subir apenas backend e postgres
docker-compose up -d postgres digiurban-vps

# Aguardar backend iniciar
sleep 15

# Executar reset
docker-compose exec digiurban-vps npm run db:reset

# OU comandos separados (debug):
docker-compose exec digiurban-vps npx prisma migrate reset --force --skip-seed
docker-compose exec digiurban-vps npx prisma db push
docker-compose exec digiurban-vps npm run db:seed
```

### 5. Verificar Resultado na VPS

```bash
# Conectar no PostgreSQL do container
docker-compose exec postgres psql -U digiurban digiurban

-- Verificar planos
SELECT code, name, max_emails_per_month, max_accounts
FROM email_plan_configs;

-- Verificar servidor + subscription
SELECT
  s.hostname,
  sub.plan,
  sub.status,
  p.name as plan_name,
  p.max_emails_per_month,
  p.max_accounts
FROM email_servers s
LEFT JOIN email_subscriptions sub ON sub.email_server_id = s.id
LEFT JOIN email_plan_configs p ON sub.plan_config_id = p.id;

-- Verificar tabelas criadas
\dt email_*

-- Sair
\q
```

### 6. Reiniciar Todos os Containers

```bash
docker-compose down
docker-compose up -d

# Verificar logs
docker-compose logs -f --tail=100
```

### 7. Testar Sistema Completo

```bash
# 1. Testar API de contas
curl https://digiurban.com.br/api/admin/email-accounts \
  -H "Authorization: Bearer SEU_TOKEN"

# 2. Acessar frontend
# https://digiurban.com.br/admin/email-accounts

# 3. Criar conta de email
# admin@digiurban.com.br

# 4. Tentar enviar email teste
# Para: teste@gmail.com
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Backend (API)

- [ ] GET /api/admin/email-accounts retorna 200
- [ ] POST /api/admin/email-accounts cria conta com limites corretos
- [ ] Limites exibem: 0/500 (hoje), 0/15000 (mês)
- [ ] POST /api/admin/email-accounts/send envia email
- [ ] GET /api/admin/email/inbox retorna array vazio
- [ ] GET /api/admin/email/drafts retorna array vazio
- [ ] POST /api/admin/email/drafts salva rascunho

### Frontend

- [ ] Página /admin/email-accounts carrega
- [ ] Criação de conta funciona
- [ ] Compose page mostra limites com barras de progresso
- [ ] Envio de email funciona
- [ ] Inbox carrega
- [ ] Drafts carrega

### Base de Dados

- [ ] Tabela `email_plan_configs` tem 4 planos
- [ ] Tabela `email_servers` tem 1 servidor
- [ ] Tabela `email_subscriptions` tem 1 subscription ACTIVE
- [ ] Tabela `email_domains` tem domínio digiurban.com.br
- [ ] Tabela `email_drafts` existe
- [ ] Tabela `received_emails` existe
- [ ] Campos duplicados removidos (max_emails_per_month)

### Containers Docker

- [ ] Container `digiurban-vps` rodando
- [ ] Container `ultrazend-smtp` rodando
- [ ] Container `postgres` rodando
- [ ] Logs sem erros críticos

---

## 🔧 TROUBLESHOOTING

### Erro: "Plano STANDARD não encontrado"

**Causa:** seedEmailPlans() não foi executado antes de seedEmailServer()

**Solução:**
```bash
# Executar seed novamente
docker-compose exec digiurban-vps npm run db:seed
```

### Erro: "Cannot read property 'planConfig' of null"

**Causa:** EmailServer não tem subscription vinculada

**Verificar:**
```sql
SELECT * FROM email_subscriptions;
```

**Solução:**
```bash
# Re-seed
docker-compose exec digiurban-vps npm run db:seed
```

### Erro: "Table 'email_drafts' does not exist"

**Causa:** Migration não foi aplicada

**Solução:**
```bash
docker-compose exec digiurban-vps npx prisma migrate deploy
```

### Erro: "Column 'max_accounts' does not exist"

**Causa:** Migration consolidada não foi aplicada

**Solução:**
```bash
# Forçar migration
docker-compose exec digiurban-vps npx prisma migrate reset --force
docker-compose exec digiurban-vps npm run db:seed
```

### Container ultrazend-smtp não inicia

**Verificar:**
```bash
docker-compose logs ultrazend-smtp
```

**Solução comum:**
```bash
# Reconstruir container
docker-compose down
docker-compose build ultrazend-smtp
docker-compose up -d
```

---

## 📊 RESULTADO ESPERADO

Após executar com sucesso:

### EmailServer
```
hostname: ultrazend-smtp
isActive: true
monthlyPrice: 99.00
```

### EmailSubscription
```
plan: STANDARD
status: ACTIVE
planConfig:
  - name: Padrão
  - maxEmailsPerMonth: 15000
  - maxAccounts: 15
  - monthlyPrice: 99.00
```

### EmailDomain
```
domainName: digiurban.com.br
isVerified: false
dkimEnabled: true
```

### Primeira Conta Criada
```
email: admin@digiurban.com.br
dailyLimit: 500 (15000/30)
monthlyLimit: 15000
sentToday: 0
sentThisMonth: 0
```

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Criar conta admin@digiurban.com.br
2. ✅ Enviar email de teste
3. ✅ Configurar DNS (DKIM/SPF/DMARC)
4. ✅ Testar recebimento de email
5. ✅ Implementar monitoramento de limites
6. ✅ Implementar reset mensal de contadores

---

## 📞 SUPORTE

Se encontrar erros, verificar:
1. Logs do container: `docker-compose logs -f`
2. Conexão com PostgreSQL: `docker-compose exec postgres psql -U digiurban`
3. Estado das tabelas: `\dt email_*`
4. Dados dos planos: `SELECT * FROM email_plan_configs;`
