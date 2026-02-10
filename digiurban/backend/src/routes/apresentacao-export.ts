import { Router } from 'express';

const router = Router();

/**
 * GET /api/apresentacao/export-pdf
 * Exportar apresentação comercial em PDF via Playwright
 * Rota pública (sem autenticação — apresentação é pública)
 */
router.get('/export-pdf', async (req: any, res: any) => {
  let browser: any = null;

  try {
    const { chromium } = require('playwright');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();

    // Determinar URL do frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const presentationUrl = `${frontendUrl}/apresentacao`;

    // Navegar até a apresentação e esperar renderizar
    await page.goto(presentationUrl, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Contar slides via dots de navegação (usa $$ que retorna locators)
    const slideCount: number = await page.locator('button.rounded-full.bg-white\\/20, button.rounded-full.bg-\\[\\#0fffbf\\]').count();
    const totalSlides = slideCount > 0 ? slideCount : 1;

    // Capturar cada slide como screenshot
    const slideBuffers: Buffer[] = [];

    for (let i = 0; i < totalSlides; i++) {
      if (i > 0) {
        // Navegar com tecla ArrowRight (sem problemas de tipo DOM)
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(600);
      }

      // Capturar o viewport do slide
      const slideElement = await page.$('.relative.bg-white.overflow-hidden.shadow-2xl');
      if (slideElement) {
        const buffer = await slideElement.screenshot({ type: 'png' });
        slideBuffers.push(buffer);
      }
    }

    await browser.close();
    browser = null;

    if (slideBuffers.length === 0) {
      return res.status(500).json({ success: false, error: 'Nenhum slide capturado' });
    }

    // Gerar HTML com todos os slides como imagens para converter em PDF
    const slidesHtml = slideBuffers.map((buf: Buffer, idx: number) => {
      const base64 = buf.toString('base64');
      const pageBreak = idx < slideBuffers.length - 1 ? 'always' : 'auto';
      return `<div style="page-break-after:${pageBreak};width:1280px;height:720px;margin:0;padding:0;"><img src="data:image/png;base64,${base64}" style="width:1280px;height:720px;display:block;" /></div>`;
    }).join('');

    const pdfHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{margin:0;padding:0;box-sizing:border-box;}body{margin:0;padding:0;background:white;}@page{size:1280px 720px;margin:0;}</style></head><body>${slidesHtml}</body></html>`;

    // Gerar PDF com segundo browser (para evitar navegação com estado sujo)
    const browser2 = await chromium.launch({ headless: true });
    const page2 = await browser2.newPage();
    await page2.setContent(pdfHtml, { waitUntil: 'load' });

    const pdfBuffer = await page2.pdf({
      width: '1280px',
      height: '720px',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await browser2.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="DigiUrban_Apresentacao_Comercial_${Date.now()}.pdf"`);
    return res.send(pdfBuffer);

  } catch (error: any) {
    if (browser) {
      try { await browser.close(); } catch (_e) { /* ignore */ }
    }
    console.error('Erro ao exportar apresentação em PDF:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao exportar apresentação em PDF'
    });
  }
});

export default router;
