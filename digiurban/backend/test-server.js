const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Test server working' });
});

const PORT = 3001;

const server = app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`⏰ Listening... (will stay alive)`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Keep alive
setInterval(() => {
  console.log(`💓 Server heartbeat at ${new Date().toISOString()}`);
}, 10000);
