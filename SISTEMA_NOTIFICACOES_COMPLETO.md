# 🔔 Sistema de Notificações e Push Notifications - DigiUrban

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Funcionalidades](#funcionalidades)
4. [Instalação e Configuração](#instalação-e-configuração)
5. [Uso](#uso)
6. [Referência de API](#referência-de-api)
7. [Tipos de Notificações](#tipos-de-notificações)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Sistema completo de notificações multi-canal com suporte a:
- ✅ **Web Notifications** (SSE - Server-Sent Events)
- ✅ **Push Notifications** (Web Push API)
- ✅ **Email** (Nodemailer)
- 🔮 **SMS** (Futuro - Twilio/AWS SNS)

### Características

- **100% de cobertura** - Todos os eventos importantes geram notificações
- **Multi-canal** - Web, Push, Email, SMS
- **Escalável** - Queue system (BullMQ) + Redis
- **Resiliente** - Retry automático, logs de auditoria
- **Personalizável** - Preferências granulares por usuário
- **Performance** - Processamento assíncrono não-bloqueante

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    NOTIFICATION SYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   TRIGGERS   │───▶│  QUEUE/REDIS │───▶│   DELIVERY   │  │
│  │  (Events)    │    │  (BullMQ)    │    │  (Channels)  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│        │                    │                     │         │
│        │                    │                     ├─▶ SSE   │
│        │                    │                     ├─▶ Push  │
│        │                    │                     ├─▶ Email │
│        │                    │                     └─▶ SMS   │
│        │                    │                              │
│        ▼                    ▼                              │
│  ┌──────────────────────────────────────────────┐         │
│  │         NOTIFICATION PREFERENCES              │         │
│  │  (User/Citizen controls what & how)          │         │
│  └──────────────────────────────────────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Componentes

#### Backend

1. **Models (Prisma)**
   - `Notification` - Notificações persistentes (web)
   - `PushSubscription` - Subscriptions de push
   - `NotificationPreference` - Preferências do usuário
   - `NotificationLog` - Auditoria e retry

2. **Services**
   - `notification.service.ts` - Serviço central
   - `notification-channels/` - Handlers por canal (SSE, Push, Email, SMS)
   - `notification-triggers.ts` - Gatilhos de eventos

3. **Workers**
   - `notification.worker.ts` - Processa fila (BullMQ)

4. **Cron Jobs**
   - `notification.jobs.ts` - SLA expiring, overdue, cleanup

5. **Routes**
   - `/api/push/*` - Push subscriptions
   - `/api/notifications/*` - SSE stream + preferências
   - `/api/citizen/notifications/*` - CRUD de notificações

#### Frontend

1. **Hooks**
   - `usePushNotifications.ts` - Gerenciar push
   - `useNotifications.ts` - SSE stream

2. **Components**
   - `NotificationCenter.tsx` - Dropdown com notificações
   - `NotificationPreferences.tsx` - Configurações

3. **Service Worker**
   - `sw-push-handler.js` - Handlers de push e clicks

---

## ✨ Funcionalidades

### Para Cidadãos

- 🔔 **Centro de Notificações** - Bell icon com badge de contador
- 📱 **Push Notifications** - Notificações mesmo com app fechado
- ✉️ **Email** - Notificações importantes por email
- ⚙️ **Preferências** - Controle total sobre canais e tipos
- 🌙 **Quiet Hours** - Horário de silêncio configurável
- 📊 **Resumo Diário** - Email com resumo diário (futuro)

### Para Servidores/Admin

- 🔔 **Notificações de Atribuição** - Novos protocolos atribuídos
- ⚠️ **Alertas de SLA** - Protocolos próximos de vencer
- 🚨 **Protocolos Vencidos** - Alertas para gestores
- 📈 **Estatísticas** - Dashboard de notificações enviadas

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- PostgreSQL (ou banco existente)
- Redis (para queue)

### 1. Backend - Instalar Dependências

```bash
cd digiurban/backend
npm install
```

Dependências adicionadas:
- `bullmq` - Queue system
- `ioredis` - Cliente Redis
- `web-push` - Web Push API

### 2. Gerar Chaves VAPID

```bash
npx web-push generate-vapid-keys
```

Copiar as chaves geradas para `.env`:

```env
VAPID_PUBLIC_KEY="BH..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:contato@digiurban.com.br"
```

### 3. Configurar Redis

Instalar Redis (se necessário):

**Linux/Mac:**
```bash
sudo apt install redis-server  # Ubuntu/Debian
brew install redis             # macOS
```

**Windows:**
```bash
# Usar Docker
docker run -d -p 6379:6379 redis:alpine
```

**Ou usar Redis Cloud (grátis):**
```env
REDIS_URL="redis://user:password@host:port"
```

### 4. Rodar Migrações do Prisma

```bash
npx prisma generate
npx prisma db push
```

### 5. Configurar Email (Opcional)

Para notificações por email, configurar SMTP em `.env`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="seu-email@gmail.com"
SMTP_PASS="sua-senha-de-app"  # Gmail: https://myaccount.google.com/apppasswords
```

### 6. Iniciar Backend

```bash
npm run dev
```

Logs esperados:
```
✅ Redis connected
✅ Notification worker started
✅ Notification cron jobs initialized
✅ [SSE] Cliente conectado
```

### 7. Frontend - Configurar VAPID Public Key

Adicionar em `digiurban/frontend/.env.local`:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BH..."  # Mesma chave pública do backend
```

### 8. Build Frontend (para gerar service worker)

```bash
cd digiurban/frontend
npm run build
npm start
```

---

## 📖 Uso

### Para Desenvolvedores - Disparar Notificações

#### 1. Usar o Serviço Diretamente

```typescript
import notificationService from '../services/notification.service';

await notificationService.notify({
  recipientType: 'citizen',
  recipientId: 'citizen-id',
  type: 'PROTOCOL_STATUS',
  title: 'Protocolo atualizado',
  message: 'Seu protocolo foi atualizado para Em Progresso',
  data: {
    protocolId: 'protocol-id',
    url: '/cidadao/protocolos/123',
  },
  priority: 'normal',
  channels: ['web', 'push'], // Opcional - usa preferências se não especificado
});
```

#### 2. Usar os Triggers

```typescript
import NotificationTriggers from '../services/notification-triggers';

// Protocolo criado
await NotificationTriggers.onProtocolCreated('protocol-id');

// Status alterado
await NotificationTriggers.onProtocolStatusChanged(
  'protocol-id',
  'VINCULADO',
  'PROGRESSO'
);

// Documento aprovado
await NotificationTriggers.onDocumentApproved('document-id');
```

### Para Usuários - Configurar Preferências

#### Frontend - Centro de Notificações

```tsx
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

// No header/navbar
<NotificationCenter />
```

#### Frontend - Preferências

```tsx
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';

// Na página de configurações
<NotificationPreferences />
```

---

## 📡 Referência de API

### Push Subscriptions

#### `POST /api/push/subscribe`
Registrar subscription de push notification

**Request:**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "BH...",
      "auth": "..."
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription registrada com sucesso",
  "subscription": {
    "id": "sub-id",
    "createdAt": "2026-02-06T..."
  }
}
```

#### `POST /api/push/unsubscribe`
Remover subscription

**Request:**
```json
{
  "endpoint": "https://fcm.googleapis.com/..."
}
```

#### `GET /api/push/vapid-public-key`
Obter chave pública VAPID (público)

**Response:**
```json
{
  "success": true,
  "publicKey": "BH..."
}
```

### Notification Preferences

#### `GET /api/notifications/preferences`
Obter preferências do usuário

**Response:**
```json
{
  "success": true,
  "preferences": {
    "webEnabled": true,
    "pushEnabled": false,
    "emailEnabled": true,
    "smsEnabled": false,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00",
    "preferences": {
      "PROTOCOL_STATUS": {
        "web": true,
        "push": true,
        "email": false
      }
    }
  }
}
```

#### `PATCH /api/notifications/preferences`
Atualizar preferências

**Request:**
```json
{
  "pushEnabled": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00"
}
```

### Notifications (Cidadão)

#### `GET /api/citizen/notifications`
Listar notificações do cidadão

**Query Parameters:**
- `page` - Número da página (default: 1)
- `limit` - Items por página (default: 20)
- `unread_only` - Apenas não lidas (default: false)
- `type` - Filtrar por tipo

**Response:**
```json
{
  "success": true,
  "notifications": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  },
  "unreadCount": 5
}
```

#### `PUT /api/citizen/notifications/mark-read`
Marcar como lidas

**Request:**
```json
{
  "notificationIds": ["id1", "id2"],  // ou
  "markAllAsRead": true
}
```

#### `DELETE /api/citizen/notifications/:id`
Remover notificação

---

## 🎯 Tipos de Notificações

### Protocolos

| Tipo | Canais | Prioridade | Descrição |
|------|--------|-----------|-----------|
| `PROTOCOL_CREATED` | Web, Push | Normal | Protocolo criado |
| `PROTOCOL_STATUS` | Web, Push | Normal | Status alterado |
| `PROTOCOL_ASSIGNED` | Web, Push | High | Atribuído a servidor |
| `PROTOCOL_MESSAGE` | Web, Push | High | Nova mensagem |
| `PROTOCOL_SLA_EXPIRING` | Web, Push, Email | High | Próximo de vencer |
| `PROTOCOL_OVERDUE` | Web, Push, Email | High | Protocolo vencido |
| `PROTOCOL_COMPLETED` | Web, Push, Email | High | Concluído |

### Documentos

| Tipo | Canais | Prioridade |
|------|--------|-----------|
| `DOCUMENT_REQUESTED` | Web, Push | Normal |
| `DOCUMENT_APPROVED` | Web, Push | Normal |
| `DOCUMENT_REJECTED` | Web, Push, Email | High |
| `DOCUMENT_UPLOADED` | Web | Normal |

### Agendamentos (Apps Saúde)

| Tipo | Canais | Prioridade |
|------|--------|-----------|
| `APPOINTMENT_CREATED` | Web, Push | Normal |
| `APPOINTMENT_REMINDER` | Web, Push, SMS | High |
| `APPOINTMENT_CANCELLED` | Web, Push, Email | High |

### Saúde

| Tipo | Canais | Prioridade |
|------|--------|-----------|
| `PRESCRIPTION_ISSUED` | Web, Push | Normal |
| `EXAM_RESULT` | Web, Push, Email | High |
| `VACCINATION_DUE` | Web, Push | Normal |

### Sistema

| Tipo | Canais | Prioridade |
|------|--------|-----------|
| `SYSTEM_ANNOUNCEMENT` | Web, Push | Normal |
| `SYSTEM_MAINTENANCE` | Web, Push, Email | High |

---

## 🔧 Troubleshooting

### Push Notifications não funcionam

**1. Verificar VAPID configurado:**
```bash
# Backend .env
VAPID_PUBLIC_KEY="BH..."
VAPID_PRIVATE_KEY="..."

# Frontend .env.local
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BH..."  # Mesma chave pública
```

**2. Verificar service worker registrado:**
```javascript
// No browser console
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW registered:', reg);
});
```

**3. Verificar permissão:**
```javascript
// No browser console
console.log('Permission:', Notification.permission);
```

**4. Testar push manualmente:**
```bash
# GET chave pública
curl http://localhost:3001/api/push/vapid-public-key

# POST subscription (precisa estar logado)
curl -X POST http://localhost:3001/api/push/subscribe \
  -H "Content-Type: application/json" \
  --cookie "digiurban_admin_token=..."
```

### SSE não conecta

**1. Verificar rota registrada:**
```bash
# Logs do backend devem mostrar:
✅ Rotas de notifications carregadas
```

**2. Testar stream:**
```bash
curl -N http://localhost:3001/api/notifications/stream \
  --cookie "digiurban_admin_token=..."
```

**3. Verificar firewall/proxy:**
SSE requer conexões de longa duração. Nginx/proxies podem ter timeout.

### Redis não conecta

**1. Verificar Redis rodando:**
```bash
redis-cli ping
# Deve retornar: PONG
```

**2. Verificar URL:**
```env
REDIS_URL="redis://localhost:6379"  # Padrão local
```

**3. Ver logs de conexão:**
```bash
# Logs do backend:
✅ Redis connected
```

### Notificações não sendo enviadas

**1. Verificar worker rodando:**
```bash
# Logs do backend:
✅ Notification worker started
```

**2. Ver estatísticas da fila:**
```bash
curl http://localhost:3001/api/notifications/queue-stats
```

**3. Verificar logs do worker:**
```bash
# No backend console:
✅ [Worker] Notification sent: job-id (push)
```

---

## 📊 Monitoramento

### Estatísticas da Fila

```typescript
import notificationService from './services/notification.service';

const stats = await notificationService.getQueueStats();
console.log(stats);
// {
//   waiting: 5,
//   active: 2,
//   completed: 150,
//   failed: 3,
//   delayed: 0,
//   total: 160
// }
```

### Logs de Notificações

Todas as notificações enviadas são registradas em `NotificationLog`:

```sql
SELECT
  type,
  channel,
  status,
  COUNT(*) as count
FROM notification_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY type, channel, status;
```

---

## 🎨 Personalização

### Adicionar Novo Tipo de Notificação

**1. Adicionar ao enum:**

```typescript
// backend/src/types/notification.types.ts
export enum NotificationType {
  // ... existentes
  MY_NEW_TYPE = 'MY_NEW_TYPE',
}
```

**2. Criar trigger:**

```typescript
// backend/src/services/notification-triggers.ts
static async onMyNewEvent(entityId: string) {
  await notificationService.notify({
    recipientType: 'citizen',
    recipientId: '...',
    type: NotificationType.MY_NEW_TYPE,
    title: 'Título',
    message: 'Mensagem',
    data: { ... },
  });
}
```

**3. Adicionar ao frontend:**

```typescript
// frontend/components/notifications/NotificationPreferences.tsx
const notificationTypes = [
  // ... existentes
  { type: 'MY_NEW_TYPE', label: 'Meu Novo Tipo', category: 'Categoria', icon: 'Icon' },
];
```

---

## 📝 Licença

Parte do projeto DigiUrban - Sistema de Gestão Municipal

---

## 👥 Suporte

Para dúvidas e suporte:
- Email: contato@digiurban.com.br
- GitHub Issues: [digiurban/issues](https://github.com/digiurban/issues)

---

**Data de Implementação:** 06/02/2026
**Versão:** 1.0.0
**Status:** ✅ Produção-ready
