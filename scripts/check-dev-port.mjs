import net from "node:net";
import { execFile } from "node:child_process";

const PORT = 4000;
const HOST = "127.0.0.1";
const MAX_COMMAND_LENGTH = 320;

function execFileText(command, args) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { windowsHide: true, maxBuffer: 1024 * 1024 }, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

function isPortAddress(address) {
  return address.endsWith(`:${PORT}`);
}

function parseNetstatListeners(output) {
  const pids = new Set();

  for (const line of output.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 5 || parts[0] !== "TCP") continue;

    const [, localAddress, , state, pid] = parts;
    if (state !== "LISTENING" || !isPortAddress(localAddress) || !/^\d+$/.test(pid)) continue;

    pids.add(pid);
  }

  return [...pids];
}

function parseWmicList(output) {
  const metadata = {};

  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    metadata[match[1].trim()] = match[2].trim();
  }

  return {
    pid: metadata.ProcessId,
    name: metadata.Name,
    commandLine: metadata.CommandLine,
  };
}

function parseProcessList(output) {
  return parseWmicList(output);
}

function parseTasklistCsv(output) {
  const match = output.match(/"([^"]+)","(\d+)"/);
  if (!match) return {};

  return {
    name: match[1],
    pid: match[2],
  };
}

async function getWindowsProcessName(pid) {
  try {
    const output = await execFileText("tasklist", ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"]);
    const metadata = parseTasklistCsv(output);

    return metadata.name;
  } catch {
    return undefined;
  }
}

async function getWindowsProcessMetadata(pid) {
  try {
    const output = await execFileText("wmic", [
      "process",
      "where",
      `processid=${pid}`,
      "get",
      "ProcessId,Name,CommandLine",
      "/format:list",
    ]);
    const metadata = parseWmicList(output);

    if (metadata.name || metadata.commandLine) {
      return { pid, ...metadata };
    }
  } catch {
    // Fall through to the CIM fallback below.
  }

  try {
    const output = await execFileText("powershell.exe", [
      "-NoProfile",
      "-Command",
      [
        `$process = Get-CimInstance Win32_Process -Filter "ProcessId=${pid}"`,
        "if ($process) {",
        '  "ProcessId=$($process.ProcessId)"',
        '  "Name=$($process.Name)"',
        '  "CommandLine=$($process.CommandLine)"',
        "}",
      ].join("; "),
    ]);
    const metadata = parseProcessList(output);

    if (metadata.name || metadata.commandLine) {
      return {
        pid,
        name: metadata.name,
        commandLine: metadata.commandLine,
      };
    }
  } catch {
    // Fall through to the tasklist fallback below.
  }

  return { pid, name: await getWindowsProcessName(pid) };
}

async function getWindowsPortOwners() {
  try {
    const output = await execFileText("netstat", ["-ano"]);
    const pids = parseNetstatListeners(output);
    return Promise.all(pids.map(getWindowsProcessMetadata));
  } catch {
    return [];
  }
}

function truncateCommand(commandLine) {
  if (!commandLine || commandLine.length <= MAX_COMMAND_LENGTH) return commandLine;
  return `${commandLine.slice(0, MAX_COMMAND_LENGTH - 3)}...`;
}

function isLocalWp(owner) {
  const value = `${owner.name ?? ""} ${owner.commandLine ?? ""}`.toLowerCase();
  return value.includes("local.exe") || value.includes("\\programs\\local\\local.exe");
}

function isRepoParcelDevServer(owner) {
  const commandLine = (owner.commandLine ?? "").toLowerCase();
  return (
    (commandLine.includes("\\node_modules\\parcel\\lib\\bin.js") ||
      commandLine.includes("/node_modules/parcel/lib/bin.js")) &&
    commandLine.includes(" serve ") &&
    (commandLine.includes("--port 4000") || commandLine.includes("--port=4000"))
  );
}

async function printOwnerDiagnostics() {
  if (process.platform !== "win32") {
    console.error("[dev:check-port] Process-owner lookup is only implemented on Windows.");
    console.error("[dev:check-port] Stop or reconfigure the process using this port, then rerun npm run start.");
    return;
  }

  const owners = await getWindowsPortOwners();

  if (owners.length === 0) {
    console.error("[dev:check-port] No listening PID could be discovered automatically.");
    console.error("[dev:check-port] Stop or reconfigure the owning process.");
    return;
  }

  console.error("[dev:check-port] Detected listener(s):");
  for (const owner of owners) {
    console.error(`  PID ${owner.pid ?? "unknown"} - ${owner.name ?? "unknown process"}`);
    if (owner.commandLine) {
      console.error(`    Command: ${truncateCommand(owner.commandLine)}`);
    }
  }

  const localWpDetected = owners.some(isLocalWp);
  const parcelDetected = owners.some(isRepoParcelDevServer);

  console.error("");
  if (localWpDetected) {
    console.error(
      "[dev:check-port] LocalWP appears to be using port 4000. Stop LocalWP or change its port before running npm run start."
    );
  }
  if (parcelDetected) {
    console.error(
      "[dev:check-port] This repo's Parcel dev server appears to already be running. Open http://localhost:4000/ directly, or stop that process before restarting."
    );
  }
  if (!localWpDetected && !parcelDetected) {
    console.error("[dev:check-port] Stop or reconfigure the owning process.");
  }
}

async function printPortInUseError() {
  console.error("");
  console.error(`[dev:check-port] localhost:${PORT} is already in use.`);
  console.error("[dev:check-port] The repo dev server was not started, and the browser was not opened.");
  await printOwnerDiagnostics();
  console.error("");
  console.error("[dev:check-port] Windows diagnostics:");
  console.error(`  netstat -ano | findstr :${PORT}`);
  console.error(
    '  Get-CimInstance Win32_Process -Filter "ProcessId=<PID>" | Select-Object ProcessId,Name,CommandLine'
  );
  console.error('  tasklist /FI "PID eq <PID>"');
  console.error("");
}

function checkPort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (error) => {
      reject(error);
    });

    server.once("listening", () => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    server.listen(PORT, HOST);
  });
}

try {
  await checkPort();
} catch (error) {
  if (error?.code === "EADDRINUSE") {
    await printPortInUseError();
  } else {
    console.error("");
    console.error(`[dev:check-port] Could not check localhost:${PORT}.`);
    console.error(`[dev:check-port] ${error?.code ?? "ERROR"}: ${error?.message ?? error}`);
    console.error("[dev:check-port] The repo dev server was not started.");
    console.error("");
  }
  process.exit(1);
}
