/**
 * Script de teste para criar programa rural via API
 *
 * Para executar:
 * node test-create-programa.js
 */

const testData = {
  name: 'Programa Teste PRONAF',
  programType: 'pronaf',
  description: 'Programa de teste para verificar criação de programas rurais',
  startDate: '2025-01-15',
  coordinator: 'João Silva',
  targetAudience: 'Agricultores familiares',
  budget: 50000,
  status: 'PLANNED'
};

async function testCreatePrograma() {
  try {
    console.log('\n========== TESTE DE CRIAÇÃO DE PROGRAMA RURAL ==========');
    console.log('URL: http://localhost:3001/api/admin/secretarias/agricultura/programas');
    console.log('Dados:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3001/api/admin/secretarias/agricultura/programas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(testData),
    });

    console.log('\nStatus:', response.status);
    console.log('OK:', response.ok);

    const result = await response.json();
    console.log('\nResposta:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ SUCESSO! Programa criado com ID:', result.data?.id);
    } else {
      console.log('\n❌ ERRO:', result.message || result.error);
    }

    console.log('========== FIM DO TESTE ==========\n');

  } catch (error) {
    console.error('\n❌ ERRO NA REQUISIÇÃO:', error.message);
  }
}

// Executar teste
testCreatePrograma();
