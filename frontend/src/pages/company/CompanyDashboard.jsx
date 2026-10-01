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

export default function CompanyDashboard() {
  const { user } = useAuth();
  const profile = user?.company_profile;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Company dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Your account and verification status.</p>
      </div>

      <div className={cardCls + " p-6"}>
        {!profile ? (
          <EmptyState title="Profile not found" hint="Your company profile could not be loaded." />
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <Field label="Company name" value={profile.company_name} />
            <Field label="Email" value={user.email} />
            <Field label="Website" value={profile.website} />
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verification</dt>
              <dd className="mt-1">
                <Badge tone={profile.is_verified ? "emerald" : "amber"}>
                  {profile.is_verified ? "Verified" : "Pending verification"}
                </Badge>
              </dd>
            </div>
            <Field label="Member since" value={formatDate(user.created_at)} />
          </dl>
        )}
      </div>
      {!profile?.is_verified && (
        <p className="mt-4 text-sm text-slate-500">
          An admin needs to verify your company before you can post drives.
        </p>
      )}
    </div>
  );
}
