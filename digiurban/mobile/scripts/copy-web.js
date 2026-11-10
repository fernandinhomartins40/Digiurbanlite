// Gera www/ (a única parte local do app): cópia do offline.html do PWA.
// Aparece quando o site não abre (server.errorPath) e tenta de novo sozinho.
const fs = require('fs');
const path = require('path');

const START_URL = 'https://digiurban.com.br/cidadao';
const SRC = path.join(__dirname, '..', '..', 'frontend', 'public', 'offline.html');
const OUT = path.join(__dirname, '..', 'www');

// No app a página é local: "voltar" e "/cidadao" não levam ao site, então troca o script.
const RETRY_SCRIPT = `<script>
    var START_URL = ${JSON.stringify(START_URL)};
    var retryBtn = document.getElementById('retryBtn');
    var retryText = document.getElementById('retryText');
    var onlineStatus = document.getElementById('onlineStatus');
    function updateOnlineStatus() {
      retryText.textContent = navigator.onLine ? 'Tentar Novamente' : 'Aguardando Conexão...';
      onlineStatus.classList.toggle('show', navigator.onLine);
    }
    function tryAgain() { window.location.replace(START_URL); }
    function goHome() { window.location.replace(START_URL); }
    window.addEventListener('online', function () { updateOnlineStatus(); setTimeout(tryAgain, 1000); });
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    // site fora do ar com rede ligada: tenta de novo a cada 20 s
    setInterval(function () { if (navigator.onLine) tryAgain(); }, 20000);
  </script>`;

function build(html) {
  const re = /<script>[\s\S]*?<\/script>/;
  if (!re.test(html)) throw new Error('offline.html sem <script>: revise scripts/copy-web.js');
  return html.replace(re, RETRY_SCRIPT);
}

if (require.main === module) {
  const page = build(fs.readFileSync(SRC, 'utf8'));
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'offline.html'), page);
  fs.writeFileSync(path.join(OUT, 'index.html'), page); // o Capacitor exige index.html no webDir
  console.log('www/ gerado a partir de frontend/public/offline.html');
}

module.exports = { build, START_URL };
