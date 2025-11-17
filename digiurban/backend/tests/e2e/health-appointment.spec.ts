/**
 * ============================================================================
 * TESTE E2E: CONSULTA MÉDICA (PONTA-A-PONTA)
 * ============================================================================
 *
 * Fluxo completo:
 * 1. Cidadão solicita consulta médica
 * 2. Admin agenda consulta
 * 3. Cidadão confirma agendamento
 */

import { test, expect } from '@playwright/test';

test.describe('E2E: Consulta Médica', () => {
  test('Fluxo completo de agendamento de consulta', async ({ page }) => {
    // ========================================================================
    // CIDADÃO: Solicitar Consulta
    // ========================================================================

    await page.goto('/cidadao');
    await page.fill('[name="cpf"]', '12345678900');
    await page.fill('[name="password"]', 'senha123');
    await page.click('button[type="submit"]');

    await page.click('text=Serviços');
    await page.click('text=Saúde');
    await page.click('text=Agendar Consulta Médica');

    // Preencher dados do paciente
    await page.fill('[name="patientName"]', 'João Santos');
    await page.fill('[name="patientCpf"]', '98765432100');
    await page.fill('[name="patientBirthDate"]', '1985-06-15');
    await page.fill('[name="patientPhone"]', '11987654321');

    // Selecionar especialidade
    await page.selectOption('[name="specialty"]', 'Cardiologia');

    // Data preferida
    await page.fill('[name="preferredDate"]', '2025-02-20');
    await page.selectOption('[name="preferredShift"]', 'Manhã');

    // Motivo da consulta
    await page.fill('[name="symptoms"]', 'Dor no peito ao fazer esforço físico, falta de ar.');
    await page.selectOption('[name="urgency"]', 'HIGH');

    // Informações adicionais
    await page.check('[name="hasChronicDisease"]');
    await page.fill('[name="chronicDiseases"]', 'Hipertensão arterial');
    await page.fill('[name="currentMedications"]', 'Losartana 50mg (1x dia)');

    // Enviar
    await page.click('button:has-text("Solicitar Consulta")');

    await expect(page.locator('.success-message')).toContainText('Solicitação enviada');
    const protocol = (await page.locator('[data-testid="protocol-number"]').textContent())!.trim();

    // ========================================================================
    // ADMIN: Visualizar e Agendar Consulta
    // ========================================================================

    await page.click('[data-testid="user-menu"]');
    await page.click('text=Sair');

    await page.goto('/admin');
    await page.fill('[name="email"]', 'admin.saude@test.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.click('text=Saúde');
    await page.click('text=Consultas');

    // Filtrar por urgência alta
    await page.selectOption('[name="urgencyFilter"]', 'HIGH');
    await page.click('button:has-text("Filtrar")');

    // Verificar que consulta de João aparece em destaque
    const appointmentRow = page.locator(`tr:has-text("João Santos")`);
    await expect(appointmentRow).toHaveClass(/urgent/);
    await expect(appointmentRow).toContainText('Cardiologia');
    await expect(appointmentRow).toContainText(protocol);

    // Abrir detalhes
    await appointmentRow.click();
    await expect(page.locator('[data-testid="appointment-details"]')).toBeVisible();

    // Verificar dados do paciente e sintomas
    await expect(page.locator('[data-testid="symptoms"]')).toContainText('Dor no peito');
    await expect(page.locator('[data-testid="chronic-diseases"]')).toContainText('Hipertensão');
    await expect(page.locator('[data-testid="urgency-badge"]')).toHaveClass(/high/);

    // Agendar consulta
    await page.click('button:has-text("Agendar Consulta")');

    // Selecionar data e hora
    await page.fill('[name="scheduledDate"]', '2025-02-21');
    await page.fill('[name="scheduledTime"]', '09:00');

    // Selecionar médico
    await page.selectOption('[name="doctorId"]', 'dr-cardio-001');
    await expect(page.locator('[data-testid="doctor-name"]')).toContainText('Dr. Carlos Souza');
    await expect(page.locator('[data-testid="doctor-specialty"]')).toContainText('Cardiologista');

    // Local
    await page.selectOption('[name="locationId"]', 'ubs-central');
    await expect(page.locator('[data-testid="location-name"]')).toContainText('UBS Central');
    await expect(page.locator('[data-testid="location-address"]')).toContainText('Rua Principal, 100');

    // Observações
    await page.fill('[name="notes"]', 'Paciente com histórico de hipertensão. Trazer exames anteriores se houver.');

    // Confirmar agendamento
    await page.click('button:has-text("Confirmar Agendamento")');

    await expect(page.locator('.success-message')).toContainText('Consulta agendada');
    await expect(page.locator('[data-testid="status"]')).toContainText('AGENDADA');
    await expect(page.locator('[data-testid="scheduled-info"]')).toContainText('21/02/2025 às 09:00');

    // ========================================================================
    // CIDADÃO: Verificar Agendamento
    // ========================================================================

    await page.click('[data-testid="user-menu"]');
    await page.click('text=Sair');

    await page.goto('/cidadao');
    await page.fill('[name="cpf"]', '12345678900');
    await page.fill('[name="password"]', 'senha123');
    await page.click('button[type="submit"]');

    await page.click('text=Minhas Consultas');

    const consultaAgendada = page.locator('.appointment-card:has-text("João Santos")');
    await expect(consultaAgendada).toBeVisible();
    await expect(consultaAgendada).toContainText('21/02/2025 às 09:00');
    await expect(consultaAgendada).toContainText('Dr. Carlos Souza');
    await expect(consultaAgendada).toContainText('UBS Central');
    await expect(consultaAgendada).toContainText('Cardiologia');

    // Clicar para ver detalhes
    await consultaAgendada.click();
    await expect(page.locator('[data-testid="appointment-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="map"]')).toBeVisible(); // Mapa do local
    await expect(page.locator('[data-testid="notes"]')).toContainText('Trazer exames anteriores');

    // Botão de adicionar à agenda
    await expect(page.locator('button:has-text("Adicionar à Agenda")')).toBeVisible();
  });

  test('Reagendamento de consulta', async ({ page }) => {
    // Cidadão solicita reagendamento
    await page.goto('/cidadao');
    // Login...

    await page.click('text=Minhas Consultas');
    await page.click('.appointment-card:first-child');
    await page.click('button:has-text("Solicitar Reagendamento")');

    await page.fill('[name="reason"]', 'Não poderei comparecer no dia agendado devido a compromisso de trabalho.');
    await page.fill('[name="newPreferredDate"]', '2025-03-01');
    await page.click('button:has-text("Enviar Solicitação")');

    await expect(page.locator('.success-message')).toContainText('Solicitação de reagendamento enviada');
    await expect(page.locator('[data-testid="status"]')).toContainText('REAGENDAMENTO_SOLICITADO');
  });

  test('Cancelamento de consulta', async ({ page }) => {
    await page.goto('/cidadao');
    // Login...

    await page.click('text=Minhas Consultas');
    await page.click('.appointment-card:first-child');
    await page.click('button:has-text("Cancelar Consulta")');

    // Confirmação
    await page.fill('[name="cancellationReason"]', 'Problema resolvido.');
    await page.click('button:has-text("Confirmar Cancelamento")');

    await expect(page.locator('.warning-message')).toContainText('Consulta cancelada');
  });

  test('Consulta urgente - fluxo prioritário', async ({ page }) => {
    // Quando urgência é URGENT, admin recebe notificação imediata
    await page.goto('/cidadao');
    // Login...

    await page.click('text=Agendar Consulta');
    await page.fill('[name="patientName"]', 'Paciente Urgente');
    await page.selectOption('[name="specialty"]', 'Clínico Geral');
    await page.fill('[name="symptoms"]', 'Dor intensa no abdômen, vômitos, febre alta.');
    await page.selectOption('[name="urgency"]', 'URGENT');
    await page.click('button:has-text("Solicitar Consulta")');

    // Verificar mensagem especial para casos urgentes
    await expect(page.locator('.urgent-alert')).toContainText('Caso urgente');
    await expect(page.locator('.urgent-alert')).toContainText('Entraremos em contato em até 2 horas');

    // Admin verifica
    // ...login admin...
    await page.goto('/admin/saude/consultas');

    // Verificar que notificação urgente aparece
    await expect(page.locator('.notification.urgent')).toBeVisible();
    await expect(page.locator('.notification.urgent')).toContainText('Nova consulta URGENTE');

    // Consulta aparece no topo da lista
    const firstRow = page.locator('tbody tr:first-child');
    await expect(firstRow).toContainText('Paciente Urgente');
    await expect(firstRow).toHaveClass(/urgent-row/);
  });
});
