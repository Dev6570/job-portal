import test from "node:test";
import assert from "node:assert/strict";
import { buildRegisterPayload } from "./registerPayload.js";
import { homePathForRole } from "./roles.js";

test("student payload matches the backend schema and coerces types", () => {
  const p = buildRegisterPayload({
    email: "  s@x.com ", password: "password123", role: "student",
    full_name: " Asha Rao ", branch: "CSE", cgpa: "8.4", backlogs: "", batch_year: "2027",
  });
  assert.deepEqual(p, {
    email: "s@x.com", password: "password123", role: "student",
    student: { full_name: "Asha Rao", branch: "CSE", cgpa: 8.4, backlogs: 0, batch_year: 2027 },
  });
  assert.ok(!("company" in p), "student payload must not carry a company object");
});

test("blank optional student fields become null, backlogs defaults to 0", () => {
  const p = buildRegisterPayload({ email: "a@b.co", password: "12345678", role: "student", full_name: "A", branch: "", cgpa: "", backlogs: "", batch_year: "" });
  assert.deepEqual(p.student, { full_name: "A", branch: null, cgpa: null, backlogs: 0, batch_year: null });
});

test("company payload", () => {
  const p = buildRegisterPayload({ email: "c@x.com", password: "password123", role: "company", company_name: " Acme ", website: "" });
  assert.deepEqual(p, {
    email: "c@x.com", password: "password123", role: "company",
    company: { company_name: "Acme", website: null },
  });
  assert.ok(!("student" in p));
});

test("password is sent exactly as typed (not trimmed)", () => {
  const p = buildRegisterPayload({ email: "c@x.com", password: " spaced pass ", role: "company", company_name: "A", website: "" });
  assert.equal(p.password, " spaced pass ");
});

test("admin self-registration is refused client-side too", () => {
  assert.throws(() => buildRegisterPayload({ email: "a@x.com", password: "12345678", role: "admin" }));
});

test("role -> home path", () => {
  assert.equal(homePathForRole("admin"), "/admin");
  assert.equal(homePathForRole("company"), "/company");
  assert.equal(homePathForRole("student"), "/student");
  assert.equal(homePathForRole(undefined), "/login");
});
