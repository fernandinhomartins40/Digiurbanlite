#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting UltraZend Messages Server in production mode...');

// Verificar variáveis de ambiente críticas
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  process.exit(1);
}

// Executar migrations (se necessário)
console.log('📦 Running Prisma migrations...');
const migrate = spawn('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  shell: true,
});

migrate.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Prisma migration failed');
    process.exit(code);
  }

  console.log('✅ Migrations completed');
  console.log('🚀 Starting server...');

  // Iniciar servidor
  const server = spawn('node', ['dist/index.js'], {
    stdio: 'inherit',
    env: process.env,
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });

  server.on('close', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down...');
    server.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down...');
    server.kill('SIGINT');
  });
});
