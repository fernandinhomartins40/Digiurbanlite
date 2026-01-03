# 📱 UltraZend Messages Server

Sistema de mensagens em tempo real para DigiUrban - Um WhatsApp próprio integrado à plataforma de gestão municipal.

## 🎯 Visão Geral

O **UltraZend Messages** é um servidor de mensagens completo que fornece:

- ✅ **Chat 1:1**: Conversas entre cidadãos e servidores públicos
- ✅ **Canais Oficiais**: Broadcasts para grupos de cidadãos
- ✅ **Chat P2P**: Comunicação entre cidadãos (opcional)
- ✅ **WebSocket Real-time**: Comunicação instantânea via Socket.io
- ✅ **API REST**: Interface HTTP para operações CRUD
- ✅ **Upload de Arquivos**: Imagens, documentos, áudios
- ✅ **Sistema de Moderação**: Denúncias e bloqueios
- ✅ **Integrações Externas**: WhatsApp Business, Telegram
- ✅ **Estatísticas**: Métricas e analytics

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    DigiUrban Frontend                       │
│  (React/Next.js - Painel do Cidadão + Painel Admin)        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ HTTP + WebSocket
                 ↓
┌─────────────────────────────────────────────────────────────┐
│              UltraZend Messages Server                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  WebSocket   │  │   REST API   │  │  Broadcast   │     │
│  │  (Socket.io) │  │   (Express)  │  │   Engine     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Conversation │  │   Channel    │  │   Storage    │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────┬────────────────────────────────────┬──────────────┘
         │                                     │
         │ DATABASE_URL                        │ REDIS_URL
         ↓                                     ↓
┌─────────────────┐                  ┌─────────────────┐
│   PostgreSQL    │                  │      Redis      │
│  (Shared DB)    │                  │  (Pub/Sub + )   │
│                 │                  │   Cache)        │
└─────────────────┘                  └─────────────────┘
```

## 📦 Instalação

### Pré-requisitos

- Node.js >= 22.x
- PostgreSQL >= 15.x
- Redis >= 7.x (opcional, mas recomendado)
- Docker + Docker Compose (opcional)

### Instalação Local

```bash
cd ultrazend-messages-server

# Instalar dependências
npm install

# Copiar .env.example
cp .env.example .env

# Editar .env com suas configurações
nano .env

# Gerar Prisma Client
npm run prisma:generate

# Executar migrations
npx prisma migrate dev

# Iniciar servidor em desenvolvimento
npm run dev
```

### Docker (Recomendado)

```bash
# Na raiz do projeto DigiUrban
docker-compose -f docker-compose.vps.yml up -d ultrazend-messages
```

## ⚙️ Variáveis de Ambiente

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/digiurban"

# Server
NODE_ENV=production
PORT=9001
HOST=0.0.0.0

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Messages Service
MESSAGES_SERVICE_TOKEN=ultrazend-messages-service-token
MESSAGE_SERVER_ID=default-message-server-id

# Upload/Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp,application/pdf,audio/mpeg,audio/ogg

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
MESSAGE_RATE_LIMIT_PER_MINUTE=30

# CORS
CORS_ORIGIN=*
BASE_URL=https://digiurban.com.br

# External Integrations (opcional)
WHATSAPP_PROVIDER=meta
WHATSAPP_API_KEY=
WHATSAPP_PHONE_NUMBER_ID=
TELEGRAM_BOT_TOKEN=

# Logging
LOG_LEVEL=info
```

## 🗄️ Schema do Banco de Dados

### Principais Modelos

#### **MessageServer**
Configuração do servidor de mensagens.

#### **Conversation**
Conversas 1:1 entre participantes (cidadão ↔ servidor ou cidadão ↔ cidadão).

#### **Message**
Mensagens individuais dentro de conversas.

#### **OfficialChannel**
Canais oficiais para broadcasts (ex: "Canal da Saúde").

#### **ChannelSubscription**
Inscrições de cidadãos em canais.

#### **ChannelMessage**
Mensagens publicadas em canais oficiais.

#### **ChannelDelivery**
Registro de entrega de broadcasts para cada inscrito.

#### **CitizenPrivacySettings**
Configurações de privacidade (quem pode enviar mensagens, bloqueios).

#### **MessageReport**
Denúncias de mensagens inadequadas.

#### **MessageLog**
Logs de auditoria de todos os eventos.

#### **MessageStats**
Estatísticas agregadas (por hora/dia).

## 🔌 API REST

### Autenticação

Todas as rotas (exceto `/health`) requerem autenticação via JWT:

```http
Authorization: Bearer <token>
```

### Endpoints Principais

#### **Conversas**

```http
GET    /api/conversations                    # Listar conversas do usuário
POST   /api/conversations/find-or-create     # Buscar ou criar conversa
GET    /api/conversations/:id/messages       # Mensagens de uma conversa
POST   /api/conversations/:id/archive        # Arquivar conversa
DELETE /api/conversations/:id                # Deletar conversa
POST   /api/conversations/:id/read           # Marcar como lida
GET    /api/conversations/unread-count       # Contador de não lidas
```

#### **Mensagens**

```http
POST   /api/messages/send                    # Enviar mensagem (alternativa ao WS)
DELETE /api/messages/:id                     # Deletar mensagem
```

#### **Canais Oficiais**

```http
GET    /api/channels                         # Listar canais públicos
POST   /api/channels/:id/subscribe           # Inscrever-se em canal
POST   /api/channels/:id/unsubscribe         # Cancelar inscrição
GET    /api/channels/:id/messages            # Mensagens do canal
GET    /api/channels/my-subscriptions        # Minhas inscrições
POST   /api/channels/:id/broadcast           # Enviar broadcast (admin)
```

#### **Upload**

```http
POST   /api/uploads                          # Upload de arquivo
```

#### **Denúncias**

```http
POST   /api/reports                          # Denunciar mensagem
```

#### **Admin**

```http
GET    /api/admin/stats                      # Estatísticas
POST   /api/admin/channels                   # Criar canal oficial
```

#### **Health Check**

```http
GET    /health                               # Status do servidor
```

## 🔄 WebSocket (Socket.io)

### Conexão

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:9001', {
  auth: {
    token: 'your-jwt-token'
  },
  transports: ['websocket', 'polling']
});
```

### Eventos Client → Server

```javascript
// Enviar mensagem
socket.emit('message:send', {
  conversationId: 'conv-id',
  content: 'Hello!',
  attachments: []
}, (response) => {
  console.log(response); // { success: true, message: {...} }
});

// Marcar como lida
socket.emit('message:read', {
  messageId: 'msg-id',
  conversationId: 'conv-id'
});

// Indicador de digitação
socket.emit('typing:start', { conversationId: 'conv-id' });
socket.emit('typing:stop', { conversationId: 'conv-id' });

// Entrar/sair de conversa
socket.emit('conversation:join', { conversationId: 'conv-id' });
socket.emit('conversation:leave', { conversationId: 'conv-id' });

// Ping (keep-alive)
socket.emit('ping');
```

### Eventos Server → Client

```javascript
// Nova mensagem
socket.on('message:new', (data) => {
  console.log(data.message); // Objeto Message
});

// Mensagem lida
socket.on('message:read', (data) => {
  console.log(data.messageId, data.readAt);
});

// Digitando
socket.on('typing:start', (data) => {
  console.log(`${data.userId} está digitando...`);
});

socket.on('typing:stop', (data) => {
  console.log(`${data.userId} parou de digitar`);
});

// Nova mensagem de canal
socket.on('channel:message', (data) => {
  console.log('Nova mensagem no canal', data.channelId);
});

// Pong (resposta ao ping)
socket.on('pong');
```

## 🚀 Funcionalidades Avançadas

### 1. **Broadcast para Canais**

```javascript
// Backend (via adapter)
await ultraZendMessages.broadcastToChannel({
  channelId: 'channel-id',
  title: 'Aviso Importante',
  content: 'Vacinação COVID-19 disponível em todas as UBS',
  scheduledFor: new Date('2025-01-10T10:00:00'), // opcional
  priority: 1  // 1=urgent, 3=normal, 5=low
});
```

### 2. **Notificação Automática de Protocolo**

```javascript
// Quando protocolo é criado
import messageNotificationService from './lib/messages/MessageNotificationService';

await messageNotificationService.notifyProtocolCreated(protocolId);
```

### 3. **WhatsApp Integration**

```javascript
import whatsAppAdapter from './delivery/WhatsAppAdapter';

// Enviar mensagem de texto
await whatsAppAdapter.sendTextMessage(
  '5511999999999',
  'Seu protocolo foi atualizado!'
);

// Enviar mídia
await whatsAppAdapter.sendMediaMessage(
  '5511999999999',
  'https://example.com/image.jpg',
  'Confira o documento'
);

// Template (pré-aprovado)
await whatsAppAdapter.sendTemplateMessage(
  '5511999999999',
  'protocol_update',
  ['João', 'PROGRESSO', '12345']
);
```

### 4. **Telegram Integration**

```javascript
import telegramAdapter from './delivery/TelegramAdapter';

// Enviar mensagem
await telegramAdapter.sendMessage(
  chatId,
  'Olá! Seu protocolo foi atualizado.'
);

// Enviar com botões
await telegramAdapter.sendMessageWithInlineKeyboard(
  chatId,
  'Escolha uma opção:',
  [
    [{ text: 'Ver Protocolo', url: 'https://...' }],
    [{ text: 'Falar com Atendente', callbackData: 'contact_support' }]
  ]
);
```

### 5. **Sistema de Moderação**

```javascript
// Denunciar mensagem
await fetch('/api/reports', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messageId: 'msg-id',
    reason: 'SPAM',  // SPAM, HARASSMENT, INAPPROPRIATE_CONTENT, etc
    description: 'Mensagem de propaganda não solicitada'
  })
});
```

## 📊 Estatísticas e Monitoramento

### Coleta Automática

O servidor coleta estatísticas automaticamente:

- **Por Hora**: Agrega dados a cada hora
- **Por Dia**: Consolida métricas diárias
- **Métricas**: Total de mensagens, usuários ativos, broadcasts, denúncias

### Acessar Estatísticas

```javascript
const stats = await fetch('/api/admin/stats', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});

// Retorna:
{
  date: "2025-01-03",
  totalMessages: 1523,
  activeUsers: 45,
  activeCitizens: 892,
  channelMessages: 12,
  reportsCreated: 2,
  avgResponseTime: 1.5
}
```

## 🛡️ Segurança

### Rate Limiting

- **Global**: 100 requests/min por IP
- **Mensagens**: 30 mensagens/min por usuário

### Autenticação

- JWT com expiração configurável
- Refresh tokens (implementar se necessário)

### Validação

- Zod para validação de payloads
- Sanitização de HTML/XSS
- Upload de arquivos com validação de tipo/tamanho

### Privacidade

- Cidadãos podem bloquear outros usuários
- Configurações de privacidade individuais
- Soft delete de mensagens

## 🔧 Desenvolvimento

### Estrutura de Pastas

```
ultrazend-messages-server/
├── src/
│   ├── server/
│   │   ├── WebSocketServer.ts       # Socket.io server
│   │   └── ExpressServer.ts         # HTTP API
│   ├── delivery/
│   │   ├── ConversationService.ts   # Lógica de conversas
│   │   ├── ChannelService.ts        # Lógica de canais
│   │   ├── WhatsAppAdapter.ts       # Integração WhatsApp
│   │   └── TelegramAdapter.ts       # Integração Telegram
│   ├── storage/
│   │   └── FileStorage.ts           # Gerenciamento de uploads
│   ├── security/
│   │   └── MessageEncryption.ts     # E2E encryption (futuro)
│   ├── utils/
│   │   ├── logger.ts                # Winston logger
│   │   ├── jwt.ts                   # JWT helpers
│   │   └── prisma.ts                # Prisma client
│   └── index.ts                     # Entry point
├── prisma/
│   └── schema.prisma                # Database schema
├── Dockerfile
├── package.json
└── README.md
```

### Scripts Úteis

```bash
# Desenvolvimento
npm run dev                   # Iniciar em modo watch
npm run build                 # Build TypeScript
npm run start                 # Produção

# Database
npx prisma generate           # Gerar Prisma Client
npx prisma migrate dev        # Criar migration
npx prisma migrate deploy     # Aplicar migrations (prod)
npx prisma studio             # GUI do banco

# Logs
tail -f logs/combined.log     # Ver logs em tempo real
```

## 🚢 Deploy

### Usando Docker Compose

```bash
# Build e start
docker-compose -f docker-compose.vps.yml up -d ultrazend-messages

# Ver logs
docker logs -f ultrazend-messages

# Restart
docker-compose -f docker-compose.vps.yml restart ultrazend-messages
```

### Variáveis de Ambiente Produção

Certifique-se de configurar no `.env` ou `docker-compose.vps.yml`:

- `DATABASE_URL`: Connection string do PostgreSQL
- `REDIS_URL`: Connection string do Redis
- `JWT_SECRET`: Chave secreta forte (mínimo 32 caracteres)
- `CORS_ORIGIN`: Domínio do frontend
- `BASE_URL`: URL pública do servidor

## 📚 Exemplos de Uso

### Integração no DigiUrban Backend

```typescript
// digiurban/backend/src/routes/protocols.ts
import ultraZendMessages from '../lib/messages/UltraZendMessagesAdapter';
import messageNotificationService from '../lib/messages/MessageNotificationService';

// Quando protocolo é criado
app.post('/api/protocols', authMiddleware, async (req, res) => {
  const protocol = await prisma.protocolSimplified.create({
    data: req.body
  });

  // Notificar cidadão via mensagem
  await messageNotificationService.notifyProtocolCreated(protocol.id);

  res.json(protocol);
});
```

### Integração no Frontend (React)

```tsx
// digiurban/frontend/src/pages/citizen/messages.tsx
import ChatWindow from '@/components/Messages/ChatWindow';
import ConversationList from '@/components/Messages/ConversationList';

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState(null);
  const token = useAuthToken();

  return (
    <div className="grid grid-cols-3 gap-4 h-screen">
      <div className="col-span-1">
        <ConversationList
          token={token}
          currentUserId={user.id}
          currentUserType="CITIZEN"
          onSelectConversation={setSelectedConversation}
        />
      </div>
      <div className="col-span-2">
        {selectedConversation && (
          <ChatWindow
            conversationId={selectedConversation}
            token={token}
            currentUserId={user.id}
            currentUserType="CITIZEN"
          />
        )}
      </div>
    </div>
  );
}
```

## 🐛 Troubleshooting

### WebSocket não conecta

- Verificar se porta 9001 está acessível
- Verificar CORS_ORIGIN
- Verificar token JWT válido

### Mensagens não chegam

- Verificar Redis está rodando (se configurado)
- Ver logs: `docker logs ultrazend-messages`
- Verificar usuário está na sala correta

### Upload falha

- Verificar MAX_FILE_SIZE
- Verificar ALLOWED_FILE_TYPES
- Verificar permissões da pasta `uploads/`

## 📖 Referências

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Telegram Bot API](https://core.telegram.org/bots/api)

## 📄 Licença

MIT

---

**Desenvolvido com ❤️ pela equipe DigiUrban**
