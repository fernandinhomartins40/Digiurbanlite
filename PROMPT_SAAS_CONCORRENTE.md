# Prompt para Claude Code — Construir Plataforma GovTech SaaS Multitenant

> **Instruções**: Copie todo este conteúdo e cole no Claude Code como prompt inicial para um novo projeto.

---

## INSTRUÇÃO PRINCIPAL

Você é um arquiteto de software sênior especializado em plataformas SaaS gov-tech. Sua missão é **planejar e construir do zero** uma plataforma SaaS multitenant de governo digital municipal chamada **"CidadON"** — uma alternativa moderna, leve e escalável ao sistema DigiUrban.

**ETAPA 1 — PLANEJAMENTO**: Antes de escrever qualquer código, crie um arquivo `PLANO_IMPLEMENTACAO.md` detalhado com a arquitetura, módulos, models, endpoints, estrutura de pastas, e cronograma de implementação. Aguarde aprovação do usuário.

**ETAPA 2 — IMPLEMENTAÇÃO**: Após aprovação do plano, implemente a aplicação completa seguindo o plano aprovado.

---

## 1. VISÃO DO PRODUTO

### 1.1 O que é o CidadON

Plataforma SaaS multitenant de governo digital municipal que permite a qualquer prefeitura brasileira digitalizar seus serviços públicos em minutos. Cada município é um tenant isolado com dados segregados via PostgreSQL Row Level Security (RLS).

### 1.2 Proposta de Valor

| Para | Valor |
|------|-------|
| **Prefeituras** | Digitalização instantânea sem equipe de TI, custo por habitante, compliance LGPD nativo |
| **Cidadãos** | Portal único para todos os serviços municipais, login via gov.br, acompanhamento em tempo real |
| **Servidores públicos** | Interface moderna com IA assistente, workflows automatizados, zero papel |

### 1.3 Diferenciação vs Concorrentes

| Concorrente | Fraqueza que exploramos |
|-------------|----------------------|
| Betha (800+ prefeituras) | Legado desktop, migração lenta para cloud |
| 1Doc/Softplan | Foco em documentos, não em serviços ao cidadão |
| IPM/Atende.Net | 95 módulos monolíticos, complexidade excessiva |
| Aprova Digital | Nicho (licenciamento), não é plataforma completa |
| Colab.re | Foco em engajamento, sem gestão de protocolos/workflows |

---

## 2. ARQUITETURA TÉCNICA

### 2.1 Princípios Arquiteturais

1. **Multitenant por design** — PostgreSQL RLS com `tenant_id` em TODAS as tabelas
2. **Modular e leve** — Máximo 60-80 models (vs 213 do DigiUrban)
3. **Type-safe end-to-end** — TypeScript strict sem `ignoreBuildErrors`
4. **Testável** — Mínimo 80% de cobertura de testes desde o dia 1
5. **API-first** — OpenAPI/Swagger auto-gerado, versionamento semântico
6. **Event-driven** — Eventos assíncronos para operações pesadas
7. **Zero console.log** — Logging estruturado (Winston/Pino) com níveis

### 2.2 Stack Tecnológica

```
FRONTEND:
├── Next.js 15 (App Router, React Server Components)
├── TypeScript 5.x (strict: true)
├── Tailwind CSS 4 + shadcn/ui
├── TanStack Query 5 (server state)
├── react-hook-form + Zod (formulários)
├── Socket.IO Client (realtime)
├── Recharts (gráficos)
└── PWA com next-pwa

BACKEND:
├── NestJS 11 (modular, DI nativo, decorators)
├── TypeScript 5.x (strict: true)
├── Prisma 6.x (PostgreSQL, multi-schema)
├── Passport.js (JWT + OAuth 2.0 gov.br)
├── BullMQ (filas assíncronas)
├── Socket.IO 4.x + Redis adapter
├── Winston/Pino (logging estruturado)
├── Swagger/OpenAPI auto-gerado
├── Jest + Supertest (testes)
└── class-validator + class-transformer

INFRAESTRUTURA:
├── PostgreSQL 16+ (RLS multitenancy)
├── Redis 7+ (cache, sessions, pub/sub, filas)
├── MinIO / S3 (object storage)
├── Docker + Docker Compose
├── Nginx (reverse proxy + SSL)
└── GitHub Actions (CI/CD)

IA (OPCIONAL, FASE 2):
├── Ollama (local LLM)
├── RAG com pgvector
└── OpenAI API (fallback)
```

### 2.3 Por que NestJS ao invés de Express puro

O DigiUrban usa Express com 73 rotas registradas manualmente em um `index.ts` de 727 linhas. NestJS resolve isso com:

- **Módulos auto-registrados** — sem registro manual de rotas
- **Dependency Injection** — testabilidade nativa, sem singletons globais
- **Guards/Interceptors/Pipes** — middleware padronizado e reutilizável
- **Swagger auto-gerado** — documentação sempre atualizada
- **Decorators** — `@Controller`, `@Get`, `@Post`, `@UseGuards` — código declarativo

### 2.4 Multitenancy com PostgreSQL RLS

```sql
-- Toda tabela tem tenant_id
CREATE TABLE protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  protocol_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  ...
);

-- RLS Policy
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON protocols
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- No NestJS: middleware seta tenant_id por request
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const tenantId = extractTenantFromRequest(req); // subdomain ou header
    await this.prisma.$executeRawUnsafe(
      `SET LOCAL app.tenant_id = '${tenantId}'`
    );
    next();
  }
}
```

**Identificação do tenant**: Via subdomínio (`saopaulo.cidadon.app`) ou header `X-Tenant-ID`.

---

## 3. ESTRUTURA DO PROJETO

```
cidadon/
├── apps/
│   ├── api/                          # NestJS Backend (porta 3001)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/               # Shared (guards, interceptors, pipes, filters)
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   ├── roles.guard.ts
│   │   │   │   │   └── tenant.guard.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── logging.interceptor.ts
│   │   │   │   │   ├── transform.interceptor.ts
│   │   │   │   │   └── timeout.interceptor.ts
│   │   │   │   ├── pipes/
│   │   │   │   │   └── validation.pipe.ts
│   │   │   │   ├── filters/
│   │   │   │   │   └── http-exception.filter.ts
│   │   │   │   ├── decorators/
│   │   │   │   │   ├── current-user.decorator.ts
│   │   │   │   │   ├── current-tenant.decorator.ts
│   │   │   │   │   ├── roles.decorator.ts
│   │   │   │   │   └── public.decorator.ts
│   │   │   │   └── middleware/
│   │   │   │       ├── tenant.middleware.ts
│   │   │   │       └── rate-limit.middleware.ts
│   │   │   │
│   │   │   ├── modules/               # Feature modules (1 pasta = 1 domínio)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── strategies/    # passport strategies
│   │   │   │   │   │   ├── jwt.strategy.ts
│   │   │   │   │   │   ├── local.strategy.ts
│   │   │   │   │   │   └── govbr.strategy.ts
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── login.dto.ts
│   │   │   │   │   │   └── register.dto.ts
│   │   │   │   │   └── auth.spec.ts
│   │   │   │   │
│   │   │   │   ├── tenants/
│   │   │   │   │   ├── tenants.module.ts
│   │   │   │   │   ├── tenants.controller.ts
│   │   │   │   │   ├── tenants.service.ts
│   │   │   │   │   ├── dto/
│   │   │   │   │   └── tenants.spec.ts
│   │   │   │   │
│   │   │   │   ├── users/
│   │   │   │   │   ├── users.module.ts
│   │   │   │   │   ├── users.controller.ts
│   │   │   │   │   ├── users.service.ts
│   │   │   │   │   ├── dto/
│   │   │   │   │   └── users.spec.ts
│   │   │   │   │
│   │   │   │   ├── citizens/
│   │   │   │   │   ├── citizens.module.ts
│   │   │   │   │   ├── citizens.controller.ts
│   │   │   │   │   ├── citizens.service.ts
│   │   │   │   │   ├── dto/
│   │   │   │   │   └── citizens.spec.ts
│   │   │   │   │
│   │   │   │   ├── departments/
│   │   │   │   │   ├── departments.module.ts
│   │   │   │   │   ├── departments.controller.ts
│   │   │   │   │   ├── departments.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   │
│   │   │   │   ├── services/          # Catálogo de serviços municipais
│   │   │   │   │   ├── services.module.ts
│   │   │   │   │   ├── services.controller.ts
│   │   │   │   │   ├── services.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   │
│   │   │   │   ├── protocols/         # Protocolos/solicitações do cidadão
│   │   │   │   │   ├── protocols.module.ts
│   │   │   │   │   ├── protocols.controller.ts
│   │   │   │   │   ├── protocols.service.ts
│   │   │   │   │   ├── protocol-sla.service.ts
│   │   │   │   │   ├── protocol-status.config.ts
│   │   │   │   │   ├── dto/
│   │   │   │   │   └── protocols.spec.ts
│   │   │   │   │
│   │   │   │   ├── workflows/         # Motor de workflows configurável
│   │   │   │   │   ├── workflows.module.ts
│   │   │   │   │   ├── workflows.controller.ts
│   │   │   │   │   ├── workflow-engine.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   │
│   │   │   │   ├── documents/         # Templates + geração + assinatura digital
│   │   │   │   │   ├── documents.module.ts
│   │   │   │   │   ├── documents.controller.ts
│   │   │   │   │   ├── document-generator.service.ts
│   │   │   │   │   ├── document-signing.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   │
│   │   │   │   ├── notifications/     # Email + Push + In-app + SSE
│   │   │   │   │   ├── notifications.module.ts
│   │   │   │   │   ├── notifications.controller.ts
│   │   │   │   │   ├── notifications.service.ts
│   │   │   │   │   ├── email.service.ts
│   │   │   │   │   └── push.service.ts
│   │   │   │   │
│   │   │   │   ├── messages/          # Chat cidadão↔servidor + bot
│   │   │   │   │   ├── messages.module.ts
│   │   │   │   │   ├── messages.gateway.ts  # Socket.IO gateway
│   │   │   │   │   ├── messages.service.ts
│   │   │   │   │   ├── bot/
│   │   │   │   │   │   ├── bot.service.ts
│   │   │   │   │   │   ├── flow-engine.ts
│   │   │   │   │   │   ├── action-handlers.ts
│   │   │   │   │   │   └── flows/     # JSON flow definitions
│   │   │   │   │   └── dto/
│   │   │   │   │
│   │   │   │   ├── analytics/         # Dashboard, KPIs, relatórios
│   │   │   │   │   ├── analytics.module.ts
│   │   │   │   │   ├── analytics.controller.ts
│   │   │   │   │   ├── analytics.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   │
│   │   │   │   ├── storage/           # Upload de arquivos (S3/MinIO)
│   │   │   │   │   ├── storage.module.ts
│   │   │   │   │   ├── storage.service.ts
│   │   │   │   │   └── storage.controller.ts
│   │   │   │   │
│   │   │   │   └── health/            # Health checks
│   │   │   │       ├── health.module.ts
│   │   │   │       └── health.controller.ts
│   │   │   │
│   │   │   ├── config/                # Configuração centralizada
│   │   │   │   ├── app.config.ts
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── redis.config.ts
│   │   │   │   ├── auth.config.ts
│   │   │   │   └── storage.config.ts
│   │   │   │
│   │   │   └── prisma/
│   │   │       ├── prisma.module.ts
│   │   │       └── prisma.service.ts  # Prisma com RLS automático
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma          # MAX 60-80 models, bem documentado
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   │       ├── seed.ts            # Seed consolidado
│   │   │       └── tenant-seed.ts     # Seed por tenant
│   │   │
│   │   ├── test/
│   │   │   ├── app.e2e-spec.ts
│   │   │   └── jest-e2e.json
│   │   │
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json              # strict: true, NO ignoreBuildErrors
│   │   ├── tsconfig.build.json
│   │   ├── jest.config.ts
│   │   └── package.json
│   │
│   └── web/                           # Next.js Frontend (porta 3000)
│       ├── src/
│       │   ├── app/                   # App Router pages
│       │   │   ├── (public)/          # Rotas públicas (landing, login)
│       │   │   │   ├── page.tsx       # Landing page
│       │   │   │   ├── login/
│       │   │   │   └── register/
│       │   │   │
│       │   │   ├── (citizen)/         # Portal do cidadão
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── dashboard/
│       │   │   │   ├── services/      # Catálogo + solicitação
│       │   │   │   ├── protocols/     # Meus protocolos
│       │   │   │   ├── messages/      # Chat + bot
│       │   │   │   ├── documents/     # Meus documentos
│       │   │   │   └── profile/       # Perfil + família
│       │   │   │
│       │   │   ├── (admin)/           # Área administrativa
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── dashboard/     # Dashboard analítico
│       │   │   │   ├── protocols/     # Gestão de protocolos
│       │   │   │   ├── services/      # Gestão de serviços
│       │   │   │   ├── departments/   # Secretarias/departamentos
│       │   │   │   ├── users/         # Gestão de servidores
│       │   │   │   ├── citizens/      # Gestão de cidadãos
│       │   │   │   ├── workflows/     # Editor de workflows
│       │   │   │   ├── documents/     # Templates + geração
│       │   │   │   ├── messages/      # Central de mensagens
│       │   │   │   ├── analytics/     # Relatórios + KPIs
│       │   │   │   ├── notifications/ # Gestão de notificações
│       │   │   │   └── settings/      # Configurações
│       │   │   │
│       │   │   ├── (super-admin)/     # Gestão da plataforma (SaaS admin)
│       │   │   │   ├── layout.tsx
│       │   │   │   ├── tenants/       # Gestão de municípios
│       │   │   │   ├── billing/       # Faturamento
│       │   │   │   ├── monitoring/    # Health + métricas
│       │   │   │   └── settings/      # Config global
│       │   │   │
│       │   │   ├── api/               # API routes (se necessário)
│       │   │   └── layout.tsx         # Root layout
│       │   │
│       │   ├── components/
│       │   │   ├── ui/               # shadcn/ui components
│       │   │   ├── layouts/          # Sidebar, Header, Footer
│       │   │   ├── forms/            # Form components reutilizáveis
│       │   │   ├── data-display/     # Tables, Cards, Stats
│       │   │   └── shared/           # PDF viewer, maps, charts
│       │   │
│       │   ├── hooks/                # Custom hooks
│       │   │   ├── use-auth.ts
│       │   │   ├── use-tenant.ts
│       │   │   ├── use-protocols.ts
│       │   │   ├── use-services.ts
│       │   │   ├── use-socket.ts
│       │   │   └── use-toast.ts
│       │   │
│       │   ├── lib/
│       │   │   ├── api-client.ts     # Axios instance com interceptors
│       │   │   ├── socket.ts         # Socket.IO client
│       │   │   ├── auth.ts           # Auth utilities
│       │   │   └── utils.ts          # Helpers
│       │   │
│       │   ├── types/                # Tipos compartilhados
│       │   │   ├── api.ts
│       │   │   ├── models.ts
│       │   │   └── enums.ts
│       │   │
│       │   └── styles/
│       │       └── globals.css
│       │
│       ├── public/
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json             # strict: true
│       └── package.json
│
├── packages/                          # Shared packages (monorepo)
│   ├── shared-types/                  # Tipos TS compartilhados
│   │   ├── src/
│   │   │   ├── models.ts
│   │   │   ├── enums.ts
│   │   │   ├── dto.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── shared-utils/                  # Utilities compartilhadas
│       ├── src/
│       │   ├── formatters.ts
│       │   ├── validators.ts
│       │   └── index.ts
│       ├── tsconfig.json
│       └── package.json
│
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   ├── nginx.conf
│   └── init.sql                       # RLS setup
│
├── docker-compose.yml                 # Desenvolvimento
├── docker-compose.prod.yml            # Produção
├── turbo.json                         # Turborepo config
├── package.json                       # Workspace root
├── tsconfig.base.json
├── .env.example
├── .github/
│   └── workflows/
│       ├── ci.yml                     # Lint + type-check + test
│       └── deploy.yml                 # Build + deploy
│
├── CLAUDE.md                          # Instruções para IA
├── PLANO_IMPLEMENTACAO.md             # Será criado na Etapa 1
└── README.md
```

---

## 4. MODELS DO BANCO DE DADOS (MÁXIMO 60-80)

### 4.1 Princípio: Consolidação agressiva

O DigiUrban tem 213 models. O CidadON deve ter no **máximo 60-80** consolidando modelos redundantes. Use campos JSON para dados semi-estruturados e JSONB para schemas dinâmicos.

### 4.2 Models Essenciais (organizado por domínio)

```prisma
// ============================================
// DOMÍNIO 1: PLATAFORMA (multitenancy)
// ============================================

model Tenant {
  id            String   @id @default(uuid())
  name          String   // "Prefeitura de São Paulo"
  slug          String   @unique // "sao-paulo" (subdomínio)
  domain        String?  // domínio custom opcional
  plan          PlanType @default(BASIC)
  settings      Json     @default("{}") // branding, configs
  logoUrl       String?
  primaryColor  String   @default("#1E40AF")
  isActive      Boolean  @default(true)
  population    Int?     // Para pricing per-capita
  ibgeCode      String?  @unique // Código IBGE do município
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  users         User[]
  citizens      Citizen[]
  departments   Department[]
  services      Service[]
  protocols     Protocol[]
  documents     DocumentTemplate[]
  workflows     Workflow[]
  subscriptions Subscription[]
}

model Subscription {
  id          String   @id @default(uuid())
  tenantId    String
  plan        PlanType
  status      SubscriptionStatus @default(ACTIVE)
  startDate   DateTime @default(now())
  endDate     DateTime?
  monthlyFee  Decimal?
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
}

// ============================================
// DOMÍNIO 2: AUTENTICAÇÃO E USUÁRIOS
// ============================================

model User {
  id           String   @id @default(uuid())
  tenantId     String
  name         String
  email        String
  cpf          String?
  passwordHash String
  role         UserRole @default(AGENT)
  departmentId String?
  avatarUrl    String?
  isActive     Boolean  @default(true)
  preferences  Json     @default("{}") // tema, notificações, etc
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tenant       Tenant      @relation(fields: [tenantId], references: [id])
  department   Department? @relation(fields: [departmentId], references: [id])
  sessions     Session[]

  @@unique([tenantId, email])
  @@unique([tenantId, cpf])
  @@index([tenantId])
}

model Citizen {
  id           String   @id @default(uuid())
  tenantId     String
  name         String
  cpf          String
  email        String?
  phone        String?
  passwordHash String?
  govbrId      String?  // ID do gov.br para SSO
  address      Json?    // { cep, street, number, complement, neighborhood, city, state }
  isActive     Boolean  @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  protocols    Protocol[]
  familyMembers FamilyMember[]

  @@unique([tenantId, cpf])
  @@index([tenantId])
}

model FamilyMember {
  id          String       @id @default(uuid())
  citizenId   String
  name        String
  cpf         String?
  birthDate   DateTime?
  relation    FamilyRelation
  citizen     Citizen      @relation(fields: [citizenId], references: [id])
}

model Session {
  id          String   @id @default(uuid())
  userId      String
  token       String   @unique
  userAgent   String?
  ipAddress   String?
  expiresAt   DateTime
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ============================================
// DOMÍNIO 3: ESTRUTURA ORGANIZACIONAL
// ============================================

model Department {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  acronym     String?
  parentId    String?  // Hierarquia
  managerId   String?  // Responsável
  isActive    Boolean  @default(true)
  settings    Json     @default("{}") // config específica
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant      @relation(fields: [tenantId], references: [id])
  parent      Department? @relation("DeptHierarchy", fields: [parentId], references: [id])
  children    Department[] @relation("DeptHierarchy")
  users       User[]
  services    Service[]
  protocols   Protocol[]

  @@unique([tenantId, name])
  @@index([tenantId])
}

// ============================================
// DOMÍNIO 4: SERVIÇOS E CATÁLOGO
// ============================================

model Service {
  id           String   @id @default(uuid())
  tenantId     String
  departmentId String
  name         String
  description  String?
  category     String?  // "Saúde", "Educação", "Infraestrutura"...
  formSchema   Json     @default("[]") // JSON Schema para formulário dinâmico
  slaMaxDays   Int      @default(30)
  isActive     Boolean  @default(true)
  isPublic     Boolean  @default(true) // Visível no catálogo cidadão
  requirements String?  // Documentos necessários
  estimatedTime String? // "5 dias úteis"
  icon         String?  // Ícone do serviço
  sortOrder    Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tenant       Tenant      @relation(fields: [tenantId], references: [id])
  department   Department  @relation(fields: [departmentId], references: [id])
  protocols    Protocol[]
  workflow     Workflow?   @relation

  @@index([tenantId])
  @@index([tenantId, category])
}

// ============================================
// DOMÍNIO 5: PROTOCOLOS (core do sistema)
// ============================================

model Protocol {
  id                String         @id @default(uuid())
  tenantId          String
  protocolNumber    String         // Gerado: "2026/000001"
  citizenId         String
  serviceId         String
  departmentId      String
  assignedUserId    String?        // Servidor responsável atual
  status            ProtocolStatus @default(OPEN)
  priority          Priority       @default(MEDIUM)
  title             String
  description       String?
  formData          Json?          // Dados do formulário preenchido
  internalNotes     String?        // Notas internas (não visível ao cidadão)
  concludedAt       DateTime?
  cancelledAt       DateTime?
  cancelReason      String?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  tenant            Tenant       @relation(fields: [tenantId], references: [id])
  citizen           Citizen      @relation(fields: [citizenId], references: [id])
  service           Service      @relation(fields: [serviceId], references: [id])
  department        Department   @relation(fields: [departmentId], references: [id])
  assignedUser      User?        @relation(fields: [assignedUserId], references: [id])
  interactions      Interaction[]
  documents         Document[]
  sla               ProtocolSLA?
  evaluation        Evaluation?
  statusHistory     StatusChange[]

  @@unique([tenantId, protocolNumber])
  @@index([tenantId, status])
  @@index([tenantId, citizenId])
  @@index([tenantId, departmentId])
  @@index([tenantId, assignedUserId])
}

model Interaction {
  id          String          @id @default(uuid())
  protocolId  String
  authorId    String?         // User ou null (sistema)
  authorType  AuthorType      @default(SYSTEM)
  type        InteractionType @default(COMMENT)
  content     String
  isInternal  Boolean         @default(false) // Só visível para servidores
  attachments Json?           // Array de { fileUrl, fileName, fileSize }
  createdAt   DateTime        @default(now())

  protocol    Protocol @relation(fields: [protocolId], references: [id])
}

model StatusChange {
  id          String         @id @default(uuid())
  protocolId  String
  fromStatus  ProtocolStatus
  toStatus    ProtocolStatus
  changedById String?
  reason      String?
  createdAt   DateTime       @default(now())

  protocol    Protocol @relation(fields: [protocolId], references: [id])
}

model ProtocolSLA {
  id               String   @id @default(uuid())
  protocolId       String   @unique
  maxDays          Int
  expectedDeadline DateTime
  isOverdue        Boolean  @default(false)
  daysOverdue      Int      @default(0)
  pausedAt         DateTime?
  totalPausedDays  Int      @default(0)

  protocol         Protocol @relation(fields: [protocolId], references: [id])
}

model Evaluation {
  id             String   @id @default(uuid())
  protocolId     String   @unique
  rating         Int      // 1-5
  comment        String?
  wouldRecommend Boolean?
  createdAt      DateTime @default(now())

  protocol       Protocol @relation(fields: [protocolId], references: [id])
}

// ============================================
// DOMÍNIO 6: DOCUMENTOS
// ============================================

model DocumentTemplate {
  id           String   @id @default(uuid())
  tenantId     String
  name         String
  description  String?
  htmlContent  String   // Template Handlebars
  cssContent   String?
  variables    Json     @default("[]") // Variáveis disponíveis
  category     String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tenant       Tenant   @relation(fields: [tenantId], references: [id])
  generated    GeneratedDocument[]

  @@index([tenantId])
}

model GeneratedDocument {
  id          String   @id @default(uuid())
  templateId  String
  protocolId  String?
  fileName    String
  fileUrl     String
  fileSize    Int?
  isSigned    Boolean  @default(false)
  signedAt    DateTime?
  metadata    Json?
  createdAt   DateTime @default(now())

  template    DocumentTemplate @relation(fields: [templateId], references: [id])
}

model Document {
  id          String   @id @default(uuid())
  protocolId  String?
  fileName    String
  fileUrl     String
  fileSize    Int?
  mimeType    String?
  uploadedBy  String?
  uploadedAt  DateTime @default(now())

  protocol    Protocol? @relation(fields: [protocolId], references: [id])
}

model DigitalCertificate {
  id                  String   @id @default(uuid())
  tenantId            String?
  name                String
  publicKey           String
  encryptedPrivateKey String
  issuer              String
  subject             String
  validFrom           DateTime
  validUntil          DateTime
  status              CertificateStatus @default(ACTIVE)
  createdAt           DateTime @default(now())
}

// ============================================
// DOMÍNIO 7: WORKFLOWS
// ============================================

model Workflow {
  id          String   @id @default(uuid())
  tenantId    String
  serviceId   String?  @unique
  name        String
  description String?
  nodes       Json     // Array de nodos do workflow
  edges       Json     // Conexões entre nodos
  isActive    Boolean  @default(true)
  version     Int      @default(1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  service     Service? @relation(fields: [serviceId], references: [id])
}

model WorkflowExecution {
  id          String   @id @default(uuid())
  workflowId  String
  protocolId  String?
  currentNode String
  state       Json     @default("{}")
  status      WorkflowExecutionStatus @default(RUNNING)
  startedAt   DateTime @default(now())
  completedAt DateTime?

  workflow    Workflow @relation(fields: [workflowId], references: [id])
}

// ============================================
// DOMÍNIO 8: MENSAGENS E CHAT
// ============================================

model Conversation {
  id              String           @id @default(uuid())
  tenantId        String
  type            ConversationType @default(CITIZEN_SUPPORT)
  citizenId       String?
  assignedUserId  String?
  isBotActive     Boolean          @default(true)
  status          ConversationStatus @default(OPEN)
  metadata        Json?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  messages        Message[]

  @@index([tenantId])
}

model Message {
  id              String      @id @default(uuid())
  conversationId  String
  senderId        String?
  senderType      SenderType  @default(SYSTEM)
  content         String
  contentType     MessageContentType @default(TEXT)
  metadata        Json?       // Botões, formulários, etc
  isRead          Boolean     @default(false)
  createdAt       DateTime    @default(now())

  conversation    Conversation @relation(fields: [conversationId], references: [id])
}

model FlowDefinition {
  id          String   @id @default(uuid())
  tenantId    String?  // null = global
  name        String
  slug        String   @unique
  nodes       Json
  version     String   @default("1.0")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model FlowExecution {
  id              String   @id @default(uuid())
  flowDefinitionId String
  conversationId  String
  currentNodeId   String
  state           Json     @default("{}")
  status          FlowExecutionStatus @default(ACTIVE)
  startedAt       DateTime @default(now())
  completedAt     DateTime?
}

// ============================================
// DOMÍNIO 9: NOTIFICAÇÕES
// ============================================

model Notification {
  id          String           @id @default(uuid())
  tenantId    String
  userId      String?          // null = broadcast
  citizenId   String?
  type        NotificationType
  title       String
  body        String
  data        Json?            // Payload extra
  channel     NotificationChannel @default(IN_APP)
  isRead      Boolean          @default(false)
  readAt      DateTime?
  createdAt   DateTime         @default(now())

  @@index([tenantId, userId])
  @@index([tenantId, citizenId])
}

// ============================================
// DOMÍNIO 10: ANALYTICS
// ============================================

model AuditLog {
  id          String   @id @default(uuid())
  tenantId    String
  userId      String?
  action      String   // "protocol.create", "user.login", etc
  resource    String   // "Protocol", "User", etc
  resourceId  String?
  oldData     Json?
  newData     Json?
  ipAddress   String?
  createdAt   DateTime @default(now())

  @@index([tenantId, action])
  @@index([tenantId, createdAt])
}

// ============================================
// ENUMS
// ============================================

enum PlanType {
  FREE       // Até 5.000 hab
  BASIC      // Até 20.000 hab
  PRO        // Até 100.000 hab
  ENTERPRISE // 100.000+ hab
}

enum SubscriptionStatus {
  ACTIVE
  SUSPENDED
  CANCELLED
  TRIAL
}

enum UserRole {
  AGENT          // Servidor/atendente
  COORDINATOR    // Coordenador de departamento
  MANAGER        // Gerente
  ADMIN          // Admin do tenant
  SUPER_ADMIN    // Admin da plataforma SaaS
}

enum ProtocolStatus {
  OPEN           // Aberto (novo)
  IN_PROGRESS    // Em andamento
  PENDING        // Pendência com cidadão
  ON_HOLD        // Suspenso (aguardando algo)
  COMPLETED      // Concluído
  CANCELLED      // Cancelado
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum InteractionType {
  COMMENT
  STATUS_CHANGE
  ASSIGNMENT
  DOCUMENT_UPLOAD
  SYSTEM_NOTE
}

enum AuthorType {
  CITIZEN
  USER
  SYSTEM
  BOT
}

enum ConversationType {
  CITIZEN_SUPPORT
  INTERNAL
  BOT
}

enum ConversationStatus {
  OPEN
  WAITING
  CLOSED
}

enum SenderType {
  CITIZEN
  USER
  BOT
  SYSTEM
}

enum MessageContentType {
  TEXT
  IMAGE
  FILE
  LOCATION
  MENU
  FORM
}

enum NotificationType {
  PROTOCOL_UPDATE
  PROTOCOL_ASSIGNMENT
  MESSAGE_NEW
  DOCUMENT_READY
  SLA_WARNING
  SYSTEM_ALERT
}

enum NotificationChannel {
  IN_APP
  EMAIL
  PUSH
  SMS
}

enum FlowExecutionStatus {
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}

enum WorkflowExecutionStatus {
  RUNNING
  PAUSED
  COMPLETED
  FAILED
}

enum CertificateStatus {
  ACTIVE
  REVOKED
  EXPIRED
}

enum FamilyRelation {
  SPOUSE
  CHILD
  PARENT
  SIBLING
  OTHER
}
```

**Total: ~32 models + ~20 enums** — vs 213 models do DigiUrban. Dados semi-estruturados usam JSON.

---

## 5. FUNCIONALIDADES COMPLETAS (o que implementar)

### 5.1 Módulo de Autenticação
- [ ] Login/registro de servidores (email + senha)
- [ ] Login/registro de cidadãos (CPF + senha)
- [ ] Integração OAuth 2.0 com gov.br (SSO)
- [ ] JWT em cookies HTTP-only com refresh token
- [ ] Controle de sessões ativas (listar, revogar)
- [ ] Recuperação de senha por email
- [ ] 2FA opcional (TOTP)
- [ ] Rate limiting por IP no login (5 tentativas/15min)

### 5.2 Gestão de Tenants (Super Admin)
- [ ] CRUD de tenants (municípios)
- [ ] Configuração de plano (FREE, BASIC, PRO, ENTERPRISE)
- [ ] Customização de branding (logo, cores, domínio)
- [ ] Ativação/desativação de módulos por tenant
- [ ] Dashboard de uso por tenant
- [ ] Billing/faturamento (integração futura com Stripe/Asaas)

### 5.3 Gestão Organizacional
- [ ] CRUD de departamentos (hierarquia pai-filho)
- [ ] CRUD de servidores públicos
- [ ] Atribuição de roles por departamento
- [ ] Organograma visual
- [ ] Transferência de servidores entre departamentos

### 5.4 Catálogo de Serviços
- [ ] CRUD de serviços com formulário dinâmico (JSON Schema)
- [ ] Catálogo público para cidadãos com busca e filtros
- [ ] Categorização (Saúde, Educação, Infraestrutura, Social, etc.)
- [ ] Configuração de SLA por serviço
- [ ] Requisitos e documentos necessários
- [ ] Ícones e ordenação visual

### 5.5 Protocolos (Core)
- [ ] Abertura via portal cidadão ou admin
- [ ] Numeração sequencial por tenant/ano (`2026/000001`)
- [ ] Status machine: OPEN → IN_PROGRESS → COMPLETED/CANCELLED
- [ ] Status intermediários: PENDING, ON_HOLD
- [ ] Histórico completo de mudanças de status
- [ ] Atribuição a servidor (manual ou automática round-robin)
- [ ] Prioridade (LOW, MEDIUM, HIGH, URGENT)
- [ ] Interações (comentários internos + públicos)
- [ ] Upload de documentos
- [ ] Notas internas (visíveis só para servidores)
- [ ] SLA automático com alertas de vencimento
- [ ] Avaliação pós-conclusão pelo cidadão (1-5 estrelas)
- [ ] Filtros avançados (status, departamento, servidor, período, prioridade)
- [ ] Export CSV/PDF
- [ ] Busca full-text

### 5.6 Motor de Workflows
- [ ] Editor visual de workflows (drag & drop) estilo n8n
- [ ] Nodos: Condição, Ação, Notificação, Aprovação, Timer, Script
- [ ] Vinculação de workflow a serviço
- [ ] Execução automática ao abrir protocolo
- [ ] Histórico de execução
- [ ] Templates de workflow pré-configurados

### 5.7 Documentos
- [ ] Templates de documentos (Handlebars + HTML)
- [ ] Editor WYSIWYG (TipTap) para templates
- [ ] Geração automática de PDF a partir de template + dados
- [ ] Variáveis dinâmicas (protocolo, cidadão, data, etc.)
- [ ] Assinatura digital automática (placeholder no template)
- [ ] Certificado digital do sistema (auto-assinado ou ICP-Brasil)
- [ ] Histórico de documentos gerados

### 5.8 Mensagens e Chat
- [ ] Chat em tempo real cidadão ↔ servidor (Socket.IO)
- [ ] Bot conversacional com fluxos configuráveis
- [ ] Fluxos: menu principal, consultar protocolo, solicitar serviço, meu perfil
- [ ] Typing indicator
- [ ] Upload de arquivos no chat
- [ ] Transferência de bot para atendimento humano
- [ ] Histórico de conversas

### 5.9 Notificações
- [ ] Notificações in-app (bell icon com badge)
- [ ] SSE (Server-Sent Events) para real-time
- [ ] Email (SMTP ou serviço como Resend/SendGrid)
- [ ] Web Push notifications
- [ ] Configuração granular pelo usuário (quais tipos receber)
- [ ] Horário de silêncio

### 5.10 Analytics e Relatórios
- [ ] Dashboard com métricas em tempo real (protocolos, SLA, satisfação)
- [ ] Gráficos de tendência (Recharts)
- [ ] KPIs por departamento, serviço, servidor
- [ ] Relatórios pré-configurados (templates)
- [ ] Export CSV/PDF
- [ ] Comparação entre períodos

### 5.11 Portal do Cidadão
- [ ] Landing page institucional (por tenant)
- [ ] Login via CPF + senha ou gov.br
- [ ] Catálogo de serviços com busca
- [ ] Abertura de protocolo com formulário dinâmico
- [ ] Acompanhamento de protocolos
- [ ] Chat com bot e atendimento humano
- [ ] Meus documentos
- [ ] Perfil + composição familiar
- [ ] Avaliação de atendimento
- [ ] PWA (instalável no celular)
- [ ] Design mobile-first

### 5.12 Configurações do Admin
- [ ] Perfil (nome, avatar, senha)
- [ ] Aparência (tema claro/escuro/sistema)
- [ ] Notificações (granulares por tipo)
- [ ] Segurança (sessões ativas, 2FA)

---

## 6. REGRAS DE QUALIDADE (NÃO NEGOCIÁVEIS)

### 6.1 TypeScript Strict
```json
// tsconfig.json — OBRIGATÓRIO
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**NUNCA usar `ignoreBuildErrors: true` ou `ignoreDuringBuilds: true`** no Next.js. Todos os erros devem ser corrigidos.

### 6.2 Zero console.log
- Use Winston/Pino para logging com níveis: `error`, `warn`, `info`, `debug`
- Nenhum `console.log`, `console.warn`, `console.error` no código
- Logger deve incluir: timestamp, nível, contexto (módulo), tenant_id

### 6.3 Testes desde o dia 1
- **Unit tests**: Jest para services e utils
- **Integration tests**: Supertest para endpoints
- **E2E tests**: Playwright para fluxos críticos (login, abrir protocolo, chat)
- **Cobertura mínima**: 80%
- Rodar testes no CI antes de qualquer merge

### 6.4 Segurança
- CORS restrito por tenant (whitelist de origens)
- Rate limiting APLICADO em todas as rotas (não só definido)
- Helmet.js com CSP configurado
- Input validation em TODOS os endpoints (class-validator ou Zod)
- SQL injection prevenido (Prisma parameterized queries)
- XSS prevenido (sanitização de HTML)
- CSRF protection em formulários
- Upload seguro (validação de tipo, tamanho, malware scan opcional)
- Secrets em variáveis de ambiente (nunca hardcoded)
- Audit log para ações sensíveis

### 6.5 Performance
- Prisma queries com `select` específico (nunca `findMany` sem filtro)
- Redis cache para dados frequentes (dashboard stats, catálogo de serviços)
- Paginação em TODAS as listagens (cursor-based preferred)
- Índices no banco para campos de busca/filtro
- Lazy loading de módulos no frontend
- Image optimization (Next.js Image)
- Bundle analysis periódico

### 6.6 Código Limpo
- Máximo 200 linhas por arquivo (exceto schema.prisma)
- Máximo 30 linhas por função
- Nomes descritivos em inglês
- Um módulo NestJS = um domínio
- DTOs para TODOS os inputs
- Response DTOs para outputs padronizados
- Sem código morto, sem TODOs, sem FIXMEs no merge
- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`

---

## 7. PRIORIDADES DE IMPLEMENTAÇÃO

### Fase 1 — Fundação (Semana 1-2)
1. Setup do monorepo (Turborepo + workspaces)
2. NestJS API com módulos: Auth, Tenants, Users, Health
3. Prisma schema completo com RLS
4. Next.js com layout base (public + admin + citizen)
5. Login/registro admin + cidadão
6. Docker Compose (dev)

### Fase 2 — Core (Semana 3-4)
7. Departments + Services (CRUD completo)
8. Protocols (abertura, status, interações, SLA)
9. Portal do cidadão (catálogo, abertura, acompanhamento)
10. Upload de documentos
11. Notificações in-app (SSE)

### Fase 3 — Comunicação (Semana 5-6)
12. Chat em tempo real (Socket.IO)
13. Bot conversacional (flow engine)
14. Fluxos: menu principal, consultar protocolo, solicitar serviço
15. Email notifications (SMTP/Resend)

### Fase 4 — Documentos & Analytics (Semana 7-8)
16. Templates de documentos (WYSIWYG + Handlebars)
17. Geração de PDF
18. Assinatura digital
19. Dashboard analítico
20. Relatórios + export CSV/PDF

### Fase 5 — Polish (Semana 9-10)
21. Workflows configuráveis
22. PWA + push notifications
23. Testes E2E dos fluxos principais
24. Otimização de performance
25. Documentação (API + guia de uso)

---

## 8. PADRÕES DE CÓDIGO (EXEMPLOS)

### 8.1 Controller NestJS (padrão)

```typescript
@Controller('protocols')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiTags('Protocols')
export class ProtocolsController {
  constructor(private readonly protocolsService: ProtocolsService) {}

  @Post()
  @Roles(UserRole.AGENT, UserRole.COORDINATOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new protocol' })
  async create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: UserPayload,
    @Body() dto: CreateProtocolDto,
  ): Promise<ProtocolResponseDto> {
    return this.protocolsService.create(tenantId, user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List protocols with filters' })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() filters: ProtocolFiltersDto,
  ): Promise<PaginatedResponse<ProtocolResponseDto>> {
    return this.protocolsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get protocol by ID' })
  async findOne(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ProtocolResponseDto> {
    return this.protocolsService.findOne(tenantId, id);
  }

  @Patch(':id/status')
  @Roles(UserRole.AGENT, UserRole.COORDINATOR)
  @ApiOperation({ summary: 'Change protocol status' })
  async changeStatus(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: UserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
  ): Promise<ProtocolResponseDto> {
    return this.protocolsService.changeStatus(tenantId, user, id, dto);
  }
}
```

### 8.2 Service NestJS (padrão)

```typescript
@Injectable()
export class ProtocolsService {
  private readonly logger = new Logger(ProtocolsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly slaService: ProtocolSlaService,
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateProtocolDto): Promise<ProtocolResponseDto> {
    const protocolNumber = await this.generateProtocolNumber(tenantId);

    const protocol = await this.prisma.protocol.create({
      data: {
        tenantId,
        protocolNumber,
        citizenId: dto.citizenId,
        serviceId: dto.serviceId,
        departmentId: dto.departmentId,
        title: dto.title,
        description: dto.description,
        formData: dto.formData,
        priority: dto.priority ?? Priority.MEDIUM,
      },
      select: {
        id: true,
        protocolNumber: true,
        status: true,
        title: true,
        createdAt: true,
        citizen: { select: { id: true, name: true } },
        service: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
      },
    });

    // Criar SLA
    await this.slaService.createForProtocol(protocol.id, dto.serviceId);

    // Emitir evento (assíncrono)
    this.eventEmitter.emit('protocol.created', { tenantId, protocol });

    this.logger.log(`Protocol ${protocol.protocolNumber} created in tenant ${tenantId}`);

    return protocol;
  }
}
```

### 8.3 DTO com validação (padrão)

```typescript
export class CreateProtocolDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Protocol title' })
  title: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Protocol description', required: false })
  description?: string;

  @IsUUID()
  @ApiProperty({ description: 'Citizen ID' })
  citizenId: string;

  @IsUUID()
  @ApiProperty({ description: 'Service ID' })
  serviceId: string;

  @IsUUID()
  @ApiProperty({ description: 'Department ID' })
  departmentId: string;

  @IsEnum(Priority)
  @IsOptional()
  @ApiProperty({ enum: Priority, default: Priority.MEDIUM })
  priority?: Priority;

  @IsObject()
  @IsOptional()
  @ApiProperty({ description: 'Dynamic form data', required: false })
  formData?: Record<string, unknown>;
}
```

### 8.4 Componente React (padrão)

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { columns } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { ProtocolFilters } from './protocol-filters';
import { api } from '@/lib/api-client';
import { Protocol } from '@/types/models';

interface ProtocolsListProps {
  departmentId?: string;
}

export function ProtocolsList({ departmentId }: ProtocolsListProps) {
  const [filters, setFilters] = useState<ProtocolFilters>({});

  const { data, isLoading } = useQuery({
    queryKey: ['protocols', { ...filters, departmentId }],
    queryFn: () => api.get<PaginatedResponse<Protocol>>('/protocols', {
      params: { ...filters, departmentId },
    }),
  });

  return (
    <div className="space-y-4">
      <ProtocolFilters value={filters} onChange={setFilters} />
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        pagination={data?.pagination}
      />
    </div>
  );
}
```

### 8.5 Prisma Service com RLS (padrão)

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  /**
   * Execute a callback within a tenant context (RLS)
   */
  async withTenant<T>(tenantId: string, callback: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.tenant_id = '${tenantId}'`);
      return callback(tx as unknown as PrismaClient);
    });
  }
}
```

---

## 9. ANTI-PADRÕES (O QUE NÃO FAZER)

Estes são problemas reais encontrados no DigiUrban que o CidadON **NUNCA** deve replicar:

| Anti-padrão | Exemplo do DigiUrban | Solução CidadON |
|-------------|---------------------|-----------------|
| Registro manual de rotas | 73 `app.use()` em index.ts de 727 linhas | NestJS auto-discovery de módulos |
| console.log em produção | 1.150+ console.log/warn/error | Winston/Pino com níveis |
| Ignorar erros de build | `ignoreBuildErrors: true` | `strict: true`, zero erros |
| CORS permissivo | `callback(null, true)` sempre | Whitelist por tenant |
| Rate limiting não aplicado | Definido mas nunca usado | Aplicado globalmente via guard |
| Schema monolítico | 213 models, 8.252 linhas | Max 60-80 models, JSON para dados dinâmicos |
| Zero testes | Nenhum test file existente | 80% cobertura mínima, CI obrigatório |
| Models redundantes | Protocol + ProtocolSimplified | Um model por conceito |
| N+1 queries | 465 findMany sem select | Sempre select específico |
| Upload no filesystem | Arquivos em `uploads/` local | S3/MinIO com URLs assinadas |
| Monolito Docker | 1 container com supervisor | Container por serviço |
| Sem audit log | Ações não rastreadas | AuditLog para tudo |
| Secrets expostos | Logs com tokens em debug | Logging sanitizado |

---

## 10. VARIÁVEIS DE AMBIENTE

```env
# === OBRIGATÓRIAS ===
DATABASE_URL=postgresql://cidadon:password@localhost:5432/cidadon
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=<chave-secreta-256-bits>
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# Tenant
DEFAULT_TENANT_SLUG=demo

# === OPCIONAIS ===
# Storage (S3/MinIO)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=cidadon

# Email
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=<api-key>

# gov.br OAuth
GOVBR_CLIENT_ID=
GOVBR_CLIENT_SECRET=
GOVBR_REDIRECT_URI=

# Certificado digital
CERTIFICATE_ENCRYPTION_KEY=<chave-AES-256>

# IA (opcional)
OLLAMA_URL=http://localhost:11434
OPENAI_API_KEY=

# Ambiente
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=info
```

---

## 11. DOCKER COMPOSE (DESENVOLVIMENTO)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: cidadon
      POSTGRES_PASSWORD: cidadon_dev
      POSTGRES_DB: cidadon
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/init.sql:/docker-entrypoint-initdb.d/01-init.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://cidadon:cidadon_dev@postgres:5432/cidadon
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret-change-in-production
      NODE_ENV: development
    depends_on:
      - postgres
      - redis
    volumes:
      - ./apps/api/src:/app/src

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
      NEXT_PUBLIC_WS_URL: http://localhost:3001
    depends_on:
      - api

volumes:
  postgres_data:
  minio_data:
```

---

## 12. CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: cidadon_test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/cidadon_test

  build:
    runs-on: ubuntu-latest
    needs: [lint-and-typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
```

---

## 13. ENTREGÁVEIS ESPERADOS

Ao concluir a implementação, o projeto deve conter:

1. **Monorepo funcional** com Turborepo/npm workspaces
2. **Backend NestJS** com todos os módulos listados e Swagger documentado
3. **Frontend Next.js** com todas as páginas listadas, responsivo e com dark mode
4. **Prisma schema** com ~32 models e RLS configurado
5. **Docker Compose** funcional para dev e produção
6. **Testes** com 80%+ de cobertura
7. **CI/CD** com GitHub Actions (lint + type-check + test + build)
8. **Seed** de dados para demonstração (tenant demo com dados realistas)
9. **README.md** com guia de instalação e contribuição
10. **CLAUDE.md** com instruções para IA assistente

---

## 14. COMO COMEÇAR

```bash
# 1. Criar o diretório do projeto
mkdir cidadon && cd cidadon

# 2. Iniciar monorepo
npm init -y
npm install -D turbo

# 3. Criar apps
mkdir -p apps/api apps/web packages/shared-types packages/shared-utils

# 4. Setup NestJS (backend)
cd apps/api
npx @nestjs/cli new . --package-manager npm --skip-git

# 5. Setup Next.js (frontend)
cd ../web
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"

# 6. Instalar shadcn/ui
npx shadcn@latest init

# 7. Setup Prisma
cd ../api
npm install @prisma/client
npm install -D prisma
npx prisma init

# 8. Subir infraestrutura
cd ../..
docker compose up -d postgres redis minio

# 9. Rodar migrations + seed
cd apps/api
npx prisma migrate dev
npx prisma db seed

# 10. Iniciar dev
cd ../..
npm run dev  # turbo run dev
```

---

## LEMBRETE FINAL

**Este prompt é a especificação completa.** Ao executá-lo no Claude Code:

1. **PRIMEIRO**: Crie `PLANO_IMPLEMENTACAO.md` com cronograma detalhado, decisões arquiteturais, e order de implementação. Aguarde aprovação.
2. **DEPOIS**: Implemente seguindo o plano aprovado, fase por fase.
3. **SEMPRE**: Mantenha o CLAUDE.md atualizado conforme implementa.
4. **NUNCA**: Pule testes, ignore erros de tipo, ou use console.log.

O objetivo é criar uma plataforma que seja a **antítese do DigiUrban** — onde ele é monolítico, nós somos modulares. Onde ele ignora erros, nós os tratamos. Onde ele tem 213 models, nós temos 32. Onde ele tem zero testes, nós temos 80%+. Onde ele é single-tenant, nós somos multi-tenant nativo.

**CidadON — Sua cidade sempre ON. Governo digital, simples e escalável.**
