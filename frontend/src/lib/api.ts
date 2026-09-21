// Live: set NEXT_PUBLIC_API_URL=https://ubaidfoodz.onrender.com on Vercel/Netlify.
// Local: falls back to localhost.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("uff_token") : null;
  const headers: Record<string, string> = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError("Server took too long to respond. Is the API running?", 0);
    }
    throw new ApiError("Cannot reach API. Start the backend or check NEXT_PUBLIC_API_URL.", 0);
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  if (res.headers.get("content-type")?.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return undefined as T;
}

export async function apiUpload(path: string, file: File): Promise<{ url: string }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("uff_token") : null;
  const body = new FormData();
  body.append("image", file);

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });

  if (!res.ok) {
    let message = "Upload failed";
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<{ url: string }>;
}

export function invoiceUrl(orderId: string, guestToken?: string | null) {
  const base = `${API_URL}/invoices/${orderId}/download`;
  if (!guestToken) return base;
  return `${base}?token=${encodeURIComponent(guestToken)}`;
}

export async function downloadInvoice(orderId: string, guestToken?: string | null) {
  const token = localStorage.getItem("uff_token");
  const res = await fetch(invoiceUrl(orderId, guestToken), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Could not download invoice");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${orderId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
