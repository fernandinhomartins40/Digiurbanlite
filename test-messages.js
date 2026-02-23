/**
 * Script de Teste do Sistema de Mensagens
 *
 * Testa:
 * 1. Login de SERVIDOR (user@demo.gov.br)
 * 2. Login de CIDADÃO (jose.silva@example.com / CPF 12345678901)
 * 3. Criação de conversa entre eles
 * 4. Envio de mensagens bidirecionais
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'https://digiurban.com.br';
const MESSAGES_URL = 'http://localhost:9001'; // Messages server (porta interna)

// Credenciais de teste
const SERVER_USER = {
  email: 'user@demo.gov.br',
  password: 'User@123'
};

const CITIZEN_USER = {
  login: '12345678901', // Pode ser CPF ou email
  password: 'Cidadao@123'
};

let serverToken = null;
let serverUserId = null;
let citizenToken = null;
let citizenUserId = null;
let conversationId = null;

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
  console.log('║  🧪 TESTE DO SISTEMA DE MENSAGENS - DigiUrban        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // ========================================================================
    // 1. LOGIN SERVIDOR
    // ========================================================================
    console.log('1️⃣  Login como SERVIDOR (user@demo.gov.br)');
    console.log('   ─────────────────────────────');

    const serverLoginRes = await makeHttpsRequest(`${BASE_URL}/api/admin/auth/login`, {
      method: 'POST',
      body: SERVER_USER
    });

    if (serverLoginRes.status !== 200) {
      throw new Error(`Login servidor falhou: ${JSON.stringify(serverLoginRes.data)}`);
    }

    // Extrair token do cookie
    const serverCookies = serverLoginRes.headers['set-cookie'] || [];
    const serverCookie = serverCookies.find(c => c.startsWith('digiurban_admin_token='));
    if (!serverCookie) {
      throw new Error('Token do servidor não encontrado nos cookies');
    }
    serverToken = serverCookie.split(';')[0].split('=')[1];
    serverUserId = serverLoginRes.data.user?.id;

    console.log(`   ✅ Login bem-sucedido!`);
    console.log(`   👤 User ID: ${serverUserId}`);
    console.log(`   🔑 Token: ${serverToken.substring(0, 20)}...\n`);

    // ========================================================================
    // 2. LOGIN CIDADÃO
    // ========================================================================
    console.log('2️⃣  Login como CIDADÃO (CPF 12345678901)');
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
    // 3. CRIAR CONVERSA (Servidor → Cidadão)
    // ========================================================================
    console.log('3️⃣  Criar Conversa (Servidor → Cidadão)');
    console.log('   ─────────────────────────────');

    const createConvRes = await makeHttpRequest(`${MESSAGES_URL}/api/conversations/find-or-create`, {
      method: 'POST',
      headers: {
        'Cookie': `digiurban_admin_token=${serverToken}`
      },
      body: {
        participant1Id: serverUserId,
        participant1Type: 'SERVER',
        participant2Id: citizenUserId,
        participant2Type: 'CITIZEN'
      }
    });

    if (createConvRes.status !== 200) {
      throw new Error(`Criar conversa falhou: ${JSON.stringify(createConvRes.data)}`);
    }

    conversationId = createConvRes.data.id;

    console.log(`   ✅ Conversa criada!`);
    console.log(`   💬 Conversation ID: ${conversationId}`);
    console.log(`   📝 Participantes:`);
    console.log(`      - ${createConvRes.data.participant1Type}: ${createConvRes.data.participant1Id}`);
    console.log(`      - ${createConvRes.data.participant2Type}: ${createConvRes.data.participant2Id}\n`);

    // ========================================================================
    // 4. SERVIDOR ENVIA MENSAGEM
    // ========================================================================
    console.log('4️⃣  Servidor envia mensagem');
    console.log('   ─────────────────────────────');

    const serverMsgRes = await makeHttpRequest(`${MESSAGES_URL}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Cookie': `digiurban_admin_token=${serverToken}`
      },
      body: {
        conversationId,
        content: 'Olá! Sou o servidor de teste. Esta mensagem foi enviada automaticamente para validar o sistema.',
        type: 'TEXT'
      }
    });

    if (serverMsgRes.status !== 200 && serverMsgRes.status !== 201) {
      throw new Error(`Envio mensagem servidor falhou: ${JSON.stringify(serverMsgRes.data)}`);
    }

    console.log(`   ✅ Mensagem enviada pelo servidor!`);
    console.log(`   📨 ID: ${serverMsgRes.data.id}`);
    console.log(`   💬 Conteúdo: "${serverMsgRes.data.content}"\n`);

    // ========================================================================
    // 5. CIDADÃO ENVIA MENSAGEM
    // ========================================================================
    console.log('5️⃣  Cidadão envia mensagem');
    console.log('   ─────────────────────────────');

    const citizenMsgRes = await makeHttpRequest(`${MESSAGES_URL}/api/messages/send`, {
      method: 'POST',
      headers: {
        'Cookie': `digiurban_citizen_token=${citizenToken}`
      },
      body: {
        conversationId,
        content: 'Olá! Sou o cidadão de teste. Recebi sua mensagem e estou respondendo!',
        type: 'TEXT'
      }
    });

    if (citizenMsgRes.status !== 200 && citizenMsgRes.status !== 201) {
      throw new Error(`Envio mensagem cidadão falhou: ${JSON.stringify(citizenMsgRes.data)}`);
    }

    console.log(`   ✅ Mensagem enviada pelo cidadão!`);
    console.log(`   📨 ID: ${citizenMsgRes.data.id}`);
    console.log(`   💬 Conteúdo: "${citizenMsgRes.data.content}"\n`);

    // ========================================================================
    // 6. VERIFICAR MENSAGENS DA CONVERSA
    // ========================================================================
    console.log('6️⃣  Verificar mensagens da conversa');
    console.log('   ─────────────────────────────');

    const messagesRes = await makeHttpRequest(`${MESSAGES_URL}/api/messages/conversation/${conversationId}`, {
      method: 'GET',
      headers: {
        'Cookie': `digiurban_admin_token=${serverToken}`
      }
    });

    if (messagesRes.status !== 200) {
      throw new Error(`Buscar mensagens falhou: ${JSON.stringify(messagesRes.data)}`);
    }

    const messages = messagesRes.data;
    console.log(`   ✅ Total de mensagens: ${messages.length}`);
    console.log(`   📋 Histórico:`);
    messages.forEach((msg, i) => {
      const sender = msg.senderType === 'SERVER' ? '👨‍💼 Servidor' : '👤 Cidadão';
      console.log(`      ${i + 1}. ${sender}: "${msg.content}"`);
    });

    // ========================================================================
    // RESULTADO FINAL
    // ========================================================================
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║  ✅ TESTE CONCLUÍDO COM SUCESSO!                      ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('📊 Resumo:');
    console.log(`   • Login Servidor: ✅ ${SERVER_USER.email}`);
    console.log(`   • Login Cidadão: ✅ CPF ${CITIZEN_USER.cpf}`);
    console.log(`   • Conversa Criada: ✅ ID ${conversationId}`);
    console.log(`   • Mensagens Trocadas: ✅ ${messages.length} mensagens`);
    console.log(`   • Sistema de Mensagens: ✅ FUNCIONANDO\n`);

  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.error('\n   Stack:', error.stack);
    process.exit(1);
  }
}

// Executar teste
test();
