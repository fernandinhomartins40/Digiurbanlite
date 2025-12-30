# UltraZend SMTP Server - Migração para PostgreSQL + Prisma

## ✅ Migração Concluída!

O UltraZend SMTP Server foi completamente migrado de **SQLite + Knex** para **PostgreSQL + Prisma**.

## Arquivos Criados (Versões Prisma)

### Schema e Configuração
- ✅ `prisma/schema.prisma` - Schema completo do banco de dados
- ✅ `src/lib/prisma.ts` - Cliente Prisma singleton
- ✅ `.env.example` - Exemplo de variáveis de ambiente

### Serviços Migrados
- ✅ `src/server/SMTPServer.prisma.ts` - Servidor SMTP principal
- ✅ `src/delivery/MXDeliveryService.prisma.ts` - Serviço de entrega MX
- ✅ `src/security/DKIMManager.prisma.ts` - Gerenciador DKIM
- ✅ `src/index.prisma.ts` - Entry point principal

### Package.json
- ✅ Removido: `knex`, `sqlite3`
- ✅ Adicionado: `@prisma/client`, `prisma`, `dotenv`
- ✅ Novos scripts: `db:generate`, `db:push`, `db:migrate`, `db:studio`

## Instalação e Configuração

### 1. Instalar Dependências

```bash
cd ultrazend-smtp-server
npm install
```

### 2. Configurar Banco de Dados

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o `.env` e configure a URL do PostgreSQL:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/ultrazend_smtp?schema=public"
```

### 3. Gerar Prisma Client

```bash
npm run db:generate
```

### 4. Criar Banco de Dados

**Opção A: Push direto (desenvolvimento)**
```bash
npm run db:push
```

**Opção B: Migrations (produção)**
```bash
npm run db:migrate
```

### 5. Verificar Schema

Abra o Prisma Studio para ver as tabelas:

```bash
npm run db:studio
```

## Schema do Banco de Dados

### Tabelas Criadas

1. **users** - Usuários para autenticação SMTP
   - `id`, `email`, `passwordHash`, `name`
   - `isVerified`, `isActive`, `isAdmin`
   - `lastLogin`, `createdAt`, `updatedAt`

2. **domains** - Domínios configurados
   - `id`, `userId`, `domainName`
   - `isVerified`, `verificationToken`, `verifiedAt`
   - `dkimEnabled`, `spfEnabled`
   - `createdAt`, `updatedAt`

3. **dkim_keys** - Chaves de assinatura DKIM
   - `id`, `domainId`, `selector`
   - `privateKey`, `publicKey`
   - `algorithm`, `canonicalization`, `keySize`
   - `isActive`, `createdAt`, `updatedAt`

4. **emails** - Emails processados
   - `id`, `messageId`, `domainId`
   - `fromEmail`, `toEmail`, `subject`
   - `htmlContent`, `textContent`
   - `status`, `direction`, `sentAt`, `deliveredAt`
   - `mxServer`, `errorMessage`, `attempts`
   - `createdAt`, `updatedAt`

5. **smtp_connections** - Logs de conexões SMTP
   - `id`, `remoteAddress`, `hostname`
   - `serverType` (MX/SUBMISSION)
   - `status` (ACCEPTED/REJECTED/FAILED)
   - `rejectReason`, `createdAt`

6. **auth_attempts** - Logs de autenticação
   - `id`, `userId`, `username`, `remoteAddress`
   - `success`, `failureReason`, `createdAt`

## Uso do UltraZend com Prisma

### Exemplo Básico

```typescript
import { SMTPServer } from '@ultrazend/smtp-server';

const server = new SMTPServer({
  hostname: 'mail.example.com',
  mxPort: 25,
  submissionPort: 587,
  authRequired: true,
  tlsEnabled: true
});

// Iniciar servidor
await server.start();

// Criar usuário
const userId = await server.createUser(
  'admin@example.com',
  'senha-segura',
  'Administrador'
);

// Adicionar domínio
const domainId = await server.addDomain('example.com', userId);

// Configurar DKIM
const dnsRecord = await server.setupDKIM('example.com');

// Ver estatísticas
const stats = await server.getStats();
console.log(stats);
```

### Acesso Direto ao Prisma

```typescript
import { prisma } from '@ultrazend/smtp-server';

// Buscar emails
const emails = await prisma.email.findMany({
  where: { status: 'DELIVERED' },
  take: 10,
  orderBy: { createdAt: 'desc' }
});

// Buscar domínios verificados
const domains = await prisma.domain.findMany({
  where: { isVerified: true },
  include: { dkimKeys: true }
});

// Estatísticas de autenticação
const authStats = await prisma.authAttempt.groupBy({
  by: ['success'],
  _count: { success: true }
});
```

## Enums do Prisma

### EmailStatus
- `PENDING` - Email na fila
- `SENT` - Email enviado
- `DELIVERED` - Email entregue
- `BOUNCED` - Email retornou
- `FAILED` - Falha na entrega

### EmailDirection
- `INBOUND` - Email recebido (MX)
- `OUTBOUND` - Email enviado (Submission)

### ServerType
- `MX` - Servidor MX (porta 25)
- `SUBMISSION` - Servidor Submission (porta 587)

### ConnectionStatus
- `ACCEPTED` - Conexão aceita
- `REJECTED` - Conexão rejeitada
- `FAILED` - Conexão falhou

## Comparação: Antes vs Depois

### Antes (Knex + SQLite)

```typescript
// Inicializar banco
this.db = knex({
  client: 'sqlite3',
  connection: { filename: './smtp.sqlite' }
});

// Query manual
const user = await this.db('users')
  .where('email', username)
  .first();
```

### Depois (Prisma + PostgreSQL)

```typescript
// Importar client
import { prisma } from '../lib/prisma';

// Type-safe query
const user = await prisma.user.findFirst({
  where: { email: username }
});
```

## Benefícios da Migração

✅ **Type Safety** - Todas as queries são type-safe
✅ **Auto-complete** - IntelliSense completo no VSCode
✅ **Migrations** - Controle de versão do schema
✅ **Prisma Studio** - Interface visual do banco
✅ **Performance** - PostgreSQL é mais rápido que SQLite
✅ **Escalabilidade** - Pronto para produção
✅ **Relações** - Foreign keys e relações gerenciadas
✅ **Validação** - Validação automática de dados

## Próximos Passos

### Para Desenvolvimento

1. Configure o PostgreSQL local
2. Rode `npm run db:push`
3. Crie alguns usuários e domínios de teste
4. Teste o envio de emails

### Para Produção

1. Configure PostgreSQL em produção
2. Rode `npm run db:migrate`
3. Configure certificados SSL/TLS
4. Configure DNS (MX, SPF, DKIM, DMARC)
5. Teste entrega em domínios reais

## Integração com DigiUrban

O próximo passo é integrar este UltraZend SMTP Server migrado no DigiUrban:

1. Compartilhar o banco PostgreSQL do DigiUrban
2. Usar os mesmos modelos `EmailServer`, `EmailDomain`, etc
3. Substituir `DigiUrbanSMTPServer` por `UltraZendSMTPServer`
4. Remover código duplicado

## Troubleshooting

### Erro: "Can't reach database server"

Verifique se o PostgreSQL está rodando:
```bash
# Linux/Mac
sudo service postgresql status

# Windows
net start postgresql-x64-14
```

### Erro: "prisma:Client is not yet ready"

Rode o generate novamente:
```bash
npm run db:generate
```

### Erro ao rodar migrations

Resete o banco (apenas desenvolvimento!):
```bash
npx prisma migrate reset
```

## Suporte

Para dúvidas ou problemas:
- Abra uma issue no repositório
- Consulte a documentação do Prisma: https://prisma.io/docs
- Veja logs detalhados em desenvolvimento
