# 🏷️ Sistema de Categorização de Cidadãos V2.0 - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Novos Recursos](#novos-recursos)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [API Reference](#api-reference)
6. [Migrations e Setup](#migrations-e-setup)
7. [Jobs Automáticos](#jobs-automáticos)
8. [Casos de Uso Completos](#casos-de-uso-completos)

---

## 🎯 Visão Geral

O Sistema de Categorização V2.0 é uma **expansão completa e robusta** do sistema original, adicionando:

### ✅ Recursos Implementados

- ✅ **Histórico Completo de Protocolos**: Rastreamento de todos os protocolos que geraram/modificaram categorias
- ✅ **Relacionamentos entre Categorias**: Hierarquia, pré-requisitos, complementares, conflitantes
- ✅ **Sistema de Progressão**: Evolução automática entre níveis de categorias
- ✅ **Validade e Renovação**: Categorias com data de expiração e processo de renovação
- ✅ **Sistema de Badges**: Conquistas e gamificação
- ✅ **Auditoria Completa**: Log de todas as mudanças de estado
- ✅ **Validações Inteligentes**: Verificação automática de pré-requisitos e conflitos
- ✅ **Jobs Automáticos**: Processos periódicos para manutenção
- ✅ **API Completa**: Rotas para gerenciar todo o sistema

---

## 🏗️ Arquitetura

### Estrutura de Dados

```
CitizenCategory (Categoria Base)
├── Campos Básicos (código, nome, descrição, etc)
├── Relacionamentos
│   ├── parentCategoryId → Hierarquia
│   ├── prerequisiteCategories → Pré-requisitos
│   ├── complementaryCategories → Complementares
│   └── conflictingCategories → Conflitantes
├── Validade
│   ├── hasValidity
│   ├── validityDays
│   ├── requiresRenewal
│   └── autoDeactivateOnExpiry
├── Progressão
│   ├── hasProgression
│   ├── nextLevelCategory
│   └── progressionCriteria
└── Metadata Avançada

CitizenCategoryAssignment (Atribuição ao Cidadão)
├── Campos Básicos
├── Validade
│   ├── validFrom / validUntil
│   ├── expiresAt
│   ├── isExpired
│   └── renewalCount
├── Progressão
│   ├── level
│   ├── experiencePoints (XP)
│   ├── badges (conquistas)
│   └── achievements
├── Estatísticas
│   ├── protocolCount
│   ├── lastProtocolDate
│   └── statistics
└── Auditoria
    ├── activationCount
    ├── deactivationCount
    └── notes

CitizenCategoryProtocolHistory (Histórico)
└── Registra TODOS os protocolos relacionados à categoria

CitizenCategoryAuditLog (Auditoria)
└── Log completo de todas as ações (ativar, desativar, renovar, etc)

CitizenCategoryRelationship (Relacionamentos)
└── Relacionamentos explícitos entre categorias

CitizenCategoryBadge (Badges)
└── Conquistas disponíveis para cada categoria
```

---

## 🆕 Novos Recursos

### 1. Histórico de Protocolos

**Problema Anterior:**
```typescript
// ❌ ANTES: Guardava apenas 1 protocolo
{
  protocolId: "PROT-002" // Sobrescrevia o anterior!
}
```

**Solução Atual:**
```typescript
// ✅ AGORA: Histórico completo
{
  protocolHistory: [
    {
      protocolId: "PROT-001",
      eventType: "ASSIGNED",
      eventDate: "2024-01-15",
      serviceName: "Cadastro de Produtor"
    },
    {
      protocolId: "PROT-002",
      eventType: "RENEWED",
      eventDate: "2024-02-10",
      serviceName: "Cadastro de Propriedade"
    },
    {
      protocolId: "PROT-003",
      eventType: "RENEWED",
      eventDate: "2024-03-20",
      serviceName: "Inscrição em Programa Rural"
    }
  ],
  protocolCount: 3,
  lastProtocolDate: "2024-03-20"
}
```

### 2. Relacionamentos entre Categorias

#### Tipos de Relacionamentos

**PARENT/CHILD** - Hierarquia
```typescript
PRODUTOR_RURAL (nível 1)
  └── PRODUTOR_RURAL_ATIVO (nível 2)
      └── PRODUTOR_RURAL_DESTAQUE (nível 3)
```

**PREREQUISITE** - Pré-requisito
```typescript
// Para se tornar GUIA_TURISTICO, precisa ser PRESTADOR_SERVICO_TURISTICO
GUIA_TURISTICO {
  prerequisiteCategories: ["PRESTADOR_SERVICO_TURISTICO"]
}
```

**COMPLEMENTARY** - Complementar
```typescript
// PRODUTOR_RURAL sugere PROPRIETARIO_RURAL
PRODUTOR_RURAL {
  complementaryCategories: ["PROPRIETARIO_RURAL", "BENEFICIARIO_PROGRAMA_RURAL"]
}
```

**CONFLICTING** - Conflitante
```typescript
// Categorias mutuamente exclusivas
CATEGORIA_A {
  conflictingCategories: ["CATEGORIA_B"]
}
```

### 3. Sistema de Progressão

**Exemplo: Evolução do Produtor Rural**

```typescript
// Nível 1: Produtor Rural (inicial)
PRODUTOR_RURAL {
  level: 1,
  hasProgression: true,
  nextLevelCategory: "PRODUTOR_RURAL_ATIVO",
  progressionCriteria: {
    minProtocolCount: 3,
    minDaysActive: 90,
    description: "Complete 3 serviços e mantenha cadastro por 90 dias"
  }
}

// Nível 2: Produtor Rural Ativo
PRODUTOR_RURAL_ATIVO {
  level: 2,
  hasProgression: true,
  nextLevelCategory: "PRODUTOR_RURAL_DESTAQUE",
  progressionCriteria: {
    minProtocolCount: 10,
    minExperiencePoints: 500,
    minDaysActive: 365,
    requiredBadges: ["VETERANO"]
  }
}

// Nível 3: Produtor Rural Destaque (máximo)
PRODUTOR_RURAL_DESTAQUE {
  level: 3,
  hasProgression: false // Nível máximo
}
```

**Sistema de Experiência (XP):**
- +10 XP por protocolo concluído
- +50 XP por badge conquistado
- +100 XP por progressão de nível

### 4. Validade e Renovação

**Exemplo: Licença Ambiental**

```typescript
LICENCIADO_AMBIENTAL {
  hasValidity: true,
  validityDays: 730, // 2 anos
  requiresRenewal: true,
  renewalReminderDays: 60, // Avisar 60 dias antes
  autoDeactivateOnExpiry: true // Desativar automaticamente ao expirar
}

// Atribuição do cidadão
{
  categoryId: "LICENCIADO_AMBIENTAL",
  assignedAt: "2024-01-01",
  expiresAt: "2026-01-01", // 2 anos depois
  isExpired: false,
  renewalCount: 0
}

// Após 2 anos (job automático marca como expirado)
{
  isExpired: true,
  active: false, // Desativada automaticamente
  deactivationReason: "Categoria expirada automaticamente"
}
```

### 5. Sistema de Badges

**Badges Automáticos:**
```typescript
// Badge "Primeiro Passo"
{
  code: "PRIMEIRO_CADASTRO",
  name: "Primeiro Passo",
  description: "Completou o primeiro cadastro como produtor rural",
  requiredProtocolCount: 1,
  criteria: { type: "automatic", triggerOn: "firstProtocol" }
}

// Badge "Veterano do Campo"
{
  code: "VETERANO",
  name: "Veterano do Campo",
  description: "Cadastrado há mais de 1 ano",
  requiredDays: 365,
  criteria: { type: "daysActive", minDays: 365 }
}
```

**Badges Manuais:**
```typescript
// Badge que requer aprovação administrativa
{
  code: "APRESENTACAO_PUBLICA",
  name: "Primeira Apresentação",
  description: "Realizou primeira apresentação pública registrada",
  criteria: { type: "manual", requiresApproval: true }
}
```

---

## 💡 Exemplos de Uso

### Caso 1: Produtor Rural Completo

**Situação:** João é produtor rural e quer cadastrar sua propriedade

```typescript
// 1. João já possui categoria PRODUTOR_RURAL
{
  categoryCode: "PRODUTOR_RURAL",
  assignedAt: "2024-01-15",
  protocolCount: 1,
  experiencePoints: 10,
  badges: [{ code: "PRIMEIRO_CADASTRO", earnedAt: "2024-01-15" }]
}

// 2. João solicita "Cadastro de Propriedade Rural" (protocolo PROT-002)
// Sistema processa:

// 2a. Verifica que PROPRIETARIO_RURAL é acionada por CADASTRO_PROPRIEDADE_RURAL
const categories = await getCategoriesByModuleType("CADASTRO_PROPRIEDADE_RURAL");
// Resultado: [PROPRIETARIO_RURAL]

// 2b. Verifica se João já possui PROPRIETARIO_RURAL
const existing = await findAssignment(joaoId, "PROPRIETARIO_RURAL");
// Resultado: null (não possui)

// 2c. Valida se pode atribuir (pré-requisitos, conflitos, etc)
const validation = await validateCategoryAssignment(joaoId, "PROPRIETARIO_RURAL");
// Resultado: { isValid: true, violations: [], warnings: [] }

// 2d. Cria nova categoria PROPRIETARIO_RURAL
const newAssignment = await createAssignment({
  citizenId: joaoId,
  categoryId: "PROPRIETARIO_RURAL",
  protocolId: "PROT-002",
  experiencePoints: 10
});

// 2e. Adiciona PROT-002 ao histórico de PRODUTOR_RURAL (que João JÁ POSSUI)
await addProtocolToHistory({
  assignmentId: joaoProduterAssignment.id,
  protocolId: "PROT-002",
  eventType: "RENEWED"
});

// 2f. Atualiza contadores de PRODUTOR_RURAL
await updateAssignment(joaoProduterAssignment.id, {
  protocolCount: 2, // +1
  lastProtocolDate: new Date(),
  experiencePoints: 20 // +10
});

// 2g. Verifica badges automáticos
await checkAndAwardAutomaticBadges(joaoProduterAssignment.id);
// Se João completou 5 protocolos, ganha badge "CINCO_SERVICOS"

// 2h. Verifica progressão
const progression = await checkProgression(joaoProduterAssignment.id);
if (progression.canProgress) {
  await applyProgression(joaoProduterAssignment.id);
  // João evolui de PRODUTOR_RURAL para PRODUTOR_RURAL_ATIVO
}

// RESULTADO FINAL:
{
  categories: [
    {
      code: "PRODUTOR_RURAL",
      protocolHistory: [
        { protocolId: "PROT-001", eventType: "ASSIGNED", date: "2024-01-15" },
        { protocolId: "PROT-002", eventType: "RENEWED", date: "2024-02-10" }
      ],
      protocolCount: 2,
      experiencePoints: 20,
      badges: ["PRIMEIRO_CADASTRO"]
    },
    {
      code: "PROPRIETARIO_RURAL",
      protocolHistory: [
        { protocolId: "PROT-002", eventType: "ASSIGNED", date: "2024-02-10" }
      ],
      protocolCount: 1,
      experiencePoints: 10,
      badges: []
    }
  ]
}
```

---

## 📡 API Reference

### Rotas Públicas/Cidadão

#### GET `/api/citizen-categories-expanded/my-categories`
Busca categorias do cidadão autenticado

**Response:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "assignment-123",
      "category": {
        "code": "PRODUTOR_RURAL",
        "name": "Produtor Rural"
      },
      "assignedAt": "2024-01-15",
      "protocolCount": 5,
      "experiencePoints": 150,
      "level": 2,
      "badges": [...],
      "canProgress": true,
      "nextCategory": { "code": "PRODUTOR_RURAL_DESTAQUE" },
      "protocolHistory": [...],
      "auditLog": [...]
    }
  ]
}
```

#### GET `/api/citizen-categories-expanded/suggestions`
Sugere categorias baseadas no perfil

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "type": "UPGRADE",
      "category": {
        "code": "PRODUTOR_RURAL_ATIVO",
        "name": "Produtor Rural Ativo"
      },
      "fromCategory": "PRODUTOR_RURAL",
      "canAssign": true,
      "blockers": []
    },
    {
      "type": "COMPLEMENTARY",
      "category": {
        "code": "BENEFICIARIO_PROGRAMA_RURAL"
      },
      "relatedTo": "PRODUTOR_RURAL",
      "canAssign": true
    }
  ]
}
```

#### POST `/api/citizen-categories-expanded/category/:assignmentId/renew`
Renova uma categoria expirada

### Rotas Administrativas

#### GET `/api/citizen-categories-expanded/admin/expiring?days=30`
Lista categorias expirando em X dias

#### POST `/api/citizen-categories-expanded/admin/check-expired`
Executa verificação manual de expirados

#### POST `/api/citizen-categories-expanded/admin/category/:assignmentId/award-badge`
Atribui badge manualmente

**Body:**
```json
{
  "badgeCode": "APRESENTACAO_PUBLICA",
  "reason": "Apresentação no evento municipal"
}
```

#### GET `/api/citizen-categories-expanded/admin/citizen/:citizenId/full-profile`
Perfil completo com estatísticas

---

## 🔧 Migrations e Setup

### 1. Executar Migration

```bash
# Rodar migration SQL
npm run prisma:migrate

# Ou aplicar migration manualmente
psql -U postgres -d digiurban < prisma/migrations/20260127000000_expand_citizen_categories/migration.sql
```

### 2. Gerar Cliente Prisma

```bash
npm run prisma:generate
```

### 3. Executar Seeds

```bash
# Seed de categorias expandidas
npx ts-node prisma/seeds/citizen-categories-expanded.seed.ts

# Seed de badges
npx ts-node prisma/seeds/citizen-category-badges.seed.ts
```

---

## ⚙️ Jobs Automáticos

### Job de Manutenção (Recomendado: Diário)

```bash
# Executar manualmente
npx ts-node src/jobs/check-expired-categories.job.ts

# Ou programar com cron (Linux)
# Adicionar ao crontab: 0 2 * * * cd /path/to/project && npx ts-node src/jobs/check-expired-categories.job.ts

# Ou com node-cron (package.json)
npm install node-cron
```

**O que o job faz:**
1. ✅ Marca categorias expiradas
2. ✅ Desativa automaticamente (se configurado)
3. ✅ Envia lembretes de renovação (30 dias antes)
4. ✅ Verifica progressão automática
5. ✅ Aplica badges automáticos

---

## 🎓 Casos de Uso Completos

### Caso 1: Licença Ambiental com Renovação

```typescript
// Categoria configurada
{
  code: "LICENCIADO_AMBIENTAL",
  hasValidity: true,
  validityDays: 730,
  requiresRenewal: true,
  autoDeactivateOnExpiry: true
}

// Timeline:
// Dia 0: Cidadão solicita licença
// → Sistema cria assignment com expiresAt = hoje + 730 dias

// Dia 670: Job automático detecta vencimento em 60 dias
// → Envia notificação: "Sua licença expira em 60 dias"

// Dia 700: Job envia novo lembrete
// → "Sua licença expira em 30 dias"

// Dia 730: Job marca como expirado
// → isExpired = true
// → active = false (autoDeactivateOnExpiry)
// → Cidadão perde a categoria

// Cidadão renova:
POST /api/citizen-categories-expanded/category/assignment-123/renew
// → isExpired = false
// → active = true
// → expiresAt = hoje + 730 dias
// → renewalCount = 1
```

### Caso 2: Progressão Automática

```typescript
// João é PRODUTOR_RURAL
// Critérios para evoluir: 3 protocolos + 90 dias

// Dia 1: João completa protocolo 1
// → protocolCount = 1

// Dia 30: João completa protocolo 2
// → protocolCount = 2

// Dia 91: João completa protocolo 3
// → protocolCount = 3
// → daysActive = 91
// → Job automático detecta: PODE PROGREDIR!
// → Cria nova categoria PRODUTOR_RURAL_ATIVO
// → Desativa PRODUTOR_RURAL
// → Envia notificação: "Parabéns! Você evoluiu!"
```

---

## 🚀 Benefícios do Sistema V2.0

### Para o Cidadão
- ✅ Histórico completo de serviços utilizados
- ✅ Gamificação com badges e conquistas
- ✅ Progressão clara de evolução
- ✅ Lembretes automáticos de renovação
- ✅ Visibilidade de benefícios por categoria

### Para a Administração
- ✅ Rastreabilidade completa de todas categorias
- ✅ Estatísticas detalhadas por categoria
- ✅ Validações automáticas de pré-requisitos
- ✅ Gestão automatizada de validade
- ✅ Auditoria completa de mudanças
- ✅ Sugestões inteligentes de categorias

### Para o Sistema
- ✅ Zero duplicação de protocolos
- ✅ Integridade referencial garantida
- ✅ Performance otimizada com índices
- ✅ Escalabilidade para milhares de cidadãos
- ✅ Manutenção automatizada via jobs

---

## 📊 Estatísticas e Métricas

O sistema fornece métricas detalhadas:

```sql
-- View automática: citizen_category_statistics
SELECT * FROM citizen_category_statistics;

-- Resultado:
categoryId | code | name | totalCitizens | activeCitizens | avgProtocols | totalProtocols
-----------|------|------|---------------|----------------|--------------|---------------
123-abc    | PROD | Prod | 1.250         | 1.180          | 3.5          | 4.375
```

---

## 🎯 Conclusão

O Sistema de Categorização V2.0 transforma completamente a forma como o município gerencia e acompanha seus cidadãos, oferecendo:

- **Rastreabilidade Total**: Histórico completo de todas interações
- **Inteligência**: Validações e sugestões automáticas
- **Engajamento**: Gamificação e progressão
- **Automação**: Jobs reduzem trabalho manual
- **Escalabilidade**: Preparado para crescimento

Sistema **100% funcional e pronto para produção**! 🚀
