/**
 * Script de Teste do Bot Flow
 *
 * Testa o fluxo completo:
 * 1. Login cidadão
 * 2. Iniciar fluxo do bot
 * 3. Escolher "Solicitar Serviço"
 * 4. Listar serviços
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://digiurban.com.br';
const MESSAGES_URL = 'http://localhost:9001';

// Credenciais
const CITIZEN_USER = {
  login: '12345678901',
  password: 'Cidadao@123'
};

let citizenToken = null;
let citizenId = null;
let conversationId = null;

// Helper HTTP
function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const requester = isHttps ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      rejectUnauthorized: false
    };

    const req = requester.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => reject(error));
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

async function test() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🧪 TESTE DO BOT FLOW - DigiUrban                    ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Login cidadão
    console.log('1️⃣  Login como CIDADÃO');
    console.log('   ─────────────────────────────');

    const loginRes = await makeHttpRequest(`${BASE_URL}/api/citizen/auth/login`, {
      method: 'POST',
      body: CITIZEN_USER
    });

    if (loginRes.status !== 200) {
      throw new Error(`Login falhou: ${JSON.stringify(loginRes.data)}`);
    }

    const cookies = loginRes.headers['set-cookie'] || [];
    const cookie = cookies.find(c => c.startsWith('digiurban_citizen_token='));
    if (!cookie) {
      throw new Error('Token não encontrado nos cookies');
    }
    citizenToken = cookie.split(';')[0].split('=')[1];
    citizenId = loginRes.data.citizen?.id;

    console.log(`   ✅ Login OK - Citizen ID: ${citizenId}\n`);

    // 2. Iniciar fluxo do bot
    console.log('2️⃣  Iniciar fluxo do bot');
    console.log('   ─────────────────────────────');

    const startRes = await makeHttpRequest(`${MESSAGES_URL}/api/bot-flow/start`, {
      method: 'POST',
      headers: { 'Cookie': `digiurban_citizen_token=${citizenToken}` },
      body: { flowName: 'menu_principal' }
    });

    if (startRes.status !== 200) {
      throw new Error(`Iniciar fluxo falhou: ${JSON.stringify(startRes.data)}`);
    }

    conversationId = startRes.data.conversationId;
    console.log(`   ✅ Fluxo iniciado - Conversa: ${conversationId}`);
    console.log(`   📝 Mensagem bot:\n      "${startRes.data.message}"\n`);

    // 3. Escolher "Solicitar Serviço"
    console.log('3️⃣  Escolher "Solicitar Serviço"');
    console.log('   ─────────────────────────────');

    const choiceRes = await makeHttpRequest(`${MESSAGES_URL}/api/bot-flow/message`, {
      method: 'POST',
      headers: { 'Cookie': `digiurban_citizen_token=${citizenToken}` },
      body: {
        conversationId,
        userInput: 'solicitar_servico'
      }
    });

    if (choiceRes.status !== 200) {
      throw new Error(`Escolha falhou: ${JSON.stringify(choiceRes.data)}`);
    }

    console.log(`   ✅ Opção selecionada`);
    console.log(`   📝 Mensagem bot:\n      "${choiceRes.data.message}"\n`);

    // 4. Escolher "Ver todos os serviços"
    console.log('4️⃣  Escolher "Ver todos os serviços"');
    console.log('   ─────────────────────────────');

    const listRes = await makeHttpRequest(`${MESSAGES_URL}/api/bot-flow/message`, {
      method: 'POST',
      headers: { 'Cookie': `digiurban_citizen_token=${citizenToken}` },
      body: {
        conversationId,
        userInput: 'listar'
      }
    });

    if (listRes.status !== 200) {
      throw new Error(`Listar serviços falhou: ${JSON.stringify(listRes.data)}`);
    }

    console.log(`   ✅ Serviços listados`);
    console.log(`   📝 Mensagem bot:\n      "${listRes.data.message}"`);

    if (listRes.data.metadata?.options) {
      console.log(`\n   📋 ${listRes.data.metadata.options.length} serviços disponíveis:`);
      listRes.data.metadata.options.slice(0, 5).forEach((opt, i) => {
        console.log(`      ${i + 1}. ${opt.label}`);
      });
      if (listRes.data.metadata.options.length > 5) {
        console.log(`      ... e mais ${listRes.data.metadata.options.length - 5} serviços`);
      }
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TESTE CONCLUÍDO COM SUCESSO!                      ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error('\n   Stack:', error.stack);
    process.exit(1);
  }
}

test();
