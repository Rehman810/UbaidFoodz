"use client";

import { useEffect } from "react";
import { startClientKeepAlive } from "@/lib/keep-alive";

export function KeepAlive() {
  useEffect(() => startClientKeepAlive(), []);
  return null;
}
