# Sistema de Fluxos Programados - DigiBot

## 📋 Visão Geral

O **Sistema de Fluxos Programados** é uma arquitetura conversacional baseada em fluxos determinísticos que substitui o sistema anterior dependente de IA (Ollama/GPT) por fluxos completamente programáveis e previsíveis.

### 🎯 Objetivos

- ✅ **Previsibilidade 100%**: Comportamento determinístico, sem dependência de IA
- ✅ **Performance**: Respostas instantâneas (milissegundos vs 30-40s)
- ✅ **Customização**: Fluxos personalizáveis por município via JSON/interface visual
- ✅ **Escalabilidade**: Adicionar novos fluxos sem código
- ✅ **Manutenibilidade**: Fluxos em JSON, fácil de editar e versionar
- ✅ **Cobertura Completa**: Todos os recursos do painel do cidadão acessíveis via bot

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    FlowEngine (Motor)                        │
│  - Gerencia execuções de fluxos                             │
│  - Coordena NodeExecutors e ActionHandlers                   │
│  - Persiste estado no PostgreSQL                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐                    ┌────────▼────────┐
│ NodeExecutors  │                    │ ActionHandlers  │
│ - MESSAGE      │                    │ - searchServices│
│ - QUESTION     │                    │ - createProtocol│
│ - MENU         │                    │ - getProtocols  │
│ - FORM         │                    │ - updateProfile │
│ - UPLOAD       │                    │ - ... (15 mais) │
│ - ACTION       │                    └─────────────────┘
│ - CONDITION    │
│ - LOCATION     │
│ - END          │
└────────────────┘
        ↓
┌─────────────────────────────────────┐
│     FlowStateManager                │
│  - Gerencia estado de execuções     │
│  - Persiste no PostgreSQL           │
│  - Histórico de navegação           │
└─────────────────────────────────────┘
```

---

## 📦 Estrutura de Arquivos

```
backend/
├── prisma/
│   └── schema.prisma              # Schemas: FlowDefinition, FlowExecution
├── src/
│   ├── types/
│   │   └── flow.types.ts          # Tipos TypeScript do sistema
│   ├── services/bot/flow/
│   │   ├── FlowEngine.ts          # Motor principal
│   │   ├── FlowStateManager.ts    # Gerenciamento de estado
│   │   ├── NodeExecutors.ts       # Executores de nodos
│   │   ├── ActionHandlers.ts      # Handlers de ações reais
│   │   ├── TemplateEngine.ts      # Motor de templates {{variavel}}
│   │   └── InputValidator.ts      # Validações de entrada
│   ├── routes/
│   │   ├── bot-flow.routes.ts     # Rotas do bot (cidadão)
│   │   └── admin-flows.routes.ts  # Rotas admin (CRUD fluxos)
│   ├── scripts/
│   │   └── seed-flows.ts          # Script de seed
│   └── services/bot/flows/        # Definições de fluxos (JSON)
│       ├── menu-principal.json
│       ├── solicitar-servico.json
│       ├── consultar-protocolo.json
│       ├── meu-perfil.json
│       ├── minha-familia.json
│       ├── notificacoes.json
│       └── ajuda.json
```

---

## 🔌 APIs Disponíveis

### Rotas do Cidadão (`/api/bot-flow`)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/message` | POST | Processa mensagem do usuário |
| `/start` | POST | Inicia fluxo específico |
| `/upload` | POST | Upload de arquivos |
| `/active-execution` | GET | Obtém execução ativa |
| `/cancel` | POST | Cancela fluxo ativo |
| `/reset` | POST | Reseta conversa (volta ao menu) |
| `/health` | GET | Health check |

### Rotas Administrativas (`/api/admin/flows`)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/` | GET | Lista todos os fluxos |
| `/:id` | GET | Detalhes de um fluxo |
| `/` | POST | Cria novo fluxo |
| `/:id` | PUT | Atualiza fluxo |
| `/:id` | DELETE | Remove fluxo |
| `/:id/duplicate` | POST | Duplica fluxo |
| `/:id/executions` | GET | Lista execuções do fluxo |
| `/stats/overview` | GET | Estatísticas gerais |

---

## 🎨 Tipos de Nodos

### 1. MESSAGE
Exibe mensagem ao usuário e avança automaticamente.

```json
{
  "id": "welcome",
  "type": "message",
  "config": {
    "text": "Bem-vindo! {{citizen.name}}"
  },
  "transitions": [{ "to": "main_menu" }]
}
```

### 2. QUESTION
Faz pergunta e aguarda resposta do usuário.

```json
{
  "id": "ask_name",
  "type": "question",
  "config": {
    "text": "Qual é o seu nome?",
    "validation": {
      "type": "text",
      "minLength": 3,
      "maxLength": 100
    },
    "saveAs": "userName"
  },
  "transitions": [{ "to": "next_step" }]
}
```

### 3. MENU
Apresenta opções para o usuário escolher.

```json
{
  "id": "main_menu",
  "type": "menu",
  "config": {
    "text": "Escolha uma opção:",
    "options": [
      { "id": "option1", "label": "Opção 1" },
      { "id": "option2", "label": "Opção 2" }
    ]
  },
  "transitions": [
    { "when": "option1", "to": "flow_1" },
    { "when": "option2", "to": "flow_2" }
  ]
}
```

### 4. ACTION
Executa ação no backend (criar protocolo, buscar dados, etc).

```json
{
  "id": "create_protocol",
  "type": "action",
  "config": {
    "action": "createProtocol",
    "params": {
      "serviceId": "{{selectedServiceId}}",
      "formData": "{{formData}}"
    },
    "saveResultAs": "createdProtocol"
  },
  "transitions": [{ "to": "success" }]
}
```

### 5. CONDITION
Decisão baseada em dados do estado.

```json
{
  "id": "check_results",
  "type": "condition",
  "config": {
    "conditions": [
      {
        "field": "searchResult.count",
        "operator": "gt",
        "value": 0,
        "goto": "show_results"
      }
    ],
    "defaultGoto": "no_results"
  }
}
```

### 6. FORM
Coleta múltiplos campos em um formulário.

```json
{
  "id": "user_form",
  "type": "form",
  "config": {
    "text": "Preencha os dados:",
    "fields": [
      {
        "id": "name",
        "type": "text",
        "label": "Nome",
        "required": true
      },
      {
        "id": "email",
        "type": "email",
        "label": "Email",
        "required": true
      }
    ],
    "saveAs": "formData"
  },
  "transitions": [{ "to": "process_form" }]
}
```

### 7. UPLOAD
Solicita upload de arquivos.

```json
{
  "id": "upload_docs",
  "type": "upload",
  "config": {
    "text": "Envie os documentos:",
    "multiple": true,
    "maxFiles": 5,
    "maxFileSize": 10,
    "allowedTypes": ["application/pdf", "image/*"],
    "allowSkip": true,
    "saveAs": "uploadedFiles"
  },
  "transitions": [{ "to": "review" }]
}
```

### 8. LOCATION
Solicita localização do usuário.

```json
{
  "id": "get_location",
  "type": "location",
  "config": {
    "text": "Compartilhe sua localização:",
    "allowManualInput": true,
    "saveAs": "userLocation"
  },
  "transitions": [{ "to": "process_location" }]
}
```

### 9. END
Finaliza o fluxo.

```json
{
  "id": "end",
  "type": "end",
  "config": {
    "message": "Obrigado!",
    "returnToMain": true,
    "clearState": false
  }
}
```

---

## 🔧 Action Handlers Disponíveis

| Handler | Descrição |
|---------|-----------|
| `searchServices` | Busca serviços por query ou categoria |
| `listServices` | Lista todos os serviços |
| `listServiceCategories` | Lista categorias de serviços |
| `getService` | Obtém detalhes de um serviço |
| `createProtocol` | Cria novo protocolo/solicitação |
| `getProtocols` | Lista protocolos do cidadão |
| `getProtocolByNumber` | Busca protocolo por número |
| `addProtocolComment` | Adiciona comentário ao protocolo |
| `getCitizenProfile` | Obtém dados do perfil |
| `updateCitizenProfile` | Atualiza perfil do cidadão |
| `getFamilyMembers` | Lista membros da família |
| `getNotifications` | Lista notificações |
| `markNotificationsAsRead` | Marca notificações como lidas |
| `formatProtocolReview` | Formata revisão antes de criar protocolo |
| `startFlow` | Inicia outro fluxo (especial) |

---

## 🚀 Como Usar

### 1. Executar Seed (Popular Fluxos)

```bash
cd backend
npm run seed-flows
```

### 2. Testar via API

```bash
# Iniciar conversa (menu principal)
POST /api/bot-flow/start
{
  "flowName": "menu_principal",
  "conversationId": "optional"
}

# Enviar mensagem
POST /api/bot-flow/message
{
  "message": "1",
  "conversationId": "optional"
}

# Upload de arquivo
POST /api/bot-flow/upload
Content-Type: multipart/form-data
files: [arquivo1, arquivo2]
```

### 3. Gerenciar Fluxos (Admin)

```bash
# Listar fluxos
GET /api/admin/flows

# Criar fluxo
POST /api/admin/flows
{
  "name": "meu_novo_fluxo",
  "description": "Descrição",
  "nodes": [...]
}

# Atualizar fluxo
PUT /api/admin/flows/:id
{
  "nodes": [...]
}
```

---

## 🎯 Fluxos Padrão Implementados

| Fluxo | Descrição | Icon |
|-------|-----------|------|
| `menu_principal` | Menu principal (padrão) | 🏠 |
| `solicitar_servico` | Solicitar serviço municipal | 📝 |
| `consultar_protocolo` | Consultar/gerenciar protocolos | 🔍 |
| `meu_perfil` | Ver/editar perfil do cidadão | 👤 |
| `minha_familia` | Gerenciar composição familiar | 👨‍👩‍👧‍👦 |
| `notificacoes` | Ver e gerenciar notificações | 🔔 |
| `ajuda` | Central de ajuda e FAQ | ❓ |

---

## 📝 Templates e Variáveis

O sistema suporta templates com a sintaxe `{{variavel}}`:

```json
{
  "text": "Olá {{citizen.name}}, seu protocolo é {{protocol.number}}"
}
```

### Variáveis do Estado

Qualquer dado salvo no estado pode ser acessado:

```json
"saveAs": "userName"
// Depois: {{userName}}

"saveResultAs": "searchResult"
// Depois: {{searchResult.count}}, {{searchResult.services}}
```

### Operações

- **Resolução de caminhos**: `{{object.property.nested}}`
- **Arrays**: `{{array[0].name}}`
- **Formatação**: Pode ser extendido no TemplateEngine

---

## 🔍 Estado da Execução

Cada execução mantém estado persistente:

```typescript
interface FlowExecution {
  id: string;
  citizenId: string;
  flowId: string;
  currentNodeId: string;
  state: {
    // Dados coletados durante o fluxo
    userName?: string;
    selectedService?: any;
    formData?: any;
    uploadedFiles?: any[];
    // ... qualquer outra variável
  };
  history: string[]; // IDs dos nodos visitados
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'ERROR';
}
```

---

## 🛡️ Validações

### Tipos de Validação Suportados

| Tipo | Descrição |
|------|-----------|
| `text` | Texto com min/maxLength |
| `number` | Número com min/max |
| `email` | Email válido |
| `cpf` | CPF válido (com dígito verificador) |
| `phone` | Telefone (10 ou 11 dígitos) |
| `date` | Data (DD/MM/AAAA ou YYYY-MM-DD) |
| `protocol` | Número de protocolo |

---

## 📊 Monitoramento

### Métricas Disponíveis

```bash
# Estatísticas gerais
GET /api/admin/flows/stats/overview

# Resposta:
{
  "flows": {
    "total": 7,
    "active": 7,
    "inactive": 0
  },
  "executions": {
    "total": 1523,
    "active": 12,
    "completed": 1511
  },
  "topFlows": [
    { "flowName": "solicitar_servico", "executionCount": 532 },
    { "flowName": "consultar_protocolo", "executionCount": 421 }
  ]
}
```

---

## 🔄 Migração do Sistema Antigo

### Sistema Antigo (Baseado em IA)

```
❌ Dependia de Ollama (30-40s timeout)
❌ Comportamento imprevisível
❌ Falhas quando IA não estava disponível
❌ Fluxos hardcoded em TypeScript
❌ Difícil de customizar por município
```

### Sistema Novo (Baseado em Fluxos)

```
✅ Respostas instantâneas (< 100ms)
✅ Comportamento 100% previsível
✅ Funciona sempre, sem dependência externa
✅ Fluxos em JSON editáveis
✅ Customizável por município via interface
```

### Rotas Antigas

As rotas antigas foram movidas para `/api/bot-legacy` (deprecated).
As novas rotas estão em `/api/bot-flow`.

---

## 🎨 Próximos Passos

### Interface Visual de Construção de Fluxos

- [ ] Editor drag & drop de nodos
- [ ] Preview em tempo real
- [ ] Validador visual de fluxos
- [ ] Versionamento de fluxos
- [ ] A/B testing de fluxos

### Integrações Futuras

- [ ] WebSockets para real-time
- [ ] Integração com WhatsApp
- [ ] Integração com Telegram
- [ ] Voice bot (text-to-speech)

---

## 📚 Referências

- **Schemas**: `prisma/schema.prisma` (modelos FlowDefinition e FlowExecution)
- **Tipos**: `src/types/flow.types.ts`
- **Engine**: `src/services/bot/flow/FlowEngine.ts`
- **Executores**: `src/services/bot/flow/NodeExecutors.ts`
- **Handlers**: `src/services/bot/flow/ActionHandlers.ts`
- **Fluxos Padrão**: `src/services/bot/flows/*.json`

---

## 🤝 Contribuindo

Para adicionar um novo fluxo:

1. Criar arquivo JSON em `src/services/bot/flows/`
2. Definir nodes com types apropriados
3. Executar seed: `npm run seed-flows`
4. Testar via API

Para adicionar um novo action handler:

1. Implementar handler em `ActionHandlers.ts`
2. Adicionar ao objeto `actionHandlers`
3. Documentar neste README

---

## 📞 Suporte

Em caso de dúvidas ou problemas:
- Verificar logs do backend
- Consultar execuções no banco: `flow_executions`
- Usar rota `/api/bot-flow/health` para verificar status

---

**Desenvolvido por**: Equipe DigiUrban
**Versão**: 1.0.0
**Data**: Janeiro 2026
