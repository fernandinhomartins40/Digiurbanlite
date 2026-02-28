import express from 'express';
import request from 'supertest';

const mockSearch = jest.fn();

jest.mock('../../src/search_index/opensearch.client', () => ({
  getOpenSearchClient: () => ({
    search: mockSearch,
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

function createTestApp() {
  const app = express();
  app.use(express.json());

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

function buildDefaultSearchBody() {
  return {
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
              city: 'Sao Paulo',
              organization_name: 'Prefeitura Municipal',
              modality: 'Pregao Eletronico',
              source: 'pncp',
              supplier_name: 'Fornecedor A',
              supplier_cnpj: '00000000000191',
              catmat_code: '123',
              confidence_score: 0.94,
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
              organization_name: 'Camara Municipal',
              modality: 'Dispensa',
              source: 'comprasnet',
              supplier_name: 'Fornecedor B',
              supplier_cnpj: '00000000000192',
              catmat_code: '124',
              confidence_score: 0.9,
            },
          },
        ],
      },
      aggregations: {},
    },
  };
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
  const AUTH_HEADER = { 'x-digiurban-key': 'test-api-key' };

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    mockSearch.mockReset();
    mockSearch.mockResolvedValue(buildDefaultSearchBody());
  });

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

  it('POST /api/v1/search deve filtrar matches irrelevantes para item simples', async () => {
    mockSearch.mockResolvedValueOnce({
      body: {
        hits: {
          total: { value: 4 },
          hits: [
            {
              _id: 'vas-1',
              _score: 1.8,
              _source: {
                description: 'VASSOURA TIPO CAIPIRA AMARELA DE 05 FIOS COM CABO',
                normalized_description: 'vassoura tipo caipira amarela 05 fios cabo',
                unit: 'un',
                unit_price: 19.9,
                total_price: 1990,
                quantity: 100,
                contract_date: '2026-02-24',
                uf: 'SP',
                city: 'Espirito Santo do Pinhal',
                organization_name: 'Municipio X',
                modality: 'Pregao',
                source: 'pncp',
                supplier_name: 'Fornecedor Vassoura',
                supplier_cnpj: '00000000000193',
                catmat_code: '999',
                confidence_score: 0.92,
              },
            },
            {
              _id: 'rod-1',
              _score: 1.7,
              _source: {
                description: 'RODO DE BORRACHA 40CM COM CABO DE MADEIRA',
                normalized_description: 'rodo borracha 40cm cabo madeira',
                unit: 'un',
                unit_price: 24.14,
                total_price: 2414,
                quantity: 100,
                contract_date: '2026-02-24',
                uf: 'CE',
                city: 'Fortaleza',
                organization_name: 'Estado Y',
                modality: 'Pregao',
                source: 'pncp',
                supplier_name: 'Fornecedor Rodo',
                supplier_cnpj: '00000000000194',
                catmat_code: null,
                confidence_score: 0.81,
              },
            },
            {
              _id: 'kit-1',
              _score: 1.65,
              _source: {
                description: 'KIT LIMPEZA INFANTIL COMPOSTO POR RODO PA E VASSOURA EM MATERIAL PLASTICO',
                normalized_description: 'kit limpeza infantil composto por rodo pa e vassoura material plastico',
                unit: 'un',
                unit_price: 40.2,
                total_price: 1447.2,
                quantity: 36,
                contract_date: '2026-02-19',
                uf: 'SP',
                city: 'Pirapozinho',
                organization_name: 'Municipio Z',
                modality: 'Pregao',
                source: 'pncp',
                supplier_name: 'Fornecedor Kit',
                supplier_cnpj: '00000000000195',
                catmat_code: null,
                confidence_score: 0.84,
              },
            },
            {
              _id: 'vas-2',
              _score: 1.6,
              _source: {
                description: 'VASSOURA MULTIUSO TIPO NOVICA PARA PISOS INTERNOS E EXTERNOS',
                normalized_description: 'vassoura multiuso tipo novica pisos internos externos',
                unit: 'un',
                unit_price: 9,
                total_price: 180,
                quantity: 20,
                contract_date: '2026-02-24',
                uf: 'CE',
                city: 'Fortaleza',
                organization_name: 'Estado Y',
                modality: 'Pregao',
                source: 'pncp',
                supplier_name: 'Fornecedor Novica',
                supplier_cnpj: '00000000000196',
                catmat_code: '1000',
                confidence_score: 0.9,
              },
            },
          ],
        },
        aggregations: {},
      },
    });

    const res = await request(app)
      .post('/api/v1/search')
      .set(AUTH_HEADER)
      .send({ query: 'vassoura' });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(2);
    expect(res.body.items.every((item: { description: string }) => item.description.toLowerCase().includes('vassoura'))).toBe(true);
    expect(res.body.items.some((item: { description: string }) => item.description.toLowerCase().includes('kit limpeza infantil'))).toBe(false);
    expect(res.body.aggregations.bySource).toEqual([{ key: 'pncp', count: 2 }]);
    expect(res.body.explanation.filters).toContain('Relevancia: matches incidentais removidos');
  });

  it('POST /api/v1/search deve incluir estatisticas', async () => {
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
