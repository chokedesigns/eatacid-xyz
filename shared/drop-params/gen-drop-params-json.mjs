import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Your drop-params.js uses `export default { ... }`, so this is correct:
import DROP_PARAMS from "./drop-params.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outPath = path.join(__dirname, "drop-params.json");

let prevJson = null;
try {
  prevJson = fs.readFileSync(outPath, "utf8");
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

// Preserve existing EOL style if file exists; default to LF.
const eol = prevJson && prevJson.includes("\r\n") ? "\r\n" : "\n";

const nextJson =
  JSON.stringify(DROP_PARAMS, null, 2).replace(/\n/g, eol) + eol;

// Compare normalized content so CRLF/LF doesn't cause false rewrites.
const normalizedPrev =
  prevJson == null
    ? null
    : eol === "\r\n"
      ? prevJson.replace(/\r?\n/g, "\r\n")
      : prevJson.replace(/\r\n/g, "\n");

if (normalizedPrev === nextJson) {
  console.log("[drop-params] unchanged", outPath);
} else {
  fs.writeFileSync(outPath, nextJson, "utf8");
  console.log("[drop-params] wrote", outPath);
}