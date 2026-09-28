import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { extractErrorMessage } from "../../api/errors.js";
import { homePathForRole } from "../../auth/roles.js";
import { inputCls, labelCls, primaryBtnCls } from "../../components/styles.js";

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const me = await login(email.trim(), password);
      navigate(homePathForRole(me.role), { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Login failed"));
    } finally {
      setSubmitting(false);
    }
  }

  const justRegistered = location.state && location.state.registered;

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-xl font-semibold">Log in</h1>

      {justRegistered && (
        <p className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800">
          Account created. Please log in.
          {location.state.role === "company" && " An admin will review company accounts."}
        </p>
      )}
      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls} htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="username" className={inputCls}
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className={labelCls} htmlFor="password">Password</label>
          <input id="password" type="password" required autoComplete="current-password" className={inputCls}
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={submitting} className={primaryBtnCls + " w-full"}>
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        No account? <Link className="text-indigo-600 underline" to="/register">Register</Link>
      </p>
    </div>
  );
}
