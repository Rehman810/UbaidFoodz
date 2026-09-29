import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");
const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "dist", "coverage", "invoices"]);

function walk(dir: string, out: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx|json|md|sql|prisma|yml|yaml|example|css|html)$/.test(entry.name)) out.push(full);
  }
  return out;
}

describe("[BR-01] legacy product name is gone", () => {
  it("has zero case-insensitive hits outside docs/RECON.md", () => {
    const needle = ["ub", "aid"].join("");
    const hits: string[] = [];
    for (const file of walk(ROOT)) {
      const rel = path.relative(ROOT, file);
      if (rel === path.join("docs", "RECON.md")) continue;
      const text = fs.readFileSync(file, "utf8");
      if (text.toLowerCase().includes(needle)) hits.push(rel);
    }
    expect(hits).toEqual([]);
  });
});
