const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { build, START_URL } = require('./copy-web');

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'public', 'offline.html'), 'utf8');
const out = build(src);
assert.ok(out.includes(START_URL), 'tenta abrir o site de novo');
assert.ok(!out.includes('history.back'), 'não usa voltar do histórico');
assert.ok(out.includes('id="retryBtn"'), 'mantém o visual do PWA');
assert.throws(() => build('<html></html>'));
console.log('copy-web ok');
