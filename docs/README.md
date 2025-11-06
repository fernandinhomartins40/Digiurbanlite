# Documentação Completa - Implementação do Sistema de Serviços DigiUrban

**Data:** 27 de Outubro de 2025
**Versão:** 1.0
**Status:** Pronto para Implementação

---

## 📋 Visão Geral

Este pacote contém a documentação completa para implementação do fluxo de serviços do DigiUrban, desde a criação pelo admin até a solicitação pelo cidadão, com integração total ao motor de protocolos.

### Situação Atual

- ✅ Admin consegue criar serviços (mas configs avançadas não salvam)
- ✅ Cidadão visualiza catálogo de serviços
- ❌ Cidadão NÃO consegue solicitar serviços (toast placeholder)
- ❌ Apenas 1 de 11 secretarias integra com motor de protocolos
- ❌ Sistema de numeração de protocolos inconsistente
- ❌ Campo `serviceType` não existe

### Situação Desejada (Após Implementação)

- ✅ Fluxo completo de solicitação de serviços pelo cidadão
- ✅ Configurações avançadas salvas corretamente em transação
- ✅ Todas 11 secretarias integradas com motor de protocolos
- ✅ Numeração padronizada ({TENANT}-{ANO}-{SEQUENCIAL})
- ✅ Tipagem de serviços (REQUEST, REGISTRATION, CONSULTATION, BOTH)
- ✅ Rastreamento completo de SLA e conclusão de protocolos

---

## 📦 Conteúdo do Pacote

| Arquivo | Descrição | Páginas |
|---------|-----------|---------|
| `RELATORIO_EXECUTIVO.md` | Resumo executivo com findings críticos e métricas | 2 |
| `RELATORIO_TECNICO_COMPLETO.md` | Análise técnica detalhada com código e evidências | 50+ |
| `PLANO_IMPLEMENTACAO.md` | Backlog priorizado, cronograma, deploy e QA | 25 |
| `CASOS_DE_TESTE.md` | 93 casos de teste em Gherkin (BDD) | 30 |
| `MIGRATIONS.sql` | 5 migrações SQL com validações e rollbacks | 15 |
| `README.md` | Este arquivo - instruções de uso | 5 |

---

## 🚀 Como Usar Esta Documentação

### Para Product Owners / Gestores

1. Leia o **RELATORIO_EXECUTIVO.md** (2 páginas)
   - Entenda os 3 problemas críticos
   - Veja as métricas atuais (56% de completude)
   - Aprove as 3 fases de implementação

2. Revise o **PLANO_IMPLEMENTACAO.md**
   - Valide o cronograma de 6 semanas
   - Aprove os recursos necessários (2 backend, 2 frontend, 1 QA, 1 DevOps)
   - Entenda os riscos e mitigações

### Para Tech Leads / Arquitetos

1. Leia o **RELATORIO_TECNICO_COMPLETO.md**
   - Seção 2: Análise de gaps (com evidências de código)
   - Seção 5: Propostas de resolução (código completo)
   - Seção 6: Migrações de banco de dados

2. Revise os **MIGRATIONS.sql**
   - Valide as 5 migrações propostas
   - Verifique impacto em tabelas existentes
   - Teste scripts de rollback

3. Aprove o **PLANO_IMPLEMENTACAO.md**
   - Valide estimativas de esforço (S/M/L)
   - Revise estratégia de deploy
   - Aprove checklist de QA

### Para Desenvolvedores

1. Leia o **RELATORIO_TECNICO_COMPLETO.md** - Seção 5
   - Copie snippets de código prontos para uso
   - Entenda a arquitetura proposta
   - Implemente seguindo os exemplos

2. Use o **PLANO_IMPLEMENTACAO.md** como guia
   - Pegue tarefas do backlog em ordem de prioridade
   - Siga os critérios de aceite de cada tarefa
   - Marque como "Done" após passar em todos critérios

3. Execute as **MIGRATIONS.sql** localmente
   - Rode em seu banco de desenvolvimento primeiro
   - Valide que aplicação funciona após migrações
   - Teste rollback antes de ir para staging

### Para QA / Testers

1. Use o **CASOS_DE_TESTE.md**
   - 93 cenários em Gherkin (BDD)
   - Execute em ordem de prioridade (P0 → P1 → P2)
   - Marque ✅ cada cenário que passar

2. Siga o **PLANO_IMPLEMENTACAO.md** - Seção 5
   - Checklist de QA completo
   - Testes funcionais + não-funcionais
   - Critérios de aceite por epic

### Para DevOps / SRE

1. Leia o **PLANO_IMPLEMENTACAO.md** - Seção 4
   - Estratégia de deploy completa
   - Procedimentos de rollback
   - Scripts de backup e restore

2. Execute as **MIGRATIONS.sql** em staging
   - Siga instruções de uso no final do arquivo
   - Monitore logs durante execução
   - Valide integridade dos dados após migração

---

## 🔧 Setup do Ambiente de Desenvolvimento

### Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL 14+ rodando
- Git configurado
- 10GB de espaço em disco livre

### Instalação

```bash
# 1. Criar branch de desenvolvimento
git checkout -b feature/service-flow-complete

# 2. Instalar dependências
cd digiurban/backend
npm install

cd ../frontend
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local

# Editar .env.local com suas credenciais:
# DATABASE_URL="postgresql://user:pass@localhost:5432/digiurban_dev"
# JWT_SECRET="seu-secret-aqui"
# API_URL="http://localhost:3001"

# 4. Aplicar migrações
cd backend
npx prisma migrate dev

# 5. Popular banco com dados de teste
npx prisma db seed

# 6. Iniciar servidores
npm run dev # backend (porta 3001)

# Em outro terminal:
cd ../frontend
npm run dev # frontend (porta 3000)
```

### Aplicar Migrações SQL

```bash
# 1. Backup do banco local
pg_dump -U postgres -d digiurban_dev > backup_local_$(date +%Y%m%d).sql

# 2. Aplicar migrações
psql -U postgres -d digiurban_dev -f docs/MIGRATIONS.sql

# 3. Validar (você verá logs de sucesso/erro)
# Verificar manualmente:
psql -U postgres -d digiurban_dev

\d "Service"
-- Deve mostrar colunas: serviceType, slaHours, slaDays, slaType

\d "AttendanceHealth"
-- Deve mostrar coluna: protocolId (com FK)

SELECT * FROM "Service" LIMIT 1;
-- Todos registros devem ter serviceType = 'REQUEST'

# 4. Se algo der errado, restaurar backup:
psql -U postgres -d digiurban_dev < backup_local_*.sql
```

---

## 📊 Validação da Implementação

### Checklist Pós-Implementação

Após implementar cada Epic, valide usando este checklist:

#### ✅ Epic 1 - Fluxo de Solicitação (Cidadão)

```bash
# Testes manuais:
1. Acesse http://localhost:3000/cidadao/servicos
2. Clique em "Solicitar" em qualquer serviço
3. Preencha o formulário
4. Envie a solicitação
5. Verifique se:
   - Protocolo foi criado (veja toast de sucesso)
   - Redirecionou para /cidadao/protocolos
   - Protocolo aparece na listagem
   - Número do protocolo segue formato: {TENANT}-{ANO}-{SEQUENCIAL}

# Testes automatizados:
npm run test:e2e -- citizen-service-request.spec.ts

# Validação no banco:
psql -U postgres -d digiurban_dev
SELECT * FROM "Protocol" ORDER BY id DESC LIMIT 1;
-- Deve mostrar protocolo criado com status ABERTO

SELECT * FROM "AttendanceGeneric" WHERE "protocolId" = <id>;
-- Deve mostrar dados do atendimento vinculado
```

#### ✅ Epic 2 - Configurações Avançadas

```bash
# Testes manuais:
1. Acesse http://localhost:3000/admin/servicos/novo
2. Ative "Formulário Personalizado"
3. Configure um schema JSON válido
4. Ative "Requer Localização"
5. Configure raio/polígono
6. Crie o serviço
7. Verifique se:
   - ServiceForm foi criado
   - ServiceLocation foi criado
   - Configs JSON foram salvas corretamente

# Validação no banco:
SELECT
  s.id,
  s.name,
  sf.id as form_id,
  sl.id as location_id
FROM "Service" s
LEFT JOIN "ServiceForm" sf ON sf."serviceId" = s.id
LEFT JOIN "ServiceLocation" sl ON sl."serviceId" = s.id
WHERE s.id = <id do serviço criado>;
-- Todos relacionamentos devem estar populados
```

#### ✅ Epic 3 - Integração com Secretarias

```bash
# Testes manuais para cada secretaria:
1. Acesse http://localhost:3000/admin/secretarias/saude
2. Crie um novo atendimento
3. Verifique se:
   - Protocolo foi criado
   - AttendanceHealth foi criado
   - protocolId está populado e correto
   - Protocolo aparece em /admin/protocolos

# Validação no banco:
SELECT
  p.id,
  p."protocolNumber",
  ah.id as attendance_id,
  ah."protocolId"
FROM "Protocol" p
INNER JOIN "AttendanceHealth" ah ON ah."protocolId" = p.id
WHERE p.id = <id>;
-- JOIN deve funcionar corretamente (FK intacta)

# Repetir para as 10 secretarias
```

#### ✅ Epic 4 - Tipagem de Serviços

```bash
# Validação no banco:
SELECT "serviceType", COUNT(*) as count
FROM "Service"
GROUP BY "serviceType";

-- Resultado esperado:
-- serviceType   | count
-- REQUEST       | 15
-- REGISTRATION  | 3
-- CONSULTATION  | 2
-- BOTH          | 1

# Testes manuais:
1. Crie serviço com tipo REQUEST → botão "Solicitar" aparece
2. Crie serviço com tipo CONSULTATION → botão "Consultar" aparece
3. Crie serviço com tipo BOTH → ambos botões aparecem
```

#### ✅ Epic 5 - Numeração Padronizada

```bash
# Validação no banco:
SELECT "protocolNumber" FROM "Protocol" ORDER BY id DESC LIMIT 10;

-- Resultado esperado:
-- PMSP-2025-000010
-- PMSP-2025-000009
-- PMSP-2025-000008
-- ...
-- Todos seguindo formato {TENANT}-{ANO}-{SEQUENCIAL}

# Teste de concorrência:
# Executar script que cria 100 protocolos simultâneos
node scripts/test-concurrent-protocols.js

# Validar que não há duplicatas:
SELECT "protocolNumber", COUNT(*)
FROM "Protocol"
GROUP BY "protocolNumber"
HAVING COUNT(*) > 1;
-- Deve retornar 0 linhas (sem duplicatas)
```

#### ✅ Epic 6 - Conclusão de Protocolos

```bash
# Testes manuais:
1. Acesse um protocolo em /admin/protocolos/:id
2. Altere status para CONCLUIDO
3. Salve
4. Verifique no banco:

SELECT id, status, "concludedAt"
FROM "Protocol"
WHERE id = <id>;

-- concludedAt deve estar populado com timestamp atual

# Teste de reabertura:
1. Altere status de volta para ABERTO
2. Verifique:

SELECT id, status, "concludedAt"
FROM "Protocol"
WHERE id = <id>;

-- concludedAt deve estar NULL
```

---

## 🧪 Executar Testes Automatizados

### Testes Unitários (Backend)

```bash
cd backend
npm run test:unit

# Executar testes específicos:
npm run test:unit -- protocols.test.ts
npm run test:unit -- services.test.ts
```

### Testes de Integração (Backend)

```bash
npm run test:integration

# Com cobertura:
npm run test:coverage
```

### Testes E2E (Frontend + Backend)

```bash
cd frontend
npm run test:e2e

# Em modo interativo (útil para debug):
npx playwright test --ui

# Gerar relatório:
npx playwright test --reporter=html
```

### Testes de Carga (k6)

```bash
# Instalar k6:
brew install k6  # Mac
# ou baixar de https://k6.io/

# Executar teste de carga:
k6 run tests/load/citizen-service-request.js

# Resultado esperado:
# http_req_duration..........: avg=450ms  p95=800ms  p99=1.2s
# http_req_failed...........: 0.00%
# iterations................: 1000 (100 req/s)
```

---

## 📈 Métricas de Sucesso

### KPIs Técnicos

Após implementação completa, valide estas métricas:

| Métrica | Meta | Como Medir |
|---------|------|------------|
| Taxa de conclusão de solicitações | > 95% | (Protocolos criados / Tentativas) × 100 |
| Tempo de resposta GET /services | < 500ms | New Relic / Datadog |
| Tempo de resposta POST /request | < 2s | New Relic / Datadog |
| Cobertura de testes | > 80% | Jest coverage report |
| Taxa de erro em produção | < 1% | (Erros 5xx / Total) × 100 |

### Queries de Validação

```sql
-- 1. Taxa de conclusão de solicitações
SELECT
  COUNT(*) FILTER (WHERE status = 'CONCLUIDO') * 100.0 / COUNT(*) as taxa_conclusao
FROM "Protocol"
WHERE "createdAt" >= NOW() - INTERVAL '30 days';
-- Meta: > 95%

-- 2. Tempo médio de resolução
SELECT
  AVG(EXTRACT(EPOCH FROM ("concludedAt" - "createdAt"))/86400) as dias_medios
FROM "Protocol"
WHERE status = 'CONCLUIDO'
  AND "createdAt" >= NOW() - INTERVAL '30 days';
-- Meta: < 7 dias

-- 3. Serviços mais solicitados
SELECT
  s.name,
  COUNT(p.id) as total_solicitacoes
FROM "Service" s
LEFT JOIN "Protocol" p ON p."serviceId" = s.id
WHERE p."createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY s.id, s.name
ORDER BY total_solicitacoes DESC
LIMIT 10;

-- 4. Taxa de integração de secretarias
SELECT
  (SELECT COUNT(DISTINCT department) FROM "Service" WHERE "serviceType" = 'REQUEST') * 100.0 / 11 as taxa_integracao;
-- Meta: 100% (11 secretarias)

-- 5. Protocolos atrasados (SLA)
SELECT COUNT(*) as protocolos_atrasados
FROM "Protocol" p
INNER JOIN "Service" s ON s.id = p."serviceId"
WHERE p.status IN ('ABERTO', 'EM_ANDAMENTO')
  AND p."createdAt" + (s."slaDays" || ' days')::INTERVAL < NOW();
-- Meta: < 10% do total
```

---

## 🐛 Troubleshooting

### Problema: Migrações falharam

**Sintomas:**
- Erro ao executar MIGRATIONS.sql
- Tabelas sem colunas esperadas

**Solução:**
```bash
# 1. Verificar logs de erro no psql
# 2. Identificar qual migração falhou
# 3. Executar rollback da migração específica (ver comentários em MIGRATIONS.sql)
# 4. Corrigir dados inconsistentes
# 5. Reexecutar migração
```

### Problema: Protocolo não está sendo criado

**Sintomas:**
- Cidadão envia formulário mas não recebe toast de sucesso
- Erro 500 no console do navegador

**Debug:**
```bash
# 1. Verificar logs do backend
pm2 logs digiurban-backend --lines 100

# 2. Verificar se endpoint existe
curl -X POST http://localhost:3001/api/citizen/services/1/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -H "X-Tenant-ID: pmsp" \
  -d '{"description":"teste"}'

# 3. Verificar se tenant está correto
# 4. Verificar se JWT é válido
# 5. Verificar se service ID existe
```

### Problema: Configurações avançadas não salvam

**Sintomas:**
- Serviço é criado mas ServiceForm está vazio
- ServiceLocation não é criado

**Debug:**
```sql
-- Verificar se transação foi completa
SELECT
  s.id,
  s.name,
  s."hasCustomForm",
  sf.id as form_id
FROM "Service" s
LEFT JOIN "ServiceForm" sf ON sf."serviceId" = s.id
WHERE s."hasCustomForm" = true;

-- Se form_id for NULL, transação falhou
-- Verificar logs do backend para ver erro específico
```

### Problema: Numeração de protocolos duplicada

**Sintomas:**
- Erro de unique constraint ao criar protocolo
- Dois protocolos com mesmo número

**Solução:**
```sql
-- 1. Verificar duplicatas
SELECT "protocolNumber", COUNT(*)
FROM "Protocol"
GROUP BY "protocolNumber"
HAVING COUNT(*) > 1;

-- 2. Renumerar protocolos (manter ordem cronológica)
-- Ver script em backend/scripts/renumber-protocols.ts

-- 3. Garantir que função getNextProtocolNumber() está sendo usada
-- Verificar código em backend/src/utils/protocol-number-generator.ts
```

---

## 📞 Suporte

### Documentação Adicional

- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js Docs:** https://nextjs.org/docs
- **shadcn/ui:** https://ui.shadcn.com/

### Contatos

| Área | Responsável | Email | Slack |
|------|-------------|-------|-------|
| Arquitetura | [Tech Lead] | [email] | #digiurban-dev |
| Backend | [Backend Lead] | [email] | #digiurban-dev |
| Frontend | [Frontend Lead] | [email] | #digiurban-dev |
| QA | [QA Lead] | [email] | #digiurban-qa |
| DevOps | [DevOps] | [email] | #digiurban-infra |

### Reportar Bugs

Abra uma issue no GitHub com:
- **Título:** Descrição curta do problema
- **Descrição:** Passos para reproduzir
- **Ambiente:** Dev/Staging/Produção
- **Logs:** Output de erro (se houver)
- **Esperado vs Atual:** O que deveria acontecer vs o que aconteceu

---

## 📅 Roadmap de Implementação

### Fase 1: Crítico (Semanas 1-3)
- ✅ Epic 1: Fluxo de solicitação pelo cidadão
- ✅ Epic 2: Configurações avançadas

**Marco:** Cidadão consegue solicitar serviços e gerar protocolos

### Fase 2: Integração (Semanas 3-5)
- ✅ Epic 3: Integração das 10 secretarias
- ✅ Epic 4: Tipagem de serviços

**Marco:** Todas secretarias rastreiam protocolos

### Fase 3: Refinamento (Semana 6)
- ✅ Epic 5: Numeração padronizada
- ✅ Epic 6: Conclusão de protocolos
- ✅ Testes E2E completos
- ✅ Deploy em produção

**Marco:** Sistema 100% funcional e testado

---

## 🎯 Critérios de Aceite Global

O projeto está **COMPLETO** quando:

1. ✅ **Funcional:**
   - Cidadão solicita serviço → protocolo é criado
   - Todas 11 secretarias criam protocolos
   - Admin acompanha status e conclui protocolos
   - Numeração é única e padronizada

2. ✅ **Técnico:**
   - Cobertura de testes > 80%
   - Tempo de resposta < 2s
   - Taxa de erro < 1%
   - Todas migrações aplicadas

3. ✅ **Qualidade:**
   - Code review aprovado
   - QA validou manualmente
   - Testes E2E passando
   - Deploy em staging OK

4. ✅ **Documentação:**
   - README atualizado
   - Swagger/OpenAPI atualizado
   - Runbook de deploy criado

---

## 📝 Changelog

### v1.0 (2025-10-27)
- Criação inicial da documentação
- Análise completa do sistema atual
- Propostas de implementação
- Migrações SQL
- Casos de teste (93 cenários)
- Plano de implementação (6 epics)

---

## 📄 Licença

© 2025 DigiUrban - Todos os direitos reservados

---

**Documentação criada por:** Claude (Anthropic)
**Revisão:** [Nome do Tech Lead]
**Aprovação:** [Nome do Product Owner]
**Data:** 27 de Outubro de 2025
