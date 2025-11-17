// ============================================================
// WEBSOCKET SERVER - Sistema de Tempo Real
// ============================================================
// Gerencia conexões WebSocket para atualizações em tempo real

import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

// ============================================================
// INITIALIZE SOCKET.IO
// ============================================================
export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.CORS_ORIGIN,
    'http://localhost:3000'
  ].filter((origin): origin is string => typeof origin === 'string');

  io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.on('connection', (socket) => {
    console.log(`✅ Cliente WebSocket conectado: ${socket.id}`);

    // 📌 Cliente entra em sala específica do módulo
    socket.on('join:module', ({ department, module }: { department: string; module: string }) => {
      const roomName = `module:${department}:${module}`;
      socket.join(roomName);
      console.log(`🚪 ${socket.id} entrou na sala: ${roomName}`);
    });

    // 📌 Cliente sai de sala
    socket.on('leave:module', ({ department, module }: { department: string; module: string }) => {
      const roomName = `module:${department}:${module}`;
      socket.leave(roomName);
      console.log(`🚪 ${socket.id} saiu da sala: ${roomName}`);
    });

    // 📌 Cliente desconecta
    socket.on('disconnect', () => {
      console.log(`❌ Cliente WebSocket desconectado: ${socket.id}`);
    });
  });

  console.log('✅ WebSocket server inicializado');
  return io;
}

// ============================================================
// GET SOCKET.IO INSTANCE
// ============================================================
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io não foi inicializado. Chame initializeSocket primeiro.');
  }
  return io;
}

// ============================================================
// EMIT SERVICE UPDATE
// Notifica usuários quando um service é atualizado
// ============================================================
export function emitServiceUpdate(
  department: string,
  module: string,
  service: any
): void {
  if (!io) {
    console.warn('⚠️  Socket.io não inicializado - update não será transmitido');
    return;
  }

  const roomName = `module:${department}:${module}`;
  const eventName = `service:updated:${department}:${module}`;

  io.to(roomName).emit(eventName, {
    department,
    module,
    service,
    timestamp: new Date().toISOString()
  });

  console.log(`📡 WebSocket emitido: ${eventName} para sala ${roomName}`);
}

// ============================================================
// EMIT PROTOCOL UPDATE
// Notifica usuários quando um protocol é atualizado
// ============================================================
export function emitProtocolUpdate(
  department: string,
  module: string,
  protocol: any
): void {
  if (!io) {
    console.warn('⚠️  Socket.io não inicializado - update não será transmitido');
    return;
  }

  const roomName = `module:${department}:${module}`;
  const eventName = `protocol:updated:${department}:${module}`;

  io.to(roomName).emit(eventName, {
    department,
    module,
    protocol,
    timestamp: new Date().toISOString()
  });

  console.log(`📡 WebSocket emitido: ${eventName} para sala ${roomName}`);
}

// ============================================================
// BROADCAST TO ALL
// Envia notificação para todos os clientes conectados
// ============================================================
export function broadcastToAll(event: string, data: any): void {
  if (!io) {
    console.warn('⚠️  Socket.io não inicializado - broadcast não será transmitido');
    return;
  }

  io.emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });

  console.log(`📡 Broadcast enviado: ${event}`);
}
