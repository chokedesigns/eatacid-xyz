// scripts/run-sanity-server.mjs
import { spawn, exec } from "node:child_process";

const PORT = 8080;
const urls = [
  `http://localhost:${PORT}/test/home`,
  `http://localhost:${PORT}/test/drops`,
  `http://localhost:${PORT}/test/exchange`,
];

function openUrl(url) {
  // Windows
  exec(`cmd /c start "" "${url}"`);
}

console.log(`[pages:sanity] Starting server on :${PORT}...`);

// Start: cmd /c npx serve . -l 8080
const child = spawn(
  "cmd.exe",
  ["/c", "npx", "serve", ".", "-l", String(PORT)],
  { stdio: "inherit", windowsHide: false }
);

let opened = false;
setTimeout(() => {
  if (opened) return;
  opened = true;
  console.log("[pages:sanity] Opening sanity pages...");
  for (const u of urls) openUrl(u);
}, 1200);

process.on("SIGINT", () => {
  console.log("\n[pages:sanity] Stopping server...");
  // This stops the cmd wrapper; serve will stop with it
  child.kill("SIGINT");
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});