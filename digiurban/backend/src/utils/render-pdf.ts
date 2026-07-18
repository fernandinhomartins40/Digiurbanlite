/**
 * Renderização de PDF a partir de HTML com Playwright.
 *
 * - Semáforo: no máximo MAX_CONCURRENT browsers simultâneos (evita esgotar
 *   memória quando vários relatórios são pedidos ao mesmo tempo).
 * - try/finally: o browser SEMPRE é fechado, mesmo se page.pdf() falhar.
 * - Rede bloqueada: o Chromium não pode fazer requests externos — conteúdo
 *   injetado por usuário no HTML não vira vetor de SSRF/exfiltração.
 *   (Todo conteúdo dinâmico também deve ser escapado com escapeHtml.)
 */

const MAX_CONCURRENT = 2;

let active = 0;
const waiting: Array<() => void> = [];

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active++;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    waiting.push(() => {
      active++;
      resolve();
    });
  });
}

function release(): void {
  active--;
  const next = waiting.shift();
  if (next) next();
}

export interface RenderPdfOptions {
  format?: string;
  margin?: { top?: string; right?: string; bottom?: string; left?: string };
}

export async function renderPdfFromHtml(
  html: string,
  options: RenderPdfOptions = {}
): Promise<Buffer> {
  await acquire();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { chromium } = require('playwright');
  let browser: any = null;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Bloquear qualquer request que não seja o documento principal
    await page.route('**/*', (route: any) => {
      if (route.request().resourceType() === 'document') {
        return route.continue();
      }
      return route.abort();
    });

    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      printBackground: true,
      margin: options.margin || { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    });

    return pdfBuffer;
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
    release();
  }
}
