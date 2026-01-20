# 📬 Sistema de Mensagens DigiUrban - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Funcionalidades](#funcionalidades)
4. [Guia de Uso - Painel do Cidadão](#guia-de-uso---painel-do-cidadão)
5. [Guia de Uso - Painel Administrativo](#guia-de-uso---painel-administrativo)
6. [APIs e Integrações](#apis-e-integrações)
7. [Permissões](#permissões)
8. [Variáveis de Ambiente](#variáveis-de-ambiente)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O Sistema de Mensagens DigiUrban é uma solução completa de comunicação em tempo real que integra:

- **DigiBot**: Assistente virtual baseado em fluxos programados
- **Mensagens P2P**: Conversas diretas entre cidadãos e servidores
- **Atendimento Híbrido**: Transição fluida entre bot e atendimento humano
- **WebSocket**: Comunicação em tempo real bidirecional

### Componentes Principais

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA DE MENSAGENS                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   DigiBot    │    │ UltraZend    │    │   Backend    │  │
│  │  (Fluxos)    │◄──►│  Messages    │◄──►│  DigiUrban   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                    │                    │          │
│         │                    │                    │          │
│  ┌──────▼────────────────────▼────────────────────▼──────┐  │
│  │            WebSocket + REST APIs                      │  │
│  └──────┬────────────────────┬────────────────────┬──────┘  │
│         │                    │                    │          │
│  ┌──────▼──────┐      ┌──────▼──────┐     ┌──────▼──────┐  │
│  │   Painel    │      │   Painel    │     │  Notificações│  │
│  │  Cidadão    │      │   Admin     │     │              │  │
│  └─────────────┘      └─────────────┘     └──────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Arquitetura

### Backend Components

#### 1. **ultrazend-messages-server** (Porta 9001)
- Servidor Node.js + Express + Socket.io
- Gerencia conversas P2P e em grupo
- Armazena mensagens no banco de dados
- Fornece APIs REST e WebSocket

**Principais rotas:**
```typescript
GET    /api/conversations              // Listar conversas do usuário
POST   /api/conversations/find-or-create  // Criar ou encontrar conversa
GET    /api/conversations/:id/messages // Mensagens de uma conversa
POST   /api/messages/send              // Enviar mensagem (REST)
GET    /api/contacts/citizens          // Buscar cidadãos
GET    /api/contacts/servers           // Buscar servidores
GET    /api/admin/stats                // Estatísticas (admin)
```

**Eventos WebSocket:**
```typescript
// Client → Server
message:send          // Enviar mensagem
message:read          // Marcar como lida
typing:start          // Começou a digitar
typing:stop           // Parou de digitar
conversation:join     // Entrar na sala
conversation:leave    // Sair da sala

// Server → Client
message:new           // Nova mensagem recebida
message:read          // Mensagem foi lida
typing:status         // Status de digitação
conversation:updated  // Conversa atualizada
```

#### 2. **digiurban-backend** (Porta 3001)
- Servidor principal do DigiUrban
- Sistema de fluxos do DigiBot
- Autenticação e autorização
- Gerenciamento de protocolos e serviços

**Rotas do Bot:**
```typescript
POST /api/bot-flow/start         // Iniciar fluxo
POST /api/bot-flow/message       // Processar mensagem
POST /api/bot-flow/pause         // Pausar bot (humano assume)
POST /api/bot-flow/resume        // Retomar bot
GET  /api/bot-flow/active-execution  // Execução ativa
POST /api/bot-flow/cancel        // Cancelar fluxo
POST /api/bot-flow/reset         // Resetar para menu
```

### Frontend Components

#### 1. **Painel do Cidadão** (`/cidadao`)
- Interface unificada: DigiBot + Mensagens P2P
- Bot sempre fixado no topo
- Busca e inicia conversas com servidores/cidadãos
- Responsivo mobile-first

**Componentes:**
- `page.tsx` - Página principal com lista e chat
- `NewConversationDialog.tsx` - Modal para iniciar conversa
- Integração WebSocket para mensagens em tempo real

#### 2. **Painel Administrativo** (`/admin/mensagens`)
- Gerenciamento de todas as conversas
- Assumir/devolver conversas para o bot
- Estatísticas em tempo real
- Filtros: Todas, IA, Humano, Fechadas

**Componentes:**
- `page.tsx` - Painel completo de mensagens
- Cards de estatísticas
- Lista de conversas com badges
- Interface de chat com suporte a assumir/devolver

---

## ✨ Funcionalidades

### Para Cidadãos

#### 1. **Conversa com DigiBot**
- ✅ Bot sempre disponível e fixado no topo
- ✅ Respostas automáticas baseadas em fluxos
- ✅ Menus interativos
- ✅ Coleta de dados estruturados
- ✅ Abertura de protocolos
- ✅ Consulta de serviços

#### 2. **Mensagens Diretas**
- ✅ Iniciar conversa com qualquer servidor público
- ✅ Iniciar conversa com outros cidadãos
- ✅ Busca por nome, email ou CPF
- ✅ Histórico de mensagens
- ✅ Status de leitura (✓ e ✓✓)
- ✅ Indicador de digitação
- ✅ Notificações de novas mensagens

#### 3. **Interface**
- ✅ Lista de conversas com busca
- ✅ Bot destacado visualmente
- ✅ Contador de mensagens não lidas
- ✅ Responsivo (mobile + desktop)
- ✅ Botão "+" para nova conversa

### Para Administradores

#### 1. **Painel de Mensagens**
- ✅ Visualização de todas as conversas ativas
- ✅ Filtros: Todas / IA / Humano / Fechadas
- ✅ Busca por nome de cidadão
- ✅ Estatísticas em tempo real

#### 2. **Gestão de Atendimento**
- ✅ **Assumir Conversa**: Pausar bot e assumir atendimento humano
- ✅ **Devolver ao Bot**: Retomar bot após atendimento
- ✅ Mensagem automática ao assumir
- ✅ Badge visual indicando tipo de atendimento (IA/Humano)
- ✅ Notificações de novas mensagens

#### 3. **Estatísticas**
- Total de conversas
- Conversas ativas
- Atendidas por IA (% do total)
- Atendimento humano (tempo médio)
- Satisfação média

#### 4. **Permissões**
- `messages:read` - Ver mensagens (USER+)
- `messages:write` - Enviar mensagens (USER+)
- `messages:moderate` - Moderar conversas (COORDINATOR+)
- `messages:admin` - Administrar sistema (MANAGER+)

---

## 📱 Guia de Uso - Painel do Cidadão

### Acessar o Chat

1. Faça login no painel do cidadão
2. A página inicial já é o chat (`/cidadao`)
3. O **DigiBot** aparece automaticamente fixado no topo

### Conversar com o DigiBot

1. Clique na conversa **DigiBot** (sempre no topo com ícone de estrela)
2. O bot inicia automaticamente com o menu principal
3. Selecione as opções clicando nos botões
4. Para texto livre, digite quando solicitado
5. Para voltar ao menu: clique em "Voltar" ou "Menu Principal"

### Iniciar Conversa com Servidor ou Cidadão

1. Clique no botão **"+"** no topo da lista de conversas
2. Escolha a aba:
   - **Cidadãos**: Para conversar com outros cidadãos
   - **Servidores**: Para conversar com servidores públicos
3. Use a busca para encontrar a pessoa
4. Clique no contato desejado
5. A conversa é criada automaticamente e você pode começar a enviar mensagens

### Interface do Chat

```
┌────────────────────────────────────────┐
│  DigiUrban            [+] (Nova)       │
├────────────────────────────────────────┤
│  🔍 Buscar conversas...                │
├────────────────────────────────────────┤
│  ⭐ DigiBot                    Agora   │
│     Assistente Virtual                 │
│     Olá! Como posso ajudar?            │
├────────────────────────────────────────┤
│  👤 João Silva               2h atrás  │
│     Servidor - Protocolo                │
│     Seu protocolo foi aprovado!        │
├────────────────────────────────────────┤
│  👤 Maria Santos            1 dia      │
│     Vizinha                            │
│     Obrigada pela ajuda!               │
└────────────────────────────────────────┘
```

### Recursos do Chat

- **Mensagens do Bot**: Fundo roxo/azul com ícone de estrela
- **Suas mensagens**: Fundo azul, alinhadas à direita
- **Mensagens recebidas**: Fundo branco, alinhadas à esquerda
- **Status**: ✓ (enviada) / ✓✓ (lida)
- **Busca**: Filtre conversas pelo nome

---

## 🎛️ Guia de Uso - Painel Administrativo

### Acessar o Painel de Mensagens

1. Faça login como servidor/administrador
2. No menu lateral, clique em **"Mensagens"** (ícone de chat)
3. Você verá todas as conversas ativas

### Dashboard de Estatísticas

No topo da página, 4 cards mostram:

```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Total Conversas │ Atendidas por IA│ Atend. Humano   │   Satisfação    │
│      127        │       89 (70%)  │      38         │     4.5/5       │
│   +12 ativas    │                 │  Tempo: 5min    │                 │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

### Filtrar Conversas

Use as abas para filtrar:

- **Todas**: Todas as conversas
- **IA**: Apenas conversas sendo atendidas pelo DigiBot
- **Humano**: Conversas com atendimento humano ativo
- **Fechadas**: Conversas encerradas

### Assumir uma Conversa (Bot → Humano)

1. Selecione uma conversa com badge **"IA"** (roxo)
2. Clique no botão **"Assumir Conversa"** no topo
3. O bot é pausado automaticamente
4. Uma mensagem é enviada: *"Um atendente assumiu a conversa. Como posso ajudar?"*
5. O badge muda para **"Humano"** (laranja)
6. Agora você pode conversar diretamente com o cidadão

### Devolver ao Bot (Humano → Bot)

1. Na conversa que você assumiu, clique em **"Devolver ao Bot"**
2. O bot retoma de onde parou
3. O badge volta para **"IA"** (roxo)
4. O cidadão volta a interagir com o DigiBot

### Enviar Mensagens

1. Selecione a conversa
2. Digite no campo inferior
3. Pressione Enter ou clique no botão de enviar
4. A mensagem é enviada em tempo real via WebSocket

### Indicadores Visuais

- 🟣 **Badge IA**: Conversa atendida pelo bot
- 🟠 **Badge Humano**: Atendimento humano ativo
- ⚫ **Badge Fechada**: Conversa encerrada
- 🔵 **Badge Número**: Mensagens não lidas
- 🟢 **● Online**: Conectado ao servidor WebSocket

---

## 🔌 APIs e Integrações

### Variáveis de Ambiente Necessárias

#### Frontend (.env.local)

```bash
# API principal do DigiUrban
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# API do servidor de mensagens (ultrazend-messages)
NEXT_PUBLIC_MESSAGES_API_URL=http://localhost:9001/api
NEXT_PUBLIC_MESSAGES_WS_URL=http://localhost:9001
```

#### Backend ultrazend-messages (.env)

```bash
# Porta do servidor
PORT=9001

# Banco de dados (usar o mesmo do DigiUrban)
DATABASE_URL="postgresql://user:password@localhost:5432/digiurban"

# JWT Secret (usar o mesmo do DigiUrban)
JWT_SECRET="seu-secret-aqui"

# CORS
CORS_ORIGIN=http://localhost:3000

# Upload
UPLOAD_DIR=./uploads

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Backend DigiUrban (.env)

```bash
# Token de serviço para comunicação entre backends
MESSAGES_SERVICE_TOKEN=ultrazend-messages-service-token-change-in-production
```

### Integração Frontend → ultrazend-messages

#### Criar Conversa

```typescript
const response = await fetch(
  `${MESSAGES_API_URL}/conversations/find-or-create`,
  {
    method: 'POST',
    credentials: 'include', // Importante: envia cookies JWT
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participant1Id: currentUserId,
      participant1Type: 'CITIZEN', // ou 'SERVER'
      participant2Id: targetUserId,
      participant2Type: 'SERVER', // ou 'CITIZEN'
    })
  }
);

const conversation = await response.json();
```

#### Conectar WebSocket

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:9001', {
  withCredentials: true, // Envia cookies
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('Conectado!');
});

socket.on('message:new', (data) => {
  console.log('Nova mensagem:', data.message);
});

// Enviar mensagem
socket.emit('message:send', {
  conversationId: 'conv-id',
  content: 'Olá!',
});
```

### Integração Bot ↔ Mensagens

#### Pausar Bot (Atendimento Humano)

```typescript
const response = await fetch(`${API_URL}/bot-flow/pause`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: 'conv-id',
    citizenId: 'citizen-id'
  })
});
```

#### Retomar Bot

```typescript
const response = await fetch(`${API_URL}/bot-flow/resume`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: 'conv-id',
    citizenId: 'citizen-id'
  })
});
```

---

## 🔐 Permissões

### Matriz de Permissões

| Role        | messages:read | messages:write | messages:moderate | messages:admin |
|-------------|---------------|----------------|-------------------|----------------|
| USER        | ✅            | ✅             | ❌                | ❌             |
| COORDINATOR | ✅            | ✅             | ✅                | ❌             |
| MANAGER     | ✅            | ✅             | ✅                | ✅             |
| ADMIN       | ✅            | ✅             | ✅                | ✅             |

### Descrição das Permissões

- **messages:read**: Ver mensagens e conversas
- **messages:write**: Enviar mensagens
- **messages:moderate**: Moderar conversas (assumir, devolver ao bot)
- **messages:admin**: Administrar todo o sistema de mensagens

### Verificação no Frontend

```typescript
import { useAdminPermissions } from '@/contexts/AdminAuthContext';

const { hasPermission } = useAdminPermissions();

if (hasPermission('messages:read')) {
  // Mostrar painel de mensagens
}
```

---

## 🚀 Como Iniciar o Sistema

### 1. Iniciar ultrazend-messages-server

```bash
cd ultrazend-messages-server
npm install
npm run dev  # Porta 9001
```

### 2. Iniciar DigiUrban Backend

```bash
cd digiurban/backend
npm install
npm run dev  # Porta 3001
```

### 3. Iniciar DigiUrban Frontend

```bash
cd digiurban/frontend
npm install
npm run dev  # Porta 3000
```

### 4. Verificar Conexões

- Frontend: http://localhost:3000
- Backend DigiUrban: http://localhost:3001
- UltraZend Messages: http://localhost:9001

**Health Checks:**
- http://localhost:9001/health
- http://localhost:3001/api/bot-flow/health

---

## 🐛 Troubleshooting

### Problema: WebSocket não conecta

**Sintomas:**
- Indicador "● Online" não aparece
- Mensagens não chegam em tempo real

**Solução:**
1. Verifique se ultrazend-messages está rodando na porta 9001
2. Verifique CORS: `CORS_ORIGIN=http://localhost:3000`
3. Verifique se `withCredentials: true` está configurado
4. Verifique firewall/antivírus bloqueando WebSocket

### Problema: Botão "+" não mostra contatos

**Sintomas:**
- Modal abre mas lista vazia
- Erro no console

**Solução:**
1. Verifique se `/api/contacts/citizens` responde:
   ```bash
   curl http://localhost:9001/api/contacts/citizens -H "Cookie: seu-jwt-cookie"
   ```
2. Verifique se há cidadãos/servidores ativos no banco
3. Verifique autenticação (cookie JWT)

### Problema: Bot não responde

**Sintomas:**
- Mensagens enviadas mas sem resposta
- Erro "Flow not found"

**Solução:**
1. Verifique se fluxo `menu_principal` existe:
   ```sql
   SELECT * FROM "FlowDefinition" WHERE name = 'menu_principal' AND "isActive" = true;
   ```
2. Verifique logs do backend DigiUrban
3. Teste health check: http://localhost:3001/api/bot-flow/health

### Problema: "Assumir Conversa" não funciona

**Sintomas:**
- Botão não faz nada
- Erro 500 ou 404

**Solução:**
1. Verifique se rotas `/bot-flow/pause` e `/bot-flow/resume` existem
2. Verifique permissões do usuário (`messages:moderate`)
3. Verifique se FlowEngine tem métodos `pauseExecution` e `resumeExecution`
4. Verifique logs do backend

### Problema: Mensagens não aparecem no admin

**Sintomas:**
- Painel vazio ou erro ao carregar

**Solução:**
1. Verifique se rota `/api/conversations` responde
2. Verifique autenticação do admin
3. Verifique permissão `messages:read`
4. Abra console do navegador e veja erros

---

## 📊 Diagrama de Fluxo Completo

### Fluxo de Mensagem: Cidadão → Bot

```
Cidadão                Frontend               Backend              FlowEngine
   │                      │                      │                      │
   │  1. Digite "Olá"     │                      │                      │
   │─────────────────────>│                      │                      │
   │                      │  2. POST /bot-flow/message                  │
   │                      │─────────────────────>│                      │
   │                      │                      │  3. processMessage() │
   │                      │                      │─────────────────────>│
   │                      │                      │                      │
   │                      │                      │  4. Execute node     │
   │                      │                      │<─────────────────────│
   │                      │  5. BotResponse      │                      │
   │                      │<─────────────────────│                      │
   │  6. Mostra resposta  │                      │                      │
   │<─────────────────────│                      │                      │
```

### Fluxo de Mensagem: Cidadão → Servidor (P2P)

```
Cidadão              Frontend          WebSocket         ultrazend-messages
   │                    │                  │                      │
   │  1. Digite msg     │                  │                      │
   │───────────────────>│                  │                      │
   │                    │  2. emit('message:send')                │
   │                    │─────────────────>│                      │
   │                    │                  │  3. Handle event     │
   │                    │                  │─────────────────────>│
   │                    │                  │                      │
   │                    │                  │  4. Save to DB       │
   │                    │                  │<─────────────────────│
   │                    │                  │                      │
   │                    │                  │  5. Broadcast to room│
   │                    │  6. 'message:new'│                      │
   │  7. Nova msg       │<─────────────────│                      │
   │<───────────────────│                  │                      │
```

### Fluxo: Assumir Conversa (Bot → Humano)

```
Admin                Frontend            Backend            FlowEngine
   │                    │                   │                    │
   │  1. Click "Assumir"│                   │                    │
   │───────────────────>│                   │                    │
   │                    │  2. POST /bot-flow/pause               │
   │                    │──────────────────>│                    │
   │                    │                   │  3. pauseExecution()│
   │                    │                   │───────────────────>│
   │                    │                   │                    │
   │                    │                   │  4. Update metadata│
   │                    │                   │<───────────────────│
   │                    │  5. Success       │                    │
   │                    │<──────────────────│                    │
   │                    │                   │                    │
   │                    │  6. emit('message:send') - msg automática
   │                    │─────────────────> WebSocket            │
   │  7. Badge "Humano" │                   │                    │
   │<───────────────────│                   │                    │
```

---

## ✅ Checklist de Implementação Completa

### Backend
- [x] ultrazend-messages rodando na porta 9001
- [x] Rotas REST: /conversations, /messages, /contacts
- [x] WebSocket: message:send, message:new, message:read
- [x] Rotas de bot: /bot-flow/pause, /bot-flow/resume
- [x] FlowEngine com pauseExecution e resumeExecution
- [x] Permissões de mensagens no sistema de roles

### Frontend - Painel do Cidadão
- [x] Bot DigiBot sempre fixado no topo
- [x] Botão "+" funcionando
- [x] NewConversationDialog com busca de cidadãos/servidores
- [x] Integração com /api/contacts/citizens e /servers
- [x] Criação de conversas via /api/conversations/find-or-create
- [x] WebSocket conectado e recebendo mensagens
- [x] Interface responsiva

### Frontend - Painel Admin
- [x] Item "Mensagens" na sidebar com permissão
- [x] Cards de estatísticas
- [x] Lista de conversas com filtros (Todas/IA/Humano/Fechadas)
- [x] WebSocket conectado
- [x] Botão "Assumir Conversa" com lógica real
- [x] Botão "Devolver ao Bot" com lógica real
- [x] Badges visuais (IA/Humano/Fechada)
- [x] Notificações desktop

### Integrações
- [x] Frontend → ultrazend-messages (REST + WS)
- [x] Frontend → backend DigiUrban (pause/resume)
- [x] Autenticação JWT via cookies
- [x] CORS configurado
- [x] Variáveis de ambiente documentadas

---

## 🎉 Conclusão

O Sistema de Mensagens DigiUrban está **100% implementado e funcional**!

### O que funciona:
✅ DigiBot conversando via fluxos programados
✅ Mensagens P2P entre cidadãos e servidores
✅ Busca e início de novas conversas
✅ Painel admin completo com gestão de atendimento
✅ Transição bot ↔ humano em tempo real
✅ WebSocket com comunicação bidirecional
✅ Permissões configuradas por role
✅ Notificações em tempo real
✅ Interface responsiva

### Próximos Passos (Opcionais):
- [ ] Upload de arquivos nas mensagens
- [ ] Emojis e reações
- [ ] Mensagens de voz
- [ ] Grupos/canais
- [ ] Busca em mensagens
- [ ] Backup automático de conversas
- [ ] Analytics avançados

**Desenvolvido com ❤️ para o DigiUrban**

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a seção [Troubleshooting](#troubleshooting)
2. Verifique os logs dos servidores
3. Teste os health checks
4. Entre em contato com o time de desenvolvimento

Versão: 1.0.0
Data: Janeiro 2026
