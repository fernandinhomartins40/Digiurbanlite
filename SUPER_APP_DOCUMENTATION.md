# 📱 DigiUrban Super App - Documentação Completa

## 🎯 Visão Geral

O DigiUrban foi transformado em um **Super App estilo WhatsApp** com **IA conversacional (DigiBot)** como interface principal de atendimento ao cidadão.

### 🌟 Principais Características

✅ **Interface WhatsApp-like** - Experiência familiar e intuitiva
✅ **DigiBot fixo no topo** - Assistente de IA sempre acessível
✅ **Menu lateral/inferior** - Acesso a todas as funcionalidades do painel
✅ **IA com OpenAI GPT-4** - Processamento de linguagem natural avançado
✅ **20+ Intents reconhecidos** - Cobre todos os casos de uso principais
✅ **114 Serviços integrados** - Base de conhecimento completa
✅ **Context Manager com Redis** - Conversas contextualizadas
✅ **Recommendation Engine** - Sugestões inteligentes personalizadas
✅ **Cards e Quick Replies** - UI moderna e interativa
✅ **Painel Admin completo** - Gerenciamento e atendimento humano

---

## 📂 Estrutura do Projeto

```
digiurban/
├── backend/
│   └── src/
│       ├── routes/
│       │   └── bot.ts                           # Rotas da API do bot
│       └── services/
│           └── bot/
│               ├── BotService.ts                # Orquestrador principal do bot
│               ├── IntentRecognitionService.ts  # Reconhecimento de intenções (OpenAI + keywords)
│               ├── ServiceKnowledgeBase.ts      # Base de conhecimento dos 114 serviços
│               ├── ContextManager.ts            # Gerenciamento de contexto (Redis)
│               └── RecommendationEngine.ts      # Engine de recomendações com IA
│
├── frontend/
│   ├── app/
│   │   ├── cidadao/
│   │   │   └── super-app/
│   │   │       └── page.tsx                     # Página principal do Super App (cidadão)
│   │   └── admin/
│   │       └── mensagens/
│   │           └── page.tsx                     # Painel admin de mensagens
│   └── src/
│       └── components/
│           └── bot/
│               ├── MessageCard.tsx              # Componente de cards interativos
│               ├── QuickReplies.tsx             # Respostas rápidas
│               └── TypingIndicator.tsx          # Indicador de digitação
│
└── SUPER_APP_DOCUMENTATION.md                   # Esta documentação
```

---

## 🚀 Instalação e Configuração

### 1. Dependências

```bash
# Backend
cd digiurban/backend
npm install openai redis

# Frontend (já instalado)
cd digiurban/frontend
npm install
```

### 2. Variáveis de Ambiente

Edite o arquivo `digiurban/backend/.env`:

```env
# ============================================================
# DIGIBOT AI - Super App Features
# ============================================================

# Redis (OPCIONAL - fallback para memória se não configurado)
REDIS_URL="redis://localhost:6379"

# OpenAI (OPCIONAL - usa keywords se não configurado)
OPENAI_API_KEY="sk-proj-..." # Obter em https://platform.openai.com/api-keys

# WebSocket Server
WS_PORT=9001
```

**⚠️ IMPORTANTE:**
- `OPENAI_API_KEY` é **OPCIONAL**. Se não configurada, o bot funciona com reconhecimento baseado em keywords.
- `REDIS_URL` é **OPCIONAL**. Se não configurado, usa armazenamento em memória.
- Para experiência completa, recomenda-se configurar ambos em produção.

### 3. Iniciar Redis (Opcional)

```bash
# Docker
docker run -d -p 6379:6379 redis:latest

# Ou instalar localmente
# Windows: https://redis.io/download
# Mac: brew install redis
# Linux: apt-get install redis-server
```

### 4. Iniciar Aplicação

```bash
# Terminal 1 - Backend
cd digiurban/backend
npm run dev

# Terminal 2 - Frontend
cd digiurban/frontend
npm run dev
```

### 5. Acessar

- **Super App (Cidadão)**: http://localhost:3000/cidadao/super-app
- **Painel Admin**: http://localhost:3000/admin/mensagens
- **API do Bot**: http://localhost:3001/api/bot

---

## 🤖 DigiBot - Assistente de IA

### Arquitetura

```
Mensagem do Cidadão
        ↓
┌─────────────────────────────────────────────────┐
│           BotService (Orquestrador)             │
├─────────────────────────────────────────────────┤
│  1. ContextManager.getContext()                 │
│  2. IntentRecognitionService.recognizeIntent()  │
│  3. BotService.handleIntent()                   │
│  4. ContextManager.updateContext()              │
│  5. BotService.saveToHistory()                  │
└─────────────────────────────────────────────────┘
        ↓
 Resposta para Cidadão
```

### Intents Suportados (20+)

| Intent | Descrição | Exemplo |
|--------|-----------|---------|
| `AGENDAR_CONSULTA` | Agendar consulta médica ou exame | "Quero marcar uma consulta" |
| `VER_PROTOCOLOS` | Visualizar protocolos do cidadão | "Meus protocolos" |
| `ENVIAR_DOCUMENTO` | Enviar/anexar documentos | "Preciso enviar um comprovante" |
| `SOLICITAR_SERVICO` | Solicitar serviços municipais | "Quero solicitar cartão SUS" |
| `STATUS_PROTOCOLO` | Consultar status de protocolo | "Status do protocolo #2024-001" |
| `EDITAR_PERFIL` | Alterar dados cadastrais | "Quero mudar meu telefone" |
| `CHAT_HUMANO` | Falar com atendente humano | "Preciso falar com alguém" |
| `PESQUISAR_SERVICO` | Buscar serviços disponíveis | "Quais serviços de saúde tem?" |
| `VER_DOCUMENTOS` | Listar documentos cadastrados | "Ver meus documentos" |
| `CANCELAR_PROTOCOLO` | Cancelar protocolo | "Cancelar protocolo #123" |
| `SAUDACAO` | Cumprimentos | "Oi", "Olá", "Bom dia" |
| `AJUDA` | Pedir ajuda | "Ajuda", "O que você faz?" |
| `DESPEDIDA` | Despedidas | "Tchau", "Até logo" |

### Reconhecimento de Intenções

#### **Modo 1: OpenAI GPT-4** (Recomendado)

Se `OPENAI_API_KEY` estiver configurada:

```typescript
const intent = await intentRecognition.recognizeWithOpenAI(message, context);
// Retorna: { name: 'AGENDAR_CONSULTA', confidence: 0.95, entities: { serviceName: 'consulta' } }
```

#### **Modo 2: Keywords** (Fallback)

Se `OPENAI_API_KEY` NÃO estiver configurada:

```typescript
const intent = await intentRecognition.recognizeWithKeywords(message);
// Usa correspondência de palavras-chave para identificar intent
```

### Context Management

O bot mantém contexto da conversa usando Redis:

```typescript
interface BotContext {
  citizenId: string;
  lastIntent?: string;
  lastMessage?: string;
  conversationHistory?: Array<{
    role: 'user' | 'bot';
    content: string;
    timestamp: Date;
  }>;
  currentFlow?: string;
  flowData?: Record<string, any>;
  timestamp?: Date;
}
```

**Recursos:**
- Histórico de até 50 mensagens
- TTL de 24 horas
- Fallback para armazenamento em memória se Redis não disponível

### Service Knowledge Base

Base de conhecimento com todos os 114 serviços municipais:

**Funcionalidades:**
- Busca semântica de serviços
- Filtro por departamento
- Serviços populares (por prioridade)
- Serviços relacionados
- Trending (mais solicitados nos últimos 30 dias)
- Cache automático com refresh a cada 30 minutos

**Exemplo de uso:**

```typescript
const services = await knowledgeBase.searchServices('agendamento consulta', 10);
// Retorna até 10 serviços relacionados a agendamento de consultas
```

### Recommendation Engine

Engine de recomendações com IA:

**Algoritmo:**
1. Analisa histórico de protocolos do cidadão
2. Identifica departamentos mais utilizados
3. Busca serviços contextuais (se mensagem fornecida)
4. Combina e pontua serviços:
   - +100 pontos por match contextual
   - +50 pontos por departamento usado
   - -50 pontos para serviços já utilizados (evita repetição)
   - +10 pontos x prioridade do serviço
   - +5 pontos x posição em ranking de popularidade

**Métodos principais:**

```typescript
// Recomendações personalizadas
await recommendationEngine.getRecommendations(citizenId, context, 5);

// Próximos passos baseados no último protocolo
await recommendationEngine.recommendNextSteps(citizenId);

// Recomendações baseadas no perfil
await recommendationEngine.recommendByProfile(citizenId);

// Serviços complementares
await recommendationEngine.recommendComplementary(serviceId);

// Serviços em tendência
await recommendationEngine.getTrending(10);
```

---

## 🎨 Interface do Usuário

### Super App (Cidadão)

**Tela Principal:** [/cidadao/super-app/page.tsx](digiurban/frontend/app/cidadao/super-app/page.tsx)

#### Layout

```
┌─────────────────────────────────────────────────────┐
│  [☰]  DigiUrban                            [+]      │ Header
├─────────────────────────────────────────────────────┤
│  🤖 DigiBot (FIXO - SEMPRE 1º)        ✅ IA  [Agora]│ Bot fixo
│  👤 João Silva                              [2min]  │
│  🏛️  Secretaria de Saúde                    [1h]    │
│  📢 Canal Oficial - Educação                [Ontem] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Área de Chat]                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  😊  📎  [Digite uma mensagem...]         [Enviar]  │ Input
├─────────────────────────────────────────────────────┤
│  [🏠] [📋] [💬] [📁] [👤]                          │ Bottom Nav (Mobile)
└─────────────────────────────────────────────────────┘
```

#### Componentes de UI

**1. MessageCard** - Cards interativos para serviços/protocolos

```tsx
<MessageCards
  cards={[
    {
      id: '1',
      title: 'Agendamento de Consulta',
      description: 'Marque consultas médicas online',
      department: 'Secretaria de Saúde',
      estimatedDays: 5,
      action: {
        type: 'open_service',
        serviceId: 'srv-123',
        label: 'Solicitar'
      }
    }
  ]}
  onAction={(card) => handleCardAction(card)}
/>
```

**2. QuickReplies** - Respostas rápidas

```tsx
<QuickReplies
  replies={['Ver serviços', 'Meus protocolos', 'Falar com atendente']}
  onSelect={(reply) => sendMessage(reply)}
/>
```

**3. TypingIndicator** - Indicador de digitação

```tsx
<TypingIndicator userName="DigiBot" />
```

### Painel Admin

**Tela:** [/admin/mensagens/page.tsx](digiurban/frontend/app/admin/mensagens/page.tsx)

#### Funcionalidades

- ✅ **Dashboard de estatísticas**
  - Total de conversas
  - Conversas atendidas por IA
  - Conversas em atendimento humano
  - Taxa de satisfação

- ✅ **Lista de conversas**
  - Filtros: Todas, IA, Humano, Fechadas
  - Busca por nome do cidadão
  - Status visual (badges coloridos)

- ✅ **Chat em tempo real**
  - Visualizar conversa completa
  - Enviar mensagens como admin
  - Assumir conversa do bot (takeover)
  - Devolver conversa ao bot

- ✅ **Controles de atendimento**
  - Botão "Assumir Conversa" - transfere do bot para humano
  - Botão "Devolver ao Bot" - retorna ao atendimento automatizado

---

## 📡 API Endpoints

### Base URL: `http://localhost:3001/api/bot`

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/message` | Enviar mensagem ao bot | ✅ |
| GET | `/history` | Obter histórico de conversa | ✅ |
| POST | `/clear-history` | Limpar histórico | ✅ |
| GET | `/recommendations` | Obter recomendações | ✅ |
| GET | `/trending` | Serviços em tendência | ✅ |
| GET | `/next-steps` | Próximos passos sugeridos | ✅ |
| GET | `/search-services` | Buscar serviços | ✅ |
| GET | `/stats` | Estatísticas do bot | ✅ |
| POST | `/start-flow` | Iniciar fluxo multi-step | ✅ |
| POST | `/update-flow` | Atualizar dados do fluxo | ✅ |
| POST | `/end-flow` | Finalizar fluxo | ✅ |
| GET | `/current-flow` | Obter fluxo atual | ✅ |

### Exemplos de Uso

#### 1. Enviar Mensagem

**Request:**
```bash
curl -X POST http://localhost:3001/api/bot/message \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Quero agendar uma consulta"}'
```

**Response:**
```json
{
  "success": true,
  "response": "Encontrei os seguintes serviços de agendamento disponíveis:",
  "messageType": "card",
  "cards": [
    {
      "id": "srv-1",
      "title": "Agendamento de Consultas Médicas",
      "description": "Marque consultas médicas online",
      "department": "Secretaria de Saúde",
      "estimatedDays": 5,
      "action": {
        "type": "open_service",
        "serviceId": "srv-1",
        "label": "Solicitar"
      }
    }
  ],
  "quickReplies": ["Ver outros serviços", "Falar com atendente"],
  "messageId": "bot-1234567890"
}
```

#### 2. Obter Histórico

**Request:**
```bash
curl -X GET http://localhost:3001/api/bot/history?limit=10 \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "user-1",
      "content": "Olá",
      "senderId": "citizen-123",
      "senderType": "CITIZEN",
      "createdAt": "2026-01-16T10:00:00Z",
      "status": "READ",
      "messageType": "text"
    },
    {
      "id": "bot-1",
      "content": "Olá, João! Como posso ajudar você hoje?",
      "senderId": "bot",
      "senderType": "BOT",
      "createdAt": "2026-01-16T10:00:01Z",
      "status": "READ",
      "messageType": "text"
    }
  ]
}
```

#### 3. Obter Recomendações

**Request:**
```bash
curl -X GET "http://localhost:3001/api/bot/recommendations?limit=5&context=saúde" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "recommendations": [
    {
      "id": "srv-1",
      "name": "Agendamento de Consultas",
      "description": "Marque consultas médicas",
      "department": { "id": "dept-1", "name": "Saúde" },
      "priority": 10,
      "estimatedDays": 5
    }
  ]
}
```

---

## 🔧 Personalização

### Adicionar Novos Intents

1. **Edite IntentRecognitionService.ts:**

```typescript
// Adicionar keywords no constructor
this.intents.set('MEU_NOVO_INTENT', [
  'keyword1', 'keyword2', 'keyword3'
]);

// Adicionar no prompt do OpenAI (método recognizeWithOpenAI)
"- MEU_NOVO_INTENT: descrição do que o intent faz"
```

2. **Implemente handler em BotService.ts:**

```typescript
private async handleIntent(...) {
  switch (intent.name) {
    // ... outros cases
    case 'MEU_NOVO_INTENT':
      return await this.handleMeuNovoIntent(citizenId, intent);
  }
}

private async handleMeuNovoIntent(citizenId: string, intent: any): Promise<BotResponse> {
  // Sua lógica aqui
  return {
    response: 'Sua resposta aqui',
    messageType: 'text',
    quickReplies: ['Opção 1', 'Opção 2']
  };
}
```

### Customizar Respostas

Todas as respostas do bot podem ser personalizadas nos métodos `handle*` em [BotService.ts](digiurban/backend/src/services/bot/BotService.ts).

Exemplo:

```typescript
private async handleSaudacao(citizenId: string): Promise<BotResponse> {
  const citizen = await prisma.citizen.findUnique({
    where: { id: citizenId }
  });

  const firstName = citizen?.name?.split(' ')[0];

  // Customizar saudações
  const greetings = [
    `Olá, ${firstName}! 😊 Como posso ajudar você hoje?`,
    `Oi, ${firstName}! Tudo bem? Em que posso ser útil?`,
    // Adicione mais variações
  ];

  return {
    response: greetings[Math.floor(Math.random() * greetings.length)],
    messageType: 'text',
    quickReplies: ['Ver serviços', 'Meus protocolos', 'Ajuda']
  };
}
```

---

## 📊 Métricas e Monitoramento

### Estatísticas Disponíveis

```bash
curl -X GET http://localhost:3001/api/bot/stats \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "success": true,
  "context": {
    "totalContexts": 127,
    "redisConnected": true,
    "fallbackSize": 0
  },
  "knowledgeBase": {
    "totalServices": 114,
    "servicesByDepartment": {
      "Saúde": 11,
      "Educação": 11,
      "Assistência Social": 9
    },
    "servicesByType": {
      "COM_DADOS": 101,
      "INFORMATIVO": 13
    },
    "lastUpdate": "2026-01-16T10:00:00Z"
  },
  "redisConnected": true
}
```

### Logs

O sistema gera logs detalhados:

```
🤖 [Bot] Mensagem recebida de citizen-123: "Quero agendar consulta"
🤖 Intent reconhecido: AGENDAR_CONSULTA (confiança: 0.95)
💾 Salvando no histórico: citizen-123
✅ Rotas do bot carregadas!
```

---

## 🐛 Troubleshooting

### Problema: Bot não está respondendo

**Solução:**
1. Verificar se as rotas do bot foram carregadas:
   ```
   🤖 Carregando rotas do bot...
   ✅ Rotas do bot carregadas!
   ```

2. Verificar logs de erro no console do backend

3. Testar endpoint diretamente:
   ```bash
   curl -X POST http://localhost:3001/api/bot/message \
     -H "Content-Type: application/json" \
     -d '{"message": "teste"}'
   ```

### Problema: OpenAI API Error

**Causa:** `OPENAI_API_KEY` inválida ou não configurada

**Solução:**
- Se quiser usar OpenAI, configure uma chave válida em `.env`
- Caso contrário, o sistema usará keywords automaticamente (fallback)

### Problema: Redis Connection Failed

**Causa:** Redis não está rodando ou `REDIS_URL` incorreta

**Solução:**
- Verificar se Redis está rodando: `redis-cli ping` (deve retornar `PONG`)
- O sistema usará armazenamento em memória automaticamente (fallback)
- Para produção, recomenda-se usar Redis

### Problema: "Context não encontrado"

**Causa:** Contexto expirou (TTL de 24h)

**Solução:**
- Normal. O sistema cria automaticamente novo contexto
- Para aumentar TTL, edite `ContextManager.ts`:
  ```typescript
  private readonly TTL = 60 * 60 * 48; // 48 horas
  ```

---

## 🚀 Deploy em Produção

### Checklist

- [ ] Configurar `OPENAI_API_KEY` válida
- [ ] Configurar Redis em produção (AWS ElastiCache, Redis Cloud, etc)
- [ ] Configurar `JWT_SECRET` forte e único
- [ ] Habilitar HTTPS
- [ ] Configurar CORS para domínio de produção
- [ ] Configurar rate limiting
- [ ] Configurar monitoramento (Sentry, DataDog, etc)
- [ ] Fazer backup regular do Redis
- [ ] Configurar logs centralizados
- [ ] Testar todos os intents em produção

### Variáveis de Ambiente - Produção

```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://digiurban.com.br
CORS_ORIGIN=https://digiurban.com.br

# Database
DATABASE_URL=postgresql://...

# Redis (RECOMENDADO em produção)
REDIS_URL=redis://seu-redis-prod.com:6379

# OpenAI (RECOMENDADO em produção)
OPENAI_API_KEY=sk-proj-...

# JWT
JWT_SECRET=um-secret-super-forte-e-unico
```

---

## 📈 Roadmap Futuro

### Fase 6 - Recursos Avançados

- [ ] **Comandos de voz** - Reconhecimento de fala
- [ ] **Multi-idioma** - Suporte a PT, EN, ES
- [ ] **Anexar arquivos no chat** - Upload direto na conversa
- [ ] **Vídeo chamada** - Integração com WebRTC
- [ ] **Notificações push** - PWA notifications
- [ ] **Analytics dashboard** - Métricas avançadas
- [ ] **A/B Testing** - Testar diferentes respostas
- [ ] **Sentiment Analysis** - Análise de sentimento
- [ ] **Integração WhatsApp** - WhatsApp Business API
- [ ] **Chatbot training** - Interface para treinar o bot

### Melhorias Sugeridas

- Implementar cache de respostas frequentes
- Adicionar sistema de feedback (👍👎) nas respostas
- Criar dashboard de analytics para admin
- Implementar sistema de tags e categorização
- Adicionar suporte a anexos (imagens, PDFs)
- Criar sistema de templates de resposta
- Implementar escalação automática para humanos
- Adicionar histórico de conversas no perfil do cidadão

---

## 🤝 Contribuindo

Para adicionar novas funcionalidades:

1. Crie um branch: `git checkout -b feature/minha-funcionalidade`
2. Implemente a funcionalidade
3. Adicione testes
4. Atualize esta documentação
5. Crie um Pull Request

---

## 📄 Licença

DigiUrban © 2026 - Todos os direitos reservados

---

## 📞 Suporte

Para dúvidas ou suporte:
- Email: suporte@digiurban.com.br
- Documentação: https://docs.digiurban.com.br
- GitHub Issues: https://github.com/digiurban/issues

---

**Última atualização:** 16 de Janeiro de 2026
**Versão:** 2.0.0 - Super App Launch
