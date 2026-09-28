import { listUsers } from "../../api/admin.js";
import { useLoad } from "../../hooks/useLoad.js";
import { formatDate, shortId } from "../../utils/format.js";
import { cardCls, errorBoxCls, tdCls, thCls } from "../../components/styles.js";
import Badge, { roleTone } from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";

export default function UsersTab() {
  const { data, error, loading } = useLoad(listUsers);

  if (loading && !data) return <Spinner />;
  if (error) return <p className={errorBoxCls}>{error}</p>;

  return (
    <div className={cardCls}>
      {data.length === 0 ? (
        <EmptyState title="No users yet" />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className={thCls}>Email</th>
                <th className={thCls}>Role</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Created</th>
                <th className={thCls}>ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((u) => (
                <tr key={u.id} className="transition hover:bg-slate-50/70">
                  <td className={tdCls + " font-medium text-slate-900"}>{u.email}</td>
                  <td className={tdCls}><Badge tone={roleTone(u.role)}>{u.role}</Badge></td>
                  <td className={tdCls}>
                    <Badge tone={u.is_active ? "emerald" : "slate"}>{u.is_active ? "Active" : "Inactive"}</Badge>
                  </td>
                  <td className={tdCls + " whitespace-nowrap text-slate-600"}>{formatDate(u.created_at)}</td>
                  <td className={tdCls + " font-mono text-xs text-slate-500"}>{shortId(u.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
