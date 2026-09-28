import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { session } from "../api/client.js";
import { fetchMe, login as apiLogin } from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while restoring a session on page load

  // On first load: if a refresh token survived (sessionStorage), silently sign back in.
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!session.getRefreshToken()) {
        setLoading(false);
        return;
      }
      try {
        await session.refreshAccessToken();
        const me = await fetchMe();
        if (!cancelled) setUser(me);
      } catch {
        // Rejected refresh tokens are already cleared inside the session;
        // a network error just leaves the user on the login page.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restore();
    // If a refresh is rejected later (expired/disabled account), drop to logged-out state.
    const unsubscribe = session.onExpired(() => setUser(null));
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const tokens = await apiLogin(email, password);
    session.setTokens({ access: tokens.access_token, refresh: tokens.refresh_token });
    try {
      const me = await fetchMe(); // login response has no user info, so fetch it
      setUser(me);
      return me;
    } catch (err) {
      session.clear();
      throw err;
    }
  }, []);

  // NOTE: the backend has no token revocation yet, so logout only discards the
  // tokens on this device; a copied refresh token stays valid until it expires.
  const logout = useCallback(() => {
    session.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
