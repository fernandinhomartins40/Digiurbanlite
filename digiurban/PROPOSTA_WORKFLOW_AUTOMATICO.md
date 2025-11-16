# 🔄 PROPOSTA: Criação Automática de Workflows para Novos Serviços

## 📋 Sumário Executivo

**Objetivo:** Automatizar a criação de workflows quando um novo serviço é criado, garantindo que todos os serviços COM_DADOS tenham workflows associados automaticamente.

**Status Atual:** Workflows são criados manualmente ou via seed. Serviços podem existir sem workflows, causando inconsistência.

**Proposta:** Criar workflow automaticamente ao criar serviço COM_DADOS, com validações e fallbacks seguros.

---

## 🔍 Análise do Estado Atual

### Fluxo Atual de Criação de Serviços

```
1. Admin → POST /api/services
2. Validações básicas (nome, departamento, serviceType)
3. Se serviceType = COM_DADOS:
   - Valida presença de moduleType ✅
   - Valida presença de formSchema ✅
4. Cria serviço no banco ✅
5. Retorna sucesso
6. ❌ WORKFLOW NÃO É CRIADO
```

### Fluxo Atual de Criação de Protocolos

```
1. Cidadão → POST /api/protocols-simplified
2. Busca serviço por serviceId
3. Copia moduleType do serviço para protocolo
4. Cria protocolo no banco
5. APÓS criação (linha 145-152 protocol-module.service.ts):
   if (protocol.moduleType) {
     try {
       applyWorkflowToProtocol(protocolId, moduleType)
     } catch {
       // ⚠️ NÃO FALHA - apenas loga erro
     }
   }
```

### ⚠️ Problema Identificado

Se um serviço COM_DADOS é criado com `moduleType = "NOVO_SERVICO_XYZ"` mas **não existe workflow** com esse moduleType:

1. ✅ Serviço é criado com sucesso
2. ✅ Cidadão consegue criar protocolo
3. ❌ Workflow não é aplicado (erro silencioso)
4. ❌ SLA não é criado
5. ❌ Etapas não são criadas
6. ❌ Protocolo fica sem tramitação estruturada

---

## 🎯 Proposta de Solução

### Estratégia: Criação Automática com Template Inteligente

**Princípio:** Ao criar serviço COM_DADOS, criar automaticamente um workflow baseado em template se não existir.

### Opções de Implementação

#### **Opção 1: Criação Automática Obrigatória (RECOMENDADA)**

Criar workflow automaticamente SEMPRE que serviço COM_DADOS é criado.

**Vantagens:**
- ✅ Garante 100% de cobertura
- ✅ Consistência total
- ✅ Sem erros silenciosos
- ✅ SLA sempre definido

**Desvantagens:**
- ⚠️ Pode criar workflows "genéricos" demais
- ⚠️ Admin precisa editar depois para personalizar

**Fluxo:**
```
1. Admin cria serviço COM_DADOS com moduleType="LICENCA_AMBIENTAL"
2. Sistema verifica: existe workflow com esse moduleType?
   - Se SIM: apenas associa (nada muda)
   - Se NÃO: cria workflow automático baseado em template
3. Workflow criado com:
   - moduleType: "LICENCA_AMBIENTAL"
   - name: nome do serviço (ex: "Licença Ambiental")
   - stages: template genérico (5-7 etapas padrão)
   - defaultSLA: estimatedDays do serviço OU 10 dias (padrão)
4. Serviço + Workflow criados com sucesso
5. Admin pode editar workflow depois em /admin/workflows
```

#### **Opção 2: Validação Obrigatória**

Não permite criar serviço COM_DADOS sem workflow existente.

**Vantagens:**
- ✅ Força admin a pensar no workflow antes
- ✅ Workflows mais personalizados
- ✅ Sem workflows "lixo"

**Desvantagens:**
- ❌ UX ruim (precisa criar workflow ANTES do serviço)
- ❌ Quebra fluxo atual de criação
- ❌ Complexidade no wizard

**Descartada por UX ruim**

#### **Opção 3: Criação Opcional com Wizard**

Adicionar etapa no wizard de criação de serviços perguntando se deseja criar workflow.

**Vantagens:**
- ✅ Flexibilidade
- ✅ Admin decide

**Desvantagens:**
- ⚠️ Admin pode pular e esquecer
- ⚠️ Inconsistência continua

**Descartada por não resolver problema**

---

## 🏗️ Implementação Recomendada (Opção 1)

### 1. Template de Workflow Padrão

Criar função que gera workflow genérico baseado no serviço:

```typescript
// backend/src/services/workflow-template.service.ts

export interface GenerateWorkflowFromServiceInput {
  moduleType: string
  serviceName: string
  serviceDescription?: string
  estimatedDays?: number
  departmentName?: string
}

export function generateDefaultWorkflow(input: GenerateWorkflowFromServiceInput) {
  const {
    moduleType,
    serviceName,
    serviceDescription,
    estimatedDays,
    departmentName
  } = input

  // Calcular SLA total (padrão: estimatedDays ou 10 dias)
  const totalSLA = estimatedDays || 10

  // Calcular SLA por etapa (distribuído proporcionalmente)
  const slaPerStage = Math.ceil(totalSLA / 5)

  return {
    moduleType,
    name: serviceName,
    description: serviceDescription || `Workflow automático para ${serviceName}`,
    defaultSLA: totalSLA,
    stages: [
      {
        name: 'Novo',
        order: 1,
        slaDays: 1,
        requiredDocuments: [],
        requiredActions: [],
        canSkip: false
      },
      {
        name: 'Em Análise',
        order: 2,
        slaDays: slaPerStage * 2, // Maior parte do tempo
        requiredDocuments: [],
        requiredActions: ['analisar_documentacao'],
        canSkip: false
      },
      {
        name: 'Pendente',
        order: 3,
        slaDays: slaPerStage,
        requiredDocuments: [],
        requiredActions: [],
        canSkip: true,
        skipCondition: 'Documentação completa'
      },
      {
        name: 'Aprovado',
        order: 4,
        slaDays: slaPerStage,
        requiredDocuments: [],
        requiredActions: ['emitir_parecer'],
        canSkip: false
      },
      {
        name: 'Concluído',
        order: 5,
        slaDays: 1,
        requiredDocuments: [],
        requiredActions: [],
        canSkip: false
      }
    ],
    rules: {
      autoGenerated: true,
      generatedAt: new Date().toISOString(),
      source: 'service_creation',
      canBeDeleted: true,
      needsReview: true
    }
  }
}
```

### 2. Modificar Rota de Criação de Serviços

**Arquivo:** `backend/src/routes/services.ts` (linha 153-277)

**Mudanças:**

```typescript
// ANTES (linha 232-261):
const service = await prisma.serviceSimplified.create({
  data: {
    name,
    description: description || null,
    // ... outros campos
    moduleType: serviceType === 'COM_DADOS' ? moduleType : null,
    formSchema: serviceType === 'COM_DADOS' ? formSchema : null
  },
  include: { department: true }
})

return res.status(201).json({
  message: 'Serviço criado com sucesso',
  service,
  serviceType: service.serviceType,
  hasDataCapture: service.serviceType === 'COM_DADOS',
  moduleType: service.moduleType
})
```

**DEPOIS:**

```typescript
// Criar serviço em transação
const result = await prisma.$transaction(async (tx) => {
  // 1. Criar serviço
  const service = await tx.serviceSimplified.create({
    data: {
      name,
      description: description || null,
      // ... outros campos
      moduleType: serviceType === 'COM_DADOS' ? moduleType : null,
      formSchema: serviceType === 'COM_DADOS' ? formSchema : null
    },
    include: { department: true }
  })

  // 2. Se COM_DADOS, verificar/criar workflow
  let workflow = null
  let workflowCreated = false

  if (serviceType === 'COM_DADOS' && moduleType) {
    // Verificar se workflow já existe
    workflow = await tx.moduleWorkflow.findUnique({
      where: { moduleType }
    })

    // Se não existe, criar automaticamente
    if (!workflow) {
      const workflowTemplate = generateDefaultWorkflow({
        moduleType,
        serviceName: name,
        serviceDescription: description,
        estimatedDays,
        departmentName: department.name
      })

      workflow = await tx.moduleWorkflow.create({
        data: workflowTemplate
      })

      workflowCreated = true
      console.log(`✅ Workflow automático criado: ${moduleType}`)
    } else {
      console.log(`ℹ️ Workflow já existe: ${moduleType}`)
    }
  }

  return { service, workflow, workflowCreated }
})

return res.status(201).json({
  message: workflowCreated
    ? 'Serviço e workflow criados com sucesso'
    : 'Serviço criado com sucesso',
  service: result.service,
  workflow: result.workflow,
  workflowCreated: result.workflowCreated,
  serviceType: result.service.serviceType,
  hasDataCapture: result.service.serviceType === 'COM_DADOS',
  moduleType: result.service.moduleType
})
```

### 3. Adicionar Validação na Atualização de Serviços

**Arquivo:** `backend/src/routes/services.ts` (PUT /:id)

Se admin alterar `moduleType` de um serviço:
- Verificar se novo moduleType tem workflow
- Se não, criar automaticamente
- Avisar admin que workflow foi criado

### 4. Indicador Visual no Frontend

**Arquivo:** `frontend/app/admin/servicos/page.tsx`

Adicionar badge nos serviços indicando se tem workflow:

```tsx
{service.serviceType === 'COM_DADOS' && (
  <Badge variant={hasWorkflow ? 'success' : 'warning'}>
    {hasWorkflow ? '✅ Com Workflow' : '⚠️ Sem Workflow'}
  </Badge>
)}
```

### 5. Link Direto para Editar Workflow

Adicionar botão nos detalhes do serviço:

```tsx
{service.moduleType && (
  <Button
    variant="outline"
    onClick={() => router.push(`/admin/workflows?filter=${service.moduleType}`)}
  >
    ⚙️ Editar Workflow
  </Button>
)}
```

---

## 🛡️ Segurança e Validações

### 1. Evitar Duplicação

```typescript
// Usar upsert ao invés de create
const workflow = await tx.moduleWorkflow.upsert({
  where: { moduleType },
  create: workflowTemplate,
  update: {} // Não atualiza se já existe
})
```

### 2. Validação de moduleType Único

```typescript
// Antes de criar serviço, verificar se moduleType já está em uso
if (serviceType === 'COM_DADOS' && moduleType) {
  const existingService = await prisma.serviceSimplified.findFirst({
    where: {
      moduleType,
      id: { not: serviceId } // Excluir próprio serviço (para update)
    }
  })

  if (existingService) {
    return res.status(400).json({
      error: 'Bad request',
      message: `moduleType "${moduleType}" já está em uso pelo serviço "${existingService.name}"`
    })
  }
}
```

### 3. Rollback em Caso de Erro

Usar transação para garantir atomicidade:
- Se criar serviço falhar → nada criado
- Se criar workflow falhar → serviço também não criado
- Tudo ou nada

### 4. Log de Auditoria

```typescript
// Registrar criação automática de workflow
await tx.auditLog.create({
  data: {
    userId: authReq.userId,
    action: 'WORKFLOW_AUTO_CREATED',
    entityType: 'ModuleWorkflow',
    entityId: workflow.id,
    details: {
      moduleType,
      serviceName: name,
      trigger: 'service_creation',
      needsReview: true
    }
  }
})
```

---

## 📊 Cenários de Teste

### Cenário 1: Criar Serviço COM_DADOS Novo

**Input:**
```json
{
  "name": "Licença para Evento",
  "serviceType": "COM_DADOS",
  "moduleType": "LICENCA_EVENTO",
  "departmentId": "abc123",
  "estimatedDays": 15
}
```

**Esperado:**
- ✅ Serviço criado
- ✅ Workflow criado automaticamente
- ✅ Workflow tem 5 etapas padrão
- ✅ defaultSLA = 15 dias
- ✅ Resposta indica `workflowCreated: true`

### Cenário 2: Criar Serviço COM_DADOS com Workflow Existente

**Input:**
```json
{
  "name": "Atendimento Médico Especial",
  "serviceType": "COM_DADOS",
  "moduleType": "ATENDIMENTOS_SAUDE", // Já existe no seed
  "departmentId": "abc123"
}
```

**Esperado:**
- ✅ Serviço criado
- ✅ Workflow NÃO criado (já existe)
- ✅ Serviço associado ao workflow existente
- ✅ Resposta indica `workflowCreated: false`

### Cenário 3: Criar Serviço SEM_DADOS

**Input:**
```json
{
  "name": "Informação sobre IPTU",
  "serviceType": "SEM_DADOS",
  "departmentId": "abc123"
}
```

**Esperado:**
- ✅ Serviço criado
- ✅ Workflow NÃO criado (não é COM_DADOS)
- ✅ moduleType = null

### Cenário 4: Criar Serviço com moduleType Duplicado

**Input:**
```json
{
  "name": "Outro serviço",
  "serviceType": "COM_DADOS",
  "moduleType": "MATRICULA_ALUNO", // Já usado por outro serviço
  "departmentId": "abc123"
}
```

**Esperado:**
- ❌ Erro 400
- ❌ Mensagem: "moduleType já está em uso"
- ❌ Nada criado

### Cenário 5: Protocolo com Workflow Auto-Criado

**Setup:**
1. Criar serviço COM_DADOS → workflow auto-criado
2. Cidadão cria protocolo desse serviço

**Esperado:**
- ✅ Protocolo criado
- ✅ Workflow aplicado (5 etapas criadas)
- ✅ SLA criado (15 dias)
- ✅ Protocolo.status = VINCULADO
- ✅ ProtocolStage[0].status = PENDING

---

## 🔄 Migração de Dados Existentes

### Script de Migração

Para serviços COM_DADOS que não têm workflow:

```typescript
// backend/src/scripts/create-missing-workflows.ts

async function createMissingWorkflows() {
  // Buscar serviços COM_DADOS
  const servicesComDados = await prisma.serviceSimplified.findMany({
    where: {
      serviceType: 'COM_DADOS',
      moduleType: { not: null }
    },
    include: { department: true }
  })

  console.log(`📊 Encontrados ${servicesComDados.length} serviços COM_DADOS`)

  let created = 0
  let skipped = 0

  for (const service of servicesComDados) {
    // Verificar se workflow existe
    const workflow = await prisma.moduleWorkflow.findUnique({
      where: { moduleType: service.moduleType! }
    })

    if (workflow) {
      console.log(`⏭️ Workflow já existe: ${service.moduleType}`)
      skipped++
      continue
    }

    // Criar workflow automático
    const workflowTemplate = generateDefaultWorkflow({
      moduleType: service.moduleType!,
      serviceName: service.name,
      serviceDescription: service.description,
      estimatedDays: service.estimatedDays,
      departmentName: service.department.name
    })

    await prisma.moduleWorkflow.create({
      data: workflowTemplate
    })

    console.log(`✅ Workflow criado: ${service.moduleType}`)
    created++
  }

  console.log(`\n📈 Resumo:`)
  console.log(`   Criados: ${created}`)
  console.log(`   Pulados: ${skipped}`)
  console.log(`   Total: ${servicesComDados.length}`)
}
```

---

## 📋 Checklist de Implementação

### Fase 1: Preparação (Sem Quebrar)
- [ ] Criar `workflow-template.service.ts` com função `generateDefaultWorkflow()`
- [ ] Adicionar testes unitários para geração de template
- [ ] Criar script de migração `create-missing-workflows.ts`
- [ ] Testar script em ambiente de desenvolvimento

### Fase 2: Backend (Com Feature Flag)
- [ ] Adicionar variável de ambiente `AUTO_CREATE_WORKFLOWS=true|false`
- [ ] Modificar POST `/api/services` com lógica condicional
- [ ] Adicionar validação de moduleType duplicado
- [ ] Adicionar logs de auditoria
- [ ] Testes de integração para todos os cenários

### Fase 3: Frontend (Indicadores)
- [ ] Adicionar badge "Com/Sem Workflow" na listagem de serviços
- [ ] Adicionar botão "Editar Workflow" nos detalhes do serviço
- [ ] Toast notification quando workflow é auto-criado
- [ ] Documentação no modal de ajuda

### Fase 4: Ativação
- [ ] Executar script de migração em produção
- [ ] Ativar `AUTO_CREATE_WORKFLOWS=true`
- [ ] Monitorar logs por 7 dias
- [ ] Revisar workflows auto-criados e ajustar templates se necessário

---

## ⚠️ Riscos e Mitigações

### Risco 1: Workflows Genéricos Demais

**Impacto:** Admin precisa editar todos os workflows criados

**Mitigação:**
- Templates baseados em tipo de departamento
- Flag `needsReview: true` para indicar que precisa revisão
- Dashboard mostrando workflows que precisam revisão

### Risco 2: Performance em Criação de Serviços

**Impacto:** POST /api/services fica mais lento

**Mitigação:**
- Workflow criado em transação (rápido)
- Média de 50-100ms a mais
- Aceitável para operação administrativa

### Risco 3: Conflito de moduleType

**Impacto:** Dois admins criam serviços com mesmo moduleType simultaneamente

**Mitigação:**
- Constraint UNIQUE no banco (moduleType)
- Erro claro ao usuário
- Sugerir moduleType alternativo

### Risco 4: Quebra de Serviços Existentes

**Impacto:** Serviços antigos param de funcionar

**Mitigação:**
- Feature flag `AUTO_CREATE_WORKFLOWS`
- Rollout gradual
- Script de migração testado
- Rollback fácil (desativar flag)

---

## 📈 Benefícios Esperados

### Quantitativos
- ✅ 100% dos serviços COM_DADOS terão workflows
- ✅ 0% de protocolos sem tramitação
- ✅ Redução de 90% em erros silenciosos
- ✅ Tempo de setup de novo serviço: -50%

### Qualitativos
- ✅ Consistência total entre serviços e workflows
- ✅ UX melhor para admins (menos passos)
- ✅ Menos suporte necessário
- ✅ Sistema mais intuitivo

---

## 🎯 Recomendação Final

**IMPLEMENTAR Opção 1 com Feature Flag**

**Justificativa:**
1. ✅ Resolve 100% do problema de inconsistência
2. ✅ Não quebra nada (transação + rollback)
3. ✅ Melhora UX significativamente
4. ✅ Implementação simples e segura
5. ✅ Fácil rollback se necessário

**Tempo Estimado:**
- Fase 1: 4 horas
- Fase 2: 8 horas
- Fase 3: 4 horas
- Fase 4: 2 horas
- **Total: 18 horas (~2-3 dias)**

**Prioridade:** **ALTA** - Previne erros em produção

---

## 📞 Próximos Passos

**Aguardando aprovação para:**
1. Começar implementação
2. Definir templates de workflow por departamento
3. Escolher data para rollout em produção

**Perguntas para o usuário:**
- Aprovar esta proposta?
- Algum ajuste necessário nos templates?
- Quais departamentos têm fluxos mais específicos?
- Data ideal para implementação?

---

**Documento preparado em:** 2025-11-16
**Versão:** 1.0
**Status:** Aguardando aprovação
