"use client";

import { useState } from "react";
import { Shield } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { SettingsSection } from "@/components/admin/SettingsSection";

export function TwoFactorSettings() {
  const { user } = useAuth();
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [enabled, setEnabled] = useState(Boolean(user?.totpEnabled));

  async function setup() {
    setMsg("");
    try {
      const data = await api<{ qrDataUrl: string; secret: string }>("/auth/2fa/setup", { method: "POST" });
      setQr(data.qrDataUrl);
      setSecret(data.secret);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not start setup.");
    }
  }

  async function enable() {
    setMsg("");
    try {
      await api("/auth/2fa/enable", { method: "POST", body: JSON.stringify({ code }) });
      setEnabled(true);
      setQr("");
      setCode("");
      setMsg("Google Authenticator is on for this admin account.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Invalid code.");
    }
  }

  async function disable() {
    setMsg("");
    try {
      await api("/auth/2fa/disable", { method: "POST", body: JSON.stringify({ code }) });
      setEnabled(false);
      setCode("");
      setMsg("Authenticator disabled.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not disable.");
    }
  }

  return (
    <SettingsSection icon={Shield} title="Google Authenticator" description="Protect admin sign-in with a 6-digit app code.">
      {msg && <p className="mb-3 text-sm text-stone-600">{msg}</p>}
      {enabled ? (
        <div className="space-y-3">
          <p className="text-sm text-emerald-800">Two-factor is enabled on this account.</p>
          <input className="input max-w-xs" placeholder="Authenticator code" value={code} onChange={(e) => setCode(e.target.value)} />
          <button type="button" onClick={disable} className="btn-ghost">Disable 2FA</button>
        </div>
      ) : (
        <div className="space-y-3">
          {!qr ? (
            <button type="button" onClick={setup} className="btn-primary">Set up authenticator</button>
          ) : (
            <>
              <img src={qr} alt="Authenticator QR" className="h-44 w-44 rounded-xl border border-stone-200 bg-white p-2" />
              <p className="text-xs text-stone-500">Scan in Google Authenticator, then enter a code. Secret: <code className="font-mono">{secret}</code></p>
              <input className="input max-w-xs" placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />
              <button type="button" onClick={enable} className="btn-primary">Confirm and enable</button>
            </>
          )}
        </div>
      )}
    </SettingsSection>
  );
}
