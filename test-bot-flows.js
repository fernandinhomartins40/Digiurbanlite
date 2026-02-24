/**
 * Script de Teste dos Fluxos do Bot
 *
 * Testa:
 * 1. Login cidadão
 * 2. Início do fluxo "Solicitar Serviço"
 * 3. Listar serviços
 * 4. Início do fluxo "Consultar Protocolo"
 * 5. Listar protocolos
 * 6. Início do fluxo "Meus Documentos"
 * 7. Listar documentos
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://digiurban.com.br';
const MESSAGES_URL = 'http://localhost:9001'; // Messages server (porta interna)

// Credenciais de teste
const CITIZEN_USER = {
  login: '05282248913', // CPF do seed
  password: 'Admin@123'
};

let citizenToken = null;
let citizenUserId = null;
let botConversationId = null;

// Helper para fazer requisições HTTPS
function makeHttpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      rejectUnauthorized: false // Aceitar certificado self-signed
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Helper para fazer requisições HTTP (messages server)
function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function test() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🧪 TESTE DOS FLUXOS DO BOT - DigiUrban              ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // ========================================================================
    // 1. LOGIN CIDADÃO
    // ========================================================================
    console.log('1️⃣  Login como CIDADÃO (CPF 05282248913)');
    console.log('   ─────────────────────────────');

    const citizenLoginRes = await makeHttpsRequest(`${BASE_URL}/api/citizen/auth/login`, {
      method: 'POST',
      body: CITIZEN_USER
    });

    if (citizenLoginRes.status !== 200) {
      throw new Error(`Login cidadão falhou: ${JSON.stringify(citizenLoginRes.data)}`);
    }

    // Extrair token do cookie
    const citizenCookies = citizenLoginRes.headers['set-cookie'] || [];
    const citizenCookie = citizenCookies.find(c => c.startsWith('digiurban_citizen_token='));
    if (!citizenCookie) {
      throw new Error('Token do cidadão não encontrado nos cookies');
    }
    citizenToken = citizenCookie.split(';')[0].split('=')[1];
    citizenUserId = citizenLoginRes.data.citizen?.id;

    console.log(`   ✅ Login bem-sucedido!`);
    console.log(`   👤 Citizen ID: ${citizenUserId}`);
    console.log(`   🔑 Token: ${citizenToken.substring(0, 20)}...\n`);

    // ========================================================================
    // 2. INICIAR FLUXO "SOLICITAR SERVIÇO"
    // ========================================================================
    console.log('2️⃣  Iniciar fluxo "Solicitar Serviço"');
    console.log('   ─────────────────────────────');

    const startFlowRes = await makeHttpRequest(`${MESSAGES_URL}/api/bot-flow/start`, {
      method: 'POST',
      headers: {
        'Cookie': `digiurban_citizen_token=${citizenToken}`
      },
      body: {
        flowName: 'solicitar_servico'
      }
    });

    if (startFlowRes.status !== 200) {
      throw new Error(`Iniciar fluxo falhou: ${JSON.stringify(startFlowRes.data)}`);
    }

    botConversationId = startFlowRes.data.conversationId;
    console.log(`   ✅ Fluxo iniciado!`);
    console.log(`   💬 Conversation ID: ${botConversationId}`);
    console.log(`   📝 Mensagem: ${startFlowRes.data.response}\n`);

    // ========================================================================
    // 3. LISTAR SERVIÇOS (simular escolha "Ver todos os serviços")
    // ========================================================================
    console.log('3️⃣  Listar serviços (escolher "Ver todos")');
    console.log('   ─────────────────────────────');

    const listServicesRes = await makeHttpRequest(`${MESSAGES_URL}/api/bot-flow/message`, {
      method: 'POST',
      headers: {
        'Cookie': `digiurban_citizen_token=${citizenToken}`
      },
      body: {
        conversationId: botConversationId,
        message: 'listar' // Escolher opção "listar"
      }
    });

    if (listServicesRes.status !== 200) {
      throw new Error(`Listar serviços falhou: ${JSON.stringify(listServicesRes.data)}`);
    }

    console.log(`   ✅ Resposta recebida!`);
    console.log(`   📋 Mensagem: ${listServicesRes.data.response}\n`);

    // ========================================================================
    // 4. RESETAR BOT E TESTAR "CONSULTAR PROTOCOLO"
    // ========================================================================
    console.log('4️⃣  Resetar bot e testar "Consultar Protocolo"');
    console.log('   ─────────────────────────────');

    const resetRes = await makeHttpRequest(`${MESSAGES_URL}/api/bot-flow/reset`, {
      method: 'POST',
      headers: {
        'Cookie': `digiurban_citizen_token=${citizenToken}`
      },
      body: {
        conversationId: botConversationId
      }
    });

    if (resetRes.status !== 200) {
      throw new Error(`Reset bot falhou: ${JSON.stringify(resetRes.data)}`);
    }

    // Iniciar fluxo "Consultar Protocolo"
    const consultarProtocoloRes = await makeHttpRequest(`${MESSAGES_URL}/api/bot-flow/start`, {
      method: 'POST',
      headers: {
        'Cookie': `digiurban_citizen_token=${citizenToken}`
      },
      body: {
        flowName: 'consultar_protocolo'
      }
    });

    console.log(`   ✅ Fluxo "Consultar Protocolo" iniciado!`);
    console.log(`   📝 Mensagem: ${consultarProtocoloRes.data.response}\n`);

    // ========================================================================
    // 5. LISTAR PROTOCOLOS
    // ========================================================================
    console.log('5️⃣  Listar protocolos (escolher "Listar meus protocolos")');
    console.log('   ─────────────────────────────');

    const listProtocolsRes = await makeHttpRequest(`${MESSAGES_URL}/api/bot-flow/message`, {
      method: 'POST',
      headers: {
        'Cookie': `digiurban_citizen_token=${citizenToken}`
      },
      body: {
        conversationId: botConversationId,
        message: 'listar' // Escolher opção "listar"
      }
    });

    console.log(`   ✅ Resposta recebida!`);
    console.log(`   📋 Mensagem: ${listProtocolsRes.data.response}\n`);

    // ========================================================================
    // 6. RESETAR E TESTAR "MEUS DOCUMENTOS"
    // ========================================================================
    console.log('6️⃣  Resetar bot e testar "Meus Documentos"');
    console.log('   ─────────────────────────────');

    await makeHttpRequest(`${MESSAGES_URL}/api/bot-flow/reset`, {
      method: 'POST',
      headers: {
        'Cookie': `digiurban_citizen_token=${citizenToken}`
      },
      body: {
        conversationId: botConversationId
      }
    });

    const documentosRes = await makeHttpRequest(`${MESSAGES_URL}/api/bot-flow/start`, {
      method: 'POST',
      headers: {
        'Cookie': `digiurban_citizen_token=${citizenToken}`
      },
      body: {
        flowName: 'documentos'
      }
    });

    console.log(`   ✅ Fluxo "Meus Documentos" iniciado!`);
    console.log(`   📝 Mensagem: ${documentosRes.data.response}\n`);

    // ========================================================================
    // 7. LISTAR DOCUMENTOS
    // ========================================================================
    console.log('7️⃣  Listar documentos (escolher "Ver todos")');
    console.log('   ─────────────────────────────');

    const listDocsRes = await makeHttpRequest(`${MESSAGES_URL}/api/bot-flow/message`, {
      method: 'POST',
      headers: {
        'Cookie': `digiurban_citizen_token=${citizenToken}`
      },
      body: {
        conversationId: botConversationId,
        message: 'todos' // Escolher opção "todos"
      }
    });

    console.log(`   ✅ Resposta recebida!`);
    console.log(`   📋 Mensagem: ${listDocsRes.data.response}\n`);

    // ========================================================================
    // RESULTADO FINAL
    // ========================================================================
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TESTE CONCLUÍDO!                                   ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('📊 Resumo:');
    console.log(`   • Login Cidadão: ✅ CPF ${CITIZEN_USER.login}`);
    console.log(`   • Solicitar Serviço: ${listServicesRes.data.response.includes('⚠️') || listServicesRes.data.response.includes('❌') ? '❌ ERRO' : '✅ OK'}`);
    console.log(`   • Consultar Protocolo: ${listProtocolsRes.data.response.includes('⚠️') || listProtocolsRes.data.response.includes('❌') ? '❌ ERRO' : '✅ OK'}`);
    console.log(`   • Meus Documentos: ${listDocsRes.data.response.includes('⚠️') || listDocsRes.data.response.includes('❌') ? '❌ ERRO' : '✅ OK'}\n`);

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error('\n   Stack:', error.stack);
    process.exit(1);
  }
}

// Executar teste
test();
