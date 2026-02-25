# Plano de Implementação — Módulo `digiurban-prices`

> **"Google de Licitações"** — Buscador de Preços e Contratos Públicos com análise automática
> Data: 2026-02-25 | Status: Em implementação

---

## Visão Geral

Módulo separado e modular para busca de preços praticados em contratos públicos, integrado ao DigiUrban como container independente. Espelha o padrão do `ultrazend-messages-server`.

---

## Stack Técnica

| Componente | Tecnologia | Justificativa |
|------------|-----------|---------------|
| API | Node.js + TypeScript + Express | Consistência com o ecossistema DigiUrban |
| Banco | PostgreSQL (schema isolado) | Reutiliza o PostgreSQL existente |
| Busca | OpenSearch | Full-text + filtros + agregações estatísticas |
| Fila | BullMQ + Redis | Reutiliza o Redis existente |
| PDF | Playwright (Chromium) | **Mesmo sistema do gerador de documentos dos protocolos** |
| ORM | Prisma | Consistência com o projeto |
| Auth | API Key (X-Digiurban-Key) | Simples e seguro para comunicação interna |

---

## Estrutura de Diretórios

```
digiurban-prices/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── search.routes.ts         # POST /search, POST /search/batch
│   │   │   ├── reports.routes.ts        # POST /reports/price-research
│   │   │   ├── audits.routes.ts         # GET /audits
│   │   │   ├── ingest.routes.ts         # POST /ingest/run, GET /ingest/status
│   │   │   └── health.routes.ts         # GET /health, GET /ready
│   │   └── middlewares/
│   │       ├── auth.middleware.ts        # API key validation
│   │       └── rate-limit.middleware.ts  # Rate limiting
│   ├── services/
│   │   ├── search.service.ts            # Busca + estatísticas
│   │   ├── batch-search.service.ts      # Busca em lote (CSV/XLSX)
│   │   ├── statistics.service.ts        # Média, mediana, IQR, outliers
│   │   ├── report.service.ts            # Geração de relatório PDF/HTML
│   │   └── audit.service.ts             # Registro de auditorias
│   ├── connectors/
│   │   └── pncp/
│   │       ├── pncp.client.ts           # HTTP client com paginação + retry
│   │       ├── pncp.types.ts            # Tipagens da API PNCP
│   │       └── pncp.cache.ts            # Cache de respostas
│   ├── ingest/
│   │   ├── ingest.worker.ts             # Worker BullMQ
│   │   ├── ingest.job.ts                # Job definition
│   │   ├── normalizer.ts                # Normalização de texto + dados
│   │   └── scheduler.ts                 # Agendamento diário
│   ├── search_index/
│   │   ├── opensearch.client.ts         # Cliente OpenSearch
│   │   ├── opensearch.mapping.ts        # Mapeamento do índice
│   │   └── opensearch.queries.ts        # Queries + agregações
│   ├── models/
│   │   └── prisma.ts                    # Prisma client
│   ├── repositories/
│   │   ├── line-items.repository.ts     # CRUD line_items
│   │   ├── contracts.repository.ts      # CRUD contracts
│   │   └── audits.repository.ts         # CRUD audits
│   ├── config/
│   │   └── config.ts                    # Variáveis de ambiente
│   ├── utils/
│   │   └── logger.ts                    # Winston logger
│   └── index.ts                         # Entry point
├── prisma/
│   ├── schema.prisma                    # Schema do módulo
│   └── seed.ts                          # Dados fake para dev
├── tests/
│   ├── unit/
│   │   ├── normalizer.test.ts
│   │   ├── statistics.test.ts
│   │   └── pncp.client.test.ts
│   └── integration/
│       ├── search.test.ts
│       └── ingest.test.ts
├── templates/
│   └── price-report.html                # Template HTML do relatório
├── Dockerfile
├── docker-compose.yml                   # Dev local
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Banco de Dados (Prisma Schema)

```
organizations     — Órgãos públicos (CNPJ, nome, UF, esfera)
suppliers         — Fornecedores (CNPJ, nome)
contracts         — Contratos/processos
line_items        — Itens/serviços (coração do sistema)
raw_payloads      — JSON bruto do PNCP para auditoria
ingest_runs       — Histórico de execuções de ingestão
search_audits     — Registro de consultas
```

---

## Endpoints da API (`/api/v1`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/health` | Liveness check |
| `GET` | `/ready` | Readiness check (DB + OpenSearch) |
| `POST` | `/search` | Busca por item (texto livre + filtros) |
| `POST` | `/search/batch` | Busca por lista (multipart CSV/XLSX ou JSON) |
| `POST` | `/reports/price-research` | Gera relatório PDF ou HTML |
| `GET` | `/audits` | Lista auditorias de consultas |
| `POST` | `/ingest/run` | Dispara ingestão manual (protegido) |
| `GET` | `/ingest/status` | Status da última ingestão |

---

## Containers adicionados ao docker-compose.vps.yml

```yaml
digiurban-prices:     # API do módulo (porta 9002)
digiurban-opensearch: # OpenSearch (porta 9200)
```

> Redis e PostgreSQL são reutilizados.

---

## Integração com DigiUrban

### Backend
- **Proxy route:** `digiurban/backend/src/routes/prices-proxy.routes.ts`
- Registrado em `index.ts` como `/api/prices`
- Repassa requests do frontend para o módulo

### Frontend
- **Client:** `digiurban/frontend/lib/prices-client.ts`
- **Página:** `/admin/pesquisa-precos` com busca, resultados e relatório

---

## Geração de PDF

Utiliza **Playwright + Chromium** (mesma implementação dos documentos de protocolo):
- Template HTML com Handlebars
- `page.pdf()` com formato A4
- Inclui: tabela de amostra, estatísticas, gráfico SVG, metodologia, fontes

---

## Variáveis de Ambiente

```env
PORT=9002
DATABASE_URL=postgresql://...@postgres:5432/digiurban
OPENSEARCH_URL=http://digiurban-opensearch:9200
REDIS_URL=redis://redis:6379
DIGIURBAN_API_KEY=<chave-compartilhada>
PNCP_BASE_URL=https://pncp.gov.br/api/consulta/v1
INGEST_SINCE_DAYS=365
OUTLIER_METHOD=IQR
OUTLIER_IQR_K=1.5
LOG_LEVEL=info
PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
NODE_ENV=production
```

---

## Fases de Implementação

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Estrutura base (package.json, Dockerfile, Express skeleton) | ✅ Concluído |
| 2 | Modelos Prisma + banco | ✅ Concluído |
| 3 | Connector PNCP | ✅ Concluído |
| 4 | ETL/Ingestão Worker | ✅ Concluído |
| 5 | Busca OpenSearch | ✅ Concluído |
| 6 | API REST completa | ✅ Concluído |
| 7 | Relatório PDF/HTML com Playwright | ✅ Concluído |
| 8 | Segurança (auth, rate limit) | ✅ Concluído |
| 9 | Integração DigiUrban (client + proxy + frontend) | ✅ Concluído |
| 10 | Testes automatizados | ✅ Concluído |
| 11 | Docker Compose VPS | ✅ Concluído |
| 12 | README + OpenAPI | ✅ Concluído |

---

## Critérios de Pronto (DoD)

- [ ] `docker compose up` sobe tudo e `/health` responde OK
- [ ] Ingestão popula DB e OpenSearch com dados do PNCP (ou seed fake)
- [ ] Busca retorna resultados com estatísticas e explicação da metodologia
- [ ] Batch search funciona com CSV simples
- [ ] Relatório PDF/HTML é gerado com Playwright
- [ ] Auditoria registra todas as consultas
- [ ] Integração frontend mostra resultados e permite exportar relatório
- [ ] Testes passam (`npm test`)
