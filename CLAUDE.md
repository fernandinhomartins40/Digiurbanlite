# DigiUrban - Guia para Assistentes de IA

## Visão Geral

Plataforma de governo digital municipal. Monorepo com 4 serviços: Backend (Express), Frontend (Next.js), Messages Server (Socket.IO + Bot). E-mail só transacional, pela API do VeloMail. Tudo orquestrado via Docker Compose com PostgreSQL e Redis. IA por APIs externas via gateway no backend (sem IA local).

## Estrutura do Monorepo

```
Digiurbanlite/
├── digiurban/backend/          # API REST Express + Prisma (porta 3001)
├── digiurban/frontend/         # Next.js 14 App Router (porta 3000)
├── ultrazend-messages-server/  # WebSocket + Bot Engine (porta 9001)
├── ultrazend-face-server/      # Biometria facial: regras, consentimento, fotos cifradas (rede interna, 9006)
├── ultrazend-face-engine/      # Motor facial Python (UniFace + ONNX CPU) — só mede, não decide (rede interna, 8000)
├── ultrazend-doc-engine/       # Leitura de documentos Python (PaddleOCR via RapidOCR + ZXing, ONNX CPU) — só lê (rede interna, 8000)
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
/admin/email/               — E-mails do sistema (remetente, respostas, enviados)
/admin/digibot/             — DigiBot: mensagens, menu, perguntas, palavras, ensinar o bot (sem JSON)
/admin/analytics/           — Dashboard analítico
/admin/relatorios/          — Templates de relatórios
/admin/configuracoes/       — 8 abas de configuração
/super-admin/               — Gestão do município, e-mail transacional (/super-admin/email), auditoria
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

### Arquitetura do Bot (motor único, 2026-10-02)
```
Frontend → HTTP(:9001) → FlowEngineService → CitizenAiOrchestrator (+ CitizenSelfService) → ActionHandlers → DigiUrbanIntegration → Backend(:3001, /api/internal)
```
- **Um motor só:** o assistente (`bot/ai/CitizenAiOrchestrator.ts`) atende tudo. Ajuda, Meu perfil, Documentos, Família, Avisos e Avaliação são etapas do `bot/ai/CitizenSelfService.ts` (não existem mais fluxos JSON do motor antigo; só `bot/flows/ai-assistant.json`, que dá o id do fluxo). Atendimento antigo aberto é encerrado e a mensagem segue para o assistente
- **Entende sem IA** (backend `services/digibot/`): busca de serviços tolerante (`text-match.ts`: enchimento, variações, erro de digitação, sinônimos de prefeitura, palavras do município em `BotServiceTerm`), perguntas frequentes (`BotFaq`) e registro do não entendido (`BotUnanswered`, PII mascarada)
- **Configuração por município** (`BotSettings`, rascunho → publicar → versões): nome, boas-vindas, despedida, menu inicial (essenciais travados), atendimento humano, teto de usos de IA por conversa. O bot lê via `GET /api/internal/bot/knowledge` (cache 60 s, `bot/ai/botKnowledge.ts`)
- Trava "uma mensagem por vez" no Redis (`utils/botLock.ts`); inatividade por timestamp (não depende de cronômetro em memória); município sem fluxos é recriado sob demanda (`ensureTenantFlows`)
- Testes: `npx jest` no servidor do bot e `npx jest __tests__/unit` no backend — rodam no CI antes do deploy

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
GET  /api/bot-flow/status    — Situação do atendimento (bot | waiting + posição | human)
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
t:${tenantId}:servers         — Todos os servidores do município (fila de atendimento)
```
Eventos de atendimento: `handover:new` / `handover:update` / `handover:taken` (servidores), `handover:takeover` (cidadão), `handover:ended` (todos), `message:deleted`.

### Chat e atendimento humano (refeito 2026-10-06)
- **Atendente**: "Assumir" = `POST /api/handover/takeover` (pausa o assistente, grava `metadata.takenOverBy`, avisa o cidadão; quem chega depois recebe 409). Só quem assumiu escreve na conversa do assistente (`canWriteConversation`). Com o atendimento pausado o bot NÃO responde: a mensagem do cidadão vai para o atendente (`relayToHumanIfPaused`). "Encerrar atendimento" = `/api/bot-flow/resume`
- Fila avisa TODOS os servidores do município (sala `t:{tenant}:servers`); ninguém assumiu em `human.maxWaitMinutes` (painel DigiBot) → volta ao bot com `noAttendantMessage` (job de 1 min)
- **Toda mensagem do chat passa por `deliverChatMessage()`** (`delivery/chatDelivery.ts`): valida, grava `tenantId`, contadores, eventos e aviso fora do app (`CHAT_MESSAGE` pelo `/api/internal/notifications/dispatch`, no máx. 1 a cada 30 min por conversa/pessoa)
- **Avisos dos pedidos** chegam na conversa "Avisos da Prefeitura" (participante `PREFEITURA_AVISOS`, só leitura) via `POST /internal/notices` com o token interno (backend: `services/chat-notices.service.ts`). Nunca inventar sessão de servidor para isso
- Sessão por portal: `/cidadao` usa o cookie de cidadão, `/admin` o de servidor (socket manda `auth.portal`; HTTP usa o Referer). `utils/authToken.ts`
- Arquivos `/uploads/bot/*` passam pelo nginx para o messages-server, que confere se a pessoa pode ver a conversa do anexo
- Removidos: canais, analytics, relatórios, "apagar para todos", rota `/api/messages` do backend e `UltraZendMessagesAdapter`

### Convenções Messages Server
- Action `startFlow` é especial — handled pelo FlowEngine, não pelos ActionHandlers
- DigiUrbanIntegration: timeout 15s, retry automático para ECONNREFUSED/ECONNABORTED
- Erros amigáveis em pt-BR com fallback ao menu principal
- Upload permanente em `uploads/bot/` com metadata
- Conversa bot protegida contra delete/archive
- Socket paths: Admin `:3001/api/socket` | Messages `/socket.io/` (path default, pelo nginx; porta 9001 não é pública)
- `ProtocolEvaluationSimplified` NÃO tem campo `evaluatedBy`

## E-mail (transacional, VeloMail — 2026-10-05)

- **Sem caixa de entrada.** O servidor SMTP próprio (`ultrazend-smtp-server`, relay aberto nas portas 25/587) foi REMOVIDO. O DigiUrban só envia: avisos, troca de senha, boas-vindas, documentos
- **Porta única de envio:** `sendMail()` em `backend/src/services/mail/mailer.ts` → linha em `emails` (QUEUED) + job na fila BullMQ `transactional-mail` → `workers/mail.worker.ts` entrega por `POST {apiBaseUrl}/emails/send` (header `x-api-key: re_...`), até 8 tentativas, 429 respeita `retryAfter`. Nunca usar nodemailer/SMTP direto
- `TransactionalEmailService.sendEmail/sendRawEmail` seguem existindo (templates `EmailTemplate`), mas delegam para `sendMail`; `emailServerId` é ignorado
- **Todo e-mail sai de um modelo** (2026-10-06): `sendTemplatedMail()` em `services/mail/templated.ts`. Modelos padrão + descrição ("quando é enviado") em `lib/email/default-templates.ts` (`EMAIL_TEMPLATE_INFO`); criados/atualizados sozinhos se ninguém editou; editáveis no Super-admin › Modelos de e-mail; desligado = não envia (menos senha/conta). Função nova que manda e-mail = modelo novo lá + teste `__tests__/unit/email-templates.test.ts`
- **Avisos por e-mail**: tipo de aviso → modelo em `NOTIFICATION_TEMPLATE_BY_TYPE`; quais tipos vão por e-mail em `EMAIL_TYPES` (`notification.service.ts`). Atraso de prazo NÃO manda e-mail por pedido (resumo diário aos gestores) — o plano gratuito do VeloMail é 100/dia
- Webhook `POST /api/webhooks/velomail` (HMAC `X-Webhook-Signature`, corpo cru guardado em `req.rawBody` só para `/api/webhooks/`) marca DELIVERED/FAILED
- Configuração pelo painel: Super-admin › E-mail (`/api/platform/mail`: chave `re_` e segredo do webhook cifrados em `platform_secrets`, remetente, liga/desliga, teste). Prefeitura: `/admin/email` (`/api/admin/mail`: nome do remetente, e-mail de resposta, desligar avisos não críticos, enviados)
- Links em e-mails usam `tenantPortalUrl()` (`services/mail/links.ts`): domínio próprio → `{slug}.TENANT_BASE_DOMAIN` → FRONTEND_URL
- Domínio de envio: `notificacoes.digiurban.com.br` (DNS na Cloudflare, registros sem proxy)

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
| ultrazend-messages | — (interna, via nginx) | 9001 |
| digiurban-postgres | 5432 | 5432 |
| digiurban-redis | 6379 | 6379 |
| ultrazend-face | — (interna) | 9006 |
| ultrazend-face-engine | — (interna) | 8000 |

### Variáveis de Ambiente Obrigatórias
```env
DATABASE_URL=postgresql://user:pass@postgres:5432/digiurban
JWT_SECRET=<chave-secreta-longa>
```

## Assinatura digital (motor único, 2026-10-07)

- **Um motor só** (`backend/src/services/signing/signature.service.ts`) para documento gerado no protocolo (`GeneratedDocument`, tipo GENERATED), documento enviado para assinar (`ExternalDocument`, EXTERNAL) e documento do processo interno (`InternalProcessDocument`, INTERNAL). Assinar = **confirmar a senha** (servidor ou cidadão) — sem PIN, sem chave no navegador, sem carimbo por cima do PDF
- **Certificado da pessoa emitido sozinho** na 1ª assinatura (`ensureUserCertificate`/`ensureCitizenCertificate`, `certificate-authority.service.ts`) pela **AC DigiUrban** (`signing/keystore.service.ts`). Chave mestra das chaves privadas e chave da AC ficam cifradas em `platform_secrets` (criadas sozinhas; NÃO usar `.env`). Formato de cifra `v2:`; o antigo (texto fixo do código) é recifrado pela rotina `jobs/signing-keys-startup.job.ts`. A chave privada NUNCA sai do servidor (nenhuma resposta a devolve)
- A assinatura cobre o SHA-256 do **conteúdo original** (que nunca é alterado) → várias pessoas assinam o mesmo documento. Cada assinatura (`Signature`) tem `code` público (XXXX-XXXX-XXXX-XXXX), `signerName/Role`, `tenantId`
- **PDF assinado** = original + "Folha de assinaturas" (QR da conferência) + selo PDF do município (`signing/signed-pdf.service.ts`, `@signpdf`, certificado SYSTEM do município). Gravado em `signedFilePath` (`-assinado.pdf`, mesmo caminho a cada nova assinatura) com `finalHash`; baixar/enviar/publicar usam SEMPRE `signedFilePath || filePath`
- **Pedidos de assinatura**: fila única `SignatureRequest` (os 3 tipos) — `/api/signatures/requests|queue|target/:type/:id`; processo interno usa as mesmas funções. A tabela antiga `internal_process_signature_requests` só serve para conferir assinaturas antigas
- **Conferência pública** `/validar-documento` (QR abre com `?codigo=`) → `GET /api/public/validate/code/:code` (código da assinatura OU `VAL-...` do documento do protocolo; busca em todos os municípios com `runAsPlatform`); mostra versão substituída, nome do cidadão abreviado, sigiloso sem assunto. Códigos antigos do processo interno: `verifyLegacyInternalPublic`
- Assinatura eletrônica **avançada** (Lei 14.063/2020, art. 4º, II) — NÃO é ICP-Brasil; não escrever nos documentos que tem validade de MP 2.200-2/ICP
- Documentos do protocolo seguem o acesso ao protocolo (`protocolScope` em `routes/document-templates.ts`); entregar ao cidadão exige ao menos uma assinatura
- **Documento final do serviço** (`ServiceSimplified.finalDocumentTemplateId`, campo "Documento entregue ao concluir" no cadastro do serviço): `runConclusionHooks` gera o documento (`sourceStageName = 'Documento final do serviço'`), avisa quem concluiu e, assinado, ele é publicado sozinho ao cidadão (`signTarget`)
- **Modelos de documento por município** (`DocumentTemplate`, código único `[tenantId, code]`; `findUnique({ code })` não existe mais). Catálogo em `backend/src/catalog/document-templates/` (6 do protocolo + todos do processo interno/licitação, `scope` PROTOCOL | INTERNAL_PROCESS) aplicado por `applyDocumentTemplateCatalog()` no provisionamento, no botão "Atualizar catálogo" do Super-admin e ao subir o servidor — regra "só acrescenta" (`catalogHash` nulo = editado pelo município). O processo interno usa o modelo do município (`scope INTERNAL_PROCESS`, texto com `{{campos}}`) e cai no padrão de `flows/templates.ts`. Variáveis do município (`municipalityName/Logo/Cnpj/Website`, `validationUrl`) e endereço do cidadão vêm do gerador

## Gotchas e Armadilhas Comuns

### Multi-Tenant (plano 2026-07-13 implementado)
- Isolamento automático: models com campo `tenantId` são escopados pela extension (`lib/prisma-tenant-extension.ts`, detecção via DMMF) — novas tabelas municipais DEVEM ter `tenantId String?` + `@@index([tenantId])`
- Uniques de catálogo são compostas `[tenantId, x]` — `findUnique({ where: { nome } })` não compila; usar `findFirst` (a extension escopa)
- Endpoints de plataforma vivem em `/api/platform` (PlatformUser, cookie `digiurban_platform_token`); `/api/super-admin/tenants*` responde **410**
- Console `/super-admin`: a **Equipe da plataforma** (PlatformUser, papéis PLATFORM_ADMIN/PLATFORM_SUPPORT) é a fonte de verdade do login (`/api/super-admin/login` tenta PlatformUser antes do SUPER_ADMIN legado). Rotas antigas usadas pelo console (e-mail, auditoria, logs, monitoramento, modelos) usam `platformConsoleAuth` — aceita as duas identidades e bloqueia escrita para Suporte. Equipe: `/api/platform/team*`, senha própria: `/api/platform/me/password`
- `/api/*` é SEMPRE do backend: nginx em produção, `rewrites` do `next.config.js` em dev. Não criar rotas em `frontend/app/api` (foram removidas; nunca eram alcançadas)
- Backup do painel = `pg_dump` completo (`services/database-backup.service.ts`, usa MIGRATE_DATABASE_URL por causa do RLS). Restaurar e rodar migrations pelo painel respondem 410 (procedimento de servidor)
- **IA = gateway no backend** (`services/ai-gateway/`): provedores da PLATAFORMA (JEV p/ decisões; DeepSeek/Qwen/MiniMax/Kimi/GLM/DeepInfra/OpenRouter p/ texto), chaves cifradas (AI_KEYS_ENCRYPTION_KEY|JWT_SECRET), roteador por menor custo efetivo, PII mascarada (`pii.ts`) antes de sair. Toda chamada de município cobra da carteira (`AiTenantWallet`/`AiCreditLedger`); 402 sem créditos, 503 sem provedor — quem chama deve cair no caminho determinístico. Bot: `CitizenAiClient` → `/api/internal/ai/{decide,complete}`. O serviço `digiurban-ai` (llama.cpp) foi REMOVIDO do repositório (consultas sem filtro de município)
- **Assistente dos servidores** (`/api/ai`, `routes/admin-ai-assistant.routes.ts`): conversas em `AiAssistantConversation/Message` (dono = userId), resposta via `complete()` cobrando do município, stream NDJSON; contexto só agregado (contagens de protocolos; servidor comum vê só o próprio departamento). Rotas antigas da IA local → 410
- **Token interno bot↔backend** é gerado no painel (Super-admin › Chaves de API › Comunicação interna) e guardado cifrado em `platform_secrets`; o messages-server lê do banco (`utils/serviceToken.ts`). Depois de gerado, o padrão público do compose deixa de valer
- **Configuração nova = formulário no painel, nunca .env** (o operador não edita o .env)
- **Prazo de guarda (LGPD)**: `PrivacyRetentionSettings` (Super-admin › Privacidade), job diário 03:30, desligado por padrão; apaga conteúdo de conversas do bot/chat SEM protocolo, estado de fluxos encerrados e conversas do Assistente
- **Saldo baixo**: `checkLowBalance()` no `chargeUsage` avisa os ADMIN do município uma vez (Notification `AI_CREDITS_LOW`); limite padrão em `AiBillingSettings.lowBalanceCredits`, o município pode trocar em IA e créditos
- **Messages-server — acesso às conversas**: sempre checar `canReadConversation()` (`src/server/accessControl.ts`) antes de devolver mensagens ou entrar na sala; listas de pessoas filtram `tenantId` e mascaram CPF
- **Bot — saudação/palavras reservadas**: comparar PALAVRAS inteiras ("escola" contém "ola"); frases reservadas "contidas" só valem em mensagens de até 6 palavras
- Leads da landing: `POST /api/leads` (`routes/public-leads.routes.ts`); o antigo `routes/leads.ts` (trial público com senha) continua NÃO montado
- Login do super-admin espelha SUPER_ADMIN do tenant default como PlatformUser (ponte de identidade) — o proxy Next repassa todos os Set-Cookie
- Jobs/seeds: `runAsTenant()`/`forEachActiveTenant()`; seeds standalone têm normalização de `tenantId` NULL no fim do `seed-consolidated.ts`
- Fluxos do bot são POR TENANT (`[tenantId, name]`); seeder do Messages Server itera tenants ativos
- Messages Server: schema local é cópia — ao mudar Conversation/Message/FlowDefinition no backend, sincronizar `ultrazend-messages-server/prisma/schema.prisma`; escritas usam `resolveTenantId()` (`src/utils/tenant.ts`)
- Deploy: RLS só vale com role não-superuser (`digiurban_app` + `MIGRATE_DATABASE_URL` p/ migrations); flags `TENANT_STRICT*` no compose
- Smoke de isolamento: `npm run smoke:tenant:isolation` (2 tenants efêmeros, requer banco)
- `moduleType` (código técnico do serviço) é gerado NO SERVIDOR a partir do nome, sem repetir no município (`services/service-module-type.service.ts`); a tela não envia nem exibe. `ModuleWorkflow` é único por `[tenantId, moduleType]` — buscar com `findFirst`, nunca `findUnique({ moduleType })`. Destino do pedido é `destination`/`appAction`, não o `moduleType`
- Checagem central de município (`middleware/tenant-context.ts`): rotas de login/logout/senha e sessões SUPER_ADMIN/plataforma são ISENTAS — sessão antiga de outro município não pode bloquear login
- ⚠️ A extension injeta `tenantId` no `data` de TOPO de create/update, mas **NÃO** em nested create (`{ fields: { create: [...] } }`) — propagar explícito com `tryGetTenantId()` (visto na F6 do Registry)

### Biometria facial (migração UniFace 2026-10-04)
- **O rosto é analisado no SERVIDOR** (`ultrazend-face-engine`, UniFace/ONNX). O navegador (face-api.js, modelos em `/face-models`) SÓ guia o enquadramento — nunca mandar vetor nem "nota de prova de vida" do cliente
- Prova de vida = desafio sorteado pelo servidor (3 fotos: frente, giro para o lado sorteado, frente) + MiniFASNet. Regras puras em `ultrazend-face-server/src/services/face/decisions.ts` (testes: `npm test` no face-server, roda no CI)
- **Tudo por município**: o face-server recebe `X-Tenant-Id` do backend e filtra cada consulta; identidade facial é única por `[tenantId, personId]`
- **Consentimento por finalidade** (`FaceConsent`: IDENTITY_VERIFICATION | SCHOOL_SECURITY; menor = responsável, art. 14); busca 1:N só entre quem consentiu; revogar tudo apaga a biometria. Registro de acesso em `FaceAccessLog`
- Vetores NUNCA saem do face-server; fotos cifradas (AES-GCM, chave do JWT_SECRET) e só via `/api/admin/face-platform/media` (coordenador+). Sem porta pública
- Modelo/limites no painel (`FaceEngineSettings`, Super-admin › Privacidade); trocar modelo = reprocessamento automático pelas fotos (job do face-server). Prazos de foto/evento em `PrivacyRetentionSettings.face*` (rotina diária sempre ligada)
- Caminho padrão 100% de uso comercial (2026-10-05): BlazeFace + FaceMesh (Google) + **AuraFace** (padrão, Apache 2.0, SHA-256 fixado) + MiniFASNet; giro e qualidade calculados sem modelo. ArcFace/MobileFace do UniFace = uso NÃO comercial (só teste). NÃO voltar RetinaFace/HeadPose/eDifFIQA (treinados em bases de pesquisa). Ver `docs/LGPD-RIPD-BIOMETRIA-FACIAL.md`
- Smoke ponta a ponta: `backend/scripts/smoke-biometria.ts` (requer banco + motor + face-server + fotos de teste)
- `PrismaPromise` é preguiçosa: em `runAsTenant(id, () => prisma.x.create())` a consulta roda FORA do contexto — usar `async () =>`

### Organograma, servidores e processo interno (refeito 2026-10-07)
- **Lotação (EmployeeAssignment) é a fonte de "onde o servidor trabalha"**; `User.departmentId` e `UserDepartment` são espelhos mantidos por `syncUserDepartmentsFromAssignments()` (`assignment-sync.service`). O login do painel carrega `user.departmentIds` e o acesso a protocolos (`protocol-access.service`) considera TODAS as secretarias. Helpers: `services/staff-scope.service.ts`
- Rotas do organograma (unidades, cargos, funções, lotações, hierarquia, grupos de trabalho, dados profissionais) usam `orgChartGuard()` (`middleware/org-chart-auth.ts`): coordenador+ vê; admin altera tudo; gerente só a própria secretaria. Não usar `authenticateAdmin` nelas
- Hierarquia e dados profissionais têm `tenantId` (CNS/registro únicos por município). Toda secretaria tem unidade raiz: provisionamento + `jobs/org-chart-startup.job.ts`
- **Processo interno** (`/api/internal-processes`, `services/internal-process/`, telas `/admin/processos-internos`): Memorando/Ofício/Requisição/Parecer/Processo administrativo tramitando entre unidades; número `PREFIXO-ANO-00001` por município; caixa da unidade e da pessoa; pedir parecer (filho ligado, resposta volta ao pai); ligado a protocolo do cidadão vira nota interna; sugestão de destino por competências (`rules.ts`, sem IA); resumo por IA (créditos); assinatura eletrônica com senha (código = 16 primeiros do SHA-256, conferível); PDF. Gravação aninhada de `movements` PRECISA de `tenantId` explícito (`nestedTenant()`). O antigo `digiurban-flow` e `/api/flow` foram removidos — não recriar serviço separado
- **Contratação pública (Lei 14.133/2021)** no processo interno: tipos LIC (licitação), DIS (dispensa), INX (inexigibilidade) com `flowKey`. Etapas, fundamento legal, checklist, documentos exigidos/assinados e prazos em `services/internal-process/flows/flows.ts`; modelos de documento (DFD, ETP, mapa de riscos, TR, pesquisa de preços, orçamento, minutas de edital/contrato, parecer, autorização, portarias, aviso, ata, decisão de recurso, homologação, justificativa de contratação direta, contrato) em `flows/templates.ts`. Avançar etapa exige os documentos da etapa feitos e assinados (`missingForStage`); documento assinado fica travado. Limites da dispensa (art. 75) em `DISPENSA_LIMITS` — ATUALIZAR TODO ANO pelo decreto do IPCA-E (2026: Decreto 12.807/2025). Rotina diária 8h (dias úteis) avisa etapa vencida. Testes: `__tests__/unit/internal-process-flows.test.ts`
- **Encaminhamento automático por papel** (engenharia reversa do 1Doc, 2026-10-07): cada etapa tem `role` (DEMANDANTE = unidade que abriu; COMPRAS, LICITACAO, JURIDICO, FINANCAS, CONTROLE_INTERNO, AUTORIDADE, CONTRATOS — `flows/roles.ts`). O município liga papel → unidade (+ servidor opcional, `userId`) UMA vez em `/admin/processos-internos/configurar` (`InternalProcessRoleUnit`, `GET/PUT /api/internal-processes/settings/roles`, sugestão sem IA pelo nome das unidades). Avançar (`advanceStage`) muda o processo para a unidade do papel da próxima etapa e avisa; sem papel ligado, fica onde está. "Devolver para ajuste" = `POST /:id/return-stage` (volta uma etapa). Fluxos prontos também: SRP (registro de preços, com secretarias participantes e IRP) e ADA (adesão a ata, art. 86 § 2º)
- **Fluxos editáveis**: fluxo pronto editado pelo município = o tipo LIC/SRP/... ganha `flowDefinition` (vale mais que o da lei; `DELETE /flow-types/:id/custom` volta ao padrão). Etapa pode ter destino fixo (`unitId`/`userId`, nomes conferidos por `hydrateStageTargets`) que vale mais que o papel — regra pura `stageRoute()`
- **Fluxo próprio do município** = tipo com `flowKey: 'CUSTOM'` + `flowDefinition` (validado por `buildCustomFlow`, `flows/custom-flow.ts`); o processo grava `flowSnapshot` na abertura — usar SEMPRE `resolveFlow(process)`, nunca `getFlow(process.flowKey)`. Dados da contratação seguem o `baseKey` (`flowBaseKey`/`fieldsKind`)
- **Pedido de assinatura** (`InternalProcessSignatureRequest`): quem está com o processo pede a qualquer servidor; o pedido dá acesso de leitura (movimento com `toUserId`); a 1ª assinatura trava o texto, as seguintes são coassinaturas (hash no pedido, conferível em `verifySignature`). Central do servidor: `GET /api/internal-processes/dashboard` (não lidos, assinar, pedi, prazos)
- Demandas do Gabinete (`/admin/chamados`) é OUTRA coisa — não misturar com processo interno
- **Gabinete do Prefeito** (refeito 2026-10-07): acesso pelo perfil `User.gabineteAccess` (caixa "Acesso ao Gabinete do Prefeito" no cadastro do servidor, só ADMIN marca; SUPER_ADMIN sempre), NUNCA por `role === 'ADMIN'` — `middleware/gabinete-auth.ts` (`requireGabinete`/`hasGabineteAccess`); no menu, item com `gabinete: true`. Painel numa página com abas (`/admin/gabinete/painel-prefeito?aba=hoje|secretarias|territorio|demandas|gestao`; busca do cidadão SEMPRE na faixa azul do topo; Demandas do Gabinete é a aba `demandas` — `/admin/chamados` redireciona) e **modo TV** `/admin/gabinete/painel-prefeito/tv` (tela cheia escura, sem barra/menu — `AdminLayout` não desenha a moldura nessa rota; mapa ao vivo + pedidos ao vivo + demandas + atrasos por secretaria; lê `GET .../painel-prefeito/tv` a cada 30 s e `/api/map/protocols` a cada 60 s) lendo `GET /api/admin/gabinete/painel-prefeito/overview` (`services/gabinete/mayor-panel.service.ts`); "Cobrar" (pedido ou secretaria) AVISA o responsável e a chefia (gerente/coordenador). Demandas do Gabinete = cidadão atendido no gabinete → protocolo; ordem do prefeito sem cidadão = processo interno (aba "Ordem às secretarias"), acompanhada em Gestão interna
- **Agenda e Mapa são de todos os servidores** (menu Atendimento): agenda central (`/api/agenda`, `central-calendar.service`) com escolha da agenda ao marcar; **Agenda do Prefeito** = `CentralCalendar` com `systemKey = 'MAYOR'`, editores = equipe com `gabineteAccess` (`syncMayorCalendarMembers`), compromissos não particulares visíveis a todos. Compromisso particular nunca aparece para outro servidor, nem no "ver tudo" do administrador. Mapa: `GET /api/map/protocols|stats` no escopo de `buildProtocolScopeWhere` (Gabinete vê tudo), só coordenadas gravadas; endereços procurados pela rotina `jobs/protocol-geocoding.job.ts` (15 min, marca `SEM_RESULTADO`). As rotas antigas `/api/admin/gabinete/agenda*` e `/mapa-demandas*` foram removidas

### Serviços e protocolos (refeito 2026-10-07)
- **Catálogo da plataforma** em `backend/src/catalog/services/*.seed.ts` (21 secretarias, ~404 serviços; dentro de src, vai no build). `applyServiceCatalog()` é a ÚNICA forma de semear: município novo (no próprio processo, com nova tentativa e aviso), botão "Atualizar catálogo de serviços" (Super-admin › município) e `prisma/seeds/services` (repasse). Regra "só acrescenta": `catalogKey` + `catalogHash` — cria o que falta, melhora o que o município NÃO editou, nunca sobrescreve nem religa o que ele editou
- **Destino do pedido no catálogo** = `appAction` no item (`catalog/services/*.seed.ts`; null = fila; ausente = deduz do `moduleType`), lido por `catalogRouteOf()`. NUNCA depender do código técnico ser igual ao código da porta do app (assim o TFD, poda, capina e licença ambiental nunca chegavam ao app). `applyServiceCatalog` liga o destino em serviço não editado e manda para a fila o que aponta para porta extinta. Trava: `__tests__/unit/app-catalog.test.ts`. Auditoria dos apps: `AUDITORIA-APPS-2026-10-08.md`
- **Pedido do portal → fila do app** (Fase 1, 2026-10-08): matrícula, transporte escolar, benefícios sociais, renovação/troca de ponto de credencial, pedido de consulta e de remédio entram por `services/apps/portal-requests.service.ts` (idempotente pelo `protocolId`) e a equipe decide por `portal-queues.service.ts`/serviço do app. TODA novidade do app volta ao pedido pela ponte `app-protocol-bridge.service.ts`: `noteProtocolFromApp` (recado sem encerrar), `concludeProtocolFromApp` (decisão final) — nunca gravar status do protocolo direto. Telas das filas: `frontend/components/apps/portal-requests/`. Fila nova = ação em `config/app-catalog.ts` + código em `PORTAL_REQUEST_ACTIONS` e no Set `PORTAL_QUEUE_MODULE_TYPES` (teste `portal-requests.test.ts`). Smoke: `npm run smoke:apps`
- **Apps das Fases 2–4 (2026-10-08)**: Saúde ganhou odontologia, pré-natal, visitas domiciliares e tela de atividades coletivas (`services/saude/cuidado.service.ts`, telas em `/admin/apps/saude/atendimento/{odonto,pre-natal,visitas,atividades-coletivas}`); apps novos: Mecanização (`/api/agricultura/mecanizacao`), Balcão de Empregos (`/api/apps/desenvolvimento-economico`), Ocorrências de Segurança (`/api/apps/seguranca-publica`) e Cadastro do Turismo (`/api/apps/turismo`), rotas em `routes/fase3/`. Regra de TODO app: começar a análise = `markProtocolInProgressFromApp`; cancelar/recusar/concluir = `concludeProtocolFromApp` (cancelar sem encerrar o pedido deixava o cidadão esperando para sempre). Denúncia anônima da Segurança nunca guarda nem devolve quem fez (`semDenunciante`). Erro de rota da Saúde = `sendError()` (`utils/explain-error.ts`), nunca `res.status(500).json({ error: 'Erro ao ...' })`. Smokes: `npm run smoke:apps` e `npm run smoke:apps:antigos` (banco + Redis). e-SUS NÃO existe: `src/apps/saude/` é código morto de outro projeto
- **Apps gerais (2026-10-09)** — atendem VÁRIAS secretarias; cada registro tem `departmentCode` e cada servidor vê só as suas (`services/apps-gerais/common.ts`: `scopeOf`/`scopeWhere`; ADMIN = todas; rotas `routes/apps-gerais/`): **Agenda de Atendimentos** (`/api/apps/agenda-atendimentos`, marca dia/hora/local, choque de horário do mesmo servidor, atendido/não veio encerram o pedido), **Cursos e Capacitações** (`/api/apps/cursos`, vagas, lista de espera, frequência, concluir dá o resultado), **Feiras e Mercados** (`/api/apps/feiras-mercados`, boxes/bancas, permissão com validade, troca de ponto), **Cemitérios** (`/api/apps/cemiterios`, jazigos, concessão/renovação/transferência/sepultamento/exumação ≥3 anos) e **pedidos de insumos da Agricultura** (`/api/agricultura/pedidos-insumos`, entrega pelo estoque de sementes). **Ordens de Serviço** também é multi-secretaria (Serviços Públicos, Obras, Trânsito, Mobilidade, Meio Ambiente; `OrdemServico.departmentCode`, `OS_DEPARTMENTS`). Smoke: `npm run smoke:apps:gerais`. Cadastros simples, autorizações de evento e empréstimo de equipamento continuam SEM app de propósito (ver `AUDITORIA-APPS-2026-10-08.md`)
- **Serviço novo e os apps (2026-10-09)**: o app reconhece os dados de QUALQUER serviço (criado à mão com `campo_123`, por sugestão com `tipo_maquina`) pelo TÍTULO do campo — contrato de cada porta em `config/app-field-contracts.ts` (papéis com `key` que o app lê, sinônimos, `required`, `fallback` serviceName/citizenName/profile; `keywords`/`notKeywords` para sugerir o app pelo nome; `NOT_AN_APP_CASE` = certidão/declaração/2ª via ficam na fila) e leitor em `services/apps/app-intelligence.service.ts` (`mapFormToApp`, `withAppFields`, `suggestAppActions`, `checkAppFields`). TODO conversor recebe os dados por `appReadyData()` (`protocol-to-app.service.ts`); campo não reconhecido vai em "Outros dados" (`observacoes`). Ligação manual feita no assistente fica no campo como `x-app-field` (vale mais que o título). Rotas: `POST /api/app-catalog/suggest`, `POST /api/app-catalog/field-check`, `GET /api/app-catalog/service-hints`. Tela: passo "Depois do pedido" (`DestinationStep`) sugere/aplica o app, mostra o que o app recebe e acrescenta campos; aba Configurar da secretaria avisa serviços existentes. Porta nova de app = contrato novo (teste `app-intelligence.test.ts` exige contrato para toda porta e que todo serviço do catálogo que vai para app mande os dados obrigatórios)
- **Agenda da Saúde é em horário de Brasília** (`services/agenda-medica/brasilia-time.ts`): nunca usar `setHours/getDay` do servidor (roda em UTC) nem alterar a data recebida
- Serviço novo no catálogo precisa passar em `__tests__/unit/service-catalog-quality.test.ts` (prazo, subtipo, formulário, LGPD dos dados do cadastro, telefone em emergência)
- **Itens só de informação** (`serviceSubtype` CONSULTA_PUBLICA/CONSULTA_AUTENTICADA) NÃO abrem pedido em nenhum canal (`isInformationOnly`); o portal mostra a informação
- **Sugestões de serviço** (~940) em `backend/src/catalog/suggestions/`, servidas por `GET /api/services/suggestions?department=<slug>` (escondem o que o município já tem e o que o catálogo cobre). Não recriar listas de sugestões no frontend
- **Fluxo de etapas**: só `ServiceWorkflow` (o que o protocolo usa), garantido por `ensureServiceWorkflow()` na criação do serviço e no 1º pedido. `ModuleWorkflow` é legado: não gravar nem ler. Prazo padrão único `serviceDays()` (`config/service-defaults.ts`, 10 dias úteis); mudar o prazo do serviço atualiza o fluxo
- **Conclusão**: efeitos de conclusão (etiquetas...) em `runConclusionHooks()` chamado pelo motor de status — não chamar etiqueta em rota/serviço avulso
- **Formulário do serviço** sempre normalizado para JSON Schema (`utils/form-schema-normalize.ts`); o editor (`DataCaptureStep`) lê `fields` e `properties`
- Dados da família só entram no pedido quando o formulário do serviço pede os campos
- Criar/editar serviço só em `/api/services` (as cópias em `/api/admin/services` foram removidas)
- **Etiquetas × serviços**: o formulário do serviço escolhe as etiquetas que ele dá (`tagIds` ↔ `triggerServiceIds`) e a etiqueta exigida para pedir (`requiredTagId`, conferida em `checkServiceLevel`). Etiquetas prontas do catálogo em `src/catalog/tags.ts` (ligadas só a serviços criados pelo catálogo; o que o município desligou não volta). Cidadão: `GET /citizen/auth/my-tags` (etiquetas + serviços sugeridos), no perfil
- Tipos de dados do Registry montados por `syncRegistryTypes()` (catálogo e criação/edição de serviço). Ler/gravar registros continua atrás das flags REGISTRY_* do .env

### Cidadão: níveis, família, etiquetas e LGPD (refeito 2026-10-06)
- **Níveis** (`verificationStatus`: PENDING=Bronze, VERIFIED=Prata, GOLD=Ouro, REJECTED): cada serviço tem `minLevel` (BRONZE padrão) conferido em `services/service-access-level.ts` nos 3 caminhos do cidadão (portal ×2 e bot); balcão não confere. Recusa NÃO desativa a conta: o cidadão corrige e chama `POST /citizen/auth/verification/resubmit`. Mudar nome/nascimento/RG/nome da mãe sendo Prata/Ouro volta para PENDING. Ouro = perfil completo + `rg_frente`/`rg_verso`/`comprovante_residencia` aprovados + biometria (o CPF não é mais documento separado). Avisos de nível sempre por `notifyCitizenLevel()` (central de avisos)
- **Família**: acesso a pedidos/documentos de familiar SÓ com vínculo `ACTIVE` — usar `canActForFamilyMember()` (`services/family-access.ts`); nunca consultar `familyComposition` sem `status`. Alterar/remover exige ser parte do vínculo. Vínculo feito pelo servidor nasce ACTIVE; pelo app fica PENDING até o familiar confirmar (`pendingLinks` em `GET /citizen/family`). Dados de quem não confirmou saem mascarados
- **Dependente sem conta** (menor de 18): `POST /citizen/family/dependents` cria `Citizen` com `registrationSource='FAMILY'`, e-mail vazio e senha aleatória + vínculo ACTIVE `isDependent`. CPF já cadastrado nunca é "puxado" para a família só com o número. Acesso próprio: o responsável informa o e-mail (`/dependents/:id/access`). Cadastro sem e-mail (balcão ou dependente) = `email: ''`
- **Etiquetas** (`CitizenCategory`/`CitizenCategoryAssignment`): tudo em `services/citizen-tags.service.ts` + `routes/admin-citizen-tags.ts` (tela Cidadãos › Etiquetas, ficha e filtro). Gatilho por `triggerServiceIds` (id do serviço, escolhido na tela); `triggerServices` (código técnico) é legado. NÃO recriar pontos/medalhas/hierarquia (removidos)
- **LGPD** (`services/citizen-privacy.service.ts`): `GET /citizen/auth/my-data` (cópia em JSON) e `POST /citizen/auth/delete-account` (senha + sem pedido em andamento; guarda só nome, CPF e pedidos; conta fica inativa). Voltar depois = servidor em `PUT /admin/citizens/:id/reactivate` (nunca pelo cadastro público)
- Endereço do cidadão é sempre `{cep, logradouro, numero, complemento, bairro, cidade, uf}` (o balcão gravava em inglês e travava o Ouro)

### Scanner e leitura de documentos (2026-10-06)
- **Câmera** (`frontend/components/common/DocumentScanner.tsx`, mesmas props de antes): tela cheia no visual da biometria. Com a "câmera inteligente" ligada no painel, o modelo **DocAligner lcnet050 point** (DocsaidLab, código Apache 2.0; `public/doc-scanner/docaligner-lcnet050-point.onnx`, SHA-256 `32d18608…e220`) roda no navegador via `onnxruntime-web` 1.22 (MIT; arquivos copiados para `public/doc-scanner` por `scripts/copy-ort-wasm.js`, uma thread). Desligada: moldura fixa + botão. Recorte/endireitamento/clareamento em canvas puro (`lib/doc-scanner/geometry.ts`) — OpenCV.js e jscanify REMOVIDOS. RG/CIN/CNH: frente e verso viram um JPEG só
- ⚠️ **Licença dos pesos do DocAligner não está declarada** (treinado em MIDV-500/2019 CC BY-SA 2.5, MIDV-2020 CC BY 4.0, SmartDoc 2015, CORD, sintético): `DocScannerSettings.smartCameraEnabled` fica DESLIGADO até confirmar com os autores. NÃO quantizar o modelo (int8 quebra a precisão)
- **Leitura** (`ultrazend-doc-engine`, rede interna, porta 8000): PaddleOCR PP-OCRv5 (detector + leitor latino) via RapidOCR 3.9.2 + ZXing (QR/barras), tudo Apache 2.0, SHA-256 conferido no build. Só LÊ; o backend decide em `services/doc-reading/rules.ts` (tipo do documento, nome/CPF/nascimento x cadastro, MRZ TD1 da CIN com dígitos de controle, QR só vira link se for https *.gov.br). Testes: `__tests__/unit/doc-reading-rules.test.ts`
- Rotina a cada 2 min (`jobs/doc-reading.job.ts`) lê fotos novas/reenviadas de `citizen_documents` e `protocol_documents` em todos os municípios (cobre todo caminho de envio); `kickDocReading()` adianta após envio. Grava SÓ o resultado em `document_readings` (nunca o texto). PDF = SKIPPED. Tela do servidor: `components/admin/DocumentReadingInfo.tsx` (aviso; quem aprova é o servidor). Painel: Super-admin › Privacidade › Documentos

### Mapas: Google Maps + arquivo de endereços (2026-10-08)
- **Chaves pelo painel**: Super-admin › Mapas (Google) (`/api/platform/maps`, `services/maps/maps-settings.service.ts`, cifradas em `platform_secrets`): chave do navegador (Maps JavaScript API, restrita por site), ID do mapa (opcional), chave do servidor (Geocoding API, restrita por IP, opcional), liga/desliga. Telas perguntam `GET /api/maps/config` (`useMapsConfig`): `google` ou `osm`. Sem chave, desligado ou chave recusada (`gm_authFailure`) = OpenStreetMap/Leaflet
- Mapas do app (pedidos/Território, TV, OS de serviços públicos, widget do Registry) usam `components/maps/GoogleMarkersMap.tsx` quando é Google (bolinhas coloridas, agrupamento, janela de detalhes) — mapa novo deve seguir o mesmo padrão
- **Arquivo de endereços** (`GeoCache`, tabela da plataforma): TODA busca de endereço passa por `GeocodingService.geocodeAddress/reverseGeocode` → arquivo → Nominatim → Geoapify → Google (só com chave do servidor; também quando o grátis achou só rua/bairro/cidade — fica o melhor por `pickBest`, e ponto aproximado já guardado é melhorado uma vez, `googleTriedAt`). Grátis guardado sem prazo; Google pelo prazo do painel (`googleRetentionDays`: padrão 30 = regra do Google; 0 = para sempre — o operador escolheu assumir o risco em 2026-10-08); "não achou" 7 dias. Nunca chamar o Google direto fora desse serviço
- **Ponto confirmado por pessoa = dado próprio, sem prazo**: GPS do celular ou alfinete tocado/arrastado (`components/maps/PinConfirmMap.tsx`; tocar sem arrastar já confirma). Pedido do portal: `LocationPicker` manda `source: 'GPS'|'PIN'` → `locationType` GPS/MANUAL_PIN (sugestão não confirmada não é enviada). Casa do cidadão: `Citizen.homeLatitude/homeLongitude/homeLocationSource/homeLocationKey` (`services/citizen-home-location.service.ts`, `/api/citizen/location/home`, perfil › Endereço), vale só enquanto o endereço for o mesmo (`homeLocationKey`) e é usada antes de procurar o endereço nos pedidos. Servidor: tocar no pedido no Mapa dos pedidos confirma (`PUT /api/map/protocols/:id/location`). Todo ponto confirmado vai para o GeoCache como `confirmado` (sem prazo, prioridade na próxima busca do mesmo endereço)
- **Mapa do Google é reaproveitado** (`components/maps/google-map-pool.tsx`, `poolKey` por lugar: pedidos, tv, alfinete, os, widget): o Google cobra cada mapa CRIADO; ao sair da tela o mapa fica guardado vivo na memória e volta sem nova cobrança. A aba Território do Painel do Prefeito fica montada (escondida) depois de aberta. Mapa novo do Google = usar `PooledGoogleMap`/`GoogleMarkersMap`, nunca `<Map>` direto. NUNCA guardar/copiar imagem do mapa do Google
- Pedido com coordenada do Google tem `geocodedAt`; rotina diária 04:20 tira as mais velhas que o prazo do painel (nada se "para sempre") (voltam para a fila de 15 min) e limpa o arquivo vencido. A imagem do mapa do Google NUNCA é guardada (regra NetworkOnly no PWA)

### Registry — Motor de Dados Orientado a Metadados (plano F0–F7)
Substitui o padrão "módulo-por-serviço" (metadados hardcoded em `MANAGEMENT_CONFIGS` + `switch` em `analyzeCustomData`). **Serviço estruturado novo = `EntityType` + `FieldDefinition` no banco, NÃO um módulo em código.**
- Models: `EntityType` (code, kind PERSON_ROLE/PROPERTY/ORG/EVENT), `FieldDefinition` (flags indexable/filterable/facetable/searchable/isMetric/isPII), `EntityRecord` (data JSONB + GIN), `RecordIndex` (projeção invertida tipada dos campos indexáveis), `EntityRelation` (grafo)
- Serviços: `services/registry/*` — `registry-import` (F1: promove configs→banco), `registry-query` (F2: `POST /api/registry/query`), `registry-materialize` (F3/F5: customData→EntityRecord+índices, idempotente por sourceProtocolId, dedup por naturalKey CPF/CNPJ), `registry-dashboard` (F4), `registry-admin` (F6: CRUD + reindex)
- Scripts: `scripts/registry/import-configs.ts --apply` (popula tipos/campos), `scripts/registry/backfill.ts --apply` (materializa protocolos existentes)
- Flags (`.env` da VPS, ativar por tenant nesta ordem): `REGISTRY_READ` (off|shadow|on), `REGISTRY_DASHBOARD` (off|on), `REGISTRY_WRITE` (off|on). Default off = comportamento legado byte a byte
- Gancho de aprovação: `materializeOnApproval()` em `approveProtocol` (protocol-module.service.ts), NÃO-FATAL — nunca derruba a aprovação
- `MANAGEMENT_CONFIGS` e o `switch` de `analyzeCustomData` estão DEPRECADOS (fallback enquanto flags off); remover só após F3–F5 estáveis em todos os tenants
- Cliente frontend: `frontend/src/services/registry.service.ts`

### Backend
- **Sessão do painel se renova em uso** (`services/admin-session.service.ts`): cookie de 1 h renovado pelo `adminAuthMiddleware` e pelo `/admin/auth/me` após 10 min; limite de 24 h desde o login (`loginAt` no JWT). O `AdminAuthContext` chama `/me` a cada 10 min com a tela aberta (TV não cai)
- ⚠️ `backend/src/shared/` é CÓPIA: no build o Docker sobrescreve com `digiurban/shared/` (fonte de verdade). Tipos/constantes compartilhados se alteram em `digiurban/shared/` e copiam para `backend/src/shared/` — senão compila aqui e quebra no CI
- `concludedAt` para tempo de conclusão (NÃO `updatedAt`)
- `createdById` (não `createdBy`)
- Prisma `groupBy` não suporta nested relations — usar `_count` ou aggregation
- CSV export precisa de UTF-8 BOM (`\uFEFF`) para Excel
- `ProtocolEvaluationSimplified` não tem `evaluatedBy` — só `protocolId`, `rating`, `comment`, `wouldRecommend`
- **Pendências**: toda forma de fechar (resolver, cancelar, expirar, apagar) passa por `workflowOrchestrator.onPendingClosed()` — destrava o protocolo e retoma o prazo. Encerrar o protocolo (CONCLUIDO/CANCELADO) fecha as pendências abertas no motor de status; entrar em PROGRESSO retoma o SLA pausado (`resumePausedSla`). Regras puras (prazo em Brasília, lembrete uma vez por tipo) em `services/pending-rules.ts`; resposta do cidadão (portal E bot) em `services/pending-response.service.ts`
- **Documentos**: reenvio guarda o envio anterior em `ProtocolDocumentVersion` (o registro em `protocol_documents` é sempre o atual; `previousDocId` não é mais usado). Aprovar a resposta de uma pendência aprova os arquivos enviados; pedir novo ajuste os recusa. Rotas de pendência/documento do servidor checam `assertProtocolAccess` e se o item é do protocolo do endereço. Smoke: `npm run smoke:pendings` (requer banco)

### Frontend
- Visual DigiUrban Glass (Liquid Glass): classes `lg-*` em `app/liquid-glass.css`, componentes em `components/liquid-glass/`; vidro SÓ na navegação; tema via `useLgThemeScope()` no layout persistente do painel + `THEME_BOOT_SCRIPT`; modo escuro das cores fixas do Tailwind vem do tradutor no fim do CSS (não precisa de `dark:` por tela). Espaçamento da Inter só fora da Apple via `html:not([data-font="sf"])` (marcado pelo boot script). Fonte SF/SF Symbols da Apple NÃO podem ser embutidas
- Barra inferior do servidor é um Dock personalizável (`components/admin/navigation/AdminDock.tsx` + `PinnedShortcuts.tsx`): atalhos por usuário em `user_preferences.pinnedShortcuts` (GET/PUT `/api/admin/preferences/pinned`); a lista salva é SEMPRE cruzada com o menu visível (permissão/plano) — tela nova no menu já pode ser fixada, sem código extra
- TipTap requer custom Node extensions para preservar tags HTML (Node.create() com parseHTML/renderHTML)
- `enableInputRules: false` e `enablePasteRules: false` obrigatórios no TipTap
- `addGlobalAttributes()` para style/class em todos os node types
- `<iframe srcDoc>` > `dangerouslySetInnerHTML` para preview HTML
- Nunca expor editor de código para usuários — sempre WYSIWYG visual
- Páginas dedicadas > modais para views complexas (URLs compartilháveis, navegação, code splitting)
- Evitar `window.location.reload()` — usar CustomEvent

### Messages Server
- Motor único: NÃO criar fluxos JSON novos nem voltar a "redirecionar" para o motor antigo — função nova do bot = etapa no `CitizenSelfService` ou no orquestrador
- Configuração/textos do bot vêm do painel (`/admin/digibot`), nunca hardcoded por município
- Não existe WhatsApp/Telegram no produto (sobras removidas em 2026-10-02); o canal de aviso "chat" (antigo nome "whatsapp") manda mensagem no chat do app
- ConversationService no FlowEngineService NÃO é usado diretamente
- Socket.IO paths são DIFERENTES: admin `:3001/api/socket` vs messages `:9001` default

### Deploy
- Frontend env vars com `NEXT_PUBLIC_` são definidas em BUILD TIME no Dockerfile
- `npm install --legacy-peer-deps` é necessário em todos os serviços
- Playwright browsers precisam ser instalados no container runner
- Nginx faz proxy de `/api` → backend:3001 e `/messages-api` → messages:9001
