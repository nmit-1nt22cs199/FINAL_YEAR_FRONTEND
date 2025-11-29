

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'ws://localhost:3000';
const SOCKET_PATH = '/api/socket';

let socket = null;

export function initSocket() {
  if (socket) return socket;

  // Create socket with websocket-only transport per backend requirement
  socket = io(SOCKET_URL, {
    path: SOCKET_PATH,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('[socket] connected', { id: socket.id, url: SOCKET_URL, path: SOCKET_PATH });
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected', reason);
  });

  socket.on('connect_error', (err) => {
    console.error('[socket] connect_error', err && err.message ? err.message : err);
  });

  // Console logger: print every incoming event
  if (socket && socket.onAny) {
    socket.onAny((event, payload) => {
      console.log('[socket:event]', event, payload);
    });
  }

  return socket;
}

export function getSocket() {
  return socket;
}

export function closeSocket() {
  if (!socket) return;
  try {
    socket.disconnect();
  } catch (e) {
    console.warn('[socket] error during disconnect', e);
  }
  socket = null;
}

export default { initSocket, getSocket, closeSocket };
