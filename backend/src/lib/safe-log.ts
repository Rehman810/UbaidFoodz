const SENSITIVE = /password|token|secret|authorization|cookie|smtp_pass|api[_-]?key/i;

export function safeErrorForLog(err: unknown) {
  if (!(err instanceof Error)) return String(err);
  const msg = err.message.replace(/Bearer\s+[^\s]+/gi, "Bearer [redacted]");
  if (SENSITIVE.test(msg)) return `${err.name}: [redacted]`;
  return `${err.name}: ${msg}`;
}
