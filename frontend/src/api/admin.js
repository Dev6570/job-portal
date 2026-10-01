import { http } from "./client.js";

export async function listPendingCompanies() {
  const res = await http.get("/admin/companies/pending");
  return res.data;
}

export async function verifyCompany(companyId) {
  const res = await http.patch("/admin/companies/" + companyId + "/verify");
  return res.data;
}

export async function listUsers() {
  const res = await http.get("/admin/users");
  return res.data;
}

export async function deactivateUser(userId) {
  const res = await http.patch("/admin/users/" + userId + "/deactivate");
  return res.data;
}

export async function activateUser(userId) {
  const res = await http.patch("/admin/users/" + userId + "/activate");
  return res.data;
}

export async function listAuditLogs(limit = 100) {
  const res = await http.get("/admin/audit-logs", { params: { limit } });
  return res.data;
}
