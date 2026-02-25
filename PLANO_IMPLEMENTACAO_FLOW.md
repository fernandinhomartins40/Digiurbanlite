# Plano de Implementação — Módulo `digiurban-flow`

> **Motor de Processos Internos** — Gestão de tramitação administrativa interna municipal
> Data: 2026-02-25 | Status: Em implementação

---

## Visão Geral

Módulo separado para gestão de processos administrativos internos (memorandos, ofícios, processos administrativos, contratos), coexistindo com o motor de protocolos ao cidadão já existente. Segue o padrão arquitetural do `ultrazend-messages-server` e `digiurban-prices` — container Docker independente integrado via proxy no backend principal.

**O cidadão NUNCA vê os processos internos.** Apenas servidores públicos autenticados.

---

## Stack Técnica

| Componente | Tecnologia | Justificativa |
|------------|-----------|---------------|
| API | Node.js + TypeScript + Express 5 | Consistência com o ecossistema DigiUrban |
| Banco | PostgreSQL (schema compartilhado, Prisma isolado) | Reutiliza o PostgreSQL existente |
| Fila | BullMQ + Redis | Reutiliza o Redis existente |
| PDF | **Playwright (Chromium)** | **Mesmo sistema do `document-generator.service.ts`** |
| Template PDF | **Handlebars** | **Mesmo engine de templates do backend** |
| ORM | Prisma 6.19 | Consistência com o projeto |
| Auth | JWT (mesmo secret) + Service Token | Padrão do `ultrazend-messages-server` |
| Logger | Winston | Padrão do projeto |
| Validação | Zod | Padrão do projeto |

---

## Estrutura de Diretórios

```
digiurban-flow/
├── package.json
├── tsconfig.json
├── tsconfig.prisma.json
├── Dockerfile
├── docker-entrypoint.sh
├── prisma/
│   ├── schema.prisma              # 8 models do módulo
│   └── migrations/
├── templates/
│   ├── despacho.html              # Template Handlebars para despacho
│   ├── memorando.html             # Template Handlebars para memorando
│   ├── oficio.html                # Template Handlebars para ofício
│   └── capa-processo.html         # Capa de processo
├── src/
│   ├── index.ts                   # Entry point (Express + BullMQ)
│   ├── config/
│   │   └── config.ts              # Env vars centralizadas
│   ├── utils/
│   │   ├── logger.ts              # Winston logger
│   │   └── prisma.ts              # Prisma client singleton
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT + Service Token auth
│   │   └── rate-limit.middleware.ts
│   ├── services/
│   │   ├── process.service.ts      # CRUD de processos internos
│   │   ├── dispatch.service.ts     # Tramitação/despacho entre setores
│   │   ├── workflow.service.ts     # Motor de workflows (steps, transições)
│   │   ├── document.service.ts     # Geração PDF via Playwright (mesmo padrão do backend)
│   │   ├── numbering.service.ts    # Numeração automática (INT-2026-00001)
│   │   └── analytics.service.ts    # KPIs e indicadores
│   ├── workers/
│   │   ├── sla-checker.worker.ts   # BullMQ — verifica prazos vencidos
│   │   └── notify.worker.ts        # BullMQ — envia alertas
│   ├── routes/
│   │   ├── process.routes.ts       # CRUD processos
│   │   ├── dispatch.routes.ts      # Tramitação
│   │   ├── workflow.routes.ts      # Definições e instâncias de fluxo
│   │   ├── document.routes.ts      # Geração de documentos PDF
│   │   ├── inbox.routes.ts         # Caixa de entrada por setor
│   │   ├── analytics.routes.ts     # Dashboard e KPIs
│   │   └── health.routes.ts        # Health check
│   └── integration/
│       └── digiurban.integration.ts # Comunicação com backend principal
```

---

## Modelagem de Dados (Prisma)

### 8 Models

```prisma
InternalProcessType     — Tipos de processo (Memorando, Ofício, etc)
InternalProcess         — Protocolo interno (INT-2026-00001)
InternalProcessHistory  — Histórico de movimentações
ProcessDispatch         — Despachos entre setores
ProcessDocument         — Documentos gerados/anexados
WorkflowTemplate        — Templates de fluxo (steps configurados)
WorkflowInstance        — Instância de fluxo por processo
WorkflowStepHistory     — Histórico de etapas
```

---

## Geração de PDF — Playwright (mesmo padrão do backend)

O módulo usa **exatamente o mesmo approach** do `document-generator.service.ts`:

1. Template HTML compilado com **Handlebars**
2. CSS customizado injetado no `<head>`
3. **Playwright Chromium** lança browser headless
4. `page.setContent(fullHtml, { waitUntil: 'networkidle' })`
5. `page.pdf({ format: 'A4', margin, printBackground: true })`
6. Arquivo salvo em `/app/uploads/flow/{processId}/`
7. Hash SHA-256 calculado para integridade

---

## Rotas da API (prefixo `/api/v1`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health` | Health check |
| GET | `/ready` | Readiness check |
| **Processos** | | |
| POST | `/processes` | Criar processo interno |
| GET | `/processes` | Listar processos (filtros: status, tipo, setor) |
| GET | `/processes/:id` | Detalhes do processo |
| PATCH | `/processes/:id` | Atualizar processo |
| DELETE | `/processes/:id` | Cancelar processo (soft delete) |
| **Tramitação** | | |
| POST | `/processes/:id/dispatch` | Despachar para outro setor |
| POST | `/processes/:id/return` | Devolver ao setor anterior |
| POST | `/processes/:id/reassign` | Redistribuir dentro do setor |
| POST | `/processes/:id/conclude` | Concluir processo |
| POST | `/processes/:id/archive` | Arquivar processo |
| **Caixa de Entrada** | | |
| GET | `/inbox` | Processos pendentes do setor/usuário |
| GET | `/inbox/count` | Contagem por status |
| **Documentos** | | |
| POST | `/processes/:id/documents/generate` | Gerar PDF (Playwright) |
| GET | `/processes/:id/documents` | Listar documentos |
| POST | `/processes/:id/documents/upload` | Anexar documento |
| **Workflows** | | |
| POST | `/workflow-templates` | Criar template de fluxo |
| GET | `/workflow-templates` | Listar templates |
| GET | `/workflow-templates/:id` | Detalhes do template |
| PUT | `/workflow-templates/:id` | Atualizar template |
| **Tipos de Processo** | | |
| POST | `/process-types` | Criar tipo |
| GET | `/process-types` | Listar tipos |
| PUT | `/process-types/:id` | Atualizar tipo |
| **Analytics** | | |
| GET | `/analytics/dashboard` | Dashboard principal |
| GET | `/analytics/sla` | Processos com SLA vencido |
| GET | `/analytics/bottlenecks` | Gargalos por setor |
| GET | `/analytics/export/csv` | Exportar CSV |

---

## Docker

- **Porta:** 9003 (9001=messages, 9002=prices, 9003=flow)
- **Container:** `digiurban-flow`
- **Health:** `GET /api/v1/health`
- **Deps:** PostgreSQL + Redis (healthy)

---

## Integração com Backend Principal

- Backend registra `/api/flow` via `loadRoute()` em `index.ts`
- Proxy segue mesmo padrão do `prices-proxy.routes.ts`
- Auth: `adminAuthMiddleware` + header `x-digiurban-flow-token`

---

## Fases de Execução

| Fase | Entrega |
|------|---------|
| 1 | Scaffold: package.json, tsconfig, Dockerfile, Prisma schema, config, logger, prisma client |
| 2 | Services: process, dispatch, workflow, numbering, analytics, document (PDF) |
| 3 | Routes: todas as rotas REST da API |
| 4 | Workers: BullMQ SLA checker + notificações |
| 5 | Templates Handlebars para PDF (despacho, memorando, ofício, capa) |
| 6 | Docker: Dockerfile + entrypoint + docker-compose |
| 7 | Backend proxy: flow-proxy.routes.ts + registro no index.ts |
| 8 | Frontend: página admin /admin/processos-internos |
