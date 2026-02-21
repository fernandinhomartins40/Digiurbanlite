# Manual Técnico Completo — DigiUrban

> Plataforma de Governo Digital para Gestão Municipal
> Versão: 1.0 | Última atualização: Fevereiro 2026

---

## Sumário

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Stack Tecnológica Detalhada](#2-stack-tecnológica-detalhada)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [Backend — Express + Prisma](#4-backend--express--prisma)
   - 4.1 [Inicialização e Registro de Rotas](#41-inicialização-e-registro-de-rotas)
   - 4.2 [Middlewares Globais](#42-middlewares-globais)
   - 4.3 [Sistema de Autenticação](#43-sistema-de-autenticação)
   - 4.4 [Sistema de Autorização e Permissões](#44-sistema-de-autorização-e-permissões)
   - 4.5 [Configuração de Segurança](#45-configuração-de-segurança)
   - 4.6 [Sistema de Logs](#46-sistema-de-logs)
   - 4.7 [Rate Limiting](#47-rate-limiting)
   - 4.8 [Upload de Arquivos](#48-upload-de-arquivos)
   - 4.9 [Validação de Dados](#49-validação-de-dados)
   - 4.10 [WebSocket (Socket.IO)](#410-websocket-socketio)
5. [Serviços de Negócio](#5-serviços-de-negócio)
   - 5.1 [Protocolos](#51-protocolos)
   - 5.2 [Geração de Documentos PDF](#52-geração-de-documentos-pdf)
   - 5.3 [Certificados Digitais e Assinatura](#53-certificados-digitais-e-assinatura)
   - 5.4 [Notificações](#54-notificações)
   - 5.5 [Analytics e KPIs](#55-analytics-e-kpis)
   - 5.6 [SLA de Protocolos](#56-sla-de-protocolos)
6. [Banco de Dados — Prisma Schema (213 Models)](#6-banco-de-dados--prisma-schema-213-models)
   - 6.1 [Auth e Usuários](#61-auth-e-usuários)
   - 6.2 [Protocolos e Fluxo](#62-protocolos-e-fluxo)
   - 6.3 [Certificados Digitais](#63-certificados-digitais)
   - 6.4 [Bot e IA](#64-bot-e-ia)
   - 6.5 [Mensagens e Canais](#65-mensagens-e-canais)
   - 6.6 [Email e Comunicação](#66-email-e-comunicação)
   - 6.7 [Analytics e Relatórios](#67-analytics-e-relatórios)
   - 6.8 [Saúde — Atendimento](#68-saúde--atendimento)
   - 6.9 [Saúde — Farmácia](#69-saúde--farmácia)
   - 6.10 [Saúde — TFD](#610-saúde--tfd)
   - 6.11 [Educação](#611-educação)
   - 6.12 [Assistência Social](#612-assistência-social)
   - 6.13 [Vinculação de Servidores V2.0](#613-vinculação-de-servidores-v20)
   - 6.14 [Cadastros Municipais](#614-cadastros-municipais)
   - 6.15 [Enums Principais](#615-enums-principais)
7. [API — Catálogo de Endpoints (291+)](#7-api--catálogo-de-endpoints-291)
   - 7.1 [Autenticação Admin](#71-autenticação-admin)
   - 7.2 [Autenticação Cidadão](#72-autenticação-cidadão)
   - 7.3 [Protocolos Simplificados](#73-protocolos-simplificados)
   - 7.4 [Serviços do Cidadão](#74-serviços-do-cidadão)
   - 7.5 [Saúde — Farmácia](#75-saúde--farmácia)
   - 7.6 [Saúde — TFD](#76-saúde--tfd)
   - 7.7 [Templates de Documentos](#77-templates-de-documentos)
   - 7.8 [Certificados Digitais](#78-certificados-digitais)
   - 7.9 [Rotas Internas (Messages Server)](#79-rotas-internas-messages-server)
   - 7.10 [Demais Rotas Registradas](#710-demais-rotas-registradas)
8. [Frontend — Next.js 14](#8-frontend--nextjs-14)
   - 8.1 [Configuração e Layout](#81-configuração-e-layout)
   - 8.2 [PWA e Service Worker](#82-pwa-e-service-worker)
   - 8.3 [API Client e Comunicação](#83-api-client-e-comunicação)
   - 8.4 [WebSocket Client](#84-websocket-client)
   - 8.5 [Design System (Tailwind)](#85-design-system-tailwind)
   - 8.6 [Dependências Principais](#86-dependências-principais)
9. [Messages Server — ChatBot e Mensageria](#9-messages-server--chatbot-e-mensageria)
   - 9.1 [Arquitetura do Messages Server](#91-arquitetura-do-messages-server)
   - 9.2 [FlowEngine — Motor de Fluxos](#92-flowengine--motor-de-fluxos)
   - 9.3 [Action Handlers (19 handlers)](#93-action-handlers-19-handlers)
   - 9.4 [Node Executors (9 tipos)](#94-node-executors-9-tipos)
   - 9.5 [API REST do Messages Server](#95-api-rest-do-messages-server)
   - 9.6 [WebSocket Server (Socket.IO)](#96-websocket-server-socketio)
   - 9.7 [Integração com Backend (DigiUrbanIntegration)](#97-integração-com-backend-digiurbanintegration)
10. [SMTP Server](#10-smtp-server)
11. [Docker e Deploy](#11-docker-e-deploy)
    - 11.1 [Dockerfile Multi-Stage](#111-dockerfile-multi-stage)
    - 11.2 [Docker Compose](#112-docker-compose)
    - 11.3 [Nginx (Reverse Proxy)](#113-nginx-reverse-proxy)
    - 11.4 [Supervisord](#114-supervisord)
    - 11.5 [Script de Startup](#115-script-de-startup)
    - 11.6 [CI/CD — GitHub Actions](#116-cicd--github-actions)
12. [Variáveis de Ambiente](#12-variáveis-de-ambiente)
13. [Instalação e Desenvolvimento Local](#13-instalação-e-desenvolvimento-local)
14. [Máquina de Estados dos Protocolos](#14-máquina-de-estados-dos-protocolos)
15. [Fluxos de Negócio Críticos](#15-fluxos-de-negócio-críticos)

---

## 1. Visão Geral da Arquitetura

O DigiUrban é uma plataforma completa de governo digital composta por **4 serviços** orquestrados via Docker Compose, com PostgreSQL e Redis compartilhados:

```
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (porta 80)                         │
│              Reverse Proxy + Load Balancer                  │
├──────────┬──────────────┬───────────────────────────────────┤
│ Frontend │   Backend    │   Messages Server                 │
│ Next.js  │   Express    │   Socket.IO + Bot Engine          │
│ :3000    │   :3001      │   :9001                           │
├──────────┴──────────────┴───────────────────────────────────┤
│               PostgreSQL :5432                              │
│               Redis :6379                                   │
│               Ollama :11434 (IA Local)                      │
└─────────────────────────────────────────────────────────────┘
│               SMTP Server                                   │
│               :25 (MX) + :587 (Submission)                  │
└─────────────────────────────────────────────────────────────┘
```

| Serviço | Tecnologia | Porta | Descrição |
|---------|-----------|-------|-----------|
| **digiurban** | Next.js 14 + Express 5 + Nginx | 3060→80 | Container único (frontend + backend + proxy) |
| **ultrazend-messages** | Express + Socket.IO + Redis | 9001 | Mensagens em tempo real + ChatBot |
| **ultrazend-smtp** | smtp-server + Nodemailer | 25, 587 | Servidor SMTP com entrega MX direta + DKIM |
| **postgres** | PostgreSQL 15 | 5432 | Banco de dados principal |
| **redis** | Redis 7 | 6379 | Cache + WebSocket adapter |
| **ollama** | Ollama | 11434 | IA local (LLM) para DigiBot |

**Fluxo de comunicação:**

1. Todo tráfego entra pelo **Nginx** (porta 80 interna, 3060 externa)
2. Nginx roteia: `/api/` → Backend:3001, `/` → Frontend:3000, `/socket.io/` → Messages:9001
3. Backend comunica com Messages Server via **rotas internas** (`/api/internal/`)
4. Messages Server comunica com Backend via **DigiUrbanIntegration** (HTTP com token de serviço)
5. Backend envia emails via **SMTP Server** (porta 587)
6. Backend consulta **Ollama** para respostas de IA (porta 11434)

---

## 2. Stack Tecnológica Detalhada

### Backend (`digiurban/backend/`)
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Node.js | 20 LTS | Runtime |
| TypeScript | 5.9 | Tipagem estática |
| Express | 5.1 | Framework HTTP |
| Prisma | 6.19 | ORM (PostgreSQL) — **213 models** |
| JWT | - | Auth em cookies HTTP-only |
| Socket.IO | 4.8 | WebSocket em tempo real |
| BullMQ + Redis | - | Filas de notificações |
| Nodemailer | 7 | Envio de emails |
| Playwright | - | Geração de PDF via Chromium |
| Handlebars | - | Templates de documentos |
| node-forge | - | Certificados digitais X.509 |
| Winston | - | Logs com rotação diária |
| Multer | - | Upload de arquivos |
| Helmet | - | Headers de segurança |
| bcrypt | 12 rounds | Hash de senhas |
| Zod + Joi | - | Validação de dados |
| date-fns | - | Cálculos de data/SLA |

### Frontend (`digiurban/frontend/`)
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Next.js | 14.2 | Framework React (App Router) |
| React | 18.3 | UI Library |
| TypeScript | 5.9 | Tipagem |
| Tailwind CSS | 3.4 | Estilização |
| shadcn/ui (Radix UI) | - | 11+ componentes acessíveis |
| TanStack React Query | 5.90 | Gerenciamento de estado (server state) |
| react-hook-form + Zod | - | Formulários com validação |
| Socket.IO Client | 4.8 | WebSocket em tempo real |
| TipTap | 3.19 | Editor WYSIWYG (Word-like) |
| Recharts | 3.5 | Gráficos e visualizações |
| Leaflet | 1.9 | Mapas interativos |
| pdfjs-dist + react-pdf | 5.4 / 10.3 | Visualização de PDFs |
| next-pwa | 10.2 | PWA com Service Worker |
| Lucide React | 0.544 | Ícones SVG |
| ReactFlow | 11.11 | Diagramas de fluxo |
| xlsx | 0.18 | Export para Excel |
| jscanify | 1.4 | Scanner de documentos (câmera) |

### Messages Server (`ultrazend-messages-server/`)
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| Express | 5 | Framework HTTP |
| Socket.IO | 4.8 | WebSocket + Redis adapter |
| Prisma | 6.19 | ORM (PostgreSQL compartilhado) |
| FlowEngine | Custom | Motor de fluxos n8n-style |
| Axios | - | HTTP client para integração |

### SMTP Server (`ultrazend-smtp-server/`)
| Tecnologia | Versão | Uso |
|-----------|--------|-----|
| smtp-server | 3.14 | Servidor SMTP |
| Nodemailer | - | Entrega MX direta |
| DKIM | RSA 2048 | Assinatura de emails |
| Prisma | - | SQLite ou PostgreSQL |

---

## 3. Estrutura do Projeto

```
Digiurbanlite/
├── digiurban/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/           # Configurações (logger, status, security)
│   │   │   ├── middleware/       # Auth, rate-limit, validation, upload
│   │   │   ├── routes/           # 98 arquivos de rotas (~891 endpoints)
│   │   │   ├── services/         # 86 serviços de negócio
│   │   │   ├── workers/          # BullMQ workers (notificações)
│   │   │   ├── jobs/             # Cron jobs (email, notificações)
│   │   │   ├── socket.ts         # Inicialização Socket.IO
│   │   │   ├── data/             # Dados estáticos (seeds JSON)
│   │   │   ├── seeds/            # Scripts de seed
│   │   │   └── index.ts          # Entry point (~396 linhas)
│   │   ├── prisma/
│   │   │   └── schema.prisma     # 213 models
│   │   ├── templates/            # Templates HTML para documentos
│   │   ├── scripts/              # Scripts utilitários
│   │   └── uploads/              # Diretório de uploads
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/              # Next.js App Router (220+ páginas)
│   │   │   │   ├── admin/        # Painel administrativo
│   │   │   │   ├── cidadao/      # Portal do cidadão
│   │   │   │   └── layout.tsx    # Layout raiz (SEO, PWA, providers)
│   │   │   ├── components/       # Componentes React organizados por domínio
│   │   │   ├── hooks/            # 45 hooks customizados
│   │   │   └── lib/              # Utilitários, API clients, services
│   │   ├── public/               # Assets estáticos + PWA manifest
│   │   ├── next.config.js        # Configuração Next.js + PWA
│   │   └── tailwind.config.js    # Design system
│   └── docker/                   # Configs Nginx, Supervisord, SQL scripts
├── ultrazend-messages-server/
│   ├── src/
│   │   ├── bot/                  # Motor de fluxos (FlowEngine)
│   │   │   ├── flow/
│   │   │   │   ├── FlowEngine.ts
│   │   │   │   ├── FlowStateManager.ts
│   │   │   │   ├── NodeExecutors.ts
│   │   │   │   ├── ActionHandlers.ts
│   │   │   │   ├── TemplateEngine.ts
│   │   │   │   ├── InputValidator.ts
│   │   │   │   └── flows/        # 9 fluxos JSON pré-configurados
│   │   │   └── FlowEngineService.ts
│   │   ├── delivery/             # Conversas, canais, WhatsApp
│   │   │   ├── ConversationService.ts
│   │   │   ├── ChannelService.ts
│   │   │   └── DigiUrbanIntegration.ts
│   │   └── server/               # Express + WebSocket
│   │       ├── ExpressServer.ts
│   │       └── WebSocketServer.ts
│   └── prisma/
├── ultrazend-smtp-server/
│   ├── src/
│   │   ├── server/               # SMTP servers (MX + Submission)
│   │   ├── delivery/             # MX delivery direto
│   │   └── security/             # DKIM manager
│   └── prisma/
├── docker-compose.vps.yml        # Orquestração de todos os serviços
├── Dockerfile                    # Multi-stage build (backend + frontend + nginx)
├── .github/workflows/            # CI/CD (GitHub Actions)
└── docker/                       # Nginx, Supervisord, SQL scripts, startup.sh
```

---

## 4. Backend — Express + Prisma

### 4.1 Inicialização e Registro de Rotas

O entry point está em `digiurban/backend/src/index.ts` (~396 linhas, refatorado de 727). Na inicialização:

1. **Valida JWT_SECRET** — Se não definido, `process.exit(1)` (fatal)
2. **Aplica middlewares globais** (Helmet, CORS, Morgan, Winston, body parser, cookie parser)
3. **Registra ~94 prefixos de rota** via `app.use()` com try/catch individual (helper `loadRoute()`)
4. **Inicializa WebSocket** via `initializeSocket(httpServer)`
5. **Inicia workers** (notification worker, notification cron jobs)
6. **Inicia cron jobs de email** após servidor escutar
7. **Configura graceful shutdown** (SIGTERM/SIGINT)

**Rotas registradas (~94 prefixos):**

| Prefixo | Arquivo | Descrição |
|---------|---------|-----------|
| `/api/admin/auth` | admin-auth | Login, logout, me, permissões |
| `/api/citizen/auth` | citizen-auth | Cadastro, login, perfil |
| `/api/admin/preferences` | admin-preferences | Preferências do admin (15 endpoints) |
| `/api/internal` | internal.routes | Integração Messages Server (25 endpoints) |
| `/api/admin/flows` | admin-flows.routes | Gerenciamento de fluxos bot |
| `/api/messages` | messages | Mensagens admin |
| `/api/avatar` | avatar.routes | Upload/serve avatares |
| `/api/public/validate` | public-validation.routes | Validação pública de documentos |
| `/api/certificates` | certificates.routes | Emissão, revogação, assinatura |
| `/api/documents` | external-documents.routes | Documentos externos |
| `/api/documents` | document-signing.routes | Assinatura de documentos |
| `/api/signatures` | signatures.routes | Verificação de assinaturas |
| `/api/super-admin` | super-admin | Operações super admin |
| `/api/super-admin` | super-admin-email | Email super admin |
| `/api/email-templates` | email-templates | Templates de email |
| `/api/public` | public | Endpoints públicos |
| `/api/citizen/services` | citizen-services | Catálogo de serviços (12 endpoints) |
| `/api/services` | services | Gestão de serviços |
| `/api/departments` | department-stats | Estatísticas departamento |
| `/api/document-upload` | document-upload.routes | Upload de documentos |
| `/api` | dynamic-services | Serviços dinâmicos |
| `/api/admin/users` | admin-users | Gestão de usuários |
| `/api/admin` | admin-management | Gestão admin |
| `/api/admin` | admin-dynamic-services | Serviços dinâmicos admin |
| `/api/admin/citizen-lookup` | admin-citizen-lookup | Busca de cidadãos |
| `/api/protocols` | protocol-sla | SLA de protocolos |
| `/api/protocols` | protocol-interactions | Interações |
| `/api/protocols` | protocol-documents | Documentos |
| `/api` | protocol-data-fields | Campos de dados |
| `/api/protocols` | protocol-pendings | Pendências |
| `/api/protocols` | protocol-stages | Etapas |
| `/api` | document-templates | Templates de documentos |
| `/api/protocols` | protocols-simplified.routes | Protocolos (44 endpoints) |
| `/api/admin/chamados` | admin-chamados | Chamados |
| `/api/departments` | departments-tickets | Tickets departamento |
| `/api/admin/relatorios` | admin-reports | Relatórios |
| `/api/admin/gabinete` | admin-gabinete | Gabinete do prefeito |
| `/api/admin/citizens` | admin-citizens | Gestão cidadãos |
| `/api/admin/citizen-documents` | admin-citizen-documents | Documentos cidadão |
| `/api/citizens` | citizens | Cidadãos público |
| `/api/citizen/protocols` | citizen-protocols | Protocolos cidadão |
| `/api/citizen/family` | citizen-family + family-invites | Família + convites |
| `/api/citizen/documents` | citizen-documents | Documentos cidadão |
| `/api/citizen/personal-documents` | citizen-personal-documents | Docs pessoais |
| `/api/citizen/notifications` | citizen-notifications | Notificações cidadão |
| `/api/admin/secretarias` | tab-modules | Módulos por abas |
| `/api/protocol-analytics` | protocol-analytics.routes | Dashboard, trends, CSV, KPIs |
| `/api/analytics` | analytics | Analytics genérico |
| `/api/admin/custom-modules` | custom-modules | Módulos customizados |
| `/api/admin/email` | admin-email | Email admin |
| `/api/admin/email-accounts` | admin-email-accounts | Contas email |
| `/api/integrations` | integrations | Integrações |
| `/api/municipality` | municipality-config | Config município |
| `/api/apresentacao` | apresentacao-export | Export apresentação |
| `/api/workflows` | module-workflows | Workflows legado |
| `/api/service-workflows` | service-workflows.routes | Service workflows |
| `/api/notifications` | notifications.routes | Notificações SSE |
| `/api/push` | push-subscriptions.routes | Push subscriptions |
| `/api/saude/atendimento` | saude-atendimento.routes | Saúde atendimento (~52 endpoints) |
| `/api/saude/farmacia` | saude-farmacia.routes | Farmácia (~42 endpoints) |
| `/api/saude/tfd` | saude-tfd.routes | TFD (~71 endpoints) |
| `/api/saude` | saude | Saúde principal (fila, triagem, equipes) |
| `/api/secretarias/saude` | secretarias-saude | Dashboard saúde |
| `/api/apps/saude/cadastros` | saude-cadastros.routes | Cadastros saúde |
| `/api/secretarias/educacao` | secretarias-educacao | Dashboard educação |
| `/api/secretarias/assistencia-social` | secretarias-assistencia-social | Dashboard assistência |
| `/api/organizational-units` | organizational-units.routes | Unidades organizacionais |
| `/api/positions` | positions.routes | Cargos |
| `/api/functions` | functions.routes | Funções gratificadas |
| `/api/employee-assignments` | employee-assignments.routes | Vínculos funcionais |
| `/api/employee-hierarchies` | employee-hierarchies.routes | Hierarquias |
| `/api/teams` | teams.routes | Equipes |
| `/api/professional-data` | professional-data.routes | Dados profissionais |
| `/api/saude` | saude-unified-adapter.routes | Adaptador saúde v2 |

**Health checks:**
- `GET /health` — Status OK + timestamp
- `GET /api/test` — "DigiUrban Single-Tenant Backend" + timestamp

---

### 4.2 Middlewares Globais

Aplicados nesta ordem em `index.ts`:

1. **Helmet** — Headers de segurança HTTP com CSP customizado (script-src, style-src, font-src, img-src, connect-src, frame-src, object-src)
2. **CORS** — Whitelist estrita de origens. Em produção, requests sem origin são bloqueados. Origins não autorizados recebem erro CORS
3. **Trust Proxy** — `app.set('trust proxy', true)` para rate limiting funcionar atrás de Nginx
4. **Rate Limiting Global** — `apiRateLimiter` aplicado em todas as rotas `/api` (100 req/min por IP). Rotas de auth têm limites próprios mais restritos
5. **Winston Request Logger** — Log estruturado de cada requisição (substituiu Morgan)
6. **Conditional Body Parser** — Pula `multipart/form-data` (Multer), aplica JSON/URL-encoded com limite 50MB
7. **Cookie Parser** — Parse de cookies para autenticação JWT
8. **Static Files** — `/uploads` servido estaticamente
9. **Error Handler** — Último middleware: sempre retorna JSON (nunca HTML)
10. **404 Handler** — Rota não encontrada → JSON

---

### 4.3 Sistema de Autenticação

O sistema usa JWT em **cookies HTTP-only** (mais seguro que localStorage):

| Tipo | Cookie | Expiração | Roles |
|------|--------|-----------|-------|
| Admin | `digiurban_admin_token` | 1h (configurable) | USER, COORDINATOR, MANAGER, ADMIN, SUPER_ADMIN |
| Cidadão | `digiurban_citizen_token` | 8h (configurable) | CITIZEN |
| Super Admin | `digiurban_admin_token` | 30min | SUPER_ADMIN |

**Fallback:** Header `Authorization: Bearer <token>` para APIs externas.

#### Middleware Admin (`admin-auth.ts`)

1. Extrai token do cookie `digiurban_admin_token` (fallback: header Authorization)
2. Verifica JWT com `JWT_SECRET`
3. Valida campo `type === 'admin'`
4. Busca usuário no DB por `userId` do token
5. Verifica `isActive === true` e inclui relação com `department`
6. Adiciona `req.userId`, `req.user`, `req.userRole` à requisição

**Tratamento de erros JWT:**
- `JsonWebTokenError` → 401 "Token inválido"
- `TokenExpiredError` → 401 "Token expirado"

#### Middleware Cidadão (`citizen-auth.ts`)

Estratégia de 3 níveis para busca de token:
1. Cookie `digiurban_citizen_token` (preferido)
2. Cookie `digiurban_admin_token` (admins podem acessar portal cidadão)
3. Header `Authorization: Bearer` (fallback)

Roteamento por tipo:
- `type === 'citizen'` → Busca citizen no DB pelo `citizenId`
- `type === 'admin'` → Busca user (admin) pelo `userId`, permite acesso como cidadão

#### Middleware Interno (`internal-auth.ts`)

Para comunicação entre serviços (Messages Server → Backend):
- Token simples (não JWT), definido em `DIGIURBAN_SERVICE_TOKEN`
- Comparação direta de strings (sem verificação de DB)
- Muito mais rápido para autenticação máquina-a-máquina

#### Middleware Super Admin (`super-admin-auth.ts`)

Idêntico ao admin auth, mas com validação adicional: `user.role !== SUPER_ADMIN` → 403.

#### Middleware Família (`familyAuthMiddleware`)

Se cidadão acessa dados de outro cidadão:
- Busca relação em `familyComposition` (headId = citizen.id, memberId = citizenId)
- Bloqueia se não for familiar

---

### 4.4 Sistema de Autorização e Permissões

**Hierarquia de Roles:**

```
GUEST (0) → USER (1) → COORDINATOR (2) → MANAGER (3) → ADMIN (4) → SUPER_ADMIN (5)
```

**Permissões por Role:**

| Role | Permissões |
|------|-----------|
| **USER** | protocols:read/update/comment, department:read, citizens:\*, social-assistance:\* |
| **COORDINATOR** | protocols:\*, team:read/metrics, department:read, citizens:\*, social-assistance:\* |
| **MANAGER** | protocols:\*, services:\*, team:\*, reports:department, department:manage, citizens:\* |
| **ADMIN** | Tudo incluindo chamados:create, reports:full, analytics:full |
| **SUPER_ADMIN** | \* (todas as permissões) |

**Factories de middleware:**
- `requirePermission('protocols:create')` — Exige permissão específica
- `requireAnyPermission(['reports:full', 'reports:department'])` — Qualquer uma
- `requireMinRole('MANAGER')` — Nível mínimo
- `requireDepartmentAccess()` — ADMIN: todos, outros: próprio departamento
- `addDataFilter()` — Filtro automático por role (USER vê apenas seus protocolos)
- `auditLog('action')` — Log de auditoria

---

### 4.5 Configuração de Segurança

Centralizada em `config/security.ts`. Helmet configurado com CSP customizado em `index.ts`:

| Configuração | Valor | Observação |
|-------------|-------|-----------|
| **Bcrypt rounds** | 12 | OWASP 2024 recomenda 12+ |
| **JWT Admin** | 1h | Expiração curta para segurança |
| **JWT Cidadão** | 8h | Mais longo para conveniência |
| **JWT Super Admin** | 30min | Máxima segurança |
| **JWT Refresh** | 7 dias | Token de renovação |
| **Rate limit window** | 5 min | Janela de tentativas |
| **Rate limit max** | 10 (prod) / 50 (dev) | Tentativas por janela |
| **Account lockout** | 5 tentativas / 30min | Bloqueio automático |
| **Senha min length** | 8 caracteres | Política de senhas |
| **Senha uppercase** | Obrigatório | Letra maiúscula |
| **Senha lowercase** | Obrigatório | Letra minúscula |
| **Senha number** | Obrigatório | Número |
| **Senha especial** | Obrigatório | !@#$%^&*(),.? |
| **Senha histórico** | 5 últimas | **NÃO IMPLEMENTADO** — planejado para versão futura |
| **Senha expiração** | 90 dias | **NÃO IMPLEMENTADO** — planejado para versão futura |
| **Sessão timeout** | 30min | Inatividade |
| **Auditoria retenção** | 365 dias | LGPD: mín 6 meses |

**Eventos críticos auditados:**
login, logout, failed_login, password_change, password_reset, account_locked, account_unlocked, permission_change, data_export, sensitive_data_access

**LGPD:**
- Campos sensíveis: cpf, rg, birthDate, phone
- Campos auditados: cpf, email, phone, address

---

### 4.6 Sistema de Logs

Configurado em `config/logger.config.ts` usando Winston com rotação diária:

| Transporte | Arquivo | Nível | Retenção | Tamanho Máx |
|-----------|---------|-------|----------|------------|
| Console | stdout | todos | - | - |
| Error file | `logs/error-YYYY-MM-DD.log` | error | 7 dias | 20MB |
| Combined file | `logs/combined-YYYY-MM-DD.log` | todos | 7 dias | 20MB |
| HTTP file | `logs/http-YYYY-MM-DD.log` | info | 3 dias | 50MB |
| Exceptions | `logs/exceptions-YYYY-MM-DD.log` | - | - | - |
| Rejections | `logs/rejections-YYYY-MM-DD.log` | - | - | - |

**Sanitização automática:** Campos `password`, `token`, `authorization`, `secret`, `apiKey` são substituídos por `[REDACTED]`.

**Helpers:**
- `log.error(message, meta?)`, `log.warn()`, `log.info()`, `log.debug()`
- `logRequest(req, statusCode, responseTime)` — Log estruturado de HTTP
- `logError(error, req, context)` — Log de erro com stack trace

---

### 4.7 Rate Limiting

Implementado com `express-rate-limit`:

| Limitador | Janela | Limite | Uso |
|----------|--------|--------|-----|
| **loginRateLimiter** | 5 min | 10 (prod) / 50 (dev) | Login |
| **apiRateLimiter** | 1 min | 100 | APIs gerais |
| **registerRateLimiter** | 15 min | 10 | Cadastro cidadão |
| **sensitiveOperationLimiter** | 1 hora | 5 | Mudança senha |
| **passwordResetLimiter** | 15 min | 3 | Reset senha |
| **dataExportLimiter** | 24 horas | 5 | LGPD: export em massa |

Headers retornados: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`.

---

### 4.8 Upload de Arquivos

#### Multer Padrão (`middleware/upload.ts`)

- **Diretório:** `uploads/documents/` (geral), `uploads/protocols/{protocolId}/` (protocolos)
- **Limite:** 10MB por arquivo, 10MB por campo
- **MIME types permitidos:** PDF, JPEG, PNG, GIF, WebP, BMP, SVG, Word, Excel, ZIP, texto
- **Nomeação:** `{timestamp}-{random}-{sanitized_name}{ext}`

#### Upload Seguro (`middleware/secure-upload.ts`)

Camada adicional de segurança:
- **Limite:** 50MB, máx 20 arquivos
- **Sanitização:** Remove path traversal, normaliza acentos, remove caracteres perigosos
- **Anti-malware:** Detecta magic bytes (MZ=EXE, ELF=Linux, Archive)
- **Extensões bloqueadas:** .exe, .bat, .cmd, .com, .pif, .scr, .vbs, .js, .jar, .wsf, .sh, etc.
- **Diretório seguro:** Permissões 0o750, estrutura `{base}/{sub}/{YYYY}/{MM}/`
- **Validação pós-upload:** Verifica existência, malware, tamanho real
- **Delete seguro:** Valida que caminho está em `/uploads` antes de deletar

**Helpers de protocolo:**
- `getProtocolFileUrl(protocolId, filename)` → `/uploads/protocols/{protocolId}/{filename}`
- `getProtocolFilePath(protocolId, filename)` → Caminho absoluto
- `ensureProtocolDir(protocolId)` → Cria diretório se necessário

---

### 4.9 Validação de Dados

#### Joi (`middleware/validation.ts`)

Middleware genérico para validação de body, query e params:
- `validateRequest(schema)` — Valida body
- `validateQuery(schema)` — Valida query params (allowUnknown: true)
- `validateParams(schema)` — Valida params

**Schemas comuns reutilizáveis:**
- `pagination` — page (min 1), limit (1-100, default 10), offset
- `dateRange` — startDate, endDate (endDate > startDate)
- `email` — Validação de email
- `cpf` — Regex para CPF formatado ou apenas dígitos
- `cnpj` — Regex para CNPJ
- `phone` — (XX) XXXXX-XXXX ou apenas dígitos
- `priority` — 1-5 (default 3)

#### Zod

Usado em rotas mais recentes para validação com tipagem TypeScript nativa.

---

### 4.10 WebSocket (Socket.IO)

Inicializado em `socket.ts`, path `/api/socket`:

- **Transports:** polling + websocket
- **CORS:** Mesma configuração do Express
- **Autenticação:** JWT via cookie no handshake

**Eventos disponíveis:**
- `join:module` / `leave:module` — Entrar/sair de room de módulo
- Notificações em tempo real de protocolos, status, mensagens

---

## 5. Serviços de Negócio

### 5.1 Protocolos

**Arquivo:** `services/protocol-simplified.service.ts`

Serviço centralizado para gestão completa do ciclo de vida dos protocolos.

**Funções principais:**

| Função | Descrição |
|--------|-----------|
| `createProtocol(data)` | Cria protocolo: geocodifica endereço → gera número único → cria entrada de histórico |
| `updateStatus(input)` | Atualiza status com validação de transição → marca `concludedAt` se CONCLUIDO |
| `assignProtocol(protocolId, userId)` | Atribui a um servidor |
| `listByDepartment(departmentId, filters?)` | Lista com filtros (status, módulo, período) |
| `listByCitizen(citizenId)` | Lista protocolos do cidadão |
| `findByNumber(number)` | Busca por número com todas as relações |
| `evaluateProtocol(protocolId, rating, comment?)` | Avaliação (0-5, wouldRecommend) |
| `getDepartmentStats(departmentId)` | Total, por status, por módulo |

**Geocodificação automática:** Ao criar protocolo com endereço, o sistema geocodifica via Google Maps/Nominatim e armazena coordenadas.

---

### 5.2 Geração de Documentos PDF

**Arquivo:** `services/document-generator.service.ts`

Gera PDFs a partir de templates HTML usando Playwright/Chromium com Handlebars.

**Fluxo:**
1. Compila template Handlebars com 95+ variáveis disponíveis
2. Detecta placeholder de assinatura (`class="signature-placeholder"`)
3. Renderiza HTML em PDF via Playwright (Chromium headless)
4. Calcula hash SHA-256 do PDF
5. Se certificado do sistema existe, assina automaticamente
6. Salva no DB com código de validação

**95+ variáveis disponíveis no template:**
- **Protocolo:** protocolNumber, protocolTitle, protocolStatus, protocolCreatedAt, protocolConcludedAt
- **Cidadão:** citizenName, citizenCpf, citizenEmail, citizenPhone, citizenAddress
- **Serviço:** serviceName, serviceDescription, serviceEstimatedDays
- **Departamento:** departmentName, departmentDescription
- **Responsável:** assignedUserName, assignedUserEmail
- **Geolocalização:** latitude, longitude, address
- **Validação:** validationCode, documentHash, expiresAt
- **Assinatura:** certificateSerialNumber, certificateCommonName, certificateThumbprint

**Helpers Handlebars:**
- `formatDate(Date)` → "DD/MM/YYYY"
- `formatDateTime(Date)` → "DD/MM/YYYY HH:mm"
- `formatCurrency(number)` → "R$ X.XXX,XX"
- `formatCPF(string)` → "XXX.XXX.XXX-XX"

**Envio por email:** Usa Nodemailer com streaming de arquivo (path, não buffer) para SMTP interno (`ultrazend-smtp:587`).

---

### 5.3 Certificados Digitais e Assinatura

**Arquivo:** `services/certificate-authority.service.ts`

Emissão de certificados digitais X.509 com chaves RSA 2048 bits.

**Emissão:**
1. Gera par de chaves RSA 2048
2. Cria certificado X.509 com subject (CN, email, org, departamento, BR)
3. Extensions: basicConstraints (cA=false), keyUsage (digitalSignature, nonRepudiation, keyEncipherment)
4. Assina com CA privada (SHA-256) ou auto-assinado
5. Criptografa chave privada com AES-256-GCM
6. Calcula thumbprint SHA-256 do certificado
7. Salva no DB

**CA Municipal (Fallback):**
Se `CA_PRIVATE_KEY` e `CA_CERTIFICATE` não definidos:
- Gera CA Root RSA 4096, self-signed, válido por 10 anos
- Subject: "CA Municipal Root" | "Prefeitura Municipal" | "BR"

**Assinatura automática de documentos:**
1. Backend detecta `class="signature-placeholder"` no HTML
2. Busca certificado do sistema (userId=null, citizenId=null, status=ACTIVE)
3. Descriptografa chave privada com AES-256-GCM usando `CERTIFICATE_ENCRYPTION_KEY`
4. Assina PDF via `document-signing.service`
5. Atualiza `isSigned=true` no `GeneratedDocument`
6. Se falhar, documento é gerado sem assinatura (error silencioso)

---

### 5.4 Notificações

**Arquivo:** `services/notification.service.ts`

Sistema via fila BullMQ + Redis com 4 canais:

| Canal | Descrição |
|-------|-----------|
| **WEB** | Cria record em tabela `notification` (in-app) |
| **PUSH** | Job enfileirado para Web Push |
| **EMAIL** | Job enfileirado para SMTP |
| **SMS** | Job enfileirado para provider SMS |

**Quiet Hours:** Horário de silêncio reduz prioridade (high → low). Suporta cruzar meia-noite (ex: 22:00-08:00).

**Retry:** 3 tentativas com backoff exponencial (delay inicial 2s).

**Tipos importantes que merecem email/SMS:**
- PROTOCOL_SLA_EXPIRING, PROTOCOL_OVERDUE
- DOCUMENT_REJECTED, APPOINTMENT_REMINDER
- EXAM_RESULT, SYSTEM_MAINTENANCE

---

### 5.5 Analytics e KPIs

**Arquivo:** `services/protocol-analytics.service.ts`

Dashboard em tempo real com métricas, tendências, KPIs e benchmarks.

**Dashboard Overview:**
- Total/novo/concluído/cancelado/atrasado protocolos
- Tempo médio de conclusão (horas)
- Tempo médio primeira resposta
- Satisfação média (rating 0-5)
- SLA compliance (%)
- Métricas por departamento
- Top 10 servidores
- 15 principais gargalos

**5 KPIs calculados:**

| KPI | Target | Warning | Critical |
|-----|--------|---------|----------|
| Taxa de Conclusão | 80% | 60% | 40% |
| Cumprimento SLA | 90% | 70% | 50% |
| Satisfação Cidadão | 4/5 | 3/5 | 2/5 |
| Protocolos Atrasados | 0 | 5 | 15 |
| Total 30 dias | - | - | - |

**Detecção de Gargalos:**
- **STAGE:** Etapas em IN_PROGRESS/PENDING > 2h
- **DOCUMENT:** Docs UNDER_REVIEW > 4h
- **PENDING:** Pendências OPEN > 24h
- Score: `(count * 5) + (hours * 2)`, máx 100 → CRITICAL(≥75), HIGH(≥50), MEDIUM(≥25), LOW

**Export CSV:** Com BOM UTF-8 para compatibilidade Excel.

---

### 5.6 SLA de Protocolos

**Arquivo:** `services/protocol-sla.service.ts`

Gerenciamento de SLA com cálculo de **dias úteis** (pula fins de semana).

**Estados de SLA:**

| Estado | isPaused | actualEndDate | isOverdue |
|--------|----------|---------------|-----------|
| Ativo | false | null | false |
| Pausado | true | null | N/A |
| Atrasado | false | null | true |
| Concluído No Prazo | false | data | false |
| Concluído Atrasado | false | data | true |

**Funções:** createSLA, pauseSLA, resumeSLA, completeSLA, updateSLAStatus, getOverdueSLAs, getSLAsNearDue, calculateSLAStats.

---

## 6. Banco de Dados — Prisma Schema (213 Models)

### 6.1 Auth e Usuários (7 models)

| Model | Campos Principais |
|-------|-------------------|
| **User** | email, name, password, role (UserRole), departmentId, isActive, avatar, failedLoginAttempts, lockedUntil |
| **Citizen** | cpf, name, email, phone, address (JSON), birthDate, password, isActive, verificationStatus, avatar |
| **UserDepartment** | userId, departmentId (N:N) |
| **UserPreferences** | userId, theme, language, fontSize, 34 campos |
| **UserSession** | userId, token, ipAddress, userAgent, expiresAt |
| **PasswordResetToken** | userId/citizenId, token, expiresAt, usedAt |
| **Department** | name, description, isActive, servicesCount |

### 6.2 Protocolos e Fluxo (15 models)

| Model | Campos Principais |
|-------|-------------------|
| **ProtocolSimplified** | number, title, description, citizenId, serviceId, departmentId, status (ProtocolStatus), priority, currentAssignedUserId, concludedAt, latitude, longitude, address, formData (JSON), customData (JSON) |
| **ProtocolHistorySimplified** | protocolId, action, fromStatus, toStatus, comment, performedBy |
| **ProtocolEvaluationSimplified** | protocolId, rating (0-5), comment, wouldRecommend |
| **ProtocolSLA** | protocolId, startDate, expectedEndDate, actualEndDate, isOverdue, daysOverdue, isPaused, pausedAt, pausedReason, workingDays, calendarDays |
| **ProtocolDocument** | protocolId, documentType, fileName, fileUrl, status (PENDING/UPLOADED/APPROVED/REJECTED), uploadedAt |
| **ProtocolInteraction** | protocolId, type (MESSAGE/STATUS_CHANGED/ASSIGNED), content, userId, citizenId |
| **ProtocolStage** | protocolId, stageName, status, startedAt, completedAt |
| **ProtocolPending** | protocolId, type (DOCUMENT/INFORMATION/CORRECTION), description, status |
| **ProtocolDataField** | protocolId, fieldName, fieldValue, status |
| **ServiceSimplified** | name, description, departmentId, estimatedDays, isActive, type (COM_DADOS/SEM_DADOS), requiredDocuments (JSON), formSchema (JSON) |
| **ProtocolServerAssignment** | protocolId, userId, tipo (PRINCIPAL/DELEGADO), situacao, isDelegacao |
| **GeneratedDocument** | templateId, protocolId, fileName, fileUrl, filePath, fileSize, mimeType, isSigned, wasSent, sentTo, generatedAt |
| **DocumentTemplate** | name, code, documentType, htmlTemplate, cssStyles, config (JSON), isGlobal, serviceIds, isActive |

### 6.3 Certificados Digitais (7 models)

| Model | Campos Principais |
|-------|-------------------|
| **DigitalCertificate** | serialNumber, userId/citizenId, commonName, email, publicKey, encryptedPrivateKey, certificateChain, thumbprint, certificateType (SERVER/CITIZEN/SYSTEM), status (ACTIVE/REVOKED/EXPIRED), validFrom, validTo |
| **CertificateRevocation** | certificateId, serialNumber, reason, revokedBy, revokedAt |
| **DocumentSignature** | documentId, certificateId, signedHash, signatureAlgorithm, signerName, signedAt |
| **SignatureVerification** | signatureId, verifiedAt, isValid, verificationMethod |
| **CertificateRequest** | userId/citizenId, commonName, email, status (PENDING/APPROVED/REJECTED), reviewedBy |
| **ExternalDocument** | citizenId, documentType, fileName, fileUrl, verificationCode |
| **MyCertificate** | userId/citizenId, certificateId, isDefault |

### 6.4 Bot e IA (8 models)

| Model | Campos Principais |
|-------|-------------------|
| **FlowDefinition** | name, description, version, isActive, isDefault, nodes (JSON), metadata |
| **FlowExecution** | citizenId, flowId, conversationId, currentNodeId, state (JSON), history (JSON), status (ACTIVE/COMPLETED/CANCELLED/ERROR), metadata |
| **BotTemplate** | name, category, content, variables (JSON), isActive |
| **BotConversation** | citizenId, currentFlow, flowStep, flowData (JSON), isActive, rating |
| **BotMessage** | conversationId, role (user/bot), content, messageType, intent, confidence, sentiment, metadata |
| **BotAnalytics** | date, intent, totalMessages, successfulMessages, avgConfidence, uniqueCitizens |
| **BotUpload** | conversationId, citizenId, filename, mimeType, size, url |
| **DigiBot** | name, model, systemPrompt, temperature, maxTokens |

### 6.5 Mensagens e Canais (10 models)

| Model | Campos Principais |
|-------|-------------------|
| **Conversation** | participant1Id/Type, participant2Id/Type, protocolId, departmentId, status, lastMessage, unreadCount1/2, isBotConversation, botFlowType, botFlowData |
| **Message** | conversationId, senderId, senderType, content, contentType, status (SENT/DELIVERED/READ), replyToId, attachments (JSON), metadata |
| **OfficialChannel** | name, slug, departmentId, managedBy (JSON), isPublic, requiresApproval, subscriberCount |
| **ChannelSubscription** | channelId, citizenId, status, notifyInApp/Email/SMS/Push |
| **ChannelMessage** | channelId, authorId, content, status (DRAFT/SCHEDULED/SENT), priority, deliveredCount |
| **ChannelDelivery** | messageId, subscriptionId, citizenId, status, retryCount |
| **CitizenPrivacySettings** | allowMessagesFromAll, blockedCitizens, notifySettings |
| **MessageReport** | messageId, reportedBy, reason (SPAM/HARASSMENT), status |
| **MessageLog** | event, level, userId/citizenId, conversationId |
| **WebSocketSession** | socketId, userId, userType, isOnline, lastPingAt |

### 6.6 Email e Comunicação (12 models)

| Model | Campos Principais |
|-------|-------------------|
| **EmailServer** | hostname, mxPort, submissionPort, tlsEnabled, monthlyPrice |
| **EmailDomain** | domainName, isVerified, dkimEnabled, spfEnabled, dmarcEnabled |
| **EmailUser** | email, passwordHash, dailyLimit, monthlyLimit, sentToday |
| **Email** | messageId, fromEmail, toEmail, subject, htmlContent, status |
| **EmailEvent** | emailId, type (SENT/DELIVERED/OPENED/CLICKED) |
| **EmailTemplate** | name, subject, htmlContent, variables (JSON) |
| **EmailPlanConfig** | code, monthlyPrice, maxEmailsPerMonth, maxAccounts |
| **EmailSubscription** | emailServerId, plan, status, currentPeriodStart/End |
| **EmailDraft** | userId, to, subject, htmlContent |
| **EmailInvoice** | subscriptionId, amount, status, dueDate |
| **EmailAddon** | subscriptionId, addonType, price |
| **ReceivedEmail** | messageId, fromEmail, toEmail, subject, folder |

### 6.7 Analytics e Relatórios (10 models)

ProtocolMetrics, DepartmentMetrics, ServiceMetrics, ServerPerformance, ProtocolBottleneck, KPI, Report, ReportExecution, Alert, AlertTrigger.

### 6.8 Saúde — Atendimento (30+ models)

**Estrutura básica:** UnidadeSaude, AgendaMedica, ConsultaAgendada, SalaConsultorio, TurnoTrabalho, ConfiguracaoAtendimento.

**Fluxo e-SUS:** EquipeSaude (eAP/eSF/eAB/NASF), ProfissionalEquipe, Microarea, FilaAtendimento (status AGUARDANDO→EM_CONSULTA→FINALIZADO), EscutaInicial, TriagemEnfermagem (Manchester: VERMELHO→AZUL).

**Consultas:** AtendimentoMedico, ConsultaMedica (método SOAP), ProblemaCondicao, AlergiaReacao, Prescricao, ExameSolicitado, Atestado, Encaminhamento.

**Saúde Feminina:** AcompanhamentoPreNatal, ConsultaPreNatal, ExamePreNatal.

**Odontologia:** AtendimentoOdontologico (odontograma 32 dentes), ProcedimentoOdonto.

**Complementar:** VisitaDomiciliar, AlergiasCidadao, ComorbidadesCidadao, AnexoProntuario, ImunizacaoCidadao.

### 6.9 Saúde — Farmácia (4 models)

Medicamento (nome, principioAtivo, tipo, isControlado), EstoqueMedicamento, LoteMedicamento, TransferenciaEstoque.

### 6.10 Saúde — TFD (11 models)

SolicitacaoTFD, ViagemTFD, VeiculoTFD, MotoristaTFD, DocumentoTFD, ParecerRegulacaoTFD, AprovacaoGestaoTFD, AgendamentoExternoTFD, PassageiroViagemTFD, PrestacaoContasTFD, AlertaEstoque.

### 6.11 Educação (7 models)

UnidadeEducacao (Escola/Creche/EMEI), InscricaoMatricula, Matricula, Turma, VeiculoEscolar, RotaEscolar, AlunoRota.

### 6.12 Assistência Social (6 models)

CadUnicoFamilia (nisResponsavel, rendaPerCapita), MembroFamilia, InscricaoProgramaSocial, AcompanhamentoBeneficio, PagamentoBeneficio.

### 6.13 Vinculação de Servidores V2.0 (11 models)

OrganizationalUnit, Position, Function, EmployeeAssignment, EmployeeHierarchy, HealthProfessionalData, EducationProfessionalData, EngineeringProfessionalData, SocialAssistanceProfessionalData, Team, TeamMember.

### 6.14 Cadastros Municipais (14 models)

EspacoPublico, ConjuntoHabitacional, ViaturaSeguranca, ParquePraca, EstabelecimentoTuristico, Professor, GuiaTuristico, TipoObraServico, EspecialidadeMedica, TipoProducaoAgricola, MaquinaAgricola, EspecieArvore, ModalidadeEsportiva, TipoAtividadeCultural.

### 6.15 Enums Principais (100+)

**Auth:** UserRole (GUEST/USER/COORDINATOR/MANAGER/ADMIN/SUPER_ADMIN), VerificationStatus

**Protocolos:** ProtocolStatus (VINCULADO/PROGRESSO/ATUALIZACAO/CONCLUIDO/PENDENCIA/CANCELADO), ServiceType, DocumentStatus, PendingType/Status

**Certificados:** CertificateType (SERVER/CITIZEN/SYSTEM), CertStatus (ACTIVE/REVOKED/EXPIRED/SUSPENDED)

**Saúde:** TipoEquipe (eAP/eSF/eAB/NASF), StatusFila (AGUARDANDO→FINALIZADO), ClassificacaoRisco (Manchester: VERMELHO→AZUL), TipoAtendimento

**Email:** EmailStatus (QUEUED→BOUNCED), EmailPlan, SubscriptionStatus

**Mensagens:** ConversationType, MessageStatus, ParticipantType, BroadcastStatus, ReportReason, ModerationAction

**Vinculação:** TipoVinculo (LOTACAO/CEDENCIA/REQUISICAO/REMOCAO), SituacaoVinculo, TipoHierarquia

**Analytics:** ReportType, ReportFormat, AlertType, AlertFrequency

**Assistência Social:** TipoMoradia, SituacaoMoradia, CadUnicoStatus, Parentesco, Raca, Escolaridade

---

## 7. API — Catálogo de Endpoints (~891)

### 7.1 Autenticação Admin

**Prefixo:** `/api/admin/auth` (ou `/api/auth/admin`)

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/login` | Login (email + password) → Cookie JWT |
| GET | `/me` | Dados do admin logado |
| GET | `/permissions` | Listar permissões do role |
| POST | `/change-password` | Trocar senha (currentPassword + newPassword) |
| POST | `/logout` | Limpa cookie |
| POST | `/forgot-password` | Envia email de recuperação |
| POST | `/validate-reset-token` | Valida token de reset |
| POST | `/reset-password` | Redefine senha com token |

### 7.2 Autenticação Cidadão

**Prefixo:** `/api/citizen/auth` (ou `/api/auth/citizen`)

| Método | Path | Descrição |
|--------|------|-----------|
| POST | `/register` | Cadastro (cpf, name, email, phone, password, address) |
| POST | `/login` | Login (CPF ou email + password) → Cookie JWT |
| GET | `/me` | Dados do cidadão |
| POST | `/change-password` | Trocar senha |
| PUT | `/profile` | Atualizar perfil completo |
| POST | `/logout` | Limpa cookie |
| POST | `/forgot-password` | Recuperação de senha |
| POST | `/reset-password` | Redefinir senha |

### 7.3 Protocolos Simplificados

**Prefixo:** `/api/protocols` e `/api/protocols-simplified`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/workload-stats` | Métricas de carga de trabalho |
| GET | `/department/:departmentId` | Listar por departamento |
| GET | `/module/:departmentId/:moduleType` | Listar por módulo |
| GET | `/module/:moduleType/pending` | Pendentes por módulo |
| GET | `/citizen/:citizenId` | Protocolos do cidadão |
| POST | `/protocols-simplified` | Criar novo protocolo |
| GET | `/incoming-calls` | Chamados recebidos |
| GET | `/protocols` | Listar todos (com filtros) |
| GET | `/protocols-simplified/:id` | Buscar específico |
| PUT | `/:id/approve` | Aprovar |
| PUT | `/:id/reject` | Rejeitar |
| PATCH | `/:id/status` | Atualizar status |
| POST | `/:id/comments` | Adicionar comentário |
| PATCH | `/:id/assign` | Atribuir servidor |
| POST | `/:id/delegate` | Delegar |
| POST | `/:id/forward` | Encaminhar |
| POST | `/:id/assign-team` | Atribuir equipe |
| GET | `/:id/assignments` | Histórico atribuições |
| GET | `/:id/suggest-assignee` | Sugerir servidor |
| GET | `/:id/history` | Histórico completo |
| POST | `/:id/evaluate` | Avaliar (rating 0-5) |
| GET | `/stats/:departmentId` | Estatísticas |
| GET | `/by-number/:number` | Buscar por número |
| POST | `/:id/complete` | Concluir |
| POST | `/:id/reopen` | Reabrir |
| GET | `/:id/report` | Relatório PDF/JSON |
| GET | `/:id/timeline/export` | Timeline PDF |
| POST | `/:id/send-payment-info` | Enviar info pagamento |

### 7.4 Serviços do Cidadão

**Prefixo:** `/api/citizen/services`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/` | Listar serviços (category, search, page, limit) |
| GET | `/categories` | Categorias |
| GET | `/popular` | Mais utilizados |
| GET | `/departments/:dept/no-data` | Serviços SEM_DADOS |
| GET | `/:id` | Detalhes |
| GET | `/:id/requirements` | Requisitos |
| GET | `/:id/similar` | Similares |
| GET | `/suggestions` | Sugestões personalizadas |
| POST | `/:id/request` | Solicitar serviço (multipart) |

### 7.5 Saúde — Farmácia (42 endpoints)

**Prefixo:** `/api/saude/farmacia`

Lotes (criar, buscar, atualizar, listar por medicamento/unidade, baixa, adicionar, próximos vencimento, vencidos), Estoque (criar, consolidado, verificar disponibilidade, estatísticas), Transferências (criar, aprovar, recusar, cancelar, listar), Alertas (criar, visualizar, resolver, ativos, automáticos), Dispensação (dispensar, buscar, atualizar, por prescrição/cidadão/unidade, status, completa, estatísticas, cancelar, pendentes, auditoria).

### 7.6 Saúde — TFD (71 endpoints)

**Prefixo:** `/api/saude/tfd`

Solicitações (CRUD, status, cancelar, reabrir, urgentes, histórico, estatísticas), Documentos (adicionar, remover, listar, verificar), Pareceres (CRUD, aguardando regulação, estatísticas, relatório), Aprovação Gestão (criar, buscar, listar, aguardando), Agendamentos (CRUD, confirmar, cancelar, comparecimento, próximos, estatísticas), Viagens (CRUD, status, confirmar, iniciar, concluir, cancelar, próximas, estatísticas), Passageiros (adicionar, remover, listar, agrupar), Prestação de Contas (CRUD, aprovar, reprovar, listar), Upload (documentos, comprovantes).

### 7.7 Templates de Documentos

**Prefixo:** `/api/document-templates`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/` | Listar templates |
| GET | `/:id` | Template específico |
| POST | `/` | Criar template |
| PUT | `/:id` | Atualizar |
| DELETE | `/:id` | Desativar (soft delete) |
| POST | `/protocols/:id/generate-document` | Gerar PDF |
| GET | `/protocols/:id/generated-documents` | Listar gerados |
| GET | `/generated-documents/:id/download` | Download/visualizar |
| POST | `/generated-documents/:id/send` | Enviar por email |
| GET | `/document-stats` | Estatísticas |

### 7.8 Certificados Digitais

**Prefixo:** `/api/certificates`

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/` | Listar certificados |
| POST | `/issue` | Emitir certificado |
| POST | `/revoke` | Revogar |
| POST | `/sign` | Assinar documento |
| GET | `/verify/:signatureId` | Verificar assinatura |
| GET | `/:id/download` | Download |
| GET | `/requests` | Solicitações |
| POST | `/requests/:id/approve` | Aprovar solicitação |
| POST | `/requests/:id/reject` | Rejeitar |

### 7.9 Rotas Internas (Messages Server)

**Prefixo:** `/api/internal` — Autenticação via token de serviço

| Método | Path | Descrição |
|--------|------|-----------|
| GET | `/citizens/:citizenId` | Buscar cidadão |
| PUT | `/citizens/:citizenId` | Atualizar perfil |
| GET | `/citizens/:citizenId/family` | Família |
| GET | `/services/search` | Buscar serviços |
| GET | `/services` | Listar serviços |
| GET | `/services/categories` | Categorias |
| GET | `/services/:serviceId` | Serviço específico |
| POST | `/protocols` | Criar protocolo |
| GET | `/protocols` | Listar protocolos |
| GET | `/protocols/number/:number` | Buscar por número |
| POST | `/protocols/:id/comments` | Comentar |
| GET | `/notifications` | Notificações |
| PUT | `/notifications/read` | Marcar como lidas |
| GET | `/protocols/:id/interactions` | Interações |
| GET | `/citizens/:id/documents` | Documentos cidadão |
| GET | `/protocols/:id/documents` | Documentos protocolo |
| GET | `/evaluations/pending` | Avaliações pendentes |
| POST | `/evaluations` | Submeter avaliação |
| GET | `/departments` | Departamentos |

### 7.10 Demais Rotas Registradas

- **Analytics:** `/api/protocol-analytics/{dashboard,trends,export/csv,recalculate,kpis,benchmark/:metric}`
- **Notificações:** SSE via `/api/notifications`, Push via `/api/push`, Preferências
- **Email:** `/api/admin/email`, `/api/admin/email-accounts`, `/api/email-templates`
- **Saúde Atendimento:** `/api/saude/atendimento` (~52 endpoints: fila, escuta, triagem, consulta)
- **Saúde Cadastros:** `/api/apps/saude/cadastros` (unidades, profissionais, especialidades)
- **Educação:** `/api/secretarias/educacao` (dashboard)
- **Assistência Social:** `/api/secretarias/assistencia-social` (dashboard)
- **Vinculação V2.0:** `/api/organizational-units`, `/api/positions`, `/api/functions`, `/api/employee-assignments`, `/api/employee-hierarchies`, `/api/teams`, `/api/professional-data` (~85 endpoints)
- **Super Admin:** `/api/super-admin` (gerenciamento global)
- **Workflows:** `/api/workflows`, `/api/service-workflows`

---

## 8. Frontend — Next.js 14

### 8.1 Configuração e Layout

**Root Layout** (`app/layout.tsx`):
- SEO: Title template `%s | DigiUrban`, keywords governamentais, canonical URL
- PWA: Manifest, Apple touch icon, start image
- OpenGraph: `pt_BR`, type website, imagem 512x512
- Providers: `QueryProvider` (React Query) + `ToasterProvider` (Sonner)
- Font: Inter (Google Fonts)
- Script: OpenCV.js CDN (para scanner de documentos)

**Admin Layout** (`app/admin/layout.tsx`):
- `export const dynamic = 'force-dynamic'` — Sempre renderizado no servidor
- `export const revalidate = false` — Sem cache
- Robots: `index: false, follow: false` — Sem indexação

**Cidadão Layout** (`app/cidadao/layout.tsx`):
- Robots: `index: false, follow: false` — Sem indexação
- Componente: `CitizenLayoutContent`

### 8.2 PWA e Service Worker

Plugin `@ducanh2912/next-pwa` com 7 estratégias de cache Workbox:

| Padrão | Estratégia | Cache | Expiração |
|--------|-----------|-------|-----------|
| `/api/*` (geral) | NetworkFirst (10s timeout) | api-cache | 5 min, 50 entries |
| `/api/admin/*`, `/api/auth/*` | **NetworkOnly** | Sem cache | - |
| `/admin/*` (páginas) | **NetworkOnly** | Sem cache | - |
| `/_next/data/*/admin/*` | **NetworkOnly** | Sem cache | - |
| Imagens (png/jpg/svg) | CacheFirst | image-cache-v2 | 30 dias, 100 entries |
| JS/CSS | NetworkFirst (3s) | - | 7 dias, 100 entries |
| Google Fonts | CacheFirst | - | 1 ano, 30 entries |

### 8.3 API Client e Comunicação

**api-config.ts:** Configuração centralizada de URL:
- Browser: `NEXT_PUBLIC_API_URL` ou `/api` (relativo via Nginx)
- Server (SSR): `NEXT_PUBLIC_API_URL` ou `http://localhost:3001/api`

**api.ts:** Classe `ApiClient`:
- Métodos: GET, POST, PUT, DELETE, PATCH
- Headers: `Content-Type: application/json`
- Credentials: `include` (envia cookies HTTP-only automaticamente)
- Tratamento de erro: `!response.ok` → `{ error: data.message }`

**QueryProvider:** React Query com:
- `staleTime: 60s` (dados frescos por 1 minuto)
- `refetchOnWindowFocus: false`
- `retry: 1`

### 8.4 WebSocket Client

**socket-manager.ts:** Singleton Socket.IO:

```javascript
io(baseUrl, {
  path: '/api/socket',
  transports: ['polling', 'websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
  timeout: 10000,
  withCredentials: true,
})
```

**Funções:**
- `getSocket()` — Cria/retorna instância (singleton)
- `disconnectSocket()` — Cleanup completo
- `resetSocket()` — Desconecta + reconecta
- `isSocketConnected()` — Status
- `safeEmit(event, data)` — Emit com try/catch
- `joinRoom(dept, module)` / `leaveRoom(dept, module)`

### 8.5 Design System (Tailwind)

- **Dark Mode:** Class-based (`darkMode: ["class"]`)
- **Container:** Centered, padding 2rem, max-width 1400px
- **Cores:** HSL CSS variables (background, foreground, primary, secondary, destructive, muted, accent, popover, card)
- **Border Radius:** Variável `--radius` com derivados lg/md/sm
- **Keyframes:** accordion-down/up, slide-up/down, fade-in, pulse-glow
- **Plugin:** `tailwindcss-animate`

### 8.6 Dependências Principais (83 pacotes)

**Core:** next 14.2, react 18.3, typescript 5.9

**UI:** lucide-react (ícones), @radix-ui (11 componentes), shadcn/ui, tailwindcss, sonner (toasts)

**State:** @tanstack/react-query 5.90, swr 2.3, socket.io-client 4.8

**Forms:** react-hook-form 7.66, zod 4.1, react-input-mask

**Editor:** @tiptap (9 extensões: color, font-family, highlight, image, link, table, text-align, etc.)

**PDF:** pdfjs-dist 5.4, react-pdf 10.3

**Mapas:** leaflet 1.9, react-leaflet 4.2, leaflet.heat, react-leaflet-cluster

**Gráficos:** recharts 3.5

**Calendário:** react-big-calendar, react-day-picker, date-fns

**Utilidades:** crypto-js, cmdk (command palette), jscanify (scanner), reactflow (diagramas), xlsx (Excel)

---

## 9. Messages Server — ChatBot e Mensageria

### 9.1 Arquitetura do Messages Server

```
┌──────────────────────────────────────────────────────────┐
│                 Messages Server (Port 9001)               │
├─────────┬──────────────────┬────────────────────────────┤
│ Express │   Socket.IO      │   Webhooks (WhatsApp)      │
│  REST   │   + Redis        │                            │
├─────────┴──────────────────┴────────────────────────────┤
│              FlowEngineService (Orquestra)                │
│  startFlow() / processMessage() / pauseExecution()       │
├──────────────────────────────────────────────────────────┤
│                  FlowEngine (Motor)                       │
│  9 Node Types | Retry (max 3) | State Management         │
├──────────┬──────────────┬───────────────────────────────┤
│ NodeExec │ ActionHandl  │  InputValidator               │
│ (9 tipos)│ (19 handlers)│  (7 tipos validação)          │
│          │ → Backend API│                               │
├──────────┴──────────────┴───────────────────────────────┤
│        PostgreSQL + Prisma (15 models principais)        │
└──────────────────────────────────────────────────────────┘
```

**Inicialização:**
1. Testa conexão com DB e cria `MessageServer` padrão se não existir
2. Configura 3 jobs agendados: processamento de mensagens agendadas (60s), coleta de estatísticas (1h), limpeza de sessões (5min)
3. Coleta 14 métricas por hora em `MessageStats`

### 9.2 FlowEngine — Motor de Fluxos

Motor n8n-style com 9 tipos de nodos:

| Tipo | Comportamento |
|------|--------------|
| **message** | Exibe texto, avança automaticamente |
| **question** | Exibe pergunta, aguarda input, valida, salva no estado |
| **menu** | Exibe opções, matching inteligente (5 estratégias), transição condicional |
| **action** | Executa handler (chama API), salva resultado |
| **condition** | Avalia condições (8 operadores: eq, ne, gt, gte, lt, lte, contains, in), transição |
| **form** | Exibe formulário, valida campos obrigatórios |
| **upload** | Solicita arquivo, valida tamanho/tipo |
| **location** | Solicita geolocalização (GPS ou manual) |
| **end** | Finaliza fluxo, opcionalmente volta ao menu |

**5 estratégias de matching de menu (em ordem):**
1. ID exato
2. Label normalizado (lowercase, sem emojis)
3. Match parcial
4. Keywords (sinônimos: buscar→pesquisar, sim→ok→confirmar)
5. Option ID numérico

**Retry:** Máximo 3 tentativas por nodo antes de voltar ao menu principal.

**9 fluxos JSON pré-configurados** (auto-seeded no boot via `FlowDefinitionSeeder`):
- menu-principal (8 opções), consultar-protocolo (v1.1), abrir-protocolo, meu-perfil (v1.1), documentos, avaliacao, e outros.

### 9.3 Action Handlers (19 handlers)

Cada handler chama o Backend via `DigiUrbanIntegration`:

| Handler | API Call |
|---------|---------|
| `searchServices` | GET `/internal/services/search` |
| `listServices` | GET `/internal/services` |
| `listServiceCategories` | GET `/internal/services/categories` |
| `getService` | GET `/internal/services/:id` |
| `createProtocol` | POST `/internal/protocols` (multipart) |
| `getProtocols` | GET `/internal/protocols` |
| `getProtocolByNumber` | GET `/internal/protocols/number/:number` |
| `addProtocolComment` | POST `/internal/protocols/:id/comments` |
| `getProtocolInteractions` | GET `/internal/protocols/:id/interactions` |
| `getCitizenProfile` | GET `/internal/citizens/:citizenId` |
| `updateCitizenProfile` | PUT `/internal/citizens/:citizenId` |
| `getFamilyMembers` | GET `/internal/citizens/:citizenId/family` |
| `getNotifications` | GET `/internal/notifications` |
| `markNotificationsAsRead` | PUT `/internal/notifications/read` |
| `getDocuments` | GET `/internal/citizens/:citizenId/documents` |
| `getProtocolDocuments` | GET `/internal/protocols/:id/documents` |
| `getPendingEvaluations` | GET `/internal/evaluations/pending` |
| `submitEvaluation` | POST `/internal/evaluations` |
| `formatProtocolReview` | Local (formata estado do fluxo) |

**Tratamento de erros:** 404 → "Não encontrado", 401 → "Acesso não autorizado", timeout → "Demorou muito".

### 9.4 Node Executors (9 tipos)

**Validadores de input:**
- text (min/max length), number (min/max), email (regex), cpf (dígitos verificadores), phone (10-11 dígitos), date (3 formatos), protocol (min 4 chars)

**Template Engine:** Suporta `{{variableName}}`, dot notation (`user.profile.name`), array indexing (`items[0].label`), formatação (date → dd/mm/aaaa, currency → R$ 1.234,56).

### 9.5 API REST do Messages Server

**Principais grupos de endpoints:**

| Grupo | Endpoints | Descrição |
|-------|-----------|-----------|
| Conversas | 8 | CRUD, find-or-create, read, archive, delete, unread count |
| Mensagens | 3 | Send (HTTP), send-auto, delete |
| Canais | 6 | Listar, subscribe, unsubscribe, messages, subscriptions, broadcast |
| Uploads | 1 | Upload de arquivo (multer memory) |
| Reports | 1 | Denunciar mensagem |
| Admin | 2 | Stats, criar canal |
| Contatos | 2 | Buscar cidadãos e servidores |
| Bot Flow | 9 | Start, message, active-execution, upload, cancel, reset, pause, resume, health |
| WhatsApp | 2 | Webhook verify + receive |

### 9.6 WebSocket Server (Socket.IO)

**Config:** Porta 9001, Redis adapter para multi-instância, ping/pong 25s/60s.

**Autenticação:** Extrai token de `auth.token` → header → cookies, valida JWT.

**Rooms:**
- `user:{userId}:{userType}` — Room pessoal
- `conversation:{conversationId}` — Room de conversa
- `channel:{channelId}` — Room de canal

**Events:**
- `message:send` — Cria mensagem, emite para sala + usuário
- `message:read` — Marca como lida
- `typing:start/stop` — Indicador de digitação
- `conversation:join/leave` — Entrar/sair de sala

### 9.7 Integração com Backend (DigiUrbanIntegration)

**Configuração:**
- Base URL: `DIGIURBAN_API_URL` (default: `http://localhost:3001/api`)
- Token: `DIGIURBAN_SERVICE_TOKEN`
- Timeout: 15s
- Retry automático para ECONNREFUSED, ECONNABORTED, ENOTFOUND

**Singleton:** `getDigiUrbanIntegration()` retorna instância única.

---

## 10. SMTP Server

Servidor de email independente com entrega MX direta:

| Porta | Função |
|-------|--------|
| 25 | MX Server — Recebe emails externos |
| 587 | Submission — Envia emails autenticados |

**Segurança:**
- DKIM automático (RSA 2048 bits)
- SPF + DMARC configuráveis
- TLS opcional (desabilitado por padrão, requer `tlsEnabled: true` + certificados)

**Entrega:** MX direto via DNS (sem dependência de serviço externo como SendGrid).

---

## 11. Docker e Deploy

### 11.1 Dockerfile Multi-Stage

3 stages de build:

| Stage | Base | Função |
|-------|------|--------|
| **backend-builder** | node:20-bookworm-slim | Instala deps, gera Prisma Client, compila TypeScript |
| **frontend-builder** | node:20-bookworm-slim | Instala deps, build Next.js com variáveis de ambiente |
| **runner** | node:20-bookworm-slim | Nginx + Supervisord + Backend + Frontend + Playwright |

**Stage runner inclui:**
- Nginx, Supervisord, PostgreSQL client, curl
- Dependências do Playwright/Chromium (libnss3, libatk, libcups, etc.)
- Playwright browsers instalados (`npx playwright install chromium --with-deps`)
- Diretórios: /app/data, /app/uploads, /app/logs

### 11.2 Docker Compose

**Arquivo:** `docker-compose.vps.yml`

| Serviço | Imagem | Porta | Depende de |
|---------|--------|-------|-----------|
| postgres | postgres:15-alpine | 5432 | - |
| redis | redis:7-alpine | 6379 | - |
| ultrazend-smtp | build local | 25, 587 | postgres |
| ollama | ollama/ollama | 11434 | - |
| ultrazend-messages | build local | 9001 | postgres, redis |
| digiurban | build local | 3060→80 | postgres, redis, smtp, messages, ollama |

**Volumes persistentes:** postgres_data, redis_data, ollama_data, digiurban_uploads, digiurban_logs, digiurban_backups, smtp_data, smtp_logs, messages_uploads, messages_logs.

### 11.3 Nginx (Reverse Proxy)

**Upstreams:**
- backend: 127.0.0.1:3001
- frontend: 127.0.0.1:3000
- messages: ultrazend-messages:9001

**Locations (ordem crítica):**

| Path | Upstream | Timeout | Cache |
|------|----------|---------|-------|
| `/health` | backend | 300s | Sem logs |
| `/api/socket/` | backend | 86400s | WebSocket upgrade |
| `/api/protocols/*/documents/*/download` | backend | 600s | 1h |
| `/socket.io/` | messages | 86400s | WebSocket upgrade |
| `/messages-api/` | messages | 300s | Sem cache |
| `/api/` | backend | 300s | no-store, no-cache |
| `/uploads/` | local | - | 7 dias, immutable |
| `/` | frontend | 300s | Fallback Next.js |

**IMPORTANTE:** `/api/socket/` deve vir ANTES de `/api/` (regex matching order).

### 11.4 Supervisord

3 programas gerenciados:

| Programa | Comando | Porta | Delay | Prioridade |
|----------|---------|-------|-------|-----------|
| backend | `node /app/backend/dist/index.js` | 3001 | 5s | 999 |
| frontend | `npx next start -p 3000 -H 0.0.0.0` | 3000 | 10s | - |
| nginx | `/usr/sbin/nginx -g 'daemon off;'` | 80 | - | 900 |

### 11.5 Script de Startup

Executado antes do Supervisord (`docker/startup.sh`):

1. Cria diretórios (uploads, logs)
2. Aguarda PostgreSQL (até 30 tentativas, 2s intervalo)
3. Executa `create-enums.sql` (EmailPlan, SubscriptionStatus)
4. Executa `fix-subscription-status-enum.sql`
5. Executa `prisma migrate deploy`
6. Executa `prisma generate`
7. Verifica se precisa seed (count users)
8. Se vazio: `npm run db:seed` (timeout 180s)
9. Verifica `dist/index.js` existe
10. Verifica Prisma Client instalado
11. Testa carregamento do módulo
12. Inicia Supervisord

### 11.6 CI/CD — GitHub Actions

**Trigger:** Push em `main` ou manual (workflow_dispatch)

**Fases do deploy:**

1. **Git sync:** SSH para VPS, git reset --hard origin/main, limpeza seletiva
2. **Geração .env:** DATABASE_URL, JWT_SECRET, CORS, Ollama config
3. **Limpeza nuclear de cache Docker:** Remove imagens, builder cache, prune
4. **Validação pré-build:** Verifica arquivos críticos, Dockerfile correto
5. **Build:** `docker-compose build --no-cache --pull --progress=plain`
6. **Inicialização:** `docker-compose up -d`, sleep 30
7. **Seeds:** `npm run db:seed`, `node seed-flows.js`
8. **Ollama:** Pull modelo qwen2.5:3b (fallback: smollm2:1.7b), cria modelo customizado DigiBot
9. **Validação pós-build:** Verifica compilação, rotas acessíveis
10. **Health check:** 15 tentativas × 10s → `/health` e `/api/citizen/services`

---

## 12. Variáveis de Ambiente

```env
# Database
DATABASE_URL=postgresql://digiurban:digiurban2024@postgres:5432/digiurban

# JWT (OBRIGATÓRIO)
JWT_SECRET=sua-chave-secreta-muito-longa
# Expiração dos tokens JWT é configurada em código (config/security.ts):
# Admin: 1h | Cidadão: 8h | Super Admin: 30min
# NÃO existe variável de ambiente para override de expiração

# URLs
FRONTEND_URL=https://seudominio.com.br
CORS_ORIGIN=https://seudominio.com.br
ALLOWED_ORIGINS=https://www.seudominio.com.br,https://seudominio.com.br

# Servidor
NODE_ENV=production
PORT=3001
FRONTEND_PORT=3000

# Redis
REDIS_URL=redis://redis:6379

# Tenant
DEFAULT_TENANT=demo

# IA (Ollama)
USE_OLLAMA=true
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=digibot-qwen2.5
OLLAMA_TIMEOUT=15000

# Messages Server
MESSAGES_SERVICE_TOKEN=ultrazend-messages-service-token

# Upload
UPLOAD_BASE_PATH=/app/uploads

# Logs
LOG_LEVEL=info
LOGS_DIR=/app/logs

# Certificados
CERTIFICATE_ENCRYPTION_KEY=chave-para-criptografar-chaves-privadas
CA_PRIVATE_KEY=chave-privada-da-ca
CA_CERTIFICATE=certificado-da-ca

# Push Notifications (opcional)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# SMTP
SMTP_FROM=noreply@seudominio.com.br
SMTP_HOSTNAME=mail.seudominio.com.br

# Playwright
PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
```

---

## 13. Instalação e Desenvolvimento Local

### Pré-requisitos
- Node.js >= 20.0.0
- PostgreSQL >= 15
- Redis >= 7
- Docker + Docker Compose (para deploy)

### Backend

```bash
cd digiurban/backend
cp .env.example .env        # Configurar variáveis
npm install --legacy-peer-deps
npx prisma generate          # Gerar tipos Prisma
npx prisma migrate dev       # Executar migrations
npm run db:seed              # Seed inicial + super admin
npm run dev                  # Inicia em localhost:3001
```

### Frontend

```bash
cd digiurban/frontend
npm install --legacy-peer-deps
npm run dev                  # Inicia em localhost:3000
```

### Messages Server

```bash
cd ultrazend-messages-server
cp .env.example .env
npm install
npx prisma generate
npm run dev                  # Inicia em localhost:9001
```

### SMTP Server (opcional)

```bash
cd ultrazend-smtp-server
npm install
npm run dev
```

### Deploy (Docker Compose)

```bash
cp .env.example .env
# Editar .env com credenciais de produção

BUILD_TIMESTAMP=$(date +%s) docker compose -f docker-compose.vps.yml up -d --build

# Verificar status
docker compose -f docker-compose.vps.yml ps
docker compose -f docker-compose.vps.yml logs -f digiurban
```

---

## 14. Máquina de Estados dos Protocolos

```
                    ┌───────────────┐
                    │   VINCULADO   │ (Protocolo recém-criado)
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
              ┌─────│   PROGRESSO   │─────┐
              │     └───────┬───────┘     │
              │             │             │
              ▼             ▼             ▼
      ┌───────────┐ ┌───────────────┐ ┌───────────┐
      │ PENDENCIA │ │  ATUALIZACAO  │ │ CONCLUIDO │
      └─────┬─────┘ └───────┬───────┘ └───────────┘
            │               │
            └───────┬───────┘
                    │
                    ▼
            ┌───────────┐
            │ CANCELADO │
            └───────────┘
```

**Transições por role:**

| De → Para | CITIZEN | USER | ADMIN |
|-----------|---------|------|-------|
| VINCULADO → PROGRESSO | ✗ | ✓ | ✓ |
| VINCULADO → CANCELADO | ✓ | ✓ | ✓ |
| PROGRESSO → PENDENCIA | ✗ | ✓ | ✓ |
| PROGRESSO → ATUALIZACAO | ✗ | ✓ | ✓ |
| PROGRESSO → CONCLUIDO | ✗ | ✓ | ✓ |
| PENDENCIA → PROGRESSO | ✓ | ✓ | ✓ |
| ATUALIZACAO → PROGRESSO | ✓ | ✓ | ✓ |
| QUALQUER → QUALQUER | ✗ | ✗ | ✓ |

**Constantes:**
- `ACTIVE_STATUSES` = [VINCULADO, PROGRESSO, PENDENCIA, ATUALIZACAO]
- `TERMINAL_STATUSES` = [CONCLUIDO, CANCELADO]
- `NEEDS_CITIZEN_ACTION` = [ATUALIZACAO]
- `NEEDS_STAFF_ACTION` = [PENDENCIA]

---

## 15. Fluxos de Negócio Críticos

### Fluxo 1: Abertura de Protocolo pelo Cidadão

```
1. Cidadão acessa Portal → escolhe serviço → preenche formulário
2. POST /api/citizen/services/:id/request (com documentos)
3. Backend: createProtocol() → geocodifica endereço → gera número único
4. SLA criado automaticamente (service.estimatedDays ou 30 dias)
5. Notificação para departamento responsável
6. Status: VINCULADO
```

### Fluxo 2: Atendimento e Conclusão

```
1. Servidor visualiza protocolo → atribui para si
2. PATCH /api/protocols/:id/status → PROGRESSO
3. Servidor trabalha: adiciona comentários, solicita documentos
4. Se necessário: PENDENCIA (aguarda setor) ou ATUALIZACAO (aguarda cidadão)
5. Cidadão responde/reenvia → PROGRESSO
6. Servidor conclui: POST /api/protocols/:id/complete → CONCLUIDO
7. SLA.completeSLA() → calcula se atrasou
8. Cidadão notificado → pode avaliar (rating 0-5)
```

### Fluxo 3: Geração de Documento com Assinatura

```
1. Admin seleciona template → POST /api/protocols/:id/generate-document
2. Backend compila Handlebars (95+ variáveis)
3. Detecta placeholder de assinatura
4. Playwright gera PDF
5. Se certificado sistema existe: assina automaticamente (RSA + SHA-256)
6. Hash SHA-256 + código de validação gerados
7. POST /api/generated-documents/:id/send → Email com PDF anexado
```

### Fluxo 4: ChatBot (FlowEngine)

```
1. Cidadão inicia conversa com DigiBot
2. FlowEngineService.startFlow('menu_principal')
3. Menu com 8 opções → cidadão escolhe
4. FlowEngine executa nodos sequencialmente:
   - message → question → action (API) → condition → menu → end
5. Actions chamam Backend via DigiUrbanIntegration
6. Estado persistido em FlowExecution (state JSON)
7. Se erro: retry (max 3) → fallback menu principal
8. Respostas emitidas via WebSocket em tempo real
```

### Fluxo 5: Deploy Automático

```
1. Push em main → GitHub Actions dispara
2. SSH para VPS → git reset --hard origin/main
3. Docker build --no-cache --pull (3 stages)
4. docker-compose up -d
5. startup.sh: PostgreSQL → enums → migrations → seed
6. Supervisord: backend → frontend → nginx
7. Seeds: micro sistemas + fluxos bot
8. Ollama: pull modelo LLM + criar DigiBot customizado
9. Health check: /health + /api/citizen/services
10. ✅ Deploy concluído
```

---

> **DigiUrban** — Plataforma proprietária de governo digital municipal.
> Todos os direitos reservados.
