import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  DROP_PARAMS_OPERATIONS,
  serializeDropParamsSource
} from "./drop-params-authoring.mjs";
import { acquireDropParamsLock } from "./drop-params-projector.mjs";

const testPath = fileURLToPath(import.meta.url);
const dropParamsDir = path.dirname(testPath);
const repoRoot = path.resolve(dropParamsDir, "..", "..");
const sourcePath = path.join(dropParamsDir, "drop-params.js");
const sharedJsonPath = path.join(dropParamsDir, "drop-params.json");
const adminMirrorPath = path.join(
  repoRoot,
  "admin-ui",
  "src",
  "drop-params.mirror.json"
);
const watcherPath = path.join(dropParamsDir, "watch-drop-params-json.mjs");
const timeoutMs = 15_000;
const firstDropName = "__WATCHER_ATOMIC_SAVE_ONE__";
const secondDropName = "__WATCHER_ATOMIC_SAVE_TWO__";

function sourceWithDropName(params, value) {
  const candidate = params.dropScheduled
    ? { ...structuredClone(params), dropName: value }
    : {
        dropScheduled: true,
        dropName: value,
        mirrorNetwork: "testnet",
        dropDate: { month: "May", day: "28", year: "2026" },
        dropTime: { time: "9:00", period: "PM", timezone: "EST" },
        burnTokens: [{
          collection: "HEN",
          enabled: true,
          exclude: ["141634"],
          burnAmount: 1
        }],
        redeemToken: {
          collection: "CANAAN",
          tokenId: "29",
          redeemAmount: 1,
          totalSupply: 10
        }
      };

  return serializeDropParamsSource(candidate, {
    operation: DROP_PARAMS_OPERATIONS.ACTIVE
  });
}

async function atomicReplace(filePath, contents, sequence) {
  const tempPath = path.join(
    path.dirname(filePath),
    `.${path.basename(filePath)}.${process.pid}.${sequence}.tmp`
  );

  try {
    await writeFile(tempPath, contents);
    await rename(tempPath, filePath);
  } finally {
    await rm(tempPath, { force: true });
  }
}

async function assertGeneratedValue(expected) {
  const [shared, mirror] = await Promise.all([
    readFile(sharedJsonPath, "utf8").then(JSON.parse),
    readFile(adminMirrorPath, "utf8").then(JSON.parse)
  ]);

  assert.equal(shared.dropName, expected);
  assert.equal(mirror.dropName, expected);
  assert.deepEqual(mirror, shared);
}

test("watcher coordinates through the transaction lock and preserves rapid atomic saves", async () => {
  const originalFiles = new Map(await Promise.all(
    [sourcePath, sharedJsonPath, adminMirrorPath].map(async filePath => [
      filePath,
      await readFile(filePath)
    ])
  ));
  const originalParams = JSON.parse(originalFiles.get(sharedJsonPath).toString("utf8"));
  const watcher = spawn(process.execPath, [watcherPath], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"]
  });
  const watcherPid = watcher.pid;
  let output = "";
  let coordinationLock = null;

  watcher.stdout.setEncoding("utf8");
  watcher.stderr.setEncoding("utf8");
  watcher.stdout.on("data", chunk => { output += chunk; });
  watcher.stderr.on("data", chunk => { output += chunk; });

  function waitForOutput(marker, startIndex, label) {
    return new Promise((resolve, reject) => {
      const inspect = () => {
        if (output.slice(startIndex).includes(marker)) finish(resolve);
      };
      const onExit = (code, signal) => finish(
        reject,
        new Error(
          `watcher exited before ${label} (code ${code}, signal ${signal})\n${output}`
        )
      );
      const timer = setTimeout(() => finish(
        reject,
        new Error(`timed out waiting for ${label}\n${output}`)
      ), timeoutMs);
      const finish = (complete, value) => {
        clearTimeout(timer);
        watcher.stdout.off("data", inspect);
        watcher.stderr.off("data", inspect);
        watcher.off("exit", onExit);
        complete(value);
      };

      watcher.stdout.on("data", inspect);
      watcher.stderr.on("data", inspect);
      watcher.once("exit", onExit);
      inspect();
    });
  }

  async function stopWatcher() {
    if (watcher.exitCode !== null || watcher.signalCode !== null) return;

    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        watcher.off("exit", onExit);
        reject(new Error("watcher did not stop"));
      }, timeoutMs);
      const onExit = () => {
        clearTimeout(timer);
        resolve();
      };

      watcher.once("exit", onExit);
      watcher.kill();
    });
  }

  try {
    await waitForOutput(adminMirrorPath, 0, "initial generation");
    const initialValue = JSON.parse(
      await readFile(sharedJsonPath, "utf8")
    ).dropName;
    assert.equal(typeof initialValue, "string");
    await assertGeneratedValue(initialValue);

    coordinationLock = await acquireDropParamsLock();
    const rapidOutputStart = output.length;
    await atomicReplace(
      sourcePath,
      sourceWithDropName(originalParams, firstDropName),
      1
    );
    await atomicReplace(
      sourcePath,
      sourceWithDropName(originalParams, secondDropName),
      2
    );
    await new Promise(resolve => setTimeout(resolve, 500));
    await assertGeneratedValue(initialValue);

    assert.equal(await coordinationLock.release(), true);
    coordinationLock = null;
    await waitForOutput(
      `[drop-params] wrote ${adminMirrorPath}`,
      rapidOutputStart,
      "locked rapid-save generation"
    );
    assert.equal(watcher.pid, watcherPid);
    assert.equal(watcher.exitCode, null);
    await assertGeneratedValue(secondDropName);
  } finally {
    try {
      if (coordinationLock) await coordinationLock.release();
      await stopWatcher();
    } finally {
      await Promise.all([...originalFiles].map(([filePath, contents]) =>
        writeFile(filePath, contents)
      ));
    }
  }
});
