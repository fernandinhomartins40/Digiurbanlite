/**
 * Upload com anexo NÃO pode perder o município (tenant) da requisição.
 * Regressão de 2026-10-02: com arquivos, o bot de Palmital recebia
 * "Service not found" porque o serviço era procurado no município padrão.
 */
import { describe, expect, it } from '@jest/globals';
import '../../src/lib/multer-keep-context';
import express from 'express';
import request from 'supertest';
import { AsyncLocalStorage } from 'async_hooks';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

describe('upload de arquivos mantém o município', () => {
  it('o contexto do município sobrevive ao multer', async () => {
    const als = new AsyncLocalStorage<{ tenantId: string }>();
    const upload = multer({ storage: multer.memoryStorage() }).array('documents', 5);
    const app = express();
    app.use((req, _res, next) => als.run({ tenantId: 'palmital' }, () => next()));
    app.post('/protocols', upload, (req, res) => {
      res.json({ tenantId: als.getStore()?.tenantId || null, files: ((req as any).files || []).length });
    });

    const r = await request(app)
      .post('/protocols')
      .field('serviceId', 'svc-1')
      .attach('documents', Buffer.from('arquivo 1'), 'cpf.webp')
      .attach('documents', Buffer.from('arquivo 2'), 'comprovante.webp');

    expect(r.body).toEqual({ tenantId: 'palmital', files: 2 });
  });
});
