# PLANO: DigiBot 100% IA - Sem Fallback, Totalmente Autônomo

## 📋 OBJETIVO

Transformar o DigiBot em um assistente 100% baseado em IA (Ollama/Qwen2.5-3B) que:

1. **Remove completamente o fallback de keywords** - não faz sentido com IA funcionando
2. **Aumenta timeout do Ollama** de 5s para 20s (Qwen2.5 leva ~8s para responder)
3. **Integra IA com endpoints reais da aplicação** para solicitar serviços e consultar dados
4. **Faz IA aprender com metadados dos serviços** (formSchema, requiredDocuments)
5. **Gera cards interativos automaticamente** baseado no contexto da conversa
6. **Coleta dados via fluxos conversacionais** e chama APIs reais para criar protocolos

---

## 🔍 ANÁLISE DA SITUAÇÃO ATUAL

### Problemas Identificados

#### 1. **Timeout Muito Curto**
- **Problema**: `OLLAMA_TIMEOUT=5000ms` mas Qwen2.5 leva ~8.2s
- **Sintoma**: Logs mostram "Ollama error: timeout of 5000ms exceeded"
- **Resultado**: Sistema cai no fallback de keywords (10% confiança)
- **Arquivo**: [OllamaService.ts:22](backend/src/services/bot/OllamaService.ts#L22)

#### 2. **Fallback de Keywords Desnecessário**
- **Problema**: Sistema usa keyword matching quando IA falha
- **Motivação Original**: Garantir que bot sempre responda
- **Realidade Atual**: Com Qwen2.5 funcionando, fallback é contraproducente
- **Resultado**: Respostas genéricas e sem contexto (confiança 10-30%)
- **Arquivo**: [IntentRecognitionService.ts:146-149](backend/src/services/bot/IntentRecognitionService.ts#L146-L149)

#### 3. **IA Não Está Integrada com Endpoints Reais**
- **Problema**: FlowManager tem handlers `createServiceProtocol` e `createAppointmentProtocol` que **não estão implementados**
- **Evidência**:
  - `onComplete: 'createServiceProtocol'` em [FlowManager.ts:140](backend/src/services/bot/FlowManager.ts#L140)
  - `onComplete: 'createAppointmentProtocol'` em [FlowManager.ts:87](backend/src/services/bot/FlowManager.ts#L87)
- **Resultado**: Fluxos são completados mas não criam protocolos de fato
- **Solução Necessária**: Implementar handlers que chamem `POST /api/services/:id/request`

#### 4. **IA Não Conhece os Serviços Disponíveis Dinamicamente**
- **Problema**: OllamaService recebe apenas top 10 serviços via `servicesMetadata`
- **Limitação**: Prompt estático, não aprende com formSchema dos serviços
- **Evidência**: [OllamaService.ts:70-76](backend/src/services/bot/OllamaService.ts#L70-L76)
- **Resultado**: IA pode identificar intenção mas não sabe quais campos coletar

#### 5. **Fluxos São Fixos, Não Dinâmicos**
- **Problema**: Fluxos AGENDAR_CONSULTA e SOLICITAR_SERVICO têm etapas hardcoded
- **Realidade**: Cada serviço tem `formSchema` diferente com campos customizados
- **Exemplo**:
  - Serviço "IPTU" precisa: `numeroContribuinte`, `anoExercicio`
  - Serviço "Consulta Médica" precisa: `specialty`, `healthUnitId`, `appointmentDate`
- **Solução Necessária**: Gerar etapas do fluxo dinamicamente baseado em `service.formSchema`

---

## 🎯 SOLUÇÃO PROPOSTA

### Arquitetura Nova (100% IA)

```
┌─────────────────────────────────────────────────────────────┐
│                    CIDADÃO ENVIA MENSAGEM                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  1. OLLAMA/QWEN2.5 (TIMEOUT: 20s)                           │
│     - Reconhece intenção com 75-85% confiança               │
│     - Extrai entidades (serviceId, protocolNumber, etc)     │
│     - Gera cards interativos automaticamente                │
│     - Aprende com metadados dos serviços                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
               ┌───────────────┐
               │ Confiança?    │
               └───────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    >= 60%         40-60%          < 40%
        │              │              │
        ▼              ▼              ▼
    ┌───────┐    ┌──────────┐   ┌─────────────┐
    │ Usar  │    │ Pedir    │   │ Transferir  │
    │ Intent│    │ Clari-   │   │ p/ Humano   │
    │       │    │ ficação  │   │             │
    └───┬───┘    └─────┬────┘   └─────────────┘
        │              │
        ▼              ▼
┌─────────────────────────────────────┐
│  2. ROTEAMENTO INTELIGENTE          │
│     - AGENDAR_CONSULTA              │
│     - SOLICITAR_SERVICO             │
│     - VER_PROTOCOLOS                │
│     - STATUS_PROTOCOLO              │
│     - ENVIAR_DOCUMENTO              │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  3. FLUXO DINÂMICO                  │
│     a) Busca service.formSchema     │
│     b) Gera etapas automaticamente  │
│     c) Coleta dados via cards       │
│     d) Valida com JSON Schema       │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  4. EXECUÇÃO (INTEGRAÇÃO REAL)      │
│     POST /api/services/:id/request  │
│     - Envia customFormData          │
│     - Upload de documentos          │
│     - Cria ProtocolSimplified       │
│     - Retorna número do protocolo   │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  5. CONFIRMAÇÃO AO CIDADÃO          │
│     "Protocolo #2026-0001234 criado!│
│     Acompanhe pelo menu."           │
└─────────────────────────────────────┘
```

---

## 📁 ARQUIVOS A MODIFICAR

### 1. **Backend - Serviços de IA**

#### `backend/src/services/bot/IntentRecognitionService.ts`

**Modificações:**

```typescript
// REMOVER: Fallback de keywords (linhas 146-149)
// REMOVER: Fallback de OpenAI (linhas 132-144)

async recognizeIntent(message: string, context?: Context, servicesMetadata?: any[]): Promise<Intent> {
  // APENAS OLLAMA/QWEN2.5
  if (!this.useOllama) {
    throw new Error('IA desabilitada. Configure USE_OLLAMA=true');
  }

  try {
    const services = servicesMetadata || [];
    const ollamaResult = await this.ollamaService.recognizeIntent(
      message,
      context || {},
      services
    );

    // NOVO: Aceitar confiança >= 40% (IA é confiável)
    if (ollamaResult.confidence >= 0.4) {
      console.log(`✅ Ollama: ${ollamaResult.intent} (${ollamaResult.confidence})`);
      return {
        name: ollamaResult.intent,
        confidence: ollamaResult.confidence,
        entities: ollamaResult.parameters,
        suggestedCards: ollamaResult.suggestedCards,
      };
    }

    // NOVO: Se confiança baixa, pedir clarificação
    console.log(`⚠️ Baixa confiança (${ollamaResult.confidence}), pedindo clarificação`);
    return {
      name: 'CLARIFICATION_NEEDED',
      confidence: ollamaResult.confidence,
      entities: { originalIntent: ollamaResult.intent },
      suggestedCards: ollamaResult.suggestedCards || []
    };

  } catch (error: any) {
    console.error('❌ Ollama indisponível:', error.message);

    // NOVO: Não usar fallback, transferir para humano
    return {
      name: 'AI_UNAVAILABLE',
      confidence: 0,
      entities: { error: error.message }
    };
  }
}
```

**Justificativa:**
- Remove keyword matching completamente
- Remove OpenAI fallback (custo desnecessário com IA local funcionando)
- Se IA falhar, transfere para humano em vez de dar resposta genérica
- Aceita confiança >= 40% (IA é mais confiável que keywords)

---

#### `backend/src/services/bot/OllamaService.ts`

**Modificações:**

```typescript
constructor(
  baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model = process.env.OLLAMA_MODEL || 'digibot-qwen2.5',
  timeout = parseInt(process.env.OLLAMA_TIMEOUT || '20000')  // MUDOU: 5000 → 20000
) {
  this.baseUrl = baseUrl;
  this.model = model;
  this.timeout = timeout;
}
```

**Novo método: `buildEnhancedPrompt`**

```typescript
/**
 * Constrói prompt APRIMORADO com metadados completos dos serviços
 */
private buildEnhancedPrompt(
  message: string,
  context: any,
  servicesMetadata: any[]
): string {
  // INCLUIR: formSchema de cada serviço
  const servicesContext = servicesMetadata
    .slice(0, 15)  // Top 15 (antes: 10)
    .map((s, i) => {
      const fields = s.formSchema?.fields || [];
      const requiredDocs = s.requiredDocuments || [];

      return `${i + 1}. ${s.name} (${s.category})
   Descrição: ${s.description}
   Campos necessários: ${fields.map((f: any) => f.label).join(', ')}
   Documentos: ${requiredDocs.map((d: any) => d.name).join(', ')}`;
    })
    .join('\n\n');

  const conversationContext = context.messages
    ?.slice(-5)  // Últimas 5 mensagens (antes: 3)
    .map((m: any) => `${m.sender}: ${m.content}`)
    .join('\n') || 'Início da conversa';

  return `Você é o DigiBot, assistente virtual da prefeitura municipal brasileira.

SERVIÇOS DISPONÍVEIS (com campos obrigatórios):
${servicesContext}

CONTEXTO DA CONVERSA:
${conversationContext}

MENSAGEM DO CIDADÃO:
"${message}"

INSTRUÇÕES:
1. Identifique a intenção com precisão
2. Se mencionar um serviço, identifique qual pelos campos necessários
3. Gere cards interativos úteis (máximo 3 cards)
4. Use confidence >= 0.6 se tiver certeza, >= 0.4 se provável

RESPONDA EM JSON VÁLIDO (sem texto adicional):
{
  "intent": "NOME_DA_INTENCAO",
  "confidence": 0.85,
  "parameters": {
    "serviceId": "id-do-servico-se-identificado",
    "serviceName": "nome-do-servico",
    "protocolNumber": "numero-se-mencionado",
    "searchTerm": "termo-de-busca"
  },
  "suggestedCards": [
    {
      "title": "Título Claro",
      "description": "Descrição útil",
      "actionLabel": "Ação Clara"
    }
  ]
}`;
}
```

**Justificativa:**
- Timeout 20s acomoda resposta de 8s do Qwen2.5 com margem
- Prompt aprimorado inclui formSchema para IA saber quais campos coletar
- Aumenta histórico de conversa (5 mensagens vs 3) para melhor contexto

---

#### `backend/src/services/bot/BotServiceEnhanced.ts`

**Modificações no `handleIntent`:**

```typescript
private async handleIntent(
  citizenId: string,
  intent: any,
  message: string,
  context: any,
  sentiment: any
): Promise<BotResponse> {

  // NOVO: Tratamento de IA indisponível
  if (intent.name === 'AI_UNAVAILABLE') {
    return this.transferToHuman(
      citizenId,
      conversation.id,
      'AI_ERROR',
      sentiment
    );
  }

  // NOVO: Tratamento de clarificação necessária
  if (intent.name === 'CLARIFICATION_NEEDED') {
    return {
      response: 'Não entendi muito bem. Você pode reformular?',
      messageType: 'quick_reply',
      quickReplies: [
        'Quero agendar consulta',
        'Preciso solicitar um serviço',
        'Ver meus protocolos',
        'Falar com atendente'
      ],
      metadata: {
        needsClarification: true,
        originalIntent: intent.entities?.originalIntent
      }
    };
  }

  // Roteamento existente
  switch (intent.name) {
    case 'AGENDAR_CONSULTA':
      return this.flowManager.startFlow(citizenId, 'AGENDAR_CONSULTA');

    case 'SOLICITAR_SERVICO':
      // NOVO: Passar serviceId se IA já identificou
      return this.flowManager.startFlow(
        citizenId,
        'SOLICITAR_SERVICO',
        { serviceId: intent.entities?.serviceId }
      );

    // ... resto dos casos
  }
}
```

**Modificação em `processMessage` (validação de confiança):**

```typescript
// REMOVER: Linhas 218-238 (validação < 0.5 e transferência)
// NOVO: Sem validação de confiança mínima - IA decide

// Se chegou aqui, intent foi reconhecido pela IA
// Processar normalmente
const response = await this.handleIntent(
  citizenId,
  intent,
  message,
  context,
  sentiment
);
```

**Justificativa:**
- Remove lógica de "confiança baixa" que não faz sentido com IA
- Adiciona tratamento específico para IA indisponível
- Permite passar parâmetros (como serviceId) para fluxos

---

### 2. **Backend - Gerenciamento de Fluxos**

#### `backend/src/services/bot/FlowManager.ts`

**NOVA FUNCIONALIDADE: Fluxo Dinâmico Baseado em formSchema**

```typescript
/**
 * Inicia fluxo dinâmico baseado no formSchema do serviço
 */
async startDynamicServiceFlow(
  citizenId: string,
  serviceId: string
): Promise<BotResponse> {
  // 1. Buscar serviço com formSchema
  const service = await prisma.serviceSimplified.findUnique({
    where: { id: serviceId },
    include: { department: true }
  });

  if (!service) {
    return {
      response: 'Serviço não encontrado. Tente buscar novamente.',
      messageType: 'text',
      quickReplies: ['Buscar serviços', 'Falar com atendente']
    };
  }

  // 2. Converter formSchema em etapas de fluxo
  const steps: FlowStep[] = [];

  // Adicionar campos customizados
  const formFields = service.formFieldsConfig || service.formSchema?.fields || [];

  for (const field of formFields) {
    if (!field.enabled) continue;

    steps.push({
      id: field.id,
      type: this.mapFieldTypeToStepType(field.type),
      message: field.label,
      required: field.required,
      saveAs: field.id,
      validation: {
        minLength: field.minLength,
        maxLength: field.maxLength,
        pattern: field.pattern,
        min: field.min,
        max: field.max
      },
      options: field.options?.map((opt: string) => ({
        value: opt,
        label: opt
      })),
      placeholder: field.placeholder
    });
  }

  // Adicionar etapa de descrição (sempre obrigatória)
  steps.push({
    id: 'description',
    type: 'text',
    message: `Descreva o motivo da solicitação de "${service.name}":`,
    required: true,
    saveAs: 'description',
    validation: {
      minLength: 10,
      maxLength: 500
    }
  });

  // Adicionar upload de documentos se necessário
  if (service.requiresDocuments && service.requiredDocuments) {
    const docs = service.requiredDocuments as any[];
    steps.push({
      id: 'upload_documents',
      type: 'file_upload',
      message: `Envie os seguintes documentos:\n${docs.map(d => `- ${d.name}`).join('\n')}`,
      required: docs.some(d => d.required),
      saveAs: 'documents',
      accept: 'image/*,.pdf',
      maxFiles: docs.length,
      maxSize: 10485760 // 10MB
    });
  }

  // Adicionar confirmação final
  steps.push({
    id: 'confirmation',
    type: 'confirmation',
    message: `Revise sua solicitação de "${service.name}":`,
    required: true
  });

  // 3. Criar fluxo dinâmico
  const flowDefinition: FlowDefinition = {
    name: `SERVICE_${serviceId}`,
    steps,
    onComplete: 'createDynamicServiceProtocol',
    metadata: {
      serviceId,
      serviceName: service.name,
      departmentId: service.departmentId
    }
  };

  // 4. Registrar e iniciar fluxo
  this.registerFlow(flowDefinition);
  return this.startFlow(citizenId, flowDefinition.name);
}

/**
 * Mapeia tipo de campo do formSchema para tipo de etapa do fluxo
 */
private mapFieldTypeToStepType(fieldType: string): FlowStepType {
  const mapping: Record<string, FlowStepType> = {
    'text': 'text',
    'textarea': 'text',
    'number': 'text',
    'email': 'text',
    'phone': 'phone',
    'date': 'date',
    'time': 'time',
    'select': 'selection',
    'radio': 'selection',
    'checkbox': 'multiple_choice',
    'file': 'file_upload'
  };

  return mapping[fieldType] || 'text';
}
```

**IMPLEMENTAR HANDLERS DE CONCLUSÃO:**

```typescript
/**
 * Executa ação ao completar fluxo
 */
private async executeFlowCompletion(
  citizenId: string,
  flowName: string,
  collectedData: Record<string, any>,
  metadata?: any
): Promise<BotResponse> {

  const handlers: Record<string, Function> = {
    'createAppointmentProtocol': this.createAppointmentProtocol.bind(this),
    'createServiceProtocol': this.createServiceProtocol.bind(this),
    'createDynamicServiceProtocol': this.createDynamicServiceProtocol.bind(this),
    'uploadCitizenDocument': this.uploadCitizenDocument.bind(this)
  };

  const flow = this.flows.get(flowName);
  if (!flow || !flow.onComplete) {
    return {
      response: 'Fluxo concluído mas sem ação definida.',
      messageType: 'text'
    };
  }

  const handler = handlers[flow.onComplete];
  if (!handler) {
    console.error(`Handler ${flow.onComplete} não implementado`);
    return {
      response: 'Erro ao processar solicitação. Tente novamente.',
      messageType: 'text'
    };
  }

  return handler(citizenId, collectedData, metadata);
}

/**
 * Cria protocolo de agendamento de consulta
 */
private async createAppointmentProtocol(
  citizenId: string,
  data: Record<string, any>,
  metadata?: any
): Promise<BotResponse> {

  try {
    // Buscar serviço de agendamento de consulta
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        name: { contains: 'Agendamento' },
        moduleType: 'SAUDE'
      }
    });

    if (!service) {
      throw new Error('Serviço de agendamento não encontrado');
    }

    // Chamar API de criação de protocolo
    const protocolData = {
      description: `Agendamento de consulta - ${data.specialty}`,
      serviceId: service.id,
      customFormData: {
        specialty: data.specialty,
        healthUnitId: data.healthUnitId,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime
      }
    };

    // Criar protocolo
    const protocol = await prisma.protocolSimplified.create({
      data: {
        citizenId,
        serviceId: service.id,
        departmentId: service.departmentId,
        number: await this.generateProtocolNumber(),
        title: service.name,
        description: protocolData.description,
        customData: protocolData.customFormData,
        status: 'VINCULADO',
        moduleType: 'SAUDE',
        priority: 3
      }
    });

    // Criar histórico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: protocol.id,
        action: 'Protocolo criado via DigiBot',
        description: `Agendamento de ${data.specialty} para ${data.appointmentDate} às ${data.appointmentTime}`,
        userId: null // Sistema
      }
    });

    return {
      response: `✅ Consulta agendada com sucesso!\n\n📋 Protocolo: #${protocol.number}\n📅 Data: ${data.appointmentDate}\n🕐 Horário: ${data.appointmentTime}\n\nVocê pode acompanhar pelo menu "Meus Protocolos".`,
      messageType: 'text',
      metadata: {
        protocolId: protocol.id,
        protocolNumber: protocol.number
      }
    };

  } catch (error) {
    console.error('Erro ao criar protocolo de agendamento:', error);
    return {
      response: 'Erro ao agendar consulta. Por favor, tente novamente ou fale com um atendente.',
      messageType: 'text',
      quickReplies: ['Tentar novamente', 'Falar com atendente']
    };
  }
}

/**
 * Cria protocolo de solicitação de serviço
 */
private async createServiceProtocol(
  citizenId: string,
  data: Record<string, any>,
  metadata?: any
): Promise<BotResponse> {

  try {
    const service = await prisma.serviceSimplified.findUnique({
      where: { id: data.serviceId }
    });

    if (!service) {
      throw new Error('Serviço não encontrado');
    }

    // Criar protocolo
    const protocol = await prisma.protocolSimplified.create({
      data: {
        citizenId,
        serviceId: service.id,
        departmentId: service.departmentId,
        number: await this.generateProtocolNumber(),
        title: service.name,
        description: data.description,
        customData: {
          location: data.location,
          description: data.description
        },
        status: 'VINCULADO',
        moduleType: service.moduleType || 'GERAL',
        priority: 3
      }
    });

    // Upload de anexos se houver
    if (data.attachments && data.attachments.length > 0) {
      for (const file of data.attachments) {
        await prisma.protocolDocument.create({
          data: {
            protocolId: protocol.id,
            documentType: 'FOTO',
            fileName: file.filename,
            fileUrl: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            status: 'UPLOADED',
            uploadedAt: new Date()
          }
        });
      }
    }

    // Criar histórico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: protocol.id,
        action: 'Protocolo criado via DigiBot',
        description: data.description
      }
    });

    return {
      response: `✅ Solicitação enviada com sucesso!\n\n📋 Protocolo: #${protocol.number}\n📝 Serviço: ${service.name}\n\nPrazo estimado: ${service.estimatedDays || 'A definir'} dias\n\nAcompanhe pelo menu "Meus Protocolos".`,
      messageType: 'text',
      metadata: {
        protocolId: protocol.id,
        protocolNumber: protocol.number
      }
    };

  } catch (error) {
    console.error('Erro ao criar protocolo de serviço:', error);
    return {
      response: 'Erro ao criar solicitação. Tente novamente ou fale com um atendente.',
      messageType: 'text',
      quickReplies: ['Tentar novamente', 'Falar com atendente']
    };
  }
}

/**
 * Cria protocolo dinâmico baseado em formSchema
 */
private async createDynamicServiceProtocol(
  citizenId: string,
  data: Record<string, any>,
  metadata?: any
): Promise<BotResponse> {

  try {
    const serviceId = metadata?.serviceId;
    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      throw new Error('Serviço não encontrado');
    }

    // Criar protocolo
    const protocol = await prisma.protocolSimplified.create({
      data: {
        citizenId,
        serviceId: service.id,
        departmentId: service.departmentId,
        number: await this.generateProtocolNumber(),
        title: service.name,
        description: data.description,
        customData: data, // Todos os campos coletados
        status: 'VINCULADO',
        moduleType: service.moduleType || 'GERAL',
        priority: 3
      }
    });

    // Upload de documentos se houver
    if (data.documents && data.documents.length > 0) {
      for (const file of data.documents) {
        await prisma.protocolDocument.create({
          data: {
            protocolId: protocol.id,
            documentType: file.documentType || 'ANEXO',
            fileName: file.filename,
            fileUrl: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            status: 'UPLOADED',
            uploadedAt: new Date()
          }
        });
      }
    }

    // Criar histórico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: protocol.id,
        action: 'Protocolo criado via DigiBot',
        description: `Solicitação de ${service.name}`
      }
    });

    return {
      response: `✅ Solicitação de "${service.name}" enviada!\n\n📋 Protocolo: #${protocol.number}\n📝 Departamento: ${metadata?.departmentName || 'N/A'}\n⏱️ Prazo: ${service.estimatedDays || 'A definir'} dias\n\nAcompanhe pelo menu.`,
      messageType: 'text',
      metadata: {
        protocolId: protocol.id,
        protocolNumber: protocol.number
      }
    };

  } catch (error) {
    console.error('Erro ao criar protocolo dinâmico:', error);
    return {
      response: 'Erro ao processar solicitação. Tente novamente.',
      messageType: 'text'
    };
  }
}

/**
 * Gera número único de protocolo
 */
private async generateProtocolNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.protocolSimplified.count({
    where: {
      number: {
        startsWith: `${year}-`
      }
    }
  });

  const nextNumber = (count + 1).toString().padStart(7, '0');
  return `${year}-${nextNumber}`;
}
```

**Justificativa:**
- Cria fluxos dinâmicos baseados no formSchema de cada serviço
- Implementa handlers que realmente criam protocolos no banco
- Reutiliza lógica existente da aplicação (mesmos endpoints, mesma estrutura)

---

### 3. **Variáveis de Ambiente**

#### `.env` (local e VPS)

```bash
# Ollama AI (DigiBot Enhanced)
USE_OLLAMA=true
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=digibot-qwen2.5
OLLAMA_TIMEOUT=20000  # MUDOU: 5000 → 20000 (20 segundos)
```

#### `docker-compose.vps.yml`

```yaml
# Ollama AI (DigiBot Enhanced)
- USE_OLLAMA=true
- OLLAMA_BASE_URL=http://ollama:11434
- OLLAMA_MODEL=digibot-qwen2.5
- OLLAMA_TIMEOUT=20000  # MUDOU
```

#### `.github/workflows/deploy-digiurban-vps.yml`

```yaml
echo "OLLAMA_TIMEOUT=20000" >> .env  # ADICIONAR
```

---

## 🧪 TESTES E VALIDAÇÃO

### Cenários de Teste

#### 1. **Teste de Timeout**
```
Cidadão: "Preciso agendar uma consulta com pediatra"
Esperado:
- Ollama responde em ~8s (dentro do timeout de 20s)
- Intent: AGENDAR_CONSULTA
- Confiança: >= 0.75
- Cards: [Clínico Geral, Pediatria, Ginecologia]
```

#### 2. **Teste de Fluxo Dinâmico**
```
Cidadão: "Quero solicitar IPTU"
Esperado:
- IA identifica serviceId do IPTU
- Fluxo é gerado dinamicamente baseado em formSchema
- Etapas coletam: numeroContribuinte, anoExercicio, etc
- Ao final, protocolo é criado em ProtocolSimplified
```

#### 3. **Teste de Integração Real**
```
Cidadão completa fluxo de agendamento:
1. Especialidade: "Clínico Geral"
2. Unidade: "UBS Centro"
3. Data: "2026-01-25"
4. Horário: "14:00"
5. Confirmação: "Sim"

Esperado:
- Protocolo criado no banco
- Número gerado: 2026-0001XXX
- Histórico registrado
- Resposta: "Consulta agendada! Protocolo #2026-0001XXX"
```

#### 4. **Teste de IA Indisponível**
```
Simulação: Desligar container Ollama
Cidadão: "Oi, preciso de ajuda"
Esperado:
- Intent: AI_UNAVAILABLE
- Resposta: "Transferindo para atendente humano..."
- NÃO usar fallback de keywords
```

#### 5. **Teste de Baixa Confiança**
```
Cidadão: "asdfghjkl qwerty"
Esperado:
- Confiança < 0.4
- Intent: CLARIFICATION_NEEDED
- Resposta: "Não entendi. Você quer: [Agendar consulta] [Solicitar serviço]..."
```

---

## 📊 MÉTRICAS DE SUCESSO

### Antes (Situação Atual)

| Métrica | Valor |
|---------|-------|
| Taxa de sucesso IA | 0% (timeout) |
| Confiança média | 10% (keywords) |
| Protocolos criados via bot | 0 (não implementado) |
| Cards automáticos | 0 |
| Tempo de resposta | 5s (timeout) |

### Depois (Esperado)

| Métrica | Valor Esperado |
|---------|----------------|
| Taxa de sucesso IA | 95%+ |
| Confiança média | 75-85% |
| Protocolos criados via bot | 100% (integrado) |
| Cards automáticos | 2-3 por resposta |
| Tempo de resposta | 8-12s (dentro do limite) |

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO

### Fase 1: Correção de Timeout (URGENTE)
**Tempo estimado: 30 minutos**

1. Atualizar `OLLAMA_TIMEOUT` para 20000 em:
   - `backend/src/services/bot/OllamaService.ts` (linha 22)
   - `.env`
   - `docker-compose.vps.yml`
   - `.github/workflows/deploy-digiurban-vps.yml`

2. Fazer commit e deploy
3. Testar na VPS se Ollama responde dentro do timeout

**Resultado:** Bot para de dar timeout e começa a retornar 75-85% de confiança

---

### Fase 2: Remoção de Fallbacks (CRÍTICO)
**Tempo estimado: 1 hora**

1. Modificar `IntentRecognitionService.ts`:
   - Remover fallback de keywords (linhas 146-149)
   - Remover fallback de OpenAI (linhas 132-144)
   - Adicionar intent `AI_UNAVAILABLE`
   - Adicionar intent `CLARIFICATION_NEEDED`

2. Modificar `BotServiceEnhanced.ts`:
   - Adicionar handlers para `AI_UNAVAILABLE` e `CLARIFICATION_NEEDED`
   - Remover validação de confiança < 0.5 (linhas 218-238)

3. Testar localmente

**Resultado:** Bot usa 100% IA, sem fallbacks

---

### Fase 3: Prompt Aprimorado (IMPORTANTE)
**Tempo estimado: 1 hora**

1. Modificar `OllamaService.ts`:
   - Substituir `buildPrompt` por `buildEnhancedPrompt`
   - Incluir formSchema completo dos serviços
   - Aumentar histórico de conversa para 5 mensagens
   - Incluir documentos obrigatórios no contexto

2. Testar se IA identifica serviços com mais precisão

**Resultado:** IA conhece os serviços e sabe quais campos coletar

---

### Fase 4: Fluxo Dinâmico (CORE)
**Tempo estimado: 3 horas**

1. Adicionar método `startDynamicServiceFlow` em `FlowManager.ts`
2. Adicionar método `mapFieldTypeToStepType`
3. Modificar `BotServiceEnhanced.handleIntent` para usar fluxo dinâmico
4. Testar com serviço real (ex: IPTU)

**Resultado:** Fluxos são gerados automaticamente baseados em formSchema

---

### Fase 5: Handlers de Conclusão (ESSENCIAL)
**Tempo estimado: 2-3 horas**

1. Implementar `createAppointmentProtocol`
2. Implementar `createServiceProtocol`
3. Implementar `createDynamicServiceProtocol`
4. Implementar `uploadCitizenDocument`
5. Adicionar método `generateProtocolNumber`
6. Testar criação real de protocolos

**Resultado:** Bot cria protocolos de verdade no banco de dados

---

### Fase 6: Testes End-to-End (VALIDAÇÃO)
**Tempo estimado: 2 horas**

1. Testar fluxo completo de agendamento
2. Testar fluxo completo de solicitação de serviço
3. Testar upload de documentos
4. Testar cenários de erro (IA indisponível, baixa confiança)
5. Validar que protocolos aparecem no painel do cidadão

**Resultado:** Sistema funcionando 100% integrado

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Configuração
- [ ] Aumentar `OLLAMA_TIMEOUT` para 20000
- [ ] Deploy da configuração na VPS
- [ ] Verificar que Ollama responde sem timeout

### Remoção de Fallbacks
- [ ] Remover fallback de keywords
- [ ] Remover fallback de OpenAI
- [ ] Adicionar tratamento `AI_UNAVAILABLE`
- [ ] Adicionar tratamento `CLARIFICATION_NEEDED`
- [ ] Testar transferência para humano quando IA falha

### Prompt Aprimorado
- [ ] Implementar `buildEnhancedPrompt`
- [ ] Incluir formSchema no contexto
- [ ] Incluir documentos obrigatórios
- [ ] Aumentar histórico para 5 mensagens
- [ ] Testar se IA identifica serviços corretamente

### Fluxo Dinâmico
- [ ] Implementar `startDynamicServiceFlow`
- [ ] Implementar `mapFieldTypeToStepType`
- [ ] Integrar com `SOLICITAR_SERVICO`
- [ ] Testar com 3 serviços diferentes

### Handlers de Conclusão
- [ ] Implementar `createAppointmentProtocol`
- [ ] Implementar `createServiceProtocol`
- [ ] Implementar `createDynamicServiceProtocol`
- [ ] Implementar `uploadCitizenDocument`
- [ ] Implementar `generateProtocolNumber`
- [ ] Testar criação de protocolos

### Testes Finais
- [ ] Fluxo completo de agendamento funciona
- [ ] Fluxo completo de serviço funciona
- [ ] Upload de documentos funciona
- [ ] Protocolos aparecem no painel
- [ ] Cards interativos são gerados
- [ ] IA responde com 75-85% de confiança

---

## 🎓 CONCLUSÃO

Este plano transforma o DigiBot em um assistente **100% baseado em IA**, removendo completamente os fallbacks de keywords e OpenAI. A IA (Ollama/Qwen2.5-3B) será a **única fonte de inteligência**, com:

- **Timeout adequado** (20s) para acomodar o tempo de resposta
- **Sem fallbacks** - se IA falhar, transfere para humano
- **Fluxos dinâmicos** gerados automaticamente dos formSchemas
- **Integração real** com endpoints da aplicação
- **Protocolos criados de verdade** no banco de dados
- **Cards interativos automáticos** gerados pela IA

O resultado será um bot que funciona como um **atendente humano virtual**, capaz de:
1. Entender o que o cidadão quer
2. Coletar os dados necessários via conversa
3. Criar protocolos reais no sistema
4. Fornecer confirmação e acompanhamento

**Tempo total estimado:** 10-12 horas de desenvolvimento + testes
**Complexidade:** Média-Alta
**Impacto:** MUITO ALTO (transforma o bot em ferramenta real de atendimento)
