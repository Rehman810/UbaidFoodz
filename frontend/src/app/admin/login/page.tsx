"use client";

import { Suspense } from "react";
import LoginForm from "../../login/LoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center">Loading…</div>}>
      <LoginForm staff />
    </Suspense>
  );
}
