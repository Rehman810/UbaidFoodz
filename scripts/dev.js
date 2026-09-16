const { spawn } = require("child_process");
const { setTimeout: sleep } = require("timers/promises");
const path = require("path");
const root = path.join(__dirname, "..");

function run(cmd, args, opts = {}) {
  const child = spawn(cmd, args, {
    cwd: opts.cwd || root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...opts.env },
  });
  return child;
}

function waitFor(child) {
  return new Promise((resolve, reject) => {
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${child.spawnargs?.join(" ") || "command"} exited ${code}`));
    });
  });
}

async function waitHealthy(retries = 40) {
  const { execSync } = require("child_process");
  for (let i = 0; i < retries; i++) {
    try {
      execSync("docker compose exec -T db pg_isready -U ubaid -d ubaidfastfoodz", {
        cwd: root,
        stdio: "ignore",
      });
      return;
    } catch {
      await sleep(500);
    }
  }
  throw new Error("Postgres did not become ready. Is Docker running?");
}

async function main() {
  console.log("\n🍔  Ubaid Fast Foodz — starting demo\n");
  console.log("→ Starting PostgreSQL (Docker)…");
  await waitFor(run("docker", ["compose", "up", "-d"]));
  await waitHealthy();
  console.log("→ Running Prisma migrate + seed…");
  await waitFor(run("npx", ["prisma", "migrate", "deploy"], { cwd: path.join(root, "backend") }));
  await waitFor(run("npx", ["tsx", "prisma/seed.ts"], { cwd: path.join(root, "backend") }));
  console.log("→ API http://localhost:4000");
  console.log("→ App http://localhost:3000\n");
  const backend = run("npm", ["run", "dev", "-w", "ubaidfastfoodz-api"]);
  const frontend = run("npm", ["run", "dev", "-w", "ubaidfastfoodz-web"]);
  const shutdown = () => {
    backend.kill("SIGTERM");
    frontend.kill("SIGTERM");
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
