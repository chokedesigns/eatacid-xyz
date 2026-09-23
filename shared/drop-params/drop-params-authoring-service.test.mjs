import assert from "node:assert/strict";
import http from "node:http";
import test from "node:test";
import { isDeepStrictEqual } from "node:util";

import currentDropParams from "./drop-params.js";
import {
  DROP_PARAMS_AUTHORING_BODY_LIMIT,
  DROP_PARAMS_AUTHORING_HOST,
  createDropParamsAuthoringApi,
  createDropParamsAuthoringHttpServer,
  startDropParamsAuthoringService
} from "./drop-params-authoring-service.mjs";
import {
  serializeDropParamsSource,
  sha256SourceBytes
} from "./drop-params-authoring.mjs";
import { serializeDropParamsJson } from "./drop-params-projector.mjs";

function activeFixture() {
  return { ...structuredClone(currentDropParams), dropScheduled: true };
}

function snapshot(params = currentDropParams) {
  const sourceBytes = Buffer.from(serializeDropParamsSource(params));
  const jsonBytes = Buffer.from(serializeDropParamsJson(params));
  return {
    params: structuredClone(params),
    sourceVersion: sha256SourceBytes(sourceBytes),
    files: {
      sourceBytes,
      outerBytes: Buffer.from(jsonBytes),
      adminBytes: Buffer.from(jsonBytes)
    },
    equality: {
      equal: true,
      sourceEqualsProjection: true,
      sourceEqualsAdminMirror: true,
      projectionsByteEqual: true,
      errors: []
    }
  };
}

function writer(overrides = {}) {
  return { busy: false, lockState: "unlocked", blocked: false, operations: [], ...overrides };
}

async function unusedPort() {
  const server = http.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, DROP_PARAMS_AUTHORING_HOST, resolve);
  });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

function request({ port, method = "GET", path = "/v1/drop-params", origin, nonce, host, body, contentType = "application/json" }) {
  return new Promise((resolve, reject) => {
    const headers = { Host: host || `127.0.0.1:${port}` };
    if (origin) headers.Origin = origin;
    if (nonce) headers["X-Drop-Params-Nonce"] = nonce;
    if (body !== undefined) {
      headers["Content-Type"] = contentType;
      headers["Content-Length"] = Buffer.byteLength(body);
    }
    const req = http.request({ host: DROP_PARAMS_AUTHORING_HOST, port, path, method, headers }, response => {
      const chunks = [];
      response.on("data", chunk => chunks.push(chunk));
      response.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch {}
        resolve({ status: response.statusCode, headers: response.headers, text, json });
      });
    });
    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

test("GET metadata and validate/preview are read-only while apply delegates to the transaction executor", async () => {
  const base = snapshot();
  let executeCalls = 0;
  let executeRequest = null;
  const api = createDropParamsAuthoringApi({
    nonce: "a".repeat(64),
    now: () => new Date("2026-09-22T12:00:00.000Z"),
    readSnapshot: async () => structuredClone(base),
    readWriterState: async () => writer(),
    execute: async requestValue => {
      executeCalls += 1;
      executeRequest = requestValue;
      return { status: "completed", outcome: "created", operationId: requestValue.operationId };
    }
  });
  const beforeParams = structuredClone(base.params);
  const beforeSourceVersion = base.sourceVersion;
  const state = await api.getState();
  assert.equal(state.service.status, "READY");
  assert.equal(state.service.host, "127.0.0.1");
  assert.equal(state.representations.equal, true);
  assert.deepEqual(base.params, beforeParams);
  assert.equal(base.sourceVersion, beforeSourceVersion);

  const candidate = activeFixture();
  const validated = await api.validate({ operation: "CREATE", candidate });
  assert.equal(validated.ok, true);
  assert.equal(executeCalls, 0);
  assert.deepEqual(base.params, beforeParams);
  assert.equal(base.sourceVersion, beforeSourceVersion);

  const preview = await api.preview({
    operation: "CREATE",
    expectedSourceVersion: base.sourceVersion,
    candidate
  });
  assert.equal(preview.effects.writesPerformed, false);
  assert.equal(preview.effects.onChainStateChanges, false);
  assert.equal(preview.effects.files.outerJson.after, serializeDropParamsJson(candidate));
  assert(preview.diff.fields.some(change => change.path === "$.dropScheduled"));
  assert.equal(executeCalls, 0);
  assert.deepEqual(base.params, beforeParams);
  assert.equal(base.sourceVersion, beforeSourceVersion);

  const applied = await api.apply({
    operation: "CREATE",
    expectedSourceVersion: base.sourceVersion,
    candidate,
    candidateHash: preview.candidateHash,
    planHash: preview.planHash,
    previewToken: preview.previewToken
  });
  assert.equal(applied.ok, true);
  assert.equal(executeCalls, 1);
  assert.equal(executeRequest.operation, "CREATE");
  assert(isDeepStrictEqual(executeRequest.candidate, candidate));
});

test("preview tokens bind operation, source, candidate, plan, expiry, and single use", async () => {
  let nowMs = Date.parse("2026-09-22T12:00:00.000Z");
  let current = snapshot();
  let executeCalls = 0;
  const api = createDropParamsAuthoringApi({
    nonce: "b".repeat(64),
    tokenTtlMs: 100,
    now: () => new Date(nowMs),
    readSnapshot: async () => structuredClone(current),
    readWriterState: async () => writer(),
    execute: async () => { executeCalls += 1; return { status: "completed" }; }
  });
  const candidate = activeFixture();
  const makePreview = () => api.preview({
    operation: "CREATE",
    expectedSourceVersion: current.sourceVersion,
    candidate
  });

  const mismatched = await makePreview();
  const altered = structuredClone(candidate);
  altered.dropName = "ALTERED";
  await assert.rejects(api.apply({
    operation: "CREATE",
    expectedSourceVersion: current.sourceVersion,
    candidate: altered,
    candidateHash: mismatched.candidateHash,
    planHash: mismatched.planHash,
    previewToken: mismatched.previewToken
  }), error => error.code === "preview_binding_mismatch");
  assert.equal(executeCalls, 0);

  const expired = await makePreview();
  nowMs += 101;
  await assert.rejects(api.apply({
    operation: "CREATE",
    expectedSourceVersion: current.sourceVersion,
    candidate,
    candidateHash: expired.candidateHash,
    planHash: expired.planHash,
    previewToken: expired.previewToken
  }), error => error.code === "preview_token_expired");

  nowMs += 1;
  const singleUse = await makePreview();
  const requestBody = {
    operation: "CREATE",
    expectedSourceVersion: current.sourceVersion,
    candidate,
    candidateHash: singleUse.candidateHash,
    planHash: singleUse.planHash,
    previewToken: singleUse.previewToken
  };
  assert.equal((await api.apply(requestBody)).ok, true);
  await assert.rejects(api.apply(requestBody), error => error.code === "preview_token_unavailable");

  const stale = await makePreview();
  current = snapshot({ ...current.params, dropName: "STALE SOURCE" });
  await assert.rejects(api.apply({
    operation: "CREATE",
    expectedSourceVersion: stale.sourceVersion,
    candidate,
    candidateHash: stale.candidateHash,
    planHash: stale.planHash,
    previewToken: stale.previewToken
  }), error => error.code === "stale_source_version");
});

test("strict requests expose no arbitrary path, filename, command, or environment capability", async () => {
  const base = snapshot();
  const api = createDropParamsAuthoringApi({
    readSnapshot: async () => structuredClone(base),
    readWriterState: async () => writer(),
    execute: async () => assert.fail("executor should not be called")
  });
  await assert.rejects(api.validate({ operation: "CREATE", candidate: activeFixture(), path: "elsewhere" }), /unsupported field/);
  await assert.rejects(api.preview({
    operation: "CREATE",
    expectedSourceVersion: base.sourceVersion,
    candidate: activeFixture(),
    command: "git push"
  }), /unsupported field/);
  await assert.rejects(api.apply({
    operation: "DEACTIVATE",
    expectedSourceVersion: base.sourceVersion,
    candidateHash: null,
    planHash: "a".repeat(64),
    previewToken: "b".repeat(64),
    env: { NODE_ENV: "production" }
  }), /unsupported field/);
});

test("HTTP service binds loopback and enforces Host, Origin, CORS, nonce, content type, body limit, routes, and methods", async t => {
  const port = await unusedPort();
  const calls = { get: 0, validate: 0 };
  const api = {
    nonce: "c".repeat(64),
    repositoryId: "d".repeat(64),
    getState: async () => { calls.get += 1; return { ok: true, service: { status: "READY" } }; },
    validate: async body => { calls.validate += 1; return { ok: true, body }; },
    preview: async () => ({ ok: true }),
    apply: async () => ({ ok: true })
  };
  const { server } = createDropParamsAuthoringHttpServer({ port, api, bodyLimit: 128 });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, DROP_PARAMS_AUTHORING_HOST, resolve);
  });
  t.after(() => new Promise(resolve => server.close(resolve)));
  assert.equal(server.address().address, "127.0.0.1");

  const get = await request({ port });
  assert.equal(get.status, 200);
  assert.equal(calls.get, 1);
  assert.equal(calls.validate, 0);

  assert.equal((await request({ port, host: `evil.test:${port}` })).status, 403);
  assert.equal((await request({ port, origin: "http://evil.test" })).status, 403);
  assert.equal((await request({ port, origin: "*" })).status, 403);
  assert.equal((await request({ port, path: "/v1/files" })).status, 404);
  assert.equal((await request({ port, method: "DELETE" })).status, 405);

  const body = JSON.stringify({ operation: "DEACTIVATE" });
  assert.equal((await request({ port, method: "POST", path: "/v1/drop-params/validate", origin: "http://localhost:3000", body })).status, 401);
  const rejectedApply = await request({ port, method: "POST", path: "/v1/drop-params/apply", origin: "http://localhost:3000", body });
  assert.equal(rejectedApply.status, 401);
  assert.deepEqual(Object.keys(rejectedApply.json).sort(), ["failure", "ok", "operation", "reconciliationRequired", "result", "rollback"].sort());
  assert.equal((await request({ port, method: "POST", path: "/v1/drop-params/validate", origin: "http://localhost:3000", nonce: api.nonce, body, contentType: "text/plain" })).status, 415);
  assert.equal((await request({ port, method: "POST", path: "/v1/drop-params/validate", origin: "http://localhost:3000", nonce: api.nonce, body: JSON.stringify({ value: "x".repeat(200) }) })).status, 413);

  const allowed = await request({ port, method: "POST", path: "/v1/drop-params/validate", origin: "http://127.0.0.1:3000", nonce: api.nonce, body });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers["access-control-allow-origin"], "http://127.0.0.1:3000");
  assert.notEqual(allowed.headers["access-control-allow-origin"], "*");
  assert.equal(calls.validate, 1);

  const preflight = await request({ port, method: "OPTIONS", path: "/v1/drop-params/apply", origin: "http://localhost:3000" });
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers["access-control-allow-headers"], /X-Drop-Params-Nonce/i);
  assert.equal(DROP_PARAMS_AUTHORING_BODY_LIMIT, 65536);
});

test("duplicate service is reused for the same repo and unrelated port occupants fail clearly", async t => {
  const samePort = await unusedPort();
  const first = await startDropParamsAuthoringService({ port: samePort });
  t.after(() => first.server && new Promise(resolve => first.server.close(resolve)));
  const second = await startDropParamsAuthoringService({ port: samePort });
  assert.equal(second.reused, true);

  const unrelatedPort = await unusedPort();
  const unrelated = http.createServer((requestValue, response) => response.end("unrelated"));
  await new Promise((resolve, reject) => {
    unrelated.once("error", reject);
    unrelated.listen(unrelatedPort, DROP_PARAMS_AUTHORING_HOST, resolve);
  });
  t.after(() => new Promise(resolve => unrelated.close(resolve)));
  await assert.rejects(
    startDropParamsAuthoringService({ port: unrelatedPort }),
    error => error.code === "port_occupied" && /unrelated process/.test(error.message)
  );
});
