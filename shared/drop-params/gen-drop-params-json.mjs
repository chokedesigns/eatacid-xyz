import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Your drop-params.js uses `export default { ... }`, so this is correct:
import DROP_PARAMS from "./drop-params.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outPath = path.join(__dirname, "drop-params.json");
fs.writeFileSync(outPath, JSON.stringify(DROP_PARAMS, null, 2) + "\n", "utf8");

console.log("[drop-params] wrote", outPath);