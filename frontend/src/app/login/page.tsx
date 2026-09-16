"use client";

import { Suspense } from "react";
import LoginPage from "./LoginForm";

export default function Page() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center">Loading…</div>}>
      <LoginPage />
    </Suspense>
  );
}
