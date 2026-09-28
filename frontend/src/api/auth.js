import { http } from "./client.js";

// skipAuthRefresh: a 401 here means "wrong credentials", not "expired token".

export async function register(payload) {
  const res = await http.post("/auth/register", payload, { skipAuthRefresh: true });
  return res.data; // UserOut (no tokens: the user logs in next)
}

export async function login(email, password) {
  const res = await http.post("/auth/login", { email, password }, { skipAuthRefresh: true });
  return res.data; // { access_token, refresh_token, token_type }
}

export async function fetchMe() {
  const res = await http.get("/auth/me");
  return res.data; // UserOut
}
