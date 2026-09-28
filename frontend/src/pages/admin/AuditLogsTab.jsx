import { listAuditLogs, listUsers } from "../../api/admin.js";
import { useLoad } from "../../hooks/useLoad.js";
import { formatDate, shortId } from "../../utils/format.js";
import { secondaryBtnCls } from "../../components/styles.js";
import Spinner from "../../components/Spinner.jsx";

function loadLogsAndUsers() {
  return Promise.all([listAuditLogs(100), listUsers()]).then(([logs, users]) => ({ logs, users }));
}

function statusClass(code) {
  if (code >= 500) return "bg-red-100 text-red-800";
  if (code >= 400) return "bg-amber-100 text-amber-800";
  return "bg-green-100 text-green-800";
}

export default function AuditLogsTab() {
  const { data, error, loading, reload } = useLoad(loadLogsAndUsers);

  if (loading && !data) return <Spinner />;
  if (error) return <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>;

  const emailById = {};
  data.users.forEach((u) => {
    emailById[u.id] = u.email;
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">Latest {data.logs.length} write actions (POST / PATCH / DELETE).</p>
        <button type="button" className={secondaryBtnCls} onClick={reload}>Refresh</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Method</th>
              <th className="px-4 py-2">Path</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.logs.map((log) => (
              <tr key={log.id} className="border-t border-slate-100">
                <td className="whitespace-nowrap px-4 py-2">{formatDate(log.created_at)}</td>
                <td className="px-4 py-2">
                  {log.user_id ? emailById[log.user_id] || shortId(log.user_id) : <span className="text-slate-400">anonymous</span>}
                </td>
                <td className="px-4 py-2 font-mono text-xs">{log.method}</td>
                <td className="px-4 py-2 font-mono text-xs">{log.path}</td>
                <td className="px-4 py-2">
                  <span className={"rounded px-1.5 py-0.5 text-xs font-medium " + statusClass(log.status_code)}>
                    {log.status_code}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
