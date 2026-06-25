// FIX 5/6 — WebSocket Subscribe/Unsubscribe Events and Listener Routing
import { io, Socket } from "socket.io-client";
import { useBotStore } from "../../State/bot";
import { useLogsStore } from "../../State/logs";

const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:3000";

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (socket) {
    if (socket.auth && (socket.auth as any).token !== token) {
      socket.disconnect();
      socket = null;
    } else {
      return socket;
    }
  }

  socket = io(wsUrl, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    reconnectionAttempts: Infinity,
  });

  socket.on("nestjs:log", (data) => {
    useLogsStore.getState().addNestLog({
      timestamp: data.timestamp || new Date().toISOString(),
      message: typeof data === 'string' ? data : (data.message || JSON.stringify(data)),
      level: data.level || "info",
    });
  });

  socket.on("python:log", (data) => {
    // B2 Step 3 — Temporary diagnostic console.log
    console.log("[python:log received]", data);
    useLogsStore.getState().addPythonLog({
      timestamp: data.timestamp || new Date().toISOString(),
      message: data.raw || data.message || JSON.stringify(data),
      level: data.level || "info",
    });
  });

  socket.on("bot:cycle", (data) => {
    const cycleNum = data.cycleNumber || data.cycle;
    if (cycleNum !== undefined) {
      useBotStore.getState().setBotStatus({ cycleCounter: cycleNum });
    }
  });

  socket.on("bot:action", (data) => {
    useLogsStore.getState().addPythonLog({
      timestamp: new Date().toISOString(),
      message: `ACTION: [${data.type}] on ${data.symbol || "unknown"}`,
      level: "action",
    });
  });

  socket.on("bot:status", (data) => {
    useBotStore.getState().setBotStatus({
      status: data.status,
      heartbeat: data.heartbeat || new Date().toISOString(),
    });
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
export { socket };
