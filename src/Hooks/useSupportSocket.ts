import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../State/auth";
import { useSupportStore } from "../State/support";

const wsUrl = import.meta.env.VITE_WS_URL;

export function useSupportSocket(ticketId?: string) {
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const receiveNewMessage = useSupportStore((state) => state.receiveNewMessage);
  const receiveStatusChanged = useSupportStore((state) => state.receiveStatusChanged);
  const setAdminUnreadCount = useSupportStore((state) => state.setAdminUnreadCount);

  useEffect(() => {
    if (!accessToken) return;

    // Connect to /support namespace
    const socket = io(`${wsUrl}/support`, {
      auth: { token: accessToken },
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[SupportSocket] Connected to support real-time namespace");
      if (ticketId) {
        socket.emit("join_ticket", { ticketId });
      }
    });

    socket.on("support:new_message", (data) => {
      console.log("[SupportSocket] new_message received:", data);
      receiveNewMessage(data);
    });

    socket.on("support:status_changed", (data) => {
      console.log("[SupportSocket] status_changed received:", data);
      receiveStatusChanged(data);
    });

    socket.on("support:unread_count", (data) => {
      console.log("[SupportSocket] unread_count received:", data);
      if (data && typeof data.unreadFromUsers === "number") {
        setAdminUnreadCount(data.unreadFromUsers);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, ticketId, receiveNewMessage, receiveStatusChanged, setAdminUnreadCount]);

  const joinTicket = (id: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join_ticket", { ticketId: id });
    }
  };

  const leaveTicket = (id: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave_ticket", { ticketId: id });
    }
  };

  return {
    socket: socketRef.current,
    joinTicket,
    leaveTicket,
  };
}
