# DigiUrban - Plataforma de Gestão Municipal Digital

Plataforma completa de governo digital para gestão municipal, integrando atendimento ao cidadão, protocolos, serviços públicos, saúde, educação, assistência social e comunicação em tempo real.

## Arquitetura

O sistema é composto por **4 serviços** orquestrados via Docker Compose:

```
┌─────────────────────────────────────────────────────────┐
│                    Nginx (porta 80)                     │
│              Reverse Proxy + Load Balancer              │
├──────────┬──────────────┬───────────────────────────────┤
│ Frontend │   Backend    │   Messages Server             │
│ Next.js  │   Express    │   Socket.IO + Bot Engine      │
│ :3000    │   :3001      │   :9001                       │
├──────────┴──────────────┴───────────────────────────────┤
│               PostgreSQL :5432                          │
│               Redis :6379                               │
│               Ollama :11434 (IA Local)                  │
└─────────────────────────────────────────────────────────┘
│               SMTP Server                               │
│               :25 (MX) + :587 (Submission)              │
└─────────────────────────────────────────────────────────┘
```

| Serviço | Tecnologia | Porta | Descrição |
|---------|-----------|-------|-----------|
| **digiurban** | Next.js 14 + Express 5 + Nginx | 3060→80 | Container único (frontend + backend + proxy) |
| **ultrazend-messages** | Express + Socket.IO + Redis | 9001 | Mensagens em tempo real + ChatBot |
| **ultrazend-smtp** | smtp-server + Nodemailer | 25, 587 | Servidor SMTP com entrega MX direta + DKIM |
| **postgres** | PostgreSQL 15 | 5432 | Banco de dados principal |
| **redis** | Redis 7 | 6379 | Cache + WebSocket adapter |
| **ollama** | Ollama | 11434 | IA local (LLM) para DigiBot |

## Stack Tecnológica

### Backend (`digiurban/backend/`)
- **Runtime:** Node.js 20 + TypeScript
- **Framework:** Express 5.1
- **ORM:** Prisma 6.19 (PostgreSQL) — **213 models**
- **Auth:** JWT em cookies HTTP-only (`digiurban_admin_token`, `digiurban_citizen_token`)
- **WebSocket:** Socket.IO 4.8
- **Filas:** BullMQ + Redis
- **Email:** Nodemailer 7
- **IA:** OpenAI API + Ollama (local)
- **PDF:** PDF-lib + Playwright (Chromium) para geração
- **Validação:** Zod 4 + Joi
- **Logs:** Winston com rotação diária

### Frontend (`digiurban/frontend/`)
- **Framework:** Next.js 14 (App Router)
- **UI:** React 18 + Tailwind CSS 3.4 + shadcn/ui (Radix UI)
- **State:** TanStack React Query 5 (principal) + SWR (secundário)
- **Forms:** react-hook-form + Zod
- **Real-time:** Socket.IO Client
- **Gráficos:** Recharts
- **Mapas:** Leaflet + react-leaflet
- **Editor:** TipTap (WYSIWYG)
- **PDF:** pdfjs-dist + react-pdf
- **PWA:** @ducanh2912/next-pwa (offline-first)

### Messages Server (`ultrazend-messages-server/`)
- **Framework:** Express 5 + Socket.IO 4.8
- **Bot Engine:** Motor de fluxos n8n-style (9 tipos de nodos)
- **Database:** Prisma 6.19 (PostgreSQL compartilhado)
- **Adapter:** Socket.IO Redis adapter (escalável)
- **Integrações:** WhatsApp Cloud API, Telegram (preparado)

### SMTP Server (`ultrazend-smtp-server/`)
- **SMTP:** smtp-server 3.14 + Nodemailer
- **Entrega:** MX direto via DNS (sem dependência externa)
- **Segurança:** DKIM automático (RSA 2048) + SPF + DMARC
- **Database:** SQLite ou PostgreSQL via Prisma

### Face Server (`ultrazend-face-server/`)
- **Framework:** Express 5
- **Database:** Prisma 6.19 (PostgreSQL compartilhado)
- **Função:** reconhecimento facial centralizado para o ecossistema Digiurban
- **Integração:** Digiurban Admin consome a API HTTP e mantém a operação do módulo escolar

## Pré-requisitos

- **Node.js** >= 20.0.0
- **PostgreSQL** >= 15
- **Redis** >= 7
- **Docker** + **Docker Compose** (para deploy)

## Instalação Local (Desenvolvimento)

### 1. Clonar o repositório
```bash
git clone <repo-url>
cd Digiurbanlite
```

### 2. Backend
```bash
cd digiurban/backend
cp .env.example .env  # Configurar variáveis
npm install --legacy-peer-deps
npx prisma generate
npx prisma migrate dev
npm run db:seed        # Seed inicial + super admin
npm run dev            # Inicia em localhost:3001
```

### 3. Frontend
```bash
cd digiurban/frontend
npm install --legacy-peer-deps
npm run dev            # Inicia em localhost:3000
```

### 4. Messages Server
```bash
cd ultrazend-messages-server
cp .env.example .env
npm install
npx prisma generate
npm run dev            # Inicia em localhost:9001
```

### 5. SMTP Server (opcional)
```bash
cd ultrazend-smtp-server
npm install
npm run dev
```

### 6. Face Server
```bash
cd ultrazend-face-server
npm install
npx prisma generate
npm run dev            # Inicia em localhost:9006
```

## Deploy (Docker Compose)

```bash
# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com credenciais de produção

# Build e iniciar todos os serviços
BUILD_TIMESTAMP=$(date +%s) docker compose -f docker-compose.vps.yml up -d --build

# Verificar status
docker compose -f docker-compose.vps.yml ps
docker compose -f docker-compose.vps.yml logs -f digiurban
```

### Variáveis de Ambiente Essenciais

```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/digiurban

# JWT (OBRIGATÓRIO mudar em produção)
JWT_SECRET=sua-chave-secreta-muito-longa

# URLs
FRONTEND_URL=https://seudominio.com.br
CORS_ORIGIN=https://seudominio.com.br

# IA (opcional)
USE_OLLAMA=true
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=digibot-qwen2.5

# Push Notifications (opcional)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

## Estrutura do Projeto

```
Digiurbanlite/
├── digiurban/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/           # Configurações (logger, status, security)
│   │   │   ├── middleware/       # Auth, rate-limit, validation, upload
│   │   │   ├── routes/           # 100+ arquivos de rotas
│   │   │   ├── services/         # 95+ serviços de negócio
│   │   │   ├── data/             # Dados estáticos (seeds JSON)
│   │   │   └── seeds/            # Scripts de seed
│   │   ├── prisma/
│   │   │   └── schema.prisma     # 213 models
│   │   └── templates/            # Templates HTML para documentos
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── app/              # Next.js App Router (220+ páginas)
│   │   │   ├── components/       # Componentes React organizados por domínio
│   │   │   ├── hooks/            # 47 hooks customizados
│   │   │   └── lib/              # Utilitários, API clients, services
│   │   └── public/               # Assets estáticos + PWA manifest
│   └── docker/                   # Configs Nginx, Supervisord, SQL scripts
├── ultrazend-messages-server/
│   ├── src/
│   │   ├── bot/                  # Motor de fluxos (FlowEngine)
│   │   │   └── flow/flows/       # 9 fluxos JSON pré-configurados
│   │   ├── delivery/             # Conversas, canais, WhatsApp
│   │   └── server/               # Express + WebSocket
│   └── prisma/
├── ultrazend-face-server/
│   ├── src/
│   │   ├── integrations/         # Integração interna com Digiurban
│   │   ├── routes/               # API HTTP do reconhecimento facial
│   │   ├── services/             # Core do reconhecimento e segurança escolar
│   │   └── server/               # Express server
│   └── prisma/
├── ultrazend-smtp-server/
│   ├── src/
│   │   ├── server/               # SMTP servers (MX + Submission)
│   │   ├── delivery/             # MX delivery direto
│   │   └── security/             # DKIM manager
│   └── prisma/
├── docker-compose.vps.yml        # Orquestração de todos os serviços
└── Dockerfile                    # Multi-stage build (backend + frontend + nginx)
```

## Módulos Funcionais

### Atendimento ao Cidadão
- **Portal do Cidadão** — Login, perfil, família, documentos pessoais
- **Protocolos** — Abertura, acompanhamento, SLA, avaliação
- **Serviços** — Catálogo dinâmico com formulários JSON Schema
- **ChatBot** — Fluxos conversacionais (menu, consulta, solicitação, avaliação)
- **Mensagens** — Chat P2P cidadão ↔ servidor em tempo real

### Gestão Administrativa
- **Dashboard** — Métricas, KPIs, tendências, benchmarks
- **Secretarias** — 21 departamentos com módulos especializados
- **Organograma** — Unidades, cargos, funções, equipes, hierarquias
- **Relatórios** — Templates pré-configurados com export PDF/Excel/CSV
- **Workflows** — Automação de fluxos de trabalho

### Saúde (3 Apps Integrados)
- **Atendimento** — Fila, escuta inicial, triagem, consulta médica, prontuário
- **Farmácia** — Estoque, dispensação, lotes, transferências, alertas
- **TFD** — Solicitações, regulação, viagens, frota, prestação de contas

### Educação
- **Matrículas** — Inscrição, matrícula, turmas
- **Transporte Escolar** — Veículos, rotas, alunos
- **Cursos** — Cursos profissionalizantes

### Assistência Social
- **CadÚnico** — Famílias, membros, composição
- **Programas Sociais** — Inscrições, acompanhamento, pagamentos
- **CRAS** — Unidades de referência

### Comunicação
- **Email** — Servidor SMTP próprio com DKIM/SPF
- **Notificações** — Push (Web Push), SSE, email
- **Canais** — Broadcasts para comunicados oficiais

### Segurança
- **Certificados Digitais** — Emissão, revogação (CRL)
- **Assinatura Digital** — PDF com assinatura automática via templates
- **Auditoria** — Log completo de ações

## Scripts Úteis

### Backend
```bash
npm run dev              # Desenvolvimento com hot-reload
npm run build            # Compilar TypeScript
npm run db:migrate       # Executar migrations
npm run db:seed          # Seed inicial
npm run db:studio        # Prisma Studio (GUI)
npm run type-check       # Verificar tipos
npm run diagnose         # Diagnóstico de rotas
```

### Frontend
```bash
npm run dev              # Desenvolvimento
npm run build            # Build de produção
npm run type-check       # Verificar tipos
npm run lint             # ESLint
```

## Autenticação

O sistema usa JWT em cookies HTTP-only:

| Tipo | Cookie | Expiração | Roles |
|------|--------|-----------|-------|
| Admin | `digiurban_admin_token` | 8h | USER, COORDINATOR, MANAGER, ADMIN, SUPER_ADMIN |
| Cidadão | `digiurban_citizen_token` | 30d | CITIZEN |

Fallback via header `Authorization: Bearer <token>` para APIs externas.

## Licença

Proprietário - DigiUrban. Todos os direitos reservados.
