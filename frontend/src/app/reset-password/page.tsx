"use client";

import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-stone-400">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
