"use client";

import { Suspense } from "react";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
