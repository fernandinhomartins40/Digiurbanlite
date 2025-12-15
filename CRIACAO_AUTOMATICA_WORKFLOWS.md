# 🤖 CRIAÇÃO AUTOMATIZADA DE WORKFLOWS - ALINHADA COM SERVIÇOS

## ✅ PROBLEMA RESOLVIDO

**ANTES**: A função `seedModuleWorkflows()` criava workflows com stages genéricas (Novo, Em Análise, Pendente, Aprovado, etc.) que **NÃO estavam alinhadas com os serviços**. Todos os workflows tinham as mesmas 7 etapas independente dos documentos e formulários do serviço.

**AGORA**: A função `createDefaultWorkflows()` **busca cada serviço real** e gera workflows **100% alinhados** com os documentos e formulários definidos no serviço.

---

## 🔄 COMO FUNCIONA AGORA

### **1. Fluxo de Criação Automática**

```
┌─────────────────────────────────────────┐
│  POST /api/workflows/seed-defaults      │
│  (Chamado pelo admin)                   │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  createDefaultWorkflows()               │
│  Busca TODOS os serviços ativos         │
└─────────────────┬───────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │  Para cada serviço  │
        └─────────┬───────────┘
                  │
                  ├──► Verificar se já existe workflow
                  │    ├─► Existe? PULAR
                  │    └─► Não existe? CRIAR
                  │
                  ├──► generateWorkflowFromService(service)
                  │    ├─► Extrair documentos do serviço
                  │    ├─► Extrair campos do formulário
                  │    ├─► Distribuir docs por etapa
                  │    └─► Criar stages alinhadas
                  │
                  └──► createWorkflow(workflowData)
                       └─► Salvar no banco
```

---

## 📋 ESTRUTURA DAS STAGES GERADAS

### **Serviço SEM documentos específicos**

```typescript
SERVIÇO: "Consulta de Notas"
├── Documentos: []
└── Formulário: [matricula, ano_letivo]

WORKFLOW GERADO:
├── Etapa 1: Novo (0 docs, 0 campos)
├── Etapa 2: Análise Documental (0 docs, 2 campos obrigatórios)
├── Etapa 3: Aprovação (0 docs, 2 campos)
└── Etapa 4: Concluído
```

### **Serviço COM documentos básicos**

```typescript
SERVIÇO: "Cartão SUS"
├── Documentos: ["RG/CPF", "Comprovante de Residência"]
└── Formulário: [nome_completo, data_nascimento, telefone]

WORKFLOW GERADO:
├── Etapa 1: Novo (0 docs, 0 campos)
├── Etapa 2: Análise Documental (2 docs: RG/CPF, Comprovante | 2 campos obrigatórios)
├── Etapa 3: Aprovação (2 docs | 3 campos)
└── Etapa 4: Concluído
```

### **Serviço COM documentos técnicos**

```typescript
SERVIÇO: "Licença Ambiental"
├── Documentos: [
│     "RG/CPF",
│     "Comprovante de Residência",
│     "Projeto Técnico",
│     "Laudo Ambiental"
│   ]
└── Formulário: [razao_social, cnpj, atividade, area_total]

WORKFLOW GERADO:
├── Etapa 1: Novo (0 docs, 0 campos)
├── Etapa 2: Análise Documental (2 docs: RG/CPF, Comprovante | campos obrigatórios)
├── Etapa 3: Análise Técnica (2 docs: Projeto, Laudo | todos os campos)
├── Etapa 4: Aprovação Final (TODOS os 4 docs | todos os campos)
└── Etapa 5: Concluído
```

---

## 🎯 LÓGICA DE DISTRIBUIÇÃO DE DOCUMENTOS

A função `generateDefaultWorkflow()` em [workflow-template.service.ts](digiurban/backend/src/services/workflow-template.service.ts:30) implementa uma distribuição inteligente:

### **1. Categorização de Documentos**

```typescript
// Documentos de identidade
const identityDocs = ["RG/CPF", "Identidade", "CPF"]

// Documentos de endereço
const addressDocs = ["Comprovante de Residência", "Comprovante de Endereço"]

// Documentos específicos/técnicos
const otherDocs = Todos os outros documentos
```

### **2. Distribuição por Etapa**

```typescript
Etapa 1: Novo
  - Documentos: NENHUM
  - Campos: NENHUM

Etapa 2: Análise Documental
  - Documentos: identityDocs + addressDocs
  - Campos: Somente campos OBRIGATÓRIOS

SE existir otherDocs:
  Etapa 3: Análise Técnica
    - Documentos: otherDocs
    - Campos: TODOS os campos

  Etapa 4: Aprovação Final
    - Documentos: TODOS
    - Campos: TODOS

SENÃO:
  Etapa 3: Aprovação
    - Documentos: TODOS
    - Campos: TODOS

Etapa Final: Concluído
  - Documentos: NENHUM
  - Campos: NENHUM
```

### **3. SLA por Etapa**

```typescript
const totalSLA = service.estimatedDays || 10

const analysisTime = totalSLA * 0.4  // 40% do tempo
const reviewTime = totalSLA * 0.3    // 30% do tempo
const approvalTime = totalSLA * 0.3  // 30% do tempo
```

**Exemplo**: Serviço com 10 dias de prazo:
- Etapa 1: 1 dia
- Etapa 2: 4 dias (40%)
- Etapa 3: 3 dias (30%)
- Etapa 4: 3 dias (30%)

---

## 🚀 COMO USAR

### **1. Via API (Recomendado)**

```bash
POST http://localhost:3001/api/workflows/seed-defaults
Authorization: Bearer <token-admin>
```

**Resposta**:
```json
{
  "success": true,
  "message": "15 workflows padrão criados com sucesso",
  "data": [
    {
      "moduleType": "CARTAO_SUS",
      "name": "Cartão SUS",
      "stagesCount": 4
    },
    {
      "moduleType": "MATRICULA_ALUNO",
      "name": "Matrícula Escolar",
      "stagesCount": 4
    }
    // ...
  ]
}
```

### **2. Via Frontend**

1. Acesse `/admin/workflows`
2. Clique em "Criar Workflows Padrão"
3. Sistema cria workflows para TODOS os serviços ativos

### **3. Automático na Criação de Serviço**

Quando um novo serviço é criado via `/api/services-simplified`:
- ✅ Se `serviceType === 'COM_DADOS'`
- ✅ Se tem `moduleType` definido
- ✅ Sistema gera workflow automaticamente

---

## 🔍 VALIDAÇÃO E SEGURANÇA

### **Validações Implementadas**

1. **Serviço deve existir e estar ativo**
   ```typescript
   where: {
     isActive: true,
     moduleType: { not: null }
   }
   ```

2. **Não duplicar workflows**
   ```typescript
   const existing = await getWorkflowByModuleType(service.moduleType)
   if (existing) {
     skipped.push(`${service.name} (já existe)`)
     continue
   }
   ```

3. **Validar estrutura do workflow gerado**
   ```typescript
   const validation = validateGeneratedWorkflow(workflowData)
   if (!validation.valid) {
     throw new Error(validation.errors.join(', '))
   }
   ```

---

## 📊 ESTATÍSTICAS E LOGS

Durante a execução, o sistema mostra:

```
🔄 Criando workflows padrão alinhados com serviços...
✅ Cartão SUS - 4 etapas
✅ Matrícula Escolar - 4 etapas
✅ Licença Ambiental - 5 etapas
❌ Serviço Incompleto: sem moduleType

📊 Resultado:
   ✅ Criados: 15
   ⏭️ Ignorados: 3
   ❌ Erros: 1
```

---

## 🎯 EXEMPLOS PRÁTICOS

### **Exemplo 1: Serviço Simples**

**INPUT (Serviço)**:
```json
{
  "name": "Agendamento de Consulta",
  "moduleType": "AGENDAMENTO_CONSULTA",
  "serviceType": "COM_DADOS",
  "estimatedDays": 3,
  "requiredDocuments": [],
  "formFieldsConfig": [
    { "id": "paciente_nome", "label": "Nome do Paciente", "required": true },
    { "id": "data_preferencia", "label": "Data de Preferência", "required": true },
    { "id": "especialidade", "label": "Especialidade", "required": true }
  ]
}
```

**OUTPUT (Workflow Gerado)**:
```json
{
  "moduleType": "AGENDAMENTO_CONSULTA",
  "name": "Agendamento de Consulta",
  "defaultSLA": 3,
  "stages": [
    {
      "name": "Novo",
      "order": 1,
      "slaDays": 1,
      "requiredDocumentTypes": [],
      "requiredFormFieldIds": [],
      "allowedActions": ["APPROVE"]
    },
    {
      "name": "Análise Documental",
      "order": 2,
      "slaDays": 1,
      "requiredDocumentTypes": [],
      "requiredFormFieldIds": ["paciente_nome", "data_preferencia", "especialidade"],
      "allowedActions": ["APPROVE", "REJECT", "CREATE_PENDING"]
    },
    {
      "name": "Aprovação",
      "order": 3,
      "slaDays": 1,
      "requiredDocumentTypes": [],
      "requiredFormFieldIds": ["paciente_nome", "data_preferencia", "especialidade"],
      "allowedActions": ["APPROVE", "REJECT"]
    },
    {
      "name": "Concluído",
      "order": 4,
      "slaDays": 1,
      "requiredDocumentTypes": [],
      "requiredFormFieldIds": [],
      "allowedActions": []
    }
  ]
}
```

### **Exemplo 2: Serviço Complexo**

**INPUT (Serviço)**:
```json
{
  "name": "Alvará de Construção",
  "moduleType": "ALVARA_CONSTRUCAO",
  "serviceType": "COM_DADOS",
  "estimatedDays": 20,
  "requiredDocuments": [
    "RG/CPF",
    "Comprovante de Residência",
    "Escritura do Imóvel",
    "Projeto Arquitetônico",
    "ART do Engenheiro"
  ],
  "formFieldsConfig": [
    { "id": "proprietario", "label": "Proprietário", "required": true },
    { "id": "endereco_obra", "label": "Endereço da Obra", "required": true },
    { "id": "area_construir", "label": "Área a Construir", "required": true },
    { "id": "engenheiro", "label": "Engenheiro Responsável", "required": false }
  ]
}
```

**OUTPUT (Workflow Gerado)**:
```json
{
  "moduleType": "ALVARA_CONSTRUCAO",
  "name": "Alvará de Construção",
  "defaultSLA": 20,
  "stages": [
    {
      "name": "Novo",
      "order": 1,
      "slaDays": 1,
      "requiredDocumentTypes": [],
      "requiredFormFieldIds": []
    },
    {
      "name": "Análise Documental",
      "order": 2,
      "slaDays": 8,
      "requiredDocumentTypes": ["RG/CPF", "Comprovante de Residência"],
      "requiredFormFieldIds": ["proprietario", "endereco_obra", "area_construir"]
    },
    {
      "name": "Análise Técnica",
      "order": 3,
      "slaDays": 6,
      "requiredDocumentTypes": ["Escritura do Imóvel", "Projeto Arquitetônico", "ART do Engenheiro"],
      "requiredFormFieldIds": ["proprietario", "endereco_obra", "area_construir", "engenheiro"]
    },
    {
      "name": "Aprovação Final",
      "order": 4,
      "slaDays": 5,
      "requiredDocumentTypes": ["RG/CPF", "Comprovante de Residência", "Escritura do Imóvel", "Projeto Arquitetônico", "ART do Engenheiro"],
      "requiredFormFieldIds": ["proprietario", "endereco_obra", "area_construir", "engenheiro"]
    },
    {
      "name": "Concluído",
      "order": 5,
      "slaDays": 1,
      "requiredDocumentTypes": [],
      "requiredFormFieldIds": []
    }
  ]
}
```

---

## ✅ BENEFÍCIOS

1. ✅ **100% Alinhado** - Workflows refletem exatamente os documentos e formulários do serviço
2. ✅ **Automação Mantida** - Workflows ainda são criados automaticamente
3. ✅ **Distribuição Inteligente** - Documentos são divididos logicamente por etapa
4. ✅ **SLA Proporcional** - Tempo distribuído proporcionalmente entre etapas
5. ✅ **Validação Completa** - Sistema valida docs e campos antes de aprovar
6. ✅ **Sem Duplicação** - Não cria workflows para serviços que já têm
7. ✅ **Logs Detalhados** - Mostra exatamente o que foi criado/ignorado/erro

---

## 🔧 MANUTENÇÃO

### **Recriar Workflows Existentes**

Se precisar recriar workflows (após mudanças nos serviços):

```sql
-- 1. Deletar workflows antigos
DELETE FROM module_workflows;

-- 2. Chamar endpoint de criação
POST /api/workflows/seed-defaults
```

### **Atualizar Workflow Manualmente**

```bash
PUT http://localhost:3001/api/workflows/CARTAO_SUS
{
  "stages": [
    // Nova estrutura de stages
  ]
}
```

---

## 📝 CONCLUSÃO

A criação automatizada de workflows agora está **completamente alinhada com os serviços**, gerando workflows que:

- ✅ Referenciam documentos do serviço
- ✅ Validam campos do formulário
- ✅ Distribuem requisitos por etapa
- ✅ Mantêm automação e profissionalismo

**Agora o sistema é uma plataforma de digitalização de serviços públicos de verdade!**
