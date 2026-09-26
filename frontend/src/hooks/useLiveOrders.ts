"use client";

import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "@/lib/api";

let socket: Socket | null = null;

function getSocket() {
  if (socket) return socket;
  const token = typeof window !== "undefined" ? localStorage.getItem("uff_token") : null;
  socket = io(API_URL, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    auth: token ? { token } : {},
    autoConnect: true,
  });
  return socket;
}

export function useLiveOrders(onChange: () => void, orderId?: string) {
  useEffect(() => {
    const s = getSocket();
    const handler = () => onChange();
    s.on("order:created", handler);
    s.on("order:updated", handler);
    if (orderId) s.emit("watch-order", orderId);
    return () => {
      s.off("order:created", handler);
      s.off("order:updated", handler);
    };
  }, [onChange, orderId]);
}

export function reconnectLiveSocket() {
  if (socket) {
    socket.auth = { token: localStorage.getItem("uff_token") || "" };
    socket.disconnect();
    socket.connect();
  }
}
