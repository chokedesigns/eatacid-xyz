import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Your drop-params.js uses `export default { ... }`, so this is correct:
import DROP_PARAMS from "./drop-params.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outPath = path.join(__dirname, "drop-params.json");
const nextJson = JSON.stringify(DROP_PARAMS, null, 2) + "\n";

let prevJson = null;
try {
  prevJson = fs.readFileSync(outPath, "utf8");
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

if (prevJson === nextJson) {
  console.log("[drop-params] unchanged", outPath);
} else {
  fs.writeFileSync(outPath, nextJson, "utf8");
  console.log("[drop-params] wrote", outPath);
}