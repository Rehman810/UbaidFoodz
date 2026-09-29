/** Strip tags and control characters from customer-supplied text. */
export function cleanText(value: unknown, max = 400) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);
}
