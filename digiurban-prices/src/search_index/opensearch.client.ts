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

// Sinônimos para licitações públicas
const SYNONYMS_LIST = [
  'computador, microcomputador, desktop, pc',
  'notebook, laptop, computador portátil',
  'impressora, multifuncional, copiadora',
  'servidor, server',
  'monitor, display, tela',
  'hd, disco rígido, hdd, hard disk',
  'ssd, solid state drive',
  'memória, ram, memória ram',
  'pen drive, pendrive, usb flash',
  'tablet, ipad',
  'celular, smartphone, telefone móvel',
  'cadeira, assento, cadeira escritório',
  'mesa, escrivaninha, mesa escritório',
  'armário, roupeiro, guarda-roupa',
  'estante, prateleira, rack',
  'papel, papel a4, sulfite, resma',
  'caneta, esferográfica, lapiseira',
  'sabão, sabonete, detergente',
  'desinfetante, álcool, sanitizante',
  'vassoura, rodo, esfregão',
  'saco de lixo, sacola',
  'paracetamol, acetaminofeno',
  'amoxicilina, amoxil',
  'ibuprofeno, ibuprofen',
  'dipirona, novalgina',
  'seringa, agulha',
  'luva, luva látex, luva descartável',
  'máscara, máscara cirúrgica, máscara n95',
  'curativo, band-aid, esparadrapo',
  'gaze, algodão, atadura',
  'soro, solução fisiológica, soro fisiológico',
  'arroz, arroz branco, arroz parboilizado',
  'feijão, feijão carioca, feijão preto',
  'óleo, azeite, óleo vegetal, óleo de soja',
  'açúcar, açúcar refinado, açúcar cristal',
  'cimento, argamassa',
  'tinta, tinta látex, tinta acrílica',
  'pneu, borracha, pneumático',
  'gasolina, combustível, etanol',
  'diesel, óleo diesel',
  'manutenção, reparo, conserto',
  'limpeza, higienização, conservação',
  'vigilância, segurança, guarda',
  'transporte, frete, logística',
  'treinamento, capacitação, curso',
];

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

  logger.info('[OpenSearch] Creating enhanced index', { index });

  await client.indices.create({
    index,
    body: {
      settings: {
        number_of_shards: 1,
        number_of_replicas: 0,
        analysis: {
          filter: {
            portuguese_stop: {
              type: 'stop',
              stopwords: '_portuguese_',
            },
            portuguese_stemmer: {
              type: 'stemmer',
              language: 'brazilian',
            },
            synonyms_filter: {
              type: 'synonym',
              synonyms: SYNONYMS_LIST,
              lenient: true,
            },
            edge_ngram_filter: {
              type: 'edge_ngram',
              min_gram: 3,
              max_gram: 20,
            },
          },
          analyzer: {
            portuguese_custom: {
              type: 'custom',
              tokenizer: 'standard',
              filter: [
                'lowercase',
                'asciifolding',
                'portuguese_stop',
                'portuguese_stemmer',
                'synonyms_filter',
              ],
            },
            autocomplete_analyzer: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding', 'edge_ngram_filter'],
            },
            simple_portuguese: {
              type: 'custom',
              tokenizer: 'standard',
              filter: ['lowercase', 'asciifolding'],
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
            search_analyzer: 'portuguese_custom',
            fields: {
              keyword: { type: 'keyword', ignore_above: 512 },
              autocomplete: {
                type: 'text',
                analyzer: 'autocomplete_analyzer',
                search_analyzer: 'simple_portuguese',
              },
            },
          },
          normalized_description: {
            type: 'text',
            analyzer: 'portuguese_custom',
            search_analyzer: 'portuguese_custom',
            fields: {
              keyword: { type: 'keyword', ignore_above: 512 },
            },
          },

          // CATMAT
          catmat_code: { type: 'keyword' },
          catmat_description: {
            type: 'text',
            analyzer: 'portuguese_custom',
          },

          // Valores
          unit: { type: 'keyword' },
          unit_price: { type: 'float' },
          total_price: { type: 'float' },
          quantity: { type: 'float' },

          // Datas
          contract_date: { type: 'date' },
          year_month: { type: 'keyword' },

          // Localização
          uf: { type: 'keyword' },
          city: {
            type: 'text',
            fields: { keyword: { type: 'keyword' } },
          },

          // Órgão comprador
          organization_name: {
            type: 'text',
            analyzer: 'portuguese_custom',
            fields: { keyword: { type: 'keyword' } },
          },

          // Modalidade e fonte
          modality: { type: 'keyword' },
          source: { type: 'keyword' },
          confidence_score: { type: 'float' },

          // Fornecedor
          supplier_name: {
            type: 'text',
            analyzer: 'portuguese_custom',
            fields: { keyword: { type: 'keyword' } },
          },
          supplier_cnpj: { type: 'keyword' },

          // Metadados
          indexed_at: { type: 'date' },
        },
      },
    },
  });

  logger.info('[OpenSearch] Enhanced index created', { index });
}

// Drop + recreate do índice com o novo mapping
export async function reindexWithNewMapping(): Promise<void> {
  const client = getOpenSearchClient();
  const index = config.opensearch.indexLineItems;

  try {
    const exists = await client.indices.exists({ index });
    if (exists.body) {
      logger.info('[OpenSearch] Dropping old index for re-mapping', { index });
      await client.indices.delete({ index });
    }
  } catch {
    // ignore
  }

  await ensureIndexExists();
  logger.info('[OpenSearch] Re-mapping done — repopulate via ingest');
}
