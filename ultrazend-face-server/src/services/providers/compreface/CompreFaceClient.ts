import { parseBase64Image } from '../../face/base64-image';

interface CompreFaceSubjectEntry {
  subject?: string;
  similarity?: number;
}

interface CompreFaceFaceEntry {
  box?: Record<string, unknown>;
  subjects?: CompreFaceSubjectEntry[];
}

interface CompreFaceResponse {
  result?: CompreFaceFaceEntry[];
  message?: string;
  error?: string;
  [key: string]: unknown;
}

export interface CompreFaceRecognitionCandidate {
  subject: string;
  similarity: number;
  faceIndex: number;
  box: Record<string, unknown> | null;
  raw: Record<string, unknown>;
}

export interface CompreFaceStatus {
  configured: boolean;
  available: boolean;
  baseUrl: string | null;
  message: string;
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/$/, '');
}

function getConfigurationMessage(baseUrl: string, apiKey: string) {
  if (!baseUrl && !apiKey) {
    return 'CompreFace não está configurado. Defina COMPREFACE_API_URL e COMPREFACE_API_KEY.';
  }

  if (!baseUrl) {
    return 'CompreFace não está configurado. Defina COMPREFACE_API_URL.';
  }

  if (!apiKey) {
    return 'CompreFace não está configurado. Defina COMPREFACE_API_KEY.';
  }

  return 'CompreFace não está configurado.';
}

function buildTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  };
}

function createCompreFaceError(message: string, status = 500, details?: unknown) {
  const error = new Error(message) as Error & { status?: number; details?: unknown };
  error.status = status;
  error.details = details;
  return error;
}

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {} as Record<string, unknown>;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {
      raw: text,
    } as Record<string, unknown>;
  }
}

export class CompreFaceClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly predictionCount: number;
  private readonly detectionThreshold: number;

  constructor() {
    this.baseUrl = stripTrailingSlash(process.env.COMPREFACE_API_URL || 'http://compreface-ui:80');
    this.apiKey = process.env.COMPREFACE_API_KEY || '';
    this.timeoutMs = Number(process.env.COMPREFACE_TIMEOUT_MS || 15000);
    this.predictionCount = Number(process.env.COMPREFACE_PREDICTION_COUNT || 5);
    this.detectionThreshold = Number(process.env.COMPREFACE_DETECTION_THRESHOLD || 0.8);
  }

  public isConfigured() {
    return Boolean(this.baseUrl && this.apiKey);
  }

  public async getStatus(): Promise<CompreFaceStatus> {
    if (!this.isConfigured()) {
      return {
        configured: false,
        available: false,
        baseUrl: this.baseUrl || null,
        message: getConfigurationMessage(this.baseUrl, this.apiKey),
      };
    }

    try {
      await this.request('/api/v1/recognition/subjects', {
        method: 'GET',
      });

      return {
        configured: true,
        available: true,
        baseUrl: this.baseUrl,
        message: 'CompreFace disponível.',
      };
    } catch (error: any) {
      return {
        configured: true,
        available: false,
        baseUrl: this.baseUrl,
        message: error?.message || 'CompreFace indisponível.',
      };
    }
  }

  public async enrollSubject(subject: string, imageBase64: string) {
    this.ensureConfigured();

    const formData = this.buildFormData(imageBase64);

    return this.request(`/api/v1/recognition/faces/?subject=${encodeURIComponent(subject)}`, {
      method: 'POST',
      body: formData,
    });
  }

  public async recognize(imageBase64: string) {
    this.ensureConfigured();

    const formData = this.buildFormData(imageBase64, this.predictionCount);
    const payload = await this.request('/api/v1/recognition/faces', {
      method: 'POST',
      body: formData,
    });

    const faces = Array.isArray(payload.result) ? payload.result : [];
    const candidates: CompreFaceRecognitionCandidate[] = [];

    faces.forEach((face, faceIndex) => {
      const faceEntry = face as CompreFaceFaceEntry;
      const subjects = Array.isArray(faceEntry.subjects) ? faceEntry.subjects : [];

      subjects.forEach((subjectEntry) => {
        const subject = typeof subjectEntry.subject === 'string' ? subjectEntry.subject : '';
        const similarity = Number(subjectEntry.similarity ?? 0);

        if (!subject || !Number.isFinite(similarity)) {
          return;
        }

        candidates.push({
          subject,
          similarity,
          faceIndex,
          box: faceEntry.box || null,
          raw: subjectEntry as Record<string, unknown>,
        });
      });
    });

    candidates.sort((left, right) => right.similarity - left.similarity);

    return {
      candidates,
      raw: payload,
    };
  }

  private buildFormData(imageBase64: string, predictionCount = 1) {
    const { buffer, mimeType, extension } = parseBase64Image(imageBase64);
    const formData = new FormData();

    formData.append('file', new Blob([buffer], { type: mimeType }), `capture.${extension}`);
    formData.append('prediction_count', String(predictionCount));
    formData.append('det_prob_threshold', String(this.detectionThreshold));

    return formData;
  }

  private ensureConfigured() {
    if (!this.isConfigured()) {
      throw createCompreFaceError(getConfigurationMessage(this.baseUrl, this.apiKey), 503);
    }
  }

  private async request(path: string, init: RequestInit) {
    const timeout = buildTimeoutSignal(this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: timeout.signal,
        headers: {
          'x-api-key': this.apiKey,
          ...(init.headers || {}),
        },
      });

      const payload = await parseJsonResponse(response);

      if (!response.ok) {
        throw createCompreFaceError(
          String(payload.message || payload.error || `CompreFace respondeu com status ${response.status}`),
          response.status,
          payload
        );
      }

      return payload as CompreFaceResponse;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw createCompreFaceError('Tempo esgotado ao consultar o CompreFace.', 504);
      }

      throw error;
    } finally {
      timeout.clear();
    }
  }
}

export default new CompreFaceClient();
