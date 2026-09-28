import { listAuditLogs, listUsers } from "../../api/admin.js";
import { useLoad } from "../../hooks/useLoad.js";
import { formatDate, shortId } from "../../utils/format.js";
import { cardCls, errorBoxCls, secondaryBtnCls, tdCls, thCls } from "../../components/styles.js";
import Badge from "../../components/Badge.jsx";
import Spinner from "../../components/Spinner.jsx";
import EmptyState from "../../components/EmptyState.jsx";

function loadLogsAndUsers() {
  return Promise.all([listAuditLogs(100), listUsers()]).then(([logs, users]) => ({ logs, users }));
}

function statusTone(code) {
  if (code >= 500) return "red";
  if (code >= 400) return "amber";
  return "emerald";
}

function methodTone(method) {
  if (method === "DELETE") return "red";
  if (method === "PATCH") return "amber";
  return "indigo";
}

export default function AuditLogsTab() {
  const { data, error, loading, reload } = useLoad(loadLogsAndUsers);

  if (loading && !data) return <Spinner />;
  if (error) return <p className={errorBoxCls}>{error}</p>;

  const emailById = {};
  data.users.forEach((u) => {
    emailById[u.id] = u.email;
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Latest {data.logs.length} write actions (POST / PATCH / DELETE).</p>
        <button type="button" className={secondaryBtnCls} onClick={reload} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>
      <div className={cardCls}>
        {data.logs.length === 0 ? (
          <EmptyState title="No activity yet" hint="Write actions will show up here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className={thCls}>Time</th>
                  <th className={thCls}>User</th>
                  <th className={thCls}>Method</th>
                  <th className={thCls}>Path</th>
                  <th className={thCls}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.logs.map((log) => (
                  <tr key={log.id} className="transition hover:bg-slate-50/70">
                    <td className={tdCls + " whitespace-nowrap text-slate-600"}>{formatDate(log.created_at)}</td>
                    <td className={tdCls}>
                      {log.user_id ? emailById[log.user_id] || shortId(log.user_id) : <span className="text-slate-400">anonymous</span>}
                    </td>
                    <td className={tdCls}><Badge tone={methodTone(log.method)} className="font-mono !normal-case">{log.method}</Badge></td>
                    <td className={tdCls + " font-mono text-xs text-slate-600"}>{log.path}</td>
                    <td className={tdCls}><Badge tone={statusTone(log.status_code)}>{log.status_code}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
