/**
 * ============================================================================
 * TESTE E2E: MATRÍCULA ESCOLAR (PONTA-A-PONTA)
 * ============================================================================
 *
 * Fluxo completo:
 * 1. Cidadão acessa portal
 * 2. Seleciona serviço de matrícula
 * 3. Preenche formulário
 * 4. Envia solicitação
 * 5. Recebe protocolo
 * 6. Admin visualiza matrícula
 * 7. Admin aprova matrícula
 * 8. Cidadão é notificado
 */

import { test, expect } from '@playwright/test';

test.describe('E2E: Matrícula Escolar', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Criar dados de teste no banco (seed)
    // Aqui poderia chamar API de setup ou usar fixtures
  });

  test('Fluxo completo de matrícula escolar', async ({ page }) => {
    // ========================================================================
    // PARTE 1: CIDADÃO - Solicitar Matrícula
    // ========================================================================

    // 1. Acessar portal do cidadão
    await page.goto('/cidadao');
    await expect(page.locator('h1')).toContainText('Portal do Cidadão');

    // 2. Fazer login como cidadão
    await page.click('text=Entrar');
    await page.fill('[name="cpf"]', '12345678900');
    await page.fill('[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*cidadao/);

    // 3. Navegar para serviços
    await page.click('text=Serviços');
    await expect(page.locator('h2')).toContainText('Serviços Disponíveis');

    // 4. Filtrar por categoria Educação
    await page.click('text=Educação');
    await expect(page.locator('[data-category="education"]')).toBeVisible();

    // 5. Selecionar "Matrícula Escolar"
    await page.click('text=Matrícula Escolar');
    await expect(page.locator('h1')).toContainText('Matrícula Escolar');

    // 6. Preencher formulário de matrícula
    await page.fill('[name="studentName"]', 'Ana Clara Silva');
    await page.fill('[name="birthDate"]', '2015-03-20');
    await page.fill('[name="parentName"]', 'Maria Silva');
    await page.fill('[name="parentCpf"]', '98765432100');
    await page.fill('[name="parentPhone"]', '11987654321');
    await page.fill('[name="address"]', 'Rua das Flores, 123 - Centro');
    await page.selectOption('[name="desiredGrade"]', '1º ano');
    await page.selectOption('[name="desiredShift"]', 'Matutino');

    // 7. Enviar solicitação
    await page.click('button:has-text("Enviar Solicitação")');

    // 8. Verificar confirmação e protocolo
    await expect(page.locator('.success-message')).toContainText('Solicitação enviada');
    const protocolNumber = await page.locator('[data-testid="protocol-number"]').textContent();
    expect(protocolNumber).toMatch(/\d{4}\/\d{6}/); // Formato: 2025/000001

    // 9. Salvar número do protocolo para usar depois
    const protocol = protocolNumber!.trim();

    // ========================================================================
    // PARTE 2: ADMIN - Visualizar e Aprovar Matrícula
    // ========================================================================

    // 10. Fazer logout do cidadão
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Sair');

    // 11. Fazer login como admin
    await page.goto('/admin');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*admin/);

    // 12. Navegar para Secretaria de Educação
    await page.click('text=Secretarias');
    await page.click('text=Educação');
    await expect(page.locator('h1')).toContainText('Secretaria de Educação');

    // 13. Acessar Matrículas
    await page.click('text=Matrículas');
    await expect(page.locator('h2')).toContainText('Matrículas');

    // 14. Filtrar matrículas pendentes
    await page.selectOption('[name="status"]', 'PENDING');
    await page.click('button:has-text("Filtrar")');

    // 15. Encontrar matrícula de Ana Clara
    const enrollmentRow = page.locator(`tr:has-text("Ana Clara Silva")`);
    await expect(enrollmentRow).toBeVisible();
    await expect(enrollmentRow).toContainText(protocol);

    // 16. Abrir detalhes da matrícula
    await enrollmentRow.click();
    await expect(page.locator('[data-testid="enrollment-details"]')).toBeVisible();

    // 17. Verificar dados do estudante
    await expect(page.locator('[data-testid="student-name"]')).toContainText('Ana Clara Silva');
    await expect(page.locator('[data-testid="parent-name"]')).toContainText('Maria Silva');
    await expect(page.locator('[data-testid="desired-grade"]')).toContainText('1º ano');

    // 18. Aprovar matrícula
    await page.selectOption('[name="classId"]', 'class-1a-matutino');
    await page.fill('[name="notes"]', 'Matrícula aprovada. Turma 1º A - Matutino.');
    await page.click('button:has-text("Aprovar Matrícula")');

    // 19. Verificar confirmação de aprovação
    await expect(page.locator('.success-message')).toContainText('Matrícula aprovada');
    await expect(page.locator('[data-testid="status"]')).toContainText('APROVADA');

    // ========================================================================
    // PARTE 3: CIDADÃO - Verificar Aprovação
    // ========================================================================

    // 20. Fazer logout do admin
    await page.click('[data-testid="user-menu"]');
    await page.click('text=Sair');

    // 21. Fazer login novamente como cidadão
    await page.goto('/cidadao');
    await page.fill('[name="cpf"]', '12345678900');
    await page.fill('[name="password"]', 'senha123');
    await page.click('button[type="submit"]');

    // 22. Acessar "Meus Protocolos"
    await page.click('text=Meus Protocolos');
    await expect(page.locator('h2')).toContainText('Meus Protocolos');

    // 23. Encontrar protocolo da matrícula
    const protocolRow = page.locator(`tr:has-text("${protocol}")`);
    await expect(protocolRow).toBeVisible();
    await expect(protocolRow).toContainText('APROVADO');

    // 24. Abrir detalhes do protocolo
    await protocolRow.click();
    await expect(page.locator('[data-testid="protocol-details"]')).toBeVisible();

    // 25. Verificar informações de aprovação
    await expect(page.locator('[data-testid="status"]')).toContainText('APROVADO');
    await expect(page.locator('[data-testid="notes"]')).toContainText('Matrícula aprovada');
    await expect(page.locator('[data-testid="assigned-class"]')).toContainText('1º A - Matutino');

    // 26. Verificar que notificação foi recebida
    await page.click('[data-testid="notifications-icon"]');
    await expect(page.locator('.notification')).toContainText(`Protocolo ${protocol} aprovado`);
  });

  test('Fluxo de rejeição de matrícula', async ({ page }) => {
    // 1. Admin rejeita matrícula por documentação incompleta
    await page.goto('/admin');
    await page.fill('[name="email"]', 'admin@test.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.click('text=Educação');
    await page.click('text=Matrículas');
    await page.click('tr:first-child');

    await page.click('button:has-text("Rejeitar")');
    await page.fill('[name="rejectionReason"]', 'Documentação incompleta. Favor enviar comprovante de residência atualizado.');
    await page.click('button:has-text("Confirmar Rejeição")');

    await expect(page.locator('.success-message')).toContainText('Matrícula rejeitada');
    await expect(page.locator('[data-testid="status"]')).toContainText('REJEITADO');
  });

  test('Validação de campos obrigatórios', async ({ page }) => {
    await page.goto('/cidadao');
    // Login...
    await page.click('text=Matrícula Escolar');

    // Tentar enviar sem preencher campos obrigatórios
    await page.click('button:has-text("Enviar Solicitação")');

    // Verificar mensagens de validação
    await expect(page.locator('[data-field="studentName"] .error')).toContainText('Campo obrigatório');
    await expect(page.locator('[data-field="birthDate"] .error')).toContainText('Campo obrigatório');
    await expect(page.locator('[data-field="parentName"] .error')).toContainText('Campo obrigatório');
  });

  test('Upload de documentos', async ({ page }) => {
    await page.goto('/cidadao');
    // Login...
    await page.click('text=Matrícula Escolar');

    // Preencher formulário...

    // Upload de documentos
    const fileInput = page.locator('input[type="file"][name="documents"]');
    await fileInput.setInputFiles([
      'tests/fixtures/certidao_nascimento.pdf',
      'tests/fixtures/comprovante_residencia.pdf',
    ]);

    await expect(page.locator('.uploaded-file:has-text("certidao_nascimento.pdf")')).toBeVisible();
    await expect(page.locator('.uploaded-file:has-text("comprovante_residencia.pdf")')).toBeVisible();
  });
});
