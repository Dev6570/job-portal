import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { register } from "../../api/auth.js";
import { extractErrorMessage } from "../../api/errors.js";
import { buildRegisterPayload } from "../../auth/registerPayload.js";
import { homePathForRole } from "../../auth/roles.js";
import { inputCls, labelCls, primaryBtnCls } from "../../components/styles.js";

const EMPTY_FORM = {
  role: "student",
  email: "",
  password: "",
  full_name: "",
  branch: "",
  cgpa: "",
  backlogs: "",
  batch_year: "",
  company_name: "",
  website: "",
};

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  function setField(name) {
    return (event) => setForm((prev) => ({ ...prev, [name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(buildRegisterPayload(form));
      navigate("/login", { replace: true, state: { registered: true, role: form.role } });
    } catch (err) {
      setError(extractErrorMessage(err, "Registration failed"));
    } finally {
      setSubmitting(false);
    }
  }

  const isStudent = form.role === "student";

  return (
    <div className="mx-auto my-10 max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-xl font-semibold">Create an account</h1>

      <div className="mb-4 flex gap-2">
        {["student", "company"].map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setForm((prev) => ({ ...prev, role }))}
            className={
              "flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize " +
              (form.role === role
                ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50")
            }
          >
            {role}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls} htmlFor="email">Email</label>
          <input id="email" type="email" required autoComplete="username" className={inputCls}
            value={form.email} onChange={setField("email")} />
        </div>
        <div>
          <label className={labelCls} htmlFor="password">Password (min 8 characters)</label>
          <input id="password" type="password" required minLength={8} autoComplete="new-password" className={inputCls}
            value={form.password} onChange={setField("password")} />
        </div>

        {isStudent ? (
          <>
            <div>
              <label className={labelCls} htmlFor="full_name">Full name</label>
              <input id="full_name" required className={inputCls} value={form.full_name} onChange={setField("full_name")} />
            </div>
            <div>
              <label className={labelCls} htmlFor="branch">Branch</label>
              <input id="branch" className={inputCls} value={form.branch} onChange={setField("branch")} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls} htmlFor="cgpa">CGPA</label>
                <input id="cgpa" type="number" step="0.01" min="0" max="10" className={inputCls}
                  value={form.cgpa} onChange={setField("cgpa")} />
              </div>
              <div>
                <label className={labelCls} htmlFor="backlogs">Backlogs</label>
                <input id="backlogs" type="number" step="1" min="0" className={inputCls}
                  value={form.backlogs} onChange={setField("backlogs")} />
              </div>
              <div>
                <label className={labelCls} htmlFor="batch_year">Batch year</label>
                <input id="batch_year" type="number" step="1" min="2000" max="2100" className={inputCls}
                  value={form.batch_year} onChange={setField("batch_year")} />
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <label className={labelCls} htmlFor="company_name">Company name</label>
              <input id="company_name" required className={inputCls} value={form.company_name} onChange={setField("company_name")} />
            </div>
            <div>
              <label className={labelCls} htmlFor="website">Website (optional)</label>
              <input id="website" className={inputCls} value={form.website} onChange={setField("website")} />
            </div>
          </>
        )}

        <button type="submit" disabled={submitting} className={primaryBtnCls + " w-full"}>
          {submitting ? "Creating account..." : "Register"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Already registered? <Link className="text-indigo-600 underline" to="/login">Log in</Link>
      </p>
    </div>
  );
}
