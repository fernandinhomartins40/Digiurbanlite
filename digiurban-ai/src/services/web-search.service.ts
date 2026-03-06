import axios from 'axios';
import { config } from '../config/config';
import logger from '../utils/logger';

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: 'serper' | 'duckduckgo';
}

function decodeHtml(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtml(input: string): string {
  return decodeHtml(input.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  const normalizedCandidate =
    trimmed.startsWith('//') ? `https:${trimmed}` : trimmed;

  try {
    const parsed = new URL(normalizedCandidate);

    if (
      parsed.hostname.toLowerCase().includes('duckduckgo.com') &&
      parsed.pathname.startsWith('/l/')
    ) {
      const redirected = parsed.searchParams.get('uddg');
      if (redirected) {
        try {
          const finalUrl = decodeURIComponent(redirected);
          return new URL(finalUrl).toString();
        } catch {
          return redirected;
        }
      }
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export class WebSearchService {
  async search(query: string, maxResults = config.webSearchMaxResults): Promise<WebSearchResult[]> {
    if (!config.webSearchEnabled) {
      return [];
    }

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }

    const boundedMaxResults = Math.min(Math.max(maxResults, 1), 10);
    const provider = config.webSearchProvider;

    if (provider === 'serper') {
      return this.searchWithSerper(normalizedQuery, boundedMaxResults);
    }

    if (provider === 'duckduckgo') {
      return this.searchWithDuckDuckGo(normalizedQuery, boundedMaxResults);
    }

    logger.warn('Unsupported web search provider configured', { provider });
    return [];
  }

  private async searchWithSerper(query: string, maxResults: number): Promise<WebSearchResult[]> {
    if (!config.webSearchSerperApiKey.trim()) {
      logger.warn('Serper provider configured without API key');
      return [];
    }

    const response = await axios.post(
      'https://google.serper.dev/search',
      {
        q: query,
        num: maxResults,
      },
      {
        timeout: config.webSearchTimeoutMs,
        headers: {
          'X-API-KEY': config.webSearchSerperApiKey.trim(),
          'Content-Type': 'application/json',
        },
      },
    );

    const organic = Array.isArray(response.data?.organic) ? response.data.organic : [];

    return organic
      .map((item: { title?: unknown; link?: unknown; snippet?: unknown }) => {
        const title = typeof item.title === 'string' ? item.title.trim() : '';
        const url = typeof item.link === 'string' ? item.link.trim() : '';
        const snippet = typeof item.snippet === 'string' ? item.snippet.trim() : '';

        if (!title || !url) return null;

        return {
          title: stripHtml(title),
          url,
          snippet: stripHtml(snippet).slice(0, 320),
          source: 'serper' as const,
        };
      })
      .filter((item: WebSearchResult | null): item is WebSearchResult => item !== null)
      .slice(0, maxResults);
  }

  private async searchWithDuckDuckGo(query: string, maxResults: number): Promise<WebSearchResult[]> {
    const response = await axios.get<string>('https://html.duckduckgo.com/html/', {
      params: { q: query },
      timeout: config.webSearchTimeoutMs,
      responseType: 'text',
      headers: {
        'User-Agent': config.webSearchUserAgent,
      },
    });

    const html = String(response.data || '');
    const results: WebSearchResult[] = [];
    const anchorRegex =
      /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

    let anchorMatch: RegExpExecArray | null = null;
    while ((anchorMatch = anchorRegex.exec(html)) !== null && results.length < maxResults) {
      const rawUrl = anchorMatch[1] || '';
      const titleRaw = anchorMatch[2] || '';
      const title = stripHtml(titleRaw);
      const url = normalizeUrl(rawUrl);

      if (!title || !url) {
        continue;
      }

      const searchWindow = html.slice(anchorMatch.index, Math.min(html.length, anchorMatch.index + 1500));
      const snippetMatch =
        /<(?:a|div)[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/(?:a|div)>/i.exec(
          searchWindow,
        );
      const snippet = stripHtml(snippetMatch?.[1] || '').slice(0, 320);

      results.push({
        title,
        url,
        snippet,
        source: 'duckduckgo',
      });
    }

    return results.slice(0, maxResults);
  }
}

export const webSearchService = new WebSearchService();
