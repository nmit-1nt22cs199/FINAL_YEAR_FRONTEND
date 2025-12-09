// socketConnection.js
import { io } from "socket.io-client";

let socket = null;

export function connectSocket({ url = import.meta.env.VITE_API_URL, path = "/api/socket", opts = {} } = {}) {
  if (socket && socket.connected) return socket;

  socket = io(url, {
    path,
    transports: ["polling", "websocket"], // Polling first for Render compatibility
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000,
    ...opts,
  });

  socket.on("connect", () => {
    console.log("[socketConnection] connected", socket.id);
  });
  socket.on("disconnect", (reason) => {
    console.log("[socketConnection] disconnected", reason);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  try {
    socket.disconnect();
  } catch (e) {
    console.warn("[socketConnection] disconnect failed", e);
  } finally {
    socket = null;
  }
}
