"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { api, SOCKET_URL } from "@/lib/api";

let socket: Socket | null = null;
let socketTokenPromise: Promise<string> | null = null;

async function fetchSocketToken() {
  if (!socketTokenPromise) {
    socketTokenPromise = api<{ token: string }>("/auth/socket-token")
      .then((r) => r.token)
      .catch(() => "");
  }
  return socketTokenPromise;
}

async function ensureSocket(): Promise<Socket | null> {
  if (!SOCKET_URL) return null;
  if (socket?.connected) return socket;
  const token = await fetchSocketToken();
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
      auth: token ? { token } : {},
      withCredentials: true,
      autoConnect: true,
    });
  } else if (token) {
    socket.auth = { token };
    socket.connect();
  }
  return socket;
}

export function useLiveOrders(onChange: () => void, orderId?: string, guestToken?: string | null) {
  useEffect(() => {
    let s: Socket | null = null;
    void ensureSocket().then((sock) => {
      s = sock;
      if (!s) return;
      const handler = () => onChange();
      s.on("order:created", handler);
      s.on("order:updated", handler);
      if (orderId) {
        s.emit("watch-order", guestToken ? { orderId, token: guestToken } : orderId);
      }
    });
    return () => {
      if (!s) return;
      s.off("order:created", onChange);
      s.off("order:updated", onChange);
    };
  }, [onChange, orderId, guestToken]);
}

export function reconnectLiveSocket() {
  socketTokenPromise = null;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  void ensureSocket();
}
