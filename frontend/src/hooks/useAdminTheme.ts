"use client";

import { useCallback, useState } from "react";
import { AdminTheme, readAdminTheme, writeAdminTheme } from "@/lib/admin-theme";

export function useAdminTheme() {
  const [theme, setThemeState] = useState<AdminTheme>(() => readAdminTheme());

  const setTheme = useCallback((next: AdminTheme) => {
    setThemeState(next);
    writeAdminTheme(next);
  }, []);

  const toggle = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      writeAdminTheme(next);
      return next;
    });
  }, []);

  return { theme, setTheme, toggle };
}
