# 🚀 DigiBot - Guia Rápido de Início

## ⚡ Start em 5 Minutos

### Pré-requisitos

- ✅ Node.js 18+
- ✅ PostgreSQL 14+
- ✅ Redis (opcional, para scaling)

---

## 📋 Passo a Passo

### 1️⃣ Aplicar Migration

```bash
cd ultrazend-messages-server
npx prisma migrate deploy
```

**O que faz:** Adiciona campos de bot na tabela `conversations`.

---

### 2️⃣ Instalar Dependências

#### Frontend (adicionar socket.io-client)

```bash
cd digiurban/frontend
npm install socket.io-client
```

#### Backend (verificar axios)

```bash
cd digiurban/backend
npm install axios  # Se ainda não instalado
```

---

### 3️⃣ Configurar Variáveis de Ambiente

#### UltraZend Messages Server (`.env`)

```env
DATABASE_URL=postgresql://digiurban:digiurban@localhost:5432/digiurban
PORT=9001
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
MESSAGES_SERVICE_TOKEN=ultrazend-messages-service-token-change-in-production
MESSAGE_SERVER_ID=default-message-server-id
DIGIURBAN_API_URL=http://localhost:3001
```

#### DigiUrban Backend (`.env`)

```env
DATABASE_URL=postgresql://digiurban:digiurban@localhost:5432/digiurban
ULTRAZEND_API_URL=http://localhost:9001
MESSAGES_SERVICE_TOKEN=ultrazend-messages-service-token-change-in-production
```

#### DigiUrban Frontend (`.env.local`)

```env
NEXT_PUBLIC_ULTRAZEND_WS_URL=http://localhost:9001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

### 4️⃣ Registrar Rota no Backend

Edite `digiurban/backend/src/server.ts` ou equivalente:

```typescript
import botIntegratedRoutes from './routes/botIntegrated.routes';

// ...

app.use('/api/bot', botIntegratedRoutes);
```

---

### 5️⃣ Registrar Handler no UltraZend

Edite `ultrazend-messages-server/src/server.ts` ou equivalente:

```typescript
import { registerBotHandlers } from './handlers/botWebSocketHandler';

// ...

io.on('connection', (socket) => {
  const userId = socket.handshake.auth.userId;
  const userType = socket.handshake.auth.userType || 'CITIZEN';

  // Registra handlers gerais...

  // 🔥 Registra handlers do bot
  if (userType === 'CITIZEN') {
    registerBotHandlers(socket, userId, userType);
  }
});
```

---

### 6️⃣ Iniciar Servidores

#### Terminal 1: UltraZend Messages

```bash
cd ultrazend-messages-server
npm run dev
# Deve iniciar na porta 9001
```

#### Terminal 2: DigiUrban Backend

```bash
cd digiurban/backend
npm run dev
# Deve iniciar na porta 3001
```

#### Terminal 3: DigiUrban Frontend

```bash
cd digiurban/frontend
npm run dev
# Deve iniciar na porta 3000
```

---

### 7️⃣ Testar

1. Abra o navegador em `http://localhost:3000`
2. Faça login como cidadão
3. Acesse o **DigiBot**
4. Envie a mensagem: **"Solicitar Serviço"**

**Resultado esperado:**

```
Bot: 📋 Solicitar Serviço

Como você prefere encontrar o serviço que precisa?

[🔍 Buscar por nome] [📂 Ver categorias] [⭐ Serviços populares]
```

---

## ✅ Checklist de Verificação

Execute o script de verificação:

```bash
cd "c:\Projetos Cursor\Digiurbanlite"
bash verify-digibot-integration.sh
```

---

## 🐛 Troubleshooting

### Erro: "WebSocket não conectado"

**Causa:** Frontend não consegue conectar ao UltraZend.

**Solução:**
1. Verifique se UltraZend está rodando na porta 9001
2. Verifique `NEXT_PUBLIC_ULTRAZEND_WS_URL` no frontend
3. Verifique se o token JWT está sendo enviado

### Erro: "Conversa não encontrada"

**Causa:** Conversa não foi criada corretamente.

**Solução:**
1. Verifique logs do UltraZend
2. Verifique se a migration foi aplicada
3. Teste endpoint: `POST /api/bot/conversation`

### Erro: "Protocolo não criado"

**Causa:** `BotIntegrationService` falhou ao criar protocolo.

**Solução:**
1. Verifique logs do backend
2. Verifique se `ProtocolService` existe e funciona
3. Verifique se tabelas `Service` e `Citizen` estão populadas

### Erro de TypeScript no frontend

**Causa:** `socket.io-client` não instalado.

**Solução:**
```bash
cd digiurban/frontend
npm install socket.io-client @types/socket.io-client
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- [DIGIBOT_INTEGRATION_COMPLETE.md](./DIGIBOT_INTEGRATION_COMPLETE.md) - Documentação técnica completa
- [ultrazend-messages-server/README.md](./ultrazend-messages-server/README.md) - Documentação do UltraZend

---

## 🎯 Próximos Passos

Após o DigiBot funcionar:

1. ✅ Testar todos os 5 fluxos (Solicitar Serviço, Consultar Protocolo, etc.)
2. ✅ Implementar notificações proativas (protocol_approved, etc.)
3. ✅ Criar testes E2E
4. ✅ Otimizar performance (cache, Redis)
5. ✅ Adicionar analytics do bot

---

## 💡 Dicas

### Desenvolvimento Local

- Use `nodemon` para hot reload
- Habilite logs detalhados: `LOG_LEVEL=debug`
- Use Redis Desktop Manager para visualizar cache

### Produção

- Configure `REDIS_URL` para scaling
- Configure SSL/TLS para WebSocket
- Configure rate limiting
- Configure monitoramento (Sentry, Datadog, etc.)

---

## 🆘 Suporte

Encontrou um problema?

1. Verifique os logs de todos os 3 servidores
2. Execute o script de verificação
3. Consulte a documentação completa
4. Abra uma issue no repositório

---

**Desenvolvido com ❤️ por Claude Sonnet 4.5**
**Data:** 19 de Janeiro de 2026
