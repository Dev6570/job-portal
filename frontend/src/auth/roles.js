export const ROLES = { STUDENT: "student", COMPANY: "company", ADMIN: "admin" };

// Where each role lands after login. Frontend guards are UX only;
// the backend (require_role) is what actually enforces access.
export function homePathForRole(role) {
  switch (role) {
    case ROLES.ADMIN:
      return "/admin";
    case ROLES.COMPANY:
      return "/company";
    case ROLES.STUDENT:
      return "/student";
    default:
      return "/login";
  }
}
