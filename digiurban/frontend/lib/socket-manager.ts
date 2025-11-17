// ============================================================
// SOCKET MANAGER - Gerenciamento Centralizado de WebSocket
// ============================================================
// Garante única instância do Socket.IO com tratamento robusto de erros

import { io, Socket } from 'socket.io-client';

// ============================================================
// SINGLETON INSTANCE
// ============================================================
let socketInstance: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 5000;

// ============================================================
// GET OR CREATE SOCKET INSTANCE
// ============================================================
export function getSocket(): Socket {
  if (!socketInstance || socketInstance.disconnected) {
    // Em produção (deploy): usa caminho relativo via Nginx
    // Em desenvolvimento: usa URL completa do backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

    // Remover '/api' do final se existir, pois será adicionado no path
    const baseUrl = backendUrl.replace(/\/api\/?$/, '');

    socketInstance = io(baseUrl, {
      path: '/api/socket', // ✅ Path correto do backend
      transports: ['polling', 'websocket'], // ✅ Polling primeiro (mais confiável)
      reconnection: true,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionDelayMax: MAX_RECONNECT_DELAY,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      timeout: 10000,
      autoConnect: true,
      withCredentials: true,
    });

    // ============================================================
    // EVENT HANDLERS
    // ============================================================
    socketInstance.on('connect', () => {
      console.log('🔌 WebSocket conectado:', socketInstance?.id);
      reconnectAttempts = 0; // Reset on success
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 WebSocket desconectado:', reason);

      // Se foi desconexão pelo servidor, tentar reconectar
      if (reason === 'io server disconnect') {
        socketInstance?.connect();
      }
    });

    socketInstance.on('connect_error', (error) => {
      reconnectAttempts++;

      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.warn('⚠️ WebSocket: Máximo de tentativas de reconexão atingido. Modo offline.');
        // Não fecha completamente para permitir reconexão manual
      } else {
        console.warn(
          `⚠️ WebSocket erro de conexão (tentativa ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}):`,
          error.message
        );
      }
    });

    socketInstance.on('error', (error) => {
      console.error('❌ WebSocket erro:', error);
    });

    // Log de reconexão bem-sucedida
    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`✅ WebSocket reconectado após ${attemptNumber} tentativas`);
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 WebSocket tentativa de reconexão: ${attemptNumber}`);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ WebSocket: Falha ao reconectar após múltiplas tentativas');
    });
  }

  return socketInstance;
}

// ============================================================
// CLEANUP - Força desconexão
// ============================================================
export function disconnectSocket(): void {
  if (socketInstance) {
    console.log('👋 Desconectando WebSocket...');
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
    reconnectAttempts = 0;
  }
}

// ============================================================
// RESET CONNECTION - Força nova conexão
// ============================================================
export function resetSocket(): void {
  disconnectSocket();
  return getSocket();
}

// ============================================================
// CHECK CONNECTION STATUS
// ============================================================
export function isSocketConnected(): boolean {
  return socketInstance?.connected ?? false;
}

// ============================================================
// EMIT WITH ERROR HANDLING
// ============================================================
export function safeEmit(event: string, data?: any): boolean {
  try {
    if (socketInstance?.connected) {
      socketInstance.emit(event, data);
      return true;
    } else {
      console.warn('⚠️ Socket não conectado. Evento não enviado:', event);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao emitir evento WebSocket:', error);
    return false;
  }
}

// ============================================================
// JOIN ROOM WITH ERROR HANDLING
// ============================================================
export function joinRoom(department: string, module: string): boolean {
  return safeEmit('join:module', { department, module });
}

// ============================================================
// LEAVE ROOM WITH ERROR HANDLING
// ============================================================
export function leaveRoom(department: string, module: string): boolean {
  return safeEmit('leave:module', { department, module });
}
