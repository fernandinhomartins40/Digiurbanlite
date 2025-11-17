/**
 * ============================================================================
 * TESTE E2E: CESTA BÁSICA (PONTA-A-PONTA)
 * ============================================================================
 */

import { test, expect } from '@playwright/test';

test.describe('E2E: Solicitação de Cesta Básica', () => {
  test('Fluxo completo de solicitação de cesta básica', async ({ page }) => {
    // CIDADÃO: Solicitar benefício
    await page.goto('/cidadao');
    await page.fill('[name="cpf"]', '12345678900');
    await page.fill('[name="password"]', 'senha123');
    await page.click('button[type="submit"]');

    await page.click('text=Assistência Social');
    await page.click('text=Solicitar Cesta Básica');

    // Dados do solicitante
    await page.fill('[name="fullName"]', 'Maria Santos');
    await page.fill('[name="cpf"]', '12345678900');
    await page.fill('[name="phone"]', '11987654321');
    await page.fill('[name="address"]', 'Rua das Flores, 45 - Jardim Esperança');

    // Composição familiar
    await page.fill('[name="familyMembers"]', '4');
    await page.check('[name="hasChildren"]');
    await page.fill('[name="childrenCount"]', '2');

    // Situação financeira
    await page.fill('[name="monthlyIncome"]', '600.00');
    await page.check('[name="unemployed"]');
    await page.fill('[name="unemploymentDuration"]', '3'); // meses

    // Justificativa
    await page.fill('[name="justification"]', 'Perdi meu emprego há 3 meses e estou com dificuldades para alimentar minha família. Tenho 2 filhos menores.');

    // Documentos
    await page.locator('input[type="file"]').setInputFiles([
      'tests/fixtures/comprovante_residencia.pdf',
      'tests/fixtures/carteira_trabalho.pdf',
    ]);

    await page.click('button:has-text("Enviar Solicitação")');

    await expect(page.locator('.success-message')).toBeVisible();
    const protocol = (await page.locator('[data-testid="protocol-number"]').textContent())!.trim();

    // ADMIN: Analisar solicitação
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Sair');

    await page.goto('/admin');
    await page.fill('[name="email"]', 'admin.social@test.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.click('text=Assistência Social');
    await page.click('text=Cestas Básicas');

    // Encontrar solicitação
    const requestRow = page.locator(`tr:has-text("Maria Santos")`);
    await expect(requestRow).toContainText(protocol);
    await requestRow.click();

    // Verificar análise de elegibilidade automática
    const eligibilityPanel = page.locator('[data-testid="eligibility-analysis"]');
    await expect(eligibilityPanel).toBeVisible();
    await expect(eligibilityPanel.locator('[data-testid="income-per-capita"]')).toContainText('R$ 150,00'); // 600/4
    await expect(eligibilityPanel.locator('[data-testid="eligibility-status"]')).toContainText('ELEGÍVEL');
    await expect(eligibilityPanel.locator('.indicator.positive')).toBeVisible(); // Renda per capita < R$ 200

    // Verificar documentos enviados
    await page.click('tab:has-text("Documentos")');
    await expect(page.locator('.document-list')).toContainText('comprovante_residencia.pdf');
    await expect(page.locator('.document-list')).toContainText('carteira_trabalho.pdf');

    // Aprovar benefício
    await page.click('tab:has-text("Decisão")');
    await page.selectOption('[name="deliveryLocation"]', 'cras-centro');
    await page.fill('[name="deliveryDate"]', '2025-02-15');
    await page.fill('[name="notes"]', 'Benefício aprovado. Família em situação de vulnerabilidade.');
    await page.click('button:has-text("Aprovar Benefício")');

    await expect(page.locator('.success-message')).toContainText('Benefício aprovado');
    await expect(page.locator('[data-testid="status"]')).toContainText('APROVADO');

    // CIDADÃO: Verificar aprovação
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Sair');

    await page.goto('/cidadao');
    await page.fill('[name="cpf"]', '12345678900');
    await page.fill('[name="password"]', 'senha123');
    await page.click('button[type="submit"]');

    await page.click('text=Meus Protocolos');
    await page.click(`tr:has-text("${protocol}")`);

    await expect(page.locator('[data-testid="status"]')).toContainText('APROVADO');
    await expect(page.locator('[data-testid="delivery-info"]')).toContainText('15/02/2025');
    await expect(page.locator('[data-testid="delivery-location"]')).toContainText('CRAS Centro');

    // Informações de retirada
    await expect(page.locator('.info-box.highlight')).toContainText('Levar documento com foto');
    await expect(page.locator('[data-testid="delivery-hours"]')).toContainText('8h às 17h');
  });

  test('Rejeição por não elegibilidade', async ({ page }) => {
    // Simular caso de renda acima do limite
    await page.goto('/cidadao');
    // Login...

    await page.click('text=Solicitar Cesta Básica');
    await page.fill('[name="fullName"]', 'José Silva');
    await page.fill('[name="familyMembers"]', '2');
    await page.fill('[name="monthlyIncome"]', '2500.00'); // R$ 1250 per capita - acima do limite
    await page.fill('[name="justification"]', 'Preciso de ajuda.');
    await page.click('button:has-text("Enviar Solicitação")');

    // Admin analisa
    // ...

    const eligibilityPanel = page.locator('[data-testid="eligibility-analysis"]');
    await expect(eligibilityPanel.locator('[data-testid="eligibility-status"]')).toContainText('NÃO ELEGÍVEL');
    await expect(eligibilityPanel.locator('.indicator.negative')).toBeVisible();

    await page.click('button:has-text("Rejeitar")');
    await page.fill('[name="rejectionReason"]', 'Renda familiar acima do limite estabelecido para o benefício.');
    await page.click('button:has-text("Confirmar Rejeição")');
  });
});
