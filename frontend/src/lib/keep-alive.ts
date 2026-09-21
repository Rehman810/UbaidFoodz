import { API_URL } from "./api";

const INTERVAL_MS = 10 * 60 * 1000; // 10 min — Render sleeps after ~15 min idle

function isProductionApi() {
  return !API_URL.includes("localhost") && !API_URL.includes("127.0.0.1");
}

export function pingApi() {
  if (!isProductionApi()) return;
  fetch(`${API_URL}/health`, { method: "GET", cache: "no-store" }).catch(() => {
    /* ignore — best-effort wake */
  });
}

/** Ping Render while a browser tab is open (storefront / admin). */
export function startClientKeepAlive() {
  if (!isProductionApi() || typeof window === "undefined") return () => {};

  pingApi();
  const id = window.setInterval(pingApi, INTERVAL_MS);

  const onVisible = () => {
    if (document.visibilityState === "visible") pingApi();
  };
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
