# digiurban-prices

> Módulo de Pesquisa de Preços e Cotações Públicas — DigiUrban
> "Google de Licitações": buscador inteligente de preços praticados em contratos públicos com análise automática e geração de relatório PDF.

---

## Visão Geral

Este módulo é um **container separado e isolado** do DigiUrban, seguindo o mesmo padrão do `ultrazend-messages-server`. Ele fornece:

- **Busca por item** (texto livre, código CATMAT/CATSER)
- **Busca em lote** (upload CSV/XLSX ou JSON array)
- **Estatísticas automáticas** (média, mediana, quartis, remoção de outliers via IQR)
- **Relatório PDF/HTML** gerado com Playwright (mesmo sistema dos documentos de protocolo DigiUrban)
- **Ingestão automática** diária do PNCP (Portal Nacional de Contratações Públicas)
- **Auditoria de consultas** para conformidade com Lei 14.133/2021

---

## Arquitetura

```
DigiUrban Backend (/api/prices)
    ↓ proxy HTTP + API key
digiurban-prices API (porta 9002)
    ├── OpenSearch (busca full-text + estatísticas)
    ├── PostgreSQL (dados normalizados + auditorias)
    ├── Redis + BullMQ (fila de ingestão)
    └── PNCP (connector HTTP externo)
```

---

## Rodar localmente

```bash
cd digiurban-prices

# 1. Copiar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 2. Subir dependências (PostgreSQL, OpenSearch, Redis)
docker compose up -d postgres opensearch redis

# 3. Instalar dependências
npm install --legacy-peer-deps

# 4. Gerar Prisma Client
npm run db:generate

# 5. Rodar migrações
npm run db:migrate

# 6. Popular dados fake (dev)
npm run db:seed

# 7. Iniciar servidor
npm run dev
# → API rodando em http://localhost:9002/api/v1
```

### Subir tudo com Docker

```bash
cd digiurban-prices
docker compose up -d
# → API: http://localhost:9002/api/v1/health
```

---

## Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/v1/health` | Liveness check (sem auth) |
| `GET` | `/api/v1/ready` | Readiness check: DB + OpenSearch |
| `POST` | `/api/v1/search` | Busca por item |
| `POST` | `/api/v1/search/batch` | Busca por lista (multipart ou JSON) |
| `POST` | `/api/v1/reports/price-research` | Gera relatório PDF/HTML |
| `GET` | `/api/v1/audits` | Lista auditorias de consultas |
| `POST` | `/api/v1/ingest/run` | Dispara ingestão manual |
| `GET` | `/api/v1/ingest/status` | Status da última ingestão |

### Autenticação

Todas as rotas (exceto `/health` e `/ready`) requerem o header:

```
x-digiurban-key: <DIGIURBAN_API_KEY>
```

---

## Exemplos de Request/Response

### POST /api/v1/search

```json
// Request
{
  "query": "computador desktop intel i5 8gb",
  "filters": {
    "uf": "SP"
  },
  "period": {
    "from": "2024-01-01",
    "to": "2025-01-01"
  },
  "page": 1,
  "page_size": 20
}

// Response
{
  "query": "computador desktop intel i5 8gb",
  "normalizedQuery": "computador desktop intel i5 8gb",
  "total": 47,
  "items": [
    {
      "id": "...",
      "description": "Computador Desktop Intel Core i5 8GB RAM 256GB SSD",
      "unitPrice": 2850.00,
      "quantity": 10,
      "contractDate": "2024-11-15",
      "uf": "SP",
      "organizationName": "Prefeitura Municipal de Exemplo"
    }
  ],
  "statistics": {
    "count": 44,
    "mean": 2915.50,
    "median": 2890.00,
    "min": 2650.00,
    "max": 3200.00,
    "q1": 2800.00,
    "q3": 3050.00,
    "excludedCount": 3,
    "methodology": "Método IQR (k=1.5)..."
  },
  "explanation": {
    "methodology": "...",
    "period": { "from": "2024-01-01", "to": "2025-01-01" },
    "algorithmVersion": "1.0"
  }
}
```

### POST /api/v1/search/batch (JSON)

```json
{
  "items": [
    { "item": "computador desktop i5", "quantity": 10 },
    { "item": "papel A4 resma", "quantity": 100 },
    { "item": "impressora multifuncional laser" }
  ]
}
```

### POST /api/v1/reports/price-research

```json
{
  "query": "notebook corporativo i5 16GB",
  "format": "pdf",
  "period": { "from": "2024-01-01" }
}
```

Retorna: arquivo PDF/HTML para download.

---

## Ingestão de Dados

### Automática
Configurar variável `INGEST_CRON` (padrão: `0 2 * * *` = 2h da manhã diariamente).

### Manual via API

```bash
curl -X POST http://localhost:9002/api/v1/ingest/run \
  -H "x-digiurban-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"since_days": 30}'
```

### Verificar status

```bash
curl http://localhost:9002/api/v1/ingest/status \
  -H "x-digiurban-key: your-api-key"
```

---

## Integração com DigiUrban

O módulo já está integrado ao DigiUrban:

1. **Backend proxy:** `digiurban/backend/src/routes/prices-proxy.routes.ts`
   - Registrado em `index.ts` como `/api/prices`
   - Autentica com API key + repassa usuário logado

2. **Frontend client:** `digiurban/frontend/lib/prices-client.ts`
   - `pricesClient.search(params)` — busca
   - `pricesClient.searchBatch(items)` — lote
   - `pricesClient.downloadReport(params)` — relatório

3. **Página admin:** `/admin/pesquisa-precos`
   - Interface completa com filtros, estatísticas, tabela de resultados
   - Botões de exportação PDF/HTML

---

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `9002` | Porta do servidor |
| `DATABASE_URL` | — | PostgreSQL (mesmo do DigiUrban) |
| `OPENSEARCH_URL` | `http://localhost:9200` | OpenSearch |
| `REDIS_URL` | `redis://localhost:6379` | Redis (mesmo do DigiUrban) |
| `DIGIURBAN_API_KEY` | — | Chave de autenticação (igual no backend) |
| `PNCP_BASE_URL` | `https://pncp.gov.br/api/consulta/v1` | API PNCP |
| `INGEST_SINCE_DAYS` | `365` | Dias atrás para ingestão |
| `INGEST_CRON` | `0 2 * * *` | Expressão cron para ingestão automática |
| `OUTLIER_METHOD` | `IQR` | Método de remoção de outliers (IQR ou ZSCORE) |
| `OUTLIER_IQR_K` | `1.5` | Multiplicador k do IQR |

---

## Testes

```bash
npm test              # Todos os testes
npm run test:unit     # Apenas testes unitários
npm run test:integration  # Apenas testes de integração
```

---

## Produção

O serviço é adicionado automaticamente ao `docker-compose.vps.yml`:

```bash
BUILD_TIMESTAMP=$(date +%s) docker compose -f docker-compose.vps.yml up -d --build digiurban-prices
```

Para subir o stack completo com o novo módulo:

```bash
BUILD_TIMESTAMP=$(date +%s) docker compose -f docker-compose.vps.yml up -d --build
```

---

## Conformidade Legal

Os relatórios gerados são compatíveis com os requisitos de pesquisa de preços da **Lei 14.133/2021** (Nova Lei de Licitações):

- Fonte: PNCP (exigido pela lei)
- Metodologia documentada e transparente
- ID de auditoria em cada relatório
- Período configurável (padrão: últimos 12 meses)
- Remoção documentada de outliers

---

## Stack

| Componente | Tecnologia |
|------------|-----------|
| API | Node.js 20 + TypeScript + Express 5 |
| Banco | PostgreSQL 15 + Prisma 6 |
| Busca | OpenSearch 2.17 |
| Fila | BullMQ + Redis |
| PDF | **Playwright + Chromium** (mesmo do DigiUrban) |
| Testes | Jest + ts-jest |
