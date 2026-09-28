// Builds the exact JSON shape POST /auth/register expects (RegisterRequest):
// { email, password, role, student?: {...}, company?: {...} }

function blankToNull(value) {
  const s = String(value === undefined || value === null ? "" : value).trim();
  return s === "" ? null : s;
}

function numberOrNull(value) {
  const s = blankToNull(value);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function buildRegisterPayload(form) {
  const base = {
    email: String(form.email || "").trim(),
    password: form.password || "",
    role: form.role,
  };

  if (form.role === "student") {
    return {
      ...base,
      student: {
        full_name: String(form.full_name || "").trim(),
        branch: blankToNull(form.branch),
        cgpa: numberOrNull(form.cgpa),
        backlogs: numberOrNull(form.backlogs) ?? 0,
        batch_year: numberOrNull(form.batch_year),
      },
    };
  }

  if (form.role === "company") {
    return {
      ...base,
      company: {
        company_name: String(form.company_name || "").trim(),
        website: blankToNull(form.website),
      },
    };
  }

  // Admins are provisioned via scripts/seed_admin.py; the API rejects self-registration.
  throw new Error("Unsupported role for self-registration: " + form.role);
}
