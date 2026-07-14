# DigiUrban - Guia para Assistentes de IA

## Visão Geral

Plataforma de governo digital municipal. Monorepo com 4 serviços: Backend (Express), Frontend (Next.js), Messages Server (Socket.IO + Bot), SMTP Server. Tudo orquestrado via Docker Compose com PostgreSQL, Redis e llama.cpp.

## Estrutura do Monorepo

```
Digiurbanlite/
├── digiurban/backend/          # API REST Express + Prisma (porta 3001)
├── digiurban/frontend/         # Next.js 14 App Router (porta 3000)
├── ultrazend-messages-server/  # WebSocket + Bot Engine (porta 9001)
├── ultrazend-smtp-server/      # SMTP MX + Submission (portas 25, 587)
├── docker/                     # nginx.conf, supervisord.conf, startup.sh, SQL scripts
├── docker-compose.vps.yml      # Orquestração produção
└── Dockerfile                  # Multi-stage build (backend + frontend + nginx)
```

## Backend (`digiurban/backend/src/`)

### Tecnologias
- Express 5.1 + TypeScript + Prisma 6.19 (PostgreSQL)
- JWT em cookies HTTP-only + bcrypt + Helmet
- Socket.IO 4.8 + BullMQ + Redis
- Winston logger + Zod/Joi validação

### Arquivos Críticos
- `index.ts` — Registro de ~94 prefixos de rota via helper `loadRoute()` com try/catch
- `prisma/schema.prisma` — 213 models (fonte de verdade do banco)
- `middleware/admin-auth.ts` — Auth admin (cookie `digiurban_admin_token`)
- `middleware/citizen-auth.ts` — Auth cidadão (cookie `digiurban_citizen_token`)
- `middleware/internal-auth.ts` — Auth para Messages Server
- `config/protocol-status.config.ts` — Matriz de transição de status por role

### Padrões de Autenticação
```typescript
// Admin: JWT no cookie httpOnly
Cookie: digiurban_admin_token
Payload: { userId, type: 'admin', iat, exp }
Middleware: adminAuthMiddleware

// Cidadão: JWT no cookie httpOnly
Cookie: digiurban_citizen_token
Payload: { citizenId, userId?, type: 'citizen', iat, exp }
Middleware: citizenAuthMiddleware

// Fallback: Authorization: Bearer <token>
// Internal (Messages→Backend): MESSAGES_SERVICE_TOKEN header
```

### Roles de Usuário
```
USER          — Servidor público (atendente)
COORDINATOR   — Coordenador de departamento
MANAGER       — Gerente
ADMIN         — Administrador do sistema
SUPER_ADMIN   — Super admin (gerencia município)
CITIZEN       — Cidadão (autenticação separada)
```

### Status de Protocolo
```
VINCULADO   → PROGRESSO → CONCLUIDO
                        → CANCELADO
            → PENDENCIA → PROGRESSO
            → ATUALIZACAO → PROGRESSO
```
Transições controladas por role em `protocol-status.config.ts`.
Terminais: `CONCLUIDO`, `CANCELADO`.

### Models Prisma Principais
| Model | Descrição | Campos-chave |
|-------|-----------|-------------|
| `User` | Servidor público | name, email, role, departmentId |
| `Citizen` | Cidadão | name, cpf, email, phone, isActive |
| `Department` | Departamento/Secretaria | name |
| `ProtocolSimplified` | Protocolo | status, concludedAt, currentAssignedUserId, departmentId, serviceId |
| `ProtocolSLA` | SLA | isOverdue, daysOverdue, expectedEndDate |
| `ProtocolEvaluationSimplified` | Avaliação | protocolId, rating (0-5), comment, wouldRecommend |
| `ServiceSimplified` | Serviço | name, formSchema (JSON) |
| `DocumentTemplate` | Template de documento | htmlContent, cssContent |
| `GeneratedDocument` | Documento gerado | isSigned |
| `DigitalCertificate` | Certificado digital | publicKey, encryptedPrivateKey |
| `FlowDefinition` | Fluxo do bot | name, nodes (JSON), version |
| `Conversation` | Conversa chat | participantType, isBotConversation |

### Rotas Principais (prefixo `/api`)
| Prefixo | Arquivo | Descrição |
|---------|---------|-----------|
| `/admin/auth` | admin-auth.ts | Login/logout admin |
| `/citizen/auth` | citizen-auth.ts | Login/logout cidadão |
| `/admin/preferences` | admin-preferences.ts | 34 campos de preferências |
| `/protocols` | protocols-simplified.routes.ts | CRUD protocolos |
| `/protocol-analytics` | protocol-analytics.routes.ts | Dashboard, tendências, KPIs |
| `/citizen/services` | citizen-services.ts | Catálogo de serviços |
| `/citizen/protocols` | citizen-protocols.ts | Protocolos do cidadão |
| `/documents` | document-signing.routes.ts | Assinatura digital |
| `/certificates` | certificates.routes.ts | Certificados digitais |
| `/saude/atendimento` | saude-atendimento.routes.ts | ~52 endpoints saúde |
| `/saude/farmacia` | saude-farmacia.routes.ts | ~28 endpoints farmácia |
| `/saude/tfd` | saude-tfd.routes.ts | ~52 endpoints TFD |
| `/notifications` | notifications.routes.ts | SSE notifications |
| `/internal` | internal.routes.ts | API para Messages Server |
| `/messages` | messages.ts | Mensagens |
| `/super-admin` | super-admin.ts | Gerenciamento município |

### Convenções do Backend
- Todas as rotas registradas em `index.ts` com `try/catch` por import
- Serviços em `src/services/` contêm lógica de negócio (não nas rotas)
- Upload via Multer (max 10MB/arquivo, 50MB total)
- CSV export com UTF-8 BOM (`\uFEFF`) para compatibilidade Excel
- Erros sempre retornados como JSON `{ error: string }`
- Prisma `groupBy` não suporta nested relations
- Campo `concludedAt` para tempo de conclusão (NÃO `updatedAt`)
- Campo `createdById` (não `createdBy`)
- Campo `currentAssignedUserId` para servidor atual

### Scripts Backend
```bash
npm run dev          # nodemon
npm run build        # tsc
npm run db:migrate   # prisma migrate dev
npm run db:seed      # seed consolidado
npm run db:studio    # Prisma Studio GUI
npm run type-check   # tsc --noEmit
npm run diagnose     # teste de carregamento de rotas
```

## Frontend (`digiurban/frontend/`)

### Tecnologias
- Next.js 14.2 (App Router) + React 18 + TypeScript 5.9
- Tailwind CSS 3.4 + shadcn/ui (Radix UI)
- TanStack React Query 5 + SWR + Axios
- react-hook-form + Zod
- Socket.IO Client + Recharts + Leaflet + TipTap + pdfjs-dist
- PWA com @ducanh2912/next-pwa

### Configuração Next.js
- Output: `standalone` (Docker)
- `ignoreBuildErrors: true` (TypeScript)
- `ignoreDuringBuilds: true` (ESLint)
- PWA com Workbox: API NetworkFirst, imagens CacheFirst 30d

### Estrutura de Páginas (220+)
```
/                           — Landing page
/cidadao/                   — Portal do cidadão (login, perfil, protocolos, serviços, mensagens, família)
/admin/                     — Área administrativa
/admin/protocolos/          — Gestão de protocolos
/admin/servidores/          — Gestão de servidores
/admin/secretarias/[dept]   — 21 departamentos com módulos
/admin/apps/saude/          — TFD, atendimento, farmácia, cadastros
/admin/templates-documentos/ — Editor WYSIWYG de templates
/admin/organograma/         — Unidades, cargos, funções, equipes
/admin/certificados-digitais/— Certificados
/admin/email/               — Email (inbox, sent, drafts, trash)
/admin/bot-flows/           — Editor de fluxos do chatbot
/admin/analytics/           — Dashboard analítico
/admin/relatorios/          — Templates de relatórios
/admin/configuracoes/       — 8 abas de configuração
/super-admin/               — Gestão do município, email server, auditoria
```

### Hooks Customizados (47)
- `useOptimizedQuery` — Query com cache otimizado
- `useAdminPreferences` — 10 funções de gerenciamento de preferências
- `useCitizenProtocols`, `useCitizenServices` — Dados do cidadão
- `useDepartmentStats`, `useSecretariaStats` — Stats por departamento
- `useSaudeStats`, `useEducacaoStats`, `useAgriculturaStats` — Stats por área
- `useViaCEP` — Busca CEP via API
- `useCertificates` — Gestão de certificados
- `useIsMobile` — Detecção de mobile
- `usePushNotifications` — Web Push
- `use-toast`, `use-confirm-dialog`, `use-sidebar` — UI state

### Componentes-chave
- `components/ui/` — shadcn/ui (button, input, card, dialog, tabs, data-table...)
- `components/admin/services/ServiceFormWizard.tsx` — Wizard 8 passos para serviços
- `components/admin/templates/` — Templates de página por área (saúde, educação, social)
- `components/analytics/dashboards/` — 5 dashboards por role
- `components/shared/` — PDF viewer, assinatura digital, certificados
- `lib/api.ts` — Cliente Axios configurado
- `lib/socket-manager.ts` — Gerenciador Socket.IO

### Convenções do Frontend
- App Router (NÃO Pages Router) — rotas em `src/app/`
- Componentes: Functional + hooks, TypeScript strict
- Formulários: react-hook-form + Zod sempre
- State management: TanStack Query (server state), sem Redux/Zustand
- Temas: dark mode via classe CSS (`class` strategy)
- Cores: CSS variables HSL (padrão Radix)
- Evitar `window.location.reload()` — usar CustomEvent
- TipTap: custom Node extensions para preservar HTML tags
- `enableInputRules: false` e `enablePasteRules: false` no TipTap
- Usuários são LEIGOS — sempre UX simples, nunca editores de código
- Modais < Páginas dedicadas para views complexas (URLs compartilháveis)
- `<iframe srcDoc>` para preview de HTML templates (melhor que dangerouslySetInnerHTML)

### Scripts Frontend
```bash
npm run dev          # next dev
npm run build        # next build (com copy:pdfjs + generate:icons)
npm run type-check   # tsc --noEmit
npm run lint         # next lint
```

## Messages Server (`ultrazend-messages-server/src/`)

### Tecnologias
- Express 5 + Socket.IO 4.8 + Redis adapter
- Prisma 6.19 (PostgreSQL compartilhado)
- JWT (mesmo secret do backend)

### Arquitetura do Bot
```
Frontend → HTTP(:9001) → FlowEngineService → FlowEngine → ActionHandlers → DigiUrbanIntegration → Backend(:3001, /api/internal)
```

### Fluxos JSON (`src/bot/flow/flows/`)
9 fluxos pré-configurados, auto-seeded no boot via `FlowDefinitionSeeder`:
- `menu-principal.json` (v1.1) — 8 opções
- `solicitar-servico.json` — Abertura de protocolo
- `consultar-protocolo.json` (v1.1) — Consulta + histórico + documentos
- `meu-perfil.json` (v1.1) — Edição de dados pessoais
- `documentos.json`, `avaliacao.json`, `minha-familia.json`, `notificacoes.json`, `ajuda.json`

### Tipos de Nodo (9)
`message`, `question`, `menu`, `action`, `condition`, `form`, `upload`, `location`, `end`

**NÃO existem:** `api_call`, `wait` (foram removidos)

### Rotas Bot
```
POST /api/bot-flow/start     — Iniciar fluxo
POST /api/bot-flow/message   — Processar mensagem
POST /api/bot-flow/upload    — Upload em fluxo
POST /api/bot-flow/cancel    — Cancelar fluxo
POST /api/bot-flow/reset     — Voltar ao menu principal
POST /api/bot-flow/pause     — Pausar (atendimento humano)
POST /api/bot-flow/resume    — Retomar
GET  /api/bot-flow/health    — Health check
```

### WebSocket Events
```
message:send, message:read, message:new
typing:start, typing:stop
conversation:join, conversation:leave, conversation:new
ping/pong
```

### Rooms Socket.IO
```
user:${userId}:${userType}    — Sala pessoal (CITIZEN/SERVER)
conversation:${conversationId} — Sala de conversa
channel:${channelId}          — Canal de broadcast
```

### Convenções Messages Server
- Action `startFlow` é especial — handled pelo FlowEngine, não pelos ActionHandlers
- DigiUrbanIntegration: timeout 15s, retry automático para ECONNREFUSED/ECONNABORTED
- Erros amigáveis em pt-BR com fallback ao menu principal
- Upload permanente em `uploads/bot/` com metadata
- Conversa bot protegida contra delete/archive
- Socket paths: Admin `:3001/api/socket` | Messages `:9001` (path default)
- `ProtocolEvaluationSimplified` NÃO tem campo `evaluatedBy`

## SMTP Server (`ultrazend-smtp-server/src/`)

### Funcionalidades
- **MX Server (porta 25):** Recebe emails de servidores externos
- **Submission Server (porta 587):** Envio autenticado por clientes
- **MX Delivery:** Entrega direta via DNS MX records (sem relay externo)
- **DKIM:** Assinatura automática RSA 2048

## Docker / Deploy

### Build
```bash
# Multi-stage: backend-builder → frontend-builder → runner (nginx + supervisord)
BUILD_TIMESTAMP=$(date +%s) docker compose -f docker-compose.vps.yml up -d --build
```

### Containers
| Container | Porta externa | Porta interna |
|-----------|-------------|---------------|
| digiurban-vps | 3060 | 80 (Nginx) → 3001 (backend) + 3000 (frontend) |
| ultrazend-messages | 9001 | 9001 |
| ultrazend-smtp | 25, 587 | 25, 587 |
| digiurban-postgres | 5432 | 5432 |
| digiurban-redis | 6379 | 6379 |
| digiurban-llamacpp | 8080 | 8080 |

### Variáveis de Ambiente Obrigatórias
```env
DATABASE_URL=postgresql://user:pass@postgres:5432/digiurban
JWT_SECRET=<chave-secreta-longa>
```

## Assinatura Digital Automática

### Fluxo
1. Admin insere placeholder via botão PenTool no editor WYSIWYG TipTap
2. HTML: `<div class="signature-placeholder" data-signature-width="200" data-signature-height="80">`
3. Backend detecta class `signature-placeholder` no HTML compilado
4. Busca certificado do sistema: `userId=null AND citizenId=null AND status=ACTIVE`
5. Descriptografa chave privada com AES-256-GCM (`CERTIFICATE_ENCRYPTION_KEY`)
6. Assina PDF e atualiza `isSigned=true`
7. Se assinatura falhar, documento é gerado sem assinatura (falha silenciosa)

### Seed de Certificado
```bash
cd digiurban/backend
npx ts-node prisma/seeds/seed-system-certificate.ts
```

## Gotchas e Armadilhas Comuns

### Multi-Tenant (plano 2026-07-13 implementado)
- Isolamento automático: models com campo `tenantId` são escopados pela extension (`lib/prisma-tenant-extension.ts`, detecção via DMMF) — novas tabelas municipais DEVEM ter `tenantId String?` + `@@index([tenantId])`
- Uniques de catálogo são compostas `[tenantId, x]` — `findUnique({ where: { nome } })` não compila; usar `findFirst` (a extension escopa)
- Endpoints de plataforma vivem em `/api/platform` (PlatformUser, cookie `digiurban_platform_token`); `/api/super-admin/tenants*` responde **410**
- Login do super-admin espelha SUPER_ADMIN do tenant default como PlatformUser (ponte de identidade) — o proxy Next repassa todos os Set-Cookie
- Jobs/seeds: `runAsTenant()`/`forEachActiveTenant()`; seeds standalone têm normalização de `tenantId` NULL no fim do `seed-consolidated.ts`
- Fluxos do bot são POR TENANT (`[tenantId, name]`); seeder do Messages Server itera tenants ativos
- Messages Server: schema local é cópia — ao mudar Conversation/Message/FlowDefinition no backend, sincronizar `ultrazend-messages-server/prisma/schema.prisma`; escritas usam `resolveTenantId()` (`src/utils/tenant.ts`)
- Deploy: RLS só vale com role não-superuser (`digiurban_app` + `MIGRATE_DATABASE_URL` p/ migrations); flags `TENANT_STRICT*` no compose
- Smoke de isolamento: `npm run smoke:tenant:isolation` (2 tenants efêmeros, requer banco)

### Backend
- `concludedAt` para tempo de conclusão (NÃO `updatedAt`)
- `createdById` (não `createdBy`)
- Prisma `groupBy` não suporta nested relations — usar `_count` ou aggregation
- CSV export precisa de UTF-8 BOM (`\uFEFF`) para Excel
- `ProtocolEvaluationSimplified` não tem `evaluatedBy` — só `protocolId`, `rating`, `comment`, `wouldRecommend`

### Frontend
- TipTap requer custom Node extensions para preservar tags HTML (Node.create() com parseHTML/renderHTML)
- `enableInputRules: false` e `enablePasteRules: false` obrigatórios no TipTap
- `addGlobalAttributes()` para style/class em todos os node types
- `<iframe srcDoc>` > `dangerouslySetInnerHTML` para preview HTML
- Nunca expor editor de código para usuários — sempre WYSIWYG visual
- Páginas dedicadas > modais para views complexas (URLs compartilháveis, navegação, code splitting)
- Evitar `window.location.reload()` — usar CustomEvent

### Messages Server
- NodeType tem APENAS 9 tipos (message, question, menu, action, condition, form, upload, location, end)
- `startFlow` é handled pelo FlowEngine, NÃO pelos ActionHandlers
- ConversationService no FlowEngineService NÃO é usado diretamente
- Socket.IO paths são DIFERENTES: admin `:3001/api/socket` vs messages `:9001` default

### Deploy
- Frontend env vars com `NEXT_PUBLIC_` são definidas em BUILD TIME no Dockerfile
- `npm install --legacy-peer-deps` é necessário em todos os serviços
- Playwright browsers precisam ser instalados no container runner
- Nginx faz proxy de `/api` → backend:3001 e `/messages-api` → messages:9001
