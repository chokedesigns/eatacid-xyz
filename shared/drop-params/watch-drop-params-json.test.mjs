import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

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

function sourceWithDropName(source, value) {
  const pattern = /(\bdropName\s*:\s*)"[^"\r\n]*"/g;
  assert.equal(
    [...source.matchAll(pattern)].length,
    1,
    "fixture must contain exactly one double-quoted dropName property"
  );
  return source.replace(pattern, `$1${JSON.stringify(value)}`);
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

test("watcher survives consecutive atomic replacements", async () => {
  const originalFiles = new Map(await Promise.all(
    [sourcePath, sharedJsonPath, adminMirrorPath].map(async filePath => [
      filePath,
      await readFile(filePath)
    ])
  ));
  const originalSource = originalFiles.get(sourcePath).toString("utf8");
  const watcher = spawn(process.execPath, [watcherPath], {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"]
  });
  const watcherPid = watcher.pid;
  let output = "";

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

    const firstOutputStart = output.length;
    await atomicReplace(
      sourcePath,
      sourceWithDropName(originalSource, firstDropName),
      1
    );
    await waitForOutput(
      `[drop-params] wrote ${adminMirrorPath}`,
      firstOutputStart,
      "first atomic save generation"
    );
    assert.equal(watcher.pid, watcherPid);
    assert.equal(watcher.exitCode, null);
    await assertGeneratedValue(firstDropName);

    const secondOutputStart = output.length;
    await atomicReplace(
      sourcePath,
      sourceWithDropName(originalSource, secondDropName),
      2
    );
    await waitForOutput(
      `[drop-params] wrote ${adminMirrorPath}`,
      secondOutputStart,
      "second atomic save generation"
    );
    assert.equal(watcher.pid, watcherPid);
    assert.equal(watcher.exitCode, null);
    await assertGeneratedValue(secondDropName);
  } finally {
    try {
      await stopWatcher();
    } finally {
      await Promise.all([...originalFiles].map(([filePath, contents]) =>
        writeFile(filePath, contents)
      ));
    }
  }
});
