export const LOGIN_FAIL_LIMIT = 8;
export const LOCK_MS = 15 * 60 * 1000;

export function isLocked(lockedUntil: Date | null | undefined, now = new Date()) {
  return Boolean(lockedUntil && lockedUntil.getTime() > now.getTime());
}

export function nextLockState(failedLoginCount: number, now = new Date()) {
  const next = failedLoginCount + 1;
  if (next >= LOGIN_FAIL_LIMIT) {
    return { failedLoginCount: next, lockedUntil: new Date(now.getTime() + LOCK_MS) };
  }
  return { failedLoginCount: next, lockedUntil: null as Date | null };
}

export const GENERIC_LOGIN_ERROR = "Incorrect email or password.";
export const LOCKED_LOGIN_ERROR = "Too many sign-in attempts. Try again later.";
