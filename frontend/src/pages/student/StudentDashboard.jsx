import { useAuth } from "../../context/AuthContext.jsx";
import { formatDate } from "../../utils/format.js";
import { cardCls } from "../../components/styles.js";
import Badge from "../../components/Badge.jsx";
import EmptyState from "../../components/EmptyState.jsx";

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900">{value === null || value === undefined || value === "" ? "-" : value}</dd>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const profile = user?.student_profile;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Student dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Your account and profile details.</p>
      </div>

      <div className={cardCls + " p-6"}>
        {!profile ? (
          <EmptyState title="Profile not found" hint="Your student profile could not be loaded." />
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <Field label="Full name" value={profile.full_name} />
            <Field label="Email" value={user.email} />
            <Field label="Branch" value={profile.branch} />
            <Field label="CGPA" value={profile.cgpa} />
            <Field label="Backlogs" value={profile.backlogs} />
            <Field label="Batch year" value={profile.batch_year} />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Account status</dt>
              <dd className="mt-1">
                <Badge tone={user.is_active ? "emerald" : "slate"}>{user.is_active ? "Active" : "Inactive"}</Badge>
              </dd>
            </div>
            <Field label="Member since" value={formatDate(user.created_at)} />
          </dl>
        )}
      </div>
    </div>
  );
}
