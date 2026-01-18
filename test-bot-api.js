// Script para testar a API do bot
const https = require('https');

// Primeiro, fazer login para pegar o token
const loginData = JSON.stringify({
  cpf: "12345678900", // Substitua pelo CPF de teste
  password: "123456" // Substitua pela senha
});

const loginOptions = {
  hostname: 'digiurban.com.br',
  port: 443,
  path: '/api/auth/citizen/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

console.log('🔐 Tentando fazer login...\n');

const loginReq = https.request(loginOptions, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ Login response:', JSON.stringify(response, null, 2));

      if (response.token || response.access_token) {
        const token = response.token || response.access_token;
        console.log('\n📨 Testando mensagem para o bot...\n');

        // Agora testar o bot
        const botData = JSON.stringify({
          message: "oi"
        });

        const botOptions = {
          hostname: 'digiurban.com.br',
          port: 443,
          path: '/api/bot/message',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': botData.length,
            'Authorization': `Bearer ${token}`
          }
        };

        const botReq = https.request(botOptions, (botRes) => {
          let botData = '';

          botRes.on('data', (chunk) => {
            botData += chunk;
          });

          botRes.on('end', () => {
            console.log('🤖 Bot response:');
            console.log(JSON.stringify(JSON.parse(botData), null, 2));
          });
        });

        botReq.on('error', (error) => {
          console.error('❌ Erro ao chamar bot:', error);
        });

        botReq.write(botData);
        botReq.end();
      } else {
        console.error('❌ Token não encontrado na resposta');
      }
    } catch (error) {
      console.error('❌ Erro ao processar resposta:', error);
      console.log('Raw response:', data);
    }
  });
});

loginReq.on('error', (error) => {
  console.error('❌ Erro ao fazer login:', error);
});

loginReq.write(loginData);
loginReq.end();
