import fs from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsPath  = path.join(__dirname, "drop-params.js");
const genPath = path.join(__dirname, "gen-drop-params-json.mjs");

let t = null;
function generate() {
  spawn(process.execPath, [genPath], { stdio: "inherit" });
}

console.log("[drop-params] watching", jsPath);
generate();

fs.watch(jsPath, () => {
  clearTimeout(t);
  t = setTimeout(generate, 150);
});