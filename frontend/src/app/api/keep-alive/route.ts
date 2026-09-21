import { NextResponse } from "next/server";

/** Server-side ping — used by Vercel Cron to wake Render backend. */
export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!apiUrl || apiUrl.includes("localhost")) {
    return NextResponse.json({ ok: true, skipped: true, reason: "no production API URL" });
  }

  try {
    const res = await fetch(`${apiUrl}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(25_000),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({
      ok: res.ok,
      api: apiUrl,
      health: data,
      at: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        api: apiUrl,
        error: err instanceof Error ? err.message : "ping failed",
        at: new Date().toISOString(),
      },
      { status: 502 }
    );
  }
}
