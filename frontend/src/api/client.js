import axios from "axios";
import { createSession, handleUnauthorized } from "./authSession.js";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function safeSessionStorage() {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

// Main client: attaches the access token and auto-refreshes on 401.
export const http = axios.create({ baseURL });

// Separate bare client for /auth/refresh so it can never trigger the 401 handler (no loops).
const bareHttp = axios.create({ baseURL });

export const session = createSession({
  storage: safeSessionStorage(),
  refreshRequest: async (refreshToken) => {
    const res = await bareHttp.post("/auth/refresh", { refresh_token: refreshToken });
    return res.data; // { access_token, token_type }
  },
});

http.interceptors.request.use((config) => {
  const token = session.getAccessToken();
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => handleUnauthorized(error, { session, retry: (config) => http.request(config) })
);
