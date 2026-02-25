/**
 * Testes de integração para os endpoints de busca.
 * Mocka OpenSearch e Prisma para rodar sem dependências externas.
 */

import express from 'express';
import request from 'supertest';

// Mock OpenSearch antes de importar os módulos
jest.mock('../../src/search_index/opensearch.client', () => ({
  getOpenSearchClient: () => ({
    search: jest.fn().mockResolvedValue({
      body: {
        hits: {
          total: { value: 2 },
          hits: [
            {
              _id: 'item-1',
              _score: 1.5,
              _source: {
                description: 'Computador Desktop Intel i5 8GB',
                normalized_description: 'computador desktop intel i5 8gb',
                unit: 'un',
                unit_price: 2850,
                total_price: 28500,
                quantity: 10,
                contract_date: '2025-03-01',
                uf: 'SP',
                city: 'São Paulo',
                organization_name: 'Prefeitura Municipal',
                modality: 'Pregão Eletrônico',
              },
            },
            {
              _id: 'item-2',
              _score: 1.2,
              _source: {
                description: 'Microcomputador tipo desktop i5',
                normalized_description: 'microcomputador desktop i5',
                unit: 'un',
                unit_price: 2920,
                total_price: 14600,
                quantity: 5,
                contract_date: '2025-02-15',
                uf: 'MG',
                city: 'Belo Horizonte',
                organization_name: 'Câmara Municipal',
                modality: 'Dispensa',
              },
            },
          ],
        },
        aggregations: {
          stats_unit_price: { avg: 2885, min: 2850, max: 2920, sum: 5770, count: 2 },
          percentiles_unit_price: { values: { '50.0': 2885 } },
          by_uf: { buckets: [{ key: 'SP', doc_count: 1 }, { key: 'MG', doc_count: 1 }] },
          by_unit: { buckets: [{ key: 'un', doc_count: 2 }] },
          over_time: {
            buckets: [
              { key_as_string: '2025-02', doc_count: 1, avg_price: { value: 2920 } },
              { key_as_string: '2025-03', doc_count: 1, avg_price: { value: 2850 } },
            ],
          },
        },
      },
    }),
    ping: jest.fn().mockResolvedValue({}),
    indices: {
      exists: jest.fn().mockResolvedValue({ body: true }),
    },
  }),
  pingOpenSearch: jest.fn().mockResolvedValue(true),
  ensureIndexExists: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../src/models/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    searchAudit: {
      create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    ingestRun: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.mock('../../src/ingest/ingest.worker', () => ({
  startIngestWorker: jest.fn(),
  triggerIngest: jest.fn().mockResolvedValue('job-123'),
  getIngestStatus: jest.fn().mockResolvedValue({ active: 0, waiting: 0, completed: 0, failed: 0 }),
}));

jest.mock('../../src/ingest/scheduler', () => ({
  startIngestScheduler: jest.fn(),
}));

// Setup app de teste
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Override API key para testes
  process.env.DIGIURBAN_API_KEY = 'test-api-key';

  const { apiKeyMiddleware } = require('../../src/api/middlewares/auth.middleware');
  const healthRouter = require('../../src/api/routes/health.routes').default;
  const searchRouter = require('../../src/api/routes/search.routes').default;
  const auditsRouter = require('../../src/api/routes/audits.routes').default;
  const ingestRouter = require('../../src/api/routes/ingest.routes').default;

  app.use('/api/v1', healthRouter);
  app.use('/api/v1', apiKeyMiddleware);
  app.use('/api/v1', searchRouter);
  app.use('/api/v1', auditsRouter);
  app.use('/api/v1', ingestRouter);

  return app;
}

describe('Health endpoints', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  it('GET /api/v1/health deve retornar 200', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('digiurban-prices');
  });

  it('GET /api/v1/ready deve retornar status', async () => {
    const res = await request(app).get('/api/v1/ready');
    expect([200, 503]).toContain(res.status);
    expect(res.body.checks).toBeDefined();
  });
});

describe('Search endpoints', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeAll(() => {
    app = createTestApp();
  });

  const AUTH_HEADER = { 'x-digiurban-key': 'test-api-key' };

  it('POST /api/v1/search deve retornar 401 sem API key', async () => {
    const res = await request(app)
      .post('/api/v1/search')
      .send({ query: 'computador' });
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/search deve retornar 400 com query vazia', async () => {
    const res = await request(app)
      .post('/api/v1/search')
      .set(AUTH_HEADER)
      .send({ query: '' });
    expect(res.status).toBe(400);
  });

  it('POST /api/v1/search deve retornar resultados', async () => {
    const res = await request(app)
      .post('/api/v1/search')
      .set(AUTH_HEADER)
      .send({ query: 'computador desktop i5' });

    expect(res.status).toBe(200);
    expect(res.body.query).toBe('computador desktop i5');
    expect(res.body.items).toBeInstanceOf(Array);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.statistics).toBeDefined();
  });

  it('POST /api/v1/search deve incluir estatísticas', async () => {
    const res = await request(app)
      .post('/api/v1/search')
      .set(AUTH_HEADER)
      .send({ query: 'notebook' });

    expect(res.status).toBe(200);
    if (res.body.statistics) {
      expect(res.body.statistics.mean).toBeDefined();
      expect(res.body.statistics.median).toBeDefined();
      expect(res.body.statistics.min).toBeDefined();
      expect(res.body.statistics.max).toBeDefined();
    }
  });

  it('GET /api/v1/audits deve retornar lista', async () => {
    const res = await request(app)
      .get('/api/v1/audits')
      .set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.items).toBeInstanceOf(Array);
  });

  it('GET /api/v1/ingest/status deve retornar status', async () => {
    const res = await request(app)
      .get('/api/v1/ingest/status')
      .set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.queue).toBeDefined();
  });
});
