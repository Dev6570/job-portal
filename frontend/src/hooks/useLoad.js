import { useCallback, useEffect, useState } from "react";
import { extractErrorMessage } from "../api/errors.js";

// Runs `loader()` once on mount and again whenever reload() is called.
export function useLoad(loader) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    loader().then(
      (data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      },
      (err) => {
        if (!cancelled) {
          setState({ data: null, error: extractErrorMessage(err, "Failed to load"), loading: false });
        }
      }
    );
    return () => {
      cancelled = true;
    };
    // Intentionally keyed on nonce only: load on mount and on reload().
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, reload };
}
