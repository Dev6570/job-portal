# Frontend (React + Vite + Tailwind)

## Run
    cd frontend
    copy .env.example .env      (PowerShell: Copy-Item .env.example .env)
    npm install
    npm run dev                 (must be http://localhost:5173 - the backend CORS allows only that origin)

## Test
    npm test                    (Node's built-in test runner; covers the auth/session logic)

## Auth design
- Access token: kept in memory only.
- Refresh token: sessionStorage (survives a page reload, cleared when the tab closes).
- On a 401 the client refreshes once and retries the request (concurrent 401s share one refresh call).
- Route guards (`ProtectedRoute`) are UX only. The backend `require_role()` is the real enforcement.
- Known limitation: the backend has no token revocation, so logout only discards tokens on this device.

## Layout (mirrors the backend folders)
- `src/api/`      one module per backend domain (auth, admin) + axios client + session logic
- `src/auth/`     role routing and register-payload builder
- `src/context/`  AuthContext (login, logout, restore session on load)
- `src/pages/`    auth/ and admin/ owned by the Auth/RBAC/Admin module
