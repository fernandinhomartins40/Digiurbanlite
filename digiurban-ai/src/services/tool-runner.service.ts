import { config } from '../config/config';
import { applicationContextService } from './application-context.service';
import { applicationDataService } from './application-data.service';
import { KnowledgeIndexScope, knowledgeService } from './knowledge.service';
import { webSearchService } from './web-search.service';
import { ModelToolCall, ModelToolDefinition } from '../types';

export type BuiltInToolName =
  | 'search_application_context'
  | 'get_application_data'
  | 'search_knowledge_base'
  | 'search_web'
  | 'get_current_time';

export interface BuiltInToolContext {
  tenantId: string;
  chatMode: 'free' | 'rag';
}

type ToolExecutionResult = {
  toolName: BuiltInToolName | string;
  output: Record<string, unknown>;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function readInt(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clamp(Math.trunc(value), min, max);
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return clamp(parsed, min, max);
    }
  }

  return fallback;
}

function normalizeArguments(
  args: Record<string, unknown> | string,
): Record<string, unknown> {
  if (typeof args === 'string') {
    try {
      const parsed = JSON.parse(args) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  return args && typeof args === 'object' && !Array.isArray(args) ? args : {};
}

export class ToolRunnerService {
  getBuiltInTools(context: BuiltInToolContext): ModelToolDefinition[] {
    const tools: ModelToolDefinition[] = [
      {
        type: 'function',
        function: {
          name: 'get_current_time',
          description: 'Retorna a data e hora atual no fuso solicitado.',
          parameters: {
            type: 'object',
            properties: {
              timezone: {
                type: 'string',
                description: 'Fuso IANA. Exemplo: America/Sao_Paulo.',
              },
            },
          },
        },
      },
    ];

    if (context.chatMode === 'rag') {
      tools.push({
        type: 'function',
        function: {
          name: 'search_application_context',
          description:
            'Busca telas, rotas, fluxos, papeis e permissoes da aplicacao DigiUrban.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Pergunta objetiva sobre menu, tela, modulo, role ou fluxo.',
              },
              limit: {
                type: 'integer',
                description: 'Quantidade maxima de resultados. Use no maximo 6.',
              },
            },
            required: ['query'],
          },
        },
      });
      tools.push({
        type: 'function',
        function: {
          name: 'get_application_data',
          description:
            'Consulta dados operacionais em tempo real da aplicacao, como totais de protocolos e chamados.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Pergunta objetiva sobre totais, status ou dados vivos da aplicacao.',
              },
            },
            required: ['query'],
          },
        },
      });
      tools.push({
        type: 'function',
        function: {
          name: 'search_knowledge_base',
          description: 'Busca contexto interno na base de conhecimento da DigiUrban.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Consulta objetiva para localizar contexto relevante.',
              },
              limit: {
                type: 'integer',
                description: 'Quantidade maxima de resultados. Use no maximo 5.',
              },
              scopes: {
                type: 'array',
                items: { type: 'string' },
                description:
                  'Escopos opcionais: business_flows_index, internal_docs_index.',
              },
            },
            required: ['query'],
          },
        },
      });
    }

    if (config.webSearchEnabled) {
      tools.push({
        type: 'function',
        function: {
          name: 'search_web',
          description: 'Pesquisa na web para buscar fatos atuais e links de referencia.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Consulta objetiva para busca na web.',
              },
              maxResults: {
                type: 'integer',
                description: 'Quantidade maxima de resultados. Use no maximo 5.',
              },
            },
            required: ['query'],
          },
        },
      });
    }

    return tools;
  }

  async executeToolCall(
    call: ModelToolCall,
    context: BuiltInToolContext,
  ): Promise<ToolExecutionResult> {
    const toolName = call.function?.name || 'unknown_tool';
    const args = normalizeArguments(call.function?.arguments ?? {});

    switch (toolName) {
      case 'search_application_context':
        return this.searchApplicationContext(args);
      case 'get_application_data':
        return this.getApplicationData(args);
      case 'search_knowledge_base':
        return this.searchKnowledgeBase(args, context);
      case 'search_web':
        return this.searchWeb(args);
      case 'get_current_time':
        return this.getCurrentTime(args);
      default:
        return {
          toolName,
          output: {
            ok: false,
            error: `Ferramenta nao suportada: ${toolName}`,
          },
        };
    }
  }

  private async searchKnowledgeBase(
    args: Record<string, unknown>,
    context: BuiltInToolContext,
  ): Promise<ToolExecutionResult> {
    const query = readString(args.query);
    if (!query) {
      return {
        toolName: 'search_knowledge_base',
        output: {
          ok: false,
          error: 'Parametro "query" obrigatorio.',
        },
      };
    }

    const limit = readInt(args.limit, 1, 5, 4);
    const scopes = Array.isArray(args.scopes)
      ? args.scopes.filter(
          (item): item is KnowledgeIndexScope =>
            item === 'business_flows_index' || item === 'internal_docs_index',
        )
      : undefined;
    const results = await knowledgeService.searchRelevantChunks({
      tenantId: context.tenantId,
      query,
      limit,
      scopes,
    });

    return {
      toolName: 'search_knowledge_base',
      output: {
        ok: true,
        query,
        resultCount: results.length,
        scopes,
        results: results.map((item) => ({
          sourceId: item.sourceId,
          score: item.score,
          content: item.content.slice(0, 900),
        })),
      },
    };
  }

  private async searchApplicationContext(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const query = readString(args.query);
    if (!query) {
      return {
        toolName: 'search_application_context',
        output: {
          ok: false,
          error: 'Parametro "query" obrigatorio.',
        },
      };
    }

    const limit = readInt(args.limit, 1, 6, 4);
    const results = applicationContextService.search({ query, limit });

    return {
      toolName: 'search_application_context',
      output: {
        ok: true,
        query,
        resultCount: results.length,
        results,
      },
    };
  }

  private async getApplicationData(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const query = readString(args.query);
    if (!query) {
      return {
        toolName: 'get_application_data',
        output: {
          ok: false,
          error: 'Parametro "query" obrigatorio.',
        },
      };
    }

    const result = await applicationDataService.query(query);
    return {
      toolName: 'get_application_data',
      output: {
        ok: true,
        query,
        ...result,
      },
    };
  }

  private async searchWeb(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const query = readString(args.query);
    if (!query) {
      return {
        toolName: 'search_web',
        output: {
          ok: false,
          error: 'Parametro "query" obrigatorio.',
        },
      };
    }

    const maxResults = readInt(args.maxResults, 1, 5, Math.min(config.webSearchMaxResults, 5));
    const results = await webSearchService.search(query, maxResults);

    return {
      toolName: 'search_web',
      output: {
        ok: true,
        query,
        resultCount: results.length,
        results: results.map((item) => ({
          title: item.title,
          url: item.url,
          snippet: item.snippet,
          source: item.source,
        })),
      },
    };
  }

  private async getCurrentTime(args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const timezone = readString(args.timezone) || 'America/Sao_Paulo';
    const now = new Date();

    return {
      toolName: 'get_current_time',
      output: {
        ok: true,
        timezone,
        iso: now.toISOString(),
        local: new Intl.DateTimeFormat('pt-BR', {
          dateStyle: 'full',
          timeStyle: 'long',
          timeZone: timezone,
        }).format(now),
      },
    };
  }
}

export const toolRunnerService = new ToolRunnerService();
