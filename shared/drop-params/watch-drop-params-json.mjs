import fs from "node:fs";
import path from "node:path";

import {
  DROP_PARAMS_PATHS,
  projectDropParams
} from "./drop-params-projector.mjs";

const once = process.argv.includes("--once");
let debounceTimer = null;
let requestedEpoch = 0;
let inFlight = false;

async function generateOnce() {
  try {
    const result = await projectDropParams({ syncAdmin: true });
    console.log(
      `[drop-params] ${result.outer.changed ? "wrote" : "unchanged"}`,
      result.outer.path
    );
    console.log(
      `[drop-params] ${result.adminMirror.changed ? "wrote" : "unchanged"}`,
      result.adminMirror.path
    );
    return true;
  } catch (error) {
    console.warn("[drop-params] projections stale:", error?.message || error);
    return false;
  }
}

async function drainGenerateQueue() {
  if (inFlight) return;
  const epoch = requestedEpoch;
  inFlight = true;
  try {
    await generateOnce();
  } finally {
    inFlight = false;
    if (epoch !== requestedEpoch) void drainGenerateQueue();
  }
}

function generate() {
  requestedEpoch += 1;
  void drainGenerateQueue();
}

if (once) {
  if (!await generateOnce()) process.exitCode = 1;
} else {
  console.log("[drop-params] watching", DROP_PARAMS_PATHS.canonicalSource);
  generate();

  fs.watch(path.dirname(DROP_PARAMS_PATHS.canonicalSource), (_eventType, filename) => {
    if (filename && filename !== path.basename(DROP_PARAMS_PATHS.canonicalSource)) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(generate, 150);
  });
}
