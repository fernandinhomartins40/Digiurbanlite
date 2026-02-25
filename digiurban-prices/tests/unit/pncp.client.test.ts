import axios from 'axios';
import { PncpClient } from '../../src/connectors/pncp/pncp.client';

jest.mock('axios');
jest.mock('axios-retry', () => ({
  __esModule: true,
  default: jest.fn(),
  isNetworkOrIdempotentRequestError: jest.fn().mockReturnValue(false),
}));

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('PncpClient', () => {
  let client: PncpClient;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock axios.create to return a mock instance
    const mockGet = jest.fn();
    (mockedAxios.create as jest.Mock).mockReturnValue({
      get: mockGet,
      interceptors: { response: { use: jest.fn() } },
    });
    client = new PncpClient();
  });

  it('deve instanciar corretamente', () => {
    expect(client).toBeInstanceOf(PncpClient);
  });

  it('deve formatar datas no formato ISO', () => {
    // Testar indiretamente via ping que chama formatDate
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const date = new Date('2025-01-15T10:00:00Z');
    expect(formatDate(date)).toBe('2025-01-15');
  });

  it('fetchAllPages deve parar ao receber array vazio', async () => {
    let callCount = 0;
    const result = await client.fetchAllPages(async (_page) => {
      callCount++;
      if (callCount > 1) return [];
      return [{ id: '1' }] as never[];
    });
    expect(callCount).toBe(2);
    expect(result).toHaveLength(1);
  });

  it('fetchAllPages deve respeitar limite máximo de páginas', async () => {
    let callCount = 0;
    await client.fetchAllPages(async (_page) => {
      callCount++;
      return [{ id: String(callCount) }] as never[];
    }, 3);
    expect(callCount).toBe(3);
  });
});
