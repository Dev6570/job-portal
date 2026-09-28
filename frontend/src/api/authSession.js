// Session/token handling with NO React or axios imports, so it can be unit
// tested with plain Node (npm test).
//
// Storage model (decision: "option A"):
//  - access token: in memory only (lost on reload, short-lived anyway)
//  - refresh token: sessionStorage (survives reload, cleared when the tab closes)
// NOTE: sessionStorage is readable by any script on the page, so an XSS bug
// could steal the refresh token. Moving it to an httpOnly cookie later would
// only change this file plus a backend change.

const REFRESH_KEY = "jobportal.refresh_token";

// Statuses that mean "the server rejected this refresh token", as opposed to
// a network hiccup. Only these should log the user out.
const REJECTION_STATUSES = [401, 403, 422];

export function createSession({ storage, refreshRequest }) {
  let accessToken = null;
  let inFlight = null;
  let generation = 0; // bumped on login/logout to invalidate in-flight refreshes
  const expiredListeners = new Set();

  function readRefresh() {
    try {
      return storage ? storage.getItem(REFRESH_KEY) : null;
    } catch {
      return null;
    }
  }
  function writeRefresh(value) {
    try {
      if (storage) storage.setItem(REFRESH_KEY, value);
    } catch {
      /* storage unavailable (private mode etc.): session just won't survive reload */
    }
  }
  function removeRefresh() {
    try {
      if (storage) storage.removeItem(REFRESH_KEY);
    } catch {
      /* ignore */
    }
  }

  function setTokens({ access, refresh }) {
    generation += 1;
    accessToken = access;
    if (refresh) writeRefresh(refresh);
  }

  function clear() {
    generation += 1;
    accessToken = null;
    removeRefresh();
  }

  function getAccessToken() {
    return accessToken;
  }

  function getRefreshToken() {
    return readRefresh();
  }

  function onExpired(listener) {
    expiredListeners.add(listener);
    return () => expiredListeners.delete(listener);
  }

  // Single-flight: if several requests 401 at once they all share ONE refresh call.
  function refreshAccessToken() {
    if (inFlight) return inFlight;
    const refreshToken = readRefresh();
    if (!refreshToken) {
      return Promise.reject(new Error("No refresh token available"));
    }
    const startedAt = generation;
    inFlight = (async () => {
      try {
        const data = await refreshRequest(refreshToken);
        if (startedAt !== generation) {
          // user logged out / logged in as someone else while we were waiting;
          // do not resurrect the old session.
          throw new Error("Session changed during refresh");
        }
        accessToken = data.access_token;
        return accessToken;
      } catch (err) {
        const status = err && err.response && err.response.status;
        if (REJECTION_STATUSES.includes(status)) {
          clear();
          expiredListeners.forEach((listener) => listener());
        }
        throw err;
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  }

  return {
    setTokens,
    clear,
    getAccessToken,
    getRefreshToken,
    refreshAccessToken,
    onExpired,
  };
}

// Axios response-error handler: on a 401, refresh once and retry the request once.
// Requests flagged skipAuthRefresh (login/register) are never refreshed, otherwise
// a wrong password would trigger a pointless refresh attempt.
export async function handleUnauthorized(error, { session, retry }) {
  const original = error && error.config;
  const status = error && error.response && error.response.status;
  if (status !== 401 || !original || original._retried || original.skipAuthRefresh) {
    throw error;
  }
  original._retried = true;

  let token;
  try {
    token = await session.refreshAccessToken();
  } catch {
    throw error; // caller sees the original 401
  }
  original.headers = original.headers || {};
  original.headers.Authorization = "Bearer " + token;
  return retry(original);
}
