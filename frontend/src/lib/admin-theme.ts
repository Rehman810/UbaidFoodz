export type AdminTheme = "light" | "dark";

export const ADMIN_THEME_KEY = "uff-admin-theme";

export function readAdminTheme(): AdminTheme {
  if (typeof window === "undefined") return "light";
  return localStorage.getItem(ADMIN_THEME_KEY) === "dark" ? "dark" : "light";
}

export function writeAdminTheme(theme: AdminTheme) {
  localStorage.setItem(ADMIN_THEME_KEY, theme);
}
