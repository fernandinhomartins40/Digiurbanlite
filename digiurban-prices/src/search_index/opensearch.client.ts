import { Client } from '@opensearch-project/opensearch';
import { config } from '../config/config';
import { logger } from '../utils/logger';

let osClient: Client | null = null;

export function getOpenSearchClient(): Client {
  if (!osClient) {
    osClient = new Client({
      node: config.opensearch.url,
      auth: {
        username: config.opensearch.username,
        password: config.opensearch.password,
      },
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }
  return osClient;
}

export async function pingOpenSearch(): Promise<boolean> {
  try {
    const client = getOpenSearchClient();
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

export async function ensureIndexExists(): Promise<void> {
  const client = getOpenSearchClient();
  const index = config.opensearch.indexLineItems;

  try {
    const exists = await client.indices.exists({ index });
    if (exists.body) {
      logger.info('[OpenSearch] Index already exists', { index });
      return;
    }
  } catch {
    // index does not exist
  }

  logger.info('[OpenSearch] Creating index', { index });

  await client.indices.create({
    index,
    body: {
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
          analyzer: {
            portuguese_custom: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding', 'portuguese_stop'],
            },
          },
          filter: {
            portuguese_stop: {
              type: 'stop',
              stopwords: '_portuguese_',
            },
          },
        },
      },
      mappings: {
        properties: {
          id: { type: 'keyword' },
          description: {
            type: 'text',
            analyzer: 'portuguese_custom',
            fields: {
              keyword: { type: 'keyword', ignore_above: 512 },
            },
          },
          normalized_description: {
            type: 'text',
            analyzer: 'portuguese_custom',
            fields: {
              keyword: { type: 'keyword', ignore_above: 512 },
            },
          },
          unit: { type: 'keyword' },
          unit_price: { type: 'float' },
          total_price: { type: 'float' },
          quantity: { type: 'float' },
          contract_date: { type: 'date' },
          uf: { type: 'keyword' },
          city: { type: 'keyword' },
          organization_name: {
            type: 'text',
            fields: { keyword: { type: 'keyword' } },
          },
          modality: { type: 'keyword' },
          catmat_code: { type: 'keyword' },
        },
      },
    },
  });

  logger.info('[OpenSearch] Index created', { index });
}
