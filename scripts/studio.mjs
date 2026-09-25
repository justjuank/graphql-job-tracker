import "dotenv/config";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const configuredUrl = process.env.DATABASE_URL ?? "file:./dev.db";

if (!configuredUrl.startsWith("file:")) {
  throw new Error("This Studio launcher currently expects a SQLite file URL.");
}

// Prisma Studio 7.10 recognizes file:// URLs but currently misidentifies the
// documented file:./dev.db form as an unsupported protocol.
const databasePath = resolve(configuredUrl.slice("file:".length));
const studioUrl = pathToFileURL(databasePath).href;
const prismaCli = resolve("node_modules/prisma/build/index.js");

const studio = spawn(
  process.execPath,
  [prismaCli, "studio", "--url", studioUrl, ...process.argv.slice(2)],
  { stdio: "inherit" },
);

studio.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exitCode = code ?? 1;
});
