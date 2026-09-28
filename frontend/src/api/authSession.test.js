import test from "node:test";
import assert from "node:assert/strict";
import { createSession, handleUnauthorized } from "./authSession.js";

function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    _dump: () => [...m.entries()],
  };
}
const httpError = (status) => Object.assign(new Error("http " + status), { response: { status } });
const tick = () => new Promise((r) => setTimeout(r, 5));

test("access token stays in memory; only the refresh token is persisted", () => {
  const storage = fakeStorage();
  const s = createSession({ storage, refreshRequest: async () => ({}) });
  s.setTokens({ access: "ACCESS-1", refresh: "REFRESH-1" });
  assert.equal(s.getAccessToken(), "ACCESS-1");
  assert.equal(s.getRefreshToken(), "REFRESH-1");
  const stored = JSON.stringify(storage._dump());
  assert.ok(!stored.includes("ACCESS-1"), "access token must never be written to storage");
});

test("refreshAccessToken exchanges the stored refresh token for a new access token", async () => {
  const storage = fakeStorage();
  let seen;
  const s = createSession({
    storage,
    refreshRequest: async (rt) => { seen = rt; return { access_token: "ACCESS-2" }; },
  });
  s.setTokens({ access: "ACCESS-1", refresh: "REFRESH-1" });
  assert.equal(await s.refreshAccessToken(), "ACCESS-2");
  assert.equal(seen, "REFRESH-1");
  assert.equal(s.getAccessToken(), "ACCESS-2");
});

test("concurrent refreshes are single-flight (one network call)", async () => {
  let calls = 0;
  const s = createSession({
    storage: fakeStorage(),
    refreshRequest: async () => { calls += 1; await tick(); return { access_token: "NEW" }; },
  });
  s.setTokens({ access: "OLD", refresh: "R" });
  const results = await Promise.all([s.refreshAccessToken(), s.refreshAccessToken(), s.refreshAccessToken()]);
  assert.deepEqual(results, ["NEW", "NEW", "NEW"]);
  assert.equal(calls, 1);
});

test("a rejected refresh token (401) clears the session and notifies listeners", async () => {
  const storage = fakeStorage();
  const s = createSession({ storage, refreshRequest: async () => { throw httpError(401); } });
  s.setTokens({ access: "A", refresh: "R" });
  let expired = 0;
  s.onExpired(() => { expired += 1; });
  await assert.rejects(s.refreshAccessToken());
  assert.equal(s.getAccessToken(), null);
  assert.equal(s.getRefreshToken(), null);
  assert.equal(expired, 1);
});

test("a network error does NOT log the user out", async () => {
  const s = createSession({
    storage: fakeStorage(),
    refreshRequest: async () => { throw new Error("Network Error"); },
  });
  s.setTokens({ access: "A", refresh: "R" });
  let expired = 0;
  s.onExpired(() => { expired += 1; });
  await assert.rejects(s.refreshAccessToken());
  assert.equal(s.getRefreshToken(), "R");
  assert.equal(expired, 0);
});

test("no refresh token -> rejects without calling the server", async () => {
  let calls = 0;
  const s = createSession({ storage: fakeStorage(), refreshRequest: async () => { calls += 1; return {}; } });
  await assert.rejects(s.refreshAccessToken());
  assert.equal(calls, 0);
});

test("logging out while a refresh is in flight does not resurrect the session", async () => {
  const s = createSession({
    storage: fakeStorage(),
    refreshRequest: async () => { await tick(); return { access_token: "LATE" }; },
  });
  s.setTokens({ access: "A", refresh: "R" });
  const pending = s.refreshAccessToken();
  s.clear(); // user clicks logout
  await assert.rejects(pending);
  assert.equal(s.getAccessToken(), null);
});

test("works when storage is unavailable (no crash, session just is not persisted)", () => {
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); }, removeItem() { throw new Error("blocked"); } };
  const s = createSession({ storage: broken, refreshRequest: async () => ({}) });
  s.setTokens({ access: "A", refresh: "R" });
  assert.equal(s.getAccessToken(), "A");
  assert.equal(s.getRefreshToken(), null);
  s.clear();
});

// ---- handleUnauthorized ----

function makeError(status, extraConfig = {}) {
  return Object.assign(new Error("http " + status), { response: { status }, config: { headers: {}, ...extraConfig } });
}

test("401 -> refresh once, retry with the new bearer token", async () => {
  const s = createSession({ storage: fakeStorage(), refreshRequest: async () => ({ access_token: "FRESH" }) });
  s.setTokens({ access: "OLD", refresh: "R" });
  let retried;
  const result = await handleUnauthorized(makeError(401), {
    session: s,
    retry: async (cfg) => { retried = cfg; return "OK"; },
  });
  assert.equal(result, "OK");
  assert.equal(retried.headers.Authorization, "Bearer FRESH");
});

test("non-401 errors pass straight through", async () => {
  const s = createSession({ storage: fakeStorage(), refreshRequest: async () => { throw new Error("must not be called"); } });
  const err = makeError(403);
  await assert.rejects(handleUnauthorized(err, { session: s, retry: async () => "x" }), (e) => e === err);
});

test("login/register style requests (skipAuthRefresh) are never refreshed", async () => {
  let refreshes = 0;
  const s = createSession({ storage: fakeStorage(), refreshRequest: async () => { refreshes += 1; return { access_token: "X" }; } });
  s.setTokens({ access: "A", refresh: "R" });
  const err = makeError(401, { skipAuthRefresh: true });
  await assert.rejects(handleUnauthorized(err, { session: s, retry: async () => "x" }), (e) => e === err);
  assert.equal(refreshes, 0);
});

test("a request that 401s again after retry is not retried a second time", async () => {
  let refreshes = 0;
  const s = createSession({ storage: fakeStorage(), refreshRequest: async () => { refreshes += 1; return { access_token: "FRESH" }; } });
  s.setTokens({ access: "A", refresh: "R" });
  const err = makeError(401);
  // simulate the retry failing with 401 again on the same config object
  const retry = async (cfg) => { throw Object.assign(new Error("again"), { response: { status: 401 }, config: cfg }); };
  await assert.rejects(handleUnauthorized(err, { session: s, retry }).catch(async (second) => {
    return handleUnauthorized(second, { session: s, retry });
  }));
  assert.equal(refreshes, 1);
});

test("if the refresh itself fails, the caller gets the ORIGINAL 401", async () => {
  const s = createSession({ storage: fakeStorage(), refreshRequest: async () => { throw httpError(401); } });
  s.setTokens({ access: "A", refresh: "R" });
  const err = makeError(401);
  await assert.rejects(handleUnauthorized(err, { session: s, retry: async () => "x" }), (e) => e === err);
});
