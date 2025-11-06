/**
 * ============================================================================
 * TESTE E2E: BURACO NA RUA (PONTA-A-PONTA)
 * ============================================================================
 */

import { test, expect } from '@playwright/test';

test.describe('E2E: Reportar Buraco na Rua', () => {
  test('Fluxo completo de reporte de problema de infraestrutura', async ({ page }) => {
    // CIDADÃO: Reportar problema
    await page.goto('/cidadao');
    await page.fill('[name="cpf"]', '12345678900');
    await page.fill('[name="password"]', 'senha123');
    await page.click('button[type="submit"]');

    await page.click('text=Obras Públicas');
    await page.click('text=Reportar Buraco na Rua');

    // Localização do problema
    await page.fill('[name="location"]', 'Rua das Palmeiras, em frente ao nº 234');
    await page.fill('[name="neighborhood"]', 'Centro');

    // Permitir geolocalização (simulado)
    await page.click('button:has-text("Usar Minha Localização")');
    // GPS coordinates seriam capturados aqui

    // Descrição do problema
    await page.fill('[name="description"]', 'Buraco grande na pista, cerca de 2 metros de diâmetro e 30cm de profundidade. Risco de acidentes.');

    // Tamanho estimado
    await page.selectOption('[name="size"]', 'Grande (> 3m)');

    // Severidade
    await page.selectOption('[name="severity"]', 'Alta');

    // Upload de fotos
    await page.locator('input[type="file"][name="photos"]').setInputFiles([
      'tests/fixtures/buraco_foto1.jpg',
      'tests/fixtures/buraco_foto2.jpg',
      'tests/fixtures/buraco_foto3.jpg',
    ]);

    // Verificar preview das fotos
    await expect(page.locator('.photo-preview')).toHaveCount(3);

    // Informações de contato
    await page.fill('[name="contactPhone"]', '11987654321');
    await page.check('[name="notifyUpdates"]');

    await page.click('button:has-text("Reportar Problema")');

    await expect(page.locator('.success-message')).toContainText('Problema reportado');
    const protocol = (await page.locator('[data-testid="protocol-number"]').textContent())!.trim();

    // Visualizar no mapa
    await expect(page.locator('[data-testid="problem-map"]')).toBeVisible();
    await expect(page.locator('.map-marker.new')).toBeVisible(); // Marcador do problema no mapa

    // ADMIN: Visualizar e priorizar
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Sair');

    await page.goto('/admin');
    await page.fill('[name="email"]', 'admin.obras@test.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.click('text=Obras Públicas');
    await page.click('text=Problemas de Infraestrutura');

    // Verificar dashboard com mapa
    await expect(page.locator('[data-testid="problems-map"]')).toBeVisible();
    await expect(page.locator('.map-marker.high-severity')).toBeVisible();

    // Filtrar por severidade alta
    await page.selectOption('[name="severityFilter"]', 'Alta');
    await page.click('button:has-text("Filtrar")');

    // Encontrar problema
    const problemRow = page.locator(`tr:has-text("${protocol}")`);
    await expect(problemRow).toContainText('Rua das Palmeiras');
    await expect(problemRow).toHaveClass(/severity-high/);
    await problemRow.click();

    // Visualizar detalhes e fotos
    await expect(page.locator('[data-testid="problem-details"]')).toBeVisible();
    await expect(page.locator('.photo-gallery img')).toHaveCount(3);

    // Clicar para ampliar foto
    await page.click('.photo-gallery img:first-child');
    await expect(page.locator('.lightbox')).toBeVisible();
    await page.click('.lightbox-close');

    // Verificar localização no mapa
    await expect(page.locator('[data-testid="location-map"]')).toBeVisible();

    // Atribuir equipe
    await page.click('tab:has-text("Atribuição")');
    await page.selectOption('[name="teamId"]', 'equipe-pavimentacao-1');
    await expect(page.locator('[data-testid="team-name"]')).toContainText('Equipe Pavimentação 1');
    await expect(page.locator('[data-testid="team-members"]')).toContainText('5 membros');

    // Estimar recursos
    await page.fill('[name="estimatedMaterials"]', 'Asfalto frio (2 sacos), areia, água');
    await page.fill('[name="estimatedCost"]', '350.00');
    await page.fill('[name="estimatedDuration"]', '4'); // horas

    // Agendar serviço
    await page.fill('[name="scheduledDate"]', '2025-02-10');
    await page.fill('[name="scheduledTime"]', '08:00');

    await page.click('button:has-text("Atribuir e Agendar")');

    await expect(page.locator('.success-message')).toContainText('Serviço agendado');
    await expect(page.locator('[data-testid="status"]')).toContainText('EM_ANDAMENTO');

    // CIDADÃO: Acompanhar progresso
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Sair');

    await page.goto('/cidadao');
    await page.fill('[name="cpf"]', '12345678900');
    await page.fill('[name="password"]', 'senha123');
    await page.click('button[type="submit"]');

    await page.click('text=Meus Protocolos');
    await page.click(`tr:has-text("${protocol}")`);

    // Verificar timeline do serviço
    const timeline = page.locator('[data-testid="service-timeline"]');
    await expect(timeline).toBeVisible();
    await expect(timeline.locator('.step.completed:has-text("Reportado")')).toBeVisible();
    await expect(timeline.locator('.step.completed:has-text("Em análise")')).toBeVisible();
    await expect(timeline.locator('.step.active:has-text("Agendado")')).toBeVisible();
    await expect(timeline.locator('.step:has-text("Concluído")')).toBeVisible();

    // Informações de agendamento
    await expect(page.locator('[data-testid="scheduled-info"]')).toContainText('10/02/2025 às 08:00');
    await expect(page.locator('[data-testid="assigned-team"]')).toContainText('Equipe Pavimentação 1');

    // ADMIN: Marcar como concluído
    // ...login admin...
    await page.goto('/admin/obras-publicas/problemas');
    await page.click(`tr:has-text("${protocol}")`);

    await page.click('tab:has-text("Conclusão")');
    await page.fill('[name="workDescription"]', 'Buraco tapado com asfalto frio. Compactação realizada.');
    await page.fill('[name="actualCost"]', '320.00');
    await page.fill('[name="actualDuration"]', '3.5'); // horas

    // Upload de fotos do trabalho concluído
    await page.locator('input[type="file"][name="afterPhotos"]').setInputFiles([
      'tests/fixtures/buraco_concluido1.jpg',
      'tests/fixtures/buraco_concluido2.jpg',
    ]);

    await page.click('button:has-text("Marcar como Concluído")');

    await expect(page.locator('.success-message')).toContainText('Serviço concluído');
    await expect(page.locator('[data-testid="status"]')).toContainText('CONCLUÍDO');

    // CIDADÃO: Avaliar serviço
    // ...login cidadão...
    await page.goto('/cidadao/protocolos');
    await page.click(`tr:has-text("${protocol}")`);

    await expect(page.locator('[data-testid="status"]')).toContainText('CONCLUÍDO');
    await expect(page.locator('.notification.success')).toContainText('Serviço concluído');

    // Visualizar fotos antes/depois
    await page.click('button:has-text("Ver Fotos Antes/Depois")');
    await expect(page.locator('.comparison-slider')).toBeVisible();

    // Avaliar serviço
    await page.click('button:has-text("Avaliar Serviço")');
    await page.click('[data-rating="5"]'); // 5 estrelas
    await page.fill('[name="feedback"]', 'Serviço excelente! Problema resolvido rapidamente.');
    await page.click('button:has-text("Enviar Avaliação")');

    await expect(page.locator('.success-message')).toContainText('Avaliação enviada');
  });

  test('Visualização de mapa de problemas reportados', async ({ page }) => {
    await page.goto('/cidadao');
    // Login...

    await page.click('text=Mapa de Problemas');

    // Mapa deve mostrar todos os problemas da cidade
    await expect(page.locator('[data-testid="city-map"]')).toBeVisible();
    await expect(page.locator('.map-marker')).toHaveCount(10); // Exemplo

    // Filtrar por tipo
    await page.check('[name="filter-buracos"]');
    await page.uncheck('[name="filter-iluminacao"]');

    await expect(page.locator('.map-marker.pothole')).toBeVisible();

    // Clicar em marcador para ver detalhes
    await page.click('.map-marker:first-child');
    await expect(page.locator('.map-popup')).toBeVisible();
    await expect(page.locator('.map-popup')).toContainText('Rua das Palmeiras');
    await expect(page.locator('.map-popup [data-testid="status"]')).toContainText('EM_ANDAMENTO');
  });
});
